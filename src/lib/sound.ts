export type SoundName = 'tap' | 'ok' | 'retry' | 'fanfare'

type Note = { readonly freq: number; readonly at: number; readonly len: number }

// 「もういちど」の音は、責められた感じがしないよう低くやわらかい1音にする
const SOUNDS: Record<SoundName, readonly Note[]> = {
  tap: [{ freq: 520, at: 0, len: 0.06 }],
  ok: [
    { freq: 660, at: 0, len: 0.12 },
    { freq: 990, at: 0.11, len: 0.22 },
  ],
  retry: [{ freq: 300, at: 0, len: 0.16 }],
  fanfare: [
    { freq: 523, at: 0, len: 0.14 },
    { freq: 659, at: 0.13, len: 0.14 },
    { freq: 784, at: 0.26, len: 0.14 },
    { freq: 1047, at: 0.39, len: 0.36 },
  ],
}

const VOLUME = 0.18

let context: AudioContext | undefined

/** 効果音を鳴らす。鳴らせたら true。音が出せない環境では何もしない。 */
export function playSound(name: SoundName, enabled: boolean): boolean {
  if (!enabled) return false
  const AudioContextClass = globalThis.AudioContext
  if (!AudioContextClass) return false
  context ??= new AudioContextClass()
  const ctx = context
  const start = ctx.currentTime
  for (const note of SOUNDS[name]) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = note.freq
    gain.gain.setValueAtTime(VOLUME, start + note.at)
    gain.gain.exponentialRampToValueAtTime(0.001, start + note.at + note.len)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start + note.at)
    osc.stop(start + note.at + note.len)
  }
  return true
}
