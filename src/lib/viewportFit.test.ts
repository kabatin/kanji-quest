import { describe, expect, it } from 'vitest'
import { fitFromAspect, fitViewportWidth, viewportContent } from './viewportFit'

describe('小さい画面では ページぜんたいを ちぢめる', () => {
  it('スマホの よこ向きで、ブラウザの バーに 高さを とられたら、高さ 430 ぶんに なるよう 幅を 広く名のる', () => {
    // iPhone の Safari: 844 x 280 くらいしか 見えない
    const width = fitViewportWidth({ width: 844, height: 280 })
    expect(width).toBe(Math.ceil((430 * 844) / 280))
    expect((width ?? 0) * (280 / 844)).toBeGreaterThanOrEqual(430)
  })

  it('スマホ用の配置が 収まる高さが あれば、そのまま', () => {
    expect(fitViewportWidth({ width: 932, height: 440 })).toBeNull()
    expect(fitViewportWidth({ width: 932, height: 430 })).toBeNull()
  })

  it('タブレット用の配置(高さ 500 より上)は、700 に 足りないぶんだけ ちぢめる', () => {
    expect(fitViewportWidth({ width: 1024, height: 768 })).toBeNull()
    expect(fitViewportWidth({ width: 1180, height: 820 })).toBeNull()
    expect(fitViewportWidth({ width: 1024, height: 650 })).toBe(Math.ceil((700 * 1024) / 650))
  })

  it('たて向き・おかしな値は、ちぢめない', () => {
    expect(fitViewportWidth({ width: 390, height: 844 })).toBeNull()
    expect(fitViewportWidth({ width: 0, height: 0 })).toBeNull()
  })

  it('viewport の書き方', () => {
    expect(viewportContent(null)).toBe('width=device-width, initial-scale=1.0, viewport-fit=cover')
    expect(viewportContent(1086)).toBe('width=1086, viewport-fit=cover')
  })
  it('ちぢめた後でも、たてよこ の比から 同じ答えが出る(バーが 出入りしても もとに もどさずに 計算できる)', () => {
    const first = fitViewportWidth({ width: 844, height: 280 })
    // ちぢめた後の 見かけの大きさ(幅 first、高さ 430 ぶん)から 計算しても 同じ
    expect(fitFromAspect(844, first ?? 0, ((first ?? 0) * 280) / 844)).toBe(first)
    // バーが ひっこんで 高さが 340 に ふえたら、ちぢめかたは ゆるくなる
    const wider = fitFromAspect(844, first ?? 0, ((first ?? 0) * 340) / 844)
    expect(wider).toBe(Math.ceil((430 * 844) / 340))
    // 高さが 足りるように なったら、そのまま
    expect(fitFromAspect(844, 844, 440)).toBeNull()
    expect(fitFromAspect(0, 844, 280)).toBeNull()
  })
})
