// 開発サーバーだけの中継(音声チェック画面 ?voices 用)。公開版のビルドには入らない(apply: 'serve')。
// ブラウザは エンジンや ファイルに 直接さわれないので、ここが かわりに 合成・保存・mp3 の作りなおしを する。
//   GET  /__voice/state     { engine, overrides, report, suggestions }
//   POST /__voice/query     { spec }        → { kana }
//   POST /__voice/synth     { spec }        → audio/wav
//   POST /__voice/override  { id, spec|null } → 上書きを保存
//   POST /__voice/rebuild   { id }          → そのクリップの mp3 を作りなおす
// 守り: localhost からの要求だけ。Host/Origin を 確かめる。POST は JSON だけ。ID は 一覧にある物だけ、
//       spec は 決まった文字だけ(validateSpec)。ffmpeg は 引数の配列で呼ぶ(シェルを通さない)。
import { existsSync, readFileSync } from 'node:fs'
import { engineVersion, loadClips, loadOverrides, loadStyleId, paths, queryFor, rebuildClip, saveOverrides, synthesizeQuery } from './voice-engine.mjs'
import { validateSpec } from './voice-logic.mjs'

const PREFIX = '/__voice/'
const MAX_BODY = 16 * 1024
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function assertLocal(req) {
  if (!LOOPBACK.has(req.socket.remoteAddress ?? '')) throw new HttpError(403, 'localhost だけ')
  if (!LOCAL_HOST.test(req.headers.host ?? '')) throw new HttpError(403, 'Host がちがいます')
  const origin = req.headers.origin
  if (origin !== undefined && !LOCAL_HOST.test(origin.replace(/^https?:\/\//, ''))) throw new HttpError(403, 'Origin がちがいます')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) return reject(new HttpError(415, 'JSON だけ'))
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new HttpError(413, '大きすぎます'))
        req.destroy()
      } else chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new HttpError(400, 'JSON がおかしい'))
      }
    })
  })
}

function readSpec(body) {
  const spec = body?.spec
  const result = validateSpec(spec)
  if (!result.ok) throw new HttpError(400, result.reason)
  return { kind: spec.kind, value: spec.value }
}

function readClip(body) {
  const clip = typeof body?.id === 'string' ? loadClips().find((c) => c.id === body.id) : undefined
  if (!clip) throw new HttpError(400, '知らないクリップ ID')
  return clip
}

const readOptional = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null)

async function requireEngine() {
  const version = await engineVersion()
  if (!version) throw new HttpError(503, 'AivisSpeech を起動してください')
}

const routes = {
  'GET state': async () => ({
    engine: Boolean(await engineVersion()),
    overrides: loadOverrides(),
    report: readOptional(paths.report),
    suggestions: readOptional(paths.suggestions),
  }),
  'POST query': async (body) => {
    const spec = readSpec(body)
    await requireEngine()
    return { kana: (await queryFor(spec, loadStyleId())).kana }
  },
  'POST override': async (body) => {
    const clip = readClip(body)
    const current = loadOverrides()
    const rest = Object.fromEntries(Object.entries(current.clips).filter(([id]) => id !== clip.id))
    saveOverrides({ ...current, clips: body.spec === null ? rest : { ...rest, [clip.id]: readSpec(body) } })
    return { ok: true }
  },
  'POST rebuild': async (body) => {
    const clip = readClip(body)
    await requireEngine()
    const { kana } = await rebuildClip(clip, loadOverrides(), loadStyleId())
    return { ok: true, kana }
  },
}

async function handle(req, res) {
  assertLocal(req)
  const name = (req.url ?? '').slice(PREFIX.length).split('?')[0]
  if (req.method === 'POST' && name === 'synth') {
    const spec = readSpec(await readBody(req))
    await requireEngine()
    const styleId = loadStyleId()
    const wav = await synthesizeQuery(await queryFor(spec, styleId), styleId)
    res.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' })
    res.end(wav)
    return
  }
  const route = routes[`${req.method} ${name}`]
  if (!route) throw new HttpError(404, '知らない呼び出し')
  const result = await route(req.method === 'POST' ? await readBody(req) : undefined)
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(result))
}

export function voiceDevPlugin() {
  return {
    name: 'voice-dev-relay',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(PREFIX)) return next()
        handle(req, res).catch((error) => {
          const status = error instanceof HttpError ? error.status : 500
          res.writeHead(status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }))
        })
      })
    },
  }
}
