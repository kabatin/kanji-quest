import { TALLY, type AnswerDays } from './answerLog'
import { daysBetween } from './date'
import { firstFreeWriteDay } from './mastery'
import { sumTally, weekRange, type DayRange } from './parentReport'
import type { ReportInput } from './reportInput'

/** 推移で見せる 週の数(ふつう) */
export const TREND_WEEKS = 12
/** 割合を出すのに いる 問題の数。これより少ないと「まだ足りない」 */
export const MIN_RATE_TOTAL = 5

/** 保護者の画面に出す 割合の名前と 説明 */
export const RATE_LABEL = { retention: '1週間たっても書けた割合', hintUse: 'ヒントを使った割合' } as const
export const RATE_NOTE = {
  retention: '復習で、前に見てから7日以上あいた「見ないで書く」問題のうち、ヒントを使わずに書けた割合です。',
  hintUse: '復習・ボス・にがて練習で書いた問題のうち、書き順の動きを見るヒント(またはお手本)を使った割合です。',
} as const

export type GrowthPoint = {
  readonly range: DayRange
  /** その週の おわりまでに 覚えた字の数 */
  readonly learned: number
  /** その週の おわりまでに、一度でも 見本なしで(ヒントなしで)書けた字の数 */
  readonly freeWritten: number
}

const notAfter = (day: string | undefined, end: string): boolean => day !== undefined && daysBetween(day, end) >= 0

/** 古い週から順の 週ごとの 累計。覚えた日が ない古い字は はじめから、ログがない字の 書けた日は 復習の段から 見つもる */
export function growthTrend(input: ReportInput, today: string, weeks: number = TREND_WEEKS): GrowthPoint[] {
  const learned = [...new Set([...input.learned, ...Object.keys(input.learnedOn)])]
  const chars = [...new Set([...learned, ...Object.keys(input.answerLog)])]
  const freeDays = chars.map((char) => firstFreeWriteDay(char, input))
  return Array.from({ length: weeks }, (_, i) => weekRange(today, weeks - 1 - i)).map((range) => ({
    range,
    learned: learned.filter((char) => input.learnedOn[char] === undefined || notAfter(input.learnedOn[char], range.to)).length,
    freeWritten: freeDays.filter((day) => notAfter(day, range.to)).length,
  }))
}

export type Rate =
  | { readonly status: 'ok'; readonly value: number; readonly count: number; readonly total: number }
  /** 分母が MIN_RATE_TOTAL より少ない(値は出さない) */
  | { readonly status: 'few'; readonly count: number; readonly total: number }

export function rateOf(count: number, total: number, min: number = MIN_RATE_TOTAL): Rate {
  return total < min ? { status: 'few', count, total } : { status: 'ok', value: count / total, count, total }
}

export type Rates = { readonly retention: Rate; readonly hintUse: Rate }

/** その はんいの 割合 */
export function ratesIn(answerDays: AnswerDays, range: DayRange): Rates {
  const sum = sumTally(answerDays, range)
  return { retention: rateOf(sum[TALLY.spacedOk], sum[TALLY.spaced]), hintUse: rateOf(sum[TALLY.hinted], sum[TALLY.writes]) }
}

export type RatePoint = Rates & { readonly range: DayRange }

/** 古い週から順の、週ごとの 割合(日ごとの集計は 26週ぶん のこる) */
export function rateTrend(answerDays: AnswerDays, today: string, weeks: number = TREND_WEEKS): RatePoint[] {
  return Array.from({ length: weeks }, (_, i) => weekRange(today, weeks - 1 - i)).map((range) => ({ range, ...ratesIn(answerDays, range) }))
}
