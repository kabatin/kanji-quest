import { TALLY, type AnswerDays } from './answerLog'
import { addDays, daysBetween } from './date'
import { firstFreeWriteDay, masteryOf } from './mastery'
import { weakKanji, type WeakKanji } from './parentStats'
import type { ReportInput } from './reportInput'

/**
 * 保護者向けの 週のレポート。「週」は きょうまでの7日(その前の7日と くらべる)。
 * 書ける力は 少なめに 見る(一度 書けても、いま さがっている字は「書けるようになった」に入れない)。
 */

export type DayRange = { readonly from: string; readonly to: string }

/** きょうまでの7日(weeksAgo 週 前の7日) */
export function weekRange(today: string, weeksAgo = 0): DayRange {
  const to = addDays(today, -7 * weeksAgo)
  return { from: addDays(to, -6), to }
}

export const inRange = (day: string | undefined, range: DayRange): boolean =>
  day !== undefined && daysBetween(range.from, day) >= 0 && daysBetween(day, range.to) >= 0

/** その はんいの 日ごとの集計を たす */
export function sumTally(days: AnswerDays, range: DayRange): number[] {
  return Object.entries(days)
    .filter(([day]) => inRange(day, range))
    .reduce<number[]>((sum, [, tally]) => sum.map((n, i) => n + (tally[i] ?? 0)), [0, 0, 0, 0, 0, 0])
}

export type WeekNumbers = {
  readonly range: DayRange
  /** 覚えた字(覚えた順) */
  readonly learned: readonly string[]
  /** はじめて 見本なしで書けた字(いまも 見ないで書ける・定着 のものだけ) */
  readonly freeWritten: readonly string[]
  /** 苦手から ぬけた字(いまも 苦手で ないものだけ) */
  readonly leftWeak: readonly string[]
  /** 遊んだ日数 */
  readonly playDays: number
  readonly minutes: number
  /** 答えた問題の数 */
  readonly answers: number
}

/** 覚えた字 と、答えの きろく が ある字(習熟度を 見る字) */
const knownChars = (input: ReportInput): string[] => [...new Set([...input.learned, ...Object.keys(input.learnedOn), ...Object.keys(input.answerLog)])]

function weekNumbers(input: ReportInput, range: DayRange): WeekNumbers {
  const chars = knownChars(input)
  const minutes = Object.entries(input.playMinutes).filter(([day, n]) => inRange(day, range) && n > 0)
  const canWrite = (char: string) => ['blind', 'solid'].includes(masteryOf(char, input))
  return {
    range,
    learned: chars.filter((char) => inRange(input.learnedOn[char], range)),
    freeWritten: chars.filter((char) => inRange(firstFreeWriteDay(char, input), range) && canWrite(char)),
    leftWeak: chars.filter((char) => inRange(input.answerLog[char]?.o, range) && (input.misses[char] ?? 0) <= 0),
    playDays: minutes.length,
    minutes: minutes.reduce((sum, [, n]) => sum + n, 0),
    answers: sumTally(input.answerDays, range)[TALLY.answers],
  }
}

/** empty = まだ記録がない / quiet = この1週間 遊んでいない / few = 記録が少ない / active = ふつう */
export type ReportStatus = 'empty' | 'quiet' | 'few' | 'active'

export type WeekReport = {
  readonly thisWeek: WeekNumbers
  readonly lastWeek: WeekNumbers
  /** いま 苦手な字(まちがいの多い順) */
  readonly stillWeak: readonly WeakKanji[]
  /** 先週との差(この1週間 − その前の1週間) */
  readonly diff: { readonly learned: number; readonly freeWritten: number; readonly minutes: number; readonly playDays: number }
  /** 最後に遊んだ日(60日より前は わからない) */
  readonly lastPlayed: string | null
  readonly status: ReportStatus
}

/** 答えた数が これより少なく、ほかに できごとが ない週は「記録が少ない」 */
export const FEW_ANSWERS = 5

function statusOf(input: ReportInput, week: WeekNumbers): ReportStatus {
  const nothingYet = knownChars(input).length === 0 && Object.values(input.playMinutes).every((n) => n <= 0)
  if (nothingYet) return 'empty'
  const events = week.learned.length + week.freeWritten.length + week.leftWeak.length
  if (events === 0 && week.minutes === 0 && week.answers === 0) return 'quiet'
  return events === 0 && week.answers < FEW_ANSWERS ? 'few' : 'active'
}

export function weekReport(input: ReportInput, today: string): WeekReport {
  const thisWeek = weekNumbers(input, weekRange(today))
  const lastWeek = weekNumbers(input, weekRange(today, 1))
  const played = Object.entries(input.playMinutes)
    .filter(([day, n]) => n > 0 && daysBetween(day, today) >= 0)
    .map(([day]) => day)
    .sort()
  return {
    thisWeek,
    lastWeek,
    stillWeak: weakKanji(input.misses),
    diff: {
      learned: thisWeek.learned.length - lastWeek.learned.length,
      freeWritten: thisWeek.freeWritten.length - lastWeek.freeWritten.length,
      minutes: thisWeek.minutes - lastWeek.minutes,
      playDays: thisWeek.playDays - lastWeek.playDays,
    },
    lastPlayed: played.at(-1) ?? null,
    status: statusOf(input, thisWeek),
  }
}

const LIST_MAX = 3

/** 『右』と『左』 / 『右』『左』『石』 / 『右』『左』『石』など5字 */
export function listChars(chars: readonly string[]): string {
  const quoted = chars.slice(0, LIST_MAX).map((char) => `『${char}』`)
  if (chars.length === 2) return quoted.join('と')
  return chars.length > LIST_MAX ? `${quoted.join('')}など${chars.length}字` : quoted.join('')
}

/** 11月5日 */
export function formatDay(day: string): string {
  const [, month, date] = day.split('-').map(Number)
  return `${month}月${date}日`
}

/** 45分 / 1時間 / 2時間5分 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}分`
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`
}

function learningSentence(week: WeekNumbers): string {
  const learned = week.learned.length
  const free = week.freeWritten.length
  if (learned > 0 && free > 0) return `この1週間で${learned}字を覚え、${free}字が見本なしで書けるようになりました。`
  if (learned > 0) return `この1週間で${learned}字を覚えました。`
  if (free > 0) return `この1週間は新しい字はありませんでしたが、${free}字が見本なしで書けるようになりました。`
  return `この1週間は新しい字を覚えず、復習などで${week.answers}問に答えました。`
}

function weakSentence(report: WeekReport): string | null {
  const left = report.thisWeek.leftWeak
  const still = report.stillWeak.map((w) => w.char)
  if (left.length > 0 && still.length > 0) return `${listChars(left)}が苦手でなくなり、${listChars(still)}がまだ苦手です。`
  if (left.length > 0) return `${listChars(left)}が苦手でなくなりました。`
  return still.length > 0 ? `${listChars(still)}がまだ苦手です。` : null
}

function timeSentence(report: WeekReport): string {
  const { thisWeek, lastWeek, diff } = report
  const head = `遊んだのは${thisWeek.playDays}日・合計${formatMinutes(thisWeek.minutes)}`
  if (lastWeek.minutes === 0) return `${head}でした。`
  if (diff.minutes === 0) return `${head}で、先週と同じくらいです。`
  return `${head}で、先週より${formatMinutes(Math.abs(diff.minutes))}${diff.minutes > 0 ? '多く' : '少なく'}なりました。`
}

function quietSentence(report: WeekReport): string {
  const last = report.lastPlayed ? `(最後に遊んだのは${formatDay(report.lastPlayed)}です)` : ''
  return `この1週間は遊んだ記録がありません${last}。`
}

/** 週のレポートを、保護者向けの 1〜3文にする */
export function weekSentences(report: WeekReport): string[] {
  if (report.status === 'empty') return ['まだ記録がありません。漢字を学ぶと、ここに1週間のようすが出ます。']
  const weak = weakSentence(report)
  const tail = weak ? [weak] : []
  if (report.status === 'quiet') return [quietSentence(report), ...tail]
  const { playDays, minutes } = report.thisWeek
  if (report.status === 'few') {
    const played = minutes > 0 ? `(遊んだのは${playDays}日・${formatMinutes(minutes)})` : ''
    return [`この1週間の記録は、まだ少しです${played}。`, ...tail]
  }
  // 1分に ならない あそび だけの週は、時間の文を 出さない
  return [learningSentence(report.thisWeek), ...tail, ...(minutes > 0 ? [timeSentence(report)] : [])]
}

export function weekSummary(report: WeekReport): string {
  return weekSentences(report).join('')
}
