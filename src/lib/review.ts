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

/** 答え方。select = えらぶ / model = 見本を見て書く / blind = 見本なしで書く */
export type AnswerKind = 'select' | 'model' | 'blind'

/** その段の ふくしゅう で出す 答え方(buildReviewQuestion と同じ きまり)。 */
export function kindForStep(step: number): AnswerKind {
  if (step === 1) return 'model'
  if (step >= 3) return 'blind'
  return 'select'
}

/** ヒントを使った と みなす段(3 = 1画を うごかして見せる。lib/strokeHint の MODEL_HINT と同じ) */
export const HINTED_LEVEL = 3
/** 見ないで書く段で、ヒントを使って書けた字を もう一度出すまでの日数 */
export const HINT_RETRY_DAYS = 1

/** 1問ぶんの答え。kind・hint は、わかるときだけ(古い呼び方では ない) */
export type ReviewAnswer = { readonly ok: boolean; readonly kind?: AnswerKind; readonly hint?: number }
export type CharAnswer = ReviewAnswer & { readonly char: string }

export const isHinted = (hint: number | undefined): boolean => hint !== undefined && hint >= HINTED_LEVEL

const KIND_RANK: Readonly<Record<AnswerKind, number>> = { select: 0, model: 1, blind: 2 }

/**
 * 1つの答えで、ふくしゅう の予定を決める。
 * まちがい → 次の日から やりなおし。種類が わからない正解 → これまでどおり 1段進む。
 * 段が求める答え方に 足りない正解(書く段で えらぶ など)→ 何も変えない(期日も そのまま)。
 * 見ないで書く段で ヒントを使った正解 → 段は そのままで、みじかい間隔で もう一度出す。
 */
export function judgeReview(card: ReviewCard | undefined, answer: ReviewAnswer, today: string): ReviewCard {
  if (!answer.ok) return afterReview(card, false, today)
  if (answer.kind === undefined || card === undefined) return afterReview(card, true, today)
  const need = kindForStep(card.step)
  if (KIND_RANK[answer.kind] < KIND_RANK[need]) return card
  if (need === 'blind' && isHinted(answer.hint)) return { due: addDays(today, HINT_RETRY_DAYS), step: card.step }
  return afterReview(card, true, today)
}

/** 答えの強さ(見ないで書く・ヒントなし が いちばん強い) */
const strength = (answer: ReviewAnswer): number => (answer.kind === undefined ? 3 : KIND_RANK[answer.kind]) * 2 + (isHinted(answer.hint) ? 0 : 1)

/** 字ごとの、いちばん強い 正解(1回の あそびで 同じ字を 何問か といたとき)。 */
export function bestAnswers(answers: readonly CharAnswer[]): Map<string, ReviewAnswer> {
  const best = new Map<string, ReviewAnswer>()
  for (const answer of answers) {
    const before = best.get(answer.char)
    if (answer.ok && (!before || strength(answer) > strength(before))) best.set(answer.char, answer)
  }
  return best
}

/**
 * ふくしゅう の日が来ている字を、ほかの あそび(ボス・チャレンジ・にがて れんしゅう)で まちがえずに できたら、
 * ふくしゅう したことにして 次の間隔へ すすめる(同じ日に 同じ字を 2回 やらせない)。
 * answers を渡すと、答え方を見る(書く段の字は、えらぶ問題の正解では 進まない)。渡さなければ これまでどおり。
 */
export function creditReviews(reviews: Reviews, chars: readonly string[], today: string, answers?: readonly CharAnswer[]): Reviews {
  const due = [...new Set(chars)].filter((char) => reviews[char] !== undefined && daysBetween(reviews[char].due, today) >= 0)
  if (due.length === 0) return reviews
  const best = bestAnswers(answers ?? [])
  return { ...reviews, ...Object.fromEntries(due.map((char) => [char, judgeReview(reviews[char], best.get(char) ?? { ok: true }, today)])) }
}

/** ふくしゅう の画面が 種類を渡さないときの答え(問題は 段で決まるので、段から 答え方が分かる)。 */
export function reviewAnswersOf(reviews: Reviews, right: readonly string[], wrong: readonly string[]): (CharAnswer & { readonly kind: AnswerKind })[] {
  const of = (char: string, ok: boolean) => ({ char, ok, kind: kindForStep(reviews[char]?.step ?? 0) })
  return [...right.map((char) => of(char, true)), ...wrong.map((char) => of(char, false))]
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
