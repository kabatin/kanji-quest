import { beforeEach, describe, expect, it } from 'vitest'
import { KANJI } from '../data/kanji'
import { createBackup, parseBackup, planRestore, readBackupInput } from '../lib/backup'
import { HOMEWORK_MAX } from '../lib/homework'
import { PARENT_KEY, useParent } from './parent'

const DAY = '2026-11-15'
const state = () => useParent.getState()

beforeEach(() => {
  state().reset()
  localStorage.clear()
})

describe('しゅくだい の設定(子どもごと)', () => {
  it('子どもごとに えらべて、押すと はずせる', () => {
    expect(state().toggleHomework('p1', '右', DAY)).toBe(true)
    state().toggleHomework('p2', '左', DAY)
    expect(state().homework).toEqual({ p1: { 右: DAY }, p2: { 左: DAY } })
    state().toggleHomework('p1', '右', DAY)
    expect(state().homework).toEqual({ p2: { 左: DAY } })
  })

  it('上限を こえては えらべない', () => {
    KANJI.slice(0, HOMEWORK_MAX).forEach((k) => state().toggleHomework('p1', k.char, DAY))
    expect(state().toggleHomework('p1', KANJI[HOMEWORK_MAX].char, DAY)).toBe(false)
    expect(Object.keys(state().homework.p1)).toHaveLength(HOMEWORK_MAX)
  })

  it('「ぜんぶ はずす」は その子だけ', () => {
    state().toggleHomework('p1', '右', DAY)
    state().toggleHomework('p2', '左', DAY)
    state().clearHomework('p1')
    expect(state().homework).toEqual({ p2: { 左: DAY } })
  })

  it('ほかの設定を 変えても のこる', () => {
    state().toggleHomework('p1', '右', DAY)
    state().update({ bossTries: 1 })
    state().setPlayLimit('p1', 30)
    expect(state().homework).toEqual({ p1: { 右: DAY } })
  })

  it('あそぶ人を けしたら、その子の しゅくだい も わすれる', () => {
    state().toggleHomework('p1', '右', DAY)
    state().toggleHomework('p2', '左', DAY)
    state().forgetChild('p2')
    expect(state().homework).toEqual({ p1: { 右: DAY } })
  })

  it('前の版の 保存データ(しゅくだい なし)も 読める。こわれた形は はじめにもどす', async () => {
    localStorage.setItem(PARENT_KEY, JSON.stringify({ state: { bossSize: 'short', bossTries: 5, reviewPerDay: 15 }, version: 1 }))
    await useParent.persist.rehydrate()
    expect(state().homework).toEqual({})
    localStorage.setItem(PARENT_KEY, JSON.stringify({ state: { bossSize: 'short', bossTries: 5, reviewPerDay: 15, homework: { p1: 5 } }, version: 1 }))
    await useParent.persist.rehydrate()
    expect(state().bossSize).toBe('normal')
  })

  it('バックアップに入り、検証を通り、戻せる', () => {
    state().toggleHomework('p1', '右', DAY)
    const env = { progressVersion: 6, stateKeys: [] }
    const { file } = createBackup(readBackupInput({ profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' }, localStorage), new Date(), env)
    expect(file.parent?.homework).toEqual({ p1: { 右: DAY } })
    const parsed = parseBackup(JSON.stringify(file), env)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    state().reset()
    const plan = planRestore(parsed.file, ['p1'])
    expect(JSON.parse(plan.set[PARENT_KEY]).state.homework).toEqual({ p1: { 右: DAY } })
  })

  it('上限を こえた しゅくだい の ファイルは ことわる', () => {
    const env = { progressVersion: 6, stateKeys: [] }
    const { file } = createBackup(readBackupInput({ profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' }, localStorage), new Date(), env)
    const many = Object.fromEntries(KANJI.slice(0, HOMEWORK_MAX + 1).map((k) => [k.char, DAY]))
    const bad = { ...file, parent: { bossSize: 'normal', bossTries: 3, reviewPerDay: 10, homework: { p1: many } } }
    expect(parseBackup(JSON.stringify(bad), env).ok).toBe(false)
  })
})
