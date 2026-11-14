/*
 * 楽(たのしい): 木に 糸を はった がっき。ぽろんと ならすと、うきうき。
 * (共通部品 sceneFigures で 書きなおした もの)
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
 *   → つまらなそうな 子が えだを あるいてきて、はこに 気づく(はっ)
 *   → 糸の はしを つかんで ぴんと ひっぱり、右の はしに むすぶ(2本)
 *   → ゆびで ぽろん ぽろん ぽろん。糸が ふるえ、音の すじが ひろがり、小鳥も ききにくる
 *   → 子が うれしくて 両手を あげて とびはねる(たのしい!)
 *   → ほね が ひかって、絵が うすくなり、字「楽」が のこる
 *
 * 子は Person(左むき)。あるきは walk()、手は { to } で 糸の 場所へ(とどかない ときは のばせる だけ)。
 * 子は はこの 右がわ(おくの 8・9画目の すじ には かぶらない 場所)に 立つ。
 * 糸・はこ・音の すじ は 部品が ない ので ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, Flower, HANG_ARM, LOOKS, mixLimb, Notice, PALETTE, Person, personRig, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '楽'

const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const WOOD_FRAME = '#b97b3f'
const WOOD_PANEL = '#f4d29a'
const WOOD_PANEL_SHADE = '#e8bd7a'
const THREAD = '#e8534a'
const RAY = '#ffb02e'
const LEAF = PALETTE.leaf
const LEAF_DARK = PALETTE.leafDark
const TUNIC = '#3fa7a0'

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

/** 子が 立つ えだの 上(足もと)と、立つ場所(こし の x)・背の高さ */
const BRANCH_TOP = 61.4
const STAND_X = 70
const KID_HEIGHT = 34

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

/** 子の てまえの 手(右手)の 道すじ(せかいの ざひょう)。糸を はり → ぽろん ×3 */
const HANG: Point = [STAND_X - 1, BRANCH_TOP - 14]
const PLUCK_1_LOW: Point = [PLUCK_X, stringY(STRING_1, PLUCK_X) + PLUCK_REACH]
const PLUCK_1_HIGH: Point = [PLUCK_X, stringY(STRING_1, PLUCK_X) - PLUCK_REACH]
const PLUCK_2_HIGH: Point = [PLUCK_X + 0.6, stringY(STRING_2, PLUCK_X) - PLUCK_REACH]
const PLUCK_2_LOW: Point = [PLUCK_X + 0.6, stringY(STRING_2, PLUCK_X) + PLUCK_REACH]
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
]
/** うれしくて りょううで を あげる */
const CHEER_ARM: Limb = { swing: 125, bend: 20 }

/* ───────── 場所 ───────── */

/** 木: みき が のびて、えだ と 根が ひろがる(みき・えだ・根 は 画の線 そのまま) */
function Tree({ t }: SceneProps) {
  const trunk = span(t, 0, 0.6, backOut)
  const boughs = span(t, 0.35, 0.9, backOut)
  const leaves = span(t, 0.7, 1.2, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="54" cy="97.6" rx={22 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scale={boughs} origin={[54, 80]}>
        <Bone char={CHAR} n={12} color={BARK} width={5.4} />
        <Bone char={CHAR} n={13} color={BARK} width={5.4} />
      </Layer>
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

const STRING_1_PLUCKS: readonly number[] = [0, 2]
const STRING_2_PLUCKS: readonly number[] = [1]

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

/** 子の 場所と かっこう(左むき)。えだを あるいてきて、糸を はり、ぽろん と ならし、よろこぶ */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: 118, to: STAND_X, start: WALK, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 16 })
  const cheer = span(t, CHEER, CHEER + 0.25, easeInOut)
  const hop = Math.abs(Math.sin((t - CHEER) * Math.PI * 2.4)) * 2.2 * span(t, CHEER, CHEER + 0.2) * (1 - span(t, INK - 0.1, INK + 0.4))
  const nearHand = follow(t, NEAR_HAND_KEYS)
  const threadArm: Limb = t < REACH ? (walking.pose.rightArm ?? HANG_ARM) : { to: nearHand }
  const far: Limb = walking.pose.leftArm ?? HANG_ARM
  const face = t < NOTICE ? 'sleepy' : t < PLUCKS[0] ? 'surprised' : 'joy'
  return {
    ...walking,
    y: BRANCH_TOP + 0.8,
    lift: t >= CHEER ? hop : 0,
    look: { ...LOOKS.boy, top: TUNIC },
    face: t >= NOTICE + 0.9 && t < PLUCKS[0] ? 'normal' : face,
    pose: {
      ...walking.pose,
      rightArm: mixLimb(threadArm, CHEER_ARM, cheer),
      leftArm: mixLimb(far, CHEER_ARM, cheer),
      head: t < NOTICE ? 12 : t < PLUCKS[0] ? 0 : wave(t, 0.6) * 4,
    },
  }
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
function Songbird({ t }: SceneProps) {
  const arrive = span(t, 5.7, 6.5)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const x = -6 + 36 * easeOut(arrive)
  const y = 8 + (BRANCH_TOP + 1.2 - 3.4 - 8) * easeOut(arrive) - Math.sin(arrive * Math.PI) * 9
  const bob = landed ? Math.max(0, wave(t, 0.5)) * 0.9 : 0
  return <Bird x={x} y={y - bob} t={t} flying={!landed} facing="right" />
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const string1 = stringState(STRING_1, STRING_1_PLUCKS, t, rig.world.arms.right.end)
  const string2 = stringState(STRING_2, STRING_2_PLUCKS, t, rig.world.arms.right.end)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={null} clouds={[[2, 9, 1], [96, 6, 0.8]]} tufts={[8, 34, 74, 100]} />
        <Flower x={10} y={96} grow={span(t, 0.2, 0.7)} />
        <Flower x={99} y={95} color="#ffd24a" grow={span(t, 0.3, 0.8)} />
        <Tree t={t} />
        <SoundBox t={t} />
        <Thread state={string1} />
        <Thread state={string2} />
        <Rays t={t} />
        <Songbird t={t} />
        <Person {...kid} />
        <Notice x={head[0]} y={head[1]} r={rig.body.headR * rig.scale} show={during(t, NOTICE, NOTICE + 0.9, 0.15)} dir={1} />
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
