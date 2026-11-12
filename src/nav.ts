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
  | { readonly name: 'parent-gate' }
  | { readonly name: 'parent' }

export const HOME: Screen = { name: 'home' }
