import { describe, expect, it } from 'vitest'
import { getKanji, KANJI, kanjiOfGrade } from './kanji'
import { getPart, PARTS } from './parts'
import { fitViewBox, fullGlyph, getStrokes, glyphKey, strokeCount, unionBBox } from './strokes'

describe('漢字データ', () => {
  it('小1が80字、小2が160字で、重複がない', () => {
    expect(kanjiOfGrade(1)).toHaveLength(80)
    expect(kanjiOfGrade(2)).toHaveLength(160)
    expect(new Set(KANJI.map((k) => k.char)).size).toBe(240)
  })

  it('すべての構造パターンを含む', () => {
    const patterns = new Set(KANJI.map((k) => k.pattern))
    expect([...patterns].sort()).toEqual(['fukusuu', 'jouge', 'kakomu', 'kurikaeshi', 'sayuu', 'tantai'])
  })

  it('すべての漢字に画データがある', () => {
    for (const kanji of KANJI) expect(strokeCount(kanji.char)).toBeGreaterThan(0)
  })

  it('参照している部位がすべて存在する', () => {
    for (const kanji of KANJI) {
      for (const id of kanji.parts) expect(() => getPart(id)).not.toThrow()
      for (const step of kanji.steps) {
        expect(kanji.parts).toContain(step.fixed)
        expect(kanji.parts).toContain(step.answer)
        if (step.makes) expect(kanji.parts).toContain(step.makes)
      }
    }
  })

  it('最後の段階で、漢字の全部の画がちょうど1回ずつそろう', () => {
    for (const kanji of KANJI.filter((k) => k.steps.length > 0)) {
      const last = kanji.steps[kanji.steps.length - 1]
      expect(last.fixedGlyph.source).toBe(kanji.char)
      expect(last.answerGlyph.source).toBe(kanji.char)
      const covered = [...last.fixedGlyph.strokes, ...last.answerGlyph.strokes].sort((a, b) => a - b)
      expect(covered).toEqual(fullGlyph(kanji.char).strokes)
    }
  })

  it('部位の形が画データに収まっていて、いみパーツには絵がある', () => {
    for (const part of PARTS) {
      expect(() => getStrokes(part.glyph)).not.toThrow()
      if (part.kind === 'imi') expect(part.icon).toBeDefined()
    }
  })

  it('存在しない漢字・部位はエラーになる', () => {
    expect(() => getKanji('鬱')).toThrow('漢字が見つかりません')
    expect(() => getPart('nai')).toThrow('部位が見つかりません')
    expect(getKanji('海').yomi).toBe('うみ')
  })
})

describe('画データ', () => {
  it('指定した画を返す。離れた画(国の「囗」など)も指定できる', () => {
    expect(getStrokes({ source: '海', strokes: [1, 2, 3] })).toHaveLength(3)
    expect(getStrokes({ source: '国', strokes: [1, 2, 8] })).toHaveLength(3)
    expect(strokeCount('森')).toBe(12)
    expect(strokeCount('鬱')).toBe(0)
    expect(fullGlyph('木').strokes).toEqual([1, 2, 3, 4])
    expect(glyphKey({ source: '国', strokes: [1, 2, 8] })).toBe('国-1.2.8')
  })

  it('範囲外や未収録の字はエラーになる', () => {
    expect(() => getStrokes({ source: '海', strokes: [99] })).toThrow('画の指定が不正')
    expect(() => getStrokes({ source: '鬱', strokes: [1] })).toThrow('画データがありません')
    expect(() => fullGlyph('鬱')).toThrow('画データがありません')
  })

  it('さんずいは字の左側にある', () => {
    const [, , x1] = unionBBox(getStrokes({ source: '海', strokes: [1, 2, 3] }))
    expect(x1).toBeLessThan(40)
  })

  it('外接矩形を中央にした正方形の viewBox を作る', () => {
    expect(fitViewBox([10, 20, 30, 80], 5)).toBe('-15 15 70 70')
  })
})
