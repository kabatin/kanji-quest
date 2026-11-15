import { describe, expect, it } from 'vitest'
import { guideParts, hintForMisses, MODEL_HINT, raiseHint, toleranceFor } from './strokeHint'
import { LENIENT_TOLERANCE, NORMAL_TOLERANCE } from './strokeMatch'

describe('strokeHint: だんかい ヒント', () => {
  it('見て書く: まちがえるたびに 1段ずつ(点 → やじるし → うごく お手本 → うすい お手本)', () => {
    expect([0, 1, 2, 3, 4, 9].map((n) => hintForMisses(n, false))).toEqual([0, 2, 3, 4, 4, 4])
  })

  it('テスト: 1回目で 点と やじるし、2回目で いちばん強い ヒント(3回 つまずかない)', () => {
    expect([0, 1, 2, 3].map((n) => hintForMisses(n, true))).toEqual([0, 2, 4, 4])
  })

  it('段は 下がらない(「おてほん」で上げた段は、まちがえても そのまま)', () => {
    expect(raiseHint(MODEL_HINT, 2)).toBe(3)
    expect(raiseHint(2, 4)).toBe(4)
    expect(raiseHint(0, 0)).toBe(0)
  })

  it('同じ画で 2回 まちがえたら、3回目は あまく見る', () => {
    expect(toleranceFor(0)).toBe(NORMAL_TOLERANCE)
    expect(toleranceFor(1)).toBe(NORMAL_TOLERANCE)
    expect(toleranceFor(2)).toBe(LENIENT_TOLERANCE)
    expect(toleranceFor(5)).toBe(LENIENT_TOLERANCE)
  })
})

describe('guideParts: ばんに 出す しるし', () => {
  it('見て書く は、いつも 番号つきの 書きはじめの点 を出す', () => {
    expect(guideParts(0, null, false)).toEqual({ start: true, number: true, arrow: false, end: false, animate: false, trace: false, focus: null })
  })

  it('テストは、ヒントが ないと 何も出さない', () => {
    expect(guideParts(0, null, true)).toEqual({ start: false, number: false, arrow: false, end: false, animate: false, trace: false, focus: null })
  })

  it('段が上がるほど しるしが ふえる', () => {
    expect(guideParts(1, null, true)).toMatchObject({ start: true, arrow: false, animate: false, trace: false })
    expect(guideParts(2, null, true)).toMatchObject({ start: true, arrow: true, animate: false, trace: false })
    expect(guideParts(3, null, true)).toMatchObject({ start: true, arrow: true, animate: true, trace: false })
    expect(guideParts(4, null, true)).toMatchObject({ start: true, arrow: true, animate: true, trace: true })
  })

  it('まちがいの わけ に合わせて、直すところ を出して ゆらす', () => {
    expect(guideParts(0, 'start', true)).toMatchObject({ start: true, focus: 'start' })
    expect(guideParts(0, 'order', true)).toMatchObject({ start: true, focus: 'start' })
    expect(guideParts(0, 'reverse', true)).toMatchObject({ start: true, arrow: true, focus: 'arrow' })
    for (const issue of ['end', 'short', 'long'] as const) expect(guideParts(0, issue, true)).toMatchObject({ end: true, focus: 'end' })
    expect(guideParts(2, 'shape', false)).toMatchObject({ start: true, arrow: true, end: false, focus: null })
  })
})
