import { describe, expect, it } from 'vitest'
import { ALL_STAGES } from '../data/areas'
import { KANJI } from '../data/kanji'
import { addDays } from './date'
import { masteryMap } from './mastery'
import { axisTicks, firstRecordDay, mapGroups, niceMax, rateView, recentRates, TREND_MIN_WEEKS, trendStatus, trendWeeks, undatedCount } from './parentView'
import { TREND_WEEKS } from './parentTrend'
import { EMPTY_REPORT_INPUT, type ReportInput } from './reportInput'

const TODAY = '2026-11-15'

describe('習熟マップの まとまり', () => {
  it('学年 → エリア → ステージ(5字)の順に分け、学年ごとの数を出す', () => {
    const first = ALL_STAGES[0].kanji
    const cells = masteryMap(ALL_STAGES, { ...EMPTY_REPORT_INPUT, learned: [first[0], first[1]] })
    const groups = mapGroups(cells)
    expect(groups.map((g) => g.grade)).toEqual([1, 2])
    expect(groups.map((g) => g.total)).toEqual([80, 160])
    expect(groups[0].areas.map((a) => a.areaIndex)).toEqual([0, 1])
    expect(groups[1].areas).toHaveLength(4)
    expect(groups[0].areas[0].stages).toHaveLength(8)
    expect(groups[0].areas[0].stages[0].map((c) => c.char)).toEqual(first)
    expect(groups[0].counts).toMatchObject({ none: 78, learned: 2 })
    expect(groups[1].counts.none).toBe(160)
    expect(groups.flatMap((g) => g.areas.flatMap((a) => a.stages.flat()))).toHaveLength(KANJI.length)
  })
})

describe('記録の はじまり と 推移の 週の数', () => {
  const started = (day: string): ReportInput => ({ ...EMPTY_REPORT_INPUT, learned: ['木'], learnedOn: { 木: day } })

  it('覚えた日・遊んだ日・答えた日の いちばん古い日', () => {
    expect(firstRecordDay(EMPTY_REPORT_INPUT)).toBeNull()
    const input: ReportInput = {
      ...started('2026-11-10'),
      playMinutes: { '2026-11-08': 3, '2026-10-01': 0 },
      answerDays: { '2026-11-09': [1, 1, 0, 0, 0, 0] },
    }
    // 0分の日は 数えない
    expect(firstRecordDay(input)).toBe('2026-11-08')
  })

  it('はじめた週から出す(4週〜12週)。日付のない古い記録だけなら 12週', () => {
    expect(trendWeeks(started(TODAY), TODAY)).toBe(TREND_MIN_WEEKS)
    expect(trendWeeks(started(addDays(TODAY, -7 * 6)), TODAY)).toBe(7)
    expect(trendWeeks(started(addDays(TODAY, -400)), TODAY)).toBe(TREND_WEEKS)
    expect(trendWeeks({ ...EMPTY_REPORT_INPUT, learned: ['木'] }, TODAY)).toBe(TREND_WEEKS)
  })

  it('記録が ない → empty、はじめて 1週間たたない → early(あと何日)、それ以外 → ok', () => {
    expect(trendStatus(EMPTY_REPORT_INPUT, TODAY)).toEqual({ status: 'empty', daysLeft: 0 })
    expect(trendStatus(started(TODAY), TODAY)).toEqual({ status: 'early', daysLeft: 6 })
    expect(trendStatus(started(addDays(TODAY, -5)), TODAY)).toEqual({ status: 'early', daysLeft: 1 })
    expect(trendStatus(started(addDays(TODAY, -6)), TODAY)).toEqual({ status: 'ok', daysLeft: 0 })
    // 日付のない 古い記録(覚えた字は ある)は、そのまま出す
    expect(trendStatus({ ...EMPTY_REPORT_INPUT, learned: ['木'] }, TODAY).status).toBe('ok')
  })

  it('覚えた日が わからない字の数(古い記録)', () => {
    expect(undatedCount({ ...EMPTY_REPORT_INPUT, learned: ['木', '山', '川'], learnedOn: { 山: TODAY } })).toBe(2)
    expect(undatedCount(EMPTY_REPORT_INPUT)).toBe(0)
  })
})

describe('グラフの目もり', () => {
  it('きりのよい いちばん上の値と、0・半分・上 の目もり', () => {
    expect(niceMax(0)).toBe(10)
    expect(niceMax(7)).toBe(10)
    expect(niceMax(10)).toBe(10)
    expect(niceMax(11)).toBe(20)
    expect(niceMax(61)).toBe(80)
    expect(niceMax(239)).toBe(240)
    expect(niceMax(500)).toBe(500)
    expect(axisTicks(80)).toEqual([0, 40, 80])
  })
})

describe('割合の 見せ方', () => {
  it('分母が 足りないときは 値を出さず、あと何問かを出す', () => {
    expect(rateView({ status: 'few', count: 1, total: 2 })).toEqual({ kind: 'few', total: 2, needed: 3 })
    expect(rateView({ status: 'ok', value: 0.834, count: 15, total: 18 })).toEqual({ kind: 'value', percent: 83, count: 15, total: 18, before: null })
    expect(rateView({ status: 'ok', value: 0.5, count: 5, total: 10 }, { status: 'ok', value: 0.75, count: 6, total: 8 })).toMatchObject({ percent: 50, before: 75 })
    expect(rateView({ status: 'ok', value: 0.5, count: 5, total: 10 }, { status: 'few', count: 1, total: 1 })).toMatchObject({ before: null })
  })

  it('最近4週と、その前の4週を くらべる', () => {
    const answerDays = {
      [TODAY]: [10, 8, 4, 3, 6, 1],
      [addDays(TODAY, -27)]: [5, 5, 2, 2, 2, 1],
      [addDays(TODAY, -28)]: [9, 9, 6, 3, 6, 3],
    }
    const rates = recentRates(answerDays, TODAY)
    expect(rates.retention).toEqual({ kind: 'value', percent: 83, count: 5, total: 6, before: 50 })
    expect(rates.hintUse).toEqual({ kind: 'value', percent: 25, count: 2, total: 8, before: 50 })
    expect(recentRates({}, TODAY).retention).toEqual({ kind: 'few', total: 0, needed: 5 })
  })
})
