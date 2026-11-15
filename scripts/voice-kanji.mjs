// 漢字まじりの文を つくって、エンジンの読みが もとの ひらがなと 同じ物だけ voice-overrides.json に入れる。
//   node scripts/voice-kanji.mjs            検査して、合う物を上書きに入れる(すでにある上書きは かえない)
//   node scripts/voice-kanji.mjs --dry      検査だけ(書かない)
//   node scripts/voice-kanji.mjs --kana out.json   各クリップの読み(アクセントつき)を out.json に書く
// 材料: scripts/voice-kanji-words.json(字 → 語の表記)、voice-kanji-explain.json(字 → 説明の漢字まじりの文。
// 文末の「@」と、最後の語は、語の表記に置きかわる)、voice-kanji-fix.json(クリップID → 文。いちばん強い)。
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { engineVersion, kanaOf, loadClips, loadOverrides, loadStyleId, queryFor, root, saveOverrides } from './voice-engine.mjs'
import { compareReading } from './voice-logic.mjs'

const readJson = (name) => {
  const path = join(root, 'scripts', name)
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}
}

const skeleton = (text) => [...text].filter((c) => /[、。！？\s　]/.test(c)).join('')

/** 説明の文: 文末の @ を語に。@ が無く、最後の文が ひらがなの語そのままなら、語に置きかえる。 */
function explainText(clip, body, word, reading) {
  if (body.endsWith('@')) return `${body.slice(0, -1)}${word}。`
  const cut = body.slice(0, -1).lastIndexOf('。') + 1
  return body.slice(cut) === `${reading}。` ? `${body.slice(0, cut)}${word}。` : body
}

function candidateFor(clip, ctx) {
  const fix = ctx.fix[clip.id]
  if (fix) return fix
  const word = ctx.words[clip.char]
  if (!word) return undefined
  const reading = ctx.narration[clip.char].word
  if (clip.kind === 'word') return `${word}。`
  if (clip.kind === 'goal') return clip.text.replace(/^[^を]+を/, `${word}を`)
  const body = ctx.explain[clip.char]
  return body ? explainText(clip, body, word, reading) : undefined
}

async function main() {
  const dry = process.argv.includes('--dry')
  const kanaOut = process.argv.includes('--kana') ? process.argv[process.argv.indexOf('--kana') + 1] : undefined
  if (!(await engineVersion())) throw new Error('AivisSpeech に つながりません')
  const styleId = loadStyleId()
  const clips = loadClips()
  const overrides = loadOverrides(clips)
  const ctx = {
    words: readJson('voice-kanji-words.json'),
    explain: readJson('voice-kanji-explain.json'),
    fix: readJson('voice-kanji-fix.json'),
    narration: readJson('../src/data/narration.json'),
  }
  const accepted = {}
  const kanas = {}
  const failed = []
  let same = 0
  for (const clip of clips) {
    if (overrides.clips[clip.id]) continue
    const value = candidateFor(clip, ctx)
    if (!value) { failed.push([clip.id, clip.text, '(候補なし)', '', '']); continue }
    if (value === clip.text) { same += 1; continue }
    if (skeleton(value) !== skeleton(clip.text)) { failed.push([clip.id, clip.text, value, '', '区切りがちがう']); continue }
    const kana = kanaOf(await queryFor({ kind: 'text', value }, styleId))
    kanas[clip.id] = { text: value, kana }
    const result = compareReading(clip.text, kana)
    if (result.ok) accepted[clip.id] = { kind: 'text', value }
    else failed.push([clip.id, clip.text, value, kana, `${result.expected} / ${result.actual}`])
  }
  if (kanaOut) writeFileSync(kanaOut, JSON.stringify(kanas, null, 1))
  if (!dry) saveOverrides({ ...overrides, clips: { ...overrides.clips, ...accepted } })
  const count = (kind) => Object.keys(accepted).filter((id) => id.startsWith(`${kind}-`)).length
  process.stdout.write(`入れた: word ${count('word')} / explain ${count('explain')} / goal ${count('goal')}、ひらがなのまま(同じ文) ${same}、合わない ${failed.length}\n`)
  for (const row of failed) process.stdout.write(`${row.join('\t')}\n`)
}

main().catch((error) => {
  process.stderr.write(`失敗しました: ${error.message}\n`)
  process.exitCode = 1
})
