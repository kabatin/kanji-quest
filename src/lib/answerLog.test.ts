import { describe, expect, it } from 'vitest'
import { KANJI } from '../data/kanji'
import {
  ANSWER_DAYS_KEPT,
  answerDaysSchema,
  answerLogSchema,
  decodeEntry,
  EMPTY_BOOK,
  encodeEntry,
  legacyBlindDay,
  legacyLevel,
  logAnswers,
  markWeakExits,
  RECENT_PER_CHAR,
  recentAnswers,
  TALLY,
  type AnswerBook,
  type AnswerInput,
  type SeedSource,
} from './answerLog'
import { addDays } from './date'
import { STAMPS } from './rewards'
import { HINTED_LEVEL } from './review'
import { MODEL_HINT } from './strokeHint'

const DAY = '2026-11-15'
const NO_SEED: SeedSource = { stamps: {}, reviews: {}, learnedOn: {} }
const blind = (char: string, ok: boolean, hint?: 0 | 1 | 2 | 3 | 4): AnswerInput => ({ char, kind: 'blind', ok, ...(hint === undefined ? {} : { hint }) })

describe('答えの きろく の形', () => {
  it('1つの答えを みじかい文字列にして、もとに もどせる', () => {
    const entry = { day: DAY, where: 'review', kind: 'blind', ok: true, hint: 2 } as const
    const code = encodeEntry(entry)
    expect(code.length).toBeLessThanOrEqual(8)
    expect(decodeEntry(code)).toEqual(entry)
    expect(decodeEntry(encodeEntry({ ...entry, where: 'challenge', kind: 'select', ok: false, hint: null }))).toMatchObject({ where: 'challenge', hint: null, ok: false })
    expect(decodeEntry('こわれた')).toBeNull()
  })

  it('ヒントの段の さかいめ は、書く画面(strokeHint)と同じ', () => {
    expect(HINTED_LEVEL).toBe(MODEL_HINT)
  })

  it('こわれた保存データは、読めるところだけ 読む', () => {
    expect(answerLogSchema.parse('x')).toEqual({})
    expect(answerLogSchema.parse({ 木: { a: ['2510rn10'], n: 'x', w: 9 } })).toEqual({ 木: { a: ['2510rn10'], n: 0, x: 0, w: 0 } })
    expect(answerDaysSchema.parse({ [DAY]: [1, 2, 'x'] })).toEqual({})
  })
})

describe('答えを のこす', () => {
  it('字ごとに 新しい順で 決まった数まで のこし、合計の数は ずっと数える', () => {
    const answers = Array.from({ length: RECENT_PER_CHAR + 3 }, (_, i) => blind('木', i % 2 === 0, 0))
    const book = logAnswers(EMPTY_BOOK, 'boss', answers, DAY, NO_SEED)
    const log = book.answerLog['木']
    expect(log.a).toHaveLength(RECENT_PER_CHAR)
    expect(log.n).toBe(RECENT_PER_CHAR + 3)
    expect(log.x).toBe(6)
    expect(recentAnswers(log)[0]).toMatchObject({ where: 'boss', kind: 'blind', ok: true, day: DAY })
  })

  it('日ごとの集計: 復習で 7日以上あいた 見ないで書く問題の数と正解、テストで書いた数と ヒントを使った数', () => {
    const seed: SeedSource = { stamps: {}, reviews: { 木: { due: DAY, step: 3 }, 山: { due: DAY, step: 3 } }, learnedOn: {} }
    const book = logAnswers(EMPTY_BOOK, 'review', [blind('木', true, 0), blind('山', true, 4)], DAY, seed)
    const tally = book.answerDays[DAY]
    expect(tally[TALLY.answers]).toBe(2)
    expect(tally[TALLY.ok]).toBe(2)
    // 復習の予定から、前に見たのは 14日前(段3 の間隔)と分かる
    expect(tally[TALLY.spaced]).toBe(2)
    // ヒントを使った正解は「書けた」に入れない
    expect(tally[TALLY.spacedOk]).toBe(1)
    expect(tally[TALLY.writes]).toBe(2)
    expect(tally[TALLY.hinted]).toBe(1)
  })

  it('同じ日に 見て書いた すぐあとの 見ないで書く は、日をあけた ことに ならない', () => {
    const seed: SeedSource = { stamps: {}, reviews: { 木: { due: DAY, step: 3 } }, learnedOn: {} }
    const book = logAnswers(EMPTY_BOOK, 'weak', [{ char: '木', kind: 'model', ok: true, hint: 0 }, blind('木', true, 0)], DAY, seed)
    expect(book.answerDays[DAY][TALLY.spaced]).toBe(0)
    expect(book.answerLog['木'].w).toBe(2)
  })

  it('ヒントの段が わからない答えは、ヒントの集計に入れない。学ぶ の書く練習も入れない', () => {
    const book = logAnswers(EMPTY_BOOK, 'learn', [{ char: '木', kind: 'model', ok: true, hint: 4 }], DAY, NO_SEED)
    const next = logAnswers(book, 'boss', [blind('山', true)], DAY, NO_SEED)
    expect(next.answerDays[DAY][TALLY.writes]).toBe(0)
    expect(next.answerDays[DAY][TALLY.answers]).toBe(2)
  })

  it('日ごとの集計は 決まった日数だけ のこす', () => {
    const old = addDays(DAY, -ANSWER_DAYS_KEPT)
    const book: AnswerBook = { answerLog: {}, answerDays: { [old]: [1, 1, 0, 0, 0, 0], [addDays(DAY, -1)]: [2, 2, 0, 0, 0, 0] } }
    const next = logAnswers(book, 'challenge', [{ char: '木', kind: 'select', ok: true }], DAY, NO_SEED)
    expect(Object.keys(next.answerDays).sort()).toEqual([addDays(DAY, -1), DAY])
  })

  it('答えが ないときは 何も変えない', () => {
    expect(logAnswers(EMPTY_BOOK, 'boss', [], DAY, NO_SEED)).toBe(EMPTY_BOOK)
  })
})

describe('書く力の段', () => {
  const run = (answers: readonly AnswerInput[], seed = NO_SEED, book = EMPTY_BOOK, day = DAY) => logAnswers(book, 'review', answers, day, seed)

  it('見て書けたら 1、見ないで書けたら 2、日をあけて 見ないで書けたら 3。えらぶ問題では 変わらない', () => {
    const model = run([{ char: '木', kind: 'model', ok: true }])
    expect(model.answerLog['木'].w).toBe(1)
    expect(run([{ char: '木', kind: 'select', ok: true }], NO_SEED, model, addDays(DAY, 1)).answerLog['木'].w).toBe(1)
    const blindOk = run([blind('木', true, 0)], NO_SEED, model, addDays(DAY, 2))
    expect(blindOk.answerLog['木']).toMatchObject({ w: 2, b: addDays(DAY, 2) })
    const spaced = run([blind('木', true, 1)], NO_SEED, blindOk, addDays(DAY, 12))
    expect(spaced.answerLog['木']).toMatchObject({ w: 3, b: addDays(DAY, 2) })
  })

  it('見ないで書けなかった・ヒントを使った ときは「見て書ける」まで さがる', () => {
    const seed: SeedSource = { stamps: {}, reviews: { 木: { due: DAY, step: 5 } }, learnedOn: {} }
    expect(run([blind('木', false)], seed).answerLog['木'].w).toBe(1)
    expect(run([blind('木', true, 3)], seed).answerLog['木'].w).toBe(1)
  })

  it('ログがない字は、はじめの答えのときに 今までの記録(はんこ・復習の段)から 段を引きつぐ', () => {
    const seed: SeedSource = { stamps: {}, reviews: { 木: { due: DAY, step: 5 } }, learnedOn: {} }
    const book = run([{ char: '木', kind: 'select', ok: true }], seed)
    expect(book.answerLog['木'].w).toBe(3)
    expect(book.answerLog['木'].b).toBe(legacyBlindDay({ due: DAY, step: 5 }))
  })
})

describe('今までの記録からの 見つもり', () => {
  it('復習の段と はんこ から、書く力の段を 少なめに 見つもる', () => {
    expect(legacyLevel('木', {}, undefined)).toBe(0)
    expect(legacyLevel('木', { 木: STAMPS.learn }, { due: DAY, step: 1 })).toBe(0)
    expect(legacyLevel('木', { 木: STAMPS.learn | STAMPS.write }, { due: DAY, step: 0 })).toBe(1)
    expect(legacyLevel('木', {}, { due: DAY, step: 2 })).toBe(1)
    expect(legacyLevel('木', {}, { due: DAY, step: 4 })).toBe(2)
    expect(legacyLevel('木', {}, { due: DAY, step: 5 })).toBe(3)
  })

  it('見ないで書けた日は、段4に あがった日(予定日から 間隔を もどした日)', () => {
    expect(legacyBlindDay({ due: DAY, step: 3 })).toBeUndefined()
    expect(legacyBlindDay({ due: DAY, step: 4 })).toBe(addDays(DAY, -30))
    expect(legacyBlindDay({ due: DAY, step: 5 })).toBe(addDays(DAY, -90))
  })
})

describe('苦手から ぬけた日', () => {
  it('まちがいの回数が 0 になった字に、その日を しるす', () => {
    const log = markWeakExits({}, { 木: 1, 山: 2, 川: 1 }, { 山: 1 }, DAY, NO_SEED)
    expect(log['木'].o).toBe(DAY)
    expect(log['川'].o).toBe(DAY)
    expect(log['山']).toBeUndefined()
    expect(markWeakExits(log, {}, {}, DAY, NO_SEED)).toBe(log)
  })
})

describe('大きさの 見つもり', () => {
  it('1026字 すべてに 答えが いっぱい たまっても、1人 200KB に おさまる', () => {
    const chars = Array.from({ length: 1026 }, (_, i) => String.fromCodePoint(0x4e00 + i))
    const full = chars.reduce<AnswerBook>((book, char) => logAnswers(book, 'review', Array.from({ length: 30 }, () => blind(char, true, 0)), DAY, NO_SEED), EMPTY_BOOK)
    const withDays: AnswerBook = { ...full, answerDays: Object.fromEntries(Array.from({ length: ANSWER_DAYS_KEPT }, (_, i) => [addDays(DAY, -i), [99, 99, 99, 99, 99, 99]])) }
    const size = JSON.stringify(withDays).length
    expect(size).toBeLessThan(200_000)
    expect(KANJI.length).toBe(240)
  })
})
