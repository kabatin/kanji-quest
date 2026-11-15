import type { Kanji } from '../data/schema'
import { daysBetween, hashString } from './date'
import { buildQuiz, shuffle, type Question, type Rng } from './quiz'
import type { Reviews } from './review'
import { hasStamp, type QuizSummary } from './rewards'
import type { Level } from './score'

/** 「きょうの チャレンジ」の問題の数(覚えた字が少ないうちは、その数に合わせる)。 */
export const DAILY_QUESTION_COUNT = 10

/** 覚えた字が これだけ あれば あそべる(「おぼえた」の範囲を えらべた ころと同じ、1字から)。 */
export const MIN_LEARNED_FOR_CHALLENGE = 1

/**
 * きょうの チャレンジの きろく。
 * day の日の むずかしさが level、次の日からの むずかしさが next(その日に やりおえるまでは level と同じ)。
 * chars は、その日に出す字(何度ひらいても、同じ問題になるように)。
 */
export type ChallengeDay = {
  readonly day: string
  readonly level: Level
  readonly next: Level
  readonly done: boolean
  readonly chars: readonly string[]
}

export const INITIAL_CHALLENGE_DAY: ChallengeDay = { day: '', level: 1, next: 1, done: false, chars: [] }

/** 種の文字から、いつも同じ並びになる乱数(mulberry32)。Math.random の かわりに使う。 */
export function seededRng(seed: string): Rng {
  let state = hashString(seed)
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** きょう出す問題の数。覚えた字が少ないときは、その数。 */
export function dailyCount(learnedCount: number): number {
  return Math.min(DAILY_QUESTION_COUNT, Math.max(0, learnedCount))
}

/** きょうの むずかしさ(ヒントの量)。まだ きょうの きろくがなければ、前の日の「つぎ」。 */
export function challengeLevel(record: ChallengeDay, today: string): Level {
  return record.day === today ? record.level : record.next
}

export function isChallengeDone(record: ChallengeDay, today: string): boolean {
  return record.day === today && record.done
}

/** 全問1回で正解なら1つ上、1回で正解が半分に ならなければ1つ下、それ以外は そのまま。 */
export function nextLevelAfter(level: Level, summary: QuizSummary): Level {
  if (summary.questionCount <= 0) return level
  if (summary.firstTry >= summary.questionCount) return Math.min(3, level + 1) as Level
  if (summary.firstTry * 2 < summary.questionCount) return Math.max(1, level - 1) as Level
  return level
}

export type PickInput = {
  readonly kanji: readonly Kanji[]
  /** 覚えた字(覚えた順) */
  readonly learned: readonly string[]
  readonly stamps: Readonly<Record<string, number>>
  readonly misses: Readonly<Record<string, number>>
  readonly reviews: Reviews
  readonly today: string
  /** 日付と、あそぶ人から決まる種 */
  readonly seed: string
  /** 保護者が えらんだ字(えらんだ順)。覚えた字なら、先に出す */
  readonly homework?: readonly string[]
}

const RECENT_NEAR = 5
const RECENT_FAR = 10
const SCORE_RECENT_NEAR = 3
const SCORE_RECENT_FAR = 1
const SCORE_NO_QUIZ_STAMP = 3
const SCORE_MISSES_MAX = 3
const SCORE_REVIEW_DUE = 3
const SCORE_REVIEW_SOON = 1
const REVIEW_SOON_DAYS = 2
/** 同じ点の字が、日によって入れかわるための ゆらぎ */
const JITTER = 2

function interest(input: PickInput, char: string, index: number): number {
  const fromEnd = input.learned.length - 1 - index
  const recent = fromEnd < RECENT_NEAR ? SCORE_RECENT_NEAR : fromEnd < RECENT_FAR ? SCORE_RECENT_FAR : 0
  const noStamp = hasStamp(input.stamps[char], 'quiz') ? 0 : SCORE_NO_QUIZ_STAMP
  const misses = Math.min(input.misses[char] ?? 0, SCORE_MISSES_MAX)
  const card = input.reviews[char]
  const untilDue = card ? daysBetween(input.today, card.due) : Number.POSITIVE_INFINITY
  const due = untilDue <= 0 ? SCORE_REVIEW_DUE : untilDue <= REVIEW_SOON_DAYS ? SCORE_REVIEW_SOON : 0
  return recent + noStamp + misses + due
}

/**
 * きょう出す字を、覚えた字の中から えらぶ。
 * 最近 覚えた字・「とく」の はんこ が まだ ない字・まちがいの多い字・ふくしゅう の日が近い字を先にする。
 * 同じ種なら いつも同じ字が同じ順で出る。
 */
export function pickDailyChars(input: PickInput): string[] {
  const known = new Set(input.kanji.map((k) => k.char))
  const rng = seededRng(`${input.seed}:pick`)
  const count = dailyCount(input.learned.length)
  const learned = new Set(input.learned)
  const first = [...new Set(input.homework ?? [])].filter((char) => learned.has(char) && known.has(char)).slice(0, count)
  const taken = new Set(first)
  const ranked = input.learned
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => known.has(char))
    .map(({ char, index }) => ({ char, score: interest(input, char, index) + rng() * JITTER }))
    .sort((a, b) => b.score - a.score)
    .map(({ char }) => char)
    .filter((char) => !taken.has(char))
  const picked = [...first, ...ranked].slice(0, count)
  return shuffle(picked, seededRng(`${input.seed}:order`))
}

/** えらんだ字から、きょうの問題を作る。同じ字・同じ種なら、問題も選択肢も同じ。 */
export function dailyQuiz(picked: readonly Kanji[], allKanji: readonly Kanji[], seed: string): Question[] {
  return buildQuiz(picked, seededRng(`${seed}:quiz`), allKanji)
}

/** その日はじめて やりおえたら、次の日の むずかしさを決める。もう一度あそんだときは、かえない。 */
export function completeChallengeDay(record: ChallengeDay, level: Level, summary: QuizSummary, today: string): ChallengeDay {
  const sameDay = record.day === today
  const first = !(sameDay && record.done)
  return {
    day: today,
    level: sameDay ? record.level : level,
    next: first ? nextLevelAfter(level, summary) : record.next,
    done: true,
    chars: sameDay ? record.chars : [],
  }
}

/** その日の出題をはじめる。きょうの字がまだ決まっていなければ、決めた字を入れた きろくにする。 */
export function beginChallengeDay(record: ChallengeDay, chars: readonly string[], today: string): ChallengeDay {
  if (record.day === today && record.chars.length > 0) return record
  const level = challengeLevel(record, today)
  return { day: today, level, next: record.day === today ? record.next : level, done: record.day === today && record.done, chars }
}
