import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BUILDS, DEFAULT_HEIGHT, DEPTH_TILT, LOOKS, mixLimb, Person, personRig, turnAround, type Build, type Expression, type Facing, type PersonPose, type Point } from './sceneFigures'

const ALL_BUILDS = Object.keys(BUILDS) as Build[]
const FACINGS: readonly Facing[] = ['left', 'right', 'front', 'back']
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Person を 描いて、体の 部分 の じゅんばん を 返す */
function partsOf(props: Parameters<typeof Person>[0]) {
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

describe('うしろむき(facing="back")', () => {
  it('右手 は 画面の 右、左手 は 画面の 左(正面 と ぎゃく)。見えている がわ は ない', () => {
    const back = personRig({ x: 50, y: 96, facing: 'back' })
    expect(back.view).toBe('back')
    expect(back.near).toBeNull()
    expect(back.world.arms.right.root[0]).toBeGreaterThan(50)
    expect(back.world.arms.left.root[0]).toBeLessThan(50)
    expect(back.world.legs.right.root[0]).toBeGreaterThan(50)
  })

  it('くつ底 は 地面、あたま は くび の まうえ、ほね の 長さ は かわらない', () => {
    for (const build of ALL_BUILDS) {
      const rig = personRig({ x: 50, y: 96, facing: 'back', build, pose: { rightArm: { swing: 120, bend: 30 }, leftArm: { to: [60, 70] } } })
      const soles = (['left', 'right'] as const).map((s) => rig.world.legs[s].end[1] + rig.body.footH * rig.scale)
      expect(Math.max(...soles)).toBeCloseTo(96, 6)
      expect(Math.abs(rig.world.head[0] - rig.world.neck[0])).toBeLessThan(0.01)
      expect(dist(rig.world.arms.right.root, rig.world.arms.right.mid)).toBeCloseTo(rig.body.upperArm * rig.scale, 5)
    }
  })

  it('描く じゅんばん: 足 → どう → あたま → うで(正面 と 同じ。画面の 左 から)', () => {
    expect(partsOf({ x: 50, y: 96, facing: 'back' }).parts).toEqual(['leg-left', 'leg-right', 'torso', 'head', 'arm-left', 'arm-right'])
  })

  it('体の まえ へ のばした うで・内がわ へ まわした うで は、どう の おく(さき に 描く)', () => {
    const forward = partsOf({ x: 50, y: 96, facing: 'back', pose: { rightArm: { swing: 10, bend: -10, fore: 60, foreBend: 40 } } }).parts
    expect(forward.indexOf('arm-right')).toBeLessThan(forward.indexOf('torso'))
    expect(forward.indexOf('arm-left')).toBeGreaterThan(forward.indexOf('head'))
    const inward = partsOf({ x: 50, y: 96, facing: 'back', pose: { leftArm: { to: [52, 80] } } }).parts
    expect(inward.indexOf('arm-left')).toBeLessThan(inward.indexOf('torso'))
  })

  it('うしろで 手を くむ(うで を うしろへ)と、せなか の てまえ に 見える。ばんざい も 見える', () => {
    const behindBack = partsOf({ x: 50, y: 96, facing: 'back', pose: { leftArm: { swing: 14, bend: -70, fore: -25 }, rightArm: { swing: 14, bend: -70, fore: -25 } } }).parts
    expect(behindBack.indexOf('arm-left')).toBeGreaterThan(behindBack.indexOf('head'))
    const banzai = partsOf({ x: 50, y: 96, facing: 'back', pose: { leftArm: { swing: 155, bend: 15 }, rightArm: { swing: 155, bend: 15 } } }).parts
    expect(banzai.slice(-2)).toEqual(['arm-left', 'arm-right'])
  })

  it('どの かみがた・体格 でも うしろすがた が 描ける(顔 は 描かない)', () => {
    const looks = [...Object.values(LOOKS), { hairStyle: 'bun' as const }, { hairStyle: 'bald' as const }]
    for (const look of looks) {
      for (const build of ALL_BUILDS) {
        const { html } = partsOf({ x: 50, y: 96, facing: 'back', build, look, face: 'joy' })
        expect(html).not.toContain('NaN')
      }
    }
  })
})

describe('まえうしろ の 角度(fore・foreBend)', () => {
  it('fore を つけなければ、いままで と 同じ 場所(正面・横)', () => {
    for (const facing of FACINGS) {
      const a = personRig({ x: 40, y: 96, facing, pose: { leftArm: { swing: 30, bend: 20 } } })
      const b = personRig({ x: 40, y: 96, facing, pose: { leftArm: { swing: 30, bend: 20, fore: 0, foreBend: 0 } } })
      expect(b.world.arms.left.end[0]).toBeCloseTo(a.world.arms.left.end[0], 9)
      expect(b.world.arms.left.end[1]).toBeCloseTo(a.world.arms.left.end[1], 9)
      expect(a.world.arms.left.depth).toBe(0)
    }
  })

  it('正面・うしろむき: まえ に むけた ほね は みじかく 見え、見る人に 近い ほど 画面の 下', () => {
    const fore = 60
    for (const facing of ['front', 'back'] as const) {
      const rig = personRig({ x: 50, y: 96, facing, height: 100, pose: { rightArm: { swing: 0, bend: 0, fore } } })
      const arm = rig.world.arms.right
      const along = rig.body.upperArm * Math.cos((fore * Math.PI) / 180)
      const toward = rig.body.upperArm * Math.sin((fore * Math.PI) / 180) * DEPTH_TILT * (facing === 'front' ? 1 : -1)
      expect(arm.mid[1] - arm.root[1]).toBeCloseTo(along + toward, 6)
      expect(arm.midDepth).toBeCloseTo(rig.body.upperArm * Math.sin((fore * Math.PI) / 180), 6)
    }
  })

  it('横むき では fore を つかわない(体の まえうしろ は swing で きめる)', () => {
    const a = personRig({ x: 50, y: 96, facing: 'right', pose: { leftArm: { swing: 30, bend: 10, fore: 70, foreBend: 40 } } })
    const b = personRig({ x: 50, y: 96, facing: 'right', pose: { leftArm: { swing: 30, bend: 10 } } })
    expect(a.world.arms.left.end).toEqual(b.world.arms.left.end)
  })

  it('まぜる と fore も まざる', () => {
    const rig = personRig({ x: 50, y: 96, facing: 'front', pose: { leftArm: mixLimb({ swing: 0, bend: 0, fore: 0 }, { swing: 0, bend: 0, fore: 80 }, 0.5) } })
    expect(rig.world.arms.left.fore).toBeCloseTo(40)
  })

  it('正面: うしろへ ふった うで は どう の おく、すわって ひざ が 出た あし は どう の てまえ', () => {
    const swingBack = partsOf({ x: 50, y: 96, facing: 'front', pose: { leftArm: { swing: 4, bend: 0, fore: -80 } } }).parts
    expect(swingBack.indexOf('arm-left')).toBeLessThan(swingBack.indexOf('torso'))
    const sit = partsOf({ x: 50, y: 96, facing: 'front', look: LOOKS.girl, pose: { leftLeg: { swing: 0, bend: 0, fore: 90, foreBend: 90 }, rightLeg: { swing: 0, bend: 0, fore: 90, foreBend: 90 } } }).parts
    expect(sit.indexOf('leg-left')).toBeGreaterThan(sit.indexOf('torso'))
    expect(sit.indexOf('leg-left')).toBeLessThan(sit.indexOf('head'))
  })

  it('ひざまずく(すね が おく)と、くつ は あし の うしろ に 描く', () => {
    const { container, unmount } = render(
      <svg>
        <Person x={50} y={96} facing="front" pose={{ leftLeg: { swing: 0, bend: 0, foreBend: 90 }, rightLeg: { swing: 0, bend: 0, foreBend: 90 } }} />
      </svg>,
    )
    const leg = container.querySelector('[data-part="leg-left"]')
    expect(leg?.firstElementChild?.tagName.toLowerCase()).toBe('ellipse')
    unmount()
  })

  it('stance: 指定 した 足 の くつ底 が 地面に つく(ほかの 足が 下に あっても)', () => {
    const pose: PersonPose = { leftLeg: { swing: 0, bend: 0, fore: -30 }, rightLeg: { swing: 0, bend: 0, fore: 30 } }
    const rig = personRig({ x: 50, y: 90, facing: 'front', pose, stance: 'right' })
    expect(rig.world.legs.right.end[1] + rig.body.footH * rig.scale).toBeCloseTo(90, 6)
    // 正面 で まえ の 足(right)は 見る人に 近い ので、うしろ の 足(left)より 画面の 下
    const free = personRig({ x: 50, y: 90, facing: 'front', pose })
    expect(free.world.legs.right.end[1]).toBeGreaterThan(free.world.legs.left.end[1])
  })
})

describe('体格', () => {
  it('どの 体格 でも、頭身 は 幼児 < 子ども < 中くらい < おとな。うで を たらすと 手は こし の あたり', () => {
    const heads = (build: Build) => 100 / (BUILDS[build].headR * 2)
    expect(heads('toddler')).toBeLessThan(heads('child'))
    expect(heads('child')).toBeLessThan(heads('teen'))
    expect(heads('teen')).toBeLessThan(heads('adult'))
    expect(DEFAULT_HEIGHT.toddler).toBeLessThan(DEFAULT_HEIGHT.child)
    expect(DEFAULT_HEIGHT.child).toBeLessThan(DEFAULT_HEIGHT.teen)
    expect(DEFAULT_HEIGHT.teen).toBeLessThan(DEFAULT_HEIGHT.adult)
    for (const build of ALL_BUILDS) {
      const b = BUILDS[build]
      // 背の高さ(あたま から くつ底)が だいたい 100
      expect(b.torso + b.neck + b.headR * 2 + b.thigh + b.shin + b.footH).toBeGreaterThan(95)
      expect(b.torso + b.neck + b.headR * 2 + b.thigh + b.shin + b.footH).toBeLessThan(104)
      const rig = personRig({ x: 50, y: 96, facing: 'front', build, height: 100 })
      const hand = rig.world.arms.right.end[1]
      expect(Math.abs(hand - rig.world.pelvis[1])).toBeLessThan(6)
    }
  })

  it('おとしより は 横むき で せなか が まるい(上体が まえへ)。あたま は おこして まえを 見る', () => {
    const rig = personRig({ x: 50, y: 96, facing: 'right', build: 'elder' })
    expect(rig.tilt.torso).toBeGreaterThan(5)
    expect(rig.tilt.torso + rig.tilt.head).toBeLessThan(rig.tilt.torso)
    expect(rig.world.neck[0]).toBeGreaterThan(rig.world.pelvis[0])
    // 正面 では かたむかない(くび が 少し しずむ だけ)
    const front = personRig({ x: 50, y: 96, facing: 'front', build: 'elder' })
    expect(front.tilt.torso).toBe(0)
    expect(Math.abs(front.world.neck[0] - 50)).toBeLessThan(0.01)
  })
})

describe('もつ 物(held)', () => {
  const box = <rect data-id="box" width="2" height="2" />
  const order = (facing: Facing, pose: PersonPose = {}) => partsOf({ x: 50, y: 96, facing, pose, held: box }).parts

  it('横むき: どう・あたま の あと、てまえ の うで の まえ', () => {
    expect(order('right')).toEqual(['arm-far', 'leg-far', 'leg-near', 'torso', 'head', 'held', 'arm-near'])
  })

  it('正面: あたま の あと、うで の まえ。うしろむき: いちばん さき(体の むこう)', () => {
    expect(order('front')).toEqual(['leg-right', 'leg-left', 'torso', 'head', 'held', 'arm-right', 'arm-left'])
    expect(order('back')[0]).toBe('held')
  })

  it('もつ 物 が なければ、体は 1つ の まとまり で 描く', () => {
    const { container, unmount } = render(
      <svg>
        <Person x={50} y={96} />
      </svg>,
    )
    const bodies = [...container.querySelectorAll('g[transform]')].filter((g) => /scale\([^)]*\) rotate\([^)]*\) translate\(0 /.test(g.getAttribute('transform') ?? ''))
    expect(bodies).toHaveLength(1)
    unmount()
  })
})

describe('ふりむく(via)', () => {
  it('via を わたすと、いったん その 向き を 通る', () => {
    const at = (t: number) => turnAround(t, 1, 'front', 'back', 0.3, 'right').facing
    expect(at(0.9)).toBe('front')
    expect(at(1.25)).toBe('right')
    expect(at(1.35)).toBe('right')
    expect(at(1.55)).toBe('back')
    expect(turnAround(2, 1, 'front', 'back', 0.3, 'right')).toEqual({ facing: 'back', squash: 1 })
  })
})

describe('顔 と 向き', () => {
  it('おだんご・どの 顔 でも、横・正面・うしろ が NaN なく 描ける', () => {
    const faces: readonly Expression[] = ['normal', 'smile', 'joy', 'surprised', 'sad', 'closed']
    for (const facing of FACINGS) {
      for (const face of faces) {
        expect(partsOf({ x: 50, y: 96, facing, face, look: LOOKS.grandma, build: 'elder' }).html).not.toContain('NaN')
      }
    }
  })
})
