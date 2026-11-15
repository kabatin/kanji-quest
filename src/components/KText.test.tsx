import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProgress } from '../store/progress'
import { READING_MS } from './KanjiReading'
import { KText } from './KText'

beforeEach(() => {
  useProgress.getState().reset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('KText: 漢字に変わった語を おすと よみが出る', () => {
  it('覚えた漢字の語を おすと、よみが上に出て、もう一度おすと消える', async () => {
    useProgress.setState({ learned: ['木'] })
    const user = userEvent.setup()
    const { container } = render(<KText text="{木|き}の した" />)
    const word = screen.getByRole('button', { name: '木、よみは き' })
    expect(container.querySelector('.ktext__reading')).toBeNull()
    await user.click(word)
    expect(container.querySelector('.ktext__reading')).toHaveTextContent('き')
    expect(word).toHaveAttribute('aria-expanded', 'true')
    await user.click(word)
    expect(container.querySelector('.ktext__reading')).toBeNull()
  })

  it('しばらくたつと 自分で消える', async () => {
    useProgress.setState({ learned: ['木'] })
    vi.useFakeTimers()
    const { container } = render(<KText text="{木|き}" />)
    const word = screen.getByRole('button', { name: '木、よみは き' })
    act(() => word.click())
    expect(container.querySelector('.ktext__reading')).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(READING_MS + 10)
    })
    expect(container.querySelector('.ktext__reading')).toBeNull()
  })

  it('キーボード(Enter / Space / Esc)でも つかえる', async () => {
    useProgress.setState({ learned: ['木'] })
    const user = userEvent.setup()
    const { container } = render(<KText text="{木|き}" />)
    await user.tab()
    expect(screen.getByRole('button', { name: '木、よみは き' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(container.querySelector('.ktext__reading')).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(container.querySelector('.ktext__reading')).toBeNull()
    await user.keyboard(' ')
    expect(container.querySelector('.ktext__reading')).not.toBeNull()
  })

  it('まだ覚えていない語(ひらがな)は 押せない', () => {
    render(<KText text="{木|き}の した" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('きの した')).toBeInTheDocument()
  })

  it('ボタンの中では 反応せず、ボタンの動きを じゃましない', async () => {
    useProgress.setState({ learned: ['木'] })
    const user = userEvent.setup()
    let clicked = 0
    const { container } = render(
      <button type="button" onClick={() => (clicked += 1)}>
        <KText text="{木|き}を えらぶ" />
      </button>,
    )
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await user.click(screen.getByText('木'))
    expect(clicked).toBe(1)
    expect(container.querySelector('.ktext__reading')).toBeNull()
    expect(container.querySelector('.ktext__kanji')).toHaveTextContent('木')
  })
})
