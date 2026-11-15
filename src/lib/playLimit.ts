/**
 * 1日に あそべる時間(おうちの かた が 子どもごとに決める)と、きょうだけの延長。
 * ここは 判定だけ。上限に来たときに 画面を どう おえるかは 画面の側で決める。
 */

/** 1日の時間(分)。0 = なし */
export const PLAY_LIMIT_CHOICES = [0, 15, 30, 45, 60] as const
export type PlayLimit = (typeof PLAY_LIMIT_CHOICES)[number]
export const PLAY_LIMIT_DEFAULT: PlayLimit = 0

/** 延長で 足せる分数の ボタン */
export const PLAY_EXTRA_CHOICES = [10, 15, 30] as const
/** 1日に 足せる延長の 合計の上限 */
export const PLAY_EXTRA_MAX = 120

/** きょうだけの延長。day と ちがう日には 0分 */
export type PlayExtra = { readonly day: string; readonly minutes: number }

export function extraToday(extra: PlayExtra | undefined, today: string): number {
  return extra && extra.day === today ? extra.minutes : 0
}

/** きょうの延長に minutes 分 足す(マイナスで へらす)。0分〜上限に おさめる */
export function addExtra(extra: PlayExtra | undefined, minutes: number, today: string): PlayExtra {
  const now = extraToday(extra, today)
  const step = Number.isFinite(minutes) ? Math.round(minutes) : 0
  return { day: today, minutes: Math.min(Math.max(now + step, 0), PLAY_EXTRA_MAX) }
}

export type PlayStatus = {
  /** 1日の時間が 決まっているか */
  readonly limited: boolean
  /** 1日の時間(延長なし)。なし なら 0 */
  readonly base: number
  /** きょうの延長 */
  readonly extra: number
  /** きょう あそべる分数(延長こみ)。なし なら null */
  readonly limit: number | null
  /** きょう あそんだ分数 */
  readonly used: number
  /** きょう あと何分。なし なら null */
  readonly left: number | null
  /** 上限に来たか */
  readonly reached: boolean
}

export type PlayStatusInput = {
  readonly limit: PlayLimit
  readonly extra?: PlayExtra
  /** 日ごとの あそんだ分数(進みぐあいの playMinutes) */
  readonly playMinutes: Readonly<Record<string, number>>
  readonly today: string
}

export function playStatus({ limit, extra, playMinutes, today }: PlayStatusInput): PlayStatus {
  const used = playMinutes[today] ?? 0
  if (limit === 0) return { limited: false, base: 0, extra: 0, limit: null, used, left: null, reached: false }
  const added = extraToday(extra, today)
  const total = limit + added
  return { limited: true, base: limit, extra: added, limit: total, used, left: Math.max(total - used, 0), reached: used >= total }
}
