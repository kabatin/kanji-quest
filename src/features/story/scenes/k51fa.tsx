/*
 * 出(でる): あなに おちた子が はしごで のぼって、あしを そとへ ふみ出す。
 *
 * ほね(画と絵の対応)
 *   2・3画目(ㄩ上)  … あなの ふち に近い 左右の かべ(左の かべ と 右の かべ)
 *   4・5画目(ㄩ下)  … あなの 下のほうの 左右の かべ と、そこ(ゆか)
 *   1画目(丨)       … あなの まんなかを 通る たて線(ここは 子が はしごを のぼっていく あたり)
 *   字と 絵は だいたい 同じ場所に そろえた(ぴったりは 重ねない。体を ゆがめないほうを えらんだ)
 *
 * ながれ
 *   ちょうちょ を 見あげて あるく子 → あなに きづかず あしを ふみ出して おちる(わー!)
 *   → どすん。くらい あなの そこで しくしく
 *   → 上を見る。ひかりと はしご を 見つけて「あっ!」
 *   → はしごを 1だん ずつ のぼる → あなの ふちに とどいて、あしを そとへ ふみ出す
 *   → そとへ でて、りょうてを あげて ばんざい → ほね が ひかって、絵が うすくなり 字「出」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがり、あし は こし から出て ひざ で まがる。
 *   手と足は、はしごの 1だん ずつに のせる。ひじ・ひざ は 手足の 場所から 計算して つなぐ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '出'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const DIRT = '#b98a5e'
const DIRT_DARK = '#9d7149'
const DIRT_LIGHT = '#cfa476'
const PIT = '#6c4f3b'
const PIT_FLOOR = '#7f5f46'
const WOOD = '#d79a55'
const WOOD_DARK = '#a8703a'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#4a3022'
const TUNIC = '#ef6f5e'
const TUNIC_DARK = '#d4574a'
const TUNIC_FAR = '#bf4a3f'
const PANTS = '#4c6fa8'
const PANTS_DARK = '#3f5d92'
const SHOE = '#f4efe6'
const MOUTH = '#b9483f'
const TEAR = '#7cc4f2'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const WALK = 0.4
const FALL = 1.45
const LAND = 2.0
const NOTICE = 2.9
const TO_LADDER = 3.4
const CLIMB = 4.2
const STEP = 6.6
const CHEER = 7.3
const INK = 8.0
const DONE = 10.5
const DURATION = 11.1

/** 地面の たかさ(おもて)と、あなの かべ・そこ */
const SURFACE = 40
const PIT_LEFT = 28
const PIT_RIGHT = 85
const FLOOR = 90.3

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1)

/* ───────── 子どもの からだ(2つの ほね を つなぐ) ───────── */

/** 体の大きさ(ぜんぶ ここから) */
const THIGH = 6.2
const ARM_PART = 5.5
const TORSO = 9.2
const HEAD_R = 6.2
/** まっすぐ立ったときの、こし から 足の うらまで */
const STAND = 11.3

/**
 * 2つの ほね(ふとももと すね、にのうでと うでさき)を、root から target へ つなぐ。
 * 遠すぎるときは のばせるところまで。side で ひざ・ひじ の まがる向きを決める。
 */
function solveLimb(root: Pt, target: Pt, a: number, b: number, side: 1 | -1): { readonly joint: Pt; readonly end: Pt } {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const full = Math.hypot(dx, dy)
  const d = Math.min(Math.max(full, Math.abs(a - b) + 0.05), a + b - 0.02)
  const ux = full > 0 ? dx / full : 0
  const uy = full > 0 ? dy / full : 1
  const along = (d * d + a * a - b * b) / (2 * d)
  const out = Math.sqrt(Math.max(a * a - along * along, 0))
  return {
    joint: [root[0] + ux * along - uy * out * side, root[1] + uy * along + ux * out * side],
    end: [root[0] + ux * d, root[1] + uy * d],
  }
}

type Mood = 'happy' | 'scared' | 'ouch' | 'worry' | 'surprise' | 'determined'

type Pose = {
  readonly hip: Pt
  /** 上半身の かたむき(まえへ 何度か) */
  readonly lean: number
  readonly nearFoot: Pt
  readonly farFoot: Pt
  readonly nearHand: Pt
  readonly farHand: Pt
  /** あたま の かたむき(マイナスで 上をむく) */
  readonly tilt: number
  readonly mood: Mood
}

const rotate = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)]
}
const shoulderOf = (hip: Pt, lean: number): Pt => {
  const o = rotate([0, -TORSO + 0.8], lean)
  return [hip[0] + o[0], hip[1] + o[1]]
}

function Limb({ root, target, a, b, side, color, width }: { readonly root: Pt; readonly target: Pt; readonly a: number; readonly b: number; readonly side: 1 | -1; readonly color: string; readonly width: number }) {
  const { joint, end } = solveLimb(root, target, a, b, side)
  return <path d={`M${root[0]} ${root[1]} L${joint[0]} ${joint[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

function footEnd(root: Pt, target: Pt): Pt {
  return solveLimb(root, target, THIGH, THIGH, -1).end
}
function handEnd(root: Pt, target: Pt): Pt {
  return solveLimb(root, target, ARM_PART, ARM_PART, 1).end
}

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  // かおは 右むき。目は 右よりに ならぶ
  const eyes: readonly Pt[] = [[1.8, 0.4], [4.8, 0.4]]
  const cheek = <circle cx="2" cy="3.4" r="1.3" fill="#ff9d9d" opacity="0.55" />
  if (mood === 'happy') {
    return (
      <>
        {eyes.map(([x, y]) => (
          <path key={x} d={`M${x - 1} ${y + 0.5} Q${x} ${y - 1.2} ${x + 1} ${y + 0.5}`} fill="none" stroke={EYE} strokeWidth="0.95" strokeLinecap="round" />
        ))}
        <path d="M2.8 2.8 Q3.9 5.6 5.2 2.8 Z" fill={MOUTH} />
        {cheek}
      </>
    )
  }
  if (mood === 'scared') {
    return (
      <>
        {eyes.map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.2" fill={EYE} />
        ))}
        <path d="M0.6 -1.9 L2.8 -2.5 M4 -2.5 L5.8 -1.8" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
        <ellipse cx="3.9" cy="3.8" rx="1.1" ry="1.7" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'ouch') {
    return (
      <>
        <path d="M0.9 -0.4 L2.7 0.5 L0.9 1.4 M5.8 -0.4 L4 0.5 L5.8 1.4" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.6 3.8 Q3.6 2.8 4.6 3.8 Q5.2 4.4 5.6 3.6" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'worry') {
    const drop = (offset: number) => {
      const p = ((t * 0.9 + offset) % 1)
      return <path key={offset} d="M0 -1.3 Q1 0.4 0 1.1 Q-1 0.4 0 -1.3 Z" fill={TEAR} opacity={1 - p} transform={`translate(${4.9 + offset * 0.6} ${1.6 + p * 5})`} />
    }
    return (
      <>
        {eyes.map(([x, y]) => (
          <circle key={x} cx={x} cy={y + 0.2} r="1.05" fill={EYE} />
        ))}
        <path d="M0.8 -1.2 L2.8 -2.4 M4 -2.4 L6 -1.3" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
        <path d="M2.8 4.6 Q3.9 3.2 5 4.6" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        {drop(0)}
        {drop(0.5)}
      </>
    )
  }
  if (mood === 'surprise') {
    return (
      <>
        {eyes.map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="1.7" fill="#ffffff" />
            <circle cx={x + 0.3} cy={y} r="0.85" fill={EYE} />
          </g>
        ))}
        <ellipse cx="3.9" cy="3.9" rx="0.9" ry="1.2" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      {eyes.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1" fill={EYE} />
      ))}
      <path d="M0.8 -1.5 L2.8 -1.1 M4.2 -1.1 L6.2 -1.5" stroke={HAIR} strokeWidth="0.85" strokeLinecap="round" />
      <path d="M2.8 3.2 Q3.9 4.4 5.1 3.2" fill="none" stroke={MOUTH} strokeWidth="1.05" strokeLinecap="round" />
      {cheek}
    </>
  )
}

function Child({ pose, t }: { readonly pose: Pose; readonly t: number }) {
  const { hip, lean, tilt, mood } = pose
  const shoulder = shoulderOf(hip, lean)
  const neckOffset = rotate([0, -TORSO - 0.6], lean)
  const neck: Pt = [hip[0] + neckOffset[0], hip[1] + neckOffset[1]]
  const headOffset = rotate([0.3, -TORSO - 0.6 - HEAD_R + 1.1], lean)
  const head: Pt = [hip[0] + headOffset[0], hip[1] + headOffset[1]]
  const shoe = (foot: Pt, color: string) => <ellipse cx={foot[0] + 1.1} cy={foot[1] + 0.2} rx="3" ry="1.6" fill={color} />
  const nearFoot = footEnd(hip, pose.nearFoot)
  const farFoot = footEnd(hip, pose.farFoot)
  return (
    <>
      <Limb root={shoulder} target={pose.farHand} a={ARM_PART} b={ARM_PART} side={1} color={TUNIC_FAR} width={3} />
      <circle cx={handEnd(shoulder, pose.farHand)[0]} cy={handEnd(shoulder, pose.farHand)[1]} r="1.7" fill={SKIN_SHADE} />
      <Limb root={hip} target={pose.farFoot} a={THIGH} b={THIGH} side={-1} color={PANTS_DARK} width={3.8} />
      {shoe(farFoot, '#d8d1c4')}
      <Layer rotate={lean} origin={hip}>
        <rect x={hip[0] - 4.1} y={hip[1] - TORSO - 0.4} width="8.2" height={TORSO + 2.4} rx="3.6" fill={TUNIC} />
        <path d={`M${hip[0] - 3} ${hip[1] - 0.6} h6`} stroke={TUNIC_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Limb root={hip} target={pose.nearFoot} a={THIGH} b={THIGH} side={-1} color={PANTS} width={3.9} />
      {shoe(nearFoot, SHOE)}
      <rect x={neck[0] - 1.6} y={neck[1] - 1.4} width="3.2" height="2.8" rx="1.2" fill={SKIN_SHADE} />
      <Limb root={shoulder} target={pose.nearHand} a={ARM_PART} b={ARM_PART} side={1} color={TUNIC_DARK} width={3.1} />
      <circle cx={handEnd(shoulder, pose.nearHand)[0]} cy={handEnd(shoulder, pose.nearHand)[1]} r="1.8" fill={SKIN} />
      <Layer rotate={tilt} origin={neck}>
        <g transform={`translate(${head[0]} ${head[1]})`}>
          <circle cx="-0.5" cy="-0.5" r={HEAD_R + 0.4} fill={HAIR} />
          <circle cx="1" cy="0.9" r={HEAD_R - 0.6} fill={SKIN} />
          <path d="M-0.5 -6.4 Q1.4 -9.6 3.4 -6.7" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
          <Face mood={mood} t={t} />
        </g>
      </Layer>
    </>
  )
}

/* ───────── からだの うごき(とき に合わせた かっこう) ───────── */

const hangHands = (hip: Pt, lean: number, sway: number): { readonly near: Pt; readonly far: Pt } => {
  const s = shoulderOf(hip, lean)
  return { near: [s[0] + sway, s[1] + 9.2], far: [s[0] - 1 - sway, s[1] + 9.2] }
}

/** 地面を あるく(あしを ふる)。amp が 0 なら ただ立つ。 */
function walkPose(x: number, ground: number, phase: number, amp: number, tilt: number, mood: Mood): Pose {
  const hip: Pt = [x, ground - STAND - Math.abs(Math.cos(phase)) * 0.5 * amp]
  const foot = (p: number): Pt => [x + 0.8 + Math.sin(p) * 5 * amp, ground - Math.max(0, Math.cos(p)) * 2.2 * amp]
  const lean = 3
  const s = shoulderOf(hip, lean)
  return {
    hip,
    lean,
    nearFoot: foot(phase),
    farFoot: foot(phase + Math.PI),
    nearHand: [s[0] + Math.sin(phase + Math.PI) * 4 * amp, s[1] + 9.2],
    farHand: [s[0] - 1 + Math.sin(phase) * 4 * amp, s[1] + 9.2],
    tilt,
    mood,
  }
}

/** おちている ときの かっこう: りょうてを ばたばた、あしも ばたばた */
function fallPose(hip: Pt, t: number): Pose {
  const flap = wave(t, 0.18)
  const s = shoulderOf(hip, -6)
  return {
    hip,
    lean: -6,
    nearFoot: [hip[0] + 3 + flap * 1.5, hip[1] + 9.5],
    farFoot: [hip[0] - 2 - flap * 1.5, hip[1] + 10.2],
    nearHand: [s[0] + 3.4, s[1] - 8.4 + flap],
    farHand: [s[0] - 3.2, s[1] - 8.4 - flap],
    tilt: -8,
    mood: 'scared',
  }
}

/* はしご: すこし かたむけて、右の かべに もたせかける */
const LADDER_BOTTOM: Pt = [66, FLOOR]
const LADDER_TOP: Pt = [83, 36]
const ladderX = (y: number) => LADDER_BOTTOM[0] + ((LADDER_BOTTOM[1] - y) / (LADDER_BOTTOM[1] - LADDER_TOP[1])) * (LADDER_TOP[0] - LADDER_BOTTOM[0])
/** 1だん の たかさ(だん 0 の 1つ下が ゆか) */
const RUNG_GAP = 6
const rungY = (r: number) => FLOOR - RUNG_GAP * (r + 1)

/** 手足が 1だん ずつ のぼる(2だん ぶん うごいて、もう片方を おいこす)。off で かわりばんこに。 */
function limbRung(q: number, off: number): number {
  const u = q - off
  const m = Math.floor(u / 2)
  return 2 * m + 2 * easeInOut(clamp01(u - 2 * m))
}
const limbLift = (q: number, off: number): number => {
  const u = q - off
  const f = u - 2 * Math.floor(u / 2)
  return f > 0 && f < 1 ? Math.sin(f * Math.PI) * 1.8 : 0
}
const Q_END = 7

/** はしごの上の 手足の ばしょ(rung は だんの番号。ゆか = -1) */
const footOn = (rung: number, far: boolean, lift: number): Pt => {
  const y = rungY(Math.max(rung, -1))
  return [ladderX(y) - 0.4 + (far ? 1.4 : 0), y - lift]
}
const handOn = (rung: number, far: boolean, lift: number): Pt => {
  const y = rungY(Math.min(rung, 8)) - 0.5
  return [ladderX(y) + 0.4 + (far ? 1.2 : 0), y - lift]
}

function climbPose(q: number): Pose {
  const nearRung = Math.max(limbRung(q, 0) - 1, -1)
  const farRung = Math.max(limbRung(q, 1), -1)
  const footNear = footOn(nearRung, false, limbLift(q, 0))
  const footFar = footOn(farRung, true, limbLift(q, 1))
  const gap = Math.abs(footNear[1] - footFar[1])
  const meanY = (footNear[1] + footFar[1]) / 2
  const hipY = meanY - STAND + 3.3 * clamp01(gap / RUNG_GAP)
  const hipX = ladderX(hipY) - 6.2
  const hip: Pt = [hipX, hipY]
  const lean = 7
  return {
    hip,
    lean,
    nearFoot: footNear,
    farFoot: footFar,
    nearHand: handOn(limbRung(q, 1) + 3.2, false, limbLift(q, 1)),
    farHand: handOn(limbRung(q, 0) + 2.2, true, limbLift(q, 0)),
    tilt: -14,
    mood: 'determined',
  }
}

/* そとへ ふみ出して、ばんざい */
const OUT_X = 92
const OUT_HIP: Pt = [OUT_X, SURFACE - STAND]
const OUT_NEAR: Pt = [OUT_X + 2.6, SURFACE]
const OUT_FAR: Pt = [OUT_X - 2.2, SURFACE]

function cheerHands(hip: Pt, lean: number, t: number): { readonly near: Pt; readonly far: Pt } {
  const s = shoulderOf(hip, lean)
  const w = wave(t, 0.4)
  return { near: [s[0] + 8.8, s[1] - 6.4 + w * 0.8], far: [s[0] - 8.8, s[1] - 6.4 - w * 0.8] }
}

function stepPose(s: number, t: number): Pose {
  const from = climbPose(Q_END)
  const hipK = easeInOut(span(s, 0.05, 0.95))
  const hip = lerpPt(from.hip, OUT_HIP, hipK)
  const lean = mix(s, 0, 1, from.lean, -3, easeInOut)
  const nearK = span(s, 0, 0.5, easeInOut)
  const farK = span(s, 0.42, 0.92, easeInOut)
  const lift = (a: number, b: number) => Math.sin(span(s, a, b) * Math.PI) * 4
  const nearFoot = lerpPt(from.nearFoot, OUT_NEAR, nearK)
  const farFoot = lerpPt(from.farFoot, OUT_FAR, farK)
  const up = cheerHands(hip, lean, t)
  const release = span(s, 0.5, 1, easeInOut)
  return {
    hip,
    lean,
    nearFoot: [nearFoot[0], nearFoot[1] - lift(0, 0.5)],
    farFoot: [farFoot[0], farFoot[1] - lift(0.42, 0.92)],
    nearHand: lerpPt(from.nearHand, up.near, release),
    farHand: lerpPt(from.farHand, up.far, release),
    tilt: mix(s, 0, 1, -14, -4),
    mood: s > 0.45 ? 'happy' : 'determined',
  }
}

function cheerPose(t: number): Pose {
  const hop = Math.max(0, Math.sin(((t - CHEER) / 0.55) * Math.PI * 2)) * 2.6
  const hip: Pt = [OUT_X, OUT_HIP[1] - hop]
  const lean = -3
  const up = cheerHands(hip, lean, t)
  return {
    hip,
    lean,
    nearFoot: [OUT_NEAR[0], OUT_NEAR[1] - hop * 0.9],
    farFoot: [OUT_FAR[0], OUT_FAR[1] - hop * 0.9],
    nearHand: up.near,
    farHand: up.far,
    tilt: -4,
    mood: 'happy',
  }
}

/** いまの 子の かっこう(とき ごと) */
function posture(t: number): Pose {
  const walkPhase = (t - WALK) * Math.PI * 4
  if (t < FALL) {
    return walkPose(mix(t, WALK, FALL, -9, 24, (x) => x), SURFACE, walkPhase, 1, -16 + wave(t, 1.1) * 3, 'happy')
  }
  if (t < LAND) {
    // あなの上へ ふみ出して、おちる。よこへ すこし とんで、はしの かべに ぶつからない
    const f = span(t, FALL, LAND)
    const hip: Pt = [24 + 17 * easeOut(f), SURFACE - STAND + (FLOOR - STAND - (SURFACE - STAND)) * easeIn(f)]
    return fallPose(hip, t)
  }
  if (t < NOTICE) {
    // どすん。あしを まげて うけとめ、いたそうな顔 → しくしく
    const dip = Math.sin(span(t, LAND, LAND + 0.35) * Math.PI) * 3
    const base = walkPose(41, FLOOR, 0, 0, 0, 'worry')
    const sway = wave(t, 2.2) * 0.4
    const hang = hangHands([41, FLOOR - STAND + dip], 4, sway)
    return {
      ...base,
      hip: [41, FLOOR - STAND + dip],
      lean: 4,
      nearFoot: [41.8, FLOOR],
      farFoot: [41.8, FLOOR],
      nearHand: hang.near,
      farHand: hang.far,
      tilt: mix(t, LAND, LAND + 0.5, -4, 15),
      mood: t < LAND + 0.45 ? 'ouch' : 'worry',
    }
  }
  if (t < TO_LADDER) {
    // 上を見る。ひかりと はしご に きづく
    const hip: Pt = [41, FLOOR - STAND]
    const hang = hangHands(hip, 2, 0)
    return { hip, lean: 2, nearFoot: [41.8, FLOOR], farFoot: [41.8, FLOOR], nearHand: hang.near, farHand: hang.far, tilt: mix(t, NOTICE, NOTICE + 0.3, 15, -24, backOut), mood: 'surprise' }
  }
  if (t < CLIMB) {
    const x = mix(t, TO_LADDER, CLIMB, 41, climbPose(-1).hip[0], easeInOut)
    return walkPose(x, FLOOR, (t - TO_LADDER) * Math.PI * 4, 1, -8, 'determined')
  }
  if (t < STEP) return climbPose(mix(t, CLIMB, STEP, -1, Q_END, (x) => x))
  if (t < CHEER) return stepPose(span(t, STEP, CHEER), t)
  return cheerPose(t)
}

/* ───────── けしき ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.5, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[72, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="71.2" y="1.4" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 72 12)`} />
        ))}
      </Layer>
      <circle cx="72" cy="12" r={5.6 * sun} fill={SUN} />
      <path d="M-4 40 Q20 24 46 36 Q74 22 113 38 V42 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.92" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="8" cy="20" rx="7" ry="3.2" />
        <ellipse cx="13" cy="18.2" rx="5" ry="3.2" />
      </g>
    </>
  )
}

/** あなと じめん(よこから 見た だんめん) */
function Ground({ t }: SceneProps) {
  const open = span(t, 0.05, 0.6, easeOut)
  const pitPath = `M${PIT_LEFT} ${SURFACE} L${PIT_LEFT} 86 Q${PIT_LEFT} ${FLOOR + 1.2} ${PIT_LEFT + 5} ${FLOOR + 1.2} L${PIT_RIGHT - 5} ${FLOOR + 1.2} Q${PIT_RIGHT} ${FLOOR + 1.2} ${PIT_RIGHT} 86 L${PIT_RIGHT} ${SURFACE} Z`
  // ひかりが あなの なかへ さしこむ(上を見たとき すこし つよく)
  const beam = 0.13 + 0.12 * during(t, NOTICE - 0.1, TO_LADDER + 0.5, 0.3)
  return (
    <>
      <rect x="-2" y={SURFACE} width="113" height={101 - SURFACE} fill={DIRT} />
      {[[8, 56], [16, 72], [6, 86], [98, 58], [102, 74], [94, 88], [20, 94]].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.2" ry="1.4" fill={DIRT_DARK} />
      ))}
      <ellipse cx="104" cy="66" rx="1.6" ry="1" fill={DIRT_LIGHT} />
      <ellipse cx="12" cy="64" rx="1.6" ry="1" fill={DIRT_LIGHT} />
      <g opacity={open}>
        <path d={pitPath} fill={PIT} />
        <path d={`M${PIT_LEFT + 4} ${FLOOR - 0.6} L${PIT_RIGHT - 4} ${FLOOR - 0.6}`} stroke={PIT_FLOOR} strokeWidth="2.4" strokeLinecap="round" />
        <path d={`M50 ${SURFACE} L${PIT_RIGHT} ${SURFACE} L${PIT_RIGHT} 70 L62 ${FLOOR} L40 ${FLOOR} Z`} fill="#ffe9a8" opacity={beam} />
        <path d={`M${PIT_LEFT} ${SURFACE} L${PIT_LEFT} 86`} stroke={DIRT_DARK} strokeWidth="1.2" />
      </g>
      {/* おもての くさ(あなの ふち は まるく) */}
      <path d={`M-2 ${SURFACE - 0.4} H${PIT_LEFT + 0.6} Q${PIT_LEFT + 1.6} ${SURFACE + 0.6} ${PIT_LEFT - 0.6} ${SURFACE + 4.2} H-2 Z`} fill={GRASS} />
      <path d={`M${PIT_RIGHT - 0.6} ${SURFACE - 0.4} H111 V${SURFACE + 4.2} H${PIT_RIGHT + 0.6} Q${PIT_RIGHT - 1.6} ${SURFACE + 0.6} ${PIT_RIGHT - 0.6} ${SURFACE - 0.4} Z`} fill={GRASS} />
      {[4, 14, 21, 92, 100, 106].map((x) => (
        <path key={x} d={`M${x} ${SURFACE + 0.4} l1.1 -3 l0.9 2.6 l1.4 -3.4 l0.7 3.8 Z`} fill={LEAF} />
      ))}
      <path d={`M-2 ${SURFACE + 3.2} H${PIT_LEFT} V${SURFACE + 4.4} H-2 Z M${PIT_RIGHT} ${SURFACE + 3.2} H111 V${SURFACE + 4.4} H${PIT_RIGHT} Z`} fill={LEAF_DARK} opacity="0.5" />
    </>
  )
}

function Ladder({ t }: SceneProps) {
  const show = span(t, 0.5, 1.0, backOut)
  const depth: Pt = [2.4, -1.2]
  const rungs = Array.from({ length: 9 }, (_, i) => i - 1)
  return (
    <Layer opacity={clamp01(show)}>
      <path d={`M${LADDER_BOTTOM[0] + depth[0]} ${LADDER_BOTTOM[1] + depth[1]} L${LADDER_TOP[0] + depth[0]} ${LADDER_TOP[1] + depth[1]}`} stroke={WOOD_DARK} strokeWidth="1.8" strokeLinecap="round" />
      {rungs.map((r) => {
        const y = rungY(r) + 1.4
        return <path key={r} d={`M${ladderX(y)} ${y} L${ladderX(y) + depth[0]} ${y + depth[1]}`} stroke={WOOD_DARK} strokeWidth="1.6" strokeLinecap="round" />
      })}
      <path d={`M${LADDER_BOTTOM[0]} ${LADDER_BOTTOM[1]} L${LADDER_TOP[0]} ${LADDER_TOP[1]}`} stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
      {/* ふいたとき ひかる */}
      <Layer opacity={during(t, NOTICE + 0.2, TO_LADDER + 0.4, 0.15)}>
        <Star cx={74.5} cy={64} r={3.2 + wave(t, 0.5) * 0.6} color="#fff3b0" spin={t * 60} />
      </Layer>
    </Layer>
  )
}

/** ちょうちょ。ふわふわ とんで、子の 目を ひく。 */
function Butterfly({ t }: SceneProps) {
  const appear = span(t, 0.15, 0.5)
  if (appear <= 0) return null
  const cx = 45 + Math.sin(t * 0.9) * 7 + 5 * span(t, FALL, LAND + 0.5, easeOut)
  const cy = 9.5 + Math.sin(t * 1.7) * 2.2
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.3))
  return (
    <Layer opacity={appear} x={cx} y={cy}>
      <Layer scaleX={flap} origin={[0, 0]}>
        <ellipse cx="-2.6" cy="-1.3" rx="2.6" ry="2" fill="#f69ac1" />
        <ellipse cx="2.6" cy="-1.3" rx="2.6" ry="2" fill="#f69ac1" />
        <ellipse cx="-2" cy="1.2" rx="1.9" ry="1.5" fill="#ffc2dc" />
        <ellipse cx="2" cy="1.2" rx="1.9" ry="1.5" fill="#ffc2dc" />
      </Layer>
      <rect x="-0.45" y="-2.2" width="0.9" height="5" rx="0.45" fill="#5a3b2a" />
    </Layer>
  )
}

/** おちた とき の つち と ほこり、くるくる まわる ほし。 */
function Crash({ t, hipX }: SceneProps & { readonly hipX: number }) {
  const dust = span(t, LAND, LAND + 0.7, easeOut)
  const crumbs = span(t, FALL + 0.1, LAND + 0.2)
  return (
    <>
      {crumbs > 0 && crumbs < 1 && (
        <g fill={DIRT_DARK} opacity={1 - crumbs * 0.6}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={PIT_LEFT + 2 + i * 2.4} y={SURFACE + 2 + crumbs * (30 + i * 12)} width="1.6" height="1.6" rx="0.6" />
          ))}
        </g>
      )}
      {dust > 0 && dust < 1 && (
        <g fill="#e6d3b8" opacity={0.85 * (1 - dust)}>
          <circle cx={hipX - 6 - dust * 7} cy={FLOOR - 1.5 - dust * 1.5} r={2 + dust * 3} />
          <circle cx={hipX + 8 + dust * 7} cy={FLOOR - 1.5 - dust * 1.5} r={2 + dust * 3} />
        </g>
      )}
    </>
  )
}

function DizzyStars({ t, head }: SceneProps & { readonly head: Pt }) {
  const show = during(t, LAND + 0.05, LAND + 0.75, 0.15)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 1, 2].map((i) => {
        const a = t * 6 + (i * Math.PI * 2) / 3
        return <Star key={i} cx={head[0] + Math.cos(a) * 7} cy={head[1] - 8 + Math.sin(a) * 2} r={2} color="#ffd24a" spin={t * 100} />
      })}
    </g>
  )
}

/** 「あっ!」の しるし。 */
function Notice({ t, head }: SceneProps & { readonly head: Pt }) {
  const k = span(t, NOTICE, NOTICE + 0.25, backOut)
  const gone = 1 - span(t, TO_LADDER - 0.2, TO_LADDER + 0.1)
  if (k <= 0 || gone <= 0) return null
  return (
    <Layer x={head[0] + 7} y={head[1] - 11} scale={Math.max(0, k)} opacity={gone} origin={[0, 3]}>
      <rect x="-1.3" y="-4" width="2.6" height="5.6" rx="1.2" fill="#e8534a" />
      <circle cx="0" cy="3.4" r="1.4" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const pose = posture(t)
  const headX = pose.hip[0] + 0.5
  const head: Pt = [headX, pose.hip[1] - 15]
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const enter = span(t, WALK - 0.05, WALK + 0.1)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Ground t={t} />
        <Ladder t={t} />
        <Butterfly t={t} />
        <Layer opacity={enter}>
          <ellipse cx={pose.hip[0] + 1} cy={t < FALL ? SURFACE + 0.6 : t < STEP ? FLOOR + 0.8 : SURFACE + 0.6} rx="7" ry="1.2" fill="#000000" opacity={t >= FALL && t < LAND ? 0 : t >= LAND && t < STEP - 0.6 ? 0.18 : 0.12} />
          <Child pose={pose} t={t} />
        </Layer>
        <Crash t={t} hipX={41} />
        <DizzyStars t={t} head={head} />
        <Notice t={t} head={head} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'ちょうちょ を 見あげて、子が あるいてくる', sound: 'pop' },
    { at: FALL, label: 'あなに あしを ふみ出して おちる', sound: 'pop' },
    { at: LAND, label: 'どすん。あなの そこで しくしく' },
    { at: NOTICE, label: '上を見て、はしごに「あっ!」' },
    { at: CLIMB, label: 'はしごを 1だん ずつ のぼる' },
    { at: STEP, label: 'あしを そとへ ふみ出して でる', sound: 'pop' },
    { at: CHEER, label: 'やった! ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '出 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
