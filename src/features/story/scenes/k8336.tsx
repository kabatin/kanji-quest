/*
 * 茶(ちゃ): のどが かわいた子が、お茶の木の はっぱを つんで、うれしくて ぱっと なげあげる。
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
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上に あたま。
 *   あし は こし から。うでの 長さは いつも同じ。ジャンプのときだけ 両手・両足を ひらく。
 *   字の形になるのは、ジャンプの いちばん高い しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '茶'

const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const TUNIC = '#f08a4b'
const TUNIC_DARK = '#c96a33'
const PANTS = '#4b6a8f'
const SHOE = '#6b4a36'
const HAT = '#e8c15a'
const HAT_DARK = '#d1a343'
const HAT_LINE = '#b98030'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const BUD = '#c9ee9c'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const DROP = '#7cc4f2'

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

/* ───────── 子どもの つくり(ぜんぶ 正面むき) ───────── */

type Point = readonly [number, number]

/** かた(うでの つけね)・こし(あしの つけね)・うでの 1ほんぶんの 長さ */
const SHOULDER_L: Point = [47.5, 70]
const SHOULDER_R: Point = [60.5, 70]
const HIP_X = 3.5
const HIP_Y = 79
const ARM_PART = 8
/** 地面(あしの うら) */
const FLOOR = 99
/** あたまの じく(くび) */
const NECK: Point = [54, 68]

type Mood = 'thirsty' | 'curious' | 'happy'

/** かた → ひじ → 手 の 2本の ぼう。手の 行きたい場所(target)から ひじ の場所を きめる。 */
function armJoints(shoulder: Point, target: Point, side: 1 | -1): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 1
  // 手が とどかないときは、うでを いっぱいに のばした ところで 止める
  const reach = Math.min(dist, ARM_PART * 2 * 0.99)
  const hand: Point = [shoulder[0] + (dx / dist) * reach, shoulder[1] + (dy / dist) * reach]
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(0, ARM_PART ** 2 - half ** 2))
  // ひじは いつも 体の そとがわ(外へ)まがる
  let nx = dy / dist
  let ny = -dx / dist
  if (Math.abs(nx) < 0.01) {
    nx = 0
    ny = 1
  } else if (nx * side < 0) {
    nx = -nx
    ny = -ny
  }
  const mid: Point = [(shoulder[0] + hand[0]) / 2, (shoulder[1] + hand[1]) / 2]
  return { elbow: [mid[0] + nx * bulge, mid[1] + ny * bulge], hand }
}

function Arm({ shoulder, joints }: { readonly shoulder: Point; readonly joints: { readonly elbow: Point; readonly hand: Point } }) {
  const { elbow, hand } = joints
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

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

function Face({ mood, gaze }: { readonly mood: Mood; readonly gaze: number }) {
  return (
    <>
      <circle cx="49.4" cy="64.6" r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx="58.6" cy="64.6" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'thirsty' && (
        <>
          <path d="M49 60.7 l3.2 -0.9 M59 60.7 l-3.2 -0.9" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={51.2 + gaze} cy="62" r="1.05" fill={EYE} />
          <circle cx={56.8 + gaze} cy="62" r="1.05" fill={EYE} />
          <ellipse cx="54" cy="66" rx="1.5" ry="1.2" fill={MOUTH} />
          <ellipse cx="54" cy="66.6" rx="0.8" ry="0.5" fill="#ff8a8a" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="51.2" cy="62" r="1.7" fill="#ffffff" />
          <circle cx="56.8" cy="62" r="1.7" fill="#ffffff" />
          <circle cx={51.5 + gaze} cy="62" r="1.1" fill={EYE} />
          <circle cx={57.1 + gaze} cy="62" r="1.1" fill={EYE} />
          <ellipse cx="54" cy="66" rx="1.1" ry="1.3" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M49.6 62.6 Q51.2 60.6 52.8 62.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M55.2 62.6 Q56.8 60.6 58.4 62.6" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M51.3 65 Q54 69 56.7 65 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = {
  /** 体ぜんたいの 上下(下へ + / 上へ -)。しゃがむ・ジャンプ */
  readonly dy: number
  /** 0 = まっすぐ 立つ / 1 = ジャンプで りょうあしを ひらく */
  readonly spread: number
  /** あるくときの 足の あげ(左・右) */
  readonly lift: readonly [number, number]
  readonly handL: Point
  readonly handR: Point
  readonly mood: Mood
  readonly gaze: number
  readonly headTilt: number
  /** みぎ手に もっている はっぱ(つんだ数) */
  readonly bunch: number
}

function Kid({ dy, spread, lift, handL, handR, mood, gaze, headTilt, bunch }: KidProps) {
  // あし: こし から 足もとへ。ジャンプでは ななめ外へ ひらく(ながさは 20 ぐらい)
  const crouchSplay = Math.max(0, dy) * 0.8
  const footX = (side: 1 | -1) => 54 + side * (4 + crouchSplay + spread * 12.5)
  const footY = (side: 1 | -1) => {
    const hipY = HIP_Y + dy
    return FLOOR + (spread * (hipY + 15.6 - FLOOR)) - lift[side === -1 ? 0 : 1]
  }
  const legs = ([-1, 1] as const).map((side) => (
    <g key={side}>
      <path d={`M${54 + side * HIP_X} ${HIP_Y + dy} L${footX(side)} ${footY(side) - 1.2}`} stroke={PANTS} strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx={footX(side) + side * 0.8} cy={footY(side) + 0.4} rx="4.3" ry="2.3" fill={SHOE} />
    </g>
  ))
  const jointsL = armJoints([SHOULDER_L[0], SHOULDER_L[1] + dy], [handL[0], handL[1]], -1)
  const jointsR = armJoints([SHOULDER_R[0], SHOULDER_R[1] + dy], [handR[0], handR[1]], 1)
  return (
    <>
      {legs}
      <g transform={`translate(0 ${dy})`}>
        {/* どう */}
        <rect x="46" y="68" width="16" height="12.5" rx="5" fill={TUNIC} />
        <path d="M47.4 76.6 h13.2" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        {/* くび は みじかく、どう と あたま の間に ちょっとだけ */}
        <rect x="51.6" y="66" width="4.8" height="4.4" rx="2" fill="#eeb98a" />
        <Layer rotate={headTilt} origin={NECK}>
          <ellipse cx="46.2" cy="61.4" rx="1.8" ry="2.1" fill={SKIN} />
          <ellipse cx="61.8" cy="61.4" rx="1.8" ry="2.1" fill={SKIN} />
          <circle cx="54" cy="60" r="8" fill={SKIN} />
          <ellipse cx="47.4" cy="58.4" rx="1.9" ry="3" fill={HAIR} />
          <ellipse cx="60.6" cy="58.4" rx="1.9" ry="3" fill={HAIR} />
          <Face mood={mood} gaze={gaze} />
          {/* すげがさ: やまがた の ぼうし。ひさしが 顔の 上を かくす */}
          <path d="M21 61 Q40 52 54 35.5 Q68 52 87 61 Q54 52 21 61 Z" fill={HAT} />
          <path d="M54 35.5 Q68 52 87 61 Q70 57.6 55 57 Z" fill={HAT_DARK} />
          <path d="M54 37 Q47 49 35 56 M54 37 Q54 47 54 56.4 M54 37 Q61 49 74 57" fill="none" stroke={HAT_LINE} strokeWidth="0.7" strokeLinecap="round" opacity="0.7" />
          <circle cx="54" cy="35.8" r="1.7" fill={HAT_LINE} />
          {/* あごひも */}
          <path d="M44 57.6 Q45 63 47.6 67 M64 57.6 Q63 63 60.4 67" fill="none" stroke={HAT_LINE} strokeWidth="0.8" strokeLinecap="round" />
        </Layer>
      </g>
      <Arm shoulder={[SHOULDER_L[0], SHOULDER_L[1] + dy]} joints={jointsL} />
      <Arm shoulder={[SHOULDER_R[0], SHOULDER_R[1] + dy]} joints={jointsR} />
      <Bunch at={jointsR.hand} count={bunch} />
    </>
  )
}

/* ───────── お茶の木(まわりの 景色) ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[11, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="10.3" y="1.2" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 11 11)`} />
        ))}
      </Layer>
      <circle cx="11" cy="11" r={4.8 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 0.8} 0)`}>
        <ellipse cx="88" cy="14" rx="6" ry="2.8" />
        <ellipse cx="92" cy="12.4" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 28, 98].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
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

/** あるいている間の あせ。あたまの よこから おちる */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK_FROM + 0.3, WALK_TO + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={DROP} transform={`translate(${66.5 + p * 2} ${58 + p * 10}) rotate(-12)`} opacity={1 - p} />
      })}
    </g>
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
        const bob = p >= 1 ? wave(t, 1.6, i * 0.37) * 0.5 : 0
        const y = startY + (spot.at[1] - startY) * p + bob
        // はじめは くるくる まわりながら、とまるころに 字の向きに そろう
        const spin = spot.rot + (1 - p) * (i % 2 === 0 ? 240 : -240)
        return <path key={i} d={LEAF_PATH} fill={i % 2 === 0 ? LEAF : LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.45" transform={`translate(${x} ${y}) rotate(${spin}) scale(${0.85 + p * 0.55})`} />
      })}
    </>
  )
}

/* ───────── 場面ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // あるいて くる: 左から 中まで。足を こうたいに あげて、体が 少し はずむ
  const walkX = mix(t, WALK_FROM, WALK_TO, -95, 0, easeOut)
  const walking = t >= WALK_FROM && t < WALK_TO ? 1 - span(t, WALK_TO - 0.3, WALK_TO) : 0
  const stepWave = Math.sin((t - WALK_FROM) * Math.PI * 2 * 2.2) * walking
  const lift: readonly [number, number] = [Math.max(0, stepWave) * 3, Math.max(0, -stepWave) * 3]
  const bob = -Math.abs(stepWave) * 1

  // つむ: 1つずつ 芽に 手を のばして つまみ、むねの まえへ もどす
  const picks = Array.from({ length: PICK_COUNT }, (_, i) => PICK_FROM + i * PICK_EVERY)
  const picked = picks.filter((from) => t >= from + 0.4).length
  const restR: Point = picked > 0 ? [64.5, 79] : [61.8, 85.4]
  const restL: Point = [46.2, 85.4]
  let handR: Point = restR
  picks.forEach((from, i) => {
    const out = span(t, from, from + 0.35, easeOut) * (1 - span(t, from + 0.45, from + 0.85, easeInOut))
    if (out <= 0) return
    const tip = shootTip(PICKED_X[i])
    const holdAt: Point = i > 0 ? [64.5, 79] : [61.8, 85.4]
    handR = [holdAt[0] + (tip[0] - holdAt[0]) * out, holdAt[1] + (tip[1] - holdAt[1]) * out]
  })
  // あるくとき、うでは 少し ふる(足と ぎゃくに)
  const swing = stepWave * 2
  if (t < WALK_TO) handR = [restR[0], restR[1] + swing]
  const restLNow: Point = t < WALK_TO ? [restL[0], restL[1] - swing] : restL

  // なげあげ: 手を 上に ふりあげ → ばんざいの 高さで 左右に ひらく
  const raise = span(t, CROUCH + 0.1, TOSS + 0.1, easeInOut)
  const open = span(t, TOSS + 0.2, INK, easeInOut)
  const upR: Point = [69.5, 56]
  const upL: Point = [39.5, 56]
  const wideR: Point = [76.3, 70]
  const wideL: Point = [31.7, 70]
  const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
  const armR = lerpPoint(lerpPoint(handR, upR, raise), wideR, open)
  const armL = lerpPoint(lerpPoint(restLNow, upL, raise), wideL, open)

  // しゃがんで、ジャンプ。ちょうど いちばん高いところで 字の形に なる
  const dy = t < LAUNCH ? mix(t, CROUCH, CROUCH + 0.3, 0, 3, easeOut) : mix(t, LAUNCH, INK, 3, -4, easeOut)
  const spread = span(t, LAUNCH + 0.1, INK - 0.1, easeOut)

  // 気持ち: のどが かわいた → 芽を みつけた → うれしい
  const mood: Mood = t < WALK_TO ? 'thirsty' : t < PICK_FROM + 0.4 ? 'curious' : 'happy'
  const looking = t >= WALK_TO && t < CROUCH
  const gaze = looking ? 1 : 0
  const headTilt = t < WALK_TO ? -3 + stepWave * 1.5 : looking ? 3 : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <TeaBush t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.2)}>
          <ellipse cx={54 + walkX} cy="100" rx={12 - Math.min(0, dy) * -0.6} ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Kid dy={dy} spread={spread} lift={lift} handL={armL} handR={armR} mood={mood} gaze={gaze} headTilt={headTilt} bunch={t >= TOSS ? 0 : picked} />
            <Sweat t={t} />
          </Layer>
        </Layer>
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
