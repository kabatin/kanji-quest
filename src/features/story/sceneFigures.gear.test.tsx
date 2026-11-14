import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BUILDS, HAT_COLORS, LOOKS, PACK_COLORS, Person, personRig, Tool, toolEnds, turnAround, type Build, type Expression, type Facing, type HatKind, type PackKind, type PersonProps } from './sceneFigures'

const FACINGS: readonly Facing[] = ['left', 'right', 'front', 'back']
const ALL_BUILDS = Object.keys(BUILDS) as Build[]

/** Person を 描いて、体の 部分 の じゅんばん と HTML を 返す */
function draw(props: PersonProps) {
  const { container, unmount } = render(
    <svg>
      <Person {...props} />
    </svg>,
  )
  const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
  const html = container.innerHTML
  unmount()
  return { parts, html }
}

describe('せおう かばん(pack)', () => {
  it('横むき: かばん は どう の あと、あたま・てまえ の うで の まえ(むこう の うで は かばん の おく)', () => {
    for (const facing of ['left', 'right'] as const) {
      expect(draw({ x: 50, y: 96, facing, pack: 'randoseru' }).parts).toEqual(['arm-far', 'leg-far', 'leg-near', 'torso', 'pack', 'head', 'arm-near'])
    }
  })

  it('正面: かたひも は どう の 上、あたま と うで の 下', () => {
    expect(draw({ x: 50, y: 96, facing: 'front', pack: 'rucksack' }).parts).toEqual(['leg-right', 'leg-left', 'torso', 'pack', 'head', 'arm-right', 'arm-left'])
  })

  it('うしろむき: たらした うで は かばん の おく、見る人 の ほう へ 大きく ふった うで は かばん の まえ', () => {
    expect(draw({ x: 50, y: 96, facing: 'back', pack: 'randoseru' }).parts).toEqual(['leg-left', 'leg-right', 'torso', 'head', 'arm-left', 'arm-right', 'pack'])
    const swung = draw({ x: 50, y: 96, facing: 'back', pack: 'randoseru', pose: { rightArm: { swing: 10, bend: 10, fore: -70 } } }).parts
    expect(swung.indexOf('arm-right')).toBeGreaterThan(swung.indexOf('pack'))
    expect(swung.indexOf('arm-left')).toBeLessThan(swung.indexOf('pack'))
    // 体 の まえ へ のばした うで は、かばん が あっても どう の おく
    const forward = draw({ x: 50, y: 96, facing: 'back', pack: 'rucksack', pose: { leftArm: { swing: 10, bend: -10, fore: 60, foreBend: 40 } } }).parts
    expect(forward.indexOf('arm-left')).toBeLessThan(forward.indexOf('torso'))
  })

  it('うしろむき で もつ 物 は いちばん さき(体 の むこう)', () => {
    expect(draw({ x: 50, y: 96, facing: 'back', pack: 'randoseru', held: <rect /> }).parts[0]).toBe('held')
  })

  it('かばん は 体 と 同じ transform の 中(ふりむき の ちぢみ・かたむき・はんてん が いっしょ に つく)', () => {
    for (const t of [0.95, 1.05, 1.15, 1.25]) {
      const turn = turnAround(t, 1, 'right', 'back', 0.3)
      const props: PersonProps = { x: 50, y: 96, ...turn, lean: 6, pack: 'randoseru' }
      const { container, unmount } = render(
        <svg>
          <Person {...props} />
        </svg>,
      )
      const pack = container.querySelector('[data-part="pack"]')
      const torso = container.querySelector('[data-part="torso"]')
      expect(pack?.closest('g[transform^="translate"]')).toBe(torso?.closest('g[transform^="translate"]'))
      expect(pack?.closest('g[transform^="translate"]')?.getAttribute('transform')).toBe(personRig(props).transform)
      unmount()
    }
  })

  it('色 を わたせる。省くと かばん ごとの 色', () => {
    expect(draw({ x: 50, y: 96, facing: 'back', pack: 'randoseru' }).html).toContain(PACK_COLORS.randoseru)
    expect(draw({ x: 50, y: 96, facing: 'back', pack: { kind: 'rucksack', color: '#123456' } }).html).toContain('#123456')
  })

  it('どの 体格・向き・かばん でも NaN なく 描け、大きさ は 体格 の どう に 合う', () => {
    for (const kind of ['randoseru', 'rucksack'] as const satisfies readonly PackKind[]) {
      for (const build of ALL_BUILDS) {
        for (const facing of FACINGS) {
          expect(draw({ x: 50, y: 96, facing, build, pack: kind }).html).not.toContain('NaN')
        }
      }
    }
    // 体 の 中 の 単位 で 描く ので、画面 の 大きさ は 背 の 高さ に 比例 する
    const box = (height: number) => {
      const { container, unmount } = render(
        <svg>
          <Person x={50} y={96} facing="back" height={height} pack="randoseru" />
        </svg>,
      )
      const t = container.querySelector('[data-part="pack"]')?.closest('g[transform^="translate"]')?.getAttribute('transform') ?? ''
      unmount()
      return t
    }
    expect(box(44)).toContain('scale(0.44 0.44)')
    expect(box(60)).toContain('scale(0.6 0.6)')
  })

  it('かばん を 省けば いままで と 同じ 絵', () => {
    expect(draw({ x: 50, y: 96, facing: 'back' }).html).toBe(draw({ x: 50, y: 96, facing: 'back', pack: undefined }).html)
  })
})

describe('手 に もつ 道具(tools)', () => {
  it('道具 は うで の 中 に 描かれ、先 は わたした 画面 の 点 に とどく', () => {
    const props: PersonProps = { x: 50, y: 96, facing: 'front', pose: { rightArm: { swing: 30, bend: 40 } }, tools: { right: { kind: 'brush', tip: [40, 80] } } }
    const rig = personRig(props)
    const { container, unmount } = render(
      <svg>
        <Person {...props} />
      </svg>,
    )
    const tool = container.querySelector('[data-part="arm-right"] [data-part="tool"]')
    expect(tool).not.toBeNull()
    expect(container.querySelector('[data-part="arm-left"] [data-part="tool"]')).toBeNull()
    unmount()
    // 体の中 ↔ 画面 の 行き来 が もどる(先 の 点 が ずれない)
    const back = rig.toWorld(rig.toLocal([40, 80]))
    expect(back[0]).toBeCloseTo(40, 6)
    expect(back[1]).toBeCloseTo(80, 6)
  })

  it('tip の かわり に 角度 と 長さ でも よい。おしり は 手 の うしろ に 出る', () => {
    const ends = toolEnds({ kind: 'stick', angle: 0, length: 20 }, [10, 10], 0.5)
    expect(ends.tip[0]).toBeGreaterThan(10)
    expect(ends.end[0]).toBeLessThan(10)
    expect(ends.tip[0] - ends.end[0]).toBeCloseTo(20, 6)
    const down = toolEnds({ kind: 'pencil' }, [0, 0], 1)
    expect(down.tip[1]).toBeGreaterThan(0)
    const toward = toolEnds({ kind: 'brush', tip: [0, 10] }, [0, 0], 1)
    expect(toward.tip).toEqual([0, 10])
    expect(toward.end[1]).toBeLessThan(0)
  })

  it('体 の おく の うで(うしろむき で まえ へ のばした うで)の 道具 は 体 に かくれる', () => {
    const { parts } = draw({ x: 50, y: 96, facing: 'back', pose: { leftArm: { swing: 10, bend: -10, fore: 60, foreBend: 40 } }, tools: { left: { kind: 'pencil' } } })
    expect(parts.indexOf('tool')).toBeLessThan(parts.indexOf('torso'))
  })

  it('どの 道具・向き でも NaN なく 描ける。手 に もたない 道具 も 描ける', () => {
    for (const kind of ['brush', 'pencil', 'stick'] as const) {
      for (const facing of FACINGS) {
        expect(draw({ x: 50, y: 96, facing, tools: { left: { kind, angle: -60 }, right: { kind, tip: [30, 60], ink: '#e5463b' } } }).html).not.toContain('NaN')
      }
      const { container } = render(
        <svg>
          <Tool kind={kind} end={[0, 0]} tip={[10, 5]} />
        </svg>,
      )
      expect(container.querySelector('[data-part="tool"]')).not.toBeNull()
    }
  })
})

describe('ぼうし・めがね(look)', () => {
  const hats: readonly HatKind[] = ['cap', 'school', 'straw', 'knit']

  it('どの ぼうし も 横・正面・うしろ で 描ける。色 を 省くと ぼうし ごとの 色', () => {
    for (const hat of hats) {
      for (const facing of FACINGS) {
        const { parts, html } = draw({ x: 50, y: 96, facing, look: { ...LOOKS.girl, hat } })
        expect(parts).toContain('hat')
        expect(html).toContain(HAT_COLORS[hat])
        expect(html).not.toContain('NaN')
      }
    }
    expect(draw({ x: 50, y: 96, look: { hat: 'cap', hatColor: '#abcdef' } }).html).toContain('#abcdef')
  })

  it('ぼうし・めがね は あたま の 中(あたま と いっしょ に かたむく)。省けば 描かない', () => {
    for (const facing of FACINGS) {
      const { container, unmount } = render(
        <svg>
          <Person x={50} y={96} facing={facing} look={{ hat: 'school', glasses: true }} />
        </svg>,
      )
      expect(container.querySelector('[data-part="head"] [data-part="hat"]')).not.toBeNull()
      expect(container.querySelector('[data-part="head"] [data-part="glasses"]')).not.toBeNull()
      unmount()
    }
    expect(draw({ x: 50, y: 96, look: LOOKS.man }).parts).not.toContain('hat')
    expect(draw({ x: 50, y: 96, look: { hat: 'none' } }).parts).not.toContain('hat')
  })
})

describe('顔 と 目線', () => {
  const more: readonly Expression[] = ['worried', 'angry', 'cry', 'sleepy', 'strain']

  it('足した 顔 は 正面・横 で 描け、うしろむき では 顔 を 描かない', () => {
    for (const face of more) {
      for (const facing of ['front', 'right', 'left'] as const) {
        expect(draw({ x: 50, y: 96, facing, face, gaze: 0.5, gazeY: 0.5 }).html).not.toContain('NaN')
      }
      expect(draw({ x: 50, y: 96, facing: 'back', face }).html).toBe(draw({ x: 50, y: 96, facing: 'back' }).html)
    }
    // なく 顔 には なみだ(水 の 色)、おこった 顔 には いかり の しるし(赤)
    expect(draw({ x: 50, y: 96, facing: 'front', face: 'cry' }).html).toContain('#7cc4f2')
    expect(draw({ x: 50, y: 96, facing: 'right', face: 'angry' }).html).toContain('#e8534a')
  })

  it('目線 の 上下: 下 を 見る と 目 が 下 に ずれて まぶた が さがる。0 なら いままで と 同じ', () => {
    for (const facing of ['front', 'right'] as const) {
      expect(draw({ x: 50, y: 96, facing, gazeY: 0 }).html).toBe(draw({ x: 50, y: 96, facing }).html)
      const down = draw({ x: 50, y: 96, facing, gazeY: 1 }).html
      const up = draw({ x: 50, y: 96, facing, gazeY: -1 }).html
      expect(down).not.toBe(up)
      expect(down).toContain('<ellipse')
    }
    // びっくり・こまった の 目 も ずれる
    expect(draw({ x: 50, y: 96, facing: 'front', face: 'surprised', gazeY: -1 }).html).not.toBe(draw({ x: 50, y: 96, facing: 'front', face: 'surprised' }).html)
    expect(draw({ x: 50, y: 96, facing: 'front', face: 'worried', gazeY: 1 }).html).not.toBe(draw({ x: 50, y: 96, facing: 'front', face: 'worried' }).html)
  })
})

describe('かみ の ゆれ(hairSway)', () => {
  it('ポニーテール・ふたつむすび の たば が むすびめ を じく に まわる。0 なら いままで と 同じ', () => {
    for (const look of [LOOKS.girl, LOOKS.little]) {
      for (const facing of FACINGS) {
        expect(draw({ x: 50, y: 96, facing, look, hairSway: 0 }).html).toBe(draw({ x: 50, y: 96, facing, look }).html)
        expect(draw({ x: 50, y: 96, facing, look, hairSway: 12 }).html).toMatch(/rotate\(-?12 /)
      }
    }
    // みじかい かみ は ゆれない
    expect(draw({ x: 50, y: 96, facing: 'right', look: LOOKS.boy, hairSway: 12 }).html).toBe(draw({ x: 50, y: 96, facing: 'right', look: LOOKS.boy }).html)
  })
})
