import { clamp01, span } from '../sceneKit'
import { BUILDS, DEFAULT_HEIGHT, DEPTH_TILT, reach, type BodySide, type Build, type LimbAngles, type PersonPose, type Point } from './body'
import { gaitAt } from './walk'

/**
 * おく へ あるいて とおざかる(うしろすがた)・おく から てまえ へ あるいてくる(正面)。
 * <Person {...walkDepth(t, plan)} /> と わたす(y・背の高さ・向き・ポーズ が 入っている)。
 *
 * 足もと の 点 を「どこから どこへ」で わたす。y が 小さく なる(画面の 上へ 行く)なら おくへ = うしろすがた、
 * 大きく なるなら てまえへ = 正面。とおくへ 行くほど 小さく 見えるよう、toHeight で おわりの 背の高さ を きめる。
 *
 * 横の walk と 同じく、足あと を 先に きめる ので 地面の 足は すべらない:
 *   - 地面の 足 の くつ底 は、その 1歩の 間 画面の 同じ 点 に ある(stance で Person に つたえる)。
 *   - うく 足 は、おく(正面 なら てまえ)へ 出て、少し 上から 見ている ぶん 画面の 上(下)で つく。
 *   - うで は まえうしろ に、同じ がわ の 足と はんたい に ふる。
 * 画面の 上下 1 は、おくゆき 1 / DEPTH_TILT に あたる(body.ts と 同じ 見下ろし の 角度)。
 * 横に 大きく ずれる 道は すべって 見える ので、ななめ には 横の walk と turnAround を つなぐ。
 */
export type DepthWalkPlan = {
  /** あるきはじめ の 足もと(x, y) */
  readonly from: Point
  /** とまる 足もと(x, y) */
  readonly to: Point
  readonly start: number
  readonly end: number
  readonly build?: Build
  /** はじめ の 背の高さ(省くと 体格ごとの 高さ) */
  readonly height?: number
  /** おわり の 背の高さ(おくへ 行くほど 小さく。省くと height と 同じ) */
  readonly toHeight?: number
  /** 歩数(省くと 道の長さ と 歩幅 から きめる) */
  readonly steps?: number
  /** うでを ふる 大きさ(度)。省くと 24 */
  readonly armSwing?: number
  /** 足を あげる 高さ(背の高さ 100 の 単位)。省くと 7 */
  readonly footLift?: number
}

export type DepthWalkResult = {
  readonly x: number
  readonly y: number
  readonly height: number
  readonly build: Build
  readonly facing: 'front' | 'back'
  readonly pose: PersonPose
  /** 地面に ついている 足(Person に わたす) */
  readonly stance?: BodySide
  readonly moving: boolean
  readonly progress: number
}

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** うで: 角度で たらした まま、まえうしろ に ふる(正面・うしろむき の うで) */
function swingArm(n: number, armSwing: number): LimbAngles {
  return { swing: 4, bend: 6, fore: -armSwing * n, foreBend: 12 + 12 * clamp01(-n) }
}

export function walkDepth(t: number, plan: DepthWalkPlan): DepthWalkResult {
  const build = plan.build ?? 'child'
  const h0 = plan.height ?? DEFAULT_HEIGHT[build]
  const h1 = plan.toHeight ?? h0
  const facing = plan.to[1] <= plan.from[1] ? 'back' : 'front'
  const progress = span(t, plan.start, plan.end)
  const moving = progress > 0 && progress < 1 && plan.to[1] !== plan.from[1]
  if (!moving) {
    const done = progress >= 1
    return { x: done ? plan.to[0] : plan.from[0], y: done ? plan.to[1] : plan.from[1], height: done ? h1 : h0, build, facing, pose: {}, moving: false, progress }
  }
  // おくゆき の きょり(はじめ の 大きさ の 画面の 単位)。画面の 上下 の きょり を 見下ろし の 角度 で もどす
  const depth = Math.abs(plan.to[1] - plan.from[1]) / DEPTH_TILT
  const stride = ((h0 + h1) / 2) * 0.3
  const steps = Math.max(2, plan.steps ?? Math.round(depth / stride) + 1)
  const gait = gaitAt(t, { from: 0, to: depth, start: plan.start, end: plan.end, height: h0, step: depth / (steps - 1), footLift: plan.footLift ?? 7 })
  const u = gait.pelvis / depth
  const height = lerp(h0, h1, u)
  const scale = height / 100
  const body = BUILDS[build]
  const legs: Point = [body.thigh, body.shin]
  const long = (body.thigh + body.shin) * 0.985
  // 先に ふみだす のは 右足(正面 でも うしろ でも 同じ)
  const lead: BodySide = 'right'
  const footOf = (side: BodySide) => (side === lead ? gait.feet.lead : gait.feet.trail)
  const planted: BodySide = gait.planted === 'lead' ? lead : 'left'
  const rel = (at: number) => (at - gait.pelvis) / scale
  const reachX = clamp(rel(footOf(planted).at), -long * 0.9, long * 0.9)
  const down = Math.sqrt(long * long - reachX * reachX)
  // あし: 横から 見た ときと 同じ 角度 を、まえうしろ の 角度 として つける(左右 には ひらかない)
  const legPose = (side: BodySide): LimbAngles => {
    const foot = footOf(side)
    const sagittal = reach([0, 0], [rel(foot.at), down - foot.lift], legs, 'leg', 'side')
    return { swing: 0, bend: 0, fore: sagittal.swing, foreBend: sagittal.bend }
  }
  const half = (gait.stepLength / scale) * 0.5 || 1
  const armSwing = plan.armSwing ?? 24
  const armPose = (side: BodySide) => swingArm(clamp(rel(footOf(side).at) / half, -1, 1), armSwing)
  const pose: PersonPose = {
    leftLeg: legPose('left'),
    rightLeg: legPose('right'),
    leftArm: armPose('left'),
    rightArm: armPose('right'),
  }
  // 地面の 足 の くつ底 は、その 足の おくゆき の 地面 に ある(1歩の 間 うごかない)
  const footU = footOf(planted).at / depth
  return {
    x: lerp(plan.from[0], plan.to[0], u),
    y: lerp(plan.from[1], plan.to[1], footU),
    height,
    build,
    facing,
    pose,
    stance: planted,
    moving: true,
    progress,
  }
}
