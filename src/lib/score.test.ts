import { describe, expect, it } from 'vitest'
import { bestKey, formatTime, growthStage, isBetter, isSkinUnlocked, pointsToNextStage, questionPoints } from './score'

describe('score', () => {
  it('1回で正解なら10点、まちがえた後でも5点もらえる', () => {
    expect(questionPoints(0)).toBe(10)
    expect(questionPoints(1)).toBe(5)
    expect(questionPoints(5)).toBe(5)
  })

  it('自己ベストは点数優先、同点ならタイムで決まる', () => {
    expect(isBetter({ score: 50, timeMs: 9000 }, undefined)).toBe(true)
    expect(isBetter({ score: 60, timeMs: 9000 }, { score: 50, timeMs: 1000 })).toBe(true)
    expect(isBetter({ score: 40, timeMs: 1000 }, { score: 50, timeMs: 9000 })).toBe(false)
    expect(isBetter({ score: 50, timeMs: 8000 }, { score: 50, timeMs: 9000 })).toBe(true)
    expect(isBetter({ score: 50, timeMs: 9000 }, { score: 50, timeMs: 9000 })).toBe(false)
  })

  it('ポイントで木の段階が上がる', () => {
    expect(growthStage(0)).toBe(0)
    expect(growthStage(29)).toBe(0)
    expect(growthStage(30)).toBe(1)
    expect(growthStage(9999)).toBe(4)
  })

  it('次の段階までのポイントを返す', () => {
    expect(pointsToNextStage(0)).toBe(30)
    expect(pointsToNextStage(100)).toBe(50)
    expect(pointsToNextStage(250)).toBeNull()
  })

  it('スキンはポイントで解放される', () => {
    expect(isSkinUnlocked('kami', 0)).toBe(true)
    expect(isSkinUnlocked('sora', 59)).toBe(false)
    expect(isSkinUnlocked('sora', 60)).toBe(true)
    expect(isSkinUnlocked('kin', 150)).toBe(true)
  })

  it('自己ベストのキーは、ヒントの量と問題の数で決まる', () => {
    expect(bestKey(2, 10)).toBe('2x10')
  })

  it('タイムを 分:秒 で表示する', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65_400)).toBe('1:05')
  })
})
