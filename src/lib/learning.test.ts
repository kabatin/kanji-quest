import { describe, expect, it } from 'vitest'
import { getKanji, KANJI } from '../data/kanji'
import { getPart, PARTS } from '../data/parts'
import { EMPTY_CHILD, readChildRecords } from '../store/childRecords'
import { addPlayMinutes, applyReview, updateMisses } from '../store/records'
import { addDays, daysBetween } from './date'
import { checkGate, gradeStats, makeGateQuestion, reviewStats, weakKanji, weekStats } from './parentStats'
import { claimableParts, currentQuest, newlyCompleted, partProgress } from './partQuest'
import { storageKeyFor } from './profiles'
import { afterReview, backfillReviews, buildReviewQuestion, creditReviews, dueChars, todaysReview, isMastered, MASTERED_INTERVAL, nextReviewLabel, REVIEW_INTERVALS, scheduleNew } from './review'

const DAY = '2026-11-12'
const fixed = (value: number) => () => value

describe('日付', () => {
  it('何日あと・何日あいだ が分かる(月をまたいでも)', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays(DAY, -12)).toBe('2026-10-31')
    expect(daysBetween('2026-11-10', DAY)).toBe(2)
    expect(daysBetween(DAY, '2026-11-10')).toBe(-2)
  })
})

describe('ふくしゅう の間隔', () => {
  it('はじめは次の日。できるたびに 3日・7日・14日・30日 とのび、ぜんぶ こえたら 60日', () => {
    let card = scheduleNew(DAY)
    expect(card).toEqual({ due: '2026-11-13', step: 0 })
    const gaps = REVIEW_INTERVALS.slice(1).map(() => {
      card = afterReview(card, true, DAY)
      return daysBetween(DAY, card.due)
    })
    expect(gaps).toEqual([3, 7, 14, 30])
    card = afterReview(card, true, DAY)
    expect(daysBetween(DAY, card.due)).toBe(MASTERED_INTERVAL)
    expect(isMastered(card)).toBe(true)
    expect(isMastered(undefined)).toBe(false)
  })

  it('まちがえると、次の日から やりなおし', () => {
    expect(afterReview({ due: DAY, step: 3 }, false, DAY)).toEqual({ due: '2026-11-13', step: 0 })
    expect(afterReview(undefined, true, DAY)).toEqual({ due: '2026-11-15', step: 1 })
  })

  it('きょう出す字は、日が来ている字だけ。古い順、同じ日なら まちがいの多い順', () => {
    const reviews = {
      木: { due: '2026-11-10', step: 1 },
      山: { due: DAY, step: 0 },
      川: { due: DAY, step: 0 },
      日: { due: '2026-11-13', step: 0 },
    }
    expect(dueChars(reviews, DAY)).toEqual(['木', '山', '川'])
    // 苦手な字(まちがえた回数が のこっている字)が 先
    expect(dueChars(reviews, DAY, { 川: 2 })).toEqual(['川', '木', '山'])
    // 1日の数: 10字まで。やった ぶん だけ へり、のこりは 次の日に回す
    expect(todaysReview(41, { day: '', count: 0 }, DAY, 10)).toEqual({ left: 10, later: 31 })
    expect(todaysReview(36, { day: DAY, count: 5 }, DAY, 10)).toEqual({ left: 5, later: 31 })
    expect(todaysReview(31, { day: DAY, count: 12 }, DAY, 10)).toEqual({ left: 0, later: 31 })
    expect(todaysReview(3, { day: addDays(DAY, -1), count: 10 }, DAY, 10)).toEqual({ left: 3, later: 0 })
    // ほかの あそび で できた字: 日が来ている字だけ、次の間隔へ すすむ
    const credited = creditReviews({ 木: { due: DAY, step: 0 }, 山: { due: addDays(DAY, 2), step: 1 } }, ['木', '山', '川', '木'], DAY)
    expect(credited).toEqual({ 木: { due: addDays(DAY, 3), step: 1 }, 山: { due: addDays(DAY, 2), step: 1 } })
  })

  it('前から覚えていた字は、1日5字ずつ ずらして入れる', () => {
    const learned = Array.from({ length: 12 }, (_, i) => String.fromCodePoint(0x4e00 + i))
    const reviews = backfillReviews(learned, DAY)
    expect(dueChars(reviews, DAY)).toHaveLength(5)
    expect(dueChars(reviews, addDays(DAY, 2))).toHaveLength(12)
  })

  it('問題は、回数が進むほど むずかしい(えらぶ → 見て書く → えらぶ → 見ないで書く)', () => {
    const kanji = getKanji('休')
    expect(buildReviewQuestion(kanji, undefined, KANJI, fixed(0.1)).type).not.toBe('write')
    expect(buildReviewQuestion(kanji, { due: DAY, step: 1 }, KANJI)).toMatchObject({ type: 'write', model: true, mode: 'whole' })
    expect(buildReviewQuestion(kanji, { due: DAY, step: 2 }, KANJI, fixed(0.9)).type).not.toBe('write')
    expect(buildReviewQuestion(kanji, { due: DAY, step: 4 }, KANJI)).toMatchObject({ type: 'write', model: false })
  })

  it('次に出る日を ことばで見せる', () => {
    expect(nextReviewLabel({ due: '2026-11-13', step: 0 }, DAY)).toBe('あした')
    expect(nextReviewLabel({ due: '2026-11-19', step: 2 }, DAY)).toBe('7にち ご')
  })
})

describe('きろく の計算', () => {
  it('まちがえた回数は ふえて、できると へり、0 で消える', () => {
    const once = updateMisses({}, ['木', '木', '山'], [])
    expect(once).toEqual({ 木: 2, 山: 1 })
    expect(updateMisses(once, [], ['木', '山', '川'])).toEqual({ 木: 1 })
  })

  it('ふくしゅう の結果を、できた字・まちがえた字 それぞれに反映する', () => {
    const next = applyReview({ 木: { due: DAY, step: 2 }, 山: { due: DAY, step: 2 } }, ['木'], ['山'], DAY)
    expect(next.木).toEqual({ due: '2026-11-26', step: 3 })
    expect(next.山).toEqual({ due: '2026-11-13', step: 0 })
  })

  it('あそんだ時間は日ごとに たして、60日より前は消す', () => {
    const log = addPlayMinutes({ '2026-09-01': 30, [DAY]: 4 }, DAY, 1)
    expect(log).toEqual({ [DAY]: 5 })
    expect(addPlayMinutes({}, DAY, 1)).toEqual({ [DAY]: 1 })
  })
})

describe('パーツ クエスト', () => {
  const learned = (chars: string) => new Set([...chars])

  it('パーツの なかまを全部 覚えると コンプリート', () => {
    const te = getPart('ナ')
    expect(partProgress(te, KANJI, learned('右'))).toMatchObject({ known: 1, found: true, complete: false })
    expect(partProgress(te, KANJI, learned('右左'))).toMatchObject({ known: 2, complete: true })
    expect(partProgress(te, KANJI, learned(''))).toMatchObject({ found: false, complete: false })
  })

  it('受け取れる ごほうびは、コンプリートして まだ受け取っていない パーツ', () => {
    expect(claimableParts(PARTS, KANJI, learned('右左'), []).map((p) => p.id)).toContain('ナ')
    expect(claimableParts(PARTS, KANJI, learned('右左'), ['ナ']).map((p) => p.id)).not.toContain('ナ')
  })

  it('クエストは、コンプリートに いちばん近い パーツ。次に学ぶ字も出す', () => {
    const quest = currentQuest(PARTS, KANJI, learned('右'))
    expect(quest).toEqual({ part: getPart('ナ'), remaining: 1, nextChar: '左' })
    expect(currentQuest(PARTS, KANJI, learned(''))).toBeNull()
    const everything = new Set(KANJI.map((k) => k.char))
    expect(currentQuest(PARTS, KANJI, everything)).toBeNull()
  })

  it('その字を覚えて、新しく コンプリートした パーツが分かる', () => {
    expect(newlyCompleted('左', PARTS, KANJI, learned('右左')).map((p) => p.id)).toContain('ナ')
    expect(newlyCompleted('左', PARTS, KANJI, learned('左'))).toEqual([])
    expect(newlyCompleted('鬱', PARTS, KANJI, learned('左'))).toEqual([])
  })
})

describe('保護者向けの集計', () => {
  it('7日ぶんの 覚えた字と あそんだ時間(古い日から)', () => {
    const week = weekStats(DAY, { 木: DAY, 山: DAY, 川: '2026-11-10', 日: '2026-10-01' }, { [DAY]: 12, '2026-11-06': 5 })
    expect(week.map((d) => d.day)).toEqual(['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', DAY])
    expect(week[6]).toMatchObject({ learned: ['木', '山'], minutes: 12, weekday: '木' })
    expect(week[4].learned).toEqual(['川'])
    expect(week[0].minutes).toBe(5)
  })

  it('苦手な字は まちがいの多い順', () => {
    expect(weakKanji({ 木: 1, 山: 3, 川: 0, 日: 3 })).toEqual([
      { char: '山', misses: 3 },
      { char: '日', misses: 3 },
      { char: '木', misses: 1 },
    ])
    expect(weakKanji({ a: 1, b: 2, c: 3 }, 2)).toHaveLength(2)
  })

  it('学年ごとの数と、ふくしゅう の数', () => {
    expect(gradeStats(KANJI, ['木', '休', '雲'])).toEqual([
      { grade: 1, learned: 2, total: 80 },
      { grade: 2, learned: 1, total: 160 },
    ])
    expect(reviewStats({ 木: { due: DAY, step: 5 }, 山: { due: '2026-12-01', step: 1 } }, DAY)).toEqual({ due: 1, mastered: 1, scheduled: 2 })
  })

  it('入り口の かけ算は、答えが合ったときだけ ひらく', () => {
    const question = makeGateQuestion(fixed(0))
    expect(question).toEqual({ a: 12, b: 3 })
    expect(checkGate(question, '36')).toBe(true)
    expect(checkGate(question, ' 36 ')).toBe(true)
    expect(checkGate(question, '35')).toBe(false)
    expect(checkGate(question, '')).toBe(false)
    const big = makeGateQuestion(fixed(0.99))
    expect(big.a).toBeLessThan(20)
    expect(big.b).toBeLessThan(10)
  })

  it('ほかの子の きろくも、端末から直接 読める。こわれていたら からっぽ', () => {
    const storage = new Map<string, string>()
    const reader = { getItem: (key: string) => storage.get(key) ?? null }
    expect(readChildRecords('p2', reader)).toEqual(EMPTY_CHILD)
    storage.set(storageKeyFor('p2'), JSON.stringify({ state: { learned: ['木'], misses: { 木: 2 }, xp: 'こわれた' }, version: 5 }))
    expect(readChildRecords('p2', reader)).toMatchObject({ learned: ['木'], misses: { 木: 2 }, xp: 0, reviews: {} })
    storage.set(storageKeyFor('p2'), '{こわれた')
    expect(readChildRecords('p2', reader)).toEqual(EMPTY_CHILD)
    storage.set(storageKeyFor('p2'), JSON.stringify({ nai: 1 }))
    expect(readChildRecords('p2', reader)).toEqual(EMPTY_CHILD)
  })
})
