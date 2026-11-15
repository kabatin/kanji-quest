import { describe, expect, it } from 'vitest'
import { KANJI } from '../data/kanji'
import { applyReview } from '../store/records'
import { encodeEntry, type AnswerLog } from './answerLog'
import { pickDailyChars } from './dailyChallenge'
import { homeworkAllDone, homeworkChars, homeworkDoneCount, homeworkRows, HOMEWORK_MAX, reviewQueue, toggleHomework, type Homework } from './homework'
import { EMPTY_REPORT_INPUT } from './reportInput'

const TODAY = '2026-11-15'
const card = (due: string, step = 1) => ({ due, step })

describe('しゅくだい を えらぶ', () => {
  it('押すと えらび、もう一度 押すと はずす', () => {
    const one = toggleHomework({}, '右', TODAY)
    expect(one.homework).toEqual({ 右: TODAY })
    expect(toggleHomework(one.homework, '右', '2026-11-16').homework).toEqual({})
  })

  it('上限に なったら 足さない。はずすことは できる', () => {
    const chars = KANJI.slice(0, HOMEWORK_MAX).map((k) => k.char)
    const full = chars.reduce<Homework>((map, char) => toggleHomework(map, char, TODAY).homework, {})
    expect(homeworkChars(full)).toHaveLength(HOMEWORK_MAX)
    const more = toggleHomework(full, KANJI[HOMEWORK_MAX].char, TODAY)
    expect(more.full).toBe(true)
    expect(more.homework).toBe(full)
    expect(homeworkChars(toggleHomework(full, chars[0], TODAY).homework)).toHaveLength(HOMEWORK_MAX - 1)
  })
})

describe('きょうの ふくしゅう の順', () => {
  const reviews = { 右: card('2026-11-20'), 左: card('2026-11-10'), 石: card('2026-11-15', 3), 山: card('2026-11-25') }
  const base = { reviews, misses: {}, answerLog: {} as AnswerLog, today: TODAY }

  it('しゅくだい の字は 日が来ていなくても 先に出る', () => {
    expect(reviewQueue({ ...base, homework: ['右', '山'] })).toEqual(['右', '山', '左', '石'])
  })

  it('しゅくだい が なければ これまでどおり', () => {
    expect(reviewQueue({ ...base, homework: [] })).toEqual(['左', '石'])
  })

  it('まだ 覚えていない字(ふくしゅう の予定が ない字)は 入らない', () => {
    expect(reviewQueue({ ...base, homework: ['海'] })).toEqual(['左', '石'])
  })

  it('きょう もう ふくしゅう した字は もう出さない', () => {
    const answerLog: AnswerLog = { 右: { a: [encodeEntry({ day: TODAY, where: 'review', kind: 'select', ok: true, hint: null })], n: 1, x: 0, w: 0 } }
    expect(reviewQueue({ ...base, answerLog, homework: ['右'] })).toEqual(['左', '石'])
  })
})

describe('しゅくだい の字で 正解しても、日が来ていない字は 段を進めない', () => {
  it('日が来ていない 正解 → そのまま', () => {
    const next = applyReview({ 右: card('2026-11-20', 1) }, ['右'], [], TODAY)
    expect(next['右']).toEqual(card('2026-11-20', 1))
  })

  it('日が来ている 正解 → 次の段へ', () => {
    expect(applyReview({ 右: card('2026-11-15', 1) }, ['右'], [], TODAY)['右'].step).toBe(2)
  })

  it('まちがえたら、日が来ていなくても あしたに もどる', () => {
    expect(applyReview({ 右: card('2026-11-20', 2) }, [], ['右'], TODAY)['右']).toEqual({ due: '2026-11-16', step: 0 })
  })
})

describe('きょうの チャレンジ', () => {
  const learned = KANJI.slice(0, 30).map((k) => k.char)
  const input = { kanji: KANJI, learned, stamps: {}, misses: {}, reviews: {}, today: TODAY, seed: 'p1:x' }

  it('しゅくだい の字(覚えた字)は かならず入る', () => {
    const picked = pickDailyChars({ ...input, homework: [learned[0], learned[1], learned[2]] })
    expect(picked).toHaveLength(10)
    expect(picked).toEqual(expect.arrayContaining([learned[0], learned[1], learned[2]]))
  })

  it('覚えていない字は 入らない。なければ これまでと 同じ', () => {
    const none = KANJI[100].char
    expect(pickDailyChars({ ...input, homework: [none] })).not.toContain(none)
    expect(pickDailyChars({ ...input, homework: [] })).toEqual(pickDailyChars(input))
  })

  it('10字を こえて えらんでも 10字', () => {
    expect(pickDailyChars({ ...input, homework: learned.slice(0, 20) })).toHaveLength(10)
  })
})

describe('しゅくだい の いまの状態', () => {
  it('字ごとの 状態と、えらんでからの 正誤', () => {
    const answerLog: AnswerLog = {
      右: {
        a: [
          encodeEntry({ day: '2026-11-01', where: 'review', kind: 'select', ok: false, hint: null }),
          encodeEntry({ day: '2026-11-12', where: 'review', kind: 'blind', ok: true, hint: 0 }),
          encodeEntry({ day: '2026-11-13', where: 'review', kind: 'blind', ok: false, hint: 4 }),
        ],
        n: 3,
        x: 2,
        w: 1,
      },
    }
    const input = { ...EMPTY_REPORT_INPUT, learned: ['右'], answerLog }
    const rows = homeworkRows({ 右: '2026-11-10', 海: '2026-11-10' }, input)
    expect(rows[0]).toMatchObject({ char: '右', state: 'model', right: 1, wrong: 1, notLearned: false })
    expect(rows[1]).toMatchObject({ char: '海', state: 'none', notLearned: true, right: 0, wrong: 0 })
    expect(homeworkAllDone(rows)).toBe(false)
  })

  it('ぜんぶ 見ないで書けたら 分かる', () => {
    const answerLog: AnswerLog = { 右: { a: [], n: 1, x: 0, w: 2 }, 左: { a: [], n: 1, x: 0, w: 3 } }
    const rows = homeworkRows({ 右: TODAY, 左: TODAY }, { ...EMPTY_REPORT_INPUT, learned: ['右', '左'], answerLog })
    expect(homeworkAllDone(rows)).toBe(true)
    expect(homeworkDoneCount(rows)).toBe(2)
    expect(homeworkAllDone([])).toBe(false)
  })
})
