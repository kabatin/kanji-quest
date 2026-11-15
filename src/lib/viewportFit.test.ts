import { describe, expect, it } from 'vitest'
import { fitViewportWidth, viewportContent } from './viewportFit'

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
})
