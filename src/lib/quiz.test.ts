import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import { getPart } from '../data/parts'
import { fullGlyph } from '../data/strokes'
import { buildChoices, buildErabi, buildQuestion, buildQuiz, CHOICE_COUNT, questionFor, shuffle, type Rng } from './quiz'

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
