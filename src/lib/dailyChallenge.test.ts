import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import {
  beginChallengeDay,
  challengeLevel,
  completeChallengeDay,
  dailyCount,
  DAILY_QUESTION_COUNT,
  INITIAL_CHALLENGE_DAY,
  isChallengeDone,
  nextLevelAfter,
  pickDailyChars,
  seededRng,
  type ChallengeDay,
  type PickInput,
} from './dailyChallenge'
import { STAMPS, type QuizSummary } from './rewards'

const TODAY = '2026-11-15'
const LEARNED = KANJI.slice(0, 30).map((k) => k.char)

const base = (patch: Partial<PickInput> = {}): PickInput => ({
  kanji: KANJI,
  learned: LEARNED,
  stamps: {},
  misses: {},
  reviews: {},
  today: TODAY,
  seed: 'p1:2026-11-15',
  ...patch,
})

const summary = (patch: Partial<QuizSummary> = {}): QuizSummary => ({
  score: 0,
  questionCount: 10,
  mistakes: 0,
  firstTry: 10,
  maxCombo: 0,
  timeMs: 0,
  firstTryChars: [],
  ...patch,
})

describe('seededRng', () => {
  it('同じ種なら同じ数の並び、ちがう種ならちがう並び', () => {
    const a = seededRng('x')
    const b = seededRng('x')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(seededRng('x')()).not.toBe(seededRng('y')())
  })
})

describe('dailyCount', () => {
  it('覚えた字が少ないうちは、その数に合わせる。1字から遊べる', () => {
    expect(dailyCount(0)).toBe(0)
    expect(dailyCount(1)).toBe(1)
    expect(dailyCount(4)).toBe(4)
    expect(dailyCount(100)).toBe(DAILY_QUESTION_COUNT)
  })
})

describe('pickDailyChars', () => {
  it('同じ日・同じ人なら、何度やっても同じ字が同じ順で出る', () => {
    expect(pickDailyChars(base())).toEqual(pickDailyChars(base()))
  })

  it('日がかわると、出る字がかわる', () => {
    const a = pickDailyChars(base()).join('')
    const b = pickDailyChars(base({ seed: 'p1:2026-11-16' })).join('')
    expect(a).not.toBe(b)
  })

  it('10字、覚えた字だけから、重ならずに出る', () => {
    const picked = pickDailyChars(base())
    expect(picked).toHaveLength(DAILY_QUESTION_COUNT)
    expect(new Set(picked).size).toBe(DAILY_QUESTION_COUNT)
    for (const char of picked) expect(LEARNED).toContain(char)
  })

  it('覚えた字が10字より少ないときは、ぜんぶ出る', () => {
    const few = LEARNED.slice(0, 3)
    expect([...pickDailyChars(base({ learned: few }))].sort()).toEqual([...few].sort())
  })

  it('何も覚えていなければ、空', () => {
    expect(pickDailyChars(base({ learned: [] }))).toEqual([])
  })

  it('まちがいの多い字・復習の日が来た字は、えらばれやすい', () => {
    const stamped = Object.fromEntries(LEARNED.map((c) => [c, STAMPS.learn | STAMPS.quiz]))
    const weak = LEARNED[12]
    const due = LEARNED[14]
    for (let day = 1; day <= 10; day += 1) {
      const picked = pickDailyChars(
        base({
          stamps: stamped,
          misses: { [weak]: 3 },
          reviews: { [due]: { due: TODAY, step: 1 } },
          seed: `p1:d${day}`,
          learned: LEARNED.slice(0, 20),
        }),
      )
      expect(picked).toContain(weak)
      expect(picked).toContain(due)
    }
  })

  it('まだ「とく」の はんこ がない字を先に出す', () => {
    const stamped = Object.fromEntries(LEARNED.slice(0, 20).map((c) => [c, STAMPS.quiz]))
    const lacking = LEARNED.slice(20, 30)
    const picked = pickDailyChars(base({ stamps: stamped }))
    expect([...picked].sort()).toEqual([...lacking].sort())
  })

  it('ならべる順は、出る字だけでなく、日ごとにかわる', () => {
    const a = pickDailyChars(base({ learned: LEARNED.slice(0, 10) }))
    const b = pickDailyChars(base({ learned: LEARNED.slice(0, 10), seed: 'p2:2026-11-15' }))
    expect([...a].sort()).toEqual([...b].sort())
    expect(a).not.toEqual(b)
  })

  it('知らない字は出さない', () => {
    expect(pickDailyChars(base({ learned: ['？', ...LEARNED.slice(0, 2)] }))).not.toContain('？')
  })
})

describe('むずかしさ', () => {
  const cd = (patch: Partial<ChallengeDay>): ChallengeDay => ({ ...INITIAL_CHALLENGE_DAY, ...patch })

  it('はじめは★1', () => {
    expect(challengeLevel(INITIAL_CHALLENGE_DAY, TODAY)).toBe(1)
  })

  it('その日のうちは かわらず、次の日に「つぎ」のむずかしさになる', () => {
    const state = cd({ day: TODAY, level: 1, next: 2, done: true })
    expect(challengeLevel(state, TODAY)).toBe(1)
    expect(challengeLevel(state, '2026-11-16')).toBe(2)
    expect(isChallengeDone(state, TODAY)).toBe(true)
    expect(isChallengeDone(state, '2026-11-16')).toBe(false)
  })

  it('全問1回で正解なら1つ上(★3まで)、まちがいが多ければ1つ下(★1まで)、ほかは そのまま', () => {
    expect(nextLevelAfter(1, summary())).toBe(2)
    expect(nextLevelAfter(3, summary())).toBe(3)
    expect(nextLevelAfter(2, summary({ firstTry: 9 }))).toBe(2)
    expect(nextLevelAfter(2, summary({ firstTry: 4 }))).toBe(1)
    expect(nextLevelAfter(1, summary({ firstTry: 4 }))).toBe(1)
    expect(nextLevelAfter(2, summary({ firstTry: 5 }))).toBe(2)
  })

  it('問題が0のときは そのまま', () => {
    expect(nextLevelAfter(2, summary({ questionCount: 0, firstTry: 0 }))).toBe(2)
  })
})

describe('出題', () => {
  it('同じ字・同じ種なら同じ問題になる', async () => {
    const { dailyQuiz } = await import('./dailyChallenge')
    const picked = ['海', '山', '森'].map(getKanji)
    const a = dailyQuiz(picked, KANJI, 'seed')
    const b = dailyQuiz(picked, KANJI, 'seed')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
    expect(a).toHaveLength(3)
  })
})

describe('きろくの更新', () => {
  it('はじめて やりおえた日だけ、次の日の むずかしさが決まる', () => {
    const started = beginChallengeDay(INITIAL_CHALLENGE_DAY, ['海'], TODAY)
    expect(started).toEqual({ day: TODAY, level: 1, next: 1, done: false, chars: ['海'] })
    const done = completeChallengeDay(started, 1, summary(), TODAY)
    expect(done).toEqual({ day: TODAY, level: 1, next: 2, done: true, chars: ['海'] })
    // もう一度あそんで まちがえても、次の日は かわらない
    expect(completeChallengeDay(done, 1, summary({ firstTry: 0 }), TODAY).next).toBe(2)
  })

  it('字が決まったあとは、ひらきなおしても同じ。次の日は「つぎ」から はじまる', () => {
    const done = completeChallengeDay(beginChallengeDay(INITIAL_CHALLENGE_DAY, ['海'], TODAY), 1, summary(), TODAY)
    expect(beginChallengeDay(done, ['山'], TODAY)).toBe(done)
    const tomorrow = beginChallengeDay(done, ['山'], '2026-11-16')
    expect(tomorrow).toEqual({ day: '2026-11-16', level: 2, next: 2, done: false, chars: ['山'] })
  })

  it('字を決める前に やりおえても、こわれない', () => {
    expect(completeChallengeDay(INITIAL_CHALLENGE_DAY, 1, summary({ firstTry: 3 }), TODAY)).toEqual({
      day: TODAY,
      level: 1,
      next: 1,
      done: true,
      chars: [],
    })
  })
})
