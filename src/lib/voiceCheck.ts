// 音声チェックの部品。中身は scripts/voice-logic.mjs(Node の scripts と共有)。画面からは ここを通して使う。
import type { Clip } from '../../scripts/voice-logic.mjs'

export * from '../../scripts/voice-logic.mjs'

/** 目で・耳で たしかめた きろく(この端末の ブラウザに のこす) */
export type VoiceReview = { readonly flag?: boolean; readonly ok?: boolean; readonly memo?: string }
export type VoiceReviews = Readonly<Record<string, VoiceReview>>

export const VOICE_REVIEW_KEY = 'kanji-voice-review'

export function loadVoiceReviews(): VoiceReviews {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VOICE_REVIEW_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as VoiceReviews) : {}
  } catch {
    // こわれた きろく は すてて、はじめから
    return {}
  }
}

/** 「なおしたい」クリップを、指揮役(AI)に そのまま わたせる文にする。 */
export function voiceReport(reviews: VoiceReviews, clips: readonly Clip[]): string {
  const lines = clips
    .filter((clip) => reviews[clip.id]?.flag)
    .map((clip) => `- ${clip.id}(${clip.char})「${clip.text}」: ${reviews[clip.id]?.memo?.trim() || '(メモなし)'}`)
  if (lines.length === 0) return ''
  return `音声で なおしたい所(クリップ ID・文・メモ):\n${lines.join('\n')}`
}
