/*
 * 細(ほそい): くもが 細くて 長い 糸を つむいで、田んぼまで おりていく。
 *
 * ほね(画と絵の対応)
 *   1・2・3画目 … くもが つむいだ 糸の たば(えだ から ゆるく たれる、ほそい 糸)
 *   4画目(丨)  … たばの 下から ま下に のびる、ほそくて 長い 1本の 糸(くもは これに ぶらさがって おりる)
 *   5・6画目   … 風に ふわふわ ういている 糸くず(糸の はし)
 *   7〜11画目  … 田んぼ。まわりの あぜ(7・8・11画目)と、まんなかの 十字の あぜ(9・10画目)
 *
 * ながれ
 *   えだの 先で、おなかを すかせた くもが 糸を つむぐ(糸の たばが できる)
 *   → 田んぼの 上を とぶ はえを みつけて、わくわく
 *   → 細くて 長い 糸で するする おりていく
 *   → 地面に ついて にっこり。はえも ちかくに ふわっと よってくる
 *   → ほね が ひかって、絵が うすくなり、字「細」が のこる
 *
 * 人は 出ない。背景は Backdrop、あせは Sweat。くも・はえ(どうぶつ)は 元の絵のまま。
 * くも・糸・田んぼは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   くもは あし が 8本(左右に 4本ずつ)で、まるい おなか から 糸を出して ぶらさがる。糸は まっすぐ ま下に のびる。
 *   田んぼは 四角で、あぜ が 十字に 区切っている。はえの はね は 2まい。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Sweat } from '../sceneFigures'

const CHAR = '細'

const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const SILK = '#b8accf'
const SILK_THIN = '#a99dc4'
const RIDGE = '#a8774a'
const PADDY_WATER = '#a9d9f7'
const SPIDER = '#7a4e9a'
const SPIDER_DARK = '#5e3a7a'
const SPIDER_LIGHT = '#9a72b8'
const SPIDER_FACE = '#e6cdf2'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const FLY = '#3a3a46'

/** くぎり の時間(秒) */
const SPIN = 0.9
const SPOT = 2.9
const LOWER = 3.4
const LAND = 5.5
const INK = 6.3
const DONE = 9.7
const DURATION = 10.3

/** くもが ぶらさがる えだの 先(糸の つけね) */
const ANCHOR: readonly [number, number] = [30.5, 14]
/** くもが おりたときの 高さ(あし が 地面に つく くらい) */
const GROUND_Y = 87
const HANG_Y = 20
/** くもの 大きさ(からだの 絵を この倍に する) */
const SPIDER_SCALE = 1.5
/** くもの からだの うえはし(おなか の てっぺん)。糸は ここから のびる */
const SPIDER_TOP = -6.4 * SPIDER_SCALE

/** 左の はしから のびる えだ。先に 小さな 葉。くもは この先から 糸を たらす。 */
function Branch({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.6, backOut)
  const sway = wave(t, 3.2) * 1.2
  return (
    <Layer scaleX={Math.max(grow, 0.01)} origin={[-4, 12]}>
      <path d="M-6 9 Q12 8 33 14.6" fill="none" stroke={BARK} strokeWidth="5.2" strokeLinecap="round" />
      <path d="M-4 11 Q12 10.4 31 15.6" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <Layer rotate={sway} origin={[20, 12]}>
        <circle cx="15" cy="6.6" r="4.4" fill={LEAF_DARK} />
        <circle cx="13.6" cy="5.4" r="3.2" fill={LEAF} />
        <circle cx="36" cy="12" r="3.6" fill={LEAF_DARK} />
        <circle cx="35" cy="11" r="2.6" fill={LEAF} />
      </Layer>
    </Layer>
  )
}

/** 田んぼ: 四角い 田を、あぜ が 十字に 区切る。なえ が 風で ゆれる。 */
function Paddy({ t }: SceneProps) {
  const grow = span(t, 0.2, 1.0, backOut)
  const sway = wave(t, 2.2)
  const tufts: readonly (readonly [number, number])[] = [
    [63, 50],
    [82, 50],
    [63, 74],
    [82, 72],
  ]
  return (
    <Layer scaleX={0.7 + 0.3 * grow} scaleY={Math.max(grow, 0.01)} origin={[73, 87]}>
      {/* 水を はった 田: 水の いろ の 上に、なえ が ならぶ */}
      <rect x="53.5" y="36.5" width="39" height="49" rx="2" fill="#c9e6a4" />
      <rect x="57" y="40" width="12" height="1.6" rx="0.8" fill={PADDY_WATER} />
      <rect x="76" y="40" width="12" height="1.6" rx="0.8" fill={PADDY_WATER} />
      {tufts.map(([x, y], i) =>
        [-6, 0, 6].map((dx) => (
          <Layer key={`${i}-${dx}`} rotate={sway * 4} origin={[x + dx, y + 5]}>
            <path d={`M${x + dx - 1.6} ${y + 5} Q${x + dx - 2.4} ${y + 1} ${x + dx - 3} ${y - 1.6} Q${x + dx - 0.6} ${y + 1} ${x + dx} ${y + 5} Z`} fill={LEAF} />
            <path d={`M${x + dx} ${y + 5} Q${x + dx - 0.4} ${y} ${x + dx + 0.2} ${y - 3.6} Q${x + dx + 1.6} ${y + 1} ${x + dx + 1.2} ${y + 5} Z`} fill={LEAF_DARK} />
          </Layer>
        )),
      )}
      {[7, 8, 9, 10, 11].map((n) => (
        <Bone key={n} char={CHAR} n={n} color={RIDGE} width={3.2} />
      ))}
    </Layer>
  )
}

/** くもが つむいだ 糸の たば。えだ から 下へ ゆるく たれる、ほそい 糸。 */
function Skein({ t }: SceneProps) {
  const a = span(t, SPIN, SPIN + 0.5)
  const b = span(t, SPIN + 0.5, SPIN + 1.0)
  const c = span(t, SPIN + 1.0, SPIN + 1.5)
  return (
    <>
      <Bone char={CHAR} n={1} color={SILK} width={1.7} to={a} />
      <Bone char={CHAR} n={2} color={SILK} width={1.7} to={b} />
      <Bone char={CHAR} n={3} color={SILK} width={1.7} to={c} />
    </>
  )
}

/** 風に ういている 糸くず(糸の はし) */
function Wisps({ t }: SceneProps) {
  const show = span(t, SPIN + 1.5, SPIN + 2.0, easeOut)
  const bob = wave(t, 2.6) * 1.2
  return (
    <Layer opacity={show} y={bob}>
      <Bone char={CHAR} n={5} color={SILK_THIN} width={1.2} />
      <Bone char={CHAR} n={6} color={SILK_THIN} width={1.2} />
    </Layer>
  )
}

type Mood = 'hungry' | 'excited' | 'happy'

/** 左右 4本ずつ の あし。かた(からだ)から出て、ひざ で まがる。 */
const LEGS: readonly (readonly [number, number][])[] = [
  [[1.8, 0.4], [5.8, -3], [8.6, 1.2]],
  [[2, 1.5], [6.4, 0], [9, 4.2]],
  [[2, 2.6], [6.2, 3.2], [8, 7]],
  [[1.6, 3.6], [4.8, 5.8], [5.8, 9]],
]

function Legs({ side, wiggle }: { readonly side: 1 | -1; readonly wiggle: number }) {
  return (
    <>
      {LEGS.map((leg, i) => {
        const swing = wiggle * (i % 2 === 0 ? 1 : -1) * 0.6
        const pts = leg.map(([x, y], k) => `${side * x} ${y + (k === 2 ? swing : 0)}`)
        return <path key={i} d={`M${pts[0]} L${pts[1]} L${pts[2]}`} fill="none" stroke={SPIDER_DARK} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      })}
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'hungry') {
    return (
      <>
        <path d="M-2.2 2 l1.6 -0.7 M2.2 2 l-1.6 -0.7" stroke={EYE} strokeWidth="0.5" strokeLinecap="round" />
        <circle cx="-1.2" cy="2.8" r="0.7" fill={EYE} />
        <circle cx="1.2" cy="2.8" r="0.7" fill={EYE} />
        <ellipse cx="0" cy="4.7" rx="0.75" ry="0.55" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'excited') {
    return (
      <>
        <circle cx="-1.2" cy="2.7" r="1" fill="#ffffff" />
        <circle cx="1.2" cy="2.7" r="1" fill="#ffffff" />
        <circle cx="-1" cy="2.8" r="0.6" fill={EYE} />
        <circle cx="1.4" cy="2.8" r="0.6" fill={EYE} />
        <path d="M-1 4.2 Q0 5.9 1 4.2 Z" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <path d="M-2 3 Q-1.2 2 -0.4 3 M0.4 3 Q1.2 2 2 3" fill="none" stroke={EYE} strokeWidth="0.5" strokeLinecap="round" />
      <path d="M-1.1 4.1 Q0 5.3 1.1 4.1" fill="none" stroke={MOUTH} strokeWidth="0.55" strokeLinecap="round" />
      <circle cx="-2.1" cy="4.2" r="0.7" fill={CHEEK} opacity="0.7" />
      <circle cx="2.1" cy="4.2" r="0.7" fill={CHEEK} opacity="0.7" />
    </>
  )
}

/** くも: まるい おなか(上)と あたま(下)。おなかの 先から 糸が のびる。 */
function Spider({ mood, wiggle }: { readonly mood: Mood; readonly wiggle: number }) {
  return (
    <Layer scale={SPIDER_SCALE}>
      <Legs side={-1} wiggle={wiggle} />
      <Legs side={1} wiggle={wiggle} />
      <ellipse cx="0" cy="-2.8" rx="3.7" ry="3.6" fill={SPIDER} />
      <ellipse cx="-1.2" cy="-4.2" rx="1.2" ry="0.9" fill={SPIDER_LIGHT} />
      <circle cx="0" cy="3" r="3" fill={SPIDER_FACE} />
      <Face mood={mood} />
    </Layer>
  )
}

/** はえ: 田んぼの 上を まるく とぶ。はね は 2まい。 */
function Fly({ t }: SceneProps) {
  const appear = span(t, SPOT - 0.5, SPOT - 0.1, backOut)
  if (appear <= 0) return null
  // 田んぼの 上を ぐるぐる とび、くもが おりきると、ちかくへ ふわっと よってくる
  const come = span(t, LAND - 0.2, LAND + 0.9, easeInOut)
  const loopX = 73 + Math.cos(t * 2.4) * 15
  const loopY = 26 + Math.sin(t * 4.8) * 4
  const x = mix(come, 0, 1, loopX, 45) * 1 + 0
  const y = mix(come, 0, 1, loopY, 80)
  const flap = wave(t, 0.1) * 30
  return (
    <Layer x={x} y={y} scale={Math.max(appear, 0.01)}>
      <ellipse cx="-1.4" cy="-1.8" rx="3" ry="1.5" fill="#dff1ff" stroke="#b6cfe4" strokeWidth="0.4" transform={`rotate(${-20 + flap} -0.6 -0.6)`} opacity="0.9" />
      <ellipse cx="1.8" cy="-1.8" rx="3" ry="1.5" fill="#dff1ff" stroke="#b6cfe4" strokeWidth="0.4" transform={`rotate(${20 - flap} 0.6 -0.6)`} opacity="0.9" />
      <ellipse cx="0" cy="0.4" rx="2.2" ry="1.7" fill={FLY} />
      <circle cx="-2.3" cy="0" r="1.3" fill={FLY} />
      <circle cx="-2.9" cy="-0.3" r="0.5" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // くもは はじめ えだの 先に ぶらさがり、すこしずつ 糸を ためる。みつけて から、まっすぐ おりていく
  const arrive = span(t, 0.5, 1.0, backOut)
  const descend = span(t, LOWER, LAND, easeInOut)
  const spiderY = mix(descend, 0, 1, HANG_Y, GROUND_Y, (x) => x)
  const landed = span(t, LAND, LAND + 0.3)
  const swing = wave(t, 1.8) * 1.5 * (1 - landed) * descend
  const mood: Mood = t < SPOT ? 'hungry' : t < LAND ? 'excited' : 'happy'
  // あし の うごき: つむぐとき・おりるとき は ちょこちょこ、ついたら 小さく はずむ
  const busy = t < LAND ? 1 : 0.3
  const wiggle = wave(t, 0.35) * 2 * busy
  const hop = landed > 0 ? Math.abs(wave(t, 0.8)) * 0.8 * landed : 0

  const threadEnd = spiderY + SPIDER_TOP
  const emerge = Math.max(arrive, 0.01)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[99, 10]} clouds={[[60, 14, 1], [-6, 30, 0.85]]} tufts={[6, 44, 98]} />
        <Branch t={t} />
        <Paddy t={t} />
        <Skein t={t} />
        <Wisps t={t} />
        <Fly t={t} />
        <Layer rotate={swing} origin={ANCHOR}>
          <line x1={ANCHOR[0]} y1={ANCHOR[1]} x2={ANCHOR[0] + 0.4} y2={threadEnd + 0.5} stroke={SILK_THIN} strokeWidth="0.9" strokeLinecap="round" opacity={emerge} />
          <Layer x={ANCHOR[0] + 0.4} y={spiderY - hop} scale={emerge}>
            <Spider mood={mood} wiggle={wiggle} />
          </Layer>
        </Layer>
        <Sweat t={t} x={37} y={21} dir={1} show={during(t, SPIN, SPOT, 0.25)} />
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
    { at: 0, label: '田んぼと えだが でてくる', sound: 'pop' },
    { at: SPIN, label: 'おなかの すいた くもが 糸を つむぐ' },
    { at: SPOT, label: '田んぼの はえを みつけて わくわく', sound: 'pop' },
    { at: LOWER, label: '細くて 長い 糸で おりていく' },
    { at: LAND, label: '地面に ついて にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '細 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
