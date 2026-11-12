import { addDays, daysBetween } from '../lib/date'
import { afterReview, type Reviews } from '../lib/review'

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
}

export const EMPTY_RECORDS: Records = { reviews: {}, learnedOn: {}, misses: {}, playMinutes: {}, partClaims: [] }

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

/** ふくしゅう の結果を、字ごとの予定に反映する。 */
export function applyReview(reviews: Reviews, right: readonly string[], wrong: readonly string[], today: string): Reviews {
  return {
    ...reviews,
    ...Object.fromEntries(right.map((char) => [char, afterReview(reviews[char], true, today)])),
    ...Object.fromEntries(wrong.map((char) => [char, afterReview(reviews[char], false, today)])),
  }
}

/** その日の あそんだ分数を ふやす。古い日の きろくは消す。 */
export function addPlayMinutes(log: Readonly<Record<string, number>>, today: string, minutes: number): Record<string, number> {
  const oldest = addDays(today, -PLAY_LOG_DAYS)
  const kept = Object.entries(log).filter(([day]) => daysBetween(oldest, day) > 0)
  return { ...Object.fromEntries(kept), [today]: (log[today] ?? 0) + minutes }
}
