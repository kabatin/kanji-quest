/** ききて。みぎ = 書く場所が みぎ、せつめいと ボタンが ひだり。ひだり は その逆。 */
export type Handed = 'right' | 'left'

/** ボタンの ならび: 画面の左に ひだり、右に みぎ(手の ならび と 同じ)。 */
export const HANDEDS: readonly Handed[] = ['left', 'right']

/** 保存してあった値が こわれていたら「みぎ」にする。 */
export function sanitizeHanded(value: unknown): Handed {
  return value === 'left' ? 'left' : 'right'
}
