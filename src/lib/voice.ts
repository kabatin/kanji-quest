import manifest from '../assets/voice-manifest.json'
import { speak } from './speech'

const CLIPS: ReadonlySet<string> = new Set(manifest.clips)

const codepoint = (char: string): string => (char.codePointAt(0) ?? 0).toString(16)

/** 事前に作った音声クリップの ID。決め方は scripts/build-voice.mjs と同じ。 */
export const voiceId = {
  word: (char: string) => `word-${codepoint(char)}`,
  explain: (char: string) => `explain-${codepoint(char)}`,
  goal: (char: string, stepIndex: number) => `goal-${codepoint(char)}-${stepIndex}`,
}

export type VoiceResult = 'clip' | 'speech' | 'none'

// iPad では、一度タップで再生した Audio 要素でないと自動再生できないので、1つを使い回す
let player: HTMLAudioElement | undefined

/**
 * 事前に作った音声を再生する。クリップがないときはブラウザの読み上げで代わりに読む。
 * どの方法で鳴らしたかを返す。
 */
export function playVoice(clipId: string, fallbackText: string, enabled: boolean): VoiceResult {
  if (!enabled) return 'none'
  if (!CLIPS.has(clipId) || typeof Audio === 'undefined') {
    return speak(fallbackText, true) ? 'speech' : 'none'
  }
  player ??= new Audio()
  player.src = `${import.meta.env.BASE_URL}voice/${clipId}.mp3`
  player.play()?.catch((error: unknown) => {
    // 次の音声に切り替わって中断されたとき(AbortError)などは何もしない。
    // ファイルを読めなかったときだけ、読み上げで代わりに読む。
    if (error instanceof DOMException && error.name === 'NotSupportedError') speak(fallbackText, true)
  })
  return 'clip'
}
