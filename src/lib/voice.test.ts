import { afterEach, describe, expect, it, vi } from 'vitest'
import manifest from '../assets/voice-manifest.json'
import { KANJI } from '../data/kanji'
import { getNarration } from '../data/narration'
import { playVoice, voiceId } from './voice'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('音声データ', () => {
  it('すべての漢字に、読み・説明・段階ごとのお題の音声がある', () => {
    for (const kanji of KANJI) {
      const narration = getNarration(kanji.char)
      expect(narration.word).toBe(kanji.yomi)
      expect(narration.goals).toHaveLength(kanji.steps.length)
      const ids = [
        voiceId.word(kanji.char),
        voiceId.explain(kanji.char),
        ...kanji.steps.map((_, i) => voiceId.goal(kanji.char, i)),
      ]
      for (const id of ids) expect(manifest.clips).toContain(id)
    }
  })

  it('説明がない漢字はエラーになる', () => {
    expect(() => getNarration('鬱')).toThrow('説明が見つかりません')
  })
})

describe('playVoice', () => {
  it('オフのときは鳴らさない', () => {
    expect(playVoice(voiceId.word('海'), 'うみ', false)).toBe('none')
  })

  it('クリップがあれば、その音声ファイルを再生する', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const src = vi.spyOn(HTMLMediaElement.prototype, 'src', 'set')
    expect(playVoice(voiceId.word('海'), 'うみ', true)).toBe('clip')
    expect(play).toHaveBeenCalledOnce()
    expect(src).toHaveBeenCalledWith(`${import.meta.env.BASE_URL}voice/word-6d77.mp3`)
  })

  it('クリップがなければ、読み上げで代わりに読む', () => {
    const spoken: string[] = []
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; constructor(t: string) { this.text = t } })
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: (u: { text: string }) => spoken.push(u.text) })
    expect(playVoice('word-nai', 'ない', true)).toBe('speech')
    expect(spoken).toEqual(['ない'])
    vi.unstubAllGlobals()
    expect(playVoice('word-nai', 'ない', true)).toBe('none')
  })

  it('ファイルを読めなかったときだけ、読み上げに切り替える', async () => {
    const spoken: string[] = []
    vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; lang = ''; rate = 1; constructor(t: string) { this.text = t } })
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: (u: { text: string }) => spoken.push(u.text) })
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play')

    play.mockRejectedValueOnce(new DOMException('interrupted', 'AbortError'))
    playVoice(voiceId.word('海'), 'うみ', true)
    await Promise.resolve()
    await Promise.resolve()
    expect(spoken).toEqual([])

    play.mockRejectedValueOnce(new DOMException('missing', 'NotSupportedError'))
    playVoice(voiceId.word('海'), 'うみ', true)
    await Promise.resolve()
    await Promise.resolve()
    expect(spoken).toEqual(['うみ'])
    vi.unstubAllGlobals()
  })
})
