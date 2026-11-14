import { clamp01, easeInOut, span } from '../sceneKit'
import { BUILDS, DEFAULT_HEIGHT, HANG_ARM, mixLimb, nearSide, reach, SEAT, type BodySide, type Build, type LimbAngles, type PersonPose } from './body'

/**
 * はしる。「どこから どこへ、何秒で」を わたすと、その時刻の 場所・向き・ポーズ・うく 高さ を返す。
 * <Person {...run(t, plan)} y={地面} /> と わたす(lift も 入っている)。
 *
 * あるき(walk)と 同じく、足あと を 先に きめる ので 地面の 足は すべらない:
 *   - 足あと は 1歩 ごとに 左右 かわりばんこ。足は 足あと に ついている 間 うごかない。
 *   - はしる と、2本 とも 地面から はなれる しゅんかん(とぶ ところ)が ある。そのとき 体は lift で うく。
 *   - うく 足は、かかと を おしり の ほうへ けりあげて から、ひざ を まえへ 出して つぎの 足あと へ。
 *   - うで は ひじ を まげて、同じ がわ の 足と はんたい に 大きく ふる。上体は 少し まえへ。
 *   - はじめ は だんだん はやく、おわり は だんだん おそく なり、さいごは 足を そろえて 止まる。
 * 足の 動きは 時刻 ではなく、こし が どこまで 来たか で きめる(はやさ が かわっても 足あと が ずれない)。
 */
export type RunPlan = {
  readonly from: number
  readonly to: number
  readonly start: number
  readonly end: number
  readonly build?: Build
  readonly height?: number
  /** 1歩(足あと から つぎの 足あと)の だいたいの はば。省くと 背の高さ × 0.62 */
  readonly stride?: number
  /** けりあげる 高さ(背の高さ 100 の 単位)。省くと 16 */
  readonly footLift?: number
  /** うでを ふる 大きさ(度)。省くと 45 */
  readonly armSwing?: number
}

export type RunResult = {
  readonly x: number
  readonly facing: 'left' | 'right'
  readonly pose: PersonPose
  readonly lift: number
  readonly build: Build
  readonly height: number
  readonly moving: boolean
  readonly progress: number
}

/** 足 1本 の ようす(テスト・足あと を 描く 場面 で使う) */
export type RunFoot = { readonly at: number; readonly lift: number; readonly planted: boolean }

export type RunGait = {
  /** こし の 進んだ きょり(画面の 単位。from から) */
  readonly pelvis: number
  /** lead = 先に ふみだす 足(てまえ の 足)。at は from から の きょり、lift は 背の高さ 100 の 単位 */
  readonly feet: Readonly<Record<'lead' | 'trail', RunFoot>>
  /** 地面 から こし まで(背の高さ 100 の 単位) */
  readonly hip: number
  readonly stride: number
  readonly steps: number
}

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 進みぐあい: はじめ の ramp は だんだん はやく、まんなか は 同じ はやさ、おわり の ramp は だんだん おそく */
export function rampProgress(u: number, ramp = 0.18): number {
  const x = clamp01(u)
  const peak = 1 / (1 - ramp)
  if (x < ramp) return (peak * x * x) / (2 * ramp)
  if (x > 1 - ramp) return 1 - (peak * (1 - x) ** 2) / (2 * ramp)
  return peak * (x - ramp / 2)
}

type Print = { readonly at: number; readonly land: number; readonly leave: number }

/** 足 1本 の 足あと の ならび(ついてから はなれる まで の こし の 場所 つき) */
function printsOf(foot: 'lead' | 'trail', steps: number, stride: number, before: number, after: number): Print[] {
  const first = foot === 'lead' ? 1 : 2
  const regular = Array.from({ length: Math.max(0, Math.floor((steps - first) / 2) + 1) }, (_, i) => first + i * 2).filter((k) => k <= steps)
  const start: Print = { at: 0, land: -Infinity, leave: foot === 'lead' ? 0 : after }
  const prints = regular.map((k): Print => ({ at: k * stride, land: k * stride - before, leave: k * stride + after }))
  const last = prints.at(-1)
  // もう かたほう の 足が さいごの 足あと に ついたら、こちら は となりに そろえて 止まる
  const join: Print[] = last?.at === steps * stride ? [] : [{ at: steps * stride, land: steps * stride, leave: Infinity }]
  const all = [start, ...prints, ...join]
  return all.map((p, i) => (i === all.length - 1 ? { ...p, leave: Infinity } : p))
}

/** こし が pelvis に ある ときの 足 1本 */
function footAt(prints: readonly Print[], pelvis: number, lift: number): RunFoot {
  for (let i = 0; i < prints.length; i += 1) {
    const p = prints[i]
    if (pelvis >= p.land && pelvis <= p.leave) return { at: p.at, lift: 0, planted: true }
    const next = prints[i + 1]
    if (next && pelvis > p.leave && pelvis < next.land) {
      const w = (pelvis - p.leave) / (next.land - p.leave)
      return { at: lerp(p.at, next.at, easeInOut(w)), lift: lift * Math.sin(w * Math.PI), planted: false }
    }
  }
  const last = prints[prints.length - 1]
  return { at: last.at, lift: 0, planted: true }
}

/** 足あと と こし の 高さ */
export function runGait(t: number, plan: RunPlan): RunGait {
  const build = plan.build ?? 'child'
  const height = plan.height ?? DEFAULT_HEIGHT[build]
  const scale = height / 100
  const body = BUILDS[build]
  const distance = Math.abs(plan.to - plan.from)
  const steps = Math.max(2, Math.round(distance / (plan.stride ?? height * 0.62)))
  const stride = distance / steps
  // 足あと に ついている 間: こし が 足あと の 少し てまえ(before)から 少し 先(after)まで
  const before = stride * 0.18
  const after = stride * 0.3
  const pelvis = distance * rampProgress(span(t, plan.start, plan.end))
  const lift = plan.footLift ?? 16
  const lead = footAt(printsOf('lead', steps, stride, before, after), pelvis, lift)
  const trail = footAt(printsOf('trail', steps, stride, before, after), pelvis, lift)
  const long = (body.thigh + body.shin) * 0.985
  const standOn = (at: number) => Math.sqrt(long * long - clamp((at - pelvis) / scale, -long * 0.9, long * 0.9) ** 2)
  // ついている 足: ひざ を 少し まげて ふんばる(足あと の まんなか で いちばん しずむ)
  const sink = (at: number) => {
    const phase = clamp01((pelvis - (at - before)) / (before + after))
    const ease = Math.min(1, pelvis / after, (distance - pelvis) / before)
    return 2.4 * Math.sin(phase * Math.PI) * clamp01(ease)
  }
  const planted = [lead, trail].filter((f) => f.planted)
  let hip: number
  if (planted.length > 0) {
    hip = Math.min(...planted.map((f) => standOn(f.at) - sink(f.at))) + body.footH
  } else {
    // とんでいる: けりだした 高さ から つぎに つく 高さ へ、山なりに
    const k = Math.floor((pelvis + before) / stride)
    const from = k * stride + after
    const to = (k + 1) * stride - before
    const w = clamp01((pelvis - from) / (to - from))
    hip = lerp(standOn(pelvis - after), standOn(pelvis + before), w) + body.footH + 3.2 * Math.sin(w * Math.PI)
  }
  return { pelvis, feet: { lead, trail }, hip, stride, steps }
}

export function run(t: number, plan: RunPlan): RunResult {
  const build = plan.build ?? 'child'
  const height = plan.height ?? DEFAULT_HEIGHT[build]
  const body = BUILDS[build]
  const scale = height / 100
  const sign = plan.to >= plan.from ? 1 : -1
  const facing = sign > 0 ? 'right' : 'left'
  const near = nearSide(facing) as BodySide
  const progress = span(t, plan.start, plan.end)
  const moving = progress > 0 && progress < 1 && plan.to !== plan.from
  const base = { facing, build, height, progress, moving } as const
  if (!moving) return { ...base, x: progress >= 1 ? plan.to : plan.from, pose: {}, lift: 0 }

  const gait = runGait(t, plan)
  const rel = (at: number) => (at - gait.pelvis) / scale
  const ankle = gait.hip - body.footH
  const legPose = (foot: RunFoot): LimbAngles => reach([0, 0], [rel(foot.at), ankle - foot.lift], [body.thigh, body.shin], 'leg', 'side')
  const footOf = (side: BodySide) => (side === near ? gait.feet.lead : gait.feet.trail)
  const legs = { left: legPose(footOf('left')), right: legPose(footOf('right')) }
  // うく 高さ: こし の 高さ から、いちばん 下に ある 足(ひざ)まで を ひいた ぶん
  const rad = (d: number) => (d * Math.PI) / 180
  const extent = (a: LimbAngles) => {
    const kneeY = Math.cos(rad(a.swing)) * body.thigh
    return Math.max(kneeY + Math.cos(rad(a.swing - a.bend)) * body.shin + body.footH, kneeY + body.legW / 2)
  }
  const lowest = Math.max(SEAT, extent(legs.left), extent(legs.right))
  // はしりだし・とまりぎわ は、うで と 上体 を 立った かっこう から だんだん
  const settle = clamp01(Math.min(gait.pelvis, Math.abs(plan.to - plan.from) - gait.pelvis) / (gait.stride * 0.6))
  const half = (gait.stride / scale) * 0.5
  const armSwing = plan.armSwing ?? 45
  const armPose = (side: BodySide) => {
    const n = clamp(rel(footOf(side).at) / half, -1, 1)
    const running: LimbAngles = { swing: -armSwing * n, bend: 78 + 18 * clamp01(-n) }
    return mixLimb(HANG_ARM, running, settle)
  }
  const pose: PersonPose = {
    leftLeg: legs.left,
    rightLeg: legs.right,
    leftArm: armPose('left'),
    rightArm: armPose('right'),
    torso: 10 * settle,
    head: -6 * settle,
  }
  return { ...base, x: plan.from + sign * gait.pelvis, pose, lift: Math.max(0, gait.hip - lowest) * scale }
}
