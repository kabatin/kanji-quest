import { audioContext, playNoise, playTone } from './sound'

/**
 * うしろで流れる音楽。音のファイルは使わず、その場で音を作って鳴らす
 * (アプリが重くならず、電波がなくても鳴る)。
 *   home = ホームや ずかん / adventure = ぼうけん・チャレンジ / boss = ボスとの たたかい
 */
export type TrackName = 'home' | 'adventure' | 'boss'

type Note = { readonly step: number; readonly midi: number; readonly steps: number }

type Part = {
  readonly notes: readonly Note[]
  readonly wave: OscillatorType
  readonly vol: number
  /** 音の長さを、楽譜の長さの何倍で鳴らすか(1 より小さいと、はずむ) */
  readonly gate: number
}

export type Track = {
  /** 1分あたりの拍の数 */
  readonly bpm: number
  /** ひとまわりの長さ(8分音符の数) */
  readonly length: number
  readonly parts: readonly Part[]
  /** たいこ: k = どん / h = ちっ / . = なし(8分音符ごと) */
  readonly drums?: string
}

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** 「C4」「F#5」のような名前を、音の番号(MIDI)に直す。 */
export function midiOf(name: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(name)
  if (!match) throw new Error(`音の名前が正しくありません: ${name}`)
  return NOTE_OFFSETS[match[1]] + (match[2] ? 1 : 0) + (Number(match[3]) + 1) * 12
}

export const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12)

/**
 * 楽譜の文字列を音の ならび に直す。8分音符ごとに空白で区切る。
 *   音の名前 = その音を鳴らす / . = 前の音を のばす / - = 休み / | = 小節の区切り(見やすさのため)
 */
export function parseScore(score: string): Note[] {
  const tokens = score.split(/\s+/).filter((token) => token !== '' && token !== '|')
  return tokens.reduce<Note[]>((notes, token, step) => {
    if (token === '-') return notes
    const last = notes[notes.length - 1]
    if (token === '.') return last && last.step + last.steps === step ? [...notes.slice(0, -1), { ...last, steps: last.steps + 1 }] : notes
    return [...notes, { step, midi: midiOf(token), steps: 1 }]
  }, [])
}

const part = (score: string, wave: OscillatorType, vol: number, gate = 0.92): Part => ({ notes: parseScore(score), wave, vol, gate })

export const TRACKS: Record<TrackName, Track> = {
  // のんびり: しまで ひとやすみ
  home: {
    bpm: 88,
    length: 64,
    parts: [
      part(
        `E5 . G5 . A5 . G5 . | E5 . D5 . C5 . . - | D5 . E5 . G5 . E5 . | D5 . . . - - - -
         E5 . G5 . C6 . A5 . | G5 . E5 . G5 . . - | A5 . G5 . E5 . D5 . | C5 . . . - - - -`,
        'triangle',
        1,
      ),
      part(
        `C4 E4 G4 E4 C4 E4 G4 E4 | A3 C4 E4 C4 A3 C4 E4 C4 | F3 A3 C4 A3 F3 A3 C4 A3 | G3 B3 D4 B3 G3 B3 D4 B3
         C4 E4 G4 E4 C4 E4 G4 E4 | A3 C4 E4 C4 A3 C4 E4 C4 | F3 A3 C4 A3 G3 B3 D4 B3 | C4 E4 G4 E4 C4 . . -`,
        'sine',
        0.45,
        0.7,
      ),
      part(
        `C3 . . . G2 . . . | A2 . . . E2 . . . | F2 . . . C3 . . . | G2 . . . . . . .
         C3 . . . G2 . . . | A2 . . . E2 . . . | F2 . . . G2 . . . | C3 . . . . . - -`,
        'sine',
        0.8,
      ),
    ],
  },
  // わくわく: ぼうけんに 出かける
  adventure: {
    bpm: 112,
    length: 64,
    parts: [
      part(
        `G4 B4 D5 . B4 D5 G5 . | E5 . D5 . B4 . . - | C5 E5 G5 . E5 G5 A5 . | G5 . . . D5 . . -
         G4 B4 D5 . B4 D5 G5 . | A5 . G5 . E5 . . - | F#5 . G5 . A5 . F#5 . | G5 . . . - - - -`,
        'triangle',
        1,
        0.8,
      ),
      part(
        `G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 .
         G2 . D3 . G2 . D3 . | E2 . B2 . E2 . B2 . | D3 . A3 . D3 . A3 . | G2 . D3 . G2 . . -`,
        'triangle',
        0.75,
        0.6,
      ),
    ],
    drums: 'k.h.k.h.k.h.k.hh'.repeat(4),
  },
  // どきどき: ボスとの たたかい
  boss: {
    bpm: 132,
    length: 64,
    parts: [
      part(
        `A4 . C5 . E5 . D5 C5 | B4 . . . G#4 . . - | A4 . C5 . E5 . G5 F5 | E5 . . . - - E5 -
         F5 . E5 . D5 . C5 D5 | E5 . . . C5 . . - | D5 . C5 . B4 . G#4 B4 | A4 . . . - - - -`,
        'square',
        0.55,
        0.85,
      ),
      part(
        `A2 A2 - A2 A2 - A2 G2 | E2 E2 - E2 E2 - E2 E2 | A2 A2 - A2 A2 - A2 G2 | E2 E2 - E2 E2 - E2 E2
         F2 F2 - F2 F2 - F2 F2 | C3 C3 - C3 C3 - C3 C3 | D3 D3 - D3 D3 - E2 E2 | A2 A2 - A2 A2 - - -`,
        'sawtooth',
        0.6,
        0.55,
      ),
    ],
    drums: 'k.hhk.h.k.hhk.hh'.repeat(4),
  },
}

/** 8分音符1つの長さ(秒) */
export const stepSeconds = (track: Track): number => 60 / track.bpm / 2

/** 音楽ぜんたいの大きさ。効果音や こえ の じゃまに ならないよう、小さめにしている */
const MUSIC_VOLUME = 0.045
/** こえ が流れている間は、ここまで下げる(MUSIC_VOLUME に対する割合) */
const DUCKED = 0.3
const FADE_SECONDS = 0.5
/** 何秒 先までの音を、まえもって ならべておくか */
const LOOKAHEAD_SECONDS = 0.5
const TICK_MS = 120

type Session = { readonly name: TrackName; readonly gain: GainNode; step: number; nextAt: number }

let session: Session | undefined
let timer: ReturnType<typeof setInterval> | undefined
let ducked = false
let unlockBound = false

const level = (): number => MUSIC_VOLUME * (ducked ? DUCKED : 1)

/** ブラウザは、画面を さわるまで音を出させてくれない。さいしょに さわったときに 起こす。 */
function unlockOnTouch(ctx: AudioContext): void {
  if (unlockBound || typeof window === 'undefined') return
  unlockBound = true
  const unlock = () => {
    if (ctx.state === 'suspended') void ctx.resume()
    window.removeEventListener('pointerdown', unlock)
    unlockBound = false
  }
  window.addEventListener('pointerdown', unlock)
}

function scheduleStep(ctx: AudioContext, current: Session, track: Track, at: number): void {
  const seconds = stepSeconds(track)
  for (const { notes, wave, vol, gate } of track.parts) {
    for (const note of notes) {
      if (note.step !== current.step) continue
      playTone(ctx, current.gain, { freq: midiToFreq(note.midi), at: 0, len: seconds * note.steps * gate, wave }, at, vol)
    }
  }
  const drum = track.drums?.[current.step % (track.drums?.length ?? 1)]
  if (drum === 'k') playTone(ctx, current.gain, { freq: 150, to: 45, at: 0, len: 0.16 }, at, 1.6)
  if (drum === 'h') playNoise(ctx, current.gain, { at: 0, len: 0.05, filter: 7000 }, at, 0.7)
}

function tick(): void {
  const ctx = audioContext()
  const current = session
  if (!ctx || !current || ctx.state !== 'running') return
  // 画面を かくしている間は ならべない(もどってきたら、そこから つづける)
  if (typeof document !== 'undefined' && document.hidden) return
  const track = TRACKS[current.name]
  if (current.nextAt < ctx.currentTime) current.nextAt = ctx.currentTime + 0.06
  while (current.nextAt < ctx.currentTime + LOOKAHEAD_SECONDS) {
    scheduleStep(ctx, current, track, current.nextAt)
    current.nextAt += stepSeconds(track)
    current.step = (current.step + 1) % track.length
  }
}

function fadeOut(ctx: AudioContext, old: Session): void {
  const now = ctx.currentTime
  old.gain.gain.cancelScheduledValues(now)
  old.gain.gain.setValueAtTime(Math.max(old.gain.gain.value, 0.0001), now)
  old.gain.gain.exponentialRampToValueAtTime(0.0001, now + FADE_SECONDS)
  setTimeout(() => old.gain.disconnect(), (FADE_SECONDS + 0.6) * 1000)
}

/** いま流れている曲の名前(流れていなければ undefined)。 */
export const currentTrack = (): TrackName | undefined => session?.name

/**
 * 流す曲を決める。同じ曲なら そのまま流しつづけ、ちがう曲なら 前の曲を すっと消して切りかえる。
 * undefined を わたすと止める。音が出せない環境では何もしない。
 */
export function setMusic(name: TrackName | undefined): void {
  if (session?.name === name) return
  const ctx = audioContext()
  if (!ctx || typeof ctx.createGain !== 'function') return
  if (session) fadeOut(ctx, session)
  session = undefined
  if (name === undefined) {
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
    return
  }
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(level(), ctx.currentTime + FADE_SECONDS)
  gain.connect(ctx.destination)
  session = { name, gain, step: 0, nextAt: ctx.currentTime + 0.1 }
  if (ctx.state === 'suspended') unlockOnTouch(ctx)
  timer ??= setInterval(tick, TICK_MS)
}

/** こえ が流れている間、音楽を小さくする(おわったら もどす)。 */
export function duckMusic(on: boolean): void {
  if (ducked === on) return
  ducked = on
  const ctx = audioContext()
  if (!ctx || !session) return
  const now = ctx.currentTime
  session.gain.gain.cancelScheduledValues(now)
  session.gain.gain.setValueAtTime(Math.max(session.gain.gain.value, 0.0001), now)
  session.gain.gain.exponentialRampToValueAtTime(level(), now + 0.25)
}
