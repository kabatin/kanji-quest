import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import { PARTS } from '../data/parts'
import { findRelated } from './related'

const chars = (target: string, partId: string) =>
  findRelated(getKanji(target), KANJI, PARTS)
    .find((g) => g.part.id === partId)
    ?.kanji.map((k) => k.char)

describe('findRelated', () => {
  it('さんずいの仲間: 海 → 活・汽・池', () => {
    expect(chars('海', '氵')).toEqual(['活', '汽', '池'])
  })

  it('木の仲間に、林・森・休が入る', () => {
    const nakama = chars('木', '木') ?? []
    for (const char of ['林', '森', '休']) expect(nakama).toContain(char)
  })

  it('日の仲間: 明 → 日・時・晴 など', () => {
    const nakama = chars('明', '日') ?? []
    for (const char of ['日', '時', '晴', '間']) expect(nakama).toContain(char)
  })

  it('自分自身は含まない', () => {
    for (const group of findRelated(getKanji('林'), KANJI, PARTS)) {
      expect(group.kanji.map((k) => k.char)).not.toContain('林')
    }
  })

  it('仲間がいない部位は出さない', () => {
    for (const kanji of KANJI) {
      for (const group of findRelated(kanji, KANJI, PARTS)) expect(group.kanji.length).toBeGreaterThan(0)
    }
  })

  it('知らない部位を持つ漢字はエラーになる', () => {
    const broken = { ...getKanji('海'), parts: ['nai'] }
    expect(() => findRelated(broken, KANJI, PARTS)).toThrow('部位が見つかりません')
  })
})
