// src/data/narration.json の文章を、AivisSpeech(VOICEVOX 互換 API)で音声にして public/voice に書き出す。
// 使い方: AivisSpeech を起動してから
//   node scripts/build-voice.mjs [スタイルID] [--force]
// ffmpeg が必要(wav を mp3 にする)。すでにあるファイルは作りなおさない(--force で全部作りなおす)。
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ENGINE = process.env.VOICE_ENGINE_URL ?? 'http://127.0.0.1:10101'
const DEFAULT_STYLE_ID = 888753760 // まお(ノーマル)
const SPEED = 0.92
const PAUSE_SCALE = 1.15

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'voice')
const manifestPath = join(root, 'src', 'assets', 'voice-manifest.json')

const codepoint = (char) => char.codePointAt(0).toString(16)

/** narration.json から「クリップID → 読ませる文」の一覧を作る。ID の決め方は src/lib/voice.ts と同じ。 */
function listClips(narration) {
  return Object.entries(narration).flatMap(([char, entry]) => [
    { id: `word-${codepoint(char)}`, text: `${entry.word}。` },
    { id: `explain-${codepoint(char)}`, text: entry.speech },
    ...entry.goals.map((text, i) => ({ id: `goal-${codepoint(char)}-${i}`, text })),
  ])
}

async function post(path, body) {
  const res = await fetch(`${ENGINE}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`音声エンジンがエラーを返しました: ${path} ${res.status} ${await res.text()}`)
  return res
}

async function synthesize(text, styleId) {
  const query = await (await post(`/audio_query?speaker=${styleId}&text=${encodeURIComponent(text)}`)).json()
  const tuned = { ...query, speedScale: SPEED, pauseLengthScale: PAUSE_SCALE }
  const wav = Buffer.from(await (await post(`/synthesis?speaker=${styleId}`, tuned)).arrayBuffer())
  return { wav, kana: query.kana }
}

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const styleId = Number(args.find((a) => /^\d+$/.test(a)) ?? DEFAULT_STYLE_ID)
  const narration = JSON.parse(readFileSync(join(root, 'src', 'data', 'narration.json'), 'utf8'))
  const clips = listClips(narration)
  mkdirSync(outDir, { recursive: true })

  for (const clip of clips) {
    const mp3 = join(outDir, `${clip.id}.mp3`)
    if (existsSync(mp3) && !force) continue
    const { wav, kana } = await synthesize(clip.text, styleId)
    const tmp = join(outDir, `${clip.id}.wav`)
    writeFileSync(tmp, wav)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-ac', '1', '-b:a', '64k', mp3])
    rmSync(tmp)
    process.stdout.write(`${clip.id}\t${kana}\n`)
  }

  const manifest = { styleId, clips: clips.map((c) => c.id).sort() }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`)
  process.stdout.write(`${clips.length} クリップ: ${outDir}\n`)
}

main().catch((error) => {
  process.stderr.write(`音声の生成に失敗しました: ${error.message}\n`)
  process.exitCode = 1
})
