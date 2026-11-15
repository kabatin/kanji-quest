import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getKanji } from '../../data/kanji'
import { fullGlyph, getStrokes } from '../../data/strokes'
import type { WriteReport } from '../../lib/strokeHint'
import type { Point } from '../../lib/strokeMatch'
import { useProgress } from '../../store/progress'
import { Kaku, LEARN_DONE_MS, WRITE_DONE_MS } from './Kaku'

const yama = getKanji('山')
const strokes = getStrokes(fullGlyph('山')).map((s) => s.pts as readonly Point[])
const scribble: Point[] = [[100, 100], [95, 100], [90, 100], [85, 100], [80, 100]]

type DrawOptions = { readonly id?: number; readonly type?: string; readonly end?: 'up' | 'cancel' | 'none' }

function draw(svg: Element, points: readonly Point[], { id = 1, type = 'touch', end = 'up' }: DrawOptions = {}) {
  const [first, ...rest] = points
  fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: id, pointerType: type })
  for (const [x, y] of rest) fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: id, pointerType: type })
  if (end === 'up') fireEvent.pointerUp(svg, { pointerId: id, pointerType: type })
  if (end === 'cancel') fireEvent.pointerCancel(svg, { pointerId: id, pointerType: type })
}

function setup(props: { strict?: boolean; model?: boolean } = {}) {
  const onDone = vi.fn<(misses: number, report: WriteReport) => void>()
  const view = render(<Kaku kanji={yama} onDone={onDone} {...props} />)
  const svg = view.container.querySelector('.kaku__svg') as Element
  const board = view.container.querySelector('.kaku') as HTMLElement
  return { ...view, onDone, svg, board }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Kaku: 入力', () => {
  it('書いている とちゅうの 2本目の指・手のひら は むしする', () => {
    const { svg } = setup()
    const [first, ...rest] = strokes[0]
    fireEvent.pointerDown(svg, { clientX: first[0], clientY: first[1], pointerId: 1, pointerType: 'touch' })
    fireEvent.pointerDown(svg, { clientX: 100, clientY: 100, pointerId: 2, pointerType: 'touch' })
    for (const [x, y] of rest) {
      fireEvent.pointerMove(svg, { clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' })
      fireEvent.pointerMove(svg, { clientX: 5, clientY: y, pointerId: 2, pointerType: 'touch' })
    }
    fireEvent.pointerUp(svg, { pointerId: 2, pointerType: 'touch' })
    fireEvent.pointerUp(svg, { pointerId: 1, pointerType: 'touch' })
    expect(screen.getByText('1 / 3 かく')).toBeInTheDocument()
    expect(document.querySelector('.kaku__note')).toBeEmptyDOMElement()
  })

  it('ペンを使ったら、そのあとの touch は むしする(指だけなら 書ける)', () => {
    const { svg, unmount } = setup()
    draw(svg, strokes[0], { type: 'pen' })
    draw(svg, strokes[1], { id: 7, type: 'touch' })
    expect(screen.getByText('1 / 3 かく')).toBeInTheDocument()
    draw(svg, strokes[1], { id: 2, type: 'pen' })
    expect(screen.getByText('2 / 3 かく')).toBeInTheDocument()
    unmount()

    const finger = setup()
    draw(finger.svg, strokes[0], { id: 3 })
    draw(finger.svg, strokes[1], { id: 4 })
    expect(screen.getByText('2 / 3 かく')).toBeInTheDocument()
  })

  it('pointercancel で とりけされた線は、まちがいに数えない(合っていれば 書けた ことにする)', () => {
    const { svg, board } = setup()
    draw(svg, strokes[0].slice(0, 4), { end: 'cancel' })
    expect(screen.getByText('0 / 3 かく')).toBeInTheDocument()
    expect(board.dataset.hint).toBe('1')
    expect(document.querySelector('.kaku__drawing')).not.toBeInTheDocument()
    draw(svg, strokes[0], { end: 'cancel' })
    expect(screen.getByText('1 / 3 かく')).toBeInTheDocument()
  })
})

describe('Kaku: まちがいの わけ と だんかい ヒント', () => {
  it('ぎゃく向きに書くと、わけ と 直しかた を出し、やじるし を ゆらす', () => {
    const { svg, board } = setup()
    draw(svg, [...strokes[0]].reverse())
    expect(document.querySelector('.kaku__note')).toHaveAttribute('data-issue', 'reverse')
    expect(screen.getByText('かく むきが ぎゃくだよ')).toBeInTheDocument()
    expect(screen.getByText('やじるしの ほうへ かこう')).toBeInTheDocument()
    expect(document.querySelector('.kaku__arrow.is-focus')).toBeInTheDocument()
    expect(document.querySelector('.kaku__miss')).toBeInTheDocument()
    expect(board.dataset.hint).toBe('2')
  })

  it('おわりが みじかいと、おわりの わっか を出す', () => {
    const { svg } = setup()
    draw(svg, strokes[0].slice(0, 4))
    expect(document.querySelector('.kaku__note')).toHaveAttribute('data-issue', 'short')
    expect(document.querySelector('.kaku__end.is-focus')).toBeInTheDocument()
  })

  it('見て書く: 同じ画で まちがえるたびに 1段ずつ(やじるし → うごく お手本 → うすい お手本)', () => {
    const { svg, board } = setup()
    expect(document.querySelector('.kaku__start text')).toHaveTextContent('1')
    draw(svg, scribble)
    expect(board.dataset.hint).toBe('2')
    expect(document.querySelector('.kaku__arrow')).toBeInTheDocument()
    expect(document.querySelector('.kaku__hint')).not.toBeInTheDocument()
    draw(svg, scribble)
    expect(board.dataset.hint).toBe('3')
    expect(document.querySelector('.kaku__hint')).toBeInTheDocument()
    expect(document.querySelector('.kaku__trace')).not.toBeInTheDocument()
    draw(svg, scribble)
    expect(board.dataset.hint).toBe('4')
    expect(document.querySelector('.kaku__trace')).toBeInTheDocument()
    // 書けたら 次の画は ヒントなし に もどる
    draw(svg, strokes[0])
    expect(board.dataset.hint).toBe('1')
    expect(document.querySelector('.kaku__note')).toBeEmptyDOMElement()
  })

  it('テスト: はじめは しるし なし。1回目で 点と やじるし(番号なし)、2回目で うすい お手本まで', () => {
    const { svg, board } = setup({ strict: true, model: false })
    expect(document.querySelector('.kaku__start')).not.toBeInTheDocument()
    draw(svg, scribble)
    expect(board.dataset.hint).toBe('2')
    expect(document.querySelector('.kaku__start')).toBeInTheDocument()
    expect(document.querySelector('.kaku__start text')).not.toBeInTheDocument()
    // はなれた所に書いたので、書きはじめの点を ゆらす
    expect(document.querySelector('.kaku__note')).toHaveAttribute('data-issue', 'start')
    expect(document.querySelector('.kaku__start.is-focus')).toBeInTheDocument()
    draw(svg, scribble)
    expect(board.dataset.hint).toBe('4')
    expect(document.querySelector('.kaku__hint')).toBeInTheDocument()
    expect(document.querySelector('.kaku__trace')).toBeInTheDocument()
  })

  it('「おてほん」は すぐ うごく お手本を出す', () => {
    const { board } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'おてほん' }))
    expect(board.dataset.hint).toBe('3')
    expect(document.querySelector('.kaku__hint')).toBeInTheDocument()
  })
})

describe('Kaku: 書きおわったあと', () => {
  it('見て書く: onDone に まちがいの数 と ヒントの きろく を渡す', () => {
    vi.useFakeTimers()
    const { svg, onDone } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'おてほん' }))
    for (const pts of strokes) draw(svg, pts)
    expect(screen.getByRole('button', { name: 'くらべる' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(LEARN_DONE_MS - 100))
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(200))
    expect(onDone).toHaveBeenCalledExactlyOnceWith(0, { maxHint: 3, askedModel: true })
  })

  it('テスト: 「くらべる」は出さず、いままでどおり すぐ 次へ。「わからない」も きろく に のこる', () => {
    vi.useFakeTimers()
    const { svg, onDone } = setup({ strict: true })
    fireEvent.click(screen.getByRole('button', { name: 'わからない' }))
    expect(screen.getByRole('button', { name: 'わからない' })).toBeDisabled()
    for (const pts of strokes) draw(svg, pts)
    expect(screen.queryByRole('button', { name: 'くらべる' })).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(WRITE_DONE_MS))
    expect(onDone).toHaveBeenCalledExactlyOnceWith(1, { maxHint: 3, askedModel: true })
  })

  it('「くらべる」: 自分の線を お手本の上に 画の順に出し、まちがえた画を 赤くする。「つぎへ」まで 進まない', () => {
    vi.useFakeTimers()
    const { svg, onDone, board } = setup()
    draw(svg, strokes[0])
    draw(svg, [...strokes[1]].reverse())
    for (const pts of strokes.slice(1)) draw(svg, pts)
    fireEvent.click(screen.getByRole('button', { name: 'くらべる' }))
    expect(board).toHaveAttribute('data-compare', 'true')
    const replays = [...document.querySelectorAll('.kaku__replay')]
    expect(replays.map((p) => p.getAttribute('data-stroke'))).toEqual(['1', '2', '3'])
    expect(replays.map((p) => p.getAttribute('data-missed'))).toEqual(['false', 'true', 'false'])
    expect(document.querySelectorAll('.kaku__model--miss')).toHaveLength(1)
    expect(screen.getByText('まちがえた せん')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(LEARN_DONE_MS * 3))
    expect(onDone).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'もういちど みる' }))
    expect(document.querySelectorAll('.kaku__replay')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'つぎへ' }))
    expect(onDone).toHaveBeenCalledExactlyOnceWith(1, { maxHint: 2, askedModel: false })
  })

  it('1回で ぜんぶ書けたときは、まちがえた せん の見本を出さない', () => {
    vi.useFakeTimers()
    const { svg } = setup()
    for (const pts of strokes) draw(svg, pts)
    fireEvent.click(screen.getByRole('button', { name: 'くらべる' }))
    expect(screen.queryByText('まちがえた せん')).not.toBeInTheDocument()
    expect(screen.getByText('ぜんぶ 1かいで かけたね！')).toBeInTheDocument()
  })
})

describe('Kaku: ききて', () => {
  const regions = (root: HTMLElement) => Array.from(root.children).map((el) => el.className)

  it('設定で ききて を かえても、領域の並びの目印だけが かわり、画の座標は かわらない', () => {
    useProgress.getState().reset()
    const right = setup()
    expect(right.board).toHaveAttribute('data-handed', 'right')
    const pathsRight = Array.from(right.svg.querySelectorAll('path')).map((p) => p.getAttribute('d'))
    expect(regions(right.board)).toEqual(['kaku__board', 'kaku__side'])
    right.unmount()

    act(() => useProgress.getState().updateSettings({ handed: 'left' }))
    const left = setup()
    expect(left.board).toHaveAttribute('data-handed', 'left')
    expect(Array.from(left.svg.querySelectorAll('path')).map((p) => p.getAttribute('d'))).toEqual(pathsRight)
    expect(left.svg).toHaveAttribute('viewBox', right.svg.getAttribute('viewBox'))
    expect(left.board.innerHTML.includes('scaleX(-1)')).toBe(false)
    useProgress.getState().reset()
  })
})
