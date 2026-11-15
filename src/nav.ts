import type { TrackName } from './lib/music'

/** アプリの画面。App が「いま開いている画面の重なり」として持つ。 */
export type Screen =
  | { readonly name: 'home' }
  | { readonly name: 'map'; readonly area: number }
  | { readonly name: 'stage'; readonly id: string }
  | { readonly name: 'boss'; readonly id: string }
  | { readonly name: 'exam'; readonly grade: number }
  | { readonly name: 'learn'; readonly char: string; readonly stageId?: string }
  | { readonly name: 'challenge' }
  | { readonly name: 'zukan' }
  | { readonly name: 'parts' }
  | { readonly name: 'shop' }
  | { readonly name: 'settings' }
  | { readonly name: 'profiles' }
  | { readonly name: 'review' }
  | { readonly name: 'weak' }
  | { readonly name: 'parent-gate' }
  | { readonly name: 'parent' }
  /** 1日の時間の上限に来た「きょうは ここまで」と、おうちの かた向けの延長 */
  | { readonly name: 'limit' }
  | { readonly name: 'extend' }

export const HOME: Screen = { name: 'home' }

/**
 * 画面ごとの音楽。学ぶ・ふくしゅう の間は、こえ(ものがたり・よみ)を よく聞けるよう 流さない。
 */
export function trackFor(name: Screen['name']): TrackName | undefined {
  if (name === 'boss' || name === 'exam') return 'boss'
  if (name === 'map' || name === 'stage' || name === 'challenge') return 'adventure'
  if (name === 'learn' || name === 'review' || name === 'weak' || name === 'parent' || name === 'parent-gate' || name === 'profiles' || name === 'limit' || name === 'extend') return undefined
  return 'home'
}
