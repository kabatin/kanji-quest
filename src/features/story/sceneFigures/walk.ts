import { clamp01, easeInOut, span } from '../sceneKit'
import { BUILDS, DEFAULT_HEIGHT, nearSide, reach, type BodySide, type Build, type Facing, type LimbAngles, type PersonPose } from './body'

/**
 * あるく。「どこから どこへ、何秒で」を わたすと、その時刻の 場所(x)・向き・ポーズ を返す。
 * そのまま <Person {...walk(t, plan)} y={地面} /> と わたせる。
 *
 * 足あと を先に きめてから 体を 動かすので、地面に ついた 足は ぜったいに すべらない:
 *   - 1歩ごとに、うしろの 足を まえの 足あと へ はこぶ(その間 もう1本の 足は 地面に ついたまま)。
 *   - こし は 2本の 足の あいだ を すすむ。地面の 足が まうしろ に 来るほど こし が 下がる(自然な 上下)。
 *   - 1歩目 と さいごの 1歩 は 半分の 歩幅(立った ところから あるきだし、足を そろえて 止まる)。
 *   - うで は、同じ がわ の 足と はんたい に ふる(左足が まえ のとき、左うで は うしろ)。
 */
export type WalkPlan = {
  /** あるきはじめ の x(こし の 場所) */
  readonly from: number
  /** とまる x */
  readonly to: number
  /** あるきはじめ の 時刻(秒) */
  readonly start: number
  /** とまる 時刻(秒) */
  readonly end: number
  readonly build?: Build
  readonly height?: number
  /** だいたいの 歩幅(画面の 単位)。省くと 背の高さ × 0.3。じっさいは 歩数が ちょうど に なるよう 少し かわる */
  readonly step?: number
  /** うでを ふる 大きさ(度)。省くと 24。とぼとぼ なら 10 くらい */
  readonly armSwing?: number
  /** 足を あげる 高さ(背の高さ 100 の 単位)。省くと 6 */
  readonly footLift?: number
}

export type WalkResult = {
  readonly x: number
  readonly facing: 'left' | 'right'
  readonly pose: PersonPose
  readonly build: Build
  readonly height: number
  /** あるいている とちゅう か */
  readonly moving: boolean
  /** どこまで 来たか(0〜1) */
  readonly progress: number
}

/** 足あとの 計算の けっか(テスト・足あとを 描く 場面 で使う) */
export type Gait = {
  /** こし の 進んだ きょり(画面の 単位。from から) */
  readonly pelvis: number
  /** 足の 進んだ きょり と 地面から うく 高さ(背の高さ 100 の 単位) */
  readonly feet: Readonly<Record<'lead' | 'trail', { readonly at: number; readonly lift: number }>>
  /** いま 地面に ついている(うごかない)足 */
  readonly planted: 'lead' | 'trail' | 'both'
  readonly stepLength: number
  readonly steps: number
}

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

/** 足あと と こし の 進みぐあい。lead = 先に ふみだす 足(てまえ の 足) */
export function gaitAt(t: number, plan: WalkPlan): Gait {
  const height = plan.height ?? DEFAULT_HEIGHT[plan.build ?? 'child']
  const distance = Math.abs(plan.to - plan.from)
  const steps = Math.max(2, Math.round(distance / (plan.step ?? height * 0.3)) + 1)
  const stride = distance / (steps - 1)
  const lift = plan.footLift ?? 6
  const u = clamp(((t - plan.start) / Math.max(plan.end - plan.start, 1e-6)) * steps, 0, steps)
  const k = Math.min(Math.floor(u), steps - 1)
  const q = u - k
  // 1歩ごとの 足あと: k 歩目に うごく 足は、(k-1) 歩ぶん の 所 から (k+1) 歩ぶん の 所 へ(はし は 半歩)
  const from = Math.max(k - 1, 0) * stride
  const land = Math.min(k + 1, steps - 1) * stride
  const moving = from + (land - from) * easeInOut(q)
  const still = Math.min(k, steps - 1) * stride
  // こし: 1歩目 は だんだん はやく、さいご は だんだん おそく(とちゅう は 同じ はやさ)
  const p0 = k === 0 ? 0 : (k - 0.5) * stride
  const p1 = k === steps - 1 ? (steps - 1) * stride : (k + 0.5) * stride
  const shape = k === 0 ? q * q : k === steps - 1 ? 1 - (1 - q) ** 2 : q
  const pelvis = p0 + (p1 - p0) * shape
  const air = q > 0 && q < 1 && land > from ? lift * Math.sin(q * Math.PI) * Math.min(1, (land - from) / (2 * stride || 1) + 0.35) : 0
  const leadMoves = k % 2 === 0
  const swing = { at: moving, lift: air }
  const stand = { at: still, lift: 0 }
  return {
    pelvis,
    feet: { lead: leadMoves ? swing : stand, trail: leadMoves ? stand : swing },
    planted: air > 0 ? (leadMoves ? 'trail' : 'lead') : 'both',
    stepLength: stride,
    steps,
  }
}

/** あるく 人の 場所・向き・ポーズ */
export function walk(t: number, plan: WalkPlan): WalkResult {
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
  if (!moving) return { ...base, x: progress >= 1 ? plan.to : plan.from, pose: {} }

  const gait = gaitAt(t, plan)
  const legs: Point2 = [body.thigh, body.shin]
  const long = (body.thigh + body.shin) * 0.985
  // 地面の 足 が こし から はなれる ほど、こし は 下がる(足の 長さ は かわらない)
  const rel = (at: number) => (at - gait.pelvis) / scale
  const groundFoot = gait.planted === 'trail' ? gait.feet.trail : gait.feet.lead
  const reachX = clamp(rel(groundFoot.at), -long * 0.9, long * 0.9)
  const depth = Math.sqrt(long * long - reachX * reachX)
  const legPose = (foot: { readonly at: number; readonly lift: number }): LimbAngles => reach([0, 0], [rel(foot.at), depth - foot.lift], legs, 'leg', 'side')
  // うで: 同じ がわ の 足の はんたい に ふる。まえに ふった うで は ひじ が 少し まがる
  const half = (gait.stepLength / scale) * 0.5 || 1
  const armSwing = plan.armSwing ?? 24
  const armPose = (foot: { readonly at: number }): LimbAngles => {
    const n = clamp(rel(foot.at) / half, -1, 1)
    return { swing: -armSwing * n, bend: 12 + 14 * clamp01(-n) }
  }
  // 先に ふみだす のは てまえ の 足
  const footOf = (side: BodySide) => (side === near ? gait.feet.lead : gait.feet.trail)
  const pose: PersonPose = {
    leftLeg: legPose(footOf('left')),
    rightLeg: legPose(footOf('right')),
    leftArm: armPose(footOf('left')),
    rightArm: armPose(footOf('right')),
    torso: 2,
  }
  return { ...base, x: plan.from + sign * gait.pelvis, pose }
}

type Point2 = readonly [number, number]

/**
 * ふりむく。at から duration 秒で、from の向き から to の向き へ(とちゅうで 体が 細くなって 入れかわる)。
 * <Person {...turnAround(t, 3, 'right', 'left')} … /> のように わたす。
 * via を わたすと、いったん その向きを 通る(正面 → 横 → うしろ のように、体が 回って 見える)。
 * そのときは from → via と via → to に、それぞれ duration 秒 かける。
 */
export function turnAround(t: number, at: number, from: Facing, to: Facing, duration = 0.3, via?: Facing): { readonly facing: Facing; readonly squash: number } {
  if (via !== undefined) return t < at + duration ? turnAround(t, at, from, via, duration) : turnAround(t, at + duration, via, to, duration)
  const k = span(t, at, at + duration, easeInOut)
  return { facing: k < 0.5 ? from : to, squash: Math.max(0.12, Math.abs(Math.cos(k * Math.PI))) }
}
