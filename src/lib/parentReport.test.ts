import { describe, expect, it } from 'vitest'
import { addDays } from './date'
import { formatDay, formatMinutes, listChars, weekRange, weekReport, weekSentences, weekSummary } from './parentReport'
import { EMPTY_REPORT_INPUT, type ReportInput } from './reportInput'

const TODAY = '2026-11-15'

const INPUT: ReportInput = {
  ...EMPTY_REPORT_INPUT,
  learned: ['日', '川', '木', '山'],
  learnedOn: { 川: '2026-11-05', 木: '2026-11-10', 山: '2026-11-12' },
  misses: { 右: 2, 左: 1, 石: 1 },
  answerLog: {
    木: { a: [], n: 3, x: 0, w: 2, b: '2026-11-13' },
    川: { a: [], n: 3, x: 1, w: 1, b: '2026-11-13' },
    花: { a: [], n: 2, x: 1, w: 0, o: '2026-11-14' },
    石: { a: [], n: 2, x: 2, w: 0, o: '2026-11-14' },
  },
  answerDays: { '2026-11-14': [12, 10, 0, 0, 0, 0], '2026-11-06': [3, 3, 0, 0, 0, 0] },
  playMinutes: { [TODAY]: 20, '2026-11-14': 30, '2026-11-10': 30, '2026-11-05': 60 },
}

describe('週の はんい', () => {
  it('きょうまでの7日、その前の7日', () => {
    expect(weekRange(TODAY)).toEqual({ from: '2026-11-09', to: TODAY })
    expect(weekRange(TODAY, 1)).toEqual({ from: '2026-11-02', to: '2026-11-08' })
  })
})

describe('週のレポート', () => {
  const report = weekReport(INPUT, TODAY)

  it('この1週間に 覚えた字・見本なしで書けるようになった字・苦手から ぬけた字・まだ苦手な字', () => {
    expect(report.thisWeek.learned).toEqual(['木', '山'])
    // 一度 書けても、いま さがっている字(川)は 入れない
    expect(report.thisWeek.freeWritten).toEqual(['木'])
    // また まちがえて 苦手に もどった字(石)は 入れない
    expect(report.thisWeek.leftWeak).toEqual(['花'])
    expect(report.stillWeak.map((w) => w.char)).toEqual(['右', '左', '石'])
  })

  it('遊んだ日数と分数、先週との差', () => {
    expect(report.thisWeek).toMatchObject({ playDays: 3, minutes: 80, answers: 12 })
    expect(report.lastWeek).toMatchObject({ playDays: 1, minutes: 60, learned: ['川'], answers: 3 })
    expect(report.diff).toEqual({ learned: 1, freeWritten: 1, minutes: 20, playDays: 2 })
    expect(report.status).toBe('active')
  })

  it('保護者向けの 1〜3文に まとめる', () => {
    expect(weekSentences(report)).toEqual([
      'この1週間で2字を覚え、1字が見本なしで書けるようになりました。',
      '『花』が苦手でなくなり、『右』『左』『石』がまだ苦手です。',
      '遊んだのは3日・合計1時間20分で、先週より20分多くなりました。',
    ])
    expect(weekSummary(report)).toBe(weekSentences(report).join(''))
  })

  it('新しい字が ない週は、答えた数や 書けるようになった字を 伝える', () => {
    const quietLearn = weekReport({ ...INPUT, learnedOn: { 川: '2026-11-05' }, answerLog: {}, misses: {} }, TODAY)
    expect(weekSentences(quietLearn)[0]).toBe('この1週間は新しい字を覚えず、復習などで12問に答えました。')
    const onlyWrite = weekReport({ ...INPUT, learnedOn: {}, misses: {} }, TODAY)
    expect(weekSentences(onlyWrite)[0]).toBe('この1週間は新しい字はありませんでしたが、1字が見本なしで書けるようになりました。')
  })

  it('記録が まだ ない・この1週間 遊んでいない・少ない ときは、その旨の文にする', () => {
    expect(weekReport(EMPTY_REPORT_INPUT, TODAY).status).toBe('empty')
    expect(weekSummary(weekReport(EMPTY_REPORT_INPUT, TODAY))).toBe('まだ記録がありません。漢字を学ぶと、ここに1週間のようすが出ます。')

    const idle = weekReport({ ...INPUT, playMinutes: { '2026-11-05': 60 }, answerDays: {}, misses: { 右: 1 } }, addDays(TODAY, 7))
    expect(idle.status).toBe('quiet')
    expect(weekSentences(idle)).toEqual(['この1週間は遊んだ記録がありません(最後に遊んだのは11月5日です)。', '『右』がまだ苦手です。'])

    const few = weekReport({ ...EMPTY_REPORT_INPUT, learned: ['日'], playMinutes: { [TODAY]: 4 }, answerDays: { [TODAY]: [2, 2, 0, 0, 0, 0] } }, TODAY)
    expect(few.status).toBe('few')
    expect(weekSentences(few)).toEqual(['この1週間の記録は、まだ少しです(遊んだのは1日・4分)。'])
  })
})

describe('ことばの かたち', () => {
  it('字の並べ方・日付・分数', () => {
    expect(listChars(['右'])).toBe('『右』')
    expect(listChars(['右', '左'])).toBe('『右』と『左』')
    expect(listChars(['右', '左', '石', '花', '日'])).toBe('『右』『左』『石』など5字')
    expect(formatDay('2026-11-05')).toBe('11月5日')
    expect(formatMinutes(45)).toBe('45分')
    expect(formatMinutes(60)).toBe('1時間')
    expect(formatMinutes(125)).toBe('2時間5分')
  })
})
