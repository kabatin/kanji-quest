import { beforeEach, describe, expect, it } from 'vitest'
import { bestKey } from '../lib/score'
import { STORAGE_KEY, useProgress } from './progress'

const KEY = bestKey(1, 5)

beforeEach(() => {
  useProgress.getState().reset()
})

describe('useProgress', () => {
  it('はじめて学んだ漢字は10ポイント、2回目は2ポイント', () => {
    expect(useProgress.getState().completeKanji('海')).toBe(10)
    expect(useProgress.getState().completeKanji('海')).toBe(2)
    expect(useProgress.getState().learned).toEqual(['海'])
    expect(useProgress.getState().points).toBe(12)
  })

  it('チャレンジの点はポイントに足され、よい記録だけ自己ベストになる', () => {
    expect(useProgress.getState().finishChallenge(KEY, { score: 40, timeMs: 5000 })).toBe(true)
    expect(useProgress.getState().finishChallenge(KEY, { score: 30, timeMs: 1000 })).toBe(false)
    expect(useProgress.getState().bests[KEY]).toEqual({ score: 40, timeMs: 5000 })
    expect(useProgress.getState().points).toBe(70)
    expect(useProgress.getState().bests[bestKey(1, 10)]).toBeUndefined()
  })

  it('ポイントが足りないスキンには変えられない', () => {
    useProgress.getState().setSkin('sora')
    expect(useProgress.getState().skin).toBe('kami')
    useProgress.getState().finishChallenge(KEY, { score: 60, timeMs: 1000 })
    useProgress.getState().setSkin('sora')
    expect(useProgress.getState().skin).toBe('sora')
  })

  it('設定は一部だけ変えられる。タイマーは最初オフ', () => {
    expect(useProgress.getState().settings.timer).toBe(false)
    useProgress.getState().updateSettings({ sound: false })
    expect(useProgress.getState().settings).toEqual({ sound: false, speech: true, icons: true, timer: false })
  })

  it('チャレンジの問題の数と範囲を覚えておく', () => {
    expect(useProgress.getState().challenge).toEqual({ count: 5, scope: 'mix' })
    useProgress.getState().setChallengeOptions({ count: 10 })
    useProgress.getState().setChallengeOptions({ scope: 'grade2' })
    expect(useProgress.getState().challenge).toEqual({ count: 10, scope: 'grade2' })
  })

  it('古い形式の保存データは、学んだ記録を残したまま新しい形式になる', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { learned: ['海'], points: 70, bests: { 1: { score: 60, timeMs: 1 } }, skin: 'sora' }, version: 1 }),
    )
    await useProgress.persist.rehydrate()
    const state = useProgress.getState()
    expect(state.learned).toEqual(['海'])
    expect(state.points).toBe(70)
    expect(state.skin).toBe('sora')
    expect(state.bests).toEqual({})
    expect(state.challenge).toEqual({ count: 5, scope: 'mix' })
  })

  it('端末に保存され、リセットで最初にもどる', () => {
    useProgress.getState().completeKanji('木')
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.state.learned).toEqual(['木'])
    useProgress.getState().reset()
    expect(useProgress.getState().learned).toEqual([])
    expect(useProgress.getState().points).toBe(0)
  })
})
