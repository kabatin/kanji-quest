import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildPrecacheList, listFiles, precachePlugin } from './precache-plugin'

let dir = ''

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = ''
})

describe('オフライン保存の一覧(precache.json)', () => {
  const publicFiles = [
    { path: 'sw.js', size: 10 },
    { path: 'manifest.webmanifest', size: 20 },
    { path: 'icons/icon-192.png', size: 30 },
    { path: 'voice/word-6728.mp3', size: 40 },
    { path: 'voice/word-5c71.mp3', size: 50 },
  ]

  it('アプリ本体と音声を分け、サービスワーカー自身は入れない', () => {
    const list = buildPrecacheList(['assets/index-abc.js', 'index.html'], publicFiles)
    expect(list.shell).toEqual(['./', './assets/index-abc.js', './icons/icon-192.png', './index.html', './manifest.webmanifest'])
    expect(list.voice).toEqual(['./voice/word-6728.mp3', './voice/word-5c71.mp3'])
  })

  it('中身が変わると版も変わる。音声が同じなら、音声の版は変わらない', () => {
    const a = buildPrecacheList(['assets/index-abc.js'], publicFiles)
    const b = buildPrecacheList(['assets/index-xyz.js'], publicFiles)
    expect(a.version).not.toBe(b.version)
    expect(a.voiceVersion).toBe(b.voiceVersion)
    const louder = buildPrecacheList(['assets/index-abc.js'], publicFiles.map((f) => (f.path.startsWith('voice/') ? { ...f, size: f.size + 1 } : f)))
    expect(louder.voiceVersion).not.toBe(a.voiceVersion)
  })

  it('フォルダの中のファイルを / 区切りで読む', () => {
    dir = mkdtempSync(join(tmpdir(), 'kq-'))
    mkdirSync(join(dir, 'voice'))
    writeFileSync(join(dir, 'sw.js'), 'x')
    writeFileSync(join(dir, 'voice', 'a.mp3'), 'xyz')
    expect(listFiles(dir).sort((x, y) => x.path.localeCompare(y.path))).toEqual([
      { path: 'sw.js', size: 1 },
      { path: 'voice/a.mp3', size: 3 },
    ])
  })

  it('ビルドのときだけ、precache.json と 版を書きこんだ sw.js を書き出す', () => {
    dir = mkdtempSync(join(tmpdir(), 'kq-'))
    writeFileSync(join(dir, 'manifest.webmanifest'), '{}')
    writeFileSync(join(dir, 'sw.js'), '// sw')
    const plugin = precachePlugin(dir)
    expect(plugin.apply).toBe('build')
    const emitted: { fileName: string; source: string }[] = []
    const hook = plugin.generateBundle as unknown as (this: unknown, options: unknown, bundle: Record<string, unknown>) => void
    hook.call({ emitFile: (file: { fileName: string; source: string }) => emitted.push(file) }, {}, { 'assets/index.js': {}, 'assets/index.js.map': {} })
    expect(emitted.map((file) => file.fileName)).toEqual(['precache.json', 'sw.js'])
    // サービスワーカーには 版が入る(公開するたびに 中身が変わり、端末が 入れなおす)
    expect(emitted[1].source).toContain(`// version: ${JSON.parse(emitted[0].source).version}`)
    const list = JSON.parse(emitted[0].source)
    expect(list.shell).toEqual(['./', './assets/index.js', './index.html', './manifest.webmanifest'])
  })
})
