/*
 * 場面を作るための 材料を出す: その漢字の 画の線・部位・なりたちの文。
 *
 *   node scripts/scene-info.mjs 山
 *
 * 座標は 漢字と同じ 109 x 109(左上が 0,0。右へ x、下へ y)。
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const strokes = read('src/assets/kanjivg/strokes.json')
const kanjiList = read('src/data/generated/kanji.json')
const parts = read('src/data/generated/parts.json')
const narration = read('src/data/narration.json')

const chars = process.argv.slice(2)
if (chars.length === 0) {
  console.error('つかいかた: node scripts/scene-info.mjs <漢字> [<漢字> ...]')
  process.exit(1)
}

const list = Array.isArray(kanjiList) ? kanjiList : Object.values(kanjiList)
const partList = Array.isArray(parts) ? parts : Object.values(parts)
const round = (n) => Math.round(n * 10) / 10

for (const char of chars) {
  const kanji = list.find((k) => k.char === char)
  const own = strokes[char]
  if (!kanji || !own) {
    console.error(`× ${char}: 収録していない漢字です`)
    process.exitCode = 1
    continue
  }
  const story = narration[char]
  console.info(`■ ${char}(${kanji.yomi})  ${kanji.grade}年生  ${own.length}画  ファイル名: k${char.codePointAt(0).toString(16)}.tsx`)
  console.info(`  なりたちの文(画面): ${story?.caption ?? '(なし)'}`)
  console.info(`  なりたちの文(音声): ${story?.speech ?? '(なし)'}`)
  console.info(`  種類: ${story?.kind === 'oboekata' ? 'おぼえかた(形からの覚え方)' : 'なりたち(字源にもとづく)'}`)
  if (kanji.steps.length === 0) console.info('  部位: 分けない字(1つの絵として描く)')
  for (const step of kanji.steps) {
    const name = (id) => `${id}(${partList.find((p) => p.id === id)?.label ?? '?'})`
    console.info(`  部位: ${name(step.fixed)} = ${step.fixedGlyph.strokes.join(',')}画目  +  ${name(step.answer)} = ${step.answerGlyph.strokes.join(',')}画目${step.makes ? `  → ${step.makes}` : ''}`)
  }
  console.info('  画(書き順): はじまり → おわり / 通り道の点 / 線の式')
  own.forEach((stroke, i) => {
    const [first] = stroke.pts
    const last = stroke.pts[stroke.pts.length - 1]
    console.info(`   ${String(i + 1).padStart(2)}画目  (${round(first[0])}, ${round(first[1])}) → (${round(last[0])}, ${round(last[1])})`)
    console.info(`           点: ${stroke.pts.map(([x, y]) => `${round(x)},${round(y)}`).join('  ')}`)
    console.info(`           d : ${stroke.d}`)
  })
  console.info('')
}
