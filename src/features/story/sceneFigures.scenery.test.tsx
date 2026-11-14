import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  Backdrop,
  Basket,
  Blackboard,
  Bucket,
  byTime,
  Campfire,
  Chair,
  Crate,
  Desk,
  Field,
  Flame,
  Moon,
  Path,
  PALETTE,
  Pond,
  posture,
  Rain,
  River,
  Rock,
  Room,
  Sky,
  Snowfall,
  Stars,
  Wind,
  Window,
  type Facing,
} from './sceneFigures'

function draw(node: ReactNode) {
  const { container, unmount } = render(<svg>{node}</svg>)
  const html = container.innerHTML
  const svg = container.querySelector('svg')
  const count = svg?.children.length ?? 0
  const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
  unmount()
  return { html, count, parts }
}

describe('時間(昼・夕方・夜)', () => {
  it('byTime: 0 で 昼、1 で 夕方、2 で 夜 の 色', () => {
    expect(byTime(0, '#000000', '#808080', '#ffffff')).toBe('#000000')
    expect(byTime(1, '#000000', '#808080', '#ffffff')).toBe('#808080')
    expect(byTime(2, '#000000', '#808080', '#ffffff')).toBe('#ffffff')
    expect(byTime(0.5, '#000000', '#808080', '#ffffff')).toBe('#404040')
  })

  it('昼(time = 0)は いままで の 背景 と 同じ', () => {
    expect(draw(<Backdrop t={1} time={0} />).html).toBe(draw(<Backdrop t={1} />).html)
  })

  it('夕方 は 空 を ぬり、夜 は 月 と 星 が 出る。くもり は 空 が はい色', () => {
    const evening = draw(<Backdrop t={1} time={1} sun={[90, 70]} />).html
    expect(evening).toContain(PALETTE.skyEvening)
    expect(evening).not.toContain(PALETTE.star)
    const night = draw(<Backdrop t={1} time={2} moonPhase="crescent" />).html
    expect(night).toContain(PALETTE.skyNight)
    expect(night).toContain(PALETTE.star)
    expect(night).toContain(PALETTE.moon)
    const rainy = draw(<Backdrop t={1} overcast={1} />).html
    expect(rainy).toContain(PALETTE.skyGray)
    expect(draw(<Backdrop t={1} time={1.5} moon={null} sun={null} clouds={[]} />).html).not.toContain('NaN')
  })

  it('空・月・星 は、出ない ときは 何も 描かない', () => {
    expect(draw(<Sky time={0} />).count).toBe(0)
    expect(draw(<Moon x={10} y={10} show={0} />).count).toBe(0)
    expect(draw(<Stars t={1} show={0} />).count).toBe(0)
    expect(draw(<Moon x={10} y={10} phase="crescent" />).html).toContain('path')
  })
})

describe('へや・家具', () => {
  it('へや: 昼 と 夜 で かべ・まど の 外 が かわる。まど なし も できる', () => {
    const day = draw(<Room time={0} curtain="#e8806f" />)
    const night = draw(<Room time={2} />)
    expect(day.html).not.toBe(night.html)
    expect(night.html).toContain(PALETTE.skyNight)
    expect(day.parts).toContain('window')
    expect(draw(<Room window={null} />).parts).not.toContain('window')
    expect(draw(<Window x={10} y={10} width={20} height={16} time={1} />).html).toContain(PALETTE.skyEvening)
  })

  it('いす: 横・正面・うしろむき で 描ける。てまえ に 来る の は うしろむき の せもたれ だけ', () => {
    for (const facing of ['left', 'right', 'front', 'back'] as const satisfies readonly Facing[]) {
      const sitter = { x: 50, y: 96, facing, pose: posture('sitChair', facing) }
      const behind = draw(<Chair {...sitter} />)
      expect(behind.html).not.toContain('NaN')
      expect(behind.parts).toContain('chair')
      const front = draw(<Chair {...sitter} layer="front" />)
      expect(front.count).toBe(facing === 'back' ? 1 : 0)
    }
  })

  it('つくえ・こくばん', () => {
    expect(draw(<Desk x={50} y={96} />).html).not.toContain('NaN')
    expect(draw(<Desk x={50} y={96} top={3} />).html).not.toBe(draw(<Desk x={50} y={96} />).html)
    const board = draw(<Blackboard x={10} y={10} lines={3} />)
    expect(board.html).toContain(PALETTE.blackboard)
    expect(board.html.match(/<path/g)?.length).toBe(3)
  })
})

describe('天気・水・火・地面・もちもの', () => {
  it('雨・雪・風 は 量 0 で 何も 描かず、ふると すじ・つぶ が ある', () => {
    for (const t of [0, 0.4, 1.3]) {
      expect(draw(<Rain t={t} />).html).toContain('path')
      expect(draw(<Rain t={t} amount={0.3} />).html.match(/<path/g)?.length ?? 0).toBeLessThan(draw(<Rain t={t} />).html.match(/<path/g)?.length ?? 0)
      expect(draw(<Snowfall t={t} />).html).toContain('circle')
      expect(draw(<Wind t={t} x={10} y={50} dir={-1} />).html).not.toContain('NaN')
    }
    expect(draw(<Rain t={1} amount={0} />).count).toBe(0)
    expect(draw(<Snowfall t={1} amount={0} />).count).toBe(0)
    expect(draw(<Wind t={1} x={10} y={50} show={0} />).count).toBe(0)
    // 地面で はねる
    expect(draw(<Rain t={0.95} ground={50} top={0} />).html).toContain('ellipse')
  })

  it('池・川', () => {
    expect(draw(<Pond t={1} x={50} y={90} />).html).toContain(PALETTE.water)
    expect(draw(<Pond t={1} x={50} y={90} fill={0} />).html).not.toContain(PALETTE.water)
    expect(draw(<Pond t={1} x={50} y={90} ripple={0} />).html).not.toContain('fill="none" stroke="#e8f6ff" stroke-width="0.7"')
    for (const flow of [1, -1]) expect(draw(<River t={2} y={60} flow={flow} />).html).not.toContain('NaN')
  })

  it('火: size 0・lit 0 で ほのお が ない', () => {
    expect(draw(<Flame t={1} x={10} y={10} size={0} />).count).toBe(0)
    expect(draw(<Flame t={1} x={10} y={10} glow={false} />).html).toContain(PALETTE.flame)
    expect(draw(<Campfire t={1} x={50} y={96} />).parts).toContain('flame')
    expect(draw(<Campfire t={1} x={50} y={96} lit={0} />).parts).not.toContain('flame')
  })

  it('岩・道・田畑', () => {
    expect(draw(<Rock x={50} y={96} grow={0} />).count).toBe(0)
    expect(draw(<Rock x={50} y={96} />).html).toContain(PALETTE.rockLight)
    expect(draw(<Path near={[50, 110, 8]} far={[52, 70, 2]} bend={3} />).html).not.toContain('NaN')
    expect(draw(<Path near={[-5, 97, 4]} far={[115, 97, 4]} />).html).not.toContain('NaN')
    const crop = draw(<Field x={10} y={70} />).html
    expect(crop).toContain(PALETTE.soil)
    expect(draw(<Field x={10} y={70} kind="paddy" />).html).toContain(PALETTE.paddyWater)
    expect(draw(<Field x={10} y={70} grow={0} />).html).not.toContain(PALETTE.leaf)
  })

  it('かご・バケツ・はこ', () => {
    expect(draw(<Basket x={50} y={80} items={['#ff0000', '#00ff00']} />).html).toContain('#ff0000')
    expect(draw(<Basket x={50} y={80} handle={false} />).html).not.toContain('fill="none"')
    expect(draw(<Bucket x={50} y={80} water />).html).toContain(PALETTE.water)
    expect(draw(<Bucket x={50} y={80} />).html).not.toContain(PALETTE.water)
    expect(draw(<Crate x={50} y={80} tape={false} />).html).not.toContain('#f2dcae')
  })
})
