import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import { getPart } from '../data/parts'
import { buildChoices, buildQuestion, buildQuiz, CHOICE_COUNT, pickChallengeKanji, shuffle, type Rng } from './quiz'

/** 再現できる乱数 */
function seeded(seed: number): Rng {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('shuffle', () => {
  it('元の配列を変えず、同じ中身を返す', () => {
    const src = [1, 2, 3, 4, 5]
    const out = shuffle(src, seeded(1))
    expect(src).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(src)
  })
})

describe('buildChoices', () => {
  it('どの問題も、正解を1つだけ含む4択になる', () => {
    for (const kanji of KANJI) {
      for (const step of kanji.steps) {
        for (let seed = 1; seed <= 20; seed += 1) {
          const choices = buildChoices(step, KANJI, seeded(seed))
          expect(choices).toHaveLength(CHOICE_COUNT)
          expect(new Set(choices).size).toBe(CHOICE_COUNT)
          expect(choices.filter((id) => id === step.answer)).toHaveLength(1)
          for (const id of choices) expect(() => getPart(id)).not.toThrow()
        }
      }
    }
  })

  it('はずれは同じ配置の部位を優先する', () => {
    const step = getKanji('海').steps[0]
    const yokoAnswers = KANJI.flatMap((k) => k.steps).filter((s) => s.layout === 'yoko').map((s) => s.answer)
    const choices = buildChoices(step, KANJI, seeded(7))
    for (const id of choices) expect(yokoAnswers).toContain(id)
  })

  it('同じ配置の部位が足りないときは、ほかの部位で4択をうめる', () => {
    const step = getKanji('間').steps[0]
    expect(buildChoices(step, KANJI, seeded(3))).toHaveLength(CHOICE_COUNT)
  })
})

describe('buildQuestion / buildQuiz', () => {
  it('存在しない段階はエラーになる', () => {
    expect(() => buildQuestion(getKanji('木'), 0, KANJI)).toThrow('段階がありません')
  })

  it('指定した数の問題を、重複なしで作る', () => {
    const quiz = buildQuiz(KANJI, 6, seeded(5))
    expect(quiz).toHaveLength(6)
    const keys = quiz.map((q) => `${q.kanji.char}-${q.stepIndex}`)
    expect(new Set(keys).size).toBe(6)
    for (const q of quiz) expect(q.choices).toContain(q.step.answer)
  })

  it('問題の総数より多くは作らない', () => {
    const total = KANJI.flatMap((k) => k.steps).length
    expect(buildQuiz(KANJI, 9999, seeded(2))).toHaveLength(total)
  })

  it('出題は pool から、はずれの選択肢は全体から作る', () => {
    const quiz = buildQuiz([getKanji('海')], 3, seeded(4), KANJI)
    expect(quiz).toHaveLength(1)
    expect(quiz[0].kanji.char).toBe('海')
    expect(quiz[0].choices).toHaveLength(CHOICE_COUNT)
  })
})

describe('pickChallengeKanji', () => {
  const chars = (list: readonly { char: string }[]) => list.map((k) => k.char)

  it('何も学んでいないときは、1年生のくみあわせ漢字から出す', () => {
    const picked = pickChallengeKanji(KANJI, [], 6, seeded(1))
    expect(picked).toHaveLength(6)
    expect(new Set(chars(picked)).size).toBe(6)
    for (const kanji of picked) {
      expect(kanji.grade).toBe(1)
      expect(kanji.steps.length).toBeGreaterThan(0)
    }
  })

  it('半分は学んだ漢字、残りはまだ学んでいない漢字になる', () => {
    const learned = ['海', '池', '林', '森', '明', '花', '木', '日']
    for (let seed = 1; seed <= 20; seed += 1) {
      const picked = chars(pickChallengeKanji(KANJI, learned, 6, seeded(seed)))
      expect(picked.filter((c) => learned.includes(c))).toHaveLength(3)
    }
  })

  it('学んだ字がちょうど6字でも、回ごとに問題が変わる', () => {
    const learned = ['海', '池', '林', '森', '明', '花']
    const rounds = Array.from({ length: 10 }, (_, i) => chars(pickChallengeKanji(KANJI, learned, 6, seeded(i + 1))).sort().join(''))
    expect(new Set(rounds).size).toBeGreaterThan(5)
  })

  it('前の回に出た漢字は、次の回には出さない', () => {
    const learned = ['海', '池', '林', '森', '明', '花']
    const first = chars(pickChallengeKanji(KANJI, learned, 6, seeded(3)))
    const second = chars(pickChallengeKanji(KANJI, learned, 6, seeded(3), first))
    for (const char of second) expect(first).not.toContain(char)
  })

  it('2年生の漢字を学ぶまでは、2年生の新しい字は出さない', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      for (const kanji of pickChallengeKanji(KANJI, ['林'], 6, seeded(seed))) expect(kanji.grade).toBe(1)
    }
  })

  it('範囲をえらぶと、その範囲の漢字だけが出る', () => {
    const learned = ['海', '林']
    expect(chars(pickChallengeKanji(KANJI, learned, 5, seeded(1), [], 'learned')).sort()).toEqual(['林', '海'].sort())
    for (const kanji of pickChallengeKanji(KANJI, learned, 10, seeded(1), [], 'grade2')) expect(kanji.grade).toBe(2)
    for (const kanji of pickChallengeKanji(KANJI, learned, 10, seeded(1), [], 'grade1')) expect(kanji.grade).toBe(1)
    expect(pickChallengeKanji(KANJI, learned, 20, seeded(1), [], 'grade2')).toHaveLength(20)
  })

  it('ほとんど学び終えて新しい字が足りないときは、学んだ字で埋める', () => {
    const allCompounds = KANJI.filter((k) => k.steps.length > 0).map((k) => k.char)
    expect(pickChallengeKanji(KANJI, allCompounds, 6, seeded(2))).toHaveLength(6)
  })
})
