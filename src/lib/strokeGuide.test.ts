import { describe, expect, it } from 'vitest'
import { endArrowHead, pointAlong, startArrow, toPathD } from './strokeGuide'
import type { Point } from './strokeMatch'

const close = (a: Point, b: Point) => {
  expect(a[0]).toBeCloseTo(b[0], 5)
  expect(a[1]).toBeCloseTo(b[1], 5)
}

describe('strokeGuide: ヒントの しるし の かたち', () => {
  const line: Point[] = [[10, 10], [30, 10], [30, 50]]

  it('pointAlong: 道のりで その長さの ところの点', () => {
    close(pointAlong(line, 0), [10, 10])
    close(pointAlong(line, 5), [15, 10])
    close(pointAlong(line, 30), [30, 20])
    // 長すぎるときは おわりの点、みじかい線は そのまま
    close(pointAlong(line, 999), [30, 50])
    close(pointAlong([[4, 4]], 3), [4, 4])
  })

  it('startArrow: 書きはじめの点から、書きはじめの むきへ のびる', () => {
    const arrow = startArrow(line, { gap: 5, length: 12, head: 4 })
    if (!arrow) throw new Error('やじるし が ありません')
    close(arrow.shaft[0], [15, 10])
    close(arrow.shaft[1], [23, 10])
    close(arrow.head[0], [27, 10])
    // 先の 三角は、むき に たいして 左右 おなじ はば
    expect(arrow.head[1][0]).toBeCloseTo(23, 5)
    expect(arrow.head[2][0]).toBeCloseTo(23, 5)
    expect(arrow.head[1][1] + arrow.head[2][1]).toBeCloseTo(20, 5)
  })

  it('startArrow: たての線なら 下むき。長さのない線には 出さない', () => {
    const arrow = startArrow([[50, 10], [50, 90]])
    expect(arrow?.head[0][0]).toBeCloseTo(50, 5)
    expect(arrow?.head[0][1]).toBeGreaterThan(10)
    expect(startArrow([[5, 5], [5, 5]])).toBeNull()
    expect(startArrow([])).toBeNull()
  })

  it('endArrowHead: 線の おわりで、書いた むき を さす', () => {
    const head = endArrowHead(line, 6)
    if (!head) throw new Error('三角が ありません')
    // おわりは 下むき(30,50 へ)なので、先っぽは おわりより 下
    close(head[0], [30, 52.7])
    expect(head[1][1]).toBeCloseTo(46.7, 5)
    expect(head[1][0] + head[2][0]).toBeCloseTo(60, 5)
    // ぎゃくに書いた線なら、先っぽは はじめの点の がわ
    const back = endArrowHead([...line].reverse(), 6)
    expect(back?.[0][0]).toBeLessThan(10)
    expect(endArrowHead([[1, 1], [1, 1]])).toBeNull()
    expect(endArrowHead([[1, 1]])).toBeNull()
  })

  it('toPathD: 折れ線を SVG の道に する', () => {
    expect(toPathD([[1, 2], [3.333, 4], [5, 6]])).toBe('M1 2L3.33 4L5 6')
    expect(toPathD([[1, 2]])).toBe('M1 2L1 2')
    expect(toPathD([])).toBe('')
  })
})
