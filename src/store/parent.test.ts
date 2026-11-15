import { beforeEach, describe, expect, it } from 'vitest'
import { createBackup, parseBackup, readBackupInput } from '../lib/backup'
import { addDays } from '../lib/date'
import { DEFAULT_PARENT, PARENT_KEY, playRuleOf, useParent } from './parent'

const DAY = '2026-11-15'
const state = () => useParent.getState()

beforeEach(() => {
  state().reset()
  localStorage.clear()
})

describe('1日の時間(子どもごと)', () => {
  it('はじめは なし。子どもごとに 決められて、ほかの子には かからない', () => {
    expect(playRuleOf(state(), 'p1', DAY)).toEqual({ limit: 0, extra: undefined })
    state().setPlayLimit('p1', 30)
    expect(playRuleOf(state(), 'p1', DAY).limit).toBe(30)
    expect(playRuleOf(state(), 'p2', DAY).limit).toBe(0)
  })

  it('決まった値しか うけつけない', () => {
    expect(() => state().setPlayLimit('p1', 20 as never)).toThrow()
    expect(() => state().setPlayLimit('../x', 30)).toThrow()
    expect(state().playLimits).toEqual({})
  })

  it('きょうだけの延長を 足せて、日付が変わると 消える', () => {
    state().extendPlay('p1', 15, DAY)
    state().extendPlay('p1', 10, DAY)
    state().extendPlay('p2', 30, DAY)
    expect(playRuleOf(state(), 'p1', DAY).extra).toEqual({ day: DAY, minutes: 25 })
    // 次の日は 延長なし。前の日の延長は のこさない
    const tomorrow = addDays(DAY, 1)
    expect(playRuleOf(state(), 'p1', tomorrow).extra).toBeUndefined()
    state().extendPlay('p1', 10, tomorrow)
    expect(state().playExtra).toEqual({ p1: { day: tomorrow, minutes: 10 } })
    state().cancelExtra('p1')
    expect(state().playExtra).toEqual({})
  })

  it('あそぶ人を けしたら、その子の 時間の設定を わすれる', () => {
    state().setPlayLimit('p2', 60)
    state().setPlayLimit('p1', 15)
    state().extendPlay('p2', 10, DAY)
    state().forgetChild('p2')
    expect(state().playLimits).toEqual({ p1: 15 })
    expect(state().playExtra).toEqual({})
  })

  it('前の版の 保存データ(時間の設定なし)も 読める', async () => {
    localStorage.setItem(PARENT_KEY, JSON.stringify({ state: { bossSize: 'short', bossTries: 5, reviewPerDay: 15 }, version: 1 }))
    await useParent.persist.rehydrate()
    expect(state()).toMatchObject({ bossSize: 'short', bossTries: 5, reviewPerDay: 15, playLimits: {}, playExtra: {} })
  })

  it('時間の設定も バックアップに入り、読みこみの検証を通る', () => {
    state().setPlayLimit('p1', 15)
    state().extendPlay('p1', 10, DAY)
    const env = { progressVersion: 6, stateKeys: [] }
    const { file } = createBackup(readBackupInput({ profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' }, localStorage), new Date(), env)
    expect(file.parent).toMatchObject({ playLimits: { p1: 15 }, playExtra: { p1: { day: DAY, minutes: 10 } } })
    expect(parseBackup(JSON.stringify(file), env).ok).toBe(true)
  })

  it('ほかの設定を 変えても、時間の設定は のこる。リセットで はじめに もどる', () => {
    state().setPlayLimit('p1', 45)
    state().update({ bossTries: 1 })
    expect(state().playLimits).toEqual({ p1: 45 })
    state().reset()
    expect(state()).toMatchObject(DEFAULT_PARENT)
  })
})
