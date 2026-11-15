import { addDays, daysBetween } from './date'
import { masteryCounts, type MasteryCell, type MasteryState } from './mastery'
import { MIN_RATE_TOTAL, ratesIn, TREND_WEEKS, type Rate } from './parentTrend'
import type { DayRange } from './parentReport'
import type { ReportInput } from './reportInput'

/**
 * 保護者の画面の 見せ方(習熟マップの まとまり・推移を出す週の数・割合の 見せ方・グラフの目もり)。
 * 数え方そのものは mastery / parentTrend にある。ここは 画面に出す形に 直すだけ。
 */

export type MapArea = {
  readonly areaIndex: number
  /** ステージごとの字(5字ずつ) */
  readonly stages: readonly (readonly MasteryCell[])[]
}

export type MapGrade = {
  readonly grade: number
  readonly areas: readonly MapArea[]
  readonly total: number
  readonly counts: Record<MasteryState, number>
}

const uniq = <T>(items: readonly T[]): T[] => [...new Set(items)]

/** 習熟マップを 学年 → エリア → ステージ の まとまりに分ける(cells は masteryMap の順のまま) */
export function mapGroups(cells: readonly MasteryCell[]): MapGrade[] {
  return uniq(cells.map((cell) => cell.grade)).map((grade) => {
    const inGrade = cells.filter((cell) => cell.grade === grade)
    const areas = uniq(inGrade.map((cell) => cell.areaIndex)).map((areaIndex) => {
      const inArea = inGrade.filter((cell) => cell.areaIndex === areaIndex)
      return { areaIndex, stages: uniq(inArea.map((cell) => cell.stage)).map((stage) => inArea.filter((cell) => cell.stage === stage)) }
    })
    return { grade, areas, total: inGrade.length, counts: masteryCounts(inGrade) }
  })
}

/** 記録が はじまった日(覚えた日・遊んだ日・答えた日の いちばん古い日)。日付の ある記録が なければ null */
export function firstRecordDay(input: ReportInput): string | null {
  const days = [
    ...Object.values(input.learnedOn),
    ...Object.entries(input.playMinutes)
      .filter(([, minutes]) => minutes > 0)
      .map(([day]) => day),
    ...Object.keys(input.answerDays),
  ]
  return days.length === 0 ? null : [...days].sort()[0]
}

/** 推移に出す週の数(少なくとも これだけ) */
export const TREND_MIN_WEEKS = 4
/** 記録が はじまってから この日数は「まだ たまっていない」 */
export const EARLY_DAYS = 7

/** 推移に出す週の数: 記録が はじまった週から(4〜12週)。日付の ない 古い記録だけなら いちばん長く */
export function trendWeeks(input: ReportInput, today: string): number {
  const first = firstRecordDay(input)
  if (first === null) return TREND_WEEKS
  const weeks = Math.floor(Math.max(daysBetween(first, today), 0) / 7) + 1
  return Math.min(Math.max(weeks, TREND_MIN_WEEKS), TREND_WEEKS)
}

export type TrendStatus = { readonly status: 'empty' | 'early' | 'ok'; readonly daysLeft: number }

/** 線に できる字が あるか(遊んだ時間だけでは 線に ならない) */
const hasChars = (input: ReportInput): boolean => input.learned.length > 0 || Object.keys(input.learnedOn).length > 0 || Object.keys(input.answerLog).length > 0

/** empty = 覚えた字が ない / early = はじめて 1週間 たっていない(あと何日)/ ok = 線で見せる */
export function trendStatus(input: ReportInput, today: string): TrendStatus {
  if (!hasChars(input)) return { status: 'empty', daysLeft: 0 }
  const first = firstRecordDay(input)
  // 日付の ない 古い記録だけの子は、はじめから たまっている ものとして 出す
  if (first === null) return { status: 'ok', daysLeft: 0 }
  const daysLeft = EARLY_DAYS - 1 - Math.max(daysBetween(first, today), 0)
  return daysLeft > 0 ? { status: 'early', daysLeft } : { status: 'ok', daysLeft: 0 }
}

/** 覚えた日が わからない字(記録の しくみ より前に 覚えた字)の数 */
export function undatedCount(input: ReportInput): number {
  return input.learned.filter((char) => input.learnedOn[char] === undefined).length
}

const NICE_STEPS = [10, 20, 30, 40, 60, 80, 100, 120, 160, 200, 240] as const

/** グラフの いちばん上の値(きりのよい数) */
export function niceMax(value: number): number {
  return NICE_STEPS.find((step) => step >= value) ?? Math.ceil(value / 100) * 100
}

/** 目もり: 0・半分・上 */
export function axisTicks(max: number): number[] {
  return [0, max / 2, max]
}

/** 割合を見る日数(最近4週) */
export const RATE_DAYS = 28

export type RateView =
  /** before = その前の4週の 割合(%)。足りなければ null */
  | { readonly kind: 'value'; readonly percent: number; readonly count: number; readonly total: number; readonly before: number | null }
  /** 分母が 足りない。needed = あと何問 */
  | { readonly kind: 'few'; readonly total: number; readonly needed: number }

const percentOf = (value: number): number => Math.round(value * 100)

/** 割合を 画面に出す形にする */
export function rateView(rate: Rate, before?: Rate): RateView {
  if (rate.status === 'few') return { kind: 'few', total: rate.total, needed: Math.max(MIN_RATE_TOTAL - rate.total, 1) }
  return { kind: 'value', percent: percentOf(rate.value), count: rate.count, total: rate.total, before: before?.status === 'ok' ? percentOf(before.value) : null }
}

const rangeEnding = (to: string): DayRange => ({ from: addDays(to, -(RATE_DAYS - 1)), to })

/** 最近4週の 割合と、その前の4週との くらべ */
export function recentRates(answerDays: ReportInput['answerDays'], today: string): { readonly retention: RateView; readonly hintUse: RateView } {
  const now = ratesIn(answerDays, rangeEnding(today))
  const before = ratesIn(answerDays, rangeEnding(addDays(today, -RATE_DAYS)))
  return { retention: rateView(now.retention, before.retention), hintUse: rateView(now.hintUse, before.hintUse) }
}
