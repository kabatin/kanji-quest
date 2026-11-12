import type { Kanji } from '../data/schema'
import { addDays, daysBetween } from './date'
import { isMastered, type Reviews } from './review'

export const WEEK_DAYS = 7
export const WEAK_LIMIT = 8

export type DayStat = {
  readonly day: string
  /** 曜日(日〜土) */
  readonly weekday: string
  /** その日に はじめて覚えた字 */
  readonly learned: readonly string[]
  /** その日に あそんだ分数 */
  readonly minutes: number
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

/** きょうまでの7日ぶん(古い日から順)。 */
export function weekStats(today: string, learnedOn: Readonly<Record<string, string>>, playMinutes: Readonly<Record<string, number>>): DayStat[] {
  return Array.from({ length: WEEK_DAYS }, (_, i) => {
    const day = addDays(today, i - (WEEK_DAYS - 1))
    return {
      day,
      weekday: WEEKDAYS[new Date(`${day}T12:00:00`).getDay()],
      learned: Object.entries(learnedOn)
        .filter(([, on]) => on === day)
        .map(([char]) => char),
      minutes: playMinutes[day] ?? 0,
    }
  })
}

export type WeakKanji = { readonly char: string; readonly misses: number }

/** まちがいの多い字(多い順)。 */
export function weakKanji(misses: Readonly<Record<string, number>>, limit: number = WEAK_LIMIT): WeakKanji[] {
  return Object.entries(misses)
    .filter(([, count]) => count > 0)
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .slice(0, limit)
    .map(([char, count]) => ({ char, misses: count }))
}

export type GradeStat = { readonly grade: number; readonly learned: number; readonly total: number }

export function gradeStats(kanjiList: readonly Kanji[], learned: readonly string[]): GradeStat[] {
  const grades = [...new Set(kanjiList.map((k) => k.grade))].sort((a, b) => a - b)
  return grades.map((grade) => {
    const inGrade = kanjiList.filter((k) => k.grade === grade)
    return { grade, learned: inGrade.filter((k) => learned.includes(k.char)).length, total: inGrade.length }
  })
}

export type ReviewStat = { readonly due: number; readonly mastered: number; readonly scheduled: number }

export function reviewStats(reviews: Reviews, today: string): ReviewStat {
  const cards = Object.values(reviews)
  return {
    due: cards.filter((card) => daysBetween(card.due, today) >= 0).length,
    mastered: cards.filter(isMastered).length,
    scheduled: cards.length,
  }
}

/** おうちの かた だけが とける問題(2けた × 1けた)。 */
export type GateQuestion = { readonly a: number; readonly b: number }

export function makeGateQuestion(rng: () => number = Math.random): GateQuestion {
  return { a: 12 + Math.floor(rng() * 8), b: 3 + Math.floor(rng() * 7) }
}

export function checkGate(question: GateQuestion, answer: string): boolean {
  return answer.trim() !== '' && Number(answer.trim()) === question.a * question.b
}
