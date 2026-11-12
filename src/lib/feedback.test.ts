import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentTrack, duckMusic, midiOf, midiToFreq, parseScore, setMusic, stepSeconds, TRACKS } from './music'
import { playSound } from './sound'
import { speak } from './speech'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('speak', () => {
  it('オフのとき・読み上げ機能がないときは何もしない', () => {
    expect(speak('うみ', false)).toBe(false)
    expect(speak('うみ', true)).toBe(false)
  })

  it('日本語で読み上げる', () => {
    const spoken: { text: string; lang: string }[] = []
    class FakeUtterance {
      lang = ''
      rate = 1
      text: string
      constructor(text: string) {
        this.text = text
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak: (u: FakeUtterance) => spoken.push({ text: u.text, lang: u.lang }),
    })
    expect(speak('うみ', true)).toBe(true)
    expect(spoken).toEqual([{ text: 'うみ', lang: 'ja-JP' }])
  })
})

describe('playSound', () => {
  it('オフのとき・音が出せない環境では何もしない', () => {
    expect(playSound('ok', false)).toBe(false)
    expect(playSound('ok', true)).toBe(false)
  })

  it('音の数だけ発振器を鳴らす。ざーっという音が作れない環境でも、高さのある音は鳴る', () => {
    vi.stubGlobal('AudioContext', fake.AudioContext)
    fake.started.length = 0
    expect(playSound('fanfare', true)).toBe(true)
    expect(fake.started).toHaveLength(6)
    // ボスに当たった音は 高さのある音が3つ + ざーっという音(この環境では作れないので 鳴らさない)
    fake.started.length = 0
    expect(playSound('hit', true)).toBe(true)
    expect(fake.started).toHaveLength(3)
  })
})

/** 音を鳴らした ふり をする AudioContext。鳴らした音の はじまりの時刻 を覚えておく。 */
function fakeAudio() {
  const started: number[] = []
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() })
  class AudioContext {
    currentTime = 0
    state = 'running'
    destination = {}
    resume = vi.fn()
    createOscillator() {
      return { type: '', frequency: param(), connect: vi.fn(), start: (at: number) => started.push(at), stop: vi.fn() }
    }
    createGain() {
      return { gain: param(), connect: vi.fn(), disconnect: vi.fn() }
    }
  }
  return { AudioContext, started }
}

// アプリは AudioContext を1つ作って使い回すので、テストでも 同じ ふり を使い回す
const fake = fakeAudio()

describe('音楽', () => {
  afterEach(() => {
    setMusic(undefined)
    vi.useRealTimers()
  })

  it('楽譜の文字列を 音の ならび に直す(. は のばす、- は 休み)', () => {
    expect(parseScore('C4 . E4 - | G4 . . .')).toEqual([
      { step: 0, midi: 60, steps: 2 },
      { step: 2, midi: 64, steps: 1 },
      { step: 4, midi: 67, steps: 4 },
    ])
    expect(midiOf('A4')).toBe(69)
    expect(midiOf('F#5')).toBe(78)
    expect(midiToFreq(69)).toBe(440)
    expect(() => midiOf('H9')).toThrow('音の名前が正しくありません')
    // 休みの あとの「.」は、のばす音がないので 何もしない
    expect(parseScore('C4 - .')).toEqual([{ step: 0, midi: 60, steps: 1 }])
  })

  it('どの曲も、決めた長さに ぴったり 収まっている', () => {
    for (const track of Object.values(TRACKS)) {
      expect(track.parts.length).toBeGreaterThan(0)
      for (const { notes } of track.parts) {
        const end = Math.max(...notes.map((note) => note.step + note.steps))
        expect(end).toBeLessThanOrEqual(track.length)
        expect(end).toBeGreaterThan(track.length - 8)
      }
      if (track.drums) expect(track.drums).toHaveLength(track.length)
      expect(stepSeconds(track)).toBeGreaterThan(0.15)
    }
  })

  it('音が出せない環境では、何もしない', () => {
    setMusic('home')
    expect(currentTrack()).toBeUndefined()
  })

  it('曲を流すと 音が ならべられ、べつの曲に切りかえたり 止めたり できる', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', fake.AudioContext)
    // 効果音を1つ鳴らして、この ふりの AudioContext を使わせる
    playSound('tap', true)
    fake.started.length = 0

    setMusic('home')
    expect(currentTrack()).toBe('home')
    vi.advanceTimersByTime(400)
    const first = fake.started.length
    expect(first).toBeGreaterThan(0)
    // 同じ曲を もう一度たのんでも、はじめから やりなおさない
    setMusic('home')
    duckMusic(true)
    duckMusic(false)

    setMusic('boss')
    expect(currentTrack()).toBe('boss')
    setMusic(undefined)
    expect(currentTrack()).toBeUndefined()
    const stopped = fake.started.length
    vi.advanceTimersByTime(2000)
    expect(fake.started).toHaveLength(stopped)
  })
})
