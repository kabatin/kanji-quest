const MS_PER_DAY = 86_400_000

/** 端末の時刻での「きょう」を YYYY-MM-DD で返す。 */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const toNoon = (key: string): number => new Date(`${key}T12:00:00`).getTime()

/** today が prev のちょうど次の日か。 */
export function isNextDay(prev: string, today: string): boolean {
  return Math.round((toNoon(today) - toNoon(prev)) / MS_PER_DAY) === 1
}

/** 文字列から、いつも同じ結果になる数を作る(その日のミッション選びなどに使う)。 */
export function hashString(text: string): number {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
