import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  BUILDS,
  deskHeight,
  holdPose,
  lieDown,
  Person,
  personRig,
  posture,
  rampProgress,
  run,
  runGait,
  seatHeight,
  seatUnder,
  walkDepth,
  type DepthWalkPlan,
  type Facing,
  type Placement,
  type PostureName,
  type Rig,
  type RunPlan,
} from './sceneFigures'

const soleOf = (rig: Rig, side: 'left' | 'right') => rig.world.legs[side].end[1] + rig.body.footH * rig.scale
const finite = (rig: Rig) =>
  [rig.world.pelvis, rig.world.head, ...(['left', 'right'] as const).flatMap((s) => [rig.world.arms[s].end, rig.world.legs[s].end, rig.world.legs[s].mid])].flat().every(Number.isFinite)

describe('おくへ あるく(walkDepth)', () => {
  const away: DepthWalkPlan = { from: [50, 106], to: [52, 86], start: 1, end: 3, height: 52, toHeight: 34 }
  const toward: DepthWalkPlan = { from: [50, 86], to: [50, 106], start: 1, end: 3, height: 34, toHeight: 52 }

  it('上へ 行けば うしろむき、下へ 来れば 正面。はじめ と おわり は 立ったまま', () => {
    expect(walkDepth(0, away)).toMatchObject({ x: 50, y: 106, height: 52, facing: 'back', moving: false, pose: {} })
    expect(walkDepth(5, away)).toMatchObject({ x: 52, y: 86, height: 34, facing: 'back', moving: false })
    expect(walkDepth(2, toward).facing).toBe('front')
  })

  it('とおくへ 行くほど 小さく、足もと は もどらずに おくへ すすむ', () => {
    let lastY = Infinity
    let lastH = Infinity
    for (let t = 1; t <= 3; t += 0.02) {
      const w = walkDepth(t, away)
      expect(finite(personRig(w))).toBe(true)
      expect(w.y).toBeLessThanOrEqual(lastY + 1e-9)
      expect(w.height).toBeLessThanOrEqual(lastH + 1e-9)
      lastY = w.y
      lastH = w.height
    }
    expect(personRig(walkDepth(2.9, away)).world.pelvis[1]).toBeLessThan(personRig(walkDepth(1.1, away)).world.pelvis[1] - 10)
  })

  it('地面の 足 の くつ底 は、その 1歩 の 間 画面の 同じ 高さ に ある(すべらない)', () => {
    for (const plan of [away, toward]) {
      const samples = new Map<string, number[]>()
      for (let t = plan.start + 0.005; t < plan.end; t += 0.01) {
        const w = walkDepth(t, plan)
        if (!w.stance) continue
        const rig = personRig(w)
        // くつ底 は いつも y に ある
        expect(soleOf(rig, w.stance)).toBeCloseTo(w.y, 6)
        const key = `${w.stance}:${w.y.toFixed(4)}`
        samples.set(key, [...(samples.get(key) ?? []), w.y])
      }
      // 足あと は 歩数 くらい(1歩 ごとに 1つ)
      expect(samples.size).toBeGreaterThanOrEqual(4)
    }
  })

  it('1歩 の さかいめ でも、体は とばない(こし の 場所 が つながっている)', () => {
    let last: number | null = null
    for (let t = away.start; t <= away.end; t += 0.004) {
      const pelvis = personRig(walkDepth(t, away)).world.pelvis[1]
      if (last !== null) expect(Math.abs(pelvis - last)).toBeLessThan(0.6)
      last = pelvis
    }
  })
})

describe('はしる(run)', () => {
  const plan: RunPlan = { from: 6, to: 100, start: 0.5, end: 2.8, height: 42 }

  it('進みぐあい: はじめ と おわり は ゆっくり、0 → 1', () => {
    expect(rampProgress(0)).toBe(0)
    expect(rampProgress(1)).toBeCloseTo(1, 9)
    expect(rampProgress(-1)).toBe(0)
    let last = -1
    for (let u = 0; u <= 1; u += 0.01) {
      expect(rampProgress(u)).toBeGreaterThanOrEqual(last)
      last = rampProgress(u)
    }
    expect(rampProgress(0.05)).toBeLessThan(0.05)
  })

  it('はじめ と おわり は 立ったまま。進む むき を むく', () => {
    expect(run(0, plan)).toMatchObject({ x: 6, facing: 'right', moving: false, lift: 0, pose: {} })
    expect(run(3, plan)).toMatchObject({ x: 100, moving: false })
    expect(run(1, { ...plan, from: 100, to: 6 }).facing).toBe('left')
  })

  it('地面に ついた 足 は すべらず、くつ底 は 地面に ある。2本とも うく しゅんかん が ある', () => {
    let flights = 0
    const planted = new Map<string, number>()
    for (let t = plan.start + 0.003; t < plan.end; t += 0.006) {
      const r = run(t, plan)
      const rig = personRig({ ...r, y: 96 })
      expect(finite(rig)).toBe(true)
      const gait = runGait(t, plan)
      const near = rig.near ?? 'left'
      const far = near === 'left' ? 'right' : 'left'
      for (const [which, side] of [['lead', near], ['trail', far]] as const) {
        const foot = gait.feet[which]
        if (foot.planted) {
          expect(soleOf(rig, side)).toBeCloseTo(96, 5)
          const key = `${which}:${foot.at.toFixed(3)}`
          const x = rig.world.legs[side].end[0]
          if (planted.has(key)) expect(x).toBeCloseTo(planted.get(key) ?? 0, 5)
          else planted.set(key, x)
        }
      }
      if (!gait.feet.lead.planted && !gait.feet.trail.planted) {
        flights += 1
        expect(r.lift).toBeGreaterThan(0)
        expect(soleOf(rig, 'left')).toBeLessThan(96)
        expect(soleOf(rig, 'right')).toBeLessThan(96)
      }
    }
    expect(flights).toBeGreaterThan(10)
    expect(planted.size).toBeGreaterThanOrEqual(5)
  })

  it('うく 足 は 進む むき へ 出ていく(足あと から つぎの 足あと へ)', () => {
    let last = { lead: -Infinity, trail: -Infinity }
    for (let t = plan.start; t <= plan.end; t += 0.01) {
      const g = runGait(t, plan)
      expect(g.feet.lead.at).toBeGreaterThanOrEqual(last.lead - 1e-9)
      expect(g.feet.trail.at).toBeGreaterThanOrEqual(last.trail - 1e-9)
      last = { lead: g.feet.lead.at, trail: g.feet.trail.at }
    }
    const end = runGait(plan.end, plan)
    expect(end.feet.lead.at).toBeCloseTo(94, 6)
    expect(end.feet.trail.at).toBeCloseTo(94, 6)
  })
})

describe('かっこう(posture)', () => {
  const names: readonly PostureName[] = ['stand', 'sitChair', 'sitFloor', 'seiza', 'kneel', 'squat', 'bow', 'banzai', 'wave']
  const facings: readonly Facing[] = ['left', 'right', 'front', 'back']

  it('どの かっこう・向き でも 関節は 数 に なり、絵 に NaN が ない', () => {
    for (const name of names) {
      for (const facing of facings) {
        for (const build of Object.keys(BUILDS) as (keyof typeof BUILDS)[]) {
          expect(finite(personRig({ x: 50, y: 96, facing, build, pose: posture(name, facing) }))).toBe(true)
        }
        const { container, unmount } = render(
          <svg>
            <Person x={50} y={96} facing={facing} pose={posture(name, facing)} />
          </svg>,
        )
        expect(container.innerHTML).not.toContain('NaN')
        unmount()
      }
    }
  })

  it('いす に すわる(横): こし は いす の ざめん の 上、足 の うら は 地面', () => {
    for (const build of ['child', 'teen', 'adult'] as const) {
      const rig = personRig({ x: 50, y: 96, facing: 'right', build, pose: posture('sitChair', 'right') })
      expect(Math.max(soleOf(rig, 'left'), soleOf(rig, 'right'))).toBeCloseTo(96, 1)
      const seat = 96 - seatHeight(build)
      // もも の 下 が ざめん に のる(こし は ざめん より もも の あつみ の 半分 上)
      expect(seat - rig.world.pelvis[1]).toBeCloseTo((rig.body.legW / 2) * rig.scale, 0)
      expect(deskHeight(build)).toBeGreaterThan(seatHeight(build))
      expect(seatUnder({ x: 50, y: 96, facing: 'right', build, pose: posture('sitChair', 'right') })[1]).toBeGreaterThan(rig.world.pelvis[1])
    }
  })

  it('正座: おしり が かかと の 上(こし は 地面 から すね の あつみ くらい)。しゃがむ: ひざ が こし より 上', () => {
    const seiza = personRig({ x: 50, y: 96, facing: 'right', pose: posture('seiza', 'right') })
    expect(96 - seiza.world.pelvis[1]).toBeLessThan(seiza.body.legW * 1.5 * seiza.scale)
    const squat = personRig({ x: 50, y: 96, facing: 'right', pose: posture('squat', 'right') })
    expect(squat.world.legs.left.mid[1]).toBeLessThan(squat.world.pelvis[1])
    expect(Math.max(soleOf(squat, 'left'), soleOf(squat, 'right'))).toBeCloseTo(96, 6)
  })

  it('正面 で いす に すわる と、ひざ は 見る人 の ほう(まえ)に 出る', () => {
    const rig = personRig({ x: 50, y: 96, facing: 'front', pose: posture('sitChair', 'front') })
    expect(rig.world.legs.left.midDepth).toBeGreaterThan(rig.body.thigh * 0.9)
    expect(rig.world.legs.left.mid[1]).toBeGreaterThan(rig.world.pelvis[1])
  })

  it('ねころぶ: 体は 横に ねて、あたま は headTo の がわ。せなか は 地面 の 上', () => {
    for (const headTo of ['left', 'right'] as const) {
      const placement = lieDown({ x: 50, y: 96, headTo })
      const rig = personRig(placement)
      expect(Math.abs(rig.world.pelvis[0] - 50)).toBeLessThan(0.01)
      expect(Math.sign(rig.world.head[0] - 50)).toBe(headTo === 'left' ? -1 : 1)
      // あたま と こし は ほぼ 同じ 高さ(よこに ねている)
      expect(Math.abs(rig.world.head[1] - rig.world.pelvis[1])).toBeLessThan(3)
      expect(rig.world.pelvis[1]).toBeLessThan(96)
    }
  })
})

describe('物を もつ(holdPose)', () => {
  const base = (facing: Facing): Placement => ({ x: 50, y: 96, facing, height: 44 })

  it('横むき: 両手 が 物の ところ に とどき、物は 体の まえ', () => {
    for (const facing of ['right', 'left'] as const) {
      for (const place of ['chest', 'waist', 'overhead'] as const) {
        const hold = holdPose(base(facing), place, 12)
        const rig = personRig({ ...base(facing), pose: hold.pose })
        const near = rig.world.arms[rig.near ?? 'left'].end
        expect(Math.hypot(near[0] - hold.at[0], near[1] - hold.at[1])).toBeLessThan(10)
        if (place !== 'overhead') expect((hold.at[0] - 50) * (facing === 'right' ? 1 : -1)).toBeGreaterThan(0)
        else expect(hold.at[1]).toBeLessThan(rig.world.head[1])
      }
    }
  })

  it('正面: 両手 は 物の 左右 に そろう。うしろむき: うで は 体の おく', () => {
    const hold = holdPose(base('front'), 'chest', 14)
    const rig = personRig({ ...base('front'), pose: hold.pose })
    const mid = (rig.world.arms.left.end[0] + rig.world.arms.right.end[0]) / 2
    expect(mid).toBeCloseTo(hold.at[0], 5)
    expect(rig.world.arms.left.end[1]).toBeCloseTo(rig.world.arms.right.end[1], 5)
    expect(holdPose(base('front'), 'overhead', 10).at[1]).toBeLessThan(rig.world.head[1])
    const back = holdPose(base('back'), 'waist', 10)
    const { container, unmount } = render(
      <svg>
        <Person {...base('back')} pose={back.pose} held={<rect data-id="box" />} />
      </svg>,
    )
    const parts = [...container.querySelectorAll('[data-part]')].map((el) => el.getAttribute('data-part'))
    expect(parts.indexOf('arm-left')).toBeLessThan(parts.indexOf('torso'))
    expect(parts[0]).toBe('held')
    unmount()
    expect(holdPose(base('back'), 'overhead', 10).pose.leftArm).toMatchObject({ swing: 150 })
  })
})
