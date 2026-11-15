import manifest from '../assets/voice-manifest.json'
import { duckMusic } from './music'
import { audioContext } from './sound'
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

/** 画面をはなれたとき、音声が消えていくまでの時間 */
export const VOICE_FADE_MS = 450
const FADE_STEPS = 9

// iPad では、一度タップで再生した Audio 要素でないと自動再生できないので、1つを使い回す
let player: HTMLAudioElement | undefined
// iPad は Audio 要素の音量を変えられないので、音量は Web Audio の GainNode で下げる
let gain: GainNode | undefined
let fadeTimer: ReturnType<typeof setInterval> | undefined
/** 設定の こえ の大きさ(1 = ふつう)。さいごに 鳴らしたときの値 */
let voiceScale = 1

/** 音声を GainNode につなぐ(1回だけ)。AudioContext が動いていないうちは つながない(音が出なくなるため)。 */
function connectGain(element: HTMLAudioElement): void {
  if (gain) return
  const ctx = audioContext()
  if (!ctx || ctx.state !== 'running' || typeof ctx.createMediaElementSource !== 'function') return
  try {
    const node = ctx.createGain()
    ctx.createMediaElementSource(element).connect(node)
    node.connect(ctx.destination)
    gain = node
  } catch {
    // つなげない環境では、Audio 要素の音量で代わりにする
    gain = undefined
  }
}

/** こえ を鳴らす Audio 要素。こえ が流れている間は、うしろの音楽を小さくする。 */
function createPlayer(): HTMLAudioElement {
  const element = new Audio()
  element.addEventListener('playing', () => duckMusic(true))
  for (const done of ['ended', 'pause', 'error']) element.addEventListener(done, () => duckMusic(false))
  return element
}

/** volume は 0〜1 の ふえーど の割合。設定の大きさを かけて、Audio 要素は 1 までに おさえる。 */
function setVolume(element: HTMLAudioElement, volume: number): void {
  const level = volume * voiceScale
  if (gain) gain.gain.value = level
  else element.volume = Math.min(1, level)
}

function cancelFade(): void {
  if (fadeTimer !== undefined) clearInterval(fadeTimer)
  fadeTimer = undefined
  if (player) setVolume(player, 1)
}

/**
 * 事前に作った音声を再生する。クリップがないときはブラウザの読み上げで代わりに読む。
 * どの方法で鳴らしたかを返す。
 */
export function playVoice(clipId: string, fallbackText: string, enabled: boolean, scale = 1): VoiceResult {
  if (!enabled) return 'none'
  voiceScale = scale
  if (!CLIPS.has(clipId) || typeof Audio === 'undefined') {
    return speak(fallbackText, true, scale) ? 'speech' : 'none'
  }
  player ??= createPlayer()
  cancelFade()
  connectGain(player)
  const ctx = gain ? audioContext() : undefined
  if (ctx && ctx.state !== 'running') void ctx.resume()
  player.src = `${import.meta.env.BASE_URL}voice/${clipId}.mp3`
  player.play()?.catch((error: unknown) => {
    // 次の音声に切り替わって中断されたとき(AbortError)などは何もしない。
    // ファイルを読めなかったときだけ、読み上げで代わりに読む。
    if (error instanceof DOMException && error.name === 'NotSupportedError') speak(fallbackText, true, scale)
  })
  return 'clip'
}

/**
 * 流れている音声を止める。ぶつっと切らずに、少しの時間をかけて小さくしてから止める。
 * 画面をはなれるとき(もどる など)に呼ぶ。
 */
export function stopVoice(fadeMs: number = VOICE_FADE_MS): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  const element = player
  if (!element || element.paused || fadeTimer !== undefined) return
  let step = 0
  fadeTimer = setInterval(() => {
    step += 1
    if (step < FADE_STEPS) {
      setVolume(element, 1 - step / FADE_STEPS)
      return
    }
    element.pause()
    cancelFade()
  }, fadeMs / FADE_STEPS)
}
