import { describe, expect, it } from 'vitest'
import { addDays } from './date'
import { addExtra, extraToday, PLAY_EXTRA_MAX, PLAY_LIMIT_CHOICES, playStatus } from './playLimit'

const DAY = '2026-11-15'

describe('1日の時間', () => {
  it('えらべるのは なし・15・30・45・60分', () => {
    expect(PLAY_LIMIT_CHOICES).toEqual([0, 15, 30, 45, 60])
  })

  it('なし のときは いつまでも あそべる', () => {
    expect(playStatus({ limit: 0, playMinutes: { [DAY]: 500 }, today: DAY })).toEqual({
      limited: false,
      base: 0,
      extra: 0,
      limit: null,
      used: 500,
      left: null,
      reached: false,
    })
  })

  it('きょう あそんだ分数から、あと何分か・上限に来たかを出す(きのうの分は 数えない)', () => {
    const playMinutes = { [addDays(DAY, -1)]: 40, [DAY]: 12 }
    expect(playStatus({ limit: 15, playMinutes, today: DAY })).toMatchObject({ limited: true, limit: 15, used: 12, left: 3, reached: false })
    expect(playStatus({ limit: 15, playMinutes: { [DAY]: 15 }, today: DAY })).toMatchObject({ left: 0, reached: true })
    expect(playStatus({ limit: 15, playMinutes: { [DAY]: 20 }, today: DAY })).toMatchObject({ left: 0, reached: true })
  })

  it('きょうだけの延長を 足せる。日付が変わると 消える', () => {
    const extra = addExtra(addExtra(undefined, 10, DAY), 15, DAY)
    expect(extra).toEqual({ day: DAY, minutes: 25 })
    expect(playStatus({ limit: 30, extra, playMinutes: { [DAY]: 40 }, today: DAY })).toMatchObject({ base: 30, extra: 25, limit: 55, left: 15, reached: false })
    const tomorrow = addDays(DAY, 1)
    expect(extraToday(extra, tomorrow)).toBe(0)
    expect(addExtra(extra, 10, tomorrow)).toEqual({ day: tomorrow, minutes: 10 })
    expect(playStatus({ limit: 30, extra, playMinutes: { [tomorrow]: 30 }, today: tomorrow })).toMatchObject({ extra: 0, reached: true })
  })

  it('延長は 0分から 上限までに おさめる。まちがった数は 足さない', () => {
    expect(addExtra(undefined, 999, DAY).minutes).toBe(PLAY_EXTRA_MAX)
    expect(addExtra({ day: DAY, minutes: 10 }, -30, DAY).minutes).toBe(0)
    expect(addExtra({ day: DAY, minutes: 10 }, Number.NaN, DAY).minutes).toBe(10)
  })
})
