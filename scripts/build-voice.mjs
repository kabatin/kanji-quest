// src/data/narration.json の文章を、AivisSpeech(VOICEVOX 互換 API)で音声にして public/voice に書き出す。
// 使い方: AivisSpeech を起動してから
//   node scripts/build-voice.mjs [スタイルID] [--force] [--only <ID…>] [--changed]
//   (既定)   まだない音声だけ作る      --force   全部作りなおす
//   --only   指定した ID だけ作りなおす(例: --only word-529b explain-5165)
//   --changed scripts/voice-overrides.json を変えた(または 消した)クリップだけ作りなおす
// 読みまちがい・アクセントは scripts/voice-overrides.json で直す(README「音声」、?voices の画面)。
// ffmpeg が必要(wav を mp3 にする)。
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { loadBuilt, loadClips, loadOverrides, loadStyleId, mp3PathFor, paths, rebuildClip, specHash } from './voice-engine.mjs'
import { hasOverride, resolveSpec } from './voice-logic.mjs'

function parseArgs(argv) {
  const onlyAt = argv.indexOf('--only')
  const flags = new Set(argv.filter((a) => a.startsWith('--')))
  const only = onlyAt < 0 ? [] : argv.slice(onlyAt + 1).filter((a) => !a.startsWith('--'))
  const styleId = argv.find((a, i) => /^\d+$/.test(a) && (onlyAt < 0 || i < onlyAt))
  return { force: flags.has('--force'), changed: flags.has('--changed'), only, styleId: styleId === undefined ? undefined : Number(styleId) }
}

/** 作る クリップを えらぶ */
function selectClips(clips, overrides, built, options, styleId) {
  if (options.only.length > 0) {
    const unknown = options.only.filter((id) => !clips.some((c) => c.id === id))
    if (unknown.length > 0) throw new Error(`知らないクリップ ID: ${unknown.join(', ')}`)
    return clips.filter((c) => options.only.includes(c.id))
  }
  if (options.force) return clips
  if (options.changed) {
    return clips.filter((c) => {
      const now = hasOverride(c, overrides) ? specHash(resolveSpec(c, overrides), styleId) : undefined
      return now !== built[c.id]
    })
  }
  return clips.filter((c) => !existsSync(mp3PathFor(c.id)))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const clips = loadClips()
  const overrides = loadOverrides(clips)
  const styleId = options.styleId ?? loadStyleId()
  const targets = selectClips(clips, overrides, loadBuilt(), options, styleId)
  mkdirSync(paths.outDir, { recursive: true })

  for (const clip of targets) {
    const { kana } = await rebuildClip(clip, overrides, styleId)
    process.stdout.write(`${clip.id}\t${kana}\n`)
  }

  const manifest = { styleId, clips: clips.map((c) => c.id).sort() }
  writeFileSync(paths.manifest, `${JSON.stringify(manifest, null, 1)}\n`)
  process.stdout.write(`${targets.length} 本を作りました(全 ${clips.length} クリップ): ${paths.outDir}\n`)
}

main().catch((error) => {
  process.stderr.write(`音声の生成に失敗しました: ${error.message}\n`)
  process.exitCode = 1
})
