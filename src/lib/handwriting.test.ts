import { describe, expect, it } from 'vitest'
import { decodeStrokes, encodeStrokes, handsSchema, HAND_MAX_CHARS, isFreeWrite, noteHand, noteHands, readHands, recentHands, thinStroke, type Hands, type Strokes } from './handwriting'

const line = (n: number, from = 10): [number, number][] => Array.from({ length: n }, (_, i) => [from + i * 0.7, 20 + i * 0.4] as [number, number])
const strokes = (count: number, points = 40): Strokes => Array.from({ length: count }, (_, i) => line(points, 5 + i))

describe('書いた字の きろく', () => {
  it('点を まびいて、はじめと おわりを のこす', () => {
    const thinned = thinStroke(line(60), 12)
    expect(thinned.length).toBeLessThanOrEqual(12)
    expect(thinned[0]).toEqual([10, 20])
    expect(thinned.at(-1)).toEqual([Math.round(10 + 59 * 0.7), Math.round(20 + 59 * 0.4)])
    expect(thinned.every((p) => Number.isInteger(p[0]) && Number.isInteger(p[1]))).toBe(true)
  })

  it('文字列にして もどせる。画の数は 変わらない', () => {
    const text = encodeStrokes(strokes(5))
    expect(text).not.toBeNull()
    expect(decodeStrokes(text ?? '')).toHaveLength(5)
  })

  it('1字の 大きさに 上限が ある。多すぎる画は のこさない', () => {
    const big = encodeStrokes(strokes(29, 200))
    expect((big ?? '').length).toBeLessThanOrEqual(HAND_MAX_CHARS)
    expect(encodeStrokes(strokes(31))).toBeNull()
    expect(encodeStrokes([])).toBeNull()
  })

  it('ふつうの字(10画)は 600文字に おさまる', () => {
    expect((encodeStrokes(strokes(10, 60)) ?? '').length).toBeLessThan(600)
  })

  it('読めない 文字列は ことわる', () => {
    expect(decodeStrokes('abc')).toBeNull()
    expect(decodeStrokes('1,2 3,x')).toBeNull()
    expect(decodeStrokes('')).toBeNull()
  })

  it('はじめての字は f、2回目からは l を おきかえる(f は かわらない)', () => {
    const one = noteHand({}, '右', strokes(2), '2026-11-01')
    expect(one['右'].l).toBeUndefined()
    const two = noteHand(one, '右', strokes(3), '2026-11-05')
    const three = noteHand(two, '右', strokes(4), '2026-11-09')
    expect(three['右'].f).toEqual(one['右'].f)
    expect(three['右'].l?.d).toBe('2026-11-09')
    expect(Object.keys(three)).toEqual(['右'])
  })

  it('もとの hands を 書きかえない', () => {
    const before: Hands = {}
    noteHand(before, '右', strokes(2), '2026-11-01')
    expect(before).toEqual({})
  })

  it('見ないで・ヒントなしで 書けた答えだけ のこす', () => {
    expect(isFreeWrite({ kind: 'blind', ok: true })).toBe(true)
    expect(isFreeWrite({ kind: 'blind', ok: true, hint: 2 })).toBe(true)
    expect(isFreeWrite({ kind: 'blind', ok: true, hint: 3 })).toBe(false)
    expect(isFreeWrite({ kind: 'model', ok: true })).toBe(false)
    expect(isFreeWrite({ kind: 'blind', ok: false })).toBe(false)
    const hands = noteHands(
      {},
      [
        { char: '右', kind: 'blind', ok: true, strokes: strokes(2) },
        { char: '左', kind: 'model', ok: true, strokes: strokes(2) },
        { char: '石', kind: 'blind', ok: true },
      ],
      '2026-11-01',
    )
    expect(Object.keys(hands)).toEqual(['右'])
  })

  it('新しい順に ならべる', () => {
    let hands: Hands = noteHand({}, '右', strokes(2), '2026-11-01')
    hands = noteHand(hands, '左', strokes(2), '2026-11-08')
    hands = noteHand(hands, '右', strokes(2), '2026-11-09')
    expect(recentHands(hands, 5).map((r) => r.char)).toEqual(['右', '左'])
    expect(recentHands(hands, 1)).toHaveLength(1)
  })

  it('こわれた保存データは、読める字だけ のこす', () => {
    const good = noteHand({}, '右', strokes(2), '2026-11-01')
    const parsed = handsSchema.parse({ ...good, 左: { f: { d: 1 } }, 石: { f: { d: '2026-11-01', s: 'zzz' } } })
    expect(Object.keys(parsed)).toEqual(['右'])
    expect(handsSchema.parse('x')).toEqual({})
    expect(handsSchema.parse(undefined)).toEqual({})
  })

  it('端末から 読む。なければ からっぽ', () => {
    const good = noteHand({}, '右', strokes(2), '2026-11-01')
    const storage = { getItem: () => JSON.stringify({ state: { hands: good }, version: 6 }) }
    expect(Object.keys(readHands('p1', storage))).toEqual(['右'])
    expect(readHands('p1', { getItem: () => null })).toEqual({})
    expect(readHands('p1', { getItem: () => '{oops' })).toEqual({})
  })
})
