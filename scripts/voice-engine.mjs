// AivisSpeech(VOICEVOX 互換 API)と ffmpeg を呼ぶ部分。build-voice / voice-check / voice-accent / 開発サーバーの中継が使う。
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildKana, hasOverride, listClips, readingOf, resolveSpec, validateOverrides } from './voice-logic.mjs'

export const ENGINE = process.env.VOICE_ENGINE_URL ?? 'http://127.0.0.1:10101'
export const DEFAULT_STYLE_ID = 888753760 // まお(ノーマル)
const SPEED = 0.92
const PAUSE_SCALE = 1.15

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')
export const paths = {
  outDir: join(root, 'public', 'voice'),
  manifest: join(root, 'src', 'assets', 'voice-manifest.json'),
  narration: join(root, 'src', 'data', 'narration.json'),
  overrides: join(root, 'scripts', 'voice-overrides.json'),
  built: join(root, 'scripts', 'voice-built.json'),
  report: join(root, 'scripts', 'voice-report.json'),
  suggestions: join(root, 'scripts', 'voice-suggestions.json'),
}

const readJson = (path, fallback) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback)

/** ファイルを 途中まで書かれた形で のこさない(一時ファイルに書いて、名前を付けかえる) */
export function writeJsonAtomic(path, data) {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, `${JSON.stringify(data, null, 1)}\n`)
  renameSync(tmp, path)
}

export const loadClips = () => listClips(readJson(paths.narration, {}))
export const loadBuilt = () => readJson(paths.built, {})
export const loadStyleId = () => readJson(paths.manifest, {}).styleId ?? DEFAULT_STYLE_ID

/** voice-overrides.json を 読んで、中身を調べる(わるければ 例外) */
export function loadOverrides(clips = loadClips()) {
  const overrides = readJson(paths.overrides, { clips: {}, words: {} })
  const result = validateOverrides(overrides, clips.map((c) => c.id))
  if (!result.ok) throw new Error(`voice-overrides.json がおかしい: ${result.reason}`)
  return { clips: overrides.clips ?? {}, words: overrides.words ?? {} }
}

export function saveOverrides(overrides) {
  mkdirSync(dirname(paths.overrides), { recursive: true })
  writeJsonAtomic(paths.overrides, overrides)
}

async function post(path, body) {
  const res = await fetch(`${ENGINE}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`音声エンジンがエラーを返しました: ${path.split('?')[0]} ${res.status} ${await res.text()}`)
  return res
}

export async function engineVersion() {
  try {
    const res = await fetch(`${ENGINE}/version`, { signal: AbortSignal.timeout(1500) })
    return res.ok ? await res.json() : undefined
  } catch {
    return undefined
  }
}

/**
 * エンジンが 実際に どう読むか(AquesTalk 風記法)。
 * AivisSpeech は audio_query の kana 欄に「読み上げる もとの文」を入れる(VOICEVOX と ちがう)ので、
 * 読みと アクセントは accent_phrases から 組み立てる。
 */
export function kanaOf(query) {
  const phrases = (query.accent_phrases ?? []).map((phrase, index, all) => ({
    moras: phrase.moras.map((m) => m.text),
    accent: phrase.accent,
    pause: index > 0 && all[index - 1].pause_mora !== null && all[index - 1].pause_mora !== undefined,
    question: phrase.is_interrogative === true,
  }))
  return buildKana(phrases)
}

/** 指定({ kind: 'text'|'kana', value })から audio_query を作る。kana は /accent_phrases(is_kana=true)で作って 入れかえる。 */
export async function queryFor(spec, styleId) {
  if (spec.kind === 'text') return (await post(`/audio_query?speaker=${styleId}&text=${encodeURIComponent(spec.value)}`)).json()
  const phrases = await (await post(`/accent_phrases?speaker=${styleId}&is_kana=true&text=${encodeURIComponent(spec.value)}`)).json()
  const base = await (await post(`/audio_query?speaker=${styleId}&text=${encodeURIComponent('あ')}`)).json()
  // kana 欄は AivisSpeech では「読み上げる文」。記号を のぞいた 読みを 入れる
  return { ...base, accent_phrases: phrases, kana: readingOf(spec.value) }
}

export async function synthesizeQuery(query, styleId) {
  const tuned = { ...query, speedScale: SPEED, pauseLengthScale: PAUSE_SCALE }
  return Buffer.from(await (await post(`/synthesis?speaker=${styleId}`, tuned)).arrayBuffer())
}

export async function synthesize(spec, styleId) {
  const query = await queryFor(spec, styleId)
  return { wav: await synthesizeQuery(query, styleId), kana: kanaOf(query) }
}

/** wav を mp3 にして書く。ffmpeg は 引数の配列で呼ぶ(シェルを通さない)。 */
export function writeMp3(wav, mp3Path) {
  mkdirSync(dirname(mp3Path), { recursive: true })
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-ac', '1', '-b:a', '64k', mp3Path], { input: wav })
}

export const mp3PathFor = (id) => join(paths.outDir, `${id}.mp3`)

/** 合成の指定の きろく用の短い印。これが かわったクリップが「作りなおす物」。 */
export const specHash = (spec, styleId) => createHash('sha1').update(JSON.stringify([spec.kind, spec.value, styleId, SPEED, PAUSE_SCALE])).digest('hex').slice(0, 12)

/** 1本を 今の上書きどおりに 作りなおして mp3 に書き、voice-built.json を更新する。 */
export async function rebuildClip(clip, overrides, styleId) {
  const spec = resolveSpec(clip, overrides)
  const { wav, kana } = await synthesize(spec, styleId)
  writeMp3(wav, mp3PathFor(clip.id))
  const rest = Object.fromEntries(Object.entries(loadBuilt()).filter(([id]) => id !== clip.id))
  writeJsonAtomic(paths.built, hasOverride(clip, overrides) ? { ...rest, [clip.id]: specHash(spec, styleId) } : rest)
  return { kana, spec }
}
