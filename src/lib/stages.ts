import type { Kanji } from '../data/schema'
import { strokeCount } from '../data/strokes'

export const STAGE_SIZE = 5
export const STAGES_PER_AREA = 8

export type Stage = {
  readonly id: string
  /** 通し番号(1始まり) */
  readonly number: number
  readonly grade: number
  readonly areaIndex: number
  readonly kanji: readonly string[]
}

export type AreaTheme = 'mori' | 'oka' | 'mizube' | 'kumo' | 'hoshi' | 'shiro'

export type Area = {
  readonly index: number
  readonly grade: number
  readonly name: string
  readonly theme: AreaTheme
  readonly stages: readonly Stage[]
}

const AREA_DEFS: readonly { name: string; theme: AreaTheme }[] = [
  { name: 'はじまりの もり', theme: 'mori' },
  { name: 'ひだまりの おか', theme: 'oka' },
  { name: 'みずべの さと', theme: 'mizube' },
  { name: 'くもの うえ', theme: 'kumo' },
  { name: 'ほしぞらの やま', theme: 'hoshi' },
  { name: 'かんじの しろ', theme: 'shiro' },
]

const chunk = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

export function gradesOf(kanjiList: readonly Kanji[]): number[] {
  return [...new Set(kanjiList.map((k) => k.grade))].sort((a, b) => a - b)
}

/**
 * 漢字を、ぼうけんのステージ(5字ずつ)とエリア(8ステージずつ)に分ける。
 * ステージもエリアも学年ごとに区切る(学年の そつぎょうしけん の範囲が はっきりするように)。
 * 学年の中では、画数の少ない字から並べる。部位になる かんたんな字(木・日・口など)が
 * 先に出てきて、あとからそれを組み合わせた字が出てくるようにするため。
 */
export function buildAreas(kanjiList: readonly Kanji[]): Area[] {
  const areas: Area[] = []
  let stageNumber = 0
  for (const grade of gradesOf(kanjiList)) {
    const ordered = kanjiList
      .filter((k) => k.grade === grade)
      .map((k, order) => ({ char: k.char, strokes: strokeCount(k.char), order }))
      .sort((a, b) => a.strokes - b.strokes || a.order - b.order)
      .map((k) => k.char)
    for (const group of chunk(chunk(ordered, STAGE_SIZE), STAGES_PER_AREA)) {
      const index = areas.length
      const def = AREA_DEFS[index % AREA_DEFS.length]
      const stages = group.map((kanji, i) => ({ id: `s${stageNumber + i + 1}`, number: stageNumber + i + 1, grade, areaIndex: index, kanji }))
      stageNumber += stages.length
      areas.push({ index, grade, name: def.name, theme: def.theme, stages })
    }
  }
  return areas
}

/** たおした ボス(ステージの id / 学年の しけん の id → たおした日) */
export type Clears = Readonly<Record<string, string>>

export const isCleared = (clears: Clears, id: string): boolean => clears[id] !== undefined

/** 学年の そつぎょうしけん の id */
export const examId = (grade: number): string => `exam-g${grade}`

export function stagesOfGrade(areas: readonly Area[], grade: number): Stage[] {
  return areas.filter((a) => a.grade === grade).flatMap((a) => a.stages)
}

/** エリアの最初のステージはいつでも遊べる。それ以外は、1つ前のステージの ボス をたおすと開く。 */
export function isStageUnlocked(stage: Stage, areas: readonly Area[], clears: Clears): boolean {
  const area = areas[stage.areaIndex]
  const position = area.stages.findIndex((s) => s.id === stage.id)
  if (position <= 0) return true
  return isCleared(clears, area.stages[position - 1].id)
}

/** そつぎょうしけん は、その学年の漢字を全部学び、ステージの ボス を全部たおすと ちょうせん できる。 */
export function isExamUnlocked(areas: readonly Area[], grade: number, learned: readonly string[], clears: Clears): boolean {
  const stages = stagesOfGrade(areas, grade)
  return stages.length > 0 && stages.every((s) => isCleared(clears, s.id) && s.kanji.every((c) => learned.includes(c)))
}

export type NextStep =
  | { readonly kind: 'learn'; readonly stage: Stage; readonly char: string }
  | { readonly kind: 'boss'; readonly stage: Stage }
  | { readonly kind: 'exam'; readonly grade: number; readonly areaIndex: number }
  | { readonly kind: 'done' }

/**
 * 「つづきから」で次にやること。学年の順に、まだ ボス をたおしていない最初のステージで、
 * 覚えていない字があればその字、全部覚えていれば ボス。学年のステージが全部おわっていれば そつぎょうしけん。
 */
export function nextStep(areas: readonly Area[], learned: readonly string[], clears: Clears): NextStep {
  for (const grade of [...new Set(areas.map((a) => a.grade))]) {
    const stages = stagesOfGrade(areas, grade)
    const stage = stages.find((s) => !isCleared(clears, s.id))
    if (stage) {
      const char = stage.kanji.find((c) => !learned.includes(c))
      return char ? { kind: 'learn', stage, char } : { kind: 'boss', stage }
    }
    if (!isCleared(clears, examId(grade))) return { kind: 'exam', grade, areaIndex: stages[stages.length - 1].areaIndex }
  }
  return { kind: 'done' }
}

export function findStage(areas: readonly Area[], id: string): Stage {
  const stage = areas.flatMap((a) => a.stages).find((s) => s.id === id)
  if (!stage) throw new Error(`ステージが見つかりません: ${id}`)
  return stage
}

/** その日に まだ ちょうせん できる回数。日付が変わると もとにもどる。 */
export type Tries = { readonly day: string; readonly used: Readonly<Record<string, number>> }

export function triesLeft(tries: Tries, id: string, limit: number, today: string): number {
  const used = tries.day === today ? (tries.used[id] ?? 0) : 0
  return Math.max(limit - used, 0)
}
