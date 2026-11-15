export const POINTS_FIRST_TRY = 10
export const POINTS_RETRY = 5

/** ヒントの量。1 = 絵あり / 2 = 絵なし / 3 = 形だけ */
export const LEVELS = [1, 2, 3] as const
export type Level = (typeof LEVELS)[number]

export type Best = { readonly score: number; readonly timeMs: number }

/** 自己ベストは「ヒントの量 x 問題の数」ごとに持つ(問題の数が違う記録はくらべられないため)。 */
export function bestKey(level: Level, questionCount: number): string {
  return `${level}x${questionCount}`
}

/** まちがえても減点はしない。1回で当てたら少し多くもらえるだけ。 */
export function questionPoints(mistakes: number): number {
  return mistakes === 0 ? POINTS_FIRST_TRY : POINTS_RETRY
}

/** 点が高いほうがよい。同点ならタイムが短いほうがよい。 */
export function isBetter(candidate: Best, current: Best | undefined): boolean {
  if (!current) return true
  if (candidate.score !== current.score) return candidate.score > current.score
  return candidate.timeMs < current.timeMs
}

export function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
