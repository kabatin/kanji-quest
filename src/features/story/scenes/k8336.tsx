/*
 * 茶(ちゃ): のどが かわいた子が、お茶の木の はっぱを つんで、うれしくて ぱっと なげあげる。
 * (共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1〜3画目(艹) … なげあげた はっぱが、ぱっと ひろがって とまった しゅんかん の ならび
 *                    (1画目は 上に ひろがる 横ならび、2・3画目は 2ほんの 立ちならび)
 *   4・5画目(人) … すげがさ(ぼうし)の 左右の ななめ(やま がた の ぼうし)
 *   6画目(一)   … ばんざい で ひろげた りょううで
 *   7画目(丨)   … 子どもの どう と まんなか
 *   8・9画目     … ジャンプで ひらいた りょうあし
 *
 * ながれ
 *   お茶の木が はえる → あつくて のどが かわいた子が あるいてくる(あせ)
 *   → 木の 新しい芽を みつけて、1つずつ つむ(気持ちが ぱっと 明るくなる)
 *   → しゃがんで、ぴょんと ジャンプ。つんだ はっぱを 空へ ぱっと なげあげる
 *   → はっぱが 字の上の ぶぶん(艹)に ならんで とまり、子の すがたと いっしょに ほね が ひかって 字「茶」になる
 *
 * 子どもは Person。あるく ときは 横むき(walk)で、木の まえで 正面へ ふりむく(turnAround)。
 * すげがさは headwear、つむ・なげる うでは 点で 指定する。字の形になるのは、ジャンプの いちばん高い しゅんかん だけ。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, HANG_ARM, LOOKS, mixLimb, mixPose, Person, personRig, posture, Sweat, turnAround, walk, type Expression, type Limb, type PersonPose, type PersonProps } from '../sceneFigures'

const CHAR = '茶'

const HAT = '#e8c15a'
const HAT_DARK = '#d1a343'
const HAT_LINE = '#b98030'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BUD = '#c9ee9c'

/** くぎり の時間(秒) */
const WALK_FROM = 0.5
const WALK_TO = 2.0
/** 1つめの はっぱを つむ 時間。そのあと 0.85 秒ごとに つぎの 芽へ */
const PICK_FROM = 2.5
const PICK_EVERY = 0.85
const PICK_COUNT = 3
/** しゃがむ → ジャンプ → はっぱを なげる */
const CROUCH = 5.15
const LAUNCH = 5.5
const TOSS = 5.7
const INK = 6.4
const DONE = 9.7
const DURATION = 10.4

type Point = readonly [number, number]

/** 子ども: あしもと(こし の x と 地面)・背の高さ・服(すげがさ は headwear) */
const KID_X = 54
const KID_Y = 99
const KID_HEIGHT = 48
const KID_LOOK = { ...LOOKS.boy, top: '#f08a4b', bottom: '#4b6a8f', sleeves: 'long' } as const

/* ───────── すげがさ(あたまの まんなか が 0,0、半径 1。やまがた の ぼうし) ───────── */

const STRAW_HAT: ReactNode = (
  <g>
    <path d="M-4.1 0.12 Q-1.75 -1 0 -3.06 Q1.75 -1 4.1 0.12 Q0 -1 -4.1 0.12 Z" fill={HAT} />
    <path d="M0 -3.06 Q1.75 -1 4.1 0.12 Q2 -0.3 0.12 -0.38 Z" fill={HAT_DARK} />
    <path d="M0 -2.9 Q-0.9 -1.6 -2.4 -0.5 M0 -2.9 Q0 -1.7 0 -0.5 M0 -2.9 Q0.9 -1.6 2.5 -0.4" fill="none" stroke={HAT_LINE} strokeWidth="0.09" strokeLinecap="round" opacity="0.7" />
    <circle cx="0" cy="-3.04" r="0.21" fill={HAT_LINE} />
    <path d="M-1.25 -0.3 Q-1.12 0.38 -0.8 0.88 M1.25 -0.3 Q1.12 0.38 0.8 0.88" fill="none" stroke={HAT_LINE} strokeWidth="0.1" strokeLinecap="round" />
  </g>
)

/* ───────── つんだ はっぱ・お茶の木 ───────── */

/** 小さな 葉っぱ1まい。さきが うえ(0,-3)、ねもと が した(0,3) */
const LEAF_PATH = 'M0 -3.2 Q2.2 -0.2 0 3.2 Q-2.2 -0.2 0 -3.2 Z'

/** つんだ はっぱの たば。手の まわりに おうぎの ように ひろがる */
function Bunch({ at, count }: { readonly at: Point; readonly count: number }) {
  if (count <= 0) return null
  const leaves = count * 2
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      {Array.from({ length: leaves }, (_, i) => {
        const angle = leaves === 1 ? 0 : -42 + (84 * i) / (leaves - 1)
        return <path key={i} d={LEAF_PATH} fill={i % 2 === 0 ? LEAF : LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.4" transform={`rotate(${angle}) translate(0 -3.4) scale(${0.9 + count * 0.1})`} />
      })}
    </g>
  )
}

/** お茶の木の ふくらんだ しげみ。上の あたり から 新しい芽が でる */
const BUSH_CX = 78
const BUSH_CY = 91
const BUSH_RX = 13
const BUSH_RY = 11
/** x の ところの、しげみの 上の ふち */
const bushTop = (x: number) => BUSH_CY - BUSH_RY * Math.sqrt(Math.max(0, 1 - ((x - BUSH_CX) / BUSH_RX) ** 2))

/** 新しい芽(つまれる 3こ は 左から。右の3こは そのまま のこる) */
const PICKED_X: readonly number[] = [66, 70, 74]
const KEPT_X: readonly number[] = [79, 84, 88]
const SHOOT_HEIGHT = 3.8
/** 手が つかむ 芽の さき */
const shootTip = (x: number): Point => [x, bushTop(x) - SHOOT_HEIGHT]

function Shoot({ x, scale = 1 }: { readonly x: number; readonly scale?: number }) {
  const base = bushTop(x)
  return (
    <Layer scale={scale} origin={[x, base]}>
      <path d={`M${x} ${base + 0.5} L${x} ${base - 3}`} stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <path d={LEAF_PATH} fill={BUD} stroke={LEAF} strokeWidth="0.4" transform={`translate(${x - 1.6} ${base - 3.6}) rotate(-38)`} />
      <path d={LEAF_PATH} fill={BUD} stroke={LEAF} strokeWidth="0.4" transform={`translate(${x + 1.6} ${base - 3.6}) rotate(38)`} />
      <path d={LEAF_PATH} fill={BUD} stroke={LEAF} strokeWidth="0.4" transform={`translate(${x} ${base - 4.6}) scale(0.8)`} />
    </Layer>
  )
}

function TeaBush({ t }: SceneProps) {
  const grow = span(t, 0.1, 0.75, backOut)
  const shoots = span(t, 0.55, 1.1, backOut)
  const pickStart = (i: number) => PICK_FROM + i * PICK_EVERY
  return (
    <>
      <Layer scale={grow} origin={[BUSH_CX, 100]}>
        <ellipse cx={BUSH_CX} cy={BUSH_CY} rx={BUSH_RX} ry={BUSH_RY} fill={LEAF_DARK} />
        <ellipse cx={BUSH_CX - 1.5} cy={BUSH_CY - 2.2} rx={BUSH_RX - 2.6} ry={BUSH_RY - 3.2} fill={LEAF} />
        <circle cx="72" cy="90" r="1.4" fill={LEAF_LIGHT} />
        <circle cx="80" cy="93" r="1.4" fill={LEAF_LIGHT} />
        <circle cx="84" cy="88.4" r="1.2" fill={LEAF_LIGHT} />
      </Layer>
      {PICKED_X.map((x, i) => (
        // つまれた しゅんかん(つまむ 0.4 秒あと)に 芽が きえる
        <Shoot key={x} x={x} scale={t < pickStart(i) + 0.4 ? shoots : 0} />
      ))}
      {KEPT_X.map((x) => (
        <Shoot key={x} x={x} scale={shoots} />
      ))}
    </>
  )
}

/* ───────── なげあげた はっぱ(艹 の ならびに なる) ───────── */

/** 1〜3画目の 通り道の点から えらんだ、はっぱの とまる 場所(scene-info の 点) */
const LEAF_SPOTS: readonly { readonly at: Point; readonly rot: number }[] = [
  // 1画目: 横ならび
  ...([[18.5, 27], [28.7, 27.2], [39, 26.3], [49.3, 25.4], [59.5, 24.5], [69.8, 23.8], [80.1, 23.1], [90.4, 23.5]] as const).map((at, i) => ({ at, rot: 90 + (i % 2 === 0 ? 14 : -14) })),
  // 2画目: 左の 立ちならび
  ...([[36.8, 15.5], [38.8, 20.8], [39.6, 26.6], [40.4, 32.4]] as const).map((at, i) => ({ at, rot: i % 2 === 0 ? 8 : -8 })),
  // 3画目: 右の 立ちならび
  ...([[67.8, 12.3], [67.3, 18.7], [65.9, 25.1], [64.5, 31.5]] as const).map((at, i) => ({ at, rot: i % 2 === 0 ? -8 : 8 })),
]

/** なげた手の 先(ばんざいの 手のあたり)から とびだす */
const THROW_FROM: Point = [66, 56]

function ThrownLeaves({ t }: SceneProps) {
  if (t < TOSS) return null
  return (
    <>
      {LEAF_SPOTS.map((spot, i) => {
        const delay = (i % 4) * 0.05
        const p = span(t, TOSS + delay, INK, easeOut)
        const startX = THROW_FROM[0] + (i % 5) * 1.4
        const startY = THROW_FROM[1] - (i % 3)
        const x = startX + (spot.at[0] - startX) * p
        const bob = p >= 1 ? Math.sin(t * 3.9 + i * 0.37 * 6.28) * 0.5 : 0
        const y = startY + (spot.at[1] - startY) * p + bob
        // はじめは くるくる まわりながら、とまるころに 字の向きに そろう
        const spin = spot.rot + (1 - p) * (i % 2 === 0 ? 240 : -240)
        return <path key={i} d={LEAF_PATH} fill={i % 2 === 0 ? LEAF : LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.45" transform={`translate(${x} ${y}) rotate(${spin}) scale(${0.85 + p * 0.55})`} />
      })}
    </>
  )
}

/* ───────── 子ども ───────── */

/** つむ うで(本人の 左手 = 画面の 右。木が 右に ある): はじめ は だらんと、つむたびに 芽へ のばし、むねの まえへ もどす */
const HOLD_BUNCH: Limb = { to: [64, 78], depth: 5 }

function pickArm(t: number): Limb {
  const picks = Array.from({ length: PICK_COUNT }, (_, i) => PICK_FROM + i * PICK_EVERY)
  const picked = picks.filter((from) => t >= from + 0.4).length
  let arm: Limb = picked > 0 ? HOLD_BUNCH : HANG_ARM
  picks.forEach((from, i) => {
    const out = span(t, from, from + 0.35, easeOut) * (1 - span(t, from + 0.45, from + 0.85, easeInOut))
    if (out <= 0) return
    const rest: Limb = i > 0 ? HOLD_BUNCH : HANG_ARM
    arm = mixLimb(rest, { to: shootTip(PICKED_X[i]), depth: 4 }, out)
  })
  return arm
}

const UP_ARM: Limb = { swing: 150, bend: 8 }
const WIDE_ARM: Limb = { swing: 95, bend: 4 }
const SPREAD_LEG: Limb = { swing: 32, bend: 0 }

/** しゃがむ → ジャンプで りょうあしを ひらく、うでは 上へ → ばんざいで 左右へ(正面) */
function frontPose(t: number): PersonPose {
  const crouch = span(t, CROUCH, CROUCH + 0.3, easeOut) * (1 - span(t, LAUNCH, LAUNCH + 0.1))
  const spread = span(t, LAUNCH + 0.1, INK - 0.1, easeOut)
  const raise = span(t, CROUCH + 0.1, TOSS + 0.1, easeInOut)
  const open = span(t, TOSS + 0.2, INK, easeInOut)
  const arm = (rest: Limb): Limb => mixLimb(mixLimb(rest, UP_ARM, raise), WIDE_ARM, open)
  const bent = mixPose({}, posture('squat', 'front'), crouch * 0.55)
  return {
    leftArm: arm(pickArm(t)),
    rightArm: arm(HANG_ARM),
    leftLeg: mixLimb(bent.leftLeg ?? HANG_ARM, SPREAD_LEG, spread),
    rightLeg: mixLimb(bent.rightLeg ?? HANG_ARM, SPREAD_LEG, spread),
    head: 0,
  }
}

function kidFace(t: number): Expression {
  if (t < WALK_TO) return 'worried'
  if (t < PICK_FROM + 0.4) return 'normal'
  return 'joy'
}

function kidProps(t: number): PersonProps {
  const w = walk(t, { from: -41, to: KID_X, start: WALK_FROM, end: WALK_TO, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, WALK_TO, 'right', 'front')
  const looking = t >= WALK_TO && t < CROUCH
  const lift = t < LAUNCH ? 0 : 8 * span(t, LAUNCH, INK, easeOut)
  const base: PersonProps = { x: KID_X, y: KID_Y, build: 'child', height: KID_HEIGHT, look: KID_LOOK, headwear: STRAW_HAT, face: kidFace(t), gaze: looking ? 1 : 0, lift }
  if (t < WALK_TO) return { ...base, x: w.x, facing: w.facing, pose: w.pose }
  return { ...base, ...turn, pose: t < WALK_TO + 0.15 ? {} : frontPose(t) }
}

/* ───────── 場面ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)
  const kid = kidProps(t)
  const rig = personRig({ ...kid, facing: 'front' }).world
  const picked = Array.from({ length: PICK_COUNT }, (_, i) => PICK_FROM + i * PICK_EVERY).filter((from) => t >= from + 0.4).length
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const hand = personRig(kid).world.arms.left.end

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[11, 11]} clouds={[[86, 12, 0.6]]} tufts={[6, 28, 98]} />
        <TeaBush t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.2)}>
          <Person {...kid} />
          {t >= WALK_TO + 0.15 && <Bunch at={hand} count={t >= TOSS ? 0 : picked} />}
        </Layer>
        <Sweat t={t} x={rig.head[0] + 9} y={rig.head[1] + 1} show={during(t, WALK_FROM + 0.3, WALK_TO + 0.2, 0.2)} dir={1} />
        <ThrownLeaves t={t} />
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
    { at: 0, label: 'お茶の木が はえる', sound: 'pop' },
    { at: WALK_FROM, label: 'あつくて のどが かわいた子が あるいてくる' },
    { at: WALK_TO, label: '新しい芽を みつける' },
    { at: PICK_FROM, label: 'はっぱを 1つずつ つむ', sound: 'pop' },
    { at: CROUCH, label: 'しゃがんで ジャンプ。はっぱを ぱっと なげあげる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '茶 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
