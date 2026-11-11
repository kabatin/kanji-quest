import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('音の数だけ発振器を鳴らす', () => {
    const started: number[] = []
    class FakeAudioContext {
      currentTime = 0
      destination = {}
      createOscillator() {
        return {
          type: '',
          frequency: { value: 0 },
          connect: vi.fn(),
          start: (at: number) => started.push(at),
          stop: vi.fn(),
        }
      }
      createGain() {
        return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() }
      }
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    expect(playSound('fanfare', true)).toBe(true)
    expect(started).toHaveLength(4)
  })
})
