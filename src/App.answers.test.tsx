import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { getKanji } from './data/kanji'
import { fullGlyph, getStrokes } from './data/strokes'
import { ALL_STAGES } from './data/areas'
import { dailyCount } from './lib/dailyChallenge'
import { recentAnswers } from './lib/answerLog'
import { addDays, dayKey } from './lib/date'
import { useProgress } from './store/progress'

const TODAY = dayKey()
const state = () => useProgress.getState()
const last = (char: string) => recentAnswers(state().answerLog[char])[0]

/** 書き取りの画面で、お手本の通り道どおりに全部の画を書く。 */
function writeAllStrokes(container: HTMLElement, char: string) {
  const svg = container.querySelector('.kaku__svg')
  if (!svg) throw new Error('書き取りの画面がありません')
  for (const stroke of getStrokes(fullGlyph(char))) {
    const [first, ...rest] = stroke.pts
    fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: 1 })
    for (const [x, y] of rest) fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: 1 })
    fireEvent.pointerUp(svg, { pointerId: 1 })
  }
}

beforeEach(() => {
  state().reset()
  state().checkIn()
  state().claimLoginBonus()
  useProgress.setState({ coins: 0 })
})

describe('画面から 答えのきろくへ', () => {
  it('復習: 見ないで書く問題の ヒントの段が 記録に届く(「わからない」は まちがい あつかい で、あした やりなおし)', async () => {
    useProgress.setState({ learned: ['山'], reviews: { 山: { due: TODAY, step: 3 } } })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /^きょうの ふくしゅう/ }))
    await user.click(screen.getByRole('button', { name: /^はじめる/ }))
    await user.click(screen.getByRole('button', { name: 'わからない' }))
    writeAllStrokes(container, '山')
    expect(await screen.findByRole('heading', { name: /おしまい|おぼえてた/ })).toBeInTheDocument()
    expect(last('山')).toMatchObject({ where: 'review', kind: 'blind', hint: 3 })
    expect(state().reviews['山']).toEqual({ due: addDays(TODAY, 1), step: 0 })
  })

  it('復習: ヒントなしで 見ないで書けた正解は 段が進む', async () => {
    useProgress.setState({ learned: ['山'], reviews: { 山: { due: TODAY, step: 3 } } })
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /^きょうの ふくしゅう/ }))
    await user.click(screen.getByRole('button', { name: /^はじめる/ }))
    writeAllStrokes(container, '山')
    await screen.findByRole('heading', { name: /おしまい|おぼえてた/ })
    expect(last('山')).toMatchObject({ kind: 'blind', ok: true })
    expect(state().reviews['山'].step).toBe(4)
  })

  it('学ぶ: 見て書くとき「おてほん」を使うと、ヒントの段が のこる', async () => {
    const [char] = ALL_STAGES[0].kanji
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: /つづきから まなぶ/ }))
    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    await user.click(screen.getByRole('button', { name: 'おてほん' }))
    writeAllStrokes(container, char)
    await screen.findByText('けいけんち', { exact: false }, { timeout: 4000 })
    expect(last(char)).toMatchObject({ where: 'learn', kind: 'model', hint: 3 })
  })
})

describe('チャレンジの けっか', () => {
  it('2回目からは「けいけんち ＋0」「コイン ＋0」を出さない', async () => {
    useProgress.setState({ learned: ['一', '二', '三', '四', '五', '六', '七'], challengeDay: { day: TODAY, done: true, level: 1, next: 2, chars: [] } })
    useProgress.getState().startChallenge('p1', TODAY)
    const count = dailyCount(7)
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(within(screen.getByRole('region', { name: 'あそぶ' })).getByRole('button', { name: /きょうの\s+チャレンジ/ }))
    await user.click(screen.getByRole('button', { name: /はじめる|ベストに/ }))
    for (let i = 0; i < count; i += 1) {
      await screen.findByText(`${i + 1} / ${count}`, undefined, { timeout: 4000 })
      const quiz = container.querySelector<HTMLElement>('.quiz')
      const char = quiz?.dataset.kanji ?? ''
      if (quiz?.dataset.type === 'erabi') await user.click(quiz.querySelector(`.erabi-card[data-kanji="${char}"]`) as HTMLButtonElement)
      else {
        const fixed = quiz?.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
        const choices = [...(quiz?.querySelectorAll<HTMLButtonElement>('.kumi__choices button[data-part]') ?? [])]
        const step = getKanji(char).steps.find((s) => s.fixed === fixed && choices.some((c) => c.dataset.part === s.answer))
        await user.click(choices.find((c) => c.dataset.part === step?.answer) as HTMLButtonElement)
      }
    }
    await screen.findByText('あしたも あたらしい チャレンジが あるよ', undefined, { timeout: 4000 })
    expect(screen.queryByText(/けいけんち ＋0/)).not.toBeInTheDocument()
    expect(container.querySelector('.gains__coin')).toBeNull()
    expect(last('一') ?? last('二') ?? last('三')).toMatchObject({ where: 'challenge', kind: 'select' })
  }, 30_000)
})
