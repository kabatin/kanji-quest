import { describe, expect, it } from 'vitest'
import { addDays } from './date'
import { bestAnswers, creditReviews, HINT_RETRY_DAYS, judgeReview, kindForStep, REVIEW_INTERVALS, reviewAnswersOf } from './review'

const DAY = '2026-11-15'
const card = (step: number, due = DAY) => ({ due, step })

describe('ふくしゅう の段と 答え方', () => {
  it('段ごとの 答え方は、問題の作り方と同じ(1 = 見て書く、3から = 見ないで書く、ほかは えらぶ)', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(kindForStep)).toEqual(['select', 'model', 'select', 'blind', 'blind', 'blind', 'blind'])
  })

  it('種類を渡さない 古い呼び方は、これまでどおり 正解で1段 進む', () => {
    expect(judgeReview(card(3), { ok: true }, DAY)).toEqual({ due: addDays(DAY, REVIEW_INTERVALS[4]), step: 4 })
  })

  it('まちがえたら、種類に かかわらず 次の日から やりなおし(今までどおり)', () => {
    expect(judgeReview(card(4), { ok: false, kind: 'select' }, DAY)).toEqual({ due: addDays(DAY, 1), step: 0 })
  })

  it('書く段で、えらぶ問題に 正解しても 進まない。期日も ずらさない', () => {
    const before = card(1, addDays(DAY, -2))
    expect(judgeReview(before, { ok: true, kind: 'select' }, DAY)).toBe(before)
    expect(judgeReview(card(3), { ok: true, kind: 'select' }, DAY)).toEqual(card(3))
    // 見ないで書く段に、見て書く では 足りない
    expect(judgeReview(card(3), { ok: true, kind: 'model' }, DAY)).toEqual(card(3))
  })

  it('えらぶ段は、書いて正解しても 進む。見て書く段は、見ないで書けても 進む', () => {
    expect(judgeReview(card(0), { ok: true, kind: 'blind', hint: 4 }, DAY)).toEqual({ due: addDays(DAY, 3), step: 1 })
    expect(judgeReview(card(1), { ok: true, kind: 'blind' }, DAY)).toEqual({ due: addDays(DAY, 7), step: 2 })
    // 見て書く段は、ヒントを使っても 進む
    expect(judgeReview(card(1), { ok: true, kind: 'model', hint: 4 }, DAY)).toEqual({ due: addDays(DAY, 7), step: 2 })
  })

  it('見ないで書く段は、うごかして見せる より上の ヒントを使った正解では 進まず、みじかい間隔で もう一度出す', () => {
    expect(judgeReview(card(3), { ok: true, kind: 'blind', hint: 3 }, DAY)).toEqual({ due: addDays(DAY, HINT_RETRY_DAYS), step: 3 })
    expect(judgeReview(card(5), { ok: true, kind: 'blind', hint: 4 }, DAY)).toEqual({ due: addDays(DAY, HINT_RETRY_DAYS), step: 5 })
    // 書きはじめの点・やじるし までなら 進む
    expect(judgeReview(card(3), { ok: true, kind: 'blind', hint: 2 }, DAY)).toEqual({ due: addDays(DAY, 30), step: 4 })
  })
})

describe('ほかの あそび で できた字', () => {
  const reviews = { 木: card(0), 山: card(1), 川: card(3), 日: card(3, addDays(DAY, 2)) }

  it('答えを渡さないときは、これまでどおり 日が来ている字が進む', () => {
    const next = creditReviews(reviews, ['木', '山', '川', '日'], DAY)
    expect(next).toMatchObject({ 木: { step: 1 }, 山: { step: 2 }, 川: { step: 4 }, 日: { step: 3 } })
  })

  it('えらぶ問題(チャレンジ)の正解では、えらぶ段の字だけ進む', () => {
    const answers = ['木', '山', '川'].map((char) => ({ char, ok: true, kind: 'select' as const }))
    const next = creditReviews(reviews, ['木', '山', '川'], DAY, answers)
    expect(next.木).toEqual({ due: addDays(DAY, 3), step: 1 })
    expect(next.山).toBe(reviews.山)
    expect(next.川).toBe(reviews.川)
  })

  it('同じ字を 何問か といたときは、いちばん むずかしい答え方で 決める(書く > えらぶ、ヒントなし > あり)', () => {
    const answers = [
      { char: '川', ok: true, kind: 'model' as const },
      { char: '川', ok: true, kind: 'blind' as const, hint: 4 as const },
      { char: '山', ok: true, kind: 'select' as const },
      { char: '山', ok: true, kind: 'model' as const },
    ]
    expect(bestAnswers(answers).get('川')).toMatchObject({ kind: 'blind', hint: 4 })
    const next = creditReviews(reviews, ['川', '山'], DAY, answers)
    expect(next.川).toEqual({ due: addDays(DAY, HINT_RETRY_DAYS), step: 3 })
    expect(next.山).toEqual({ due: addDays(DAY, 7), step: 2 })
  })

  it('ふくしゅう の画面が 種類を渡さなくても、段から 答え方が分かる', () => {
    expect(reviewAnswersOf(reviews, ['山'], ['川'])).toEqual([
      { char: '山', ok: true, kind: 'model' },
      { char: '川', ok: false, kind: 'blind' },
    ])
  })
})
