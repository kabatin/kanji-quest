/*
 * 工(こう): 大工さんが どうぐで ものを つくる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 上に のせる 長い いた(大工さんが かついで きて、はしらの上に のせる)
 *   2画目(丨)  … 立っている はしら
 *   3画目(一)  … 下の どだい(2つの 石の上に のった 太い いた)
 *   →  どだい・はしら・いた の 3つが ならぶと、字「工」の形になる(とりの とまりぎ)
 *
 * ながれ
 *   石と どだいと はしらが できる → 大工さんが 長い いたを かついで、ふうふう あるいてくる
 *   → 地面で さびしそうな 小鳥に 気づく(「!」)→ いたを はしらの上に のせる
 *   → かなづちで トントントン(3かい)→ 見上げて ながめる
 *   → 小鳥が とんできて いたに とまり、大工さんも 小鳥も にっこり
 *   → ほね が ひかって、絵が うすくなり、字「工」が のこる
 *
 * 大工さんは Person(あるきは walk、手は { to } で いたと かなづちへ)。かなづちは held で 手に もたせる。
 * 小鳥は Bird、「!」は Notice、あせ は Sweat、ためいき は Sigh。はちまきは headwear。
 * いたを 上に もつときは、うで を まっすぐ のばして、とどく ところまで。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, LOOKS, Notice, Person, personRig, Sigh, Sweat, walk, type PersonProps } from '../sceneFigures'
import type { ReactNode } from 'react'

const CHAR = '工'

const BARK = '#8c5b3c'
const STONE = '#b8b2a7'
const STONE_DARK = '#9a948a'
const IRON = '#8d949e'
const IRON_DARK = '#6d747e'
const TOWEL = '#ffffff'

/** くぎり の時間(秒) */
const WALK_FROM = 0.5
/** いたを かついだ大工さんが、はしらの 手まえに ついた */
const ARRIVE = 2.7
/** 小鳥に 気づく */
const NOTICE = 2.7
/** いたを はしらの上に のせる */
const SETTLE = 3.4
/** かなづちで トントン(はじまり) */
const NAIL = 4.0
const KNOCK_EVERY = 0.38
const KNOCK_FIRST = NAIL + 0.15
/** 3かい目の トン が おわる */
const NAIL_END = KNOCK_FIRST + KNOCK_EVERY * 3 - 0.05
/** 大工さんが すこし さがって ながめる */
const BACK = 5.4
const BACK_END = 6.1
/** 小鳥が とんでくる */
const FLY = 5.25
const FLY_END = 6.1
const INK = 6.6
const DONE = 9.5
const DURATION = 10.1

/** 地面の たかさ(大工さんの 足もと) */
const FLOOR = 98
/** 大工さんが いたを もつ ばしょ(はしらの 左がわ) */
const STAND_X = 35
/** いたを かついで あるくとき、いたは 字の位置より 少し 上を とおる */
const CARRY_LIFT = 4
/** いたの 左はし から 手までの きょり(字の 1画目の 上で、手が ふれる 所)。大工さんの こし の x から 見た 位置 */
const HAND_ON_PLANK: readonly [number, number] = [7.5, -66.5]
const HAND_ON_PLANK_FAR: readonly [number, number] = [3.5, -66.5]
/** 大工さんの 背 と 見た目 */
const CARPENTER_HEIGHT = 60
const CARPENTER_LOOK = { ...LOOKS.man, top: '#e8944a', bottom: '#4a5f86' } as const

type Point = readonly [number, number]
const lerp2 = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** どだいを うける 2つの 石 */
function Stones({ t }: { readonly t: number }) {
  const pop = span(t, 0.05, 0.45, backOut)
  return (
    <Layer scale={pop} origin={[55, 96]}>
      {[24, 86].map((x) => (
        <g key={x}>
          <rect x={x - 6.5} y="84" width="13" height="12" rx="4.5" fill={STONE} />
          <path d={`M${x - 3} 86.5 h5`} stroke={STONE_DARK} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </Layer>
  )
}

/** どだい(3画目)と はしら(2画目) */
function Frame({ t }: { readonly t: number }) {
  const sill = span(t, 0.3, 0.75, easeOut)
  const post = span(t, 0.6, 1.0, backOut)
  const settled = span(t, NAIL_END - 0.2, NAIL_END)
  return (
    <>
      <Layer scaleX={sill} origin={[55, 81]}>
        <Bone char={CHAR} n={3} color={BARK} width={5.6} />
      </Layer>
      <Layer scaleY={post} origin={[54, 80]}>
        <Bone char={CHAR} n={2} color={BARK} width={4.8} />
      </Layer>
      {/* くぎの あたま: トントン が おわると、はしらと いたの つぎめ に のこる */}
      <circle cx="53.6" cy="34" r="0.9" fill={IRON_DARK} opacity={settled} />
    </>
  )
}

/** かなづち。angle 0 = え が 上、かお(うつ面)が 右。手(x, y)に にぎられる。 */
function Hammer({ x, y, angle }: { readonly x: number; readonly y: number; readonly angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-1.1" y="-10" width="2.2" height="13" rx="1.1" fill={BARK} />
      <rect x="-4.2" y="-13.2" width="8.4" height="4.4" rx="1.2" fill={IRON} />
      <rect x="1.4" y="-13.2" width="2.8" height="4.4" rx="1" fill={IRON_DARK} />
    </g>
  )
}

/** はちまき(白い てぬぐい。あたまの まんなか が 0,0、半径 1。右むき)。うしろで むすんだ はし が ゆれる */
function Headband({ flutter }: { readonly flutter: number }): ReactNode {
  return (
    <g fill="none" stroke={TOWEL} strokeLinecap="round">
      <path d="M-0.96 -0.3 Q0 -0.85 0.96 -0.3" strokeWidth="0.34" />
      <g transform={`rotate(${flutter} -0.96 -0.3)`}>
        <path d="M-0.96 -0.3 Q-1.3 0 -1.28 0.5 M-0.96 -0.3 Q-1.35 -0.2 -1.5 0.2" strokeWidth="0.2" />
      </g>
    </g>
  )
}

/** 小鳥が たのしそうに うたう おんぷ */
function Note({ t }: { readonly t: number }) {
  const show = during(t, FLY_END + 0.1, INK + 0.4, 0.2)
  if (show <= 0) return null
  const rise = (t * 5) % 6
  const sway = wave(t, 1.2) * 1.2
  return (
    <g opacity={show} fill="#f07f9e">
      <path d={`M${68 - sway} ${16 - rise} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
      <ellipse cx={67.2 - sway} cy={16 - rise} rx="1.1" ry="0.8" />
      <ellipse cx={69.8 - sway} cy={15.2 - rise} rx="1.1" ry="0.8" />
    </g>
  )
}

/** トントン の たびに でる、ちいさな ひかり */
function KnockFlash({ t }: { readonly t: number }) {
  const hit = Math.max(
    ...[1, 2, 3].map((k) => during(t, KNOCK_FIRST + KNOCK_EVERY * (k - 1) + KNOCK_EVERY - 0.02, KNOCK_FIRST + KNOCK_EVERY * k + 0.12, 0.04)),
  )
  if (hit <= 0) return null
  return (
    <g opacity={hit}>
      <Star cx={51} cy={35.4} r={4.2 * hit} color="#ffd95a" spin={20} />
      <path d="M46.6 31.4 l-2 -2 M51.8 30.4 v-3 M56 32 l2.2 -1.8" stroke="#ffd95a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Scene({ t }: { readonly t: number }) {
  const ink = inkTiming(t, INK, DONE, 3)

  // あるく: いたを かついで 左から
  const w = walk(t, { from: -16, to: STAND_X, start: WALK_FROM, end: ARRIVE, build: 'adult', height: CARPENTER_HEIGHT, armSwing: 10 })
  const x = w.x
  const walking = w.moving ? 1 : 0

  // いたの たかさ: かついで あるくときは 少し 上、はしらの上に のせると 字の位置
  const settle = span(t, SETTLE, SETTLE + 0.5, easeOut)
  const plankY = -CARRY_LIFT * (1 - settle)

  // かなづち: かまえて(pull)、トン と うつ。3かい
  const cycle = (t - KNOCK_FIRST + KNOCK_EVERY) / KNOCK_EVERY
  const knocking = t >= KNOCK_FIRST - KNOCK_EVERY && t < KNOCK_FIRST + KNOCK_EVERY * 3 - KNOCK_EVERY
  const c = cycle % 1
  const pull = knocking ? (c < 0.7 ? easeOut(c / 0.7) : 1 - easeIn((c - 0.7) / 0.3)) : 0

  // 手の場所(こしの x・地面から 見た 場所)。いたを もつ → かなづち → やすめ → ばんざい
  const carryNear: Point = [HAND_ON_PLANK[0], HAND_ON_PLANK[1] + CARRY_LIFT * settle]
  const carryFar: Point = [HAND_ON_PLANK_FAR[0], HAND_ON_PLANK_FAR[1] + CARRY_LIFT * settle]
  const toNail = span(t, NAIL - 0.05, NAIL + 0.2, easeInOut)
  const nailNear: Point = [12 - 5 * pull, -55 - 4 * pull]
  const restNear: Point = [7, -34]
  const cheerNear: Point = [9, -64]
  const toRest = span(t, NAIL_END, BACK, easeInOut)
  const toCheer = span(t, BACK_END - 0.05, BACK_END + 0.4, backOut)
  const nearRel = lerp2(lerp2(lerp2(carryNear, nailNear, toNail), restNear, toRest), cheerNear, toCheer)
  const farHang: Point = [2, -21]
  const farCheer: Point = [4, -62]
  const farRel = lerp2(lerp2(lerp2(carryFar, farHang, toNail), farHang, toRest), farCheer, toCheer)
  const abs = (p: Point): Point => [x + p[0], FLOOR + p[1]]
  const hasHammer = t >= NAIL - 0.05
  const hammerAngle = mix(t, NAIL_END, BACK, -30 * pull + 3, 170) + (toCheer > 0 ? (20 - 170) * Math.min(toCheer, 1) : 0)

  const face = t < NOTICE ? 'strain' : t < SETTLE ? 'surprised' : t < FLY ? 'normal' : 'joy'
  // 小鳥を 見おろす → かなづちを うつ → 見上げて ながめる
  const nod = 9 * during(t, NOTICE, SETTLE + 0.4, 0.2) - 10 * during(t, BACK, FLY_END + 0.3, 0.2)
  const flutter = Math.abs(wave(t, 0.4)) * walking * 8
  const base: PersonProps = {
    x,
    y: FLOOR,
    build: 'adult',
    height: CARPENTER_HEIGHT,
    facing: 'right',
    look: CARPENTER_LOOK,
    face,
    headwear: <Headband flutter={flutter} />,
    pose: { ...w.pose, leftArm: { to: abs(nearRel) }, rightArm: { to: abs(farRel) }, head: nod },
  }
  const rig = personRig(base)
  const hand = rig.world.arms.left.end
  const headPos = rig.world.head
  const headR = rig.body.headR * rig.scale

  // 小鳥: 地面で さびしそう → いたが できて とんでくる → とまって うたう
  const appear = span(t, 0.7, 1.1, backOut)
  const fly = span(t, FLY, FLY_END, easeInOut)
  const birdX = mix(t, FLY, FLY_END, 97, 74)
  const birdY = 89 + (24 - 89) * fly - Math.sin(fly * Math.PI) * 16
  const flying = fly > 0 && fly < 1
  const peck = t < FLY ? Math.max(0, wave(t, 1.4)) * 0.8 : 0
  const hop = t >= FLY_END ? Math.abs(wave(t, 0.8)) * 0.8 : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[[62, 12, 1], [96, 16, 0.86]]} tufts={[6, 44, 70, 101]} />
        <Stones t={t} />
        <Frame t={t} />
        <Layer x={w.x - STAND_X} y={plankY} opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        </Layer>
        <KnockFlash t={t} />
        <Layer opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <Person {...base} held={hasHammer ? <Hammer x={hand[0]} y={hand[1]} angle={hammerAngle} /> : undefined} />
          <Sweat t={t} x={headPos[0] - 6} y={headPos[1] - 2} show={during(t, WALK_FROM + 0.6, ARRIVE + 0.1, 0.2)} />
        </Layer>
        <Notice x={headPos[0]} y={headPos[1]} r={headR} show={during(t, NOTICE + 0.1, SETTLE + 0.1, 0.15)} dir={1} />
        <Layer opacity={appear}>
          <Bird x={birdX} y={birdY - hop - peck} t={t} flying={flying} facing="left" size={1.4} />
          <Sigh x={birdX - 8} y={birdY - 3} p={(t % 1.6) / 1.6} show={during(t, 1.1, FLY - 0.2, 0.2)} dir={-1} />
        </Layer>
        <Note t={t} />
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
    { at: 0, label: '石と どだいと はしらが できる', sound: 'pop' },
    { at: WALK_FROM + 0.3, label: '大工さんが 長い いたを かついで あるいてくる' },
    { at: NOTICE, label: 'さびしそうな 小鳥に 気づく', sound: 'pop' },
    { at: SETTLE, label: 'いたを はしらの上に のせる' },
    { at: NAIL, label: 'かなづちで トントン', sound: 'pop' },
    { at: FLY, label: '小鳥が とんできて、いたに とまる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '工 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
