import { describe, expect, it } from 'vitest'
import { EMPTY_BOOK, logAnswers } from './answerLog'
import { addDays } from './date'
import { answerText, charHistory } from './charHistory'
import { growthTrend, MIN_RATE_TOTAL, rateOf, ratesIn, rateTrend } from './parentTrend'
import { weekRange } from './parentReport'
import { EMPTY_REPORT_INPUT, type ReportInput } from './reportInput'

const TODAY = '2026-11-15'

describe('週ごとの推移(覚えた字・見本なしで書けた字の 累計)', () => {
  it('古い週から順に。覚えた日が ない 古い字は、はじめから 数える', () => {
    const input: ReportInput = {
      ...EMPTY_REPORT_INPUT,
      learned: ['日', '木', '山'],
      learnedOn: { 木: addDays(TODAY, -10), 山: TODAY },
      answerLog: { 木: { a: [], n: 1, x: 0, w: 2, b: addDays(TODAY, -2) } },
      // ログがない字は、復習の段から 書けた日を 見つもる(段4: 予定日の30日前)
      reviews: { 日: { due: addDays(TODAY, 10), step: 4 } },
    }
    const trend = growthTrend(input, TODAY, 3)
    expect(trend.map((p) => p.range)).toEqual([weekRange(TODAY, 2), weekRange(TODAY, 1), weekRange(TODAY)])
    expect(trend.map((p) => p.learned)).toEqual([1, 2, 3])
    expect(trend.map((p) => p.freeWritten)).toEqual([1, 1, 2])
  })
})

describe('割合(1週間たっても書けた割合・ヒントを使った割合)', () => {
  it('分母が 少ないときは 値を出さず「まだ足りない」', () => {
    expect(rateOf(2, 3)).toEqual({ status: 'few', count: 2, total: 3 })
    expect(rateOf(4, MIN_RATE_TOTAL)).toEqual({ status: 'ok', value: 0.8, count: 4, total: MIN_RATE_TOTAL })
  })

  it('日ごとの集計から 週ごとに出す', () => {
    const answerDays = {
      [TODAY]: [10, 8, 4, 3, 6, 1],
      [addDays(TODAY, -1)]: [5, 5, 2, 2, 2, 1],
      [addDays(TODAY, -8)]: [3, 3, 1, 1, 1, 0],
    }
    expect(ratesIn(answerDays, weekRange(TODAY))).toEqual({
      retention: { status: 'ok', value: 5 / 6, count: 5, total: 6 },
      hintUse: { status: 'ok', value: 2 / 8, count: 2, total: 8 },
    })
    const trend = rateTrend(answerDays, TODAY, 2)
    expect(trend[0]).toMatchObject({ range: weekRange(TODAY, 1), retention: { status: 'few', total: 1 }, hintUse: { status: 'few', total: 1 } })
    expect(trend[1].retention).toMatchObject({ status: 'ok', total: 6 })
  })
})

describe('字ごとの くわしい履歴', () => {
  it('覚えた日・まちがいの回数・最近の答え・今の状態・次の復習日', () => {
    const seed = { stamps: {}, reviews: { 右: { due: TODAY, step: 3 } }, learnedOn: { 右: '2026-10-01' } }
    const first = logAnswers(EMPTY_BOOK, 'review', [{ char: '右', kind: 'blind', ok: false, hint: 2 }], addDays(TODAY, -1), seed)
    const book = logAnswers(first, 'weak', [{ char: '右', kind: 'model', ok: true, hint: 0 }], TODAY, seed)
    const input: ReportInput = { ...EMPTY_REPORT_INPUT, ...book, learned: ['右'], learnedOn: seed.learnedOn, misses: { 右: 1 }, reviews: { 右: { due: addDays(TODAY, 1), step: 0 } } }
    const history = charHistory('右', input)
    expect(history).toMatchObject({
      char: '右',
      state: 'model',
      weak: true,
      misses: 1,
      learnedOn: '2026-10-01',
      logged: true,
      answered: 2,
      wrong: 1,
      nextReview: addDays(TODAY, 1),
      reviewStep: 0,
    })
    expect(history.recent.map((a) => a.where)).toEqual(['weak', 'review'])
    expect(answerText(history.recent[1])).toBe('11月14日 復習・見ないで書く ×(ヒント: 向きの矢印)')
    expect(answerText(history.recent[0])).toBe('11月15日 にがて練習・見て書く ○(ヒントなし)')
  })

  it('記録が ない字でも こわれない', () => {
    expect(charHistory('木', EMPTY_REPORT_INPUT)).toMatchObject({ state: 'none', logged: false, answered: 0, recent: [], nextReview: null, learnedOn: null })
  })
})
