import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { Plugin } from 'vite'

/** public の中で、オフライン保存の一覧に入れないもの(サービスワーカー自身) */
const SKIP = new Set(['sw.js'])
const VOICE_DIR = 'voice/'

export type PrecacheList = {
  /** アプリ本体の版。中身が変わると変わる */
  readonly version: string
  /** 入れたときに まとめて保存するファイル */
  readonly shell: readonly string[]
  /** あとから少しずつ保存する音声 */
  readonly voice: readonly string[]
  readonly voiceVersion: string
}

const hash = (text: string): string => createHash('sha1').update(text).digest('hex').slice(0, 12)

/** フォルダの中のファイルを、そのフォルダからの相対パス(/ 区切り)で返す。 */
export function listFiles(dir: string): { path: string; size: number }[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((name) => join(dir, name))
    .filter((full) => statSync(full).isFile())
    .map((full) => ({ path: relative(dir, full).split(sep).join('/'), size: statSync(full).size }))
}

/** 書き出したファイルと public のファイルから、保存の一覧を作る。 */
export function buildPrecacheList(bundleFiles: readonly string[], publicFiles: readonly { path: string; size: number }[]): PrecacheList {
  const assets = publicFiles.filter((f) => !SKIP.has(f.path))
  const voiceFiles = assets.filter((f) => f.path.startsWith(VOICE_DIR))
  const shellFiles = [...new Set([...bundleFiles, 'index.html', ...assets.filter((f) => !f.path.startsWith(VOICE_DIR)).map((f) => f.path)])].sort()
  return {
    version: hash(shellFiles.join('\n') + assets.map((f) => `${f.path}:${f.size}`).join('\n')),
    shell: ['./', ...shellFiles.map((f) => `./${f}`)],
    voice: voiceFiles.map((f) => `./${f.path}`),
    voiceVersion: hash(voiceFiles.map((f) => `${f.path}:${f.size}`).join('\n')),
  }
}

/**
 * サービスワーカーの さいごに、アプリ本体の版を書きこむ。
 * ブラウザは sw.js の中身が 1文字でも変わると 入れなおす(= 新しい版の保存が始まる)。
 * 書きこまないと 中身が ずっと同じで、すでに入っている端末に 新しいファイルが とどかない。
 */
export const stampServiceWorker = (source: string, version: string): string => `${source.trimEnd()}\n\n// version: ${version}\n`

/** npm run build のときに、dist/precache.json と、版を書きこんだ dist/sw.js を書き出す Vite のプラグイン。 */
export function precachePlugin(publicDir: string): Plugin {
  return {
    name: 'kanji-quest-precache',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const list = buildPrecacheList(
        Object.keys(bundle).filter((name) => !name.endsWith('.map')),
        listFiles(publicDir),
      )
      this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(list) })
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: stampServiceWorker(readFileSync(join(publicDir, 'sw.js'), 'utf8'), list.version) })
    },
  }
}
