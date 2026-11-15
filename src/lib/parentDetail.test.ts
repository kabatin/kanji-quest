import { describe, expect, it } from 'vitest'
import { charHistory } from './charHistory'
import { addDays } from './date'
import { learnedOnText, missText, playTimeText, reviewText, weakText } from './parentDetail'
import { playStatus } from './playLimit'
import { EMPTY_REPORT_INPUT, type ReportInput } from './reportInput'

const TODAY = '2026-11-15'
const history = (patch: Partial<ReportInput>, char = '木') => charHistory(char, { ...EMPTY_REPORT_INPUT, ...patch })

describe('字の くわしい記録の ことば', () => {
  it('覚えた日: 日付 / 記録をとる前 / まだ', () => {
    expect(learnedOnText(history({ learned: ['木'], learnedOn: { 木: '2026-11-05' } }))).toBe('11月5日')
    expect(learnedOnText(history({ learned: ['木'] }))).toBe('記録をとりはじめる前')
    expect(learnedOnText(history({}))).toBe('まだ学んでいません')
  })

  it('次の復習: きょう・あした・何日後・おぼえきった字', () => {
    const at = (due: string, step = 1) => reviewText(history({ learned: ['木'], reviews: { 木: { due, step } } }), TODAY)
    expect(at(addDays(TODAY, -2))).toBe('きょう(復習の日が来ています)')
    expect(at(TODAY)).toBe('きょう(復習の日が来ています)')
    expect(at(addDays(TODAY, 1))).toBe('あした(11月16日)')
    expect(at(addDays(TODAY, 5))).toBe('11月20日(5日後)')
    expect(at(addDays(TODAY, 60), 6)).toBe('1月14日(60日後)・覚えきった字なので、ときどき出します')
    expect(reviewText(history({ learned: ['木'] }), TODAY)).toBe('予定はありません')
    expect(reviewText(history({}), TODAY)).toBe('学ぶと、次の日から復習に出ます')
  })

  it('まちがい: 記録があれば 答えた数と まちがえた数、なければ その旨', () => {
    expect(missText(history({ answerLog: { 木: { a: [], n: 12, x: 3, w: 2 } } }))).toBe('これまで12問に答え、3回まちがえました')
    expect(missText(history({ answerLog: { 木: { a: [], n: 4, x: 0, w: 2 } } }))).toBe('これまで4問に答え、まちがいはありません')
    expect(missText(history({ learned: ['木'] }))).toBe('記録をとりはじめてからは、まだありません')
  })

  it('苦手: のこっている回数と、ぬけかた', () => {
    expect(weakText(history({ misses: { 木: 2 } }))).toBe('いま苦手な字です。正解するたびに1つ減り、あと2回の正解で苦手でなくなります。')
    expect(weakText(history({}))).toBeNull()
  })
})

describe('1日の時間の ことば', () => {
  const at = (limit: 0 | 15 | 30, used: number, extra = 0) =>
    playTimeText(playStatus({ limit, extra: extra > 0 ? { day: TODAY, minutes: extra } : undefined, playMinutes: { [TODAY]: used }, today: TODAY }))

  it('上限なし / あと何分 / 延長中 / 上限に達した', () => {
    expect(at(0, 12)).toBe('上限はありません。きょうは12分遊びました。')
    expect(at(30, 12)).toBe('きょうは12分遊びました。あと18分遊べます。')
    expect(at(30, 40, 15)).toBe('きょうは40分遊びました。あと5分遊べます(きょうだけ15分延長しています)。')
    expect(at(15, 15)).toBe('きょうは15分遊び、上限に達しました。延長すると、すぐに続けられます。')
  })
})
