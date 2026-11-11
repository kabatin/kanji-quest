// scripts/kanji-source.mjs の一覧と KanjiVG の SVG から、アプリが読むデータを作る。
// 使い方: node scripts/build-data.mjs <KanjiVG の SVG が入ったフォルダ>
//   (SVG は node scripts/fetch-kanjivg.mjs <フォルダ> で取得できる)
// 出力: src/assets/kanjivg/strokes.json, src/data/generated/{kanji,parts}.json, src/data/narration.json
// scripts/stories/*.json があれば、そこに書かれた「成り立ちの物語」を説明として使う。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { strokeData } from './build-strokes.mjs'
import { ALL, GRADE1 } from './kanji-list.mjs'
import { COMPOUNDS, KANJI_ROWS, NARRATION_OVERRIDES, PART_ROWS } from './kanji-source.mjs'
import { loadKanjiVG } from './kvg-structure.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const LAYOUTS = ['yoko', 'tate', 'kakomu']
const PATTERN_BY_LAYOUT = { yoko: 'sayuu', tate: 'jouge', kakomu: 'kakomu' }

const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean)

/** "1-3" や "1,2,8" を画番号の配列にする。 */
function parseStrokes(text) {
  return text.split(',').flatMap((piece) => {
    const [from, to = from] = piece.split('-').map(Number)
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) throw new Error(`画の指定が不正です: ${text}`)
    return Array.from({ length: to - from + 1 }, (_, i) => from + i)
  })
}

function parseKanjiRows() {
  const rows = new Map(
    lines(KANJI_ROWS).map((line) => {
      const [char, yomi, icon, flag] = line.split(/\s+/)
      if (!char || !yomi || !icon) throw new Error(`漢字の行が不正です: ${line}`)
      return [char, { yomi, icon, pictograph: flag === 'p' }]
    }),
  )
  const missing = ALL.filter((c) => !rows.has(c))
  if (missing.length > 0 || rows.size !== ALL.length) throw new Error(`漢字の一覧が合いません。足りない字: ${missing.join('')}`)
  return rows
}

function parsePartRows() {
  return new Map(
    lines(PART_ROWS).map((line) => {
      const [char, label, kind, icon] = line.split(/\s+/)
      if (!char || !label || !['imi', 'oto'].includes(kind)) throw new Error(`部位の行が不正です: ${line}`)
      return [char, { label, kind, icon }]
    }),
  )
}

function parseCompounds(strokeCounts) {
  return new Map(
    lines(COMPOUNDS).map((line) => {
      const char = line.slice(0, line.indexOf('|'))
      const steps = line
        .slice(line.indexOf('|') + 1)
        .split(';')
        .map((segment) => {
          const [fixedText, answerText, layout, makes] = segment.split('|')
          const [fixed, fixedStrokes] = fixedText.split(' ')
          const [answer, answerStrokes] = answerText.split(' ')
          if (!LAYOUTS.includes(layout)) throw new Error(`配置が不正です: ${line}`)
          return {
            fixed,
            answer,
            layout,
            fixedGlyph: { source: char, strokes: parseStrokes(fixedStrokes) },
            answerGlyph: { source: char, strokes: parseStrokes(answerStrokes) },
            ...(makes ? { makes } : {}),
          }
        })
      const last = steps[steps.length - 1]
      const covered = [...last.fixedGlyph.strokes, ...last.answerGlyph.strokes].sort((a, b) => a - b)
      const expected = Array.from({ length: strokeCounts.get(char) ?? 0 }, (_, i) => i + 1)
      if (covered.join() !== expected.join()) throw new Error(`画がそろっていません: ${char} (${covered.join()})`)
      return [char, steps]
    }),
  )
}

function patternOf(steps) {
  if (steps.length === 0) return 'tantai'
  if (steps.length > 1) return 'fukusuu'
  const [step] = steps
  if (step.fixed === step.answer || step.answer === '林') return 'kurikaeshi'
  return PATTERN_BY_LAYOUT[step.layout]
}

/** 部位を、説明の文の中でどう呼ぶか。 */
const spokenName = (part) => (part.kind === 'oto' ? `「${part.label}」のおと` : part.label)
const writtenName = (part) => (part.kind === 'oto' ? `「${part.label}」の おと` : part.label)

const MOTIONS = ['still', 'lean-left', 'lean-right', 'drop', 'rise', 'enter', 'shine', 'sway', 'walk', 'grow', 'shake']
const KANJI_CHAR = /[\u3400-\u9fff]/
const SPEECH_OK = /^[\u3041-\u309f\u30a0-\u30ff、。\s]+$/

/** scripts/stories/*.json を全部読んで、漢字 → 物語 の表にする。 */
function loadStories() {
  const dir = join(root, 'scripts', 'stories')
  if (!existsSync(dir)) return new Map()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  return new Map(files.flatMap((file) => Object.entries(JSON.parse(readFileSync(join(dir, file), 'utf8')))))
}

/** 物語がアプリで使える形か確かめる。使えないときは理由を返す。 */
function storyProblem(story, row, expectedParts) {
  if (!['naritachi', 'oboekata'].includes(story.kind)) return 'kind が不正'
  if (typeof story.caption !== 'string' || !story.caption || KANJI_CHAR.test(story.caption)) return 'caption に漢字がある、または空'
  if (typeof story.speech !== 'string' || !SPEECH_OK.test(story.speech)) return 'speech に かな以外の文字がある'
  if (!story.speech.replace(/[。、\s]+$/, '').endsWith(row.yomi)) return 'speech が読みで終わっていない'
  if (!Array.isArray(story.actors) || story.actors.length !== expectedParts.length) return 'actors の数が合わない'
  for (const [i, actor] of story.actors.entries()) {
    if (actor.part !== expectedParts[i]) return `actors[${i}].part が ${expectedParts[i]} でない`
    if (typeof actor.picture !== 'string' || !actor.picture) return 'picture が空'
    if (!MOTIONS.includes(actor.motion)) return `motion が不正: ${actor.motion}`
  }
  return null
}

/** 自動で作った説明に、物語(あれば)と、アニメーションに出す絵をつける。 */
function withStory(char, row, steps, partById, base, stories, problems) {
  const last = steps[steps.length - 1]
  const expectedParts = last ? [last.fixed, last.answer] : ['whole']
  const defaultActors = last
    ? [last.fixed, last.answer].map((id) => ({ part: id, picture: partById.get(id).icon ?? '♪', motion: 'still' }))
    : [{ part: 'whole', picture: row.icon, motion: 'grow' }]
  const fallback = { ...base, kind: row.pictograph || NARRATION_OVERRIDES[char] ? 'naritachi' : 'oboekata', actors: defaultActors }
  const story = stories.get(char)
  if (!story) return fallback
  const problem = storyProblem(story, row, expectedParts)
  if (problem) {
    problems.push(`${char}: ${problem}`)
    return fallback
  }
  const actors = story.actors.map(({ part, picture, motion }) => ({ part, picture, motion }))
  return { ...base, kind: story.kind, speech: story.speech, caption: story.caption, actors }
}

function narrationOf(char, row, steps, partById) {
  const goals = steps.map((step) => `${step.makes ? partById.get(step.makes).label : row.yomi}を、つくろう。`)
  const override = NARRATION_OVERRIDES[char]
  if (override) return { word: row.yomi, goals, ...override }
  const last = steps[steps.length - 1]
  if (last) {
    const fixed = partById.get(last.fixed)
    const answer = partById.get(last.answer)
    return {
      word: row.yomi,
      goals,
      speech: `${spokenName(fixed)}と、${spokenName(answer)}で、${row.yomi}。`,
      caption: `${writtenName(fixed)} と ${writtenName(answer)} で、${row.yomi}。`,
    }
  }
  if (row.pictograph) {
    return {
      word: row.yomi,
      goals,
      speech: `${row.yomi}のかたちからできた、かんじだよ。${row.yomi}。`,
      caption: `${row.yomi}の かたちから できたよ。`,
    }
  }
  return { word: row.yomi, goals, speech: `${row.yomi}。`, caption: row.yomi }
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(data, null, 1)}\n`)
}

function main() {
  const srcDir = process.argv[2]
  if (!srcDir) throw new Error('KanjiVG の SVG フォルダを引数で指定してください')

  const rows = parseKanjiRows()
  const partRows = parsePartRows()
  const strokes = new Map(ALL.map((char) => [char, loadKanjiVG(srcDir, char).paths.map(({ d }) => strokeData(d))]))
  const strokeCounts = new Map([...strokes].map(([char, list]) => [char, list.length]))
  const compounds = parseCompounds(strokeCounts)
  for (const char of compounds.keys()) if (!rows.has(char)) throw new Error(`一覧にない漢字です: ${char}`)

  // 部位: はじめて出てきた場所の形を見本にする。収録している漢字そのものなら、その漢字の形を使う。
  const partById = new Map()
  for (const char of ALL) {
    for (const step of compounds.get(char) ?? []) {
      for (const [id, glyph] of [[step.fixed, step.fixedGlyph], [step.answer, step.answerGlyph]]) {
        if (partById.has(id)) continue
        const meta = partRows.get(id) ?? (rows.has(id) ? { label: rows.get(id).yomi, kind: 'imi', icon: rows.get(id).icon } : undefined)
        if (!meta) throw new Error(`部位の名前がありません: ${id} (${char})`)
        const ownGlyph = rows.has(id) ? { source: id, strokes: Array.from({ length: strokeCounts.get(id) }, (_, i) => i + 1) } : glyph
        partById.set(id, { id, label: meta.label, kind: meta.kind, ...(meta.icon ? { icon: meta.icon } : {}), glyph: ownGlyph })
      }
    }
  }
  for (const steps of compounds.values()) {
    for (const step of steps) if (step.makes && !partById.has(step.makes)) throw new Error(`部位がありません: ${step.makes}`)
  }

  const kanji = ALL.map((char) => {
    const row = rows.get(char)
    const steps = compounds.get(char) ?? []
    const own = partById.has(char) ? [char] : []
    const parts = [...new Set([...steps.flatMap((s) => [s.fixed, s.answer, ...(s.makes ? [s.makes] : [])]), ...own])]
    return { char, grade: GRADE1.includes(char) ? 1 : 2, yomi: row.yomi, icon: row.icon, pattern: patternOf(steps), parts, steps }
  })
  const stories = loadStories()
  const problems = []
  const narration = Object.fromEntries(
    ALL.map((char) => {
      const steps = compounds.get(char) ?? []
      const base = narrationOf(char, rows.get(char), steps, partById)
      return [char, withStory(char, rows.get(char), steps, partById, base, stories, problems)]
    }),
  )

  writeJson(join(root, 'src', 'assets', 'kanjivg', 'strokes.json'), Object.fromEntries(strokes))
  writeJson(join(root, 'src', 'data', 'generated', 'kanji.json'), kanji)
  writeJson(join(root, 'src', 'data', 'generated', 'parts.json'), [...partById.values()])
  writeJson(join(root, 'src', 'data', 'narration.json'), narration)
  const storyCount = ALL.filter((char) => stories.has(char)).length - problems.length
  process.stdout.write(`漢字 ${kanji.length} 字 (くみあわせ ${compounds.size} 字) / 部位 ${partById.size} 個 / 物語 ${storyCount} 字\n`)
  if (problems.length > 0) process.stdout.write(`使えなかった物語(自動の説明で代用):\n  ${problems.join('\n  ')}\n`)
}

try {
  main()
} catch (error) {
  process.stderr.write(`データの生成に失敗しました: ${error.message}\n`)
  process.exitCode = 1
}
