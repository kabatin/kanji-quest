/*
 * 田(た): 四角い たんぼを あぜみちで 4つに くぎった。
 *
 * ほね(画と絵の対応)  ※ たんぼを まうえから 見た 地図の ような 絵
 *   1画目(丨)  … たんぼの 左の あぜ(土手)
 *   2画目(冂)  … たんぼの 上の あぜ と 右の あぜ
 *   3画目(丨)  … のうふが たてに ほった まんなかの あぜみち
 *   4画目(一)  … のうふが よこに ほった まんなかの あぜみち
 *   5画目(一)  … たんぼの 下の あぜ
 *
 * ながれ
 *   四角い たんぼが できる
 *   → のうふが あぜを あるいてくる。たんぼが ひろくて、中へ はいれず こまった かお
 *   → 「そうだ！」 ひらめく(あたまの ふきだしに、4つに わけた たんぼ)
 *   → くわで、たてに あぜみちを ほる(ほった所を、のうふが すすむ)
 *   → よこにも ほる。たんぼが 4つに くぎられる
 *   → のうふが 大よろこび。4つの たんぼに 苗が ぽん ぽん と 出る
 *   → ほね が ひかって、絵が うすくなり、字「田」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじの 位置は、2つの ほね の長さ から 計算する)。
 *   くび は みじかく、どう の まんなか の上。あし は こし から。
 *   むきを変えるときは、体を よこへ せまくして ひっくり返す(人が くるっと まわる ように)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '田'

const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d88a'
const WATER = '#9ccfe8'
const WATER_LIGHT = '#c9e8f6'
const SOIL = '#8c5b3c'
const SOIL_LIGHT = '#b07a52'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAT = '#e8c36a'
const HAT_DARK = '#c99f45'
const TUNIC = '#e0705a'
const TUNIC_DARK = '#c85a46'
const TUNIC_FAR = '#a84a3c'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const BOOT = '#6b4a36'
const HANDLE = '#a06a3c'
const IRON = '#8e98a4'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const FIELD_DONE = 0.9
const WALK_IN_END = 2.3
const IDEA_END = 3.2
const DIG_V_END = 4.6
const TURN_A_END = 4.85
const WALK_END = 5.6
const TURN_B_END = 5.9
const DIG_H_END = 7.1
const TURN_C_END = 7.35
const INK = 7.9
const DONE = 10.8
const DURATION = 11.2

/** 人の 大きさ(うえから見た地図の 中なので、たんぼの 4分の1 くらいの 小ささ) */
const S = 0.72
/** くわの はが 地面に とどく 場所(足もとから)。まえむき = 下へ / よこむき = まえへ */
const FRONT_REACH = 4
const SIDE_REACH = 12
/** たんぼの あぜ(画)の 場所。画データから */
const WALK_START_X = 124
const TOP_BANK_Y = 33.4
const V_LINE_X = 54
const V_HEAD_END = 79.8
const H_LINE_X0 = 24
const H_LINE_LEN = 62.5
/** 4画目の 書きはじめの たかさ と、右への のぼり(2点の高さの差) */
const H_LINE_Y0 = 55.5
const H_LINE_RISE = 3.5
const NO_LIFT = 1.3

type Pt = readonly [number, number]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 肩と手の 2点が きまったとき、ひじが どこに なるか(2本の ほねの長さ が おなじ)。pref の ほうへ まがる */
function elbowOf(shoulder: Pt, hand: Pt, bone: number, pref: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const h = Math.sqrt(Math.max(0, bone * bone - (d / 2) * (d / 2)))
  const mid: Pt = [shoulder[0] + dx / 2, shoulder[1] + dy / 2]
  const a: Pt = [mid[0] + (-dy / d) * h, mid[1] + (dx / d) * h]
  const b: Pt = [mid[0] - (-dy / d) * h, mid[1] - (dx / d) * h]
  return a[0] * pref[0] + a[1] * pref[1] >= b[0] * pref[0] + b[1] * pref[1] ? a : b
}

/** かた → ひじ → 手 と つながる うで */
function Arm({ shoulder, hand, pref, color }: { readonly shoulder: Pt; readonly hand: Pt; readonly pref: Pt; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand, 8, pref)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" fill={SKIN} />
    </>
  )
}

/** くわ。えを の先に 鉄の はが ついて いる。 */
function Hoe({ top, blade }: { readonly top: Pt; readonly blade: Pt }) {
  const angle = (Math.atan2(blade[1] - top[1], blade[0] - top[0]) * 180) / Math.PI
  return (
    <>
      <path d={`M${top[0]} ${top[1]} L${blade[0]} ${blade[1]}`} stroke={HANDLE} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="-1.1" y="-3.4" width="2.4" height="6.8" rx="1" fill={IRON} transform={`translate(${blade[0]} ${blade[1]}) rotate(${angle})`} />
    </>
  )
}

type Mood = 'worried' | 'idea' | 'focus' | 'happy'

function Brim({ x }: { readonly x: number }) {
  return (
    <>
      <path d={`M${x - 6.2} -39.2 Q${x} -50 ${x + 6.2} -39.2 Z`} fill={HAT} />
      <ellipse cx={x} cy="-39.4" rx="9.8" ry="2.1" fill={HAT_DARK} />
      <path d={`M${x - 6.2} -41.6 Q${x} -43.2 ${x + 6.2} -41.6`} fill="none" stroke={HAT_DARK} strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

/** まえむきの顔(あたまの 中心は 0, -34.8) */
function FrontFace({ mood }: { readonly mood: Mood }) {
  const brow = mood === 'worried' ? 1 : mood === 'idea' ? -1.2 : 0
  return (
    <>
      <circle cx="-3.9" cy="-32.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      <circle cx="3.9" cy="-32.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M-3.9 -34 Q-2.4 -36 -0.9 -34 M0.9 -34 Q2.4 -36 3.9 -34" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M-2.4 -31.7 Q0 -28.6 2.4 -31.7 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="-2.4" cy="-34.2" r={mood === 'idea' ? 1.25 : 0.95} fill={EYE} />
          <circle cx="2.4" cy="-34.2" r={mood === 'idea' ? 1.25 : 0.95} fill={EYE} />
          <path d={`M-4 ${-36.4 - brow * 0.4} L-1.5 ${-36.4 - brow}`} stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
          <path d={`M4 ${-36.4 - brow * 0.4} L1.5 ${-36.4 - brow}`} stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
          {mood === 'worried' && <path d="M-1.7 -30.6 Q0 -32 1.7 -30.6" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
          {mood === 'focus' && <path d="M-1.6 -31 Q0 -30 1.6 -31" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
          {mood === 'idea' && <ellipse cx="0" cy="-30.8" rx="1" ry="1.3" fill={MOUTH} />}
        </>
      )}
    </>
  )
}

/** よこむき(みぎむき)の顔。目と口が すこし まえに よる */
function SideFace({ mood }: { readonly mood: Mood }) {
  const brow = mood === 'worried' ? 1 : mood === 'idea' ? -1.2 : 0
  return (
    <>
      <circle cx="1.8" cy="-32.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M2 -34 Q3.5 -36 5 -34" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M3.6 -31.7 Q5.4 -28.8 6.6 -31.7 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="3.9" cy="-34.2" r={mood === 'idea' ? 1.25 : 0.95} fill={EYE} />
          <path d={`M2.4 ${-36.2 - brow * 0.4} L5.4 ${-36.4 - brow}`} stroke={EYE} strokeWidth="0.8" strokeLinecap="round" />
          {mood === 'worried' && <path d="M4 -30.6 Q5.4 -32 6.6 -30.6" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
          {mood === 'focus' && <path d="M4 -31 Q5.4 -30 6.6 -31" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
          {mood === 'idea' && <ellipse cx="5.6" cy="-30.8" rx="0.9" ry="1.2" fill={MOUTH} />}
        </>
      )}
    </>
  )
}

type FarmerProps = {
  readonly view: 'front' | 'side'
  readonly mood: Mood
  /** くわを もちあげた高さ。0 = 地面に とどく / 1.3 = かついで あるく / 2 = 万歳のとき */
  readonly lift: number
  /** あるくとき、あしを ふる(-1〜1) */
  readonly step: number
  /** 大よろこび(0〜1): 左手を 上げ、くわを 右がわに かかげる */
  readonly cheer: number
}

/** 足もと が 原点(0, 0)。上が マイナス。 */
function Farmer({ view, mood, lift, step, cheer }: FarmerProps) {
  const SH = -27
  if (view === 'front') {
    const hoeX = 9 * cheer
    const top: Pt = [hoeX, -22 - lift * 6]
    const blade: Pt = [hoeX, FRONT_REACH - lift * 8]
    const rightHand = lerpPt(top, blade, 0.3)
    const leftOn = lerpPt(top, blade, 0.12)
    const leftHand = lerpPt([leftOn[0] - 1.8, leftOn[1]], [-8.5, -36], cheer)
    return (
      <>
        <rect x="-4.6" y="-16" width="3.6" height="15" rx="1.8" fill={PANTS_DARK} />
        <rect x="1" y="-16" width="3.6" height="15" rx="1.8" fill={PANTS} />
        <ellipse cx="-2.8" cy="-0.6" rx="3" ry="1.6" fill={BOOT} />
        <ellipse cx="2.8" cy="-0.6" rx="3" ry="1.6" fill={BOOT} />
        <rect x="-6.2" y="-29.4" width="12.4" height="15.6" rx="4.4" fill={TUNIC} />
        <path d="M-5 -17.6 h10" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <rect x="-1.8" y="-31.4" width="3.6" height="4.4" rx="1.6" fill={SKIN_SHADE} />
        <circle cx="0" cy="-34.8" r="6.2" fill={SKIN} />
        <FrontFace mood={mood} />
        <Brim x={0} />
        <Hoe top={top} blade={blade} />
        <Arm shoulder={[-5.6, SH]} hand={leftHand} pref={[-1, 0.4]} color={TUNIC_DARK} />
        <Arm shoulder={[5.6, SH]} hand={rightHand} pref={[1, 0.4]} color={TUNIC_DARK} />
      </>
    )
  }
  const top: Pt = [1.5, -22 - lift * 6]
  const blade: Pt = [SIDE_REACH - lift * 2.5, 3 - lift * 12]
  const farHand = lerpPt(top, blade, 0.14)
  const nearHand = lerpPt(top, blade, 0.4)
  return (
    <>
      <Arm shoulder={[0, SH]} hand={farHand} pref={[-1, 0.6]} color={TUNIC_FAR} />
      <g transform={`rotate(${-step * 20} 0 -15)`}>
        <rect x="-1.9" y="-16" width="3.6" height="15" rx="1.8" fill={PANTS_DARK} />
        <ellipse cx="-0.2" cy="-0.6" rx="3.2" ry="1.6" fill={BOOT} />
      </g>
      <g transform={`rotate(${step * 20} 0 -15)`}>
        <rect x="-1.9" y="-16" width="3.6" height="15" rx="1.8" fill={PANTS} />
        <ellipse cx="0.6" cy="-0.6" rx="3.4" ry="1.6" fill={BOOT} />
      </g>
      <rect x="-4.4" y="-29.4" width="8.8" height="15.6" rx="4" fill={TUNIC} />
      <path d="M-3.4 -17.6 h6.8" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <rect x="-1.4" y="-31.4" width="3.6" height="4.4" rx="1.6" fill={SKIN_SHADE} />
      <circle cx="0.6" cy="-34.8" r="6.2" fill={SKIN} />
      <SideFace mood={mood} />
      <Brim x={0.8} />
      <Hoe top={top} blade={blade} />
      <Arm shoulder={[0, SH]} hand={nearHand} pref={[-1, 0.6]} color={TUNIC_DARK} />
    </>
  )
}

/* ───────── たんぼ ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <rect x="-2" y="-2" width="113" height="113" fill={GRASS} />
      {[[6, 14], [100, 20], [8, 94], [100, 98], [96, 62], [8, 60]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={GRASS_DARK} transform={`translate(${wave(t, 3.6, x) * 0.3} 0)`} />
      ))}
    </>
  )
}

/** みずを はった たんぼ(2画目・1画目・5画目の あぜ の 中) */
function Paddy({ t }: SceneProps) {
  const fill = span(t, 0.45, 1.0, easeOut)
  return (
    <g opacity={fill}>
      <path d="M22 29 L88 28 L85 82 L25 83 Z" fill={WATER} />
      <path d="M26 33 q5 -1.6 10 0 M60 34 q6 -1.6 12 0 M30 76 q5 -1.6 10 0 M66 77 q6 -1.6 12 0" fill="none" stroke={WATER_LIGHT} strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
    </g>
  )
}

/** あぜ(土の みち)。土のいろ の 上に、ひとすじ 明るい色 */
function Bank({ n, width, from = 0, to }: { readonly n: number; readonly width: number; readonly from?: number; readonly to: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={SOIL} width={width} from={from} to={to} />
      <Bone char={CHAR} n={n} color={SOIL_LIGHT} width={width * 0.34} from={from} to={to} opacity={0.8} />
    </>
  )
}

function Seedling({ x, y, grow }: { readonly x: number; readonly y: number; readonly grow: number }) {
  const g = Math.max(0, grow)
  if (g <= 0) return null
  return (
    <Layer x={x} y={y} scale={g}>
      <ellipse cx="0" cy="0.4" rx="3.4" ry="1.3" fill={SOIL} />
      <path d="M-1.2 0 Q-2.6 -3 -3.2 -5.4 M0 0 Q0.2 -3.6 0 -7 M1.2 0 Q2.6 -3 3.4 -5.2" fill="none" stroke={LEAF} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0 0 Q0.2 -3.6 0 -7" fill="none" stroke={LEAF_DARK} strokeWidth="0.6" strokeLinecap="round" />
    </Layer>
  )
}

/** 4つの たんぼに ふたつずつ 苗(あぜみちの 上には おかない) */
const SEEDLINGS: readonly Pt[] = [[32, 38], [44, 47], [62, 37], [75, 47], [32, 64], [44, 74], [62, 66], [75, 74]]

function Seedlings({ t }: SceneProps) {
  return (
    <>
      {SEEDLINGS.map(([x, y], i) => (
        <Seedling key={i} x={x} y={y} grow={span(t, 7.0 + i * 0.1, 7.55 + i * 0.1, backOut)} />
      ))}
    </>
  )
}

/* ───────── のうふの うごき ───────── */

type FarmerState = {
  readonly x: number
  readonly y: number
  readonly view: 'front' | 'side'
  /** よこの ひろがり(マイナス = 左むき)。0 の しゅんかん が 体の よこ向き */
  readonly sx: number
  readonly mood: Mood
  readonly lift: number
  readonly step: number
  readonly cheer: number
  readonly hop: number
}

/** くわを ふりおろす くりかえし。0 = 地面を うつ / 1 = いちばん 上 */
const digLift = (t: number) => 0.5 - 0.5 * Math.cos((t / 0.5) * Math.PI * 2)

const V_STEP_Y = V_HEAD_END - FRONT_REACH * S - TOP_BANK_Y
const H_FEET_X0 = H_LINE_X0 - SIDE_REACH * S
const H_FEET_Y0 = H_LINE_Y0 - 0.7

/** 前むき ↔ 左むき の 回る じゅんび。p = 0〜1 で、前むき(1)→よこ(0)→左むき(-1) */
const turnFrontToLeft = (p: number) => (p < 0.5 ? { view: 'front' as const, sx: 1 - 2 * p } : { view: 'side' as const, sx: -(2 * p - 1) })

function farmerState(t: number): FarmerState {
  const bob = (phase: number) => -Math.abs(Math.sin(phase * Math.PI * 2 * 1.6)) * 0.9
  const stride = (from: number) => Math.sin((t - from) * Math.PI * 2 * 1.6)

  // 1. あぜを あるいてくる(左むき・こまった かお)
  if (t < WALK_IN_END) {
    const phase = Math.max(0, t - FIELD_DONE)
    return { x: mix(t, FIELD_DONE, WALK_IN_END, WALK_START_X, V_LINE_X, (x) => x), y: TOP_BANK_Y + bob(phase), view: 'side', sx: -1, mood: 'worried', lift: NO_LIFT, step: stride(FIELD_DONE), cheer: 0, hop: 0 }
  }
  // 2. くるっと まえを むく。ひらめく
  if (t < IDEA_END) {
    const p = span(t - 0 + 0, WALK_IN_END, WALK_IN_END + 0.5)
    const turned = p < 0.5 ? { view: 'side' as const, sx: -(1 - 2 * p) } : { view: 'front' as const, sx: 2 * p - 1 }
    return { x: V_LINE_X, y: TOP_BANK_Y, ...turned, mood: p < 0.5 ? 'worried' : 'idea', lift: NO_LIFT, step: 0, cheer: 0, hop: 0 }
  }
  // 3. たてに ほる(下へ すすむ)
  if (t < DIG_V_END) {
    const p = span(t, IDEA_END, DIG_V_END - 0.15)
    const w = span(t, IDEA_END, IDEA_END + 0.25) * (1 - span(t, DIG_V_END - 0.3, DIG_V_END))
    return { x: V_LINE_X, y: TOP_BANK_Y + p * V_STEP_Y, view: 'front', sx: 1, mood: 'focus', lift: NO_LIFT * (1 - w) + digLift(t) * w, step: 0, cheer: 0, hop: 0 }
  }
  const vEndY = TOP_BANK_Y + V_STEP_Y
  // 4. 左むきに かわる
  if (t < TURN_A_END) {
    const turned = turnFrontToLeft(span(t, DIG_V_END, TURN_A_END))
    return { x: V_LINE_X, y: vEndY, ...turned, mood: 'focus', lift: NO_LIFT, step: 0, cheer: 0, hop: 0 }
  }
  // 5. 左はしへ あるく
  if (t < WALK_END) {
    const k = span(t, TURN_A_END, WALK_END, easeInOut)
    return { x: mix(t, TURN_A_END, WALK_END, V_LINE_X, H_FEET_X0), y: vEndY + (H_FEET_Y0 - vEndY) * k + bob(t - TURN_A_END), view: 'side', sx: -1, mood: 'focus', lift: NO_LIFT, step: stride(TURN_A_END), cheer: 0, hop: 0 }
  }
  // 6. 右むきに くるっと かわる
  if (t < TURN_B_END) {
    const p = span(t, WALK_END, TURN_B_END)
    return { x: H_FEET_X0, y: H_FEET_Y0, view: 'side', sx: -1 + 2 * p, mood: 'focus', lift: NO_LIFT, step: 0, cheer: 0, hop: 0 }
  }
  // 7. よこに ほる(右へ すすむ)
  if (t < DIG_H_END) {
    const q = span(t, TURN_B_END, DIG_H_END - 0.15)
    const w = span(t, TURN_B_END, TURN_B_END + 0.25) * (1 - span(t, DIG_H_END - 0.3, DIG_H_END))
    return { x: H_FEET_X0 + q * H_LINE_LEN, y: H_FEET_Y0 - q * H_LINE_RISE, view: 'side', sx: 1, mood: 'focus', lift: NO_LIFT * (1 - w) + digLift(t) * w, step: 0, cheer: 0, hop: 0 }
  }
  const endX = H_FEET_X0 + H_LINE_LEN
  const endY = H_FEET_Y0 - H_LINE_RISE
  // 8. こちらを むく
  if (t < TURN_C_END) {
    const p = span(t, DIG_H_END, TURN_C_END)
    const turned = p < 0.5 ? { view: 'side' as const, sx: 1 - 2 * p } : { view: 'front' as const, sx: 2 * p - 1 }
    return { x: endX, y: endY, ...turned, mood: p < 0.5 ? 'focus' : 'happy', lift: NO_LIFT, step: 0, cheer: 0, hop: 0 }
  }
  // 9. 大よろこび(くわを かかげて ぴょんぴょん)
  const cheer = span(t, TURN_C_END, TURN_C_END + 0.3, easeOut)
  const hop = Math.abs(Math.sin((t - TURN_C_END) * Math.PI * 2 * 1.3)) * 3
  return { x: endX, y: endY, view: 'front', sx: 1, mood: 'happy', lift: NO_LIFT + (2 - NO_LIFT) * cheer, step: 0, cheer, hop }
}

/* ───────── かざり ───────── */

/** 足もとの みずの わ。みずの 上(あぜ みち いがい)を すすむとき だけ */
function Ripples({ t, x, y, show }: { readonly t: number; readonly x: number; readonly y: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <ellipse key={offset} cx={x} cy={y} rx={2.5 + p * 8} ry={1 + p * 3} opacity={(1 - p) * 0.8} />
      })}
    </g>
  )
}

/** くわが 土を うつ ときの 土けむり */
function Dust({ x, y, lift, show }: { readonly x: number; readonly y: number; readonly lift: number; readonly show: number }) {
  const k = Math.max(0, 1 - lift * 2.4)
  if (show <= 0 || k <= 0) return null
  return (
    <g fill={SOIL} opacity={show * k}>
      {[-1, 0, 1].map((i) => (
        <circle key={i} cx={x + i * 2.4 * (1.6 - k)} cy={y - 1 - (1 - k) * 4 - Math.abs(i) * 0.8} r={0.9 + (1 - k) * 0.4} />
      ))}
    </g>
  )
}

/** あせの しずく(こまって あるく間) */
function Sweat({ t, x, y, show }: { readonly t: number; readonly x: number; readonly y: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -1.8 Q1.5 0.4 0 1.5 Q-1.5 0.4 0 -1.8 Z" fill="#7cc4f2" transform={`translate(${x + 5 + p * 3} ${y - 24 + p * 7}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 「そうだ！」の ふきだし。中に、4つに わけた たんぼ。 */
function IdeaBubble({ t }: SceneProps) {
  const pop = Math.max(0, span(t, 2.55, 2.95, backOut))
  const show = during(t, 2.55, 3.9, 0.2)
  if (pop <= 0 || show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx="63" cy="9" r="1.3" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <circle cx="67.4" cy="11" r="2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <Layer scale={pop} origin={[81, 13]}>
        <ellipse cx="81" cy="13" rx="14.5" ry="10.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <rect x="73" y="7" width="16" height="12" rx="1" fill={WATER} stroke={SOIL} strokeWidth="1.4" />
        <path d="M81 7 V19 M73 13 H89" stroke={SOIL} strokeWidth="1.4" />
      </Layer>
    </g>
  )
}

/** はじめに ひゅんと とんでいく 小鳥(よこむき) */
function Bird({ t }: SceneProps) {
  const p = span(t, 0.05, 1.15)
  if (p <= 0 || p >= 1) return null
  const x = -8 + p * 126
  const y = 9 + Math.sin(p * 9) * 1.6
  const flap = wave(t, 0.18) * 26
  return (
    <Layer x={x} y={y}>
      <path d="M-3.6 0.4 l-3.2 -1.4 l1.2 2.4 Z" fill="#c4743f" />
      <ellipse cx="0" cy="0" rx="3.6" ry="2.4" fill="#e8955a" />
      <circle cx="3" cy="-1.2" r="1.9" fill="#e8955a" />
      <path d="M4.8 -1.2 l2 0.5 l-2 0.7 Z" fill="#f2b632" />
      <circle cx="3.5" cy="-1.5" r="0.45" fill={EYE} />
      <Layer rotate={flap} origin={[-0.4, -0.8]}>
        <path d="M-1.8 -0.8 Q0 -4.6 3 -1 Q0.6 0.4 -1.8 -0.8 Z" fill="#c4743f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const f = farmerState(t)
  // あぜの ひろがり: まず まわり、つぎに まんなか(のうふが ほった ぶんだけ)
  const topRight = span(t, 0.1, 0.75, easeOut)
  const left = span(t, 0.1, 0.55, easeOut)
  const bottom = span(t, 0.35, 0.85, easeOut)
  const vHead = TOP_BANK_Y + FRONT_REACH * S + (f.y - TOP_BANK_Y) * 1
  const vDug = t < IDEA_END ? 0.1 : t < DIG_V_END ? Math.max(0.1, (vHead - 29) / (V_HEAD_END - 29)) : 1
  const hHead = f.x + SIDE_REACH * S
  const hDug = t < TURN_B_END ? 0 : t < DIG_H_END ? Math.max(0.01, (hHead - H_LINE_X0) / H_LINE_LEN) : 1
  const inWater = f.y > TOP_BANK_Y + 2 && (t < DIG_H_END || t > TURN_C_END)
  const rippleShow = inWater && t < TURN_C_END + 0.2 ? span(t, TURN_A_END - 0.3, TURN_A_END - 0.1) + (t < TURN_A_END ? (t >= IDEA_END ? 1 : 0) : 0) : 0
  const diggingNow = (t >= IDEA_END + 0.2 && t < DIG_V_END - 0.2) || (t >= TURN_B_END + 0.2 && t < DIG_H_END - 0.2)
  const bladeX = f.view === 'front' ? f.x : f.x + SIDE_REACH * S
  const bladeY = f.view === 'front' ? f.y + FRONT_REACH * S : f.y + 0.7
  const dustLift = diggingNow ? digLift(t) : 1
  const appear = span(t, FIELD_DONE - 0.1, FIELD_DONE + 0.1)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Paddy t={t} />
        <Seedlings t={t} />
        <Bank n={1} width={5} to={left} />
        <Bank n={2} width={5.4} to={topRight} />
        <Bank n={5} width={5} to={bottom} />
        <Bank n={3} width={4.4} to={vDug} />
        <Bank n={4} width={4.4} to={hDug} />
        <Bird t={t} />
        <Ripples t={t} x={f.x} y={f.y - 0.4} show={rippleShow > 0 ? Math.min(1, rippleShow) * appear : 0} />
        <Dust x={bladeX} y={bladeY} lift={dustLift} show={diggingNow ? 1 : 0} />
        <Layer opacity={appear}>
          <Layer x={f.x} y={f.y - f.hop} scaleX={S * f.sx} scaleY={S}>
            <Farmer view={f.view} mood={f.mood} lift={f.lift} step={f.step} cheer={f.cheer} />
          </Layer>
          <Sweat t={t} x={f.x} y={f.y} show={during(t, FIELD_DONE + 0.2, WALK_IN_END + 0.3, 0.2)} />
        </Layer>
        <IdeaBubble t={t} />
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
    { at: 0, label: '四角い たんぼが できる', sound: 'pop' },
    { at: FIELD_DONE, label: 'のうふが あるいてくる。ひろくて こまった' },
    { at: WALK_IN_END, label: 'そうだ！ 4つに わけよう', sound: 'pop' },
    { at: IDEA_END, label: 'くわで、たてに あぜみちを ほる' },
    { at: TURN_B_END, label: 'よこにも あぜみちを ほる' },
    { at: DIG_H_END, label: '4つに くぎれた！ 大よろこび。苗が そだつ', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '田 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
