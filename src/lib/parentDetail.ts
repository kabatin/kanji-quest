import type { CharHistory } from './charHistory'
import { daysBetween } from './date'
import { formatDay, formatMinutes } from './parentReport'
import type { PlayStatus } from './playLimit'

/**
 * 保護者の画面の ことば(字の くわしい記録・1日の時間)。おとな向けの ふつうの文。
 */

/** 覚えた日 */
export function learnedOnText(history: CharHistory): string {
  if (history.learnedOn) return formatDay(history.learnedOn)
  return history.state === 'none' ? 'まだ学んでいません' : '記録をとりはじめる前'
}

/** 次の復習の日 */
export function reviewText(history: CharHistory, today: string): string {
  if (history.nextReview === null) return history.state === 'none' ? '学ぶと、次の日から復習に出ます' : '予定はありません'
  const days = daysBetween(today, history.nextReview)
  if (days <= 0) return 'きょう(復習の日が来ています)'
  const day = formatDay(history.nextReview)
  if (days === 1) return `あした(${day})`
  const when = `${day}(${days}日後)`
  return history.reviewMastered ? `${when}・覚えきった字なので、ときどき出します` : when
}

/** これまでの 答えの数と まちがい */
export function missText(history: CharHistory): string {
  if (!history.logged) return '記録をとりはじめてからは、まだありません'
  const wrong = history.wrong > 0 ? `${history.wrong}回まちがえました` : 'まちがいはありません'
  return `これまで${history.answered}問に答え、${wrong}`
}

/** 苦手なら、その説明 */
export function weakText(history: CharHistory): string | null {
  if (!history.weak) return null
  return `いま苦手な字です。正解するたびに1つ減り、あと${history.misses}回の正解で苦手でなくなります。`
}

/** きょうの 遊んだ時間と、あと何分 */
export function playTimeText(status: PlayStatus): string {
  const used = `きょうは${formatMinutes(status.used)}遊`
  if (!status.limited || status.left === null) return `上限はありません。${used}びました。`
  if (status.reached) return `${used}び、上限に達しました。延長すると、すぐに続けられます。`
  const extra = status.extra > 0 ? `(きょうだけ${formatMinutes(status.extra)}延長しています)` : ''
  return `${used}びました。あと${formatMinutes(status.left)}遊べます${extra}。`
}
