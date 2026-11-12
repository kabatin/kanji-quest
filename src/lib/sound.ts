export type SoundName =
  | 'tap'
  | 'pop'
  | 'stroke'
  | 'stamp'
  | 'ok'
  | 'retry'
  | 'fanfare'
  | 'hit'
  | 'miss'
  | 'coin'
  | 'buy'
  | 'levelup'
  | 'bossAppear'
  | 'bossDown'

/** 音の高さのある音。to があると、その高さまで すべらせる。 */
export type Tone = {
  readonly freq: number
  readonly to?: number
  readonly at: number
  readonly len: number
  readonly wave?: OscillatorType
  /** 音の大きさ(1 = ふつう) */
  readonly vol?: number
}

/** ざーっという音(風・ばくはつ・筆の音)。filter のあたりの高さだけを通す。 */
export type Noise = {
  readonly at: number
  readonly len: number
  readonly filter: number
  readonly filterTo?: number
  readonly vol?: number
}

type Sound = { readonly tones: readonly Tone[]; readonly noises?: readonly Noise[] }

// ド・ミ・ソ … の高さ(Hz)
const C5 = 523
const E5 = 659
const G5 = 784
const B5 = 988
const C6 = 1047
const E6 = 1319
const G6 = 1568

// 「もういちど」の音は、責められた感じがしないよう低くやわらかい音にする
const SOUNDS: Record<SoundName, Sound> = {
  tap: { tones: [{ freq: 620, to: 880, at: 0, len: 0.07, wave: 'triangle' }] },
  // すみまるを つついたときの、ぽよん
  pop: {
    tones: [
      { freq: 280, to: 760, at: 0, len: 0.12 },
      { freq: 760, to: 520, at: 0.1, len: 0.14, vol: 0.7 },
    ],
  },
  // 1画 書けたときの、筆の しゅっ
  stroke: { tones: [{ freq: 880, to: 1320, at: 0.02, len: 0.06, wave: 'triangle', vol: 0.5 }], noises: [{ at: 0, len: 0.12, filter: 2400, filterTo: 5200, vol: 0.5 }] },
  // はんこ を ぺたん と おす
  stamp: {
    tones: [
      { freq: 190, to: 70, at: 0, len: 0.16, vol: 1.3 },
      { freq: 1320, at: 0.03, len: 0.08, wave: 'triangle', vol: 0.35 },
    ],
    noises: [{ at: 0, len: 0.09, filter: 900, filterTo: 300, vol: 0.8 }],
  },
  ok: {
    tones: [
      { freq: E5, at: 0, len: 0.14, wave: 'triangle' },
      { freq: B5, at: 0.1, len: 0.3, wave: 'triangle' },
      { freq: B5 * 2, at: 0.1, len: 0.22, vol: 0.3 },
    ],
  },
  retry: { tones: [{ freq: 330, to: 250, at: 0, len: 0.2 }] },
  // ボスに こうげきが当たった音: ずばっ + きらん
  hit: {
    tones: [
      { freq: 520, to: 110, at: 0, len: 0.16, wave: 'sawtooth', vol: 0.7 },
      { freq: G5, at: 0.08, len: 0.1, wave: 'square', vol: 0.4 },
      { freq: G6, at: 0.14, len: 0.26, wave: 'triangle', vol: 0.6 },
    ],
    noises: [{ at: 0, len: 0.18, filter: 3200, filterTo: 600, vol: 0.9 }],
  },
  // よけられた音: ひゅるっ
  miss: {
    tones: [{ freq: 420, to: 180, at: 0.04, len: 0.3, vol: 0.7 }],
    noises: [{ at: 0, len: 0.26, filter: 900, filterTo: 2600, vol: 0.5 }],
  },
  coin: {
    tones: [
      { freq: B5, at: 0, len: 0.08, wave: 'square', vol: 0.5 },
      { freq: E6, at: 0.07, len: 0.32, wave: 'square', vol: 0.5 },
    ],
  },
  buy: {
    tones: [
      { freq: B5, at: 0, len: 0.08, wave: 'square', vol: 0.5 },
      { freq: E6, at: 0.07, len: 0.2, wave: 'square', vol: 0.5 },
      { freq: G6, at: 0.2, len: 0.12, wave: 'triangle', vol: 0.6 },
      { freq: C6 * 2, at: 0.3, len: 0.4, wave: 'triangle', vol: 0.5 },
    ],
  },
  fanfare: {
    tones: [
      { freq: C5, at: 0, len: 0.16, wave: 'triangle' },
      { freq: E5, at: 0.13, len: 0.16, wave: 'triangle' },
      { freq: G5, at: 0.26, len: 0.16, wave: 'triangle' },
      { freq: C6, at: 0.39, len: 0.6, wave: 'triangle' },
      { freq: E5, at: 0.39, len: 0.5, vol: 0.5 },
      { freq: G5, at: 0.39, len: 0.5, vol: 0.5 },
    ],
  },
  levelup: {
    tones: [
      { freq: C5, at: 0, len: 0.12, wave: 'square', vol: 0.45 },
      { freq: E5, at: 0.1, len: 0.12, wave: 'square', vol: 0.45 },
      { freq: G5, at: 0.2, len: 0.12, wave: 'square', vol: 0.45 },
      { freq: C6, at: 0.3, len: 0.12, wave: 'square', vol: 0.45 },
      { freq: E6, at: 0.4, len: 0.12, wave: 'square', vol: 0.45 },
      { freq: G6, at: 0.5, len: 0.7, wave: 'triangle' },
      { freq: C6, at: 0.5, len: 0.7, vol: 0.5 },
      { freq: E6, at: 0.5, len: 0.7, vol: 0.5 },
    ],
  },
  // ボスが あらわれた: 低い音が2つ
  bossAppear: {
    tones: [
      { freq: 147, at: 0, len: 0.34, wave: 'sawtooth', vol: 0.7 },
      { freq: 110, at: 0.28, len: 0.6, wave: 'sawtooth', vol: 0.8 },
      { freq: 220, at: 0.28, len: 0.5, vol: 0.4 },
    ],
    noises: [{ at: 0.28, len: 0.5, filter: 300, filterTo: 120, vol: 0.6 }],
  },
  // ボスを たおした: どかーん のあとに、かちどき
  bossDown: {
    tones: [
      { freq: 300, to: 50, at: 0, len: 0.5, wave: 'sawtooth', vol: 0.8 },
      { freq: C5, at: 0.5, len: 0.14, wave: 'triangle' },
      { freq: E5, at: 0.62, len: 0.14, wave: 'triangle' },
      { freq: G5, at: 0.74, len: 0.14, wave: 'triangle' },
      { freq: C6, at: 0.86, len: 0.2, wave: 'triangle' },
      { freq: G5, at: 1.04, len: 0.14, wave: 'triangle' },
      { freq: C6, at: 1.16, len: 0.8, wave: 'triangle' },
      { freq: E6, at: 1.16, len: 0.8, vol: 0.6 },
      { freq: G5, at: 1.16, len: 0.8, vol: 0.5 },
    ],
    noises: [{ at: 0, len: 0.55, filter: 1800, filterTo: 150 }],
  },
}

const VOLUME = 0.16
const NOISE_VOLUME = 0.12
/** 音の立ち上がり。0 から いきなり鳴らすと ぷつっ と聞こえるので、少しだけ時間をかける */
const ATTACK = 0.008

let context: AudioContext | undefined
let noiseBuffer: AudioBuffer | undefined

/**
 * 音を出すための AudioContext(1つを使い回す)。音が出せない環境では undefined。
 * 効果音・音楽と、読み上げ音声の音量(フェードアウト)で使う。
 */
export function audioContext(): AudioContext | undefined {
  const AudioContextClass = globalThis.AudioContext
  if (!AudioContextClass) return undefined
  context ??= new AudioContextClass()
  return context
}

/** 1秒ぶんの ざーっという音。作るのは1回だけ。 */
function noiseSource(ctx: AudioContext): AudioBufferSourceNode | undefined {
  if (typeof ctx.createBuffer !== 'function' || typeof ctx.createBufferSource !== 'function') return undefined
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer
  return source
}

/** ふっと立ち上がって、すっと消える音量の線を引く。 */
function envelope(gain: GainNode, from: number, len: number, peak: number): void {
  gain.gain.setValueAtTime(0.0001, from)
  gain.gain.exponentialRampToValueAtTime(peak, from + ATTACK)
  gain.gain.exponentialRampToValueAtTime(0.0001, from + len)
}

/** 高さのある音を1つ鳴らす。効果音と音楽の両方で使う。 */
export function playTone(ctx: AudioContext, out: AudioNode, tone: Tone, start: number, volume: number): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const from = start + tone.at
  osc.type = tone.wave ?? 'sine'
  osc.frequency.setValueAtTime(tone.freq, from)
  if (tone.to !== undefined) osc.frequency.exponentialRampToValueAtTime(tone.to, from + tone.len)
  envelope(gain, from, tone.len, volume * (tone.vol ?? 1))
  osc.connect(gain)
  gain.connect(out)
  osc.start(from)
  osc.stop(from + tone.len + 0.02)
}

/** ざーっという音を1つ鳴らす。鳴らせない環境では何もしない。 */
export function playNoise(ctx: AudioContext, out: AudioNode, noise: Noise, start: number, volume: number): void {
  const source = noiseSource(ctx)
  if (!source || typeof ctx.createBiquadFilter !== 'function') return
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const from = start + noise.at
  filter.type = 'bandpass'
  filter.Q.value = 0.9
  filter.frequency.setValueAtTime(noise.filter, from)
  if (noise.filterTo !== undefined) filter.frequency.exponentialRampToValueAtTime(noise.filterTo, from + noise.len)
  envelope(gain, from, noise.len, volume * (noise.vol ?? 1))
  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(from)
  source.stop(from + noise.len + 0.02)
}

/** 効果音を鳴らす。鳴らせたら true。音が出せない環境では何もしない。 */
export function playSound(name: SoundName, enabled: boolean): boolean {
  if (!enabled) return false
  const ctx = audioContext()
  if (!ctx) return false
  // 画面を切りかえて もどってきたあとなどは止まっていることがあるので、起こしておく
  if (ctx.state === 'suspended') void ctx.resume()
  const start = ctx.currentTime
  const sound = SOUNDS[name]
  for (const tone of sound.tones) playTone(ctx, ctx.destination, tone, start, VOLUME)
  for (const noise of sound.noises ?? []) playNoise(ctx, ctx.destination, noise, start, NOISE_VOLUME)
  return true
}
