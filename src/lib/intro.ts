/**
 * はじめての あんない(すみまるが 1字を いっしょに まなびながら 教える)の 流れ。
 * どの吹き出しを 次に出すか、を決める純粋な関数だけを置く(画面は features/intro)。
 */

/** あんないの 吹き出し。見おえたものは、プロフィールごとに ほぞんする。 */
export type IntroTip = 'handed' | 'story' | 'kumi' | 'kaku' | 'forest' | 'kanji' | 'next'

export type IntroState = {
  /** あんないを 見おえた(とばした)。もう出さない */
  readonly done: boolean
  /** 見おえた吹き出し(とちゅうで閉じても、つづきから) */
  readonly seen: readonly IntroTip[]
}

export const INTRO_TIPS: readonly IntroTip[] = ['handed', 'story', 'kumi', 'kaku', 'forest', 'kanji', 'next']

/** 学ぶ画面の 吹き出し(ステップ名 → 吹き出し) */
export const LEARN_TIPS = { story: 'story', kumi: 'kumi', kaku: 'kaku' } as const

/** 学びおえて ホームに もどったときの 吹き出し(出す順) */
export const HOME_TIPS: readonly IntroTip[] = ['forest', 'kanji', 'next']

export const INITIAL_INTRO: IntroState = { done: false, seen: [] }

/** 保存してあった値が こわれていても つかえる形にする(なかったら はじめの状態)。 */
export function sanitizeIntro(value: unknown): IntroState {
  if (typeof value !== 'object' || value === null) return INITIAL_INTRO
  const { done, seen } = value as { done?: unknown; seen?: unknown }
  const known = Array.isArray(seen) ? INTRO_TIPS.filter((tip) => seen.includes(tip)) : []
  return { done: done === true, seen: known }
}

/** あんないを いま出す対象か。覚えた字が0で まだ見おえていない子と、とちゅうで閉じた子。 */
export function introActive(learnedCount: number, intro: IntroState): boolean {
  return !intro.done && (learnedCount === 0 || intro.seen.length > 0)
}

/** さいしょの「あいさつ と ききて」の画面を出すか。 */
export function needsWelcome(learnedCount: number, intro: IntroState): boolean {
  return introActive(learnedCount, intro) && !intro.seen.includes('handed')
}

/** 学ぶ画面の ステップに合う吹き出し。出さないときは null。 */
export function learnTip(step: string, learnedCount: number, intro: IntroState): IntroTip | null {
  if (!(step in LEARN_TIPS) || !introActive(learnedCount, intro) || !intro.seen.includes('handed')) return null
  const tip = LEARN_TIPS[step as keyof typeof LEARN_TIPS]
  return intro.seen.includes(tip) ? null : tip
}

/** ホームで 次に出す吹き出し。1字おぼえたあとで、まだ見ていない 先頭の1つ。 */
export function homeTip(learnedCount: number, intro: IntroState): IntroTip | null {
  if (learnedCount < 1 || !introActive(learnedCount, intro) || !intro.seen.includes('handed')) return null
  return HOME_TIPS.find((tip) => !intro.seen.includes(tip)) ?? null
}

/** 吹き出しを 見おえた印をつける。ホームの 3つが そろったら、あんない ぜんぶ おしまい。 */
export function markSeen(intro: IntroState, tip: IntroTip): IntroState {
  if (intro.seen.includes(tip)) return intro
  const seen = [...intro.seen, tip]
  return { done: HOME_TIPS.every((t) => seen.includes(t)), seen }
}

/** あんないを とばす。 */
export function skipIntro(intro: IntroState): IntroState {
  return { ...intro, done: true }
}
