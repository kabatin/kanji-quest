/*
 * 玉(たま): きれいな 石を ひもで つないで、点を ひとつ つけて めじるし。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … ひもに つないだ いちばん上の 石
 *   2画目(丨)  … 石を とおした ひも(木の えだ から ぶらさがる)
 *   3画目(一)  … まんなかの 石
 *   4画目(一)  … いちばん下の 大きな 石
 *   5画目(丶)  … 石の よこに さげた ふだ に ぬる、赤い 点(めじるし)
 *
 * ながれ
 *   木の えだ から ひもが さがり、大きな 石が ひとつ → 女の子が あるいてきて
 *   「ひとつだけ じゃ さびしいな」と ひもを 見上げる
 *   → はこ(バケツ)の 中で きれいな 石が きらり。「わあ」と 見つける
 *   → 石を 1こずつ はこから とり出して、ひもに つないでいく(まんなか → 上)
 *   → ふでで 赤い 点を ぬって 「めじるし」 → にっこり
 *   → ほね が ひかって、絵が うすくなり、字「玉」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の さきを きめて、かた と ひじ を 計算で つなぐ)。
 *   くび は みじかく、あし は こし から。石を もつときは、手で はしを つかむ。
 */
import type { ReactNode } from 'react'
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '玉'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const RIBBON = '#ffd24a'
const DRESS = '#f283a0'
const DRESS_DARK = '#d96a8a'
const DRESS_FAR = '#c85f7e'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const JADE = '#4fcf9f'
const JADE_DARK = '#33b58a'
const JADE_LIGHT = '#b8f5de'
const STRING = '#d8a45c'
const TAG = '#f3dfb0'
const TAG_SHADE = '#e0c88e'
const PAINT = '#e8453c'
const PAIL = '#b9824f'
const PAIL_DARK = '#8c5b3c'
const PAIL_INSIDE = '#5d3a22'
const BIRD = '#6fb6f0'
const BIRD_DARK = '#4a93d6'

/** くぎり の時間(秒) */
const WALK_FROM = 0.3
const WALK_TO = 1.1
/** 石が ひとつだけ で さびしそう */
const WISH = 1.1
/** はこの中の 石を 見つける */
const FIND = 1.9
/** まんなかの石を はこ から とる・ひもに つなぐ */
const GRAB_A = 2.95
const RELEASE_A = 3.95
/** 上の石 */
const GRAB_B = 4.5
const RELEASE_B = 5.5
/** ふで を とって 点を ぬる */
const GRAB_BRUSH = 6.1
const PAINT_FROM = 6.4
const PAINT_TO = 7.0
const BRUSH_BACK = 7.7
const INK = 8.0
const DONE = 10.7
const DURATION = 11.3

/* ───────── 場所の きまり(字の画に そろえる) ───────── */

/** ひもの x。2画目の 線 */
const STRING_X = 54
/** えだ の高さ(ひもの うえの はし) */
const BRANCH_Y = 12.5
/** 石の まんなかの 高さ と 長さ(1・3・4画目) */
const TOP_Y = 21
const MID_Y = 54.5
const BOTTOM_Y = 88
const TOP_LENGTH = 50
const MID_LENGTH = 50
const BOTTOM_LENGTH = 54
/** ふだ(5画目の 点を ぬる 板)と、ひもを むすぶ ところ */
const TAG_HANG: Pt = [77.5, 58.5]

type Pt = readonly [number, number]

/** 女の子の こし の x と y(ここを じくに 体を かたむける) */
const GX = 96
const HIP_Y = 70
const SHOULDER_Y = 43
/** うで の 片はんぶん の長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 19

/** 手の おき場所 */
const REST_HAND: Pt = [96, 77]
const REST_FAR_HAND: Pt = [100.5, 77]
/** バケツから 石を つかむ ところ */
const PAIL_HAND: Pt = [84, 76]
/** ふで が たっている ところ(にぎる ところ) */
const BRUSH_GRIP: Pt = [90, 72]
/** 石の はしを もつので、手 は 石の 右はし。ひもに 石の まんなか が 来るとき の手 */
const MID_HAND: Pt = [STRING_X + MID_LENGTH / 2, MID_Y]
const TOP_HAND: Pt = [STRING_X + TOP_LENGTH / 2, TOP_Y]
/** 5画目の はじまり・おわり(ふでの さき)と、にぎる 手との ずれ */
const DOT_FROM: Pt = [72, 64]
const DOT_TO: Pt = [83.3, 76]
const BRUSH_REST_VEC: Pt = [-3, 8.5]
const BRUSH_PAINT_VEC: Pt = [-5, 9.5]

/* ───────── 動きの 道具 ───────── */

type Keys = readonly (readonly [number, number])[]
type PointKeys = readonly (readonly [number, Pt])[]

/** (時間, 値) の ならびを なめらかに つなぐ */
function keyed(t: number, keys: Keys): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (t <= first[0]) return first[1]
  if (t >= last[0]) return last[1]
  const i = keys.findIndex(([at]) => at > t)
  const [from, a] = keys[i - 1]
  const [to, b] = keys[i]
  return a + (b - a) * span(t, from, to, easeInOut)
}

function keyedPoint(t: number, keys: PointKeys): Pt {
  return [keyed(t, keys.map(([at, p]) => [at, p[0]] as const)), keyed(t, keys.map(([at, p]) => [at, p[1]] as const))]
}

/** 手 の うごき。バケツ → ひも(まんなか) → バケツ → ひも(うえ) → ふで → 点 → もどす */
const HAND_KEYS: PointKeys = [
  [0, REST_HAND],
  [2.5, REST_HAND],
  [GRAB_A, PAIL_HAND],
  [3.0, PAIL_HAND],
  [3.8, MID_HAND],
  [RELEASE_A, MID_HAND],
  [4.4, PAIL_HAND],
  [GRAB_B, PAIL_HAND],
  [5.3, TOP_HAND],
  [RELEASE_B, TOP_HAND],
  [6.0, BRUSH_GRIP],
  [GRAB_BRUSH, BRUSH_GRIP],
  [PAINT_FROM, [DOT_FROM[0] - BRUSH_PAINT_VEC[0], DOT_FROM[1] - BRUSH_PAINT_VEC[1]]],
  [PAINT_TO, [DOT_TO[0] - BRUSH_PAINT_VEC[0], DOT_TO[1] - BRUSH_PAINT_VEC[1]]],
  [7.2, [DOT_TO[0] - BRUSH_PAINT_VEC[0], DOT_TO[1] - BRUSH_PAINT_VEC[1]]],
  [BRUSH_BACK, BRUSH_GRIP],
  [7.8, BRUSH_GRIP],
  [8.3, REST_HAND],
]

/** あたまの かたむき(度)。+ で あごが 上がる(上を見る)、- で 下を見る */
const HEAD_KEYS: Keys = [
  [0, 0],
  [WISH, 0],
  [1.45, 14],
  [FIND, 14],
  [2.3, -14],
  [GRAB_A, -14],
  [3.6, 4],
  [RELEASE_A, 4],
  [4.4, -10],
  [GRAB_B, -10],
  [5.3, 8],
  [RELEASE_B, 8],
  [6.0, -8],
  [GRAB_BRUSH, -8],
  [PAINT_FROM, -2],
  [PAINT_TO, -8],
  [7.3, 0],
  [BRUSH_BACK, 0],
]

type Mood = 'plain' | 'wish' | 'wow' | 'focus' | 'happy'

function moodAt(t: number): Mood {
  if (t < WISH) return 'plain'
  if (t < FIND) return 'wish'
  if (t < GRAB_A) return 'wow'
  if ((t >= RELEASE_A && t < 4.4) || (t >= RELEASE_B && t < 6.0) || t >= 7.3) return 'happy'
  return 'focus'
}

/** うで を かた・ひじ・手 で つなぐ。手の さきから ひじ の場所を 計算する */
type ArmShape = { readonly elbow: Pt; readonly hand: Pt }

function armShape(shoulder: Pt, target: Pt): ArmShape {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Pt = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const bulge = Math.sqrt(Math.max(ARM_PART ** 2 - (reach / 2) ** 2, 0))
  const mid: Pt = [(shoulder[0] + hand[0]) / 2, (shoulder[1] + hand[1]) / 2]
  const a: Pt = [mid[0] + uy * bulge, mid[1] - ux * bulge]
  const b: Pt = [mid[0] - uy * bulge, mid[1] + ux * bulge]
  // ひじ は 下がわ に まがる。ほとんど おなじ高さ なら、まえ(左)がわ
  const pick = Math.abs(a[1] - b[1]) < 1.5 ? (a[0] < b[0] ? a : b) : a[1] > b[1] ? a : b
  return { elbow: [Math.min(pick[0], 104.5), pick[1]], hand }
}

/* ───────── 景色 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[99, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="98.3" y="0.6" width="1.4" height="3" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 99 9)`} />
        ))}
      </Layer>
      <circle cx="99" cy="9" r={4.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 0.8} 0)`}>
        <ellipse cx="68" cy="37" rx="7" ry="3.2" />
        <ellipse cx="72.5" cy="35" rx="4.6" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[22, 46, 70, 103].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 左の 木。みき から えだ が のびて、ひもが さがる */
function Tree({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  const sway = wave(t, 3.4) * 1.1
  return (
    <>
      <ellipse cx="8" cy="97.6" rx={11 * grow} ry="2.4" fill="#000000" opacity="0.1" />
      <Layer scaleY={grow} origin={[8, 98]}>
        <path d="M7.5 99 C7 70 6.5 44 8.6 26" fill="none" stroke={BARK} strokeWidth="9" strokeLinecap="round" />
        <path d="M5.4 80 q1.4 -5 0.2 -11 M9.6 58 q-1.4 -5 0 -10" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
        {/* えだ: ひもの うえの はし(1画目の すぐ上)まで */}
        <path d="M8 28 C14 12 34 8 58 12.5" fill="none" stroke={BARK} strokeWidth="4.4" strokeLinecap="round" />
      </Layer>
      <Layer scale={span(t, 0.25, 0.8, backOut)} rotate={sway} origin={[11, 24]}>
        <circle cx="6" cy="16" r="9" fill={LEAF_DARK} />
        <circle cx="15" cy="10" r="10" fill={LEAF_DARK} />
        <circle cx="21" cy="16.5" r="6.6" fill={LEAF_DARK} />
        <circle cx="8" cy="14" r="7.5" fill={LEAF} />
        <circle cx="15" cy="9" r="8" fill={LEAF} />
        <circle cx="20.5" cy="15" r="5" fill={LEAF} />
        <circle cx="11" cy="7.5" r="3.4" fill={LEAF_LIGHT} />
        <circle cx="38" cy="9.4" r="4" fill={LEAF_DARK} />
        <circle cx="37.4" cy="8.4" r="2.8" fill={LEAF} />
      </Layer>
    </>
  )
}

/** えだ に とまる 小鳥。ひとり ごと みたいに くびを かしげる。 */
function Bird({ t }: SceneProps) {
  const tilt = wave(t, 1.6) * 4
  const hop = Math.max(0, wave(t, 2.2, 0.4) - 0.7) * 1.8
  return (
    <Layer opacity={span(t, 0.5, 0.9)} y={-hop}>
      <path d="M34 4.8 l5 -1.4 l-1.4 3.4 Z" fill={BIRD_DARK} />
      <ellipse cx="31" cy="4.4" rx="3.6" ry="2.8" fill={BIRD} />
      <Layer rotate={tilt} origin={[29.4, 3.6]}>
        <circle cx="28.6" cy="2.2" r="2.2" fill={BIRD} />
        <path d="M26.7 2.2 l-2.2 0.6 l2.1 0.9 Z" fill="#f2b632" />
        <circle cx="27.9" cy="1.8" r="0.5" fill="#2b2b2b" />
      </Layer>
      <path d="M30.2 7 v1 M32.2 7 v1" stroke="#c97a3a" strokeWidth="0.6" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── 石・ひも・ふだ ───────── */

/** きれいな 石(ひすい)。まんなか が 原点、長さ と 色の面で かく */
function Jade({ length }: { readonly length: number }) {
  const half = length / 2
  return (
    <>
      <rect x={-half} y={-4} width={length} height={8} rx={4} fill={JADE_DARK} />
      <rect x={-half} y={-4} width={length} height={5.6} rx={2.8} fill={JADE} />
      <rect x={-half + 3.4} y={-2.8} width={length * 0.4} height={1.5} rx={0.75} fill={JADE_LIGHT} />
    </>
  )
}

/** 石が ひもに つながった しゅんかんの ぶるっ(ゆれて、だんだん おさまる) */
function swingAngle(t: number): number {
  return [RELEASE_A, RELEASE_B].reduce((sum, at) => {
    const dt = t - at
    return dt < 0 ? sum : sum + 2.4 * Math.exp(-2.2 * dt) * Math.sin(dt * 8)
  }, 0)
}

/** ふだ(5画目の 点を ぬる 板)。まんなかの 石の はし から さがる */
function Tag() {
  return (
    <>
      <path d="M73.6 62 L77.5 58.5 L82.2 62" fill="none" stroke={STRING} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70.5" y="61.5" width="15" height="18" rx="3" fill={TAG_SHADE} />
      <rect x="70.5" y="61.5" width="15" height="16" rx="3" fill={TAG} />
    </>
  )
}

/** 石が 手の中に ある間の 場所と かたむき。手は 石の 右はし を つかむ */
function heldStone(t: number, grab: number, hand: Pt) {
  const angle = mix(t, grab + 0.05, grab + 0.8, -10, 0)
  const rad = (angle * Math.PI) / 180
  return { angle, rad, hand }
}

function HeldStone({ t, grab, hand, length }: { readonly t: number; readonly grab: number; readonly hand: Pt; readonly length: number }) {
  const { angle, rad } = heldStone(t, grab, hand)
  const x = hand[0] - (length / 2) * Math.cos(rad)
  const y = hand[1] - (length / 2) * Math.sin(rad)
  const appear = Math.max(0.01, span(t, grab, grab + 0.2, backOut))
  return (
    <Layer x={x} y={y} rotate={angle} scale={appear}>
      <Jade length={length} />
    </Layer>
  )
}

/** バケツ。中の 石の 上の ほうが 見える */
function Pail({ t }: SceneProps) {
  const glint = during(t, FIND, GRAB_A - 0.1, 0.2)
  return (
    <>
      <ellipse cx="84" cy="97.4" rx="9" ry="1.8" fill="#000000" opacity="0.12" />
      <ellipse cx="84" cy="78" rx="7" ry="1.8" fill={PAIL_INSIDE} />
      {t < GRAB_A && <ellipse cx="81" cy="77.4" rx="3.6" ry="3.6" fill={JADE} />}
      {t < GRAB_B && <ellipse cx="86.2" cy="77.8" rx="3.4" ry="3.2" fill={JADE_DARK} />}
      <path d="M77 78 H91 L89.8 96 Q84 98.4 78.4 96 Z" fill={PAIL} />
      <rect x="77.6" y="82" width="12.8" height="2" fill={PAIL_DARK} />
      <rect x="78" y="90" width="12" height="2" fill={PAIL_DARK} />
      {glint > 0 && (
        <>
          <Star cx={80} cy={72.4} r={3.2 * glint} color="#ffffff" spin={t * 160} />
          <Star cx={87.4} cy={73.4} r={2.4 * glint} color={JADE_LIGHT} spin={-t * 140} />
        </>
      )}
    </>
  )
}

/** ふで の しゅんかんの 位置。にぎった手 から さき が のびる */
function Brush({ hand, vec }: { readonly hand: Pt; readonly vec: Pt }) {
  const tip: Pt = [hand[0] + vec[0], hand[1] + vec[1]]
  // さきの 3わり だけ 赤く そまる
  const split: Pt = [tip[0] - vec[0] * 0.3, tip[1] - vec[1] * 0.3]
  return (
    <>
      <path d={`M${hand[0]} ${hand[1]} L${split[0]} ${split[1]}`} stroke="#c98b4f" strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M${split[0]} ${split[1]} L${tip[0]} ${tip[1]}`} stroke={PAINT} strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
}

/* ───────── 女の子 ───────── */

function Face({ mood }: { readonly mood: Mood }) {
  const eye = '#2b2b2b'
  const mouth = '#b9483f'
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'plain' && (
        <>
          <circle cx="25.4" cy="25.6" r="1.15" fill={eye} />
          <path d="M23.4 29.6 Q24.8 30.8 26.4 29.8" fill="none" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'wish' && (
        <>
          <path d="M23.4 23.9 l3 -1.3" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.2" r="1.15" fill={eye} />
          <path d="M23.6 30.8 Q25 29.4 26.6 30.6" fill="none" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'wow' && (
        <>
          <path d="M23.4 22.6 Q25.2 21.2 27 22.6" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.8" fill={eye} />
          <circle cx="24.9" cy="25" r="0.55" fill="#ffffff" />
          <ellipse cx="24.6" cy="30.4" rx="1.3" ry="1.8" fill={mouth} />
        </>
      )}
      {mood === 'focus' && (
        <>
          <path d="M23.8 23.4 h3.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.8" r="1.15" fill={eye} />
          <path d="M23.6 30 Q24.8 30.8 26 30" fill="none" stroke={mouth} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke={eye} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M23 29.2 Q25 32.8 27.2 29.2 Z" fill={mouth} />
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly mood: Mood
  readonly lean: number
  readonly headTilt: number
  readonly stride: number
  readonly nearHand: Pt
  readonly farHand: Pt
  /** 手に もっている もの(石・ふで)。手の うしろ、うでの まえ に かく */
  readonly held: ReactNode
}

function Girl({ mood, lean, headTilt, stride, nearHand, farHand, held }: GirlProps) {
  const rad = (lean * Math.PI) / 180
  // かたは こし を じくに、体と いっしょに かたむく
  const shoulder: Pt = [GX + (HIP_Y - SHOULDER_Y) * Math.sin(rad), HIP_Y - (HIP_Y - SHOULDER_Y) * Math.cos(rad)]
  const near = armShape(shoulder, nearHand)
  const far = armShape([shoulder[0] + 1.2, shoulder[1] + 0.3], farHand)
  return (
    <>
      {/* むこうの うで */}
      <path d={`M${shoulder[0] + 1.2} ${shoulder[1] + 0.3} L${far.elbow[0]} ${far.elbow[1]}`} stroke={DRESS_FAR} strokeWidth="5.4" strokeLinecap="round" fill="none" />
      <path d={`M${far.elbow[0]} ${far.elbow[1]} L${far.hand[0]} ${far.hand[1]}`} stroke={SKIN_SHADE} strokeWidth="4.2" strokeLinecap="round" fill="none" />
      <circle cx={far.hand[0]} cy={far.hand[1]} r="3" fill={SKIN_SHADE} />
      <g transform={`translate(${GX} 0)`}>
        {/* あし: こし から ふる。左むき(つま先 が 左) */}
        <Layer rotate={-stride * 18} origin={[0, 68]}>
          <rect x="0.6" y="70" width="4.6" height="24.4" rx="2.3" fill={SKIN_SHADE} />
          <ellipse cx="1.4" cy="94.6" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
        <Layer rotate={stride * 18} origin={[0, 68]}>
          <rect x="-5.2" y="70" width="4.6" height="24.4" rx="2.3" fill={SKIN} />
          <ellipse cx="-4.4" cy="94.6" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
        <path d="M-6 63 L6 63 L10.5 79 Q0 82.5 -10.5 79 Z" fill={DRESS} />
        <path d="M-9.6 77.4 Q0 80.6 9.6 77.4" fill="none" stroke={DRESS_DARK} strokeWidth="1.4" strokeLinecap="round" />
        {/* うわ体: こし を じくに かたむく */}
        <Layer rotate={lean} origin={[0, HIP_Y]}>
          <rect x="-2.3" y="33" width="4.6" height="9" rx="2.2" fill={SKIN_SHADE} />
          <rect x="-5.7" y="40" width="11.4" height="26" rx="5.2" fill={DRESS} />
          <path d="M-5.4 60 h10.8" stroke={DRESS_DARK} strokeWidth="1.6" strokeLinecap="round" />
          <Layer rotate={headTilt} origin={[0, 35]}>
            <g transform="translate(-30.7 2.4)">
              {/* むすんだ かみ(うしろ = 右) */}
              <ellipse cx="39.2" cy="28" rx="3" ry="4.2" fill={HAIR} />
              <circle cx="38.6" cy="23.6" r="1.7" fill={RIBBON} />
              <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
              <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
              <Face mood={mood} />
            </g>
          </Layer>
        </Layer>
      </g>
      {/* てまえの うで: かた → ひじ → 手 */}
      <path d={`M${shoulder[0]} ${shoulder[1]} L${near.elbow[0]} ${near.elbow[1]}`} stroke={DRESS_DARK} strokeWidth="5.6" strokeLinecap="round" fill="none" />
      <path d={`M${near.elbow[0]} ${near.elbow[1]} L${near.hand[0]} ${near.hand[1]}`} stroke={SKIN} strokeWidth="4.4" strokeLinecap="round" fill="none" />
      {held}
      <circle cx={near.hand[0]} cy={near.hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

/** ひもを 見上げて「ふう」 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 1.35, FIND, 0.2)
  if (show <= 0) return null
  const p = span(t, 1.35, FIND, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={85 - p * 8} cy={33 - p * 5} rx={2.6 + p * 2.2} ry={1.8 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={88.5 - p * 5} cy={34 - p * 2} rx={1.3 + p * 0.8} ry={1 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 石が ひもに つながった しゅんかんの きらり */
function Twinkle({ t, at, cx, cy }: { readonly t: number; readonly at: number; readonly cx: number; readonly cy: number }) {
  const p = span(t, at, at + 0.7)
  if (p <= 0 || p >= 1) return null
  const s = Math.sin(p * Math.PI)
  return (
    <>
      <Star cx={cx - 22} cy={cy - 6} r={3.2 * s} color="#ffffff" spin={p * 120} />
      <Star cx={cx + 8} cy={cy - 7} r={2.6 * s} color={JADE_LIGHT} spin={-p * 120} />
      <Star cx={cx + 24} cy={cy + 5} r={2.2 * s} color="#ffffff" spin={p * 90} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // あるいてくる: 右から。あしを ふって 体が 上下する
  const walking = 1 - span(t, WALK_TO - 0.15, WALK_TO)
  const stride = t < WALK_FROM ? 0 : Math.sin((t - WALK_FROM) * Math.PI * 2 * 2) * walking
  const walkX = mix(t, WALK_FROM, WALK_TO, 32, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2

  // 手: あるくときは ふり、ほかは きめた場所へ
  const keyedHand = keyedPoint(t, HAND_KEYS)
  const nearHand: Pt = [keyedHand[0] + stride * 4, keyedHand[1]]
  const farHand: Pt = [REST_FAR_HAND[0] - stride * 4, REST_FAR_HAND[1]]
  // バケツ・ふで に 手を のばすとき、すこし 体を まえへ かたむける
  const nearest = Math.min(Math.hypot(nearHand[0] - PAIL_HAND[0], nearHand[1] - PAIL_HAND[1]), Math.hypot(nearHand[0] - BRUSH_GRIP[0], nearHand[1] - BRUSH_GRIP[1]))
  const lean = -8 * (1 - clamp01(nearest / 18))
  const headTilt = keyed(t, HEAD_KEYS)

  // ふで: ふだ の 点を ぬる間 だけ、手に もつ
  const brushHeld = t >= GRAB_BRUSH && t < BRUSH_BACK + 0.1
  const brushVec: Pt = brushHeld
    ? [
        mix(t, GRAB_BRUSH, PAINT_FROM, BRUSH_REST_VEC[0], BRUSH_PAINT_VEC[0]) + mix(t, 7.2, BRUSH_BACK, 0, BRUSH_REST_VEC[0] - BRUSH_PAINT_VEC[0]),
        mix(t, GRAB_BRUSH, PAINT_FROM, BRUSH_REST_VEC[1], BRUSH_PAINT_VEC[1]) + mix(t, 7.2, BRUSH_BACK, 0, BRUSH_REST_VEC[1] - BRUSH_PAINT_VEC[1]),
      ]
    : BRUSH_REST_VEC
  const brushHand: Pt = brushHeld ? nearHand : BRUSH_GRIP

  const held = (
    <>
      {t >= GRAB_A && t < RELEASE_A && <HeldStone t={t} grab={GRAB_A} hand={nearHand} length={MID_LENGTH} />}
      {t >= GRAB_B && t < RELEASE_B && <HeldStone t={t} grab={GRAB_B} hand={nearHand} length={TOP_LENGTH} />}
      {brushHeld && <Brush hand={brushHand} vec={brushVec} />}
    </>
  )

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const dot = span(t, PAINT_FROM, PAINT_TO, easeInOut)
  const tagIn = span(t, RELEASE_A + 0.05, RELEASE_A + 0.4, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <Bird t={t} />

        {/* ひも と 石(まとめて えだ から ぶらさがり、つながるたびに ぶるっと ゆれる) */}
        <Layer rotate={swingAngle(t)} origin={[STRING_X, BRANCH_Y]}>
          <Layer x={STRING_X} y={BOTTOM_Y} opacity={span(t, 0.3, 0.7)}>
            <Jade length={BOTTOM_LENGTH} />
          </Layer>
          {t >= RELEASE_A && (
            <Layer x={STRING_X} y={MID_Y}>
              <Jade length={MID_LENGTH} />
            </Layer>
          )}
          {t >= RELEASE_B && (
            <Layer x={STRING_X} y={TOP_Y}>
              <Jade length={TOP_LENGTH} />
            </Layer>
          )}
          <path d={`M${STRING_X} ${BRANCH_Y} V${BOTTOM_Y + 4}`} stroke={STRING} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx={STRING_X} cy={BRANCH_Y} r="2" fill="none" stroke={STRING} strokeWidth="1.1" />
          <circle cx={STRING_X} cy={BOTTOM_Y + 4.4} r="1.7" fill={STRING} />
        </Layer>

        {/* ふで: つかむ まえは、バケツの中に たっている */}
        {!brushHeld && t < BRUSH_BACK + 0.1 && <Brush hand={BRUSH_GRIP} vec={BRUSH_REST_VEC} />}
        {t >= BRUSH_BACK + 0.1 && <Brush hand={BRUSH_GRIP} vec={BRUSH_REST_VEC} />}
        <Pail t={t} />
        {/* ふだ は バケツより 手前(ひもと いっしょに ゆれる) */}
        {t >= RELEASE_A && (
          <Layer rotate={swingAngle(t)} origin={[STRING_X, BRANCH_Y]}>
            <Layer scale={tagIn} origin={TAG_HANG}>
              <Tag />
              <Bone char={CHAR} n={5} color={PAINT} width={3.6} to={dot} />
            </Layer>
          </Layer>
        )}

        <Layer x={walkX} y={bob} opacity={span(t, WALK_FROM, WALK_FROM + 0.1)}>
          <ellipse cx={GX} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Girl mood={moodAt(t)} lean={lean} headTilt={headTilt} stride={stride} nearHand={nearHand} farHand={farHand} held={held} />
        </Layer>
        <Sigh t={t} />
        <Twinkle t={t} at={RELEASE_A} cx={STRING_X} cy={MID_Y} />
        <Twinkle t={t} at={RELEASE_B} cx={STRING_X} cy={TOP_Y} />
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
    { at: 0, label: '木の えだ から ひもが さがり、大きな 石が ひとつ', sound: 'pop' },
    { at: WALK_FROM, label: '女の子が あるいてくる' },
    { at: WISH, label: '「ひとつだけ じゃ さびしいな」と 見上げる' },
    { at: FIND, label: 'バケツの中で きれいな 石が きらり', sound: 'pop' },
    { at: GRAB_A, label: '石を ひもに つなぐ(まんなか)' },
    { at: GRAB_B, label: 'もう ひとつ つなぐ(上)' },
    { at: GRAB_BRUSH, label: 'ふでで 赤い 点を ぬって めじるし' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '玉 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
