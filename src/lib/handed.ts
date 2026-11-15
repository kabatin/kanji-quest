/** ききて。みぎ = 書く場所が みぎ、せつめいと ボタンが ひだり。ひだり は その逆。 */
export type Handed = 'right' | 'left'

export const HANDEDS: readonly Handed[] = ['right', 'left']

/** 保存してあった値が こわれていたら「みぎ」にする。 */
export function sanitizeHanded(value: unknown): Handed {
  return value === 'left' ? 'left' : 'right'
}
