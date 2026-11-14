import { clamp01, span } from '../sceneKit'
import { BUILDS, DEFAULT_HEIGHT, DEPTH_TILT, HANG_ARM, mixLimb, personRig, reach, type BodySide, type Build, type LimbAngles, type PersonPose, type Point } from './body'
import { runGait, type RunFoot } from './run'

/**
 * おく へ はしって とおざかる(うしろすがた)・おく から てまえ へ はしってくる(正面)。
 * <Person {...runDepth(t, plan)} /> と わたす(y・背の高さ・向き・ポーズ・うく 高さ・地面の 足 が 入っている)。
 *
 * 横の run と 同じ 足あと(runGait)を、おくゆき の 線 の 上に ならべる:
 *   - 地面に ついた 足 の くつ底 は、その 足あと の 画面の 点 に ある(stance で Person に つたえる。すべらない)。
 *   - 2本 とも うく しゅんかん は、こし の 下の 地面 から run と 同じ 高さ に こし を うかせる(lift)。
 *   - あし は 横から 見た run と 同じ 角度 を、まえうしろ の 角度(fore)として つける。
 *     正面 で まえへ 出した ひざ は 見る人 の ほう(どう の てまえ)に 来る。
 *   - うで は ひじ を 90度 ほど まげて、同じ がわ の 足 と はんたい に まえうしろ へ ふる。
 *     まえ へ ふった 手 は むね の まえ まで 上がり、少し 体の まんなか へ よる(正面 から 見た はしる 人 の 形)。
 * 画面の 上下 1 は、おくゆき 1 / DEPTH_TILT に あたる(walkDepth と 同じ)。横に 大きく ずれる 道 には 使わない。
 */
export type DepthRunPlan = {
  readonly from: Point
  readonly to: Point
  readonly start: number
  readonly end: number
  readonly build?: Build
  /** はじめ の 背の高さ(省くと 体格ごとの 高さ) */
  readonly height?: number
  /** おわり の 背の高さ(おくへ 行くほど 小さく。省くと height と 同じ) */
  readonly toHeight?: number
  /** 1歩 の だいたいの はば(はじめ の 大きさ の 画面の 単位)。省くと 背の高さ × 0.62 */
  readonly stride?: number
  /** けりあげる 高さ(背の高さ 100 の 単位)。省くと 16 */
  readonly footLift?: number
  /** うでを ふる 大きさ(度)。省くと 40 */
  readonly armSwing?: number
}

export type DepthRunResult = {
  readonly x: number
  readonly y: number
  readonly height: number
  readonly build: Build
  readonly facing: 'front' | 'back'
  readonly pose: PersonPose
  readonly stance?: BodySide
  readonly lift: number
  readonly moving: boolean
  readonly progress: number
}

const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** はしる うで(正面・うしろむき)。n = 1 で うしろ へ、-1 で まえ へ ふりきった ところ */
function runArm(n: number, armSwing: number): LimbAngles {
  const forward = clamp01(-n)
  return { swing: 10, bend: -8 - 14 * forward, fore: -armSwing * n, foreBend: 78 + 18 * forward }
}

export function runDepth(t: number, plan: DepthRunPlan): DepthRunResult {
  const build = plan.build ?? 'child'
  const h0 = plan.height ?? DEFAULT_HEIGHT[build]
  const h1 = plan.toHeight ?? h0
  const facing = plan.to[1] <= plan.from[1] ? 'back' : 'front'
  const progress = span(t, plan.start, plan.end)
  const moving = progress > 0 && progress < 1 && plan.to[1] !== plan.from[1]
  if (!moving) {
    const done = progress >= 1
    return { x: done ? plan.to[0] : plan.from[0], y: done ? plan.to[1] : plan.from[1], height: done ? h1 : h0, build, facing, pose: {}, lift: 0, moving: false, progress }
  }
  const depth = Math.abs(plan.to[1] - plan.from[1]) / DEPTH_TILT
  const gait = runGait(t, { from: 0, to: depth, start: plan.start, end: plan.end, build, height: h0, stride: plan.stride ?? ((h0 + h1) / 2) * 0.62, footLift: plan.footLift })
  const u = gait.pelvis / depth
  const height = lerp(h0, h1, u)
  const scale = height / 100
  const body = BUILDS[build]
  const rel = (at: number) => (at - gait.pelvis) / scale
  const ankle = gait.hip - body.footH
  // 先に ふみだす のは 右足(walkDepth と 同じ)
  const footOf = (side: BodySide): RunFoot => (side === 'right' ? gait.feet.lead : gait.feet.trail)
  const legPose = (side: BodySide): LimbAngles => {
    const foot = footOf(side)
    const sagittal = reach([0, 0], [rel(foot.at), ankle - foot.lift], [body.thigh, body.shin], 'leg', 'side')
    return { swing: 0, bend: 0, fore: sagittal.swing, foreBend: sagittal.bend }
  }
  // はしりだし・とまりぎわ は、うで を たらした かっこう から だんだん
  const settle = clamp01(Math.min(gait.pelvis, depth - gait.pelvis) / (gait.stride * 0.6))
  const half = (gait.stride / scale) * 0.5
  const armSwing = plan.armSwing ?? 40
  const armPose = (side: BodySide) => mixLimb(HANG_ARM, runArm(clamp(rel(footOf(side).at) / half, -1, 1), armSwing), settle)
  const pose: PersonPose = { leftLeg: legPose('left'), rightLeg: legPose('right'), leftArm: armPose('left'), rightArm: armPose('right') }
  const x = lerp(plan.from[0], plan.to[0], u)
  const groundAt = (at: number) => lerp(plan.from[1], plan.to[1], at / depth)
  const base = { x, height, build, facing, pose, moving: true, progress } as const
  // 地面に ついた 足 が あれば、その 足あと に くつ底 を おく(すべらない)。
  // とおく へ 行く と 体 が 小さく なり、こし から 足 まで の 左右 の はば も ちぢむ ので、その ぶん こし を ずらして 足 を とめる
  const planted = (['right', 'left'] as const).find((side) => footOf(side).planted)
  if (planted) {
    const foot = footOf(planted)
    const screenSide = (planted === 'right' ? -1 : 1) * (facing === 'front' ? 1 : -1)
    const printScale = lerp(h0, h1, foot.at / depth) / 100
    return { ...base, x: x + screenSide * body.hipHalf * (printScale - scale), y: groundAt(foot.at), stance: planted, lift: 0 }
  }
  // とんでいる: こし の 下の 地面 から gait.hip の 高さ に こし が 来る よう に うかせる
  const y = groundAt(gait.pelvis)
  const rest = personRig({ ...base, y, stance: 'right' })
  const lift = Math.max(0, rest.world.pelvis[1] - (y - gait.hip * scale))
  return { ...base, y, stance: 'right', lift }
}
