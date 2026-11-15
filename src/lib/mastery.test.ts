import { describe, expect, it } from 'vitest'
import { ALL_STAGES } from '../data/areas'
import { KANJI } from '../data/kanji'
import { EMPTY_BOOK, logAnswers } from './answerLog'
import { addDays } from './date'
import { firstFreeWriteDay, masteryCounts, masteryMap, masteryOf, type MasteryInput } from './mastery'
import { STAMPS } from './rewards'

const DAY = '2026-11-15'
const EMPTY: MasteryInput = { learned: [], stamps: {}, reviews: {}, answerLog: {} }

describe('字ごとの 習熟度', () => {
  it('学んでいない字は「まだ」、学んだだけなら「学んだ」', () => {
    expect(masteryOf('木', EMPTY)).toBe('none')
    expect(masteryOf('木', { ...EMPTY, learned: ['木'] })).toBe('learned')
    expect(masteryOf('木', { ...EMPTY, stamps: { 木: STAMPS.learn } })).toBe('learned')
  })

  it('ログがない古い記録でも、はんこ と 復習の段から もっともらしい状態になる', () => {
    const old: MasteryInput = {
      learned: ['木', '山', '川', '日'],
      stamps: { 木: STAMPS.learn | STAMPS.write, 山: STAMPS.learn, 川: STAMPS.learn, 日: STAMPS.learn },
      reviews: { 木: { due: DAY, step: 0 }, 山: { due: DAY, step: 2 }, 川: { due: DAY, step: 4 }, 日: { due: DAY, step: 6 } },
      answerLog: {},
    }
    expect(['木', '山', '川', '日'].map((char) => masteryOf(char, old))).toEqual(['model', 'model', 'blind', 'solid'])
    expect(firstFreeWriteDay('川', old)).toBe(addDays(DAY, -30))
    expect(firstFreeWriteDay('山', old)).toBeUndefined()
  })

  it('ログがある字は、ログの 書く力の段で決まる(見ないで書けなかったら さがる)', () => {
    const seed = { stamps: {}, reviews: { 木: { due: DAY, step: 5 } }, learnedOn: {} }
    const book = logAnswers(EMPTY_BOOK, 'review', [{ char: '木', kind: 'blind', ok: false, hint: 2 }], DAY, seed)
    const input = { ...EMPTY, learned: ['木'], reviews: seed.reviews, answerLog: book.answerLog }
    expect(masteryOf('木', input)).toBe('model')
    // 見つもりで のこした「はじめて書けた日」は のこる
    expect(firstFreeWriteDay('木', input)).toBe(addDays(DAY, -90))
  })
})

describe('習熟マップ', () => {
  it('全240字を 学年・ステージの順に、状態と 苦手 つきで 並べる', () => {
    const first = ALL_STAGES[0].kanji
    const input = { ...EMPTY, learned: [first[0]], stamps: { [first[1]]: STAMPS.learn | STAMPS.write }, misses: { [first[0]]: 2 } }
    const cells = masteryMap(ALL_STAGES, input)
    expect(cells).toHaveLength(KANJI.length)
    expect(cells[0]).toEqual({ char: first[0], grade: 1, stage: 1, areaIndex: 0, state: 'learned', weak: true, misses: 2 })
    expect(cells[1]).toMatchObject({ char: first[1], state: 'model', weak: false })
    expect(cells.map((c) => c.grade)).toEqual([...cells.map((c) => c.grade)].sort())
    expect(masteryCounts(cells)).toEqual({ none: KANJI.length - 2, learned: 1, model: 1, blind: 0, solid: 0 })
  })
})
