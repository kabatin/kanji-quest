import { describe, expect, it } from 'vitest'
import { countsAsPlay, gateAction, restLine, statusOf, todayDone, WARN_LEFT } from './playGate'
import { playStatus } from './playLimit'
import { TALLY } from './answerLog'

const DAY = '2026-11-15'
const NEXT = '2026-11-16'
const settings = { playLimits: { p1: 30, p2: 0 } as const, playExtra: { p1: { day: DAY, minutes: 10 } } }
const at = (screen: string, used: number, extra = 0, warned = false) =>
  gateAction({ status: playStatus({ limit: 30, extra: { day: DAY, minutes: extra }, playMinutes: { [DAY]: used }, today: DAY }), screen, warned })

describe('時間に数える画面', () => {
  it('おうちの かた・せってい・だれが あそぶ・上限の画面は 数えない', () => {
    for (const name of ['parent', 'parent-gate', 'settings', 'profiles', 'limit', 'extend']) expect(countsAsPlay(name)).toBe(false)
    for (const name of ['home', 'learn', 'boss', 'review', 'zukan']) expect(countsAsPlay(name)).toBe(true)
  })
})

describe('上限の判定', () => {
  it('上限ちょうどで「ここまで」。1分 手前までは あそべる', () => {
    expect(at('home', 29)).not.toBe('end')
    expect(at('home', 30)).toBe('end')
    expect(at('map', 31)).toBe('end')
  })
  it('おうちの かたの入り口・あそぶ人の切りかえ では 出さない', () => {
    for (const name of ['parent-gate', 'parent', 'profiles', 'extend', 'limit']) expect(at(name, 40)).toBe('none')
  })
  it('延長すると また あそべる。上限の画面は ひらく', () => {
    expect(at('home', 30, 10)).not.toBe('end')
    expect(at('limit', 30, 10)).toBe('free')
    expect(at('limit', 40, 10)).toBe('none')
    expect(at('limit', 40)).toBe('none')
  })
  it('残り5分で、ホームで 1回だけ しらせる。あそびの とちゅうでは しらせない', () => {
    expect(at('home', 30 - WARN_LEFT - 1)).toBe('none')
    expect(at('home', 30 - WARN_LEFT)).toBe('warn')
    expect(at('home', 29)).toBe('warn')
    expect(at('home', 29, 0, true)).toBe('none')
    expect(at('learn', 27)).toBe('none')
    expect(at('boss', 27)).toBe('none')
  })
  it('上限が なし の子には 何も変わらない', () => {
    const status = playStatus({ limit: 0, playMinutes: { [DAY]: 999 }, today: DAY })
    expect(gateAction({ status, screen: 'home', warned: false })).toBe('none')
    expect(gateAction({ status, screen: 'limit', warned: false })).toBe('free')
  })
})

describe('日付・子どもの切りかえ', () => {
  it('日が かわると もとにもどる(あそんだ分も 延長も その日だけ)', () => {
    const minutes = { [DAY]: 40 }
    expect(statusOf(settings, 'p1', minutes, DAY).reached).toBe(true) // 30 + 延長10 = 40 ちょうど
    expect(statusOf(settings, 'p1', { [DAY]: 39 }, DAY).reached).toBe(false)
    expect(statusOf(settings, 'p1', minutes, NEXT)).toMatchObject({ reached: false, extra: 0, used: 0, left: 30 })
  })
  it('あそぶ人を かえたら、その子の 時間で 見る', () => {
    const minutes = { [DAY]: 50 }
    expect(statusOf(settings, 'p1', minutes, DAY).reached).toBe(true)
    expect(statusOf(settings, 'p2', minutes, DAY).reached).toBe(false)
    expect(statusOf(settings, 'p3', minutes, DAY).limited).toBe(false)
  })
})

describe('きょう やったこと', () => {
  it('今日 覚えた字の数と 答えた数を ひろう', () => {
    const done = todayDone({ 海: DAY, 池: DAY, 山: '2026-11-01' }, { [DAY]: [7, 5, 0, 0, 0, 0] }, DAY)
    expect(done).toEqual({ newKanji: 2, answers: 7 })
    expect(TALLY.answers).toBe(0)
  })
  it('やったことで ひとこと が かわる。何もなくても やさしい', () => {
    expect(restLine({ newKanji: 2, answers: 9 })).toContain('2{字|じ}')
    expect(restLine({ newKanji: 0, answers: 9 })).toContain('9もん')
    expect(restLine({ newKanji: 0, answers: 0 })).toContain('おつかれさま')
  })
})
