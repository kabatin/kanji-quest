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

/** エリアの ボスの場所。mid = まんなかの 中ボス / last = さいごの ラスボス */
export type BossSpot = 'mid' | 'last'

export type AreaBoss = {
  readonly id: string
  readonly spot: BossSpot
  /** 通し番号(1始まり)。名前と見た目が これで決まる */
  readonly number: number
  readonly grade: number
  readonly areaIndex: number
  /** エリアの中で、何番目のステージの あとに いるか(1始まり) */
  readonly afterStage: number
  /** 出題する漢字: 中ボスは そこまでに出た字、ラスボスは エリアの字ぜんぶ */
  readonly kanji: readonly string[]
}

export type AreaTheme = 'mori' | 'oka' | 'mizube' | 'kumo' | 'hoshi' | 'shiro'

export type Area = {
  readonly index: number
  readonly grade: number
  readonly name: string
  readonly theme: AreaTheme
  readonly stages: readonly Stage[]
  /** 中ボス(ステージが2つ以上あるとき)と ラスボス */
  readonly bosses: readonly AreaBoss[]
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

export const bossId = (areaIndex: number, spot: BossSpot): string => `a${areaIndex + 1}-${spot}`

/** エリアの ボス。中ボスは まんなかのステージの あと、ラスボスは さいごのステージの あとに いる。 */
export function bossesOf(areaIndex: number, grade: number, stages: readonly Stage[]): AreaBoss[] {
  const half = Math.ceil(stages.length / 2)
  const spots: readonly { spot: BossSpot; afterStage: number }[] =
    half < stages.length
      ? [
          { spot: 'mid', afterStage: half },
          { spot: 'last', afterStage: stages.length },
        ]
      : [{ spot: 'last', afterStage: stages.length }]
  return spots.map(({ spot, afterStage }) => ({
    id: bossId(areaIndex, spot),
    spot,
    number: areaIndex * 2 + (spot === 'mid' ? 1 : 2),
    grade,
    areaIndex,
    afterStage,
    kanji: stages.slice(0, afterStage).flatMap((s) => s.kanji),
  }))
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
      areas.push({ index, grade, name: def.name, theme: def.theme, stages, bosses: bossesOf(index, grade, stages) })
    }
  }
  return areas
}

/** たおした ボス(エリアの ボスの id / 学年の しけん の id → たおした日) */
export type Clears = Readonly<Record<string, string>>

export const isCleared = (clears: Clears, id: string): boolean => clears[id] !== undefined

/** 学年の そつぎょうしけん の id */
export const examId = (grade: number): string => `exam-g${grade}`

export function stagesOfGrade(areas: readonly Area[], grade: number): Stage[] {
  return areas.filter((a) => a.grade === grade).flatMap((a) => a.stages)
}

export function bossesOfGrade(areas: readonly Area[], grade: number): AreaBoss[] {
  return areas.filter((a) => a.grade === grade).flatMap((a) => a.bosses)
}

const allLearned = (kanji: readonly string[], learned: readonly string[]): boolean => kanji.every((c) => learned.includes(c))

/** ステージの5字を ぜんぶ覚えたか。 */
export function isStageDone(stage: Stage, learned: readonly string[]): boolean {
  return allLearned(stage.kanji, learned)
}

/** そのステージの すぐあとに いる ボス(いなければ undefined)。 */
export function bossAfter(stage: Stage, areas: readonly Area[]): AreaBoss | undefined {
  const area = areas[stage.areaIndex]
  const position = area.stages.findIndex((s) => s.id === stage.id)
  return area.bosses.find((b) => b.afterStage === position + 1)
}

/**
 * エリアの最初のステージはいつでも遊べる。それ以外は、1つ前のステージの字を全部覚えると開く。
 * 1つ前のステージの あとに ボスが いるときは、その ボスも たおしてから。
 */
export function isStageUnlocked(stage: Stage, areas: readonly Area[], learned: readonly string[], clears: Clears): boolean {
  const area = areas[stage.areaIndex]
  const position = area.stages.findIndex((s) => s.id === stage.id)
  if (position <= 0) return true
  const previous = area.stages[position - 1]
  const gate = bossAfter(previous, areas)
  return isStageDone(previous, learned) && (gate === undefined || isCleared(clears, gate.id))
}

/** ボスは、出題される字(そこまでのステージの字)を全部覚えると たたかえる。 */
export function isBossUnlocked(boss: AreaBoss, learned: readonly string[]): boolean {
  return allLearned(boss.kanji, learned)
}

/** そつぎょうしけん は、その学年の漢字を全部学び、エリアの ボス を全部たおすと ちょうせん できる。 */
export function isExamUnlocked(areas: readonly Area[], grade: number, learned: readonly string[], clears: Clears): boolean {
  const stages = stagesOfGrade(areas, grade)
  return stages.length > 0 && stages.every((s) => isStageDone(s, learned)) && bossesOfGrade(areas, grade).every((b) => isCleared(clears, b.id))
}

export type NextStep =
  | { readonly kind: 'learn'; readonly stage: Stage; readonly char: string }
  | { readonly kind: 'boss'; readonly boss: AreaBoss }
  | { readonly kind: 'exam'; readonly grade: number; readonly areaIndex: number }
  | { readonly kind: 'done' }

/** エリアの中で次にやること(まだの字 → その場所の ボス)。全部おわっていれば undefined。 */
export function nextInArea(area: Area, areas: readonly Area[], learned: readonly string[], clears: Clears): NextStep | undefined {
  for (const stage of area.stages) {
    const char = stage.kanji.find((c) => !learned.includes(c))
    if (char) return { kind: 'learn', stage, char }
    const boss = bossAfter(stage, areas)
    if (boss && !isCleared(clears, boss.id)) return { kind: 'boss', boss }
  }
  return undefined
}

/**
 * 「つづきから」で次にやること。学年の順・エリアの順に、まだ覚えていない字があればその字、
 * ボスの場所まで来ていれば ボス。学年が全部おわっていれば そつぎょうしけん。
 */
export function nextStep(areas: readonly Area[], learned: readonly string[], clears: Clears): NextStep {
  for (const grade of [...new Set(areas.map((a) => a.grade))]) {
    const gradeAreas = areas.filter((a) => a.grade === grade)
    for (const area of gradeAreas) {
      const next = nextInArea(area, areas, learned, clears)
      if (next) return next
    }
    if (!isCleared(clears, examId(grade))) return { kind: 'exam', grade, areaIndex: gradeAreas[gradeAreas.length - 1].index }
  }
  return { kind: 'done' }
}

/**
 * ステージごとに ボスが いたころの記録を、エリアの ボス(中ボス・ラスボス)の記録に直す。
 * その ボスまでのステージを全部クリアしていたら、たおしたことにする。そつぎょうしけん は そのまま。
 */
export function migrateClears(old: Clears, areas: readonly Area[]): Clears {
  const kept = Object.entries(old).filter(([id]) => !/^s\d+$/.test(id))
  const bosses = areas.flatMap((area) =>
    area.bosses.flatMap((boss): [string, string][] => {
      const before = area.stages.slice(0, boss.afterStage)
      if (isCleared(old, boss.id) || !before.every((s) => isCleared(old, s.id))) return []
      return [[boss.id, old[before[before.length - 1].id]]]
    }),
  )
  return Object.fromEntries([...kept, ...bosses])
}

export function findStage(areas: readonly Area[], id: string): Stage {
  const stage = areas.flatMap((a) => a.stages).find((s) => s.id === id)
  if (!stage) throw new Error(`ステージが見つかりません: ${id}`)
  return stage
}

export function findBoss(areas: readonly Area[], id: string): AreaBoss {
  const boss = areas.flatMap((a) => a.bosses).find((b) => b.id === id)
  if (!boss) throw new Error(`ボスが見つかりません: ${id}`)
  return boss
}

/** その日に まだ ちょうせん できる回数。日付が変わると もとにもどる。 */
export type Tries = { readonly day: string; readonly used: Readonly<Record<string, number>> }

export function triesLeft(tries: Tries, id: string, limit: number, today: string): number {
  const used = tries.day === today ? (tries.used[id] ?? 0) : 0
  return Math.max(limit - used, 0)
}
