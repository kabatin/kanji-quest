import { beforeEach, describe, expect, it } from 'vitest'
import { recentAnswers, TALLY } from '../lib/answerLog'
import { addDays } from '../lib/date'
import { masteryOf } from '../lib/mastery'
import { weekReport } from '../lib/parentReport'
import { storageKeyFor } from '../lib/profiles'
import { EMPTY_REPORT_INPUT, readReportInput, type ReportInput } from '../lib/reportInput'
import type { QuizSummary } from '../lib/rewards'
import { HINT_RETRY_DAYS } from '../lib/review'
import { STORAGE_KEY, useProgress } from './progress'

const DAY = '2026-11-15'
const state = () => useProgress.getState()
const last = (char: string) => recentAnswers(state().answerLog[char])[0]

const quiz = (firstTryChars: readonly string[]): QuizSummary => ({
  score: 50,
  questionCount: firstTryChars.length,
  mistakes: 0,
  firstTry: firstTryChars.length,
  maxCombo: 1,
  timeMs: 9000,
  firstTryChars,
})

beforeEach(() => {
  state().reset()
})

describe('学ぶ', () => {
  it('学びおえた・見て書いた を のこす。書いた ときの まちがい と ヒントの段も', () => {
    state().completeKanji('海', DAY)
    expect(last('海')).toMatchObject({ where: 'learn', kind: 'select', ok: true, hint: null })
    state().completeWriting('海', DAY, { misses: 0, report: { maxHint: 2, askedModel: false } })
    expect(last('海')).toMatchObject({ where: 'learn', kind: 'model', ok: true, hint: 2 })
    expect(masteryOf('海', state())).toBe('model')
  })

  it('まちがえながら書いたときは「見て書ける」に しない(はんこ は これまでどおり)', () => {
    state().completeKanji('海', DAY)
    state().completeWriting('海', DAY, { misses: 2, report: { maxHint: 3, askedModel: true } })
    expect(last('海')).toMatchObject({ kind: 'model', ok: false, hint: 3 })
    expect(masteryOf('海', state())).toBe('learned')
    expect(state().stamps['海']).toBe(3)
  })

  it('古い呼び方(くわしい結果なし)でも 書いたことは のこる', () => {
    state().completeWriting('海', DAY)
    expect(last('海')).toMatchObject({ kind: 'model', ok: true, hint: null })
  })
})

describe('チャレンジ(えらぶ問題)', () => {
  it('書く段の字は 正解しても 復習が進まない。えらぶ段の字だけ進む', () => {
    useProgress.setState({ reviews: { 海: { due: DAY, step: 0 }, 池: { due: DAY, step: 1 }, 山: { due: DAY, step: 3 } } })
    state().finishQuiz(quiz(['海', '池', '山']), { level: 1 }, DAY)
    expect(state().reviews).toEqual({ 海: { due: addDays(DAY, 3), step: 1 }, 池: { due: DAY, step: 1 }, 山: { due: DAY, step: 3 } })
    expect(last('海')).toMatchObject({ where: 'challenge', kind: 'select', ok: true })
  })

  it('答えの一覧を渡すと、まちがえた字も のこす', () => {
    state().finishQuiz(quiz(['海']), { level: 1, answers: [{ char: '海', ok: true }, { char: '池', ok: false }] }, DAY)
    expect(last('池')).toMatchObject({ where: 'challenge', kind: 'select', ok: false })
    expect(state().answerDays[DAY][TALLY.answers]).toBe(2)
  })
})

describe('ボス', () => {
  it('問題の種類を渡すと、種類ごとに のこし、復習も 種類を見て進める', () => {
    useProgress.setState({ reviews: { 海: { due: DAY, step: 3 }, 池: { due: DAY, step: 3 }, 山: { due: DAY, step: 0 } } })
    state().finishBoss(
      {
        id: 'a1-mid',
        kind: 'mid',
        perfect: 3,
        total: 3,
        practice: true,
        solved: ['海', '池', '山'],
        answers: [
          { char: '海', kind: 'select', ok: true },
          { char: '池', kind: 'blind', ok: true, hint: 0 },
          { char: '山', kind: 'model', ok: true, hint: 4 },
        ],
      },
      DAY,
    )
    expect(state().reviews).toEqual({ 海: { due: DAY, step: 3 }, 池: { due: addDays(DAY, 30), step: 4 }, 山: { due: addDays(DAY, 3), step: 1 } })
    expect(last('池')).toMatchObject({ where: 'boss', kind: 'blind', ok: true, hint: 0 })
    expect(state().answerDays[DAY][TALLY.writes]).toBe(2)
    expect(state().answerDays[DAY][TALLY.hinted]).toBe(1)
  })

  it('種類を渡さない 古い呼び方では、これまでどおり(答えは のこさない)', () => {
    useProgress.setState({ reviews: { 海: { due: DAY, step: 3 } } })
    state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 1, total: 1, practice: true, solved: ['海'] }, DAY)
    expect(state().reviews['海']).toEqual({ due: addDays(DAY, 30), step: 4 })
    expect(state().answerLog['海']).toBeUndefined()
  })
})

describe('ふくしゅう', () => {
  it('見ないで書く段で ヒントを使った正解は、段を進めず あした もう一度出す', () => {
    useProgress.setState({ learned: ['海'], reviews: { 海: { due: DAY, step: 3 } }, misses: { 海: 1 } })
    state().finishReview({ right: ['海'], wrong: [], answers: [{ char: '海', kind: 'blind', ok: true, hint: 4 }] }, DAY)
    expect(state().reviews['海']).toEqual({ due: addDays(DAY, HINT_RETRY_DAYS), step: 3 })
    expect(state().reviewDone.count).toBe(1)
    expect(last('海')).toMatchObject({ where: 'review', kind: 'blind', hint: 4 })
    // 苦手から ぬけた日
    expect(state().answerLog['海'].o).toBe(DAY)
  })

  it('種類を渡さないときは、段から 種類を出して のこす(進み方は これまでどおり)', () => {
    useProgress.setState({ reviews: { 海: { due: DAY, step: 1 }, 池: { due: DAY, step: 4 } } })
    state().finishReview({ right: ['海'], wrong: ['池'] }, DAY)
    expect(last('海')).toMatchObject({ kind: 'model', ok: true, hint: null })
    expect(last('池')).toMatchObject({ kind: 'blind', ok: false })
    expect(state().reviews).toEqual({ 海: { due: addDays(DAY, 7), step: 2 }, 池: { due: addDays(DAY, 1), step: 0 } })
  })

  it('14日あけて 見ないで書けた字は「定着」、日をあけた問題の集計にも入る', () => {
    useProgress.setState({ learned: ['海'], reviews: { 海: { due: DAY, step: 3 } } })
    state().finishReview({ right: ['海'], wrong: [], answers: [{ char: '海', kind: 'blind', ok: true, hint: 0 }] }, DAY)
    expect(masteryOf('海', state())).toBe('solid')
    expect(state().answerDays[DAY].slice(TALLY.spaced, TALLY.spacedOk + 1)).toEqual([1, 1])
  })
})

describe('にがて れんしゅう', () => {
  it('見て書く → 見ないで書く を のこす。ヒントを使って書けた字は、復習が進まない', () => {
    useProgress.setState({ learned: ['海'], reviews: { 海: { due: DAY, step: 4 } }, misses: { 海: 2 } })
    const answers = [
      { char: '海', kind: 'model', ok: true, hint: 0 },
      { char: '海', kind: 'blind', ok: true, hint: 3 },
    ] as const
    state().finishWeak({ right: ['海'], wrong: [], answers }, DAY)
    expect(state().reviews['海']).toEqual({ due: addDays(DAY, HINT_RETRY_DAYS), step: 4 })
    expect(state().misses).toEqual({ 海: 1 })
    expect(recentAnswers(state().answerLog['海']).map((a) => a.kind)).toEqual(['blind', 'model'])
    expect(state().answerLog['海'].o).toBeUndefined()
  })

  it('古い呼び方では、書けた字を 見て書く・見ないで書く の正解として のこす', () => {
    state().finishWeak({ right: ['海'], wrong: ['池'] }, DAY)
    expect(recentAnswers(state().answerLog['海']).map((a) => `${a.kind}${a.ok}`)).toEqual(['blindtrue', 'modeltrue'])
    expect(state().answerLog['池']).toBeUndefined()
  })
})

describe('保護者の レポートへ', () => {
  it('ストアの状態は そのまま レポートに渡せて、ほかの子の記録は 端末から 同じ形で読める', () => {
    state().completeKanji('海', DAY)
    state().completeWriting('海', DAY, { misses: 0, report: { maxHint: 0, askedModel: false } })
    state().addPlayMinute(DAY)
    const fromStore: ReportInput = state()
    const fromDisk = readReportInput('p1')
    expect(fromDisk.answerLog).toEqual(fromStore.answerLog)
    expect(weekReport(fromDisk, DAY).thisWeek).toMatchObject({ learned: ['海'], minutes: 1, answers: 2 })
    expect(readReportInput('p9')).toBe(EMPTY_REPORT_INPUT)
    localStorage.setItem(storageKeyFor('p9'), '{こわれた')
    expect(readReportInput('p9')).toBe(EMPTY_REPORT_INPUT)
  })
})

describe('保存', () => {
  it('答えの きろく は 保存され、なかった・こわれた保存データでも 読める', async () => {
    state().completeKanji('海', DAY)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state.answerLog['海'].a).toHaveLength(1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['海'], answerLog: 'こわれた', answerDays: [1] }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().answerLog).toEqual({})
    expect(state().answerDays).toEqual({})
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['海'] }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().answerLog).toEqual({})
    expect(masteryOf('海', state())).toBe('learned')
  })
})
