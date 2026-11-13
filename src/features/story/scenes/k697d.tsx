/*
 * 楽(たのしい): 木に 糸を はった がっき。ぽろんと ならすと、うきうき。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)   … はこの 上に つきでた、糸を まく 小さな ぼう(つまみ)
 *   2画目(丨)   … がっきの はこの 左の わく
 *   3画目(𠃍)   … がっきの はこの 上の わく と 右の わく
 *   4・5画目(一) … はこに はった 2本の 糸(赤い 糸)
 *   6・7画目    … 左へ ひろがる 音の すじ(はこの 左がわ)
 *   8・9画目    … 右へ ひろがる 音の すじ(はこの 右がわ)
 *   10画目(一)  … 木の よこに のびた 大きな えだ(こどもが 立つ えだ)
 *   11画目(丨)  … 木の みき(はこを のせている)
 *   12・13画目  … 木の 根
 *
 * ながれ
 *   木が そだち、みきの 上に 木の はこが できる
 *   → つまらなそうな 子が えだを あるいてきて、はこに 気づく(「!」)
 *   → 糸の はしを つかんで ぴんと ひっぱり、右の はしに むすぶ(2本)
 *   → ゆびで ぽろん ぽろん ぽろん。糸が ふるえ、音の すじが ひろがり、小鳥も ききにくる
 *   → 子が うれしくて 両手を あげて とびはねる(たのしい!)
 *   → ほね が ひかって、絵が うすくなり、字「楽」が のこる
 *
 * 子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は、うでの長さから 計算して つなぐ)。
 *   くび は みじかく、どう の まんなか の上。糸を はるとき 手は とどく ところまでしか のびない。
 *   音の すじ は 子の うしろ(はこの がわ)に 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '楽'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#3fa7a0'
const TUNIC_DARK = '#2f8d88'
const TUNIC_FAR = '#277873'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD_FRAME = '#b97b3f'
const WOOD_PANEL = '#f4d29a'
const WOOD_PANEL_SHADE = '#e8bd7a'
const THREAD = '#e8534a'
const RAY = '#ffb02e'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'

/** くぎり の時間(秒) */
const WALK = 0.9
const ARRIVE = 2.7
const NOTICE = 2.9
/** 糸を はる(1本め・2本め) */
const REACH = 3.1
const TIE1 = 4.1
const TIE2 = 5.1
/** 糸を はじく しゅんかん(はなした 時間)。1本め・2本め・1本め */
const PLUCKS: readonly number[] = [5.6, 6.1, 6.6]
const CHEER = 7.0
const INK = 7.5
const DONE = 10.4
const DURATION = 11

/** 子が 立つ えだの 上(足もと)と、立つ場所 */
const BRANCH_TOP = 61.4
const STAND_X = 75
/** かた の高さ(足もと から) */
const SHOULDER_UP = 24.6
/** うでの 1ほんぶん(かた→ひじ、ひじ→手) */
const ARM_PART = 9.6

type Point = readonly [number, number]

/* ───────── 糸の きまり(画データの 4・5画目の はしの場所) ───────── */
type StringSpec = { readonly a: Point; readonly b: Point; readonly appear: number; readonly grasp: number; readonly pullEnd: number; readonly tie: number }
const STRING_1: StringSpec = { a: [43.4, 36.1], b: [64.1, 34.4], appear: 3.4, grasp: 3.5, pullEnd: 4.0, tie: TIE1 }
const STRING_2: StringSpec = { a: [44.1, 49.6], b: [63, 48.6], appear: 4.5, grasp: 4.55, pullEnd: 5.0, tie: TIE2 }
/** 糸を つかんだ ところ(すこし たるむ)と、ひっぱりきった ところ */
const grasp = (s: StringSpec): Point => [s.b[0] - 0.5, s.b[1] + 2.5]
const pulled = (s: StringSpec): Point => [s.b[0] + 3, s.b[1] - 0.5]
/** はじく 場所(右はしの そば)。糸の 上げ下げは ±3 */
const PLUCK_X = 62.6
const stringY = (s: StringSpec, x: number) => s.a[1] + ((x - s.a[0]) / (s.b[0] - s.a[0])) * (s.b[1] - s.a[1])
const PLUCK_REACH = 3.2

/** うで: かた → ひじ → 手。とどかない ときは のばせるだけ のばす。ひじ は 後ろ・下へ まがる。 */
type Limb = { readonly shoulder: Point; readonly elbow: Point; readonly hand: Point }
function reach(shoulder: Point, target: Point): Limb {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const length = Math.min(dist, ARM_PART * 2 - 0.02)
  const ux = dx / dist
  const uy = dy / dist
  const half = length / 2
  const lift = Math.sqrt(Math.max(ARM_PART ** 2 - half ** 2, 0))
  const mid: Point = [shoulder[0] + ux * half, shoulder[1] + uy * half]
  const optionA: Point = [mid[0] - uy * lift, mid[1] + ux * lift]
  const optionB: Point = [mid[0] + uy * lift, mid[1] - ux * lift]
  // 後ろと 下 を むいたほうの ひじ を えらぶ
  const score = (p: Point) => (p[0] - shoulder[0]) * 0.5 + (p[1] - shoulder[1])
  const elbow = score(optionA) >= score(optionB) ? optionA : optionB
  return { shoulder, elbow, hand: [shoulder[0] + ux * length, shoulder[1] + uy * length] }
}

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** (時間, 場所) の ならび を なめらかに つなぐ */
type Key = readonly [time: number, point: Point]
function follow(t: number, keys: readonly Key[]): Point {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    if (t <= keys[i][0]) return lerpPoint(keys[i - 1][1], keys[i][1], span(t, keys[i - 1][0], keys[i][0], easeInOut))
  }
  return keys[keys.length - 1][1]
}

/** 子の 手の 道すじ(せかいの ざひょう)。糸を はり → ぽろん ×3 → よろこぶ */
const HANG: Point = [STAND_X - 0.5, BRANCH_TOP - SHOULDER_UP + 16.5]
const PLUCK_1_LOW: Point = [PLUCK_X, stringY(STRING_1, PLUCK_X) + PLUCK_REACH]
const PLUCK_1_HIGH: Point = [PLUCK_X, stringY(STRING_1, PLUCK_X) - PLUCK_REACH]
const PLUCK_2_HIGH: Point = [PLUCK_X + 0.6, stringY(STRING_2, PLUCK_X) - PLUCK_REACH]
const PLUCK_2_LOW: Point = [PLUCK_X + 0.6, stringY(STRING_2, PLUCK_X) + PLUCK_REACH]
const CHEER_NEAR: Point = [STAND_X - 10, BRANCH_TOP - SHOULDER_UP - 11]
const NEAR_HAND_KEYS: readonly Key[] = [
  [REACH, HANG],
  [STRING_1.grasp, grasp(STRING_1)],
  [STRING_1.pullEnd, pulled(STRING_1)],
  [STRING_1.tie, STRING_1.b],
  [STRING_1.tie + 0.1, STRING_1.b],
  [STRING_2.grasp, grasp(STRING_2)],
  [STRING_2.pullEnd, pulled(STRING_2)],
  [STRING_2.tie, STRING_2.b],
  [STRING_2.tie + 0.05, STRING_2.b],
  [PLUCKS[0] - 0.2, PLUCK_1_LOW],
  [PLUCKS[0], PLUCK_1_HIGH],
  [PLUCKS[1] - 0.15, PLUCK_2_HIGH],
  [PLUCKS[1], PLUCK_2_LOW],
  [PLUCKS[2] - 0.15, PLUCK_1_LOW],
  [PLUCKS[2], PLUCK_1_HIGH],
  [CHEER, CHEER_NEAR],
]

/* ───────── 場所 ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="9" rx="7" ry="3.2" />
        <ellipse cx="7" cy="7.4" rx="5" ry="3.2" />
        <ellipse cx="96" cy="6" rx="6" ry="2.6" />
        <ellipse cx="100.5" cy="4.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 34, 74, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {[10, 99].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={95.8 - i} r="1.5" fill="#f58aa8" />
          <circle cx={x} cy={95.8 - i} r="0.55" fill="#ffd24a" />
          <path d={`M${x} 96.5 v2`} stroke={LEAF_DARK} strokeWidth="0.7" />
        </g>
      ))}
    </>
  )
}

/** 木: みき が のびて、えだ と 根が ひろがり、はこが できる */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.6, backOut)
  const boughs = span(t, 0.35, 0.9, backOut)
  const leaves = span(t, 0.7, 1.2, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="54" cy="97.6" rx={22 * trunk} ry="3" fill="#000000" opacity="0.1" />
      {/* 根 */}
      <Layer scale={boughs} origin={[54, 80]}>
        <Bone char={CHAR} n={12} color={BARK} width={5.4} />
        <Bone char={CHAR} n={13} color={BARK} width={5.4} />
      </Layer>
      {/* みき: 下から のびる */}
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[54, 97]}>
        <Bone char={CHAR} n={11} color={BARK} width={8.4} />
        <path d="M51.4 74 q1.4 4 0 9 M55.8 86 q-1.2 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      {/* えだ(右の はしは わく の そとまで つづく) */}
      <Layer scaleX={boughs} scaleY={0.6 + 0.4 * boughs} origin={[53, 65]}>
        <rect x="88" y="61.2" width="26" height="6" rx="3" fill={BARK} />
        <Bone char={CHAR} n={10} color={BARK} width={6.2} />
      </Layer>
      <Layer scale={leaves} origin={[53, 65]} rotate={sway * 0.6}>
        <circle cx="18" cy="66" r="5.4" fill={LEAF_DARK} />
        <circle cx="20.5" cy="64" r="3.8" fill={LEAF} />
        <circle cx="100" cy="70" r="4.6" fill={LEAF_DARK} />
        <circle cx="102" cy="68.6" r="3.2" fill={LEAF} />
        <circle cx="58" cy="96" r="0" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/** がっき の はこ(木の わく と、うすい 板)。糸は 別に 描く */
function SoundBox({ t }: SceneProps) {
  const pop = span(t, 0.7, 1.25, backOut)
  return (
    <Layer scale={pop} origin={[53.5, 52]}>
      <rect x="42" y="22.5" width="23" height="29" fill={WOOD_PANEL} />
      <rect x="42" y="42" width="23" height="9.5" fill={WOOD_PANEL_SHADE} />
      <rect x="40" y="50.4" width="27" height="3" rx="1.5" fill={WOOD_FRAME} />
      <Bone char={CHAR} n={2} color={WOOD_FRAME} width={3.4} />
      <Bone char={CHAR} n={3} color={WOOD_FRAME} width={3.4} />
      {/* 1画目: 糸を まく つまみ */}
      <Bone char={CHAR} n={1} color={BARK_DARK} width={2.8} />
      <circle cx="53" cy="11.2" r="2.3" fill={WOOD_FRAME} />
    </Layer>
  )
}

/* ───────── 糸 ───────── */

type StringState = { readonly d: string; readonly knots: readonly Point[] } | null

/** 糸が ふるえる ようす(はじいた あと、だんだん おさまる) */
function vibration(spec: StringSpec, pluckIndexes: readonly number[], t: number, handY: number): number {
  const sign = pluckIndexes === STRING_1_PLUCKS ? -1 : 1
  for (const i of pluckIndexes) {
    // はなす まえ: 手に つられて ひっぱられる
    if (t >= PLUCKS[i] - 0.2 && t < PLUCKS[i]) {
      const pull = handY - stringY(spec, PLUCK_X)
      return sign < 0 ? Math.min(0, pull) : Math.max(0, pull)
    }
  }
  const lastIndex = [...pluckIndexes].reverse().find((i) => t >= PLUCKS[i])
  if (lastIndex === undefined) return 0
  const since = t - PLUCKS[lastIndex]
  return sign * PLUCK_REACH * Math.cos(since * Math.PI * 2 * 4.2) * Math.exp(-since * 2.6)
}
const STRING_1_PLUCKS: readonly number[] = [0, 2]
const STRING_2_PLUCKS: readonly number[] = [1]

function stringState(spec: StringSpec, plucks: readonly number[], t: number, hand: Point): StringState {
  if (t < spec.appear) return null
  if (t < spec.tie) {
    // 手で つかんだ はしを ひっぱる。たるみが だんだん なくなる
    const slack = 4.5 * (1 - span(t, spec.grasp, spec.pullEnd, easeInOut))
    const mx = (spec.a[0] + hand[0]) / 2
    const my = (spec.a[1] + hand[1]) / 2 + slack * 2
    return { d: `M${spec.a[0]} ${spec.a[1]} Q${mx} ${my} ${hand[0]} ${hand[1]}`, knots: [spec.a] }
  }
  const handY = follow(t, NEAR_HAND_KEYS)[1]
  const disp = vibration(spec, plucks, t, handY)
  const points = Array.from({ length: 15 }, (_, k) => {
    const u = k / 14
    const x = spec.a[0] + (spec.b[0] - spec.a[0]) * u
    const base = spec.a[1] + (spec.b[1] - spec.a[1]) * u
    const beforeRelease = plucks.some((i) => t >= PLUCKS[i] - 0.2 && t < PLUCKS[i])
    const shape = beforeRelease ? (u < 0.92 ? u / 0.92 : (1 - u) / 0.08) : Math.sin(Math.PI * u)
    return `${k === 0 ? 'M' : 'L'}${x.toFixed(2)} ${(base + disp * shape).toFixed(2)}`
  })
  return { d: points.join(' '), knots: [spec.a, spec.b] }
}

function Thread({ state }: { readonly state: StringState }) {
  if (!state) return null
  return (
    <>
      <path d={state.d} fill="none" stroke={THREAD} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      {state.knots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" fill="#c4382f" />
      ))}
    </>
  )
}

/* ───────── 子 ───────── */

type Mood = 'bored' | 'curious' | 'happy'

function Arm({ limb, color, cx, cy }: { readonly limb: Limb; readonly color: string; readonly cx: number; readonly cy: number }) {
  const { shoulder, elbow, hand } = limb
  return (
    <g transform={`translate(${-cx} ${-cy})`}>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
    </g>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'bored' && (
        <>
          <circle cx="25.4" cy="25.8" r="1.15" fill="#2b2b2b" />
          <path d="M23.6 24.3 h3.6" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M23.4 24.2 l3 -1.1" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M23.4 30.6 q1.6 -1 3.4 0" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="25.4" cy="25.2" r="1.7" fill="#2b2b2b" />
          <circle cx="25.9" cy="24.6" r="0.6" fill="#ffffff" />
          <path d="M23.4 21.8 q1.8 -1.6 3.8 -0.2" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="24.6" cy="30.4" rx="1.2" ry="1.5" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.4 26.2 Q25.2 23.4 27 26.2" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M22.6 29 Q25 34 28.2 29.2 Z" fill="#b9483f" />
          <path d="M23.8 31.2 Q25.4 32.6 27 31" fill="none" stroke="#ff8a8a" strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly cx: number
  readonly cy: number
  readonly step: number
  readonly mood: Mood
  readonly tilt: number
  readonly nearArm: Limb
  readonly farArm: Limb
}

/** 左むきの 子。足もと (cx, cy) から、あし → どう → くび → あたま の じゅん に 立つ */
function Child({ cx, cy, step, mood, tilt, nearArm, farArm }: ChildProps) {
  return (
    <>
      <Layer x={cx} y={cy}>
        {/* むこうの うで は どう の うしろ */}
        <Arm limb={farArm} color={TUNIC_FAR} cx={cx} cy={cy} />
        <Layer rotate={step * 22} origin={[0, -12]}>
          <rect x="0.2" y="-12" width="4.4" height="10.6" rx="2.2" fill={PANTS_DARK} />
          <ellipse cx="1.4" cy="-1.2" rx="3.6" ry="1.9" fill={SHOE} />
        </Layer>
        <Layer rotate={-step * 22} origin={[0, -12]}>
          <rect x="-2.6" y="-12" width="4.4" height="10.6" rx="2.2" fill={PANTS} />
          <ellipse cx="-1.4" cy="-1.2" rx="3.8" ry="1.9" fill={SHOE} />
        </Layer>
        {/* くび: みじかく、どう と あたま に はさまれる */}
        <rect x="-1.8" y="-30" width="3.6" height="5.4" rx="1.6" fill={SKIN_SHADE} />
        <rect x="-5.2" y="-27.4" width="10.4" height="17.2" rx="5" fill={TUNIC} />
        <path d="M-3.6 -15.5 h7.2" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Arm limb={nearArm} color={TUNIC_DARK} cx={cx} cy={cy} />
        <Layer rotate={tilt} origin={[0, -27.6]}>
          <g transform="translate(0 -33.6) scale(0.74) translate(-30.2 -24.6)">
            <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
            <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
            <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            <Face mood={mood} />
          </g>
        </Layer>
      </Layer>
    </>
  )
}

/** 「!」: はこに 気づいた しゅんかん */
function Notice({ t, cx }: { readonly t: number; readonly cx: number }) {
  const pop = span(t, NOTICE, NOTICE + 0.25, backOut)
  const show = during(t, NOTICE, NOTICE + 0.9, 0.15)
  if (show <= 0) return null
  return (
    <Layer x={cx - 1} y={10} scale={pop} origin={[0, 4]} opacity={show}>
      <rect x="-1.5" y="-3" width="3" height="7" rx="1.5" fill="#ff7a4d" />
      <circle cx="0" cy="6.8" r="1.6" fill="#ff7a4d" />
    </Layer>
  )
}

/* ───────── 音 ───────── */

/** 音の すじ(6〜9画目の 場所)。はじいたあと はこの がわから ひろがり、のこる */
function Rays({ t }: SceneProps) {
  const left = span(t, PLUCKS[0], PLUCKS[0] + 0.45, easeOut)
  const right = span(t, PLUCKS[1], PLUCKS[1] + 0.45, easeOut)
  const pulse = PLUCKS.reduce((sum, p) => (t >= p ? sum + Math.exp(-(t - p) * 5) : sum), 0) * 1.2
  const width = 2.4 + Math.min(pulse, 2)
  return (
    <>
      <Bone char={CHAR} n={6} color={RAY} width={width} from={1 - left} to={1} />
      <Bone char={CHAR} n={7} color={RAY} width={width} from={1 - left} to={1} />
      <Bone char={CHAR} n={8} color={RAY} width={width} from={1 - right} to={1} />
      <Bone char={CHAR} n={9} color={RAY} width={width} from={0} to={right} />
    </>
  )
}

function Note({ x, y, rotate, scale, color }: { readonly x: number; readonly y: number; readonly rotate: number; readonly scale: number; readonly color: string }) {
  return (
    <Layer x={x} y={y} rotate={rotate} scale={scale}>
      <ellipse cx="0" cy="0" rx="2" ry="1.4" fill={color} transform="rotate(-20)" />
      <path d="M1.7 -0.5 V-7 q2.4 0.5 2.6 3" fill="none" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </Layer>
  )
}

const NOTE_COLORS = ['#f07f9e', '#5f7fd6', '#f2b632'] as const
const NOTE_START: readonly Point[] = [[52, 19], [55, 17], [58, 19]]
const NOTE_MOVE: readonly Point[] = [[-24, -14], [3, -17], [20, -12]]

/** ぽろん と ならすたびに、♪ が ふわっと のぼる */
function Notes({ t }: SceneProps) {
  return (
    <>
      {PLUCKS.map((p, i) => {
        const k = span(t, p + 0.05, p + 1.5)
        if (k <= 0 || k >= 1) return null
        const e = easeOut(k)
        return <Note key={p} x={NOTE_START[i][0] + NOTE_MOVE[i][0] * e} y={NOTE_START[i][1] + NOTE_MOVE[i][1] * e} rotate={Math.sin(k * 6 + i) * 14} scale={Math.sin(k * Math.PI) ** 0.5 * 1.05} color={NOTE_COLORS[i]} />
      })}
    </>
  )
}

/** 小鳥: 音を ききに とんできて、左の えだに とまる。ごきげんで ゆれる */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 5.7, 6.5)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const x = -6 + 36 * easeOut(arrive)
  const y = 8 + (BRANCH_TOP + 1.2 - 3.4 - 8) * easeOut(arrive) - Math.sin(arrive * Math.PI) * 9
  const bob = landed ? Math.max(0, wave(t, 0.5)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.14) * 30
  return (
    <Layer x={x} y={y - bob}>
      <path d="M-3.4 0.6 l-4.4 -1.4 l1.2 2.6 Z" fill="#3b8fd6" />
      <ellipse cx="0" cy="0" rx="4.2" ry="3.2" fill="#6fb3e8" />
      <ellipse cx="0.4" cy="1.2" rx="2.8" ry="1.7" fill="#eaf5ff" />
      <circle cx="3" cy="-2.6" r="2.4" fill="#6fb3e8" />
      <path d="M5 -2.7 l2.6 0.7 l-2.4 1 Z" fill="#f2b632" />
      <circle cx="3.7" cy="-3.1" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[-0.6, -0.8]}>
        <path d="M1 -0.6 Q-1.8 -4 -4.4 -0.6 Q-1.8 1 1 -0.6 Z" fill="#3b8fd6" />
      </Layer>
      {landed && <path d="M-0.8 3 v1.6 M1.2 3 v1.6" stroke="#b9483f" strokeWidth="0.6" strokeLinecap="round" />}
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // あるく: わく の 右そとから えだを あるいてきて、はこの そばで とまる
  const walking = 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.5) * walking
  const cx = mix(t, WALK, ARRIVE, 118, STAND_X, easeOut)
  // うれしくて とびはねる(ぽろん の あと)
  const hop = Math.abs(Math.sin((t - CHEER) * Math.PI * 2.4)) * 2.2 * span(t, CHEER, CHEER + 0.2) * (1 - span(t, INK - 0.1, INK + 0.4))
  const cy = BRANCH_TOP - Math.abs(stride) * 1.1 - (t >= CHEER ? hop : 0)

  const mood: Mood = t < NOTICE ? 'bored' : t < PLUCKS[0] ? 'curious' : 'happy'
  const tilt = t < NOTICE ? -9 : t < PLUCKS[0] ? -2 : wave(t, 0.6) * 4

  // うで: あるくときは ふり、あとは 糸を あつかい、さいごは 両手を あげる
  const shoulder: Point = [cx, cy - SHOULDER_UP]
  const swing = stride * 6
  const nearTarget: Point = t < REACH ? [cx - 0.5 + swing, shoulder[1] + 16.5] : follow(t, NEAR_HAND_KEYS)
  const farHang: Point = [cx + 1 - swing, shoulder[1] + 16.5]
  const farTarget = lerpPoint(farHang, [cx + 9, shoulder[1] - 15], span(t, CHEER, CHEER + 0.4, easeInOut))
  const nearArm = reach(shoulder, nearTarget)
  const farArm = reach(shoulder, farTarget)

  const string1 = stringState(STRING_1, STRING_1_PLUCKS, t, nearArm.hand)
  const string2 = stringState(STRING_2, STRING_2_PLUCKS, t, nearArm.hand)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <SoundBox t={t} />
        <Thread state={string1} />
        <Thread state={string2} />
        <Rays t={t} />
        <Bird t={t} />
        <Child cx={cx} cy={cy} step={stride} mood={mood} tilt={tilt} nearArm={nearArm} farArm={farArm} />
        <Notice t={t} cx={cx} />
        <Notes t={t} />
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
    { at: 0, label: '木が そだち、はこが できる', sound: 'pop' },
    { at: WALK, label: 'つまらなそうな 子が えだを あるいてくる' },
    { at: NOTICE, label: 'はこに 気づく', sound: 'pop' },
    { at: REACH, label: '糸を つかんで ぴんと はる' },
    { at: PLUCKS[0], label: 'ぽろん と ならす。音が ひろがる', sound: 'pop' },
    { at: CHEER, label: 'うれしくて とびはねる(たのしい)' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '楽 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
