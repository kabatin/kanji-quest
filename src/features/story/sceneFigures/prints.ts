import { BUILDS, DEFAULT_HEIGHT, nearSide, type BodySide } from './body'
import { rampProgress, runGait, type RunPlan } from './run'
import { gaitAt, type WalkPlan } from './walk'

/**
 * 足あと の 場所 と 時刻。walk・run の 足あと(足 が 地面に つく ところ)を そのまま 出す ので、
 * <Footprint> を ここ に 置けば、絵の 足 と ぴったり かさなる(砂はま・雪 の 上 を あるく など)。
 *   walkPrints(plan).map((p) => <Footprint key={p.at} x={p.x} y={地面} grow={span(t, p.at, p.at + 0.25)} facing={p.facing} />)
 * x は くつ の まんなか(くるぶし より 少し まえ)。at は 足 が つく 時刻(秒)。
 */
export type FootPrint = { readonly x: number; readonly at: number; readonly side: BodySide; readonly facing: 'left' | 'right' }

/** 横に あるく(walk)足あと。1歩目 から さいご の そろえた 足 まで */
export function walkPrints(plan: WalkPlan): readonly FootPrint[] {
  const build = plan.build ?? 'child'
  const scale = (plan.height ?? DEFAULT_HEIGHT[build]) / 100
  const sign = plan.to >= plan.from ? 1 : -1
  const facing: 'left' | 'right' = sign > 0 ? 'right' : 'left'
  const near = nearSide(facing) as BodySide
  const far: BodySide = near === 'left' ? 'right' : 'left'
  const { steps, stepLength } = gaitAt(plan.start, plan)
  const dt = (plan.end - plan.start) / steps
  const shoe = BUILDS[build].footL * 0.3 * scale
  // k 歩目 に うごく 足 は、(k + 1) 歩ぶん の 所 に つく(さいご は となり に そろえる)
  return Array.from({ length: steps }, (_, k) => ({
    x: plan.from + sign * (Math.min(k + 1, steps - 1) * stepLength + shoe),
    at: plan.start + (k + 1) * dt,
    side: k % 2 === 0 ? near : far,
    facing,
  }))
}

/** 進みぐあい(rampProgress)が p に なる u(0〜1)。ふえていく だけ なので 2分法 で さがす */
function inverseRamp(p: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2
    if (rampProgress(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 横に はしる(run)足あと。足 が つく 時刻 は、こし が 足あと の 少し てまえ に 来た とき */
export function runPrints(plan: RunPlan): readonly FootPrint[] {
  const build = plan.build ?? 'child'
  const scale = (plan.height ?? DEFAULT_HEIGHT[build]) / 100
  const sign = plan.to >= plan.from ? 1 : -1
  const facing: 'left' | 'right' = sign > 0 ? 'right' : 'left'
  const near = nearSide(facing) as BodySide
  const far: BodySide = near === 'left' ? 'right' : 'left'
  const distance = Math.abs(plan.to - plan.from)
  const { steps, stride } = runGait(plan.start, plan)
  const shoe = BUILDS[build].footL * 0.3 * scale
  const timeAt = (pelvis: number) => plan.start + inverseRamp(Math.min(1, Math.max(0, pelvis / distance))) * (plan.end - plan.start)
  // 1歩目(lead)・2歩目(trail)… と かわりばんこ。さいご は のこった 足 を となり に そろえる
  const prints = Array.from({ length: steps }, (_, i) => {
    const k = i + 1
    return { x: plan.from + sign * (k * stride + shoe), at: timeAt(k * stride - stride * 0.18), side: k % 2 === 1 ? near : far, facing }
  })
  const lastSide = steps % 2 === 1 ? near : far
  const join = { x: plan.from + sign * (steps * stride + shoe), at: plan.end, side: lastSide === near ? far : near, facing }
  return [...prints, join]
}
