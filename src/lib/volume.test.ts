import { describe, expect, it } from 'vitest'
import { choiceOf, sanitizeVolume, scaleOf, VOLUME_CHOICES, VOLUME_SCALE, volumePatch, type Volume } from './volume'

describe('音の大きさ', () => {
  it('4段(なし / ちいさい / ふつう / おおきい)で、ふつう は いままでの音量', () => {
    expect(VOLUME_CHOICES).toEqual(['off', 'low', 'normal', 'high'])
    for (const channel of ['sound', 'music', 'speech'] as const) {
      const { low, normal, high } = VOLUME_SCALE[channel]
      expect(normal).toBe(1)
      expect(low).toBeLessThan(normal)
      expect(high).toBeGreaterThan(normal)
      expect(high).toBeLessThanOrEqual(1.5)
    }
  })

  it('古い記録の ON は「ふつう」、OFF は「なし」として引きつぐ', () => {
    expect(choiceOf(true, sanitizeVolume(undefined))).toBe('normal')
    expect(choiceOf(false, 'normal')).toBe('off')
    expect(choiceOf(true, 'high')).toBe('high')
  })

  it('「なし」は ON/OFF だけ かえて、前の大きさを おぼえておく', () => {
    expect(volumePatch('music', 'off')).toEqual({ music: false })
    expect(volumePatch('music', 'low')).toEqual({ music: true, musicVol: 'low' })
  })

  it('こわれた値は「ふつう」。OFF の倍率は 0', () => {
    expect(sanitizeVolume('loud')).toBe('normal')
    expect(scaleOf('sound', false, 'high')).toBe(0)
    expect(scaleOf('sound', true, 'low')).toBe(VOLUME_SCALE.sound.low)
  })

  it('おおきい でも、こえ が おと・おんがく より 小さくならない(バランス)', () => {
    const base = { sound: 0.16, music: 0.045 * 0.3, speech: 0.5 }
    expect(base.speech * VOLUME_SCALE.speech.low).toBeGreaterThan(base.music * VOLUME_SCALE.music.high)
  })
  it('大きさが入っていない設定でも、ふつう の倍率になる(数にならない値を返さない)', () => {
    expect(scaleOf('music', true, undefined as unknown as Volume)).toBe(1)
  })
})
