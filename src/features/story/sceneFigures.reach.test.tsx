import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { holdPose, Person, personRig, reach, reachDeep, run, runDepth, runPrints, walk, walkPrints, type DepthRunPlan, type Placement, type Point, type Rig, type RunPlan, type WalkPlan } from './sceneFigures'

const soleOf = (rig: Rig, side: 'left' | 'right') => rig.world.legs[side].end[1] + rig.body.footH * rig.scale
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const finite = (rig: Rig) => [rig.world.pelvis, rig.world.head, ...(['left', 'right'] as const).flatMap((s) => [rig.world.arms[s].end, rig.world.legs[s].end, rig.world.legs[s].mid])].flat().every(Number.isFinite)

function partsOf(props: Parameters<typeof Person>[0]) {
  const { container, unmount } = render(
    <svg>
      <Person {...props} />
    </svg>,
  )
  const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
  unmount()
  return parts
}

describe('まえ へ のばす(to + depth)', () => {
  it('正面・うしろむき: 手 は 画面 の 点 に とどき、体 の まえ へ depth の ところ に ある', () => {
    for (const facing of ['front', 'back'] as const) {
      // 右手 の かた から 見た 点(out = 外 へ、正面 の 右手 は 画面 の 左)。さいご は 体 の まえ を よこぎって 反対 がわ へ
      const shoulder = personRig({ x: 50, y: 96, facing, height: 50 }).world.arms.right.root
      const out = facing === 'front' ? -1 : 1
      for (const [dx, dy, depth] of [
        [2, 7, 8],
        [-3, 9, 6],
        [6, -6, -3],
        [-10, 1, 5],
      ] as const) {
        const target: Point = [shoulder[0] + out * dx, shoulder[1] + dy]
        const rig = personRig({ x: 50, y: 96, facing, height: 50, pose: { rightArm: { to: target, depth } } })
        const hand = rig.world.arms.right
        expect(dist(hand.end, target)).toBeLessThan(0.05)
        expect(hand.depth * rig.scale).toBeCloseTo(depth, 1)
        // ほね の 長さ は かわらない(画面 では、まえうしろ の ぶん は 見下ろし の かたむき だけ に ちぢむ)
        expect(dist(hand.root, hand.mid)).toBeLessThanOrEqual(rig.body.upperArm * rig.scale * Math.hypot(1, 0.3) + 1e-6)
      }
    }
  })

  it('ひじ は 外 へ 出る(体 の 内がわ へ まがらない)。とどかない 点 は のばした うで が その むき を さす', () => {
    const rig = personRig({ x: 50, y: 96, facing: 'front', height: 50, pose: { rightArm: { to: [48, 76], depth: 9 }, leftArm: { to: [90, 40], depth: 30 } } })
    const right = rig.world.arms.right
    // 正面 の 右手 は 画面 の 左。ひじ は かた と 手 を むすぶ 線 より 左(外)
    const t = (right.mid[1] - right.root[1]) / (right.end[1] - right.root[1])
    expect(right.mid[0]).toBeLessThan(right.root[0] + (right.end[0] - right.root[0]) * t)
    const left = rig.world.arms.left
    expect(Number.isFinite(left.end[0])).toBe(true)
    expect(left.fore).toBeGreaterThan(20)
  })

  it('depth を 省けば いままで の 平面 の 計算 と 同じ。横むき では depth を つかわない', () => {
    const plain = personRig({ x: 50, y: 96, facing: 'front', pose: { leftArm: { to: [60, 70] } } })
    const angles = reach(plain.local.arms.left.root, plain.toLocal([60, 70]), [plain.body.upperArm, plain.body.foreArm], 'arm', 'front', 1)
    expect(plain.world.arms.left.swing).toBeCloseTo(angles.swing, 6)
    const side = personRig({ x: 50, y: 96, facing: 'right', pose: { leftArm: { to: [60, 70], depth: 9 } } })
    const sidePlain = personRig({ x: 50, y: 96, facing: 'right', pose: { leftArm: { to: [60, 70] } } })
    expect(side.world.arms.left.end).toEqual(sidePlain.world.arms.left.end)
  })

  it('あし も 3次元 で とどく(ひざ は まえ へ)', () => {
    const angles = reachDeep([0, 0], [4, 20], 16, [16.5, 15.5], 'leg', 1, 0.3)
    expect(angles.fore ?? 0).toBeGreaterThan(0)
    expect(Number.isFinite(angles.bend)).toBe(true)
  })

  it('正面 で まえ へ のばした うで は どう の まえ、うしろむき では どう の おく', () => {
    const front = partsOf({ x: 50, y: 96, facing: 'front', pose: { rightArm: { to: [48, 76], depth: 9 } } })
    expect(front.indexOf('arm-right')).toBeGreaterThan(front.indexOf('torso'))
    const back = partsOf({ x: 50, y: 96, facing: 'back', pose: { rightArm: { to: [52, 70], depth: 9 } } })
    expect(back.indexOf('arm-right')).toBeLessThan(back.indexOf('torso'))
  })
})

describe('さし出す(holdPose offer)', () => {
  const base = (facing: Placement['facing']): Placement => ({ x: 50, y: 96, facing, height: 46 })

  it('正面: 両手 は 物 の 左右、体 の まえ へ のびる', () => {
    const hold = holdPose(base('front'), 'offer', 12)
    const rig = personRig({ ...base('front'), pose: hold.pose })
    expect(rig.world.arms.right.end[0]).toBeCloseTo(hold.at[0] - 6, 1)
    expect(rig.world.arms.left.end[0]).toBeCloseTo(hold.at[0] + 6, 1)
    expect(rig.world.arms.right.depth).toBeGreaterThan(rig.body.upperArm)
    // chest より 体 から はなれる
    const chest = personRig({ ...base('front'), pose: holdPose(base('front'), 'chest', 12).pose })
    expect(rig.world.arms.right.depth).toBeGreaterThan(chest.world.arms.right.depth)
  })

  it('うしろむき: うで は 体 の おく。横むき: てまえ の 手 は 物 の そば、物 は 体 の まえ', () => {
    const back = holdPose(base('back'), 'offer', 12)
    const parts = partsOf({ ...base('back'), pose: back.pose, held: <rect /> })
    expect(parts.indexOf('arm-left')).toBeLessThan(parts.indexOf('torso'))
    expect(parts.indexOf('arm-right')).toBeLessThan(parts.indexOf('torso'))
    for (const facing of ['left', 'right'] as const) {
      const hold = holdPose(base(facing), 'offer', 12)
      const rig = personRig({ ...base(facing), pose: hold.pose })
      expect(dist(rig.world.arms[rig.near ?? 'left'].end, hold.at)).toBeLessThan(6)
      expect((hold.at[0] - 50) * (facing === 'right' ? 1 : -1)).toBeGreaterThan(10)
    }
  })
})

describe('てまえ・おく へ はしる(runDepth)', () => {
  const toward: DepthRunPlan = { from: [54, 74], to: [54, 102], start: 1, end: 2.6, height: 26, toHeight: 52 }
  const away: DepthRunPlan = { from: [44, 108], to: [44, 80], start: 1, end: 2.4, height: 48, toHeight: 26 }

  it('上 へ 行けば うしろむき、下 へ 来れば 正面。はじめ と おわり は 立ったまま', () => {
    expect(runDepth(0, toward)).toMatchObject({ x: 54, y: 74, height: 26, facing: 'front', moving: false, lift: 0, pose: {} })
    expect(runDepth(3, toward)).toMatchObject({ x: 54, y: 102, height: 52, moving: false })
    expect(runDepth(1.5, away).facing).toBe('back')
  })

  it('地面 に ついた 足 は すべらない。2本 とも うく しゅんかん が あり、その とき は 地面 より 上', () => {
    for (const plan of [toward, away]) {
      let flights = 0
      const planted = new Map<string, Point>()
      for (let t = plan.start + 0.004; t < plan.end; t += 0.008) {
        const r = runDepth(t, plan)
        const rig = personRig(r)
        expect(finite(rig)).toBe(true)
        const stance = r.stance ?? 'right'
        if (r.lift === 0) {
          // くつ底 は 足あと(y)に、足あと ごと に 画面 の 同じ 点
          expect(soleOf(rig, stance)).toBeCloseTo(r.y, 6)
          const key = `${stance}:${r.y.toFixed(4)}`
          const at: Point = [rig.world.legs[stance].end[0], soleOf(rig, stance)]
          const seen = planted.get(key)
          if (seen) expect(dist(seen, at)).toBeLessThan(0.02)
          else planted.set(key, at)
        } else {
          // とんでいる: どちら の 足 も、その 足 の 下 の 地面(こし の 下 の 地面 から おくゆき の ぶん ずれる)より 上
          flights += 1
          const toward = r.facing === 'front' ? 1 : -1
          for (const side of ['left', 'right'] as const) {
            const ground = r.y + rig.world.legs[side].depth * rig.scale * 0.3 * toward
            expect(soleOf(rig, side)).toBeLessThan(ground + 0.01)
          }
        }
      }
      expect(flights).toBeGreaterThan(5)
      expect(planted.size).toBeGreaterThanOrEqual(4)
    }
  })

  it('こし は とばずに すすむ。正面 で まえ へ 出した ひざ は どう の てまえ', () => {
    let last: number | null = null
    let kneeInFront = 0
    for (let i = 0; toward.start + i * 0.004 <= toward.end; i += 1) {
      const r = runDepth(toward.start + i * 0.004, toward)
      const pelvis = personRig(r).world.pelvis[1]
      if (last !== null) expect(Math.abs(pelvis - last)).toBeLessThan(1.2)
      last = pelvis
      // 絵 の じゅんばん は 10コマ に 1回 だけ しらべる(描く のは おそい)
      if (i % 10 !== 0) continue
      const parts = partsOf(r)
      if (parts.indexOf('leg-left') > parts.indexOf('torso') || parts.indexOf('leg-right') > parts.indexOf('torso')) kneeInFront += 1
    }
    expect(kneeInFront).toBeGreaterThan(3)
  })
})

describe('足あと の 場所(walkPrints・runPrints)', () => {
  it('あるき: 足 が つく 時刻 に、その 足 の くつ は 足あと の 場所 に ある', () => {
    for (const plan of [{ from: 10, to: 80, start: 1, end: 3, height: 44 }, { from: 90, to: 20, start: 0.5, end: 2.5, height: 50, build: 'adult' as const }] satisfies WalkPlan[]) {
      const prints = walkPrints(plan)
      expect(prints.length).toBeGreaterThanOrEqual(4)
      for (const p of prints) {
        // 足 が つく ちょくぜん(さいご の 1歩 の あと は 立った かっこう に もどる ので、その 前 で しらべる)
        const rig = personRig({ ...walk(p.at - 1e-4, plan), y: 96 })
        const shoe = rig.world.legs[p.side].end[0] + (p.facing === 'right' ? 1 : -1) * rig.body.footL * 0.3 * rig.scale
        expect(shoe).toBeCloseTo(p.x, 2)
        expect(soleOf(rig, p.side)).toBeCloseTo(96, 1)
      }
      // 足あと は すすむ むき へ ならぶ
      const xs = prints.map((p) => p.x * (plan.to > plan.from ? 1 : -1))
      xs.forEach((x, i) => i > 0 && expect(x).toBeGreaterThanOrEqual(xs[i - 1] - 1e-9))
    }
  })

  it('はしり: 足 が ついて いる 間、その 足 の くつ は 足あと の 場所', () => {
    const plan: RunPlan = { from: 6, to: 100, start: 0.5, end: 2.8, height: 42 }
    const prints = runPrints(plan)
    expect(prints.length).toBeGreaterThanOrEqual(5)
    for (const p of prints.slice(0, -1)) {
      const rig = personRig({ ...run(p.at + 0.02, plan), y: 96 })
      const shoe = rig.world.legs[p.side].end[0] + rig.body.footL * 0.3 * rig.scale
      expect(shoe).toBeCloseTo(p.x, 1)
    }
    expect(prints.at(-1)?.at).toBe(plan.end)
    expect(runPrints({ ...plan, from: 100, to: 6 })[0].facing).toBe('left')
  })
})
