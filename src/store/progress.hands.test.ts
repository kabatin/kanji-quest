import { beforeEach, describe, expect, it } from 'vitest'
import { getKanji } from '../data/kanji'
import { answerOf } from '../lib/answerInput'
import { buildWrite } from '../lib/boss'
import { createBackup, parseBackup, readBackupInput } from '../lib/backup'
import { decodeStrokes, readHands } from '../lib/handwriting'
import { scheduleNew } from '../lib/review'
import { storageKeyFor } from '../lib/profiles'
import type { Point } from '../lib/strokeMatch'
import { useProgress } from './progress'

const DAY = '2026-11-15'
const state = () => useProgress.getState()
const stroke = (n: number): Point[] => Array.from({ length: 30 }, (_, i) => [10 + n * 5 + i, 20 + i] as Point)
const report = { maxHint: 0 as const, askedModel: false, strokes: [stroke(0), stroke(1)] }
const blind = buildWrite(getKanji('海'), 'whole', false)

beforeEach(() => {
  state().reset()
  localStorage.clear()
})

describe('書いた字を のこす', () => {
  it('答えに 筆跡を そえると、見ないで書けた字として のこる(はじめて と いちばん新しい)', () => {
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, report)] }, DAY)
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, { ...report, strokes: [stroke(3)] })] }, '2026-11-20')
    const hand = state().hands['海']
    expect(hand.f.d).toBe(DAY)
    expect(hand.l?.d).toBe('2026-11-20')
    expect(decodeStrokes(hand.f.s)).toHaveLength(2)
    expect(decodeStrokes(hand.l?.s ?? '')).toHaveLength(1)
  })

  it('ボス・にがて れんしゅう の答えでも のこる', () => {
    const answers = [answerOf(blind, 0, report)]
    state().finishBoss({ id: 'a', kind: 'mid', perfect: 1, total: 1, practice: true, answers }, DAY)
    expect(state().hands['海']).toBeDefined()
    state().reset()
    state().finishWeak({ right: ['海'], wrong: [], answers }, DAY)
    expect(state().hands['海']).toBeDefined()
  })

  it('まちがえた答え・ヒントを 使った答え・筆跡が ない答えは のこさない', () => {
    state().finishReview({ right: [], wrong: ['海'], answers: [answerOf(blind, 1, report)] }, DAY)
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, { ...report, maxHint: 3 })] }, DAY)
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0)] }, DAY)
    expect(state().hands).toEqual({})
  })

  it('端末に 保存され、ほかの子としても 読める。こわれていても 開ける', () => {
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, report)] }, DAY)
    expect(Object.keys(readHands('p1'))).toEqual(['海'])
    localStorage.setItem(storageKeyFor('p9'), JSON.stringify({ state: { hands: { 海: { f: 1 } } }, version: 6 }))
    expect(readHands('p9')).toEqual({})
  })

  it('バックアップに入り、検証を通る', () => {
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, report)] }, DAY)
    const env = { progressVersion: 6, stateKeys: Object.keys(state()).filter((k) => typeof state()[k as keyof ReturnType<typeof state>] !== 'function') }
    const { file } = createBackup(readBackupInput({ profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' }, localStorage), new Date(), env)
    expect(file.records.p1.state.hands).toBeDefined()
    expect(parseBackup(JSON.stringify(file), env).ok).toBe(true)
  })
})

describe('しゅくだい で まだ 日が来ていない字', () => {
  it('正解しても 段は 進まない(解答の きろくには のこる)', () => {
    useProgress.setState({ reviews: { 海: { due: '2026-11-25', step: 3 } }, learned: ['海'] })
    state().finishReview({ right: ['海'], wrong: [], answers: [answerOf(blind, 0, report)] }, DAY)
    expect(state().reviews['海']).toEqual({ due: '2026-11-25', step: 3 })
    expect(state().answerLog['海'].n).toBe(1)
    expect(scheduleNew(DAY).step).toBe(0)
  })
})
