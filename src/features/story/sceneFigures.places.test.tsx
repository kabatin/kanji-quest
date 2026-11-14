import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { Footprint, GoalPole, GoalTape, Hall, LowTable, Mountain, mountainPoint, PALETTE, Pillar, Question, Seashore, Tatami, TiledRoof, type MountainShape } from './sceneFigures'

function draw(node: ReactNode) {
  const { container, unmount } = render(<svg>{node}</svg>)
  const html = container.innerHTML
  const count = container.querySelector('svg')?.children.length ?? 0
  const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
  unmount()
  return { html, count, parts }
}

describe('「?」の しるし', () => {
  it('show 0 で 何も 描かない。t で ふわふわ うき、size で 大きさ', () => {
    expect(draw(<Question x={50} y={20} show={0} />).count).toBe(0)
    const a = draw(<Question x={50} y={20} show={1} t={0} />).html
    expect(a).toContain(PALETTE.question)
    expect(draw(<Question x={50} y={20} show={1} t={0.3} />).html).not.toBe(a)
    expect(draw(<Question x={50} y={20} show={1} size={16} />).html).toContain('scale(2)')
  })
})

describe('ゴール・足あと', () => {
  it('ポール: grow 0 で 描かない。しま と 玉', () => {
    expect(draw(<GoalPole x={20} base={100} top={60} grow={0} />).count).toBe(0)
    expect(draw(<GoalPole x={20} base={100} top={60} />).html).toContain(PALETTE.poleStripe)
  })

  it('テープ: のびる・一部 だけ・きれて たれる。show 0 で 描かない', () => {
    const straight = draw(<GoalTape a={[20, 60]} b={[80, 60]} />).html
    expect(straight).toContain(PALETTE.tape)
    expect(draw(<GoalTape a={[20, 60]} b={[80, 60]} pull={[0, 4]} />).html).not.toBe(straight)
    expect(draw(<GoalTape a={[20, 60]} b={[80, 60]} range={[0, 0.3]} />).html).not.toBe(straight)
    const cut = draw(<GoalTape a={[20, 60]} b={[80, 60]} cut={0} />).html
    expect(cut.match(/M/g)?.length).toBe(2)
    expect(draw(<GoalTape a={[20, 60]} b={[80, 60]} cut={1} />).html).not.toBe(cut)
    expect(draw(<GoalTape a={[20, 60]} b={[80, 60]} show={0} />).count).toBe(0)
  })

  it('足あと: くつ・はだし、横 と おくゆき の 向き。grow 0 で 描かない', () => {
    expect(draw(<Footprint x={50} y={90} grow={0} />).count).toBe(0)
    for (const facing of ['left', 'right', 'front', 'back'] as const) {
      expect(draw(<Footprint x={50} y={90} facing={facing} />).html.match(/<ellipse/g)?.length).toBe(2)
      expect(draw(<Footprint x={50} y={90} facing={facing} kind="bare" />).html.match(/<ellipse/g)?.length).toBe(4)
    }
    // 横むき は 横 に 長く、おくゆき は たて に 長い
    const rx = (html: string) => Number(/rx="([\d.]+)"/.exec(html)?.[1])
    const ry = (html: string) => Number(/ry="([\d.]+)"/.exec(html)?.[1])
    const side = draw(<Footprint x={50} y={90} facing="right" size={10} />).html
    const deep = draw(<Footprint x={50} y={90} facing="front" size={10} />).html
    expect(rx(side)).toBeGreaterThan(ry(side))
    expect(rx(deep)).toBeLessThan(rx(side))
  })
})

describe('山', () => {
  const peak: MountainShape = { top: [50, 20], foot: 90, half: 40 }

  it('rise 0 で 描かない。せりあがる と きは 下 に ずれる', () => {
    expect(draw(<Mountain shape={peak} rise={0} />).count).toBe(0)
    expect(draw(<Mountain shape={peak} rise={0.5} />).html).toContain('translate(0 35)')
    expect(draw(<Mountain shape={peak} />).html).toContain(PALETTE.mountainShade)
    expect(draw(<Mountain shape={peak} far />).html).toContain(PALETTE.mountainFar)
  })

  it('雪 を わたすと 雪 が のる。りょうせん を じぶん で きめられる', () => {
    expect(draw(<Mountain shape={peak} snow={34} />).html).toContain(PALETTE.snowShade)
    const ridge = draw(<Mountain shape={{ ...peak, ridge: 'C52 40 53 60 54 90' }} snow={34} lit="#112233" shade="#445566" />).html
    expect(ridge).toContain('C52 40 53 60 54 90')
    expect(ridge).toContain('#112233')
    expect(ridge).not.toContain('NaN')
  })

  it('山はだ の 点: てっぺん から ふもと まで、すそ ほど ひろがる', () => {
    expect(mountainPoint(peak, -1, 0)).toEqual([50, 20])
    expect(mountainPoint(peak, 1, 1)).toEqual([90, 90])
    expect(mountainPoint(peak, -1, 1)).toEqual([10, 90])
    // すそ が ひろがる(まんなか の 高さ では はば の 半分 より せまい)
    expect(mountainPoint(peak, 1, 0.5)[0] - 50).toBeLessThan(20)
  })
})

describe('海 と 砂はま', () => {
  it('海・砂・なみ の 色。sky で 空 を ぬる。time で 夕方・夜 に かわる', () => {
    const day = draw(<Seashore t={1} />).html
    expect(day).toContain(PALETTE.sea)
    expect(day).toContain(PALETTE.sand)
    expect(day).toContain(PALETTE.sandDark)
    expect(draw(<Seashore t={1} sky="#d5f0fb" />).html).toContain('#d5f0fb')
    for (const time of [1, 2]) {
      const html = draw(<Seashore t={1} time={time} />).html
      expect(html).not.toContain(PALETTE.sea)
      expect(html).not.toContain('NaN')
    }
    // なみ は t で うごく
    expect(draw(<Seashore t={0.3} />).html).not.toBe(draw(<Seashore t={0.9} />).html)
  })
})

describe('広間・たたみ・やね・はしら・ひくい つくえ', () => {
  it('広間 は かべ・たたみ・はしら 2本・やね。roof={false} で やね なし', () => {
    const hall = draw(<Hall x={54.5} width={80} top={40} floor={80} front={104} />)
    expect(hall.parts.filter((p) => p === 'pillar')).toHaveLength(2)
    expect(hall.parts).toContain('tatami')
    expect(hall.parts).toContain('roof')
    expect(draw(<Hall x={54.5} width={80} top={40} floor={80} front={104} roof={false} />).parts).not.toContain('roof')
  })

  it('たたみ・やね・はしら を 1つずつ 置ける(やね の 色 を かえられる)', () => {
    expect(draw(<Tatami x={10} y={80} width={60} depth={20} cols={3} />).html).toContain(PALETTE.tatami)
    expect(draw(<TiledRoof x={50} y={40} width={60} />).html).toContain(PALETTE.roofTileDark)
    const red = draw(<TiledRoof x={50} y={40} width={60} color="#c8574a" />).html
    expect(red).toContain('#c8574a')
    expect(red).not.toContain(PALETTE.roofTileDark)
    expect(draw(<Pillar x={20} top={40} bottom={100} />).html).toContain(PALETTE.pillar)
  })

  it('ひくい つくえ: 上 の 面 と 紙。top 0 なら 上 の 面 も 紙 も なし', () => {
    const table = draw(<LowTable x={50} y={100} paper />).html
    expect(table).toContain('#fffdf6')
    const flat = draw(<LowTable x={50} y={100} top={0} paper />).html
    expect(flat).not.toContain('#fffdf6')
    expect(flat).not.toContain('NaN')
  })
})
