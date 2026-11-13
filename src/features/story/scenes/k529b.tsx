/*
 * 力(ちから): つちを ほる どうぐ。力を 入れて ほる。
 *
 * ほね(画と絵の対応)
 *   1画目  … どうぐの 持ち手(よこの ぼう)と、そこから 地面へ まがった 先の ぶぶん(2本ある 先の 1本)
 *             持ち手の まがりかど を 子どもが にぎる
 *   2画目  … どうぐの 長い えだ。てっぺん から 左下の 先まで(もう1本の 先)
 *   (どうぐ = 2本の 先が ある、木の ほりぼう。先が 地面に さされば、字の形になる)
 *
 * ながれ
 *   かたい 地面。子どもが どうぐを かついで やってくる(気合いじゅうぶん)
 *   → ガツン! かたくて はねかえされる。もういちど…やっぱり だめ。手が しびれて つかれる
 *   → ふーっと 息を すって、体ごと のしかかって 力を ぜんぶ 入れる(顔が まっか、あせ、ぐぐぐ)
 *   → ぼこっ! 先が 土に ささって 土が とびちる。子どもは にっこり
 *   → ほね が ひかって、絵が うすくなり、字「力」が のこる
 *
 * 人と どうぐは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。あし も こし・ひざ・足くび の じゅんに つながる。
 *   どうぐは かたい ぼうなので、まがったり のびたり しない。子どもの手に ついて 上げ下げ されるだけ。
 *   字の形になるのは、どうぐが 地面に ささった さいごの しゅんかん。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '力'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ef7d57'
const SHIRT_DARK = '#d1613e'
const SHIRT_FAR = '#b9502f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#5e3a22'
const SUN = '#ffd24a'
const HILL = '#e2f2d2'
const CRUST = '#e8cd9b'
const SOIL = '#c28f5c'
const SOIL_DARK = '#8f6240'
const SWEAT = '#7cc4f2'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const COME = 0.5
const HIT_1 = 1.3
const HIT_2 = 2.2
/** ふーっと 息を すう / 力を いれはじめる / ぼこっ と ささる */
const BREATH = 3.5
const PUSH = 3.9
const POP = 4.9
const INK = 6.3
const DONE = 8.9
const DURATION = 9.5

/** 地面の おもて の 高さ */
const SURFACE = 87.5
/** どうぐの 2本の 先(1画目の おわり・2画目の おわり) */
const TIP_RIGHT: readonly [number, number] = [56, 89]
const TIP_LEFT: readonly [number, number] = [13.4, 89.7]
/** どうぐを にぎる ところ(1画目の まがりかど)。てまえの手 と むこうの手 */
const GRIP: readonly [number, number] = [86.9, 38.6]
const GRIP_FAR: readonly [number, number] = [86.4, 44.8]
/** どうぐを いちばん 高く上げたときの 高さ */
const RAISED = 8

type Pt = readonly [number, number]

/* ───────── 体の つながり(かた→ひじ→手 / こし→ひざ→足くび) ───────── */

/**
 * 2本の ほね(おなじ長さ)で from と to を つなぐ ときの まんなかの ふし(ひじ・ひざ)。
 * bend の むき に ふしが 出る。とどかない ときは まっすぐ のばす。
 */
function twoBone(from: Pt, to: Pt, len: number, bend: Pt): Pt {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dist = Math.hypot(dx, dy) || 1
  const reach = Math.min(dist, 2 * len - 0.01)
  const h = Math.sqrt(Math.max(0, len * len - (reach / 2) ** 2))
  const ux = dx / dist
  const uy = dy / dist
  const side = -uy * bend[0] + ux * bend[1] >= 0 ? 1 : -1
  return [from[0] + (ux * reach) / 2 - uy * h * side, from[1] + (uy * reach) / 2 + ux * h * side]
}

/** 点 p を、center を じくに deg 度 回した 点 */
function rotatePoint(p: Pt, center: Pt, deg: number): Pt {
  const rad = (deg * Math.PI) / 180
  const dx = p[0] - center[0]
  const dy = p[1] - center[1]
  return [center[0] + dx * Math.cos(rad) - dy * Math.sin(rad), center[1] + dx * Math.sin(rad) + dy * Math.cos(rad)]
}

/* ───────── 子どもの 体の 場所 ───────── */

const HIP: Pt = [98, 64]
const SHOULDER_NEAR: Pt = [98.3, 42]
const SHOULDER_FAR: Pt = [99.1, 42.5]
const HIP_NEAR: Pt = [96.4, 64]
const HIP_FAR: Pt = [99.6, 64]
/** 足くび(地面に ついている)。まえの足は 左、うしろの足は 右 */
const ANKLE_NEAR: Pt = [93.5, 86.4]
const ANKLE_FAR: Pt = [101.5, 86.4]
const ARM_BONE = 8.6
const LEG_BONE = 11.6

type Mood = 'bold' | 'ouch' | 'tired' | 'effort' | 'happy'

function Limb({ from, joint, to, color, width }: { readonly from: Pt; readonly joint: Pt; readonly to: Pt; readonly color: string; readonly width: number }) {
  return <path d={`M${from[0]} ${from[1]} L${joint[0]} ${joint[1]} L${to[0]} ${to[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

function Leg({ hip, ankle, color, dy }: { readonly hip: Pt; readonly ankle: Pt; readonly color: string; readonly dy: number }) {
  const top: Pt = [hip[0], hip[1] + dy]
  // ひざは まえ(左)へ まがる
  const knee = twoBone(top, ankle, LEG_BONE, [-1, 0.2])
  return (
    <>
      <Limb from={top} joint={knee} to={ankle} color={color} width={6.4} />
      <ellipse cx={ankle[0] - 1.8} cy={ankle[1] + 1.7} rx="4.8" ry="2.6" fill={SHOE} />
    </>
  )
}

function Arm({ shoulder, hand, color }: { readonly shoulder: Pt; readonly hand: Pt; readonly color: string }) {
  // ひじは 下へ たれる
  const elbow = twoBone(shoulder, hand, ARM_BONE, [0.15, 1])
  return (
    <>
      <Limb from={shoulder} joint={elbow} to={hand} color={color} width={5.2} />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

/** かお。左むき。mood で 目・まゆ・口 を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  const dark = '#2b2b2b'
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff7d7d" opacity={mood === 'effort' ? 0.9 : 0.55} />
      {mood === 'bold' && (
        <>
          <path d="M23.2 22.6 l3.6 1.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.8" r="1.25" fill={dark} />
          <path d="M23.4 30.2 h2.8" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'ouch' && (
        <>
          <path d="M23.8 24 L26.6 25.6 L23.8 27.2" fill="none" stroke={dark} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="24.4" cy="30.6" rx="1.5" ry="2" fill={MOUTH} />
        </>
      )}
      {mood === 'tired' && (
        <>
          <path d="M23.6 24.6 l3 -1.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="26.4" r="1.1" fill={dark} />
          <path d="M24 25.4 h2.8" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M23.4 31.2 Q24.9 29.6 26.4 31.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M23.6 22.8 l3.2 1.2" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M23.8 24.6 L26.8 26 L23.8 27.4" fill="none" stroke={dark} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="22.4" y="29.4" width="5" height="2.8" rx="1.2" fill="#ffffff" stroke="#7a3b36" strokeWidth="0.8" />
          <path d="M24.9 29.4 v2.8" stroke="#7a3b36" strokeWidth="0.6" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.8 26.4 Q25.4 23.8 27 26.4" fill="none" stroke={dark} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.6 29 Q24.8 34 27.2 29 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  /** こし を 下げた 分(しゃがむ) */
  readonly dy: number
  /** ま上から まえ(左)へ かたむけた 角度。マイナスが まえ */
  readonly lean: number
  readonly mood: Mood
  /** 息で むねが ふくらむ度合い(0〜1) */
  readonly breath: number
  readonly handNear: Pt
  readonly handFar: Pt
  /** どうぐ。あし の上、からだ の うしろに 描く(かおが かくれないように) */
  readonly tool: ReactNode
}

function Child({ dy, lean, mood, breath, handNear, handFar, tool }: ChildProps) {
  // 体を かたむけると、かた も いっしょに うごく
  const place = (p: Pt): Pt => {
    const r = rotatePoint(p, HIP, lean)
    return [r[0], r[1] + dy]
  }
  return (
    <>
      <Leg hip={HIP_FAR} ankle={ANKLE_FAR} color={PANTS_DARK} dy={dy} />
      <Leg hip={HIP_NEAR} ankle={ANKLE_NEAR} color={PANTS} dy={dy} />
      {tool}
      <Arm shoulder={place(SHOULDER_FAR)} hand={handFar} color={SHIRT_FAR} />
      <Layer y={dy}>
        <Layer rotate={lean} origin={HIP}>
          {/* くび: どう の上に みじかく */}
          <rect x="94.4" y="33.5" width="5.2" height="9" rx="2.4" fill={SKIN_SHADE} />
          <Layer scaleX={1 + breath * 0.08} scaleY={1 + breath * 0.02} origin={[98, 66]}>
            <rect x="92" y="39" width="12" height="27" rx="5.5" fill={SHIRT} />
            <path d="M93.6 60.5 h9" stroke={SHIRT_DARK} strokeWidth="1.6" strokeLinecap="round" />
          </Layer>
          {/* あたま */}
          <g transform="translate(66.8 2.6)">
            <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
            <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
            <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <Face mood={mood} />
          </g>
        </Layer>
      </Layer>
      <Arm shoulder={place(SHOULDER_NEAR)} hand={handNear} color={SHIRT_DARK} />
    </>
  )
}

/* ───────── どうぐ(2本の 先の ある ほりぼう) ───────── */

/** どうぐ。にぎる ところ を じく に かたむく(手は うごかない)。画の線が そのまま 木の ぼう */
function Tool({ lift, tilt }: { readonly lift: number; readonly tilt: number }) {
  return (
    <Layer y={-lift} rotate={tilt} origin={GRIP}>
      <Bone char={CHAR} n={2} color={BARK} width={5.2} />
      <Bone char={CHAR} n={1} color={BARK} width={5.2} />
      {/* 土に ささる 先は こい色 */}
      <Bone char={CHAR} n={1} color={BARK_DARK} width={5.2} from={0.94} />
      <Bone char={CHAR} n={2} color={BARK_DARK} width={5.2} from={0.945} />
    </Layer>
  )
}

/** どうぐの 高さ(上へ あげた 分)。はねかえされて、さいごに ぼこっ と ささる */
function toolLift(t: number): number {
  if (t < 1.0) return RAISED
  if (t < HIT_1) return mix(t, 1.0, HIT_1, RAISED, 2, easeIn)
  if (t < 1.55) return mix(t, HIT_1, 1.55, 2, 6, easeOut)
  if (t < 1.9) return mix(t, 1.55, 1.9, 6, RAISED, easeInOut)
  if (t < HIT_2) return mix(t, 1.9, HIT_2, RAISED, 2, easeIn)
  if (t < 2.45) return mix(t, HIT_2, 2.45, 2, 4.5, easeOut)
  if (t < 3.1) return mix(t, 2.45, 3.1, 4.5, 2, easeIn)
  if (t < PUSH) return 2
  if (t < POP) return mix(t, PUSH, POP, 2, 0.4, easeInOut)
  if (t < POP + 0.15) return mix(t, POP, POP + 0.15, 0.4, -1.2, easeOut)
  return mix(t, POP + 0.15, POP + 0.5, -1.2, 0, easeInOut)
}

/** ぶつかった あとの ぶるぶる(だんだん 小さくなる) */
function ring(t: number, at: number): number {
  return t > at ? Math.exp(-(t - at) * 9) * Math.sin((t - at) * 55) : 0
}

/* ───────── 地面・空 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const rise = span(t, 0, 0.45, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 89 Q18 72 44 82 Q72 66 113 82 V92 H-4 Z" fill={HILL} opacity={rise} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="94" cy="52" rx="6" ry="2.8" />
        <ellipse cx="98.5" cy="50.4" rx="4.4" ry="3" />
      </g>
      {/* かたい 地面: おもての ひび われた つち と、下の こい つち */}
      <Layer scaleY={rise} origin={[54.5, 109]}>
        <path d={`M-4 ${SURFACE} H113 V113 H-4 Z`} fill={SOIL} />
        <path d={`M-4 ${SURFACE} H113 V92.6 H-4 Z`} fill={CRUST} />
        <path d="M-4 101 H113 V113 H-4 Z" fill={SOIL_DARK} opacity="0.55" />
        <g fill={SOIL_DARK} opacity="0.7">
          <ellipse cx="22" cy="100" rx="2.2" ry="1.5" />
          <ellipse cx="64" cy="104" rx="2.8" ry="1.8" />
          <ellipse cx="90" cy="98.5" rx="2" ry="1.4" />
        </g>
        <g fill="none" stroke={SOIL_DARK} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M34 88.2 l1.6 2.4 l-1 2.2" />
          <path d="M72 88.4 l-1.4 2.2 l1.2 2" />
          <path d="M5 88.4 l1.4 2 l-0.8 1.8" />
        </g>
        {/* かれた 草 */}
        {[28, 44, 80].map((x) => (
          <path key={x} d={`M${x} ${SURFACE + 0.2} l1 -3.4 l1 3 l1.4 -3.8 l0.6 4 Z`} fill="#d9c36a" />
        ))}
      </Layer>
    </>
  )
}

/** 空を とぶ 小鳥(左むき) */
function Bird({ t }: SceneProps) {
  const fly = span(t, 0.7, 5.4)
  if (fly <= 0 || fly >= 1) return null
  const x = 118 - fly * 130
  const y = 7 + wave(t, 1.3) * 1.2
  const flap = wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/* ───────── 土の しごと ───────── */

/** ガツン!の しゅんかん: 先の まわりの 土ぼこり と、ひびく すじ */
function Impact({ t, at, tip }: { readonly t: number; readonly at: number; readonly tip: Pt }) {
  const show = during(t, at, at + 0.5, 0.05)
  if (show <= 0) return null
  const p = span(t, at, at + 0.5, easeOut)
  return (
    <g opacity={show}>
      {[-1, 1].map((side) => (
        <circle key={side} cx={tip[0] + side * (3 + p * 6)} cy={SURFACE - 0.5 - p * 4} r={1.2 + p * 2.4} fill="#f3e2c0" />
      ))}
      <path
        d={`M${tip[0] - 5} ${SURFACE - 4} l-3 -2 M${tip[0]} ${SURFACE - 5.5} v-3.4 M${tip[0] + 5} ${SURFACE - 4} l3 -2`}
        fill="none"
        stroke="#9a7a55"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </g>
  )
}

/** 力を いれて いる間 に ひろがる ひび */
function Cracks({ t }: SceneProps) {
  const grow = span(t, PUSH, POP, easeIn)
  if (grow <= 0) return null
  return (
    <path
      d={`M${TIP_LEFT[0]} ${SURFACE + 0.6} l-5 1.4 l-2.5 -0.6 M${TIP_LEFT[0]} ${SURFACE + 0.6} l7 1.2 l3 -0.4 M${TIP_RIGHT[0]} ${SURFACE + 0.6} l-6 1.2 l-3 -0.5 M${TIP_RIGHT[0]} ${SURFACE + 0.6} l7 1.4 l3 -0.5`}
      fill="none"
      stroke={SOIL_DARK}
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={grow}
    />
  )
}

/** [はじまりの x, よこの はやさ, 上への はやさ, 大きさ, 色] */
const CLODS: readonly (readonly [number, number, number, number, string])[] = [
  [13.4, -10, 55, 2.3, SOIL],
  [13.4, 12, 48, 1.7, SOIL_DARK],
  [16, 4, 62, 1.5, CRUST],
  [56, -14, 52, 2.2, SOIL],
  [56, 10, 60, 1.9, SOIL_DARK],
  [56, 20, 44, 1.5, CRUST],
  [56, -3, 66, 1.4, CRUST],
]
const GRAVITY = 110

/** ぼこっ!の あと、土の かたまり が とびちって、地面に おちる */
function Dug({ t }: SceneProps) {
  const since = t - POP
  if (since <= 0) return null
  const open = span(t, POP, POP + 0.4, easeOut)
  return (
    <>
      {/* ささった あな と、よこに もりあがった 土 */}
      {[TIP_LEFT, TIP_RIGHT].map((tip) => (
        <g key={tip[0]}>
          <ellipse cx={tip[0]} cy={SURFACE + 0.8} rx={5.2 * open} ry={1.9 * open} fill={SOIL_DARK} />
          <ellipse cx={tip[0] - 8.5} cy={SURFACE - 1} rx={4.6 * open} ry={2.4 * open} fill={SOIL} />
          <ellipse cx={tip[0] + 9} cy={SURFACE - 1} rx={4.2 * open} ry={2.2 * open} fill={SOIL} />
        </g>
      ))}
      {CLODS.map(([x0, vx, vy, r, color], i) => {
        const flight = (2 * vy) / GRAVITY
        const air = Math.min(since, flight)
        const x = x0 + vx * air
        const y = SURFACE - r * 0.5 - vy * air + (GRAVITY * air * air) / 2
        const spin = since < flight ? since * (i % 2 === 0 ? 260 : -200) : 0
        return <ellipse key={i} cx="0" cy="0" rx={r * 1.15} ry={r * 0.85} fill={color} transform={`translate(${x} ${y}) rotate(${spin})`} />
      })}
    </>
  )
}

/* ───────── 子どもの まわり(あせ・ふんばり の すじ) ───────── */

function Sweat({ t, dy }: SceneProps & { readonly dy: number }) {
  const show = Math.max(during(t, 2.6, 3.6, 0.2), during(t, PUSH + 0.1, POP, 0.2))
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.35].map((offset) => {
        const p = ((t + offset) % 0.7) / 0.7
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(${105 + p * 4} ${20 + dy + p * 10 - Math.sin(p * Math.PI) * 6}) rotate(25)`} opacity={1 - p * 0.8} />
      })}
    </g>
  )
}

function EffortLines({ t, dy }: SceneProps & { readonly dy: number }) {
  const show = during(t, PUSH, POP, 0.15)
  if (show <= 0) return null
  const pulse = 0.65 + 0.35 * Math.sin(t * 22)
  return <path d={`M91 ${14 + dy} l-2.4 -3 M97 ${12 + dy} v-4.2 M103 ${14 + dy} l2.4 -3`} fill="none" stroke="#e8534a" strokeWidth="1.3" strokeLinecap="round" opacity={show * pulse} />
}

/* ───────── ぜんたい ───────── */

function moodAt(t: number): Mood {
  if (t < HIT_1) return 'bold'
  if (t < 1.75) return 'ouch'
  if (t < HIT_2) return 'bold'
  if (t < 2.7) return 'ouch'
  if (t < BREATH) return 'tired'
  if (t < PUSH) return 'bold'
  if (t < POP) return 'effort'
  return 'happy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  const come = span(t, COME, COME + 0.5, backOut)
  const lift = toolLift(t)
  const tilt = Math.max(0, (lift - 2) * 0.5) + (ring(t, HIT_1) + ring(t, HIT_2)) * 2
  const handNear: Pt = [GRIP[0], GRIP[1] - lift]
  const handFar: Pt = [GRIP_FAR[0], GRIP_FAR[1] - lift]

  // 体: つかれて ぐったり → ふーっと 息 → のしかかる → ぼこっ で ぱっと 立つ → にっこり
  const slump = during(t, 2.6, BREATH + 0.2, 0.3)
  const squat = span(t, PUSH, POP - 0.2, easeInOut) * (1 - span(t, POP, POP + 0.3, easeOut))
  const joy = span(t, POP + 0.3, POP + 0.9, backOut)
  const bounce = t > POP + 0.5 && t < INK ? -Math.abs(Math.sin((t - POP - 0.5) * 5)) * 0.6 : 0
  const dy = squat * 4 + slump * 1.2 + (ring(t, HIT_1) + ring(t, HIT_2)) * 0.5 + bounce
  const lean = -5 * squat - 3 * slump + 3 * joy * (1 - span(t, INK - 0.4, INK))
  const breath = Math.sin(span(t, BREATH - 0.2, PUSH, easeInOut) * Math.PI)
  const push = span(t, PUSH + 0.1, POP - 0.1) * (1 - span(t, POP - 0.1, POP))
  const shake = Math.sin(t * 50) * 0.35 * push

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Bird t={t} />
        <Cracks t={t} />
        <Dug t={t} />
        <Impact t={t} at={HIT_1} tip={TIP_LEFT} />
        <Impact t={t} at={HIT_1} tip={TIP_RIGHT} />
        <Impact t={t} at={HIT_2} tip={TIP_LEFT} />
        <Impact t={t} at={HIT_2} tip={TIP_RIGHT} />
        <Layer opacity={span(t, COME - 0.1, COME + 0.1)} x={shake}>
          <ellipse cx="98" cy="89.4" rx="11" ry="2.3" fill="#000000" opacity="0.12" />
          <Layer scale={come} origin={[98, 88]}>
            <Child dy={dy} lean={lean} mood={moodAt(t)} breath={breath} handNear={handNear} handFar={handFar} tool={<Tool lift={lift} tilt={tilt} />} />
          </Layer>
          <Sweat t={t} dy={dy} />
          <EffortLines t={t} dy={dy} />
        </Layer>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      <Sparkles cx={54.5} cy={52} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'かたい 地面', sound: 'pop' },
    { at: COME, label: '子どもが どうぐを もってくる' },
    { at: HIT_1, label: 'ガツン! かたくて はねかえされる', sound: 'pop' },
    { at: HIT_2, label: 'もういちど…やっぱり だめ。つかれた' },
    { at: BREATH, label: 'ふーっ。力を ぜんぶ 入れる' },
    { at: POP, label: 'ぼこっ! 先が ささって 土が とびちる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '力 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
