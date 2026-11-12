/** 目で見て たしかめた きろく(この端末の ブラウザに のこす)。flag = なおしたい / ok = よい */
export type Review = { readonly flag?: boolean; readonly ok?: boolean; readonly memo?: string }
export type Reviews = Readonly<Record<string, Review>>

export const REVIEW_KEY = 'kanji-scene-review'

export function loadReviews(): Reviews {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REVIEW_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Reviews) : {}
  } catch {
    // こわれた きろく は すてて、はじめから
    return {}
  }
}

/** 「なおしたい」字を、1行に1字で 文に する(そのまま 人や AI に わたせる形)。 */
export function reviewReport(reviews: Reviews, order: readonly string[]): string {
  return order
    .filter((char) => reviews[char]?.flag)
    .map((char) => `${char}: ${reviews[char]?.memo?.trim() || '(メモなし)'}`)
    .join('\n')
}
