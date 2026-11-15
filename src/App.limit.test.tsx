import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { PLAY_TICK_MS } from './App'
import { dayKey } from './lib/date'
import { DEFAULT_PARENT, useParent } from './store/parent'
import { useProfiles } from './store/profiles'
import { useProgress } from './store/progress'

const TODAY = dayKey()
const ID = () => useProfiles.getState().activeId

/** 1日の時間を決めて、きょう あそんだ分を 入れる */
function setPlay(limit: 0 | 15 | 30, used: number) {
  useParent.setState({ ...DEFAULT_PARENT, playLimits: { [ID()]: limit } })
  useProgress.setState({ playMinutes: { [TODAY]: used } })
}

function alreadyCheckedIn() {
  useProgress.getState().checkIn()
  useProgress.getState().claimLoginBonus()
  useProgress.setState({ coins: 0 })
}

beforeEach(() => {
  useProgress.getState().reset()
  useParent.setState(DEFAULT_PARENT)
  alreadyCheckedIn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('1日の時間の上限', () => {
  it('上限に来ていると、はじめから「きょうは ここまで」。あそぶ入り口は出ない', () => {
    setPlay(15, 15)
    render(<App />)
    expect(screen.getByRole('heading', { name: 'きょうは ここまで' })).toBeInTheDocument()
    expect(screen.getByText(/あしたも また あそべるよ/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'あそぶ' })).not.toBeInTheDocument()
  })

  it('あそびの とちゅうでは 切らない。ホームに もどった所で「ここまで」になる', async () => {
    setPlay(15, 3)
    const user = userEvent.setup()
    render(<App />)
    await user.click(within(screen.getByRole('region', { name: 'あそぶ' })).getByRole('button', { name: /きょうの\s+チャレンジ/ }))
    act(() => useProgress.setState({ playMinutes: { [TODAY]: 20 } }))
    expect(screen.getByRole('heading', { name: 'きょうの チャレンジ' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ホーム/ }))
    expect(screen.getByRole('heading', { name: 'きょうは ここまで' })).toBeInTheDocument()
  })

  it('おうちの かたが かけ算を とおって 足すと、すぐ あそべる(その子の 延長だけが ふえる)', async () => {
    setPlay(15, 15)
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'おうちの かたへ' }))
    const [a, b] = (container.querySelector('.parent-gate__question span')?.textContent ?? '').match(/\d+/g)?.map(Number) ?? [0, 0]
    await user.type(screen.getByLabelText('答え'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'ひらく' }))
    await user.click(screen.getByRole('button', { name: '15分 足す' }))
    expect(screen.queryByRole('heading', { name: 'きょうは ここまで' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'あそぶ' })).toBeInTheDocument()
    expect(useParent.getState().playExtra[ID()]).toEqual({ day: TODAY, minutes: 15 })
  })

  it('かけ算を まちがえると 足せない', async () => {
    setPlay(15, 15)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'おうちの かたへ' }))
    await user.type(screen.getByLabelText('答え'), '1')
    await user.click(screen.getByRole('button', { name: 'ひらく' }))
    expect(screen.queryByRole('button', { name: '10分 足す' })).not.toBeInTheDocument()
    expect(useParent.getState().playExtra).toEqual({})
  })

  it('残り5分は、ホームで 1回だけ しらせる', async () => {
    setPlay(15, 10)
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('あと 5ふん')
    await user.click(screen.getByRole('button', { name: 'わかった' }))
    await user.click(screen.getByRole('button', { name: 'せってい' }))
    await user.click(screen.getByRole('button', { name: /ホーム/ }))
    expect(screen.getByRole('region', { name: 'あそぶ' })).toBeInTheDocument()
    expect(screen.queryByText(/あと 5ふん/)).not.toBeInTheDocument()
  })

  it('上限が なし の子には 何も出ない', () => {
    setPlay(0, 9999)
    render(<App />)
    expect(screen.getByRole('region', { name: 'あそぶ' })).toBeInTheDocument()
    expect(screen.queryByText(/ここまで|あと 5ふん/)).not.toBeInTheDocument()
  })
})

describe('あそんだ時間の数え方', () => {
  it('ホームでは 1分ごとに ふえ、せってい の間は ふえない', () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    render(<App />)
    act(() => void vi.advanceTimersByTime(PLAY_TICK_MS))
    expect(useProgress.getState().playMinutes[TODAY]).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'せってい' }))
    act(() => void vi.advanceTimersByTime(PLAY_TICK_MS * 3))
    expect(useProgress.getState().playMinutes[TODAY]).toBe(1)
  })
})
