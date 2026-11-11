import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import { getPart } from '../data/parts'
import { fullGlyph } from '../data/strokes'
import { buildChoices, buildErabi, buildQuestion, buildQuiz, CHOICE_COUNT, pickChallengeKanji, questionFor, shuffle, type Rng } from './quiz'

/** 再現できる乱数 */
function seeded(seed: number): Rng {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const chars = (list: readonly { char: string }[]) => list.map((k) => k.char)

describe('shuffle', () => {
  it('元の配列を変えず、同じ中身を返す', () => {
    const src = [1, 2, 3, 4, 5]
    const out = shuffle(src, seeded(1))
    expect(src).toEqual([1, 2, 3, 4, 5])
    expect([...out].sort()).toEqual(src)
  })
})

describe('くみあわせの問題', () => {
  it('どの問題も、正解を1つだけ含む4択になる', () => {
    for (const kanji of KANJI) {
      for (const step of kanji.steps) {
        for (let seed = 1; seed <= 5; seed += 1) {
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
    for (const id of buildChoices(step, KANJI, seeded(7))) expect(yokoAnswers).toContain(id)
  })

  it('存在しない段階はエラーになる', () => {
    expect(() => buildQuestion(getKanji('木'), 0, KANJI)).toThrow('段階がありません')
    expect(buildQuestion(getKanji('海'), 0, KANJI, seeded(1)).type).toBe('kumi')
  })
})

describe('えらびの問題', () => {
  it('正解を1つ含む4字で、はずれは画数の近い字になる', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const question = buildErabi(getKanji('山'), KANJI, seeded(seed))
      expect(question.choices).toHaveLength(CHOICE_COUNT)
      expect(new Set(question.choices).size).toBe(CHOICE_COUNT)
      expect(question.choices).toContain('山')
      for (const char of question.choices) {
        expect(Math.abs(fullGlyph(char).strokes.length - fullGlyph('山').strokes.length)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('分けられない字は必ず「えらび」、分けられる字は両方の形で出る', () => {
    for (let seed = 1; seed <= 10; seed += 1) expect(questionFor(getKanji('山'), KANJI, seeded(seed)).type).toBe('erabi')
    const types = new Set(Array.from({ length: 40 }, (_, i) => questionFor(getKanji('海'), KANJI, seeded(i + 1)).type))
    expect(types).toEqual(new Set(['kumi', 'erabi']))
  })

  it('クイズは1字1問で、えらんだ順に作る', () => {
    const picked = [getKanji('山'), getKanji('海'), getKanji('線')]
    const quiz = buildQuiz(picked, seeded(3), KANJI)
    expect(quiz.map((q) => q.kanji.char)).toEqual(['山', '海', '線'])
  })
})

describe('pickChallengeKanji', () => {
  it('何も学んでいないときは、1年生の漢字から出す', () => {
    const picked = pickChallengeKanji(KANJI, [], 5, seeded(1))
    expect(picked).toHaveLength(5)
    expect(new Set(chars(picked)).size).toBe(5)
    for (const kanji of picked) expect(kanji.grade).toBe(1)
  })

  it('半分は学んだ漢字、残りはまだ学んでいない漢字になる', () => {
    const learned = ['海', '池', '林', '森', '明', '花', '木', '日']
    for (let seed = 1; seed <= 20; seed += 1) {
      const picked = chars(pickChallengeKanji(KANJI, learned, 6, seeded(seed)))
      expect(picked.filter((c) => learned.includes(c))).toHaveLength(3)
    }
  })

  it('学んだ字が少なくても、回ごとに問題が変わる', () => {
    const learned = ['海', '池', '林', '森', '明']
    const rounds = Array.from({ length: 10 }, (_, i) => chars(pickChallengeKanji(KANJI, learned, 5, seeded(i + 1))).sort().join(''))
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

  it('全部学び終えて新しい字がないときは、学んだ字で埋める', () => {
    expect(pickChallengeKanji(KANJI, chars(KANJI), 6, seeded(2))).toHaveLength(6)
  })
})
