import { describe, expect, it } from 'vitest'
import { bigScreenWay, isIos, shouldHint } from './fullscreen'

const base = { standalone: false, fullscreen: false, canRequest: true, ios: false }

describe('がめんを 大きく する方法', () => {
  it('ホーム画面から ひらいている・全画面のときは、もう 大きい', () => {
    expect(bigScreenWay({ ...base, standalone: true })).toBe('already')
    expect(bigScreenWay({ ...base, fullscreen: true })).toBe('already')
  })

  it('iPhone・iPad は ボタンでは できないので、ホーム画面に追加 を あんない する', () => {
    expect(bigScreenWay({ ...base, ios: true })).toBe('add-to-home')
  })

  it('ほかの端末は、できるなら ボタン、できないなら なし', () => {
    expect(bigScreenWay(base)).toBe('button')
    expect(bigScreenWay({ ...base, canRequest: false })).toBe('none')
  })

  it('iPad は Mac と名のるので、タッチの本数で見分ける', () => {
    expect(isIos('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe(true)
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true)
    expect(isIos('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false)
    expect(isIos('Mozilla/5.0 (Linux; Android 14)', 5)).toBe(false)
  })

  it('あんない は、がめんが ひくくて まだ見ていないときだけ', () => {
    expect(shouldHint('add-to-home', 390, false)).toBe(true)
    expect(shouldHint('button', 390, false)).toBe(true)
    expect(shouldHint('add-to-home', 390, true)).toBe(false)
    expect(shouldHint('add-to-home', 768, false)).toBe(false)
    expect(shouldHint('already', 390, false)).toBe(false)
    expect(shouldHint('none', 390, false)).toBe(false)
  })
})
