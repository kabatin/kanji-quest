import { describe, expect, it } from 'vitest'
import { KANJI } from '../data/kanji'
import { fullGlyph, getStrokes } from '../data/strokes'
import { checkStroke, diagnoseStroke, judgeStroke, LENIENT_TOLERANCE, matchStroke, pathLength, resample, type Point } from './strokeMatch'

const strokesOf = (char: string) => getStrokes(fullGlyph(char)).map((s) => s.pts as readonly Point[])
const shift = (points: readonly Point[], dx: number, dy: number): Point[] => points.map(([x, y]) => [x + dx, y + dy] as const)
/** 書きはじめ から、道のりで ratio の ところまでの線 */
const firstPart = (points: readonly Point[], ratio: number): Point[] => resample(points, 33).slice(0, Math.round(32 * ratio) + 1)
/** お手本の向きのまま、おわりの先へ ratio ぶん のばした線 */
const extend = (points: readonly Point[], ratio: number): Point[] => {
  const [a, b] = [points[points.length - 2], points[points.length - 1]]
  const step = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const reach = pathLength(points) * ratio
  const [ux, uy] = [(b[0] - a[0]) / step, (b[1] - a[1]) / step]
  return [...points, [b[0] + ux * reach, b[1] + uy * reach] as const]
}

describe('diagnoseStroke: まちがいの わけ', () => {
  const [yoko, tate] = strokesOf('木')

  it('ぎゃくの向きに書くと reverse', () => {
    expect(diagnoseStroke([...yoko].reverse(), yoko)).toBe('reverse')
    expect(diagnoseStroke([...tate].reverse(), tate)).toBe('reverse')
  })

  it('書きはじめの場所が はなれていると start', () => {
    expect(diagnoseStroke(shift(yoko, 0, 30), yoko)).toBe('start')
    // 書きはじめ だけ ずれていても start
    expect(diagnoseStroke([[yoko[0][0] - 30, yoko[0][1] + 10], ...yoko.slice(1)], yoko)).toBe('start')
  })

  it('とちゅうで やめると short', () => {
    expect(diagnoseStroke(firstPart(tate, 0.5), tate)).toBe('short')
    expect(diagnoseStroke(firstPart(tate, 0.25), tate)).toBe('short')
  })

  it('おわりを すぎて のばすと long', () => {
    expect(diagnoseStroke(extend(tate, 0.6), tate)).toBe('long')
  })

  it('書きはじめは合っていて、ちがう ほうへ おわると end', () => {
    // たての画を、ななめ右下へ 書いてしまう
    const slanted = tate.map(([x, y], i) => [x + i * 6, y] as const)
    expect(diagnoseStroke(slanted, tate)).toBe('end')
  })

  it('はじめと おわりは合っていて、とちゅうが ずれると shape', () => {
    const bowed = yoko.map(([x, y], i) => [x, y + (i > 0 && i < yoko.length - 1 ? 26 : 0)] as const)
    expect(diagnoseStroke(bowed, yoko)).toBe('shape')
  })

  it('はじめと おわりは合っていて、ぐるぐる 長すぎると long', () => {
    const back = [...yoko].reverse()
    expect(diagnoseStroke([...yoko, ...back, ...yoko, ...back, ...yoko.map(([x, y]) => [x, y + 20] as const), yoko[yoko.length - 1]], yoko)).toBe('long')
  })

  it('点だけ・お手本のない画は shape にしておく', () => {
    expect(diagnoseStroke([[1, 1]], yoko)).toBe('shape')
    expect(diagnoseStroke(yoko, [])).toBe('shape')
  })

  it('どの漢字でも、長めの画を ぎゃくに書くと reverse、ずらして書くと start と分かる', () => {
    const results = KANJI.flatMap((kanji) =>
      strokesOf(kanji.char)
        .filter((pts) => pathLength(pts) > 30)
        .map((pts) => [diagnoseStroke([...pts].reverse(), pts), diagnoseStroke(shift(pts, 0, 40), pts)]),
    )
    const rate = (index: number, want: string) => results.filter((r) => r[index] === want).length / results.length
    expect(rate(0, 'reverse')).toBeGreaterThan(0.97)
    expect(rate(1, 'start')).toBe(1)
  })
})

describe('checkStroke: 合格か、まちがいの わけ', () => {
  const targets = strokesOf('木')

  it('合格の きじゅん は judgeStroke と同じ', () => {
    for (const kanji of KANJI.slice(0, 60)) {
      const all = strokesOf(kanji.char)
      all.forEach((pts, i) => {
        expect(checkStroke(pts, all, i), kanji.char).toBe('ok')
        expect(checkStroke([...pts].reverse(), all, i) === 'ok', kanji.char).toBe(judgeStroke([...pts].reverse(), all, i) === 'ok')
      })
    }
  })

  it('あとの画を先に書くと order。それ以外は わけ を こまかく出す', () => {
    expect(checkStroke(targets[1], targets, 0)).toBe('order')
    expect(checkStroke([...targets[0]].reverse(), targets, 0)).toBe('reverse')
    expect(checkStroke(shift(targets[0], 0, 30), targets, 0)).toBe('start')
    expect(checkStroke(targets[0], targets, 9)).toBe('shape')
  })

  it('場所は合っていて ぐるぐる 書きなぐると long(いままでどおり)', () => {
    const loops = targets[0].flatMap(([x, y]) => [[x, y], [x + 4, y - 6], [x - 4, y - 6], [x - 4, y + 6], [x + 4, y + 6], [x, y]] as Point[])
    expect(checkStroke(loops, targets, 0)).toBe('long')
  })

  it('あまく見るときは、書きはじめが 少し はなれていても合格', () => {
    const [first, ...rest] = targets[0]
    const offStart: Point[] = [[first[0] - 27, first[1] + 4], ...rest]
    expect(matchStroke(offStart, targets[0])).toBe(false)
    expect(checkStroke(offStart, targets, 0)).toBe('start')
    expect(checkStroke(offStart, targets, 0, LENIENT_TOLERANCE)).toBe('ok')
    // あまく見ても、ぎゃく向き は 合格にしない
    expect(checkStroke([...targets[0]].reverse(), targets, 0, LENIENT_TOLERANCE)).toBe('reverse')
  })
})
