import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { strokeCount } from '../../data/strokes'
import { checkScene, sheetTimes } from './sceneKit'
import {
  Backdrop,
  Bird,
  Butterfly,
  ByDepth,
  Canopy,
  Dust,
  Flower,
  gaitAt,
  Hearts,
  House,
  LOOKS,
  mixColor,
  mixLimb,
  mixPose,
  Notice,
  Person,
  personRig,
  PineTree,
  shade,
  Sigh,
  Sweat,
  Tree,
  turnAround,
  walk,
  type Build,
  type Expression,
  type Facing,
  type PersonPose,
  type Placement,
  type Point,
  type Rig,
  type WalkPlan,
} from './sceneFigures'
import { SceneStage } from './SceneStage'
import { loadTrial, trialChars, trialVariants } from './sceneTrials'

const BUILDS: readonly Build[] = ['child', 'adult']
const FACINGS: readonly Facing[] = ['left', 'right', 'front']
const FACES: readonly Expression[] = ['normal', 'smile', 'joy', 'surprised', 'sad', 'closed']

/** いろいろな かっこう(角度・とどかせる点・まぜる・はんいの外) */
const POSES: readonly PersonPose[] = [
  {},
  { leftArm: { swing: 150, bend: 20 }, rightArm: { swing: -80, bend: -40 }, torso: 30, head: -15 },
  { leftLeg: { swing: 90, bend: 90 }, rightLeg: { swing: 90, bend: 90 } },
  { leftLeg: { swing: 0, bend: 90 }, rightLeg: { swing: 0, bend: 95 }, torso: -10 },
  { rightArm: { to: [10, 10] }, leftArm: { to: [200, -50] }, leftLeg: { to: [60, 80] } },
  { leftArm: mixLimb({ swing: 0, bend: 0 }, { to: [50, 40] }, 0.5), rightLeg: { swing: 400, bend: 999 } },
]

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const allNumbers = (rig: Rig): number[] => {
  const { world } = rig
  const limbs = [world.arms.left, world.arms.right, world.legs.left, world.legs.right]
  return [...world.pelvis, ...world.neck, ...world.head, ...limbs.flatMap((j) => [...j.root, ...j.mid, ...j.end, j.swing, j.bend])]
}
/** 横むき で「まえ」の むき(画面の +x なら 1) */
const forwardSign = (facing: Facing) => (facing === 'left' ? -1 : 1)
/** 2本の ほね の まがる むき(画面の 上で、まえ に まがれば +) */
const turnOf = (j: { readonly root: Point; readonly mid: Point; readonly end: Point }, sign: number) => {
  const a = [j.mid[0] - j.root[0], j.mid[1] - j.root[1]]
  const b = [j.end[0] - j.mid[0], j.end[1] - j.mid[1]]
  // y が 下むき の 座標で、ま下(0,1)から まえ(sign,0)へ まわる むき を + にする
  return -(a[0] * b[1] - a[1] * b[0]) * sign
}

describe('人の 体の つくり(personRig)', () => {
  it('どの 体格・向き・ポーズ でも、関節は ぜんぶ 数になり(NaN なし)、ほね の 長さは かわらない', () => {
    for (const build of BUILDS) {
      for (const facing of FACINGS) {
        for (const pose of POSES) {
          for (const extra of [{}, { lean: 12, lift: 3, squash: 0.4 }, { lean: -30, squash: 0 }]) {
            const rig = personRig({ x: 40, y: 96, build, facing, pose, height: 50, ...extra })
            expect(allNumbers(rig).every(Number.isFinite)).toBe(true)
            if ('squash' in extra) continue
            const s = rig.scale
            for (const side of ['left', 'right'] as const) {
              expect(dist(rig.world.arms[side].root, rig.world.arms[side].mid)).toBeCloseTo(rig.body.upperArm * s, 5)
              expect(dist(rig.world.arms[side].mid, rig.world.arms[side].end)).toBeCloseTo(rig.body.foreArm * s, 5)
              expect(dist(rig.world.legs[side].root, rig.world.legs[side].mid)).toBeCloseTo(rig.body.thigh * s, 5)
              expect(dist(rig.world.legs[side].mid, rig.world.legs[side].end)).toBeCloseTo(rig.body.shin * s, 5)
            }
          }
        }
      }
    }
  })

  it('くび は みじかく、あたま は どう の まんなか の上。うで は かた(どう の 上の はし の すぐ下)から出る', () => {
    for (const build of BUILDS) {
      for (const facing of FACINGS) {
        const rig = personRig({ x: 50, y: 96, build, facing, height: 60 })
        const { world, body, scale } = rig
        // あたまの まんなか は くび の まうえ(よこの ずれ は あたまの 半径の 1わり まで)
        expect(Math.abs(world.head[0] - world.neck[0])).toBeLessThan(body.headR * scale * 0.1)
        expect(Math.abs(world.neck[0] - world.pelvis[0])).toBeLessThan(0.01)
        // くび の 長さ: あたまの 下の はし から どう の 上 まで が、背の高さ の 4% 以下
        expect(world.neck[1] - (world.head[1] + body.headR * scale)).toBeLessThan(0.04 * 60)
        for (const side of ['left', 'right'] as const) {
          const shoulder = world.arms[side].root
          expect(shoulder[1]).toBeGreaterThan(world.neck[1])
          expect(shoulder[1] - world.neck[1]).toBeLessThan(body.shoulderDrop * scale + 0.01)
          expect(shoulder[1]).toBeLessThan(world.pelvis[1])
        }
      }
    }
  })

  it('横むき では、ひじ は まえ にしか まがらず、ひざ は うしろ にしか まがらない(角度でも 点でも)', () => {
    const tries: readonly PersonPose[] = [
      { leftArm: { swing: 40, bend: -90 }, rightArm: { swing: 120, bend: 60 }, leftLeg: { swing: 30, bend: -60 }, rightLeg: { swing: 60, bend: 100 } },
      { leftArm: { to: [70, 50] }, rightArm: { to: [30, 90] }, rightLeg: { to: [55, 92] } },
      { leftArm: { to: [20, 40] }, rightArm: { to: [52, 30] } },
    ]
    for (const facing of ['left', 'right'] as const) {
      for (const pose of tries) {
        const rig = personRig({ x: 50, y: 96, facing, pose, height: 60 })
        const sign = forwardSign(facing)
        for (const side of ['left', 'right'] as const) {
          expect(rig.world.arms[side].bend).toBeGreaterThanOrEqual(0)
          expect(turnOf(rig.world.arms[side], sign)).toBeGreaterThanOrEqual(-1e-6)
          expect(rig.world.legs[side].bend).toBeGreaterThanOrEqual(0)
          expect(turnOf(rig.world.legs[side], sign)).toBeLessThanOrEqual(1e-6)
        }
      }
    }
  })

  it('手先を 点に とどかせる。とどかない 点には、うで を まっすぐ のばして その むき を さす', () => {
    for (const facing of FACINGS) {
      const base: Placement = { x: 50, y: 96, facing, height: 60, lean: 5 }
      const shoulder = personRig(base).world.arms.right.root
      // 横むき なら からだの まえ、正面 なら 体の まえを よこぎる 点
      const near: Point = [shoulder[0] + (facing === 'left' ? -8 : 8), shoulder[1] + 6]
      const reached = personRig({ ...base, pose: { rightArm: { to: near } } })
      expect(dist(reached.world.arms.right.end, near)).toBeLessThan(0.01)
      // まえ の 上(正面 では 外の 上)の とおい点
      const far: Point = [shoulder[0] + (facing === 'right' ? 80 : -80), shoulder[1] - 60]
      const straight = personRig({ ...base, pose: { rightArm: { to: far } } })
      const arm = straight.world.arms.right
      const length = (straight.body.upperArm + straight.body.foreArm) * straight.scale
      expect(dist(arm.root, arm.end)).toBeGreaterThan(length * 0.99)
      // 手 は、かた から 点への 線の 上
      const toward = Math.atan2(far[1] - arm.root[1], far[0] - arm.root[0])
      const pointing = Math.atan2(arm.end[1] - arm.root[1], arm.end[0] - arm.root[0])
      expect(Math.abs(Math.atan2(Math.sin(toward - pointing), Math.cos(toward - pointing)))).toBeLessThan(0.02)
    }
  })

  it('うで が まわりきらない 点(体の うしろ の 下)でも、ひじ は まえ にしか まがらず、手は その点に できるだけ 近づく', () => {
    const base: Placement = { x: 50, y: 96, facing: 'right', height: 60 }
    const shoulder = personRig(base).world.arms.left.root
    const behind: Point = [shoulder[0] - 8, shoulder[1] + 6]
    const rig = personRig({ ...base, pose: { leftArm: { to: behind } } })
    const arm = rig.world.arms.left
    expect(arm.bend).toBeGreaterThanOrEqual(0)
    expect(arm.swing).toBeGreaterThanOrEqual(-60)
    // たらした ままより 近い
    const hanging = personRig(base).world.arms.left.end
    expect(dist(arm.end, behind)).toBeLessThan(dist(hanging, behind))
  })

  it('いちばん下の 足(すわれば ひざ・おしり)が 地面に つく。ジャンプ すると その分 うく', () => {
    const solesOf = (rig: Rig) => (['left', 'right'] as const).map((side) => rig.world.legs[side].end[1] + rig.body.footH * rig.scale)
    for (const facing of FACINGS) {
      const stand = personRig({ x: 50, y: 96, facing, height: 50 })
      expect(Math.max(...solesOf(stand))).toBeCloseTo(96, 6)
      const jump = personRig({ x: 50, y: 96, facing, height: 50, lift: 4 })
      expect(Math.max(...solesOf(jump))).toBeCloseTo(92, 6)
      // いすに すわる: もも は まえ、すね は ま下。足の うら が 地面に つき、こし は すね の 長さ ぶん 上
      const sit = personRig({ x: 50, y: 96, facing, height: 50, pose: { leftLeg: { swing: 90, bend: 90 }, rightLeg: { swing: 90, bend: 90 } } })
      if (facing !== 'front') {
        expect(Math.max(...solesOf(sit))).toBeCloseTo(96, 6)
        expect(96 - sit.world.pelvis[1]).toBeCloseTo((sit.body.shin + sit.body.footH) * sit.scale, 6)
      }
    }
    // ひざまずく: ひざ が 地面に つく(足は 地面の 下に もぐらない)
    const kneel = personRig({ x: 50, y: 96, facing: 'right', height: 50, pose: { leftLeg: { swing: 0, bend: 90 }, rightLeg: { swing: 0, bend: 90 } } })
    expect(Math.max(...solesOf(kneel))).toBeLessThanOrEqual(96 + 1e-6)
    expect(kneel.world.legs.left.mid[1] + (kneel.body.legW / 2) * kneel.scale).toBeCloseTo(96, 6)
  })

  it('横むき で 見えている がわ: 右むき は 左の 手足、左むき は 右の 手足', () => {
    expect(personRig({ x: 0, y: 0, facing: 'right' }).near).toBe('left')
    expect(personRig({ x: 0, y: 0, facing: 'left' }).near).toBe('right')
    expect(personRig({ x: 0, y: 0, facing: 'front' }).near).toBeNull()
    // 正面: 右手 は 画面の 左
    const front = personRig({ x: 50, y: 96, facing: 'front' })
    expect(front.world.arms.right.root[0]).toBeLessThan(50)
    expect(front.world.arms.left.root[0]).toBeGreaterThan(50)
  })

  it('ポーズ を まぜる: k = 0 で はじめ、1 で おわり の かっこう', () => {
    const a: PersonPose = { leftArm: { swing: 0, bend: 10 }, torso: 0 }
    const b: PersonPose = { leftArm: { swing: 90, bend: 30 }, torso: 20 }
    const at = (k: number) => personRig({ x: 0, y: 96, pose: mixPose(a, b, k) })
    expect(at(0).world.arms.left.swing).toBeCloseTo(0)
    expect(at(1).world.arms.left.swing).toBeCloseTo(90)
    expect(at(0.5).world.arms.left.bend).toBeCloseTo(20)
    expect(mixPose(a, b, 0.5).torso).toBeCloseTo(10)
  })
})

describe('人の 絵(Person)', () => {
  const partsOf = (pose: PersonPose, facing: Facing) => {
    const { container, unmount } = render(
      <svg>
        <Person x={50} y={96} facing={facing} pose={pose} />
      </svg>,
    )
    const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
    unmount()
    return parts
  }

  it('横むき では、むこうの うで・足 は どう より 先、てまえの うで は どう と あたま より 後に 描く(どんな ポーズ でも)', () => {
    for (const facing of ['left', 'right'] as const) {
      for (const pose of POSES) {
        const parts = partsOf(pose, facing)
        expect(parts).toEqual(['arm-far', 'leg-far', 'leg-near', 'torso', 'head', 'arm-near'])
      }
    }
  })

  it('正面 では、足 → どう → あたま → うで の じゅん', () => {
    expect(partsOf({}, 'front')).toEqual(['leg-right', 'leg-left', 'torso', 'head', 'arm-right', 'arm-left'])
  })

  it('どの 見た目・顔・向き でも、NaN の ない 絵になる', () => {
    for (const look of Object.values(LOOKS)) {
      for (const face of FACES) {
        for (const facing of FACINGS) {
          const { container, unmount } = render(
            <svg>
              <Person x={50} y={96} facing={facing} look={look} face={face} gaze={0.5} pose={POSES[1]} lift={2} headwear={<circle r="0.2" />} />
            </svg>,
          )
          expect(container.innerHTML).not.toContain('NaN')
          expect(container.querySelector('[data-part="head"]')).not.toBeNull()
          unmount()
        }
      }
    }
  })

  it('opacity が 0 なら 何も 描かない', () => {
    const { container } = render(
      <svg>
        <Person x={50} y={96} opacity={0} />
      </svg>,
    )
    expect(container.querySelector('[data-part]')).toBeNull()
  })
})

describe('あるき(walk)', () => {
  const plan: WalkPlan = { from: 10, to: 90, start: 1, end: 4, height: 44 }
  const footX = (t: number, p: WalkPlan, which: 'lead' | 'trail') => {
    const w = walk(t, p)
    const rig = personRig({ ...w, y: 96 })
    const side = which === 'lead' ? rig.near : rig.near === 'left' ? 'right' : 'left'
    return rig.world.legs[side ?? 'left'].end[0]
  }

  it('進む むき を むき、はじめ と おわり は 立ったまま。こし は もどらずに すすむ', () => {
    expect(walk(0, plan)).toMatchObject({ x: 10, facing: 'right', moving: false, pose: {} })
    expect(walk(5, plan)).toMatchObject({ x: 90, facing: 'right', moving: false })
    expect(walk(2, { ...plan, from: 90, to: 10 }).facing).toBe('left')
    let last = -Infinity
    for (let t = 1; t <= 4; t += 0.01) {
      const { x } = walk(t, plan)
      expect(x).toBeGreaterThanOrEqual(last - 1e-9)
      last = x
    }
  })

  it('地面に ついた 足は すべらない(同じ 1歩の 間、画面の 上で 動かない)', () => {
    for (const p of [plan, { ...plan, from: 100, to: 5, build: 'adult' as const, height: 60 }]) {
      const gait = gaitAt(2, p)
      const stepTime = (p.end - p.start) / gait.steps
      for (let k = 0; k < gait.steps; k += 1) {
        const which = k % 2 === 0 ? 'trail' : 'lead'
        const samples = [0.05, 0.3, 0.5, 0.7, 0.95].map((q) => footX(p.start + (k + q) * stepTime, p, which))
        for (const x of samples) expect(x).toBeCloseTo(samples[0], 6)
      }
    }
  })

  it('うく 足は、進む むき へ 出ていく(うしろ あるき に ならない)', () => {
    for (const p of [plan, { ...plan, from: 90, to: 10 }]) {
      const sign = p.to > p.from ? 1 : -1
      const gait = gaitAt(2, p)
      const stepTime = (p.end - p.start) / gait.steps
      for (let k = 0; k < gait.steps; k += 1) {
        const which = k % 2 === 0 ? 'lead' : 'trail'
        const xs = [0.1, 0.3, 0.5, 0.7, 0.9].map((q) => footX(p.start + (k + q) * stepTime, p, which))
        for (let i = 1; i < xs.length; i += 1) expect((xs[i] - xs[i - 1]) * sign).toBeGreaterThan(0)
        // うく 足 は 地面より 上
        const mid = gaitAt(p.start + (k + 0.5) * stepTime, p)
        expect(mid.feet[which].lift).toBeGreaterThan(0)
        expect(mid.planted).toBe(which === 'lead' ? 'trail' : 'lead')
      }
    }
  })

  it('うで は 同じ がわ の 足と はんたい に ふる(てまえの 足が まえ なら、てまえの うで は うしろ)', () => {
    const p: WalkPlan = { ...plan, from: 90, to: 10 }
    let checked = 0
    for (let t = 1.2; t < 3.8; t += 0.05) {
      const w = walk(t, p)
      const rig = personRig({ ...w, y: 96 })
      const sign = forwardSign(w.facing)
      for (const side of ['left', 'right'] as const) {
        const foot = (rig.world.legs[side].end[0] - rig.world.pelvis[0]) * sign
        const hand = (rig.world.arms[side].end[0] - rig.world.arms[side].root[0]) * sign
        if (Math.abs(foot) > 2) {
          expect(Math.sign(hand)).toBe(-Math.sign(foot))
          checked += 1
        }
      }
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('1歩目 は てまえ の 足から。歩幅 は 歩数が ちょうど に なるよう そろえる', () => {
    const first = gaitAt(1.05, plan)
    expect(first.planted).toBe('trail')
    expect(first.stepLength * (first.steps - 1)).toBeCloseTo(80, 6)
  })

  it('ふりむく: とちゅう で 向きが 入れかわり、体は 細くなっても 消えない', () => {
    expect(turnAround(0, 1, 'right', 'left')).toEqual({ facing: 'right', squash: 1 })
    expect(turnAround(1.1, 1, 'right', 'left').facing).toBe('right')
    expect(turnAround(1.2, 1, 'right', 'left').facing).toBe('left')
    expect(turnAround(1.15, 1, 'right', 'left').squash).toBeGreaterThanOrEqual(0.12)
    expect(turnAround(9, 1, 'right', 'front')).toEqual({ facing: 'front', squash: 1 })
  })
})

describe('背景・生きもの・しるし', () => {
  it('どの 進みぐあい でも NaN の ない 絵になり、0 のときは 何も 描かない', () => {
    for (const t of [0, 0.3, 0.6, 1, 2.5]) {
      const grow = Math.min(t, 1)
      const { container, unmount } = render(
        <svg>
          <Backdrop t={t} />
          <Tree x={60} y={96} grow={grow} sway={3} fruit />
          <PineTree x={20} y={96} grow={grow} />
          <Canopy x={50} y={30} r={20} grow={grow} />
          <House x={80} y={96} grow={grow} light={grow} />
          <Flower x={10} y={98} grow={grow} />
          <Bird x={50} y={20} t={t} flying facing="right" />
          <Butterfly x={30} y={40} t={t} perched={t > 1} />
          <Sweat t={t} x={30} y={30} show={grow} />
          <Sigh x={30} y={30} p={grow} show={grow} />
          <Hearts t={t} x={30} y={30} show={grow} />
          <Dust x={30} y={90} p={grow} />
          <Notice x={30} y={30} r={5} show={grow} dir={1} />
        </svg>,
      )
      expect(container.innerHTML).not.toContain('NaN')
      unmount()
    }
    const empty = render(
      <svg>
        <Tree x={60} y={96} grow={0} />
        <House x={80} y={96} grow={0} />
        <Sweat t={1} x={30} y={30} show={0} />
      </svg>,
    )
    expect(empty.container.querySelector('svg')?.children).toHaveLength(0)
  })

  it('地面に 立つ もの は、足もと の y の じゅんに 描く(おく → てまえ)', () => {
    const { container } = render(
      <svg>
        <ByDepth
          items={[
            { key: 'person', z: 97, node: <circle data-id="person" /> },
            { key: 'tree', z: 94, node: <circle data-id="tree" /> },
            { key: 'house', z: 94, node: <circle data-id="house" /> },
          ]}
        />
      </svg>,
    )
    expect([...container.querySelectorAll('[data-id]')].map((el) => el.getAttribute('data-id'))).toEqual(['tree', 'house', 'person'])
  })

  it('色: まぜる・かげ を つける', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixColor('#102030', '#ffffff', 0)).toBe('#102030')
    expect(shade('#4f9be0', 0.3)).toMatch(/^#[0-9a-f]{6}$/)
    expect(shade('#4f9be0', 0.3)).not.toBe('#4f9be0')
  })
})

describe('共通部品で 作った ためしの場面', () => {
  const trials = trialVariants().flatMap((variant) => trialChars(variant).map((char) => [variant, char] as const))

  it('ためしの場面が ある', () => {
    expect(trials.length).toBeGreaterThanOrEqual(3)
  })

  it.each(trials)('%s/%s: きまり を守り、どの しゅんかん も NaN なく描けて、さいごに 字の画が ぜんぶ書けている', async (variant, char) => {
    const scene = await loadTrial(variant, char)
    if (!scene) throw new Error(`読みこめません: ${variant}/${char}`)
    expect(checkScene(scene)).toEqual([])
    for (const time of [...sheetTimes(scene), scene.duration / 3, -1, scene.duration + 5]) {
      const { container, unmount } = render(<SceneStage scene={scene} t={time} label="x" />)
      expect(container.innerHTML).not.toContain('NaN')
      unmount()
    }
    const { container } = render(<SceneStage scene={scene} t={scene.duration} label="x" />)
    expect(container.querySelectorAll('[data-done="true"]')).toHaveLength(strokeCount(char))
  })
})
