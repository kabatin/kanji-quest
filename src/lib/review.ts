import type { Kanji } from '../data/schema'
import { buildSelect, buildWrite, SELECT_TYPES, type BossQuestion } from './boss'
import { addDays, daysBetween } from './date'
import type { Rng } from './quiz'

/**
 * 間隔をあけた ふくしゅう。覚えた字は、1日後・3日後・7日後・14日後・30日後 に もう一度出す。
 * 1回で できたら次の間隔へ、まちがえたら また次の日から やりなおす。
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const
/** 全部の間隔を こえた字(おぼえきった字)も、ときどき出す */
export const MASTERED_INTERVAL = 60
/** 1回の ふくしゅう で出す字の数 */
export const REVIEW_SIZE = 5
/** 1日に ふくしゅう する字の数(おうちの かた が えらべる)。のこりは 次の日に回す */
export const REVIEW_DAILY_CHOICES = [5, 10, 15] as const
export type ReviewDaily = (typeof REVIEW_DAILY_CHOICES)[number]
export const REVIEW_DAILY_DEFAULT: ReviewDaily = 10
/** その日に ふくしゅう した字の数 */
export type ReviewDone = { readonly day: string; readonly count: number }

/** 前からの保存データで、もう覚えていた字を 1日に何字ずつ ふくしゅう に回すか */
export const BACKLOG_PER_DAY = 5

export type ReviewCard = {
  /** 次に出す日 */
  readonly due: string
  /** 何回目の ふくしゅう か(REVIEW_INTERVALS の番号。全部こえたら その長さ) */
  readonly step: number
}

export type Reviews = Readonly<Record<string, ReviewCard>>

/** はじめて覚えた字の、最初の ふくしゅう(次の日)。 */
export function scheduleNew(today: string): ReviewCard {
  return { due: addDays(today, REVIEW_INTERVALS[0]), step: 0 }
}

/** ふくしゅう の結果で、次に出す日を決める。 */
export function afterReview(card: ReviewCard | undefined, ok: boolean, today: string): ReviewCard {
  if (!ok) return { due: addDays(today, REVIEW_INTERVALS[0]), step: 0 }
  const step = (card?.step ?? 0) + 1
  return { due: addDays(today, REVIEW_INTERVALS[step] ?? MASTERED_INTERVAL), step }
}

export function isMastered(card: ReviewCard | undefined): boolean {
  return card !== undefined && card.step >= REVIEW_INTERVALS.length
}

/**
 * きょうの ぶん。出す日が来ている字が 多くても、1日の数(limit)までしか 見せない
 * (子どもに見える数が、いつも「やりきれる数」に なるように)。
 * left = きょう あと何字、later = 次の日いこうに回す字(「おかわり」で 先に やっても よい)。
 */
export function todaysReview(dueCount: number, done: ReviewDone, today: string, limit: number): { readonly left: number; readonly later: number } {
  const doneToday = done.day === today ? done.count : 0
  const left = Math.min(dueCount, Math.max(0, limit - doneToday))
  return { left, later: dueCount - left }
}

/**
 * ふくしゅう の日が来ている字を、ほかの あそび(ボス・チャレンジ・にがて れんしゅう)で まちがえずに できたら、
 * ふくしゅう したことにして 次の間隔へ すすめる(同じ日に 同じ字を 2回 やらせない)。
 */
export function creditReviews(reviews: Reviews, chars: readonly string[], today: string): Reviews {
  const due = [...new Set(chars)].filter((char) => reviews[char] !== undefined && daysBetween(reviews[char].due, today) >= 0)
  if (due.length === 0) return reviews
  return { ...reviews, ...Object.fromEntries(due.map((char) => [char, afterReview(reviews[char], true, today)])) }
}

/**
 * きょう ふくしゅう する字。出す日が来ている字を、苦手な字(まちがえた回数が のこっている字)から先に、
 * そのあとは 古い順に(同じなら まちがいの多い順に)。1日の数に かぎりが あるので、だいじな字を先に出す。
 */
export function dueChars(reviews: Reviews, today: string, misses: Readonly<Record<string, number>> = {}): string[] {
  return Object.entries(reviews)
    .filter(([, card]) => daysBetween(card.due, today) >= 0)
    .sort(([a, x], [b, y]) => Number((misses[b] ?? 0) > 0) - Number((misses[a] ?? 0) > 0) || daysBetween(y.due, x.due) || (misses[b] ?? 0) - (misses[a] ?? 0))
    .map(([char]) => char)
}

/** 前からの保存データで、もう覚えていた字を ふくしゅう に入れる。いっぺんに たまらないよう、日を ずらす。 */
export function backfillReviews(learned: readonly string[], today: string): Reviews {
  return Object.fromEntries(learned.map((char, i) => [char, { due: addDays(today, Math.floor(i / BACKLOG_PER_DAY)), step: 0 }]))
}

/**
 * ふくしゅう の問題。間隔が のびるほど むずかしくする。
 * 1回目 えらぶ → 2回目 見本を見て書く → 3回目 えらぶ → 4回目から 見本なしで書く
 */
export function buildReviewQuestion(kanji: Kanji, card: ReviewCard | undefined, all: readonly Kanji[], rng: Rng = Math.random): BossQuestion {
  const step = card?.step ?? 0
  if (step === 1) return buildWrite(kanji, 'whole', true)
  if (step >= 3) return buildWrite(kanji, 'whole', false)
  return buildSelect(kanji, SELECT_TYPES[Math.floor(rng() * SELECT_TYPES.length)], all, rng)
}

/** 次に出る日を、子ども向けの ことばにする。 */
export function nextReviewLabel(card: ReviewCard, today: string): string {
  const days = daysBetween(today, card.due)
  if (days <= 1) return 'あした'
  return `${days}にち ご`
}
