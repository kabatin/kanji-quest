const SPEECH_LANG = 'ja-JP'
const SPEECH_RATE = 0.85

/** ブラウザの読み上げ機能で読む。読み上げを始められたら true。 */
export function speak(text: string, enabled: boolean): boolean {
  if (!enabled) return false
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = SPEECH_LANG
  utterance.rate = SPEECH_RATE
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
