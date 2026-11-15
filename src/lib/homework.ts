import { recentAnswers, type AnswerLog } from './answerLog'
import { daysBetween } from './date'
import { masteryOf, type MasteryState } from './mastery'
import type { ReportInput } from './reportInput'
import { dueChars, type Reviews } from './review'

/**
 * 保護者が えらぶ「今週 れんしゅう させたい字」。字 → えらんだ日。
 * 子ども側には「しゅくだい」と見せず、ふくしゅう・チャレンジの中に しぜんに まざる。
 */
export type Homework = Readonly<Record<string, string>>

/** 1人が いちどに えらべる字の数 */
export const HOMEWORK_MAX = 20

/** えらんだ字(えらんだ順) */
export const homeworkChars = (homework: Homework | undefined): string[] => Object.keys(homework ?? {})

/**
 * 字を えらぶ・はずす。えらんでいる字は はずす。上限(HOMEWORK_MAX)に 達していれば 足さない(full = true)。
 */
export function toggleHomework(homework: Homework, char: string, today: string): { readonly homework: Homework; readonly full: boolean } {
  if (char in homework) return { homework: Object.fromEntries(Object.entries(homework).filter(([c]) => c !== char)), full: false }
  if (Object.keys(homework).length >= HOMEWORK_MAX) return { homework, full: true }
  return { homework: { ...homework, [char]: today }, full: false }
}

/** 上限を こえた分は すてる(こわれた保存データ・外から来た ファイル用) */
export const capHomework = (homework: Homework): Homework => Object.fromEntries(Object.entries(homework).slice(0, HOMEWORK_MAX))

const reviewedToday = (log: AnswerLog, char: string, today: string): boolean => recentAnswers(log[char]).some((e) => e.where === 'review' && e.day === today)

/**
 * きょうの ふくしゅう の字の 順番。しゅくだい の字(覚えた字で、きょうの ふくしゅう を まだしていない字)を 先に、
 * そのあとに 日が来ている字(にがて・古い順)。しゅくだい の字は 日が来ていなくても 入る。
 */
export function reviewQueue(input: {
  readonly reviews: Reviews
  readonly misses: Readonly<Record<string, number>>
  readonly answerLog: AnswerLog
  readonly homework: readonly string[]
  readonly today: string
}): string[] {
  const { reviews, misses, answerLog, homework, today } = input
  const first = homework.filter((char) => reviews[char] !== undefined && !reviewedToday(answerLog, char, today))
  const taken = new Set(first)
  return [...first, ...dueChars(reviews, today, misses).filter((char) => !taken.has(char))]
}

export type HomeworkRow = {
  readonly char: string
  readonly state: MasteryState
  /** えらんだ日 */
  readonly since: string
  /** まだ 覚えていない字か(学ぶと 復習に出る) */
  readonly notLearned: boolean
  /** えらんでからの 答え(新しい10問の中) */
  readonly right: number
  readonly wrong: number
}

/** しゅくだい の字ごとの いまの 状態と、えらんでからの 正誤 */
export function homeworkRows(homework: Homework, input: ReportInput): HomeworkRow[] {
  return Object.entries(homework).map(([char, since]) => {
    const seen = recentAnswers(input.answerLog[char]).filter((e) => daysBetween(since, e.day) >= 0)
    const state = masteryOf(char, input)
    return { char, state, since, notLearned: state === 'none', right: seen.filter((e) => e.ok).length, wrong: seen.filter((e) => !e.ok).length }
  })
}

/** ぜんぶ 見ないで書ける(定着もふくむ)ようになったか */
export const homeworkAllDone = (rows: readonly HomeworkRow[]): boolean => rows.length > 0 && rows.every((row) => row.state === 'blind' || row.state === 'solid')

/** 「見ないで書ける」に なった字の数 */
export const homeworkDoneCount = (rows: readonly HomeworkRow[]): number => rows.filter((row) => row.state === 'blind' || row.state === 'solid').length
