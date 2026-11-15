import { logAnswers, markWeakExits, type AnswerBook, type AnswerDays, type AnswerInput, type AnswerLog, type AnswerWhere } from '../lib/answerLog'
import { addDays, daysBetween } from '../lib/date'
import { noteHands, type Hands } from '../lib/handwriting'
import { afterReview, bestAnswers, judgeReview, type CharAnswer, type Reviews } from '../lib/review'

/**
 * おうちの かた向けの きろく と、ふくしゅう の きろく。
 * ストア(progress.ts)が大きくならないよう、計算だけを ここに置く。
 */
export type Records = {
  /** 漢字ごとの ふくしゅう の予定 */
  readonly reviews: Reviews
  /** はじめて覚えた日 */
  readonly learnedOn: Readonly<Record<string, string>>
  /** まちがえた回数(ふくしゅう・ボス)。できると へっていく */
  readonly misses: Readonly<Record<string, number>>
  /** 日ごとの あそんだ分数 */
  readonly playMinutes: Readonly<Record<string, number>>
  /** ごほうびを受け取った、コンプリートした パーツ */
  readonly partClaims: readonly string[]
  /** 字ごとの 答えの きろく(lib/answerLog) */
  readonly answerLog: AnswerLog
  /** 日ごとの 答えの集計(lib/answerLog) */
  readonly answerDays: AnswerDays
  /** 書いた字(はじめて 見ないで書けた日の字と、いちばん新しい字。lib/handwriting) */
  readonly hands: Hands
}

export const EMPTY_RECORDS: Records = { reviews: {}, learnedOn: {}, misses: {}, playMinutes: {}, partClaims: [], answerLog: {}, answerDays: {}, hands: {} }

/** あそんだ時間は、この日数ぶんだけ のこす */
export const PLAY_LOG_DAYS = 60

/** まちがえた字の回数をふやし、できた字は へらす(0 になったら消す)。 */
export function updateMisses(misses: Readonly<Record<string, number>>, wrong: readonly string[], right: readonly string[]): Record<string, number> {
  const next: Record<string, number> = { ...misses }
  for (const char of wrong) next[char] = (next[char] ?? 0) + 1
  for (const char of right) {
    const count = (next[char] ?? 0) - 1
    if (count > 0) next[char] = count
    else delete next[char]
  }
  return next
}

/**
 * ふくしゅう の結果を、字ごとの予定に反映する。
 * answers を渡すと 答え方を見る(見ないで書く段で ヒントを使った正解は、段を進めず みじかい間隔で もう一度出す)。
 */
export function applyReview(reviews: Reviews, right: readonly string[], wrong: readonly string[], today: string, answers?: readonly CharAnswer[]): Reviews {
  const best = bestAnswers(answers ?? [])
  // 日が来ていない字(保護者が えらんだ字)は、正解しても 段を進めない
  const due = right.filter((char) => reviews[char] === undefined || daysBetween(reviews[char].due, today) >= 0)
  return {
    ...reviews,
    ...Object.fromEntries(due.map((char) => [char, judgeReview(reviews[char], best.get(char) ?? { ok: true }, today)])),
    ...Object.fromEntries(wrong.map((char) => [char, afterReview(reviews[char], false, today)])),
  }
}

/** その日の あそんだ分数を ふやす。古い日の きろくは消す。 */
export function addPlayMinutes(log: Readonly<Record<string, number>>, today: string, minutes: number): Record<string, number> {
  const oldest = addDays(today, -PLAY_LOG_DAYS)
  const kept = Object.entries(log).filter(([day]) => daysBetween(oldest, day) > 0)
  return { ...Object.fromEntries(kept), [today]: (log[today] ?? 0) + minutes }
}

/** 答えを のこすときに読む、ストアの 前の状態 */
export type LogState = Records & { readonly stamps: Readonly<Record<string, number>> }

/**
 * 1回の あそび ぶんの答えを のこす。missesAfter を渡すと、苦手から ぬけた字に その日を しるす。
 * state は 変える前の状態(ログがない字は、ここの はんこ・ふくしゅう の段から 書く力を 引きつぐ)。
 */
export function withAnswers(
  state: LogState,
  where: AnswerWhere,
  answers: readonly AnswerInput[],
  today: string,
  missesAfter?: Readonly<Record<string, number>>,
): AnswerBook {
  const seed = { stamps: state.stamps, reviews: state.reviews, learnedOn: state.learnedOn }
  const book = logAnswers({ answerLog: state.answerLog, answerDays: state.answerDays }, where, answers, today, seed)
  if (!missesAfter) return book
  return { ...book, answerLog: markWeakExits(book.answerLog, state.misses, missesAfter, today, seed) }
}

/** 見ないで書けた答えの 筆跡を、書いた字として のこす(ストアの 前の状態の hands に 重ねる) */
export const withHands = (hands: Hands, answers: readonly AnswerInput[], today: string): Hands => noteHands(hands, answers, today)
