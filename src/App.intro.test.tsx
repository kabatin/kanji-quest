import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { ALL_STAGES } from './data/areas'
import { INITIAL_INTRO } from './lib/intro'
import { useProgress } from './store/progress'

const state = () => useProgress.getState()
const FIRST = ALL_STAGES[0].kanji[0]

beforeEach(() => {
  state().reset()
  // ログインボーナスの窓が出ない状態(その日はもう受け取りずみ)
  state().checkIn()
  state().claimLoginBonus()
})

describe('はじめての あんない', () => {
  it('はじめての子には あいさつと ききての えらびが出て、えらぶと そのまま さいしょの1字を まなぶ', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'どっちの てで かく？' })).toBeInTheDocument()
    expect(screen.getByText(/あとで「せってい」で かえられる/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'ひだりて' }))
    expect(state().settings.handed).toBe('left')
    expect(screen.queryByRole('heading', { name: 'どっちの てで かく？' })).not.toBeInTheDocument()
    // 学ぶ画面の入り口で、すみまるが「おはなしを みよう」。タップで消える
    const tip = screen.getByRole('button', { name: /おはなしを みよう/ })
    await user.click(tip)
    expect(screen.queryByRole('button', { name: /おはなしを みよう/ })).not.toBeInTheDocument()
    expect(state().intro.seen).toEqual(['handed', 'story'])
    expect(FIRST).toBeTruthy()
  })

  it('とちゅうで閉じて 開きなおしても、あいさつからは やりなおしにならない', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'みぎて' }))
    first.unmount()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'どっちの てで かく？' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^ずかん/ })).toBeInTheDocument()
  })

  it('「あんないを とばす」で ホームへ行き、もう出ない', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(screen.getByRole('button', { name: 'あんないを とばす' }))
    expect(screen.getByRole('button', { name: /^ずかん/ })).toBeInTheDocument()
    expect(state().intro.done).toBe(true)
    first.unmount()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'どっちの てで かく？' })).not.toBeInTheDocument()
  })

  it('すでに遊んでいる子(覚えた字がある)には出ない', () => {
    state().completeKanji('木')
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'どっちの てで かく？' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('すみまるの あんない')).not.toBeInTheDocument()
  })

  it('学びおえてホームに もどると、もり → かんじ → つづきの ボタン の順に 1つずつ指す', async () => {
    const user = userEvent.setup()
    state().completeKanji('木')
    useProgress.setState({ intro: { done: false, seen: ['handed', 'story', 'kumi', 'kaku'] } })
    render(<App />)
    expect(screen.getByLabelText('すみまるの あんない')).toHaveTextContent('もり')

    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    expect(screen.getByLabelText('すみまるの あんない')).toHaveTextContent('ぶんの なかでも')

    await user.click(screen.getByRole('button', { name: 'つぎへ' }))
    expect(screen.getByLabelText('すみまるの あんない')).toHaveTextContent('おおきな ボタン')

    await user.click(screen.getByRole('button', { name: 'わかった！' }))
    expect(screen.queryByLabelText('すみまるの あんない')).not.toBeInTheDocument()
    expect(state().intro.done).toBe(true)
  })

  it('新しい状態の記録は、あんないが はじめから', () => {
    expect(state().intro).toEqual(INITIAL_INTRO)
  })
})
