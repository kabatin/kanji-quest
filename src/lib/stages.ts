import type { Kanji } from '../data/schema'
import { strokeCount } from '../data/strokes'

export const STAGE_SIZE = 5
export const STAGES_PER_AREA = 8

export type Stage = {
  readonly id: string
  /** 通し番号(1始まり) */
  readonly number: number
  readonly areaIndex: number
  readonly kanji: readonly string[]
}

export type AreaTheme = 'mori' | 'oka' | 'mizube' | 'kumo' | 'hoshi' | 'shiro'

export type Area = {
  readonly index: number
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

/**
 * 漢字を、ぼうけんのステージ(5字ずつ)とエリア(8ステージずつ)に分ける。
 * 学年ごとに、画数の少ない字から並べる。部位になる かんたんな字(木・日・口など)が
 * 先に出てきて、あとからそれを組み合わせた字が出てくるようにするため。
 */
export function buildAreas(kanjiList: readonly Kanji[]): Area[] {
  const ordered = [1, 2].flatMap((grade) =>
    kanjiList
      .filter((k) => k.grade === grade)
      .map((k, order) => ({ char: k.char, strokes: strokeCount(k.char), order }))
      .sort((a, b) => a.strokes - b.strokes || a.order - b.order)
      .map((k) => k.char),
  )
  const stages = chunk(ordered, STAGE_SIZE).map((kanji, i) => ({
    id: `s${i + 1}`,
    number: i + 1,
    areaIndex: Math.floor(i / STAGES_PER_AREA),
    kanji,
  }))
  return chunk(stages, STAGES_PER_AREA).map((areaStages, index) => {
    const def = AREA_DEFS[index % AREA_DEFS.length]
    return { index, name: def.name, theme: def.theme, stages: areaStages }
  })
}

export type StageStars = Readonly<Record<string, number>>

/** エリアの最初のステージはいつでも遊べる。それ以外は、1つ前のステージの まとめ をクリアすると開く。 */
export function isStageUnlocked(stage: Stage, areas: readonly Area[], stars: StageStars): boolean {
  const area = areas[stage.areaIndex]
  const position = area.stages.findIndex((s) => s.id === stage.id)
  if (position <= 0) return true
  return (stars[area.stages[position - 1].id] ?? 0) > 0
}

export type NextStep =
  | { readonly kind: 'learn'; readonly stage: Stage; readonly char: string }
  | { readonly kind: 'boss'; readonly stage: Stage }
  | { readonly kind: 'done' }

/**
 * 「つづきから」で次にやること。まだクリアしていない最初のステージで、
 * 覚えていない字があればその字、全部覚えていれば まとめ。
 */
export function nextStep(areas: readonly Area[], learned: readonly string[], stars: StageStars): NextStep {
  const stage = areas.flatMap((a) => a.stages).find((s) => (stars[s.id] ?? 0) === 0)
  if (!stage) return { kind: 'done' }
  const char = stage.kanji.find((c) => !learned.includes(c))
  return char ? { kind: 'learn', stage, char } : { kind: 'boss', stage }
}

export function findStage(areas: readonly Area[], id: string): Stage {
  const stage = areas.flatMap((a) => a.stages).find((s) => s.id === id)
  if (!stage) throw new Error(`ステージが見つかりません: ${id}`)
  return stage
}
