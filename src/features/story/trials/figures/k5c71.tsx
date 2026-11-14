/*
 * 山(やま): たかい みねが みっつ ならぶ。まんなかが いちばん たかい。(共通部品 sceneFigures で 書きなおした ためし)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … まんなかの 山の りょうせん(てっぺんから ふもとへ おりる、日なた と ひかげ の さかいめ)
 *   2画目(𠃊)  … 左の 山の りょうせん から、ふもと(山すそ と のはら の さかいめ)を 右へ
 *   3画目(丨)  … 右の 山の りょうせん
 *
 * ながれ
 *   のはら に 日が さす → 左・右の 山が ぽこっ ぽこっ と せりあがり、さいごに まんなかの 山が 雲の上まで ぐーんと のびる
 *   → 子どもが うしろすがた で あるいてきて、みねを ひとつずつ ゆびさして かぞえる(まんなかは まうえ を ゆびさす)
 *   → ふりむいて ばんざい → ほね が ひかって、絵が うすくなり、字「山」が のこる
 *
 * 山は、ほんものの 山の つくり を守る:
 *   すそ が ひろがった 三角で、日は 左上から さすので、りょうせん の 左が 日なた・右が ひかげ。
 *   いちばん たかい まんなかの 山にだけ 雪が のこり、雲は その 中ほどに かかる。
 * 子どもは Person(うしろすがた)。山より ずっと てまえ に いるので 大きめに見える。
 * ゆびさす うで は、かた から みね の ほうへ まっすぐ のびる(とどかない ので、さす むき だけ 合う)。
 * 山は 部品に ないので、この 場面の 中で 描く。リュック も 部品に ないので、ここで 描く。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../../sceneParts'
import { Bird, Clouds, Dust, HANG_ARM, mixLimb, PALETTE, Person, personRig, posture, shade, Sun, turnAround, walkDepth, type Look } from '../../sceneFigures'

const CHAR = '山'

/** まんなかの 山(とおくて 大きい): すこし 青みの ある みどり */
const FAR_LIT = '#86c79a'
const FAR_SHADE = '#62a67f'
/** 左右の 山(てまえ): こい みどり */
const NEAR_LIT = '#55b86e'
const NEAR_SHADE = '#3f9c59'
const SNOW = '#ffffff'
const SNOW_SHADE = '#d7e6f2'
const GRASS = PALETTE.grass
const GRASS_NEAR = '#b3df95'
const LEAF = PALETTE.leaf
const SUN = PALETTE.sun
const PACK = '#e8534a'

/** くぎり の時間(秒) */
const RISE_L = 0.25
const RISE_R = 0.75
const RISE_M = 1.3
/** 子どもが あるいてくる・立ちどまる */
const WALK = 2.3
const STOP = 3.3
/** みねを ひとつずつ ゆびさす */
const COUNT_1 = 3.35
/** まんなか(いちばん たかい)を さす 時間は、少し 長く とる */
const COUNT_2 = 3.95
const COUNT_3 = 4.7
/** ふりむいて ばんざい(はねおわってから 字になる) */
const TURN = 5.4
const CHEER = 5.72
const INK = 6.5
const DONE = 9.1
const DURATION = 9.75

type Point = readonly [number, number]
type Side = -1 | 1

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = ([x, y]: Point) => `${r2(x)} ${r2(y)}`

/* ───────── 山の かたち ───────── */

/** 山 1つぶんの形 */
type Peak = {
  /** みねの てっぺん */
  readonly top: Point
  /** ふもと(のはら に かくれる 高さ) */
  readonly foot: number
  /** ふもと での はば の半分 */
  readonly half: number
  /** 山はだ の まっすぐさ(1 = まっすぐな 三角。小さいほど すそ が ひろがる) */
  readonly straight: number
  /** りょうせん: てっぺん から ふもと まで、画の線に そって おりる(SVG の C・L の つづき) */
  readonly ridge: string
}

/** てっぺん を まるくする 長さ(とがりすぎない ように) */
const ROUND = 1.8

/** 1画目の 書きはじめの まがり(まんなかの 山の てっぺん の すぐ下)。雪の かげ にも使う */
const MIDDLE_RIDGE_TOP = 'C53.98 16.5 54.75 19 54.75 21.25'
/** 1画目の たて線の x(雪の ふち が りょうせん と まじわる所) */
const MIDDLE_RIDGE_X = 54.74

/** まんなかの 山: いちばん たかい。てっぺん は 1画目の 書きはじめ */
const MIDDLE: Peak = { top: [52.6, 14.2], foot: 90, half: 44, straight: 0.6, ridge: `${MIDDLE_RIDGE_TOP} L54.5 90` }
/** 左の 山: てっぺん は 2画目の 書きはじめ。りょうせん は 2画目の たての ぶぶん */
const LEFT: Peak = {
  top: [21.5, 53.6],
  foot: 90,
  half: 27,
  straight: 0.6,
  ridge: 'C22.37 55.38 22.88 56.75 22.75 58.25 C22.17 65.24 21.75 74.25 20.25 81.25 L19.9 90',
}
/** 右の 山: てっぺん は 3画目の 書きはじめ */
const RIGHT: Peak = {
  top: [89.24, 48.1],
  foot: 90,
  half: 26,
  straight: 0.6,
  ridge: 'C90.18 49.94 90.88 51.38 90.75 53.25 C90.5 56.93 88.92 73.55 88.2 82.02 L87.6 90',
}

/** 山はだ の上の点。side は 左(-1)・右(1)、d は てっぺん(0)から ふもと(1)まで */
function slopeAt(p: Peak, side: Side, d: number): Point {
  const spread = p.half * (p.straight * d + (1 - p.straight) * d * d)
  return [p.top[0] + side * spread, p.top[1] + (p.foot - p.top[1]) * d]
}

/** 山はだ を d0 から d1 まで なぞる 曲線(2次ベジェ)の 制御点。山はだ は 放物線なので、ぴったり なぞれる */
function slopeControl(p: Peak, side: Side, d0: number, d1: number): Point {
  const [x, y] = slopeAt(p, side, d0)
  const k = (d1 - d0) / 2
  return [x + k * side * p.half * (p.straight + 2 * (1 - p.straight) * d0), y + k * (p.foot - p.top[1])]
}

const tipDepth = (p: Peak) => ROUND / (p.foot - p.top[1])
/** まるめた てっぺん の いちばん上(りょうせん の はじまり) */
const apex = (p: Peak): Point => [p.top[0], p.top[1] + ROUND / 2]

/** 山の りんかく(左の ふもと → てっぺん → 右の ふもと) */
function outlinePath(p: Peak): string {
  const d0 = tipDepth(p)
  return `M${pt(slopeAt(p, -1, 1))} Q${pt(slopeControl(p, -1, d0, 1))} ${pt(slopeAt(p, -1, d0))} Q${pt(p.top)} ${pt(slopeAt(p, 1, d0))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(slopeAt(p, 1, 1))} Z`
}

/** ひかげ の 面: りょうせん より 右がわ(日は 左上から さす) */
function shadePath(p: Peak): string {
  const d0 = tipDepth(p)
  const r0 = slopeAt(p, 1, d0)
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  return `M${pt(apex(p))} ${p.ridge} L${pt(slopeAt(p, 1, 1))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
}

/** 山が せりあがる 度合い(overshoot が 大きいほど、ぽん と 行きすぎてから おちつく) */
function riseOf(t: number, from: number, length: number, overshoot: number): number {
  const x = span(t, from, from + length)
  return easeOut(x) * (1 - overshoot) + backOut(x) * overshoot
}

/** せりあがる 間だけ、ごごご と こきざみに ゆれる */
function shakeOf(t: number, from: number, length: number): number {
  const x = span(t, from, from + length)
  return x > 0 && x < 1 ? wave(t, 0.1) * 0.5 * (1 - x) : 0
}

type MountainProps = {
  readonly peak: Peak
  readonly rise: number
  readonly shake: number
  readonly lit: string
  readonly shade: string
  readonly children?: ReactNode
}

/**
 * 山 1つ。のはら の うしろ から せりあがる(rise = 0 のときは、ぜんぶ のはら に かくれている)。
 * 山はだ に たての すじ(谷すじ など)は 描かない: 字の たて線 と まぎれて、線の数が わからなくなるため。
 */
function Mountain({ peak, rise, shake, lit, shade, children }: MountainProps) {
  if (rise <= 0) return null
  return (
    <Layer x={shake} y={(1 - rise) * (peak.foot - peak.top[1])}>
      <path d={outlinePath(peak)} fill={lit} />
      <path d={shadePath(peak)} fill={shade} />
      {children}
    </Layer>
  )
}

/** 雪の ふち の 高さ */
const SNOW_LINE = 29

/** まんなかの 山の てっぺん の 雪(いちばん たかい ので、雪が のこる)。ふち は とけて たれた ように 下へ ふくらむ */
function Snow({ p }: { readonly p: Peak }) {
  const d0 = tipDepth(p)
  const ds = (SNOW_LINE - p.top[1]) / (p.foot - p.top[1])
  const l = slopeAt(p, -1, ds)
  const r = slopeAt(p, 1, ds)
  const l0 = slopeAt(p, -1, d0)
  const r0 = slopeAt(p, 1, d0)
  const ridge: Point = [MIDDLE_RIDGE_X, SNOW_LINE + 0.8]
  const mid: Point = [(ridge[0] + l[0]) / 2, SNOW_LINE + 1]
  const dripR: Point = [(r[0] + ridge[0]) / 2, SNOW_LINE + 4.6]
  const edge = `Q${pt(dripR)} ${pt(ridge)} Q${pt([(ridge[0] + mid[0]) / 2, SNOW_LINE + 5.6])} ${pt(mid)} Q${pt([(mid[0] + l[0]) / 2, SNOW_LINE + 4.2])} ${pt(l)}`
  const cap = `M${pt(l)} Q${pt(slopeControl(p, -1, d0, ds))} ${pt(l0)} Q${pt(p.top)} ${pt(r0)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r)} ${edge} Z`
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  const shade = `M${pt(apex(p))} ${MIDDLE_RIDGE_TOP} L${pt(ridge)} Q${pt(dripR)} ${pt(r)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
  return (
    <>
      <path d={cap} fill={SNOW} />
      <path d={shade} fill={SNOW_SHADE} />
    </>
  )
}

/** ふもと の 小さな 木。木が こんなに 小さく 見えるほど、山は 大きい(2画目の よこ線 に かからない 左右の はし だけ) */
const FOOT_TREES: readonly (readonly [number, number, number])[] = [
  [2.6, 85.9, 1],
  [6.8, 85.8, 1.3],
  [11, 85.7, 0.85],
  [97.6, 78.9, 1.1],
  [101.8, 78.9, 1.35],
  [106, 79, 0.9],
]

function FootTrees() {
  return (
    <g fill="#2f8447">
      {FOOT_TREES.map(([x, y, s]) => (
        <path key={x} d={`M${x} ${r2(y - 5.4 * s)} Q${r2(x + 0.5 * s)} ${r2(y - 4.6 * s)} ${r2(x + 2 * s)} ${y} H${r2(x - 2 * s)} Q${r2(x - 0.5 * s)} ${r2(y - 4.6 * s)} ${x} ${r2(y - 5.4 * s)} Z`} />
      ))}
    </g>
  )
}

/** のはら: 上の ふち が 山の ふもと(2画目の よこ線)に そう */
const MEADOW = 'M-2 85.6 Q10 85.5 22.25 85 C39.25 82.75 69.37 79.88 87.75 79 Q99 78.5 111 78.6 V111 H-2 Z'
/** くさ の 生えている 場所(子どもの 立つ所 を よける) */
const TUFTS: readonly Point[] = [
  [4, 92],
  [36, 90.5],
  [84, 89],
  [100, 102],
  [16, 104],
]
/** 小さな 花(場所と 色) */
const FLOWERS: readonly (readonly [number, number, string])[] = [
  [11, 94, '#ffffff'],
  [28, 98, '#ffb3c7'],
  [74, 92.5, '#ffffff'],
  [94, 97, '#ffb3c7'],
  [68, 104, '#ffffff'],
]

function Meadow() {
  return (
    <>
      <path d={MEADOW} fill={GRASS} />
      {/* てまえの くさむら(おくゆき を出す) */}
      <path d="M-2 101 Q28 95 56 99.5 T111 97 V111 H-2 Z" fill={GRASS_NEAR} />
      {TUFTS.map(([x, y]) => (
        <path key={x} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {FLOWERS.map(([x, y, color]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="1.1" fill={color} />
          <circle cx={x} cy={y} r="0.45" fill={SUN} />
        </g>
      ))}
    </>
  )
}

/** かぞえた みね が、きらっと ひかる */
function SummitStar({ t, at, peak, big }: { readonly t: number; readonly at: number; readonly peak: Peak; readonly big?: boolean }) {
  const p = span(t, at, at + 0.75)
  if (p <= 0 || p >= 1) return null
  const pop = backOut(Math.min(1, p * 2.4))
  const r = (big ? 4.8 : 3.6) * pop
  const [x, y] = [peak.top[0], peak.top[1] - 3.2]
  return (
    <g opacity={1 - p ** 3}>
      <circle cx={x} cy={y} r={r * 1.5} fill="#fff6c8" opacity="0.7" />
      <Star cx={x} cy={y} r={r} color="#ffc233" spin={p * 90} />
    </g>
  )
}


/* ───────── 空 ───────── */

/** まんなかの 山の 中ほど に かかる 雲(左右の みね より 上。まんなか だけ 雲の上に 出る) */
const CLOUD_SPOTS = [
  [29, 38, 1.1],
  [67, 31, 1],
] as const

/** とおくの 空を わたる 鳥(山より ずっと 小さく 見える) */
function FarBirds({ t }: SceneProps) {
  const show = during(t, 2.0, INK, 0.4)
  if (show <= 0) return null
  return (
    <Layer opacity={show}>
      {[0, 1].map((i) => (
        <Bird key={i} x={108 - (t - 2) * 5 + i * 6} y={18 + i * 3 + wave(t, 2.4, i) * 1.2} t={t + i * 0.3} flying facing="left" size={0.45} color="#5b6b7d" dark="#5b6b7d" />
      ))}
    </Layer>
  )
}

/* ───────── 子ども ───────── */

/** 立ちどまる ところ(足もと)。まんなかの 山の ほぼ ま下 なので、まんなかを さすと うで が まうえ を むく */
const CHILD_AT: Point = [47, 108]
/** 立ちどまった ときの 背の高さ(山より ずっと てまえ なので 大きめ) */
const CHILD_HEIGHT = 29
/** 画面の 下から あるいてくる(はじめ は 大きく) */
const CHILD_FROM: Point = [47, 121]
const CHILD_START_HEIGHT = 35

const CHILD_LOOK: Look = { bottomKind: 'shorts', sleeves: 'short' }
const HAT = PALETTE.sun
const HAT_DARK = shade(PALETTE.sun, 0.2)

/** きいろい ぼうし(あたま 半径 1 の 座標。つば が ぐるりと ある) */
const HAT_SHAPE = (
  <>
    <ellipse cx="0" cy="-0.42" rx="1.38" ry="0.36" fill={HAT_DARK} />
    <path d="M-1.07 -0.42 Q-1.12 -1.6 0 -1.62 Q1.12 -1.6 1.07 -0.42 Z" fill={HAT} />
  </>
)

const BANZAI = posture('banzai', 'front')
/** 立ちどまった うしろすがた(かた の 場所 を しるため) */
const STANDING = personRig({ x: CHILD_AT[0], y: CHILD_AT[1], build: 'child', height: CHILD_HEIGHT, facing: 'back' })

/** かた から みね を まっすぐ ゆびさす うで(うしろむき: 左うで は 画面の 左がわ へ ひらく) */
function pointAt(side: 'left' | 'right', target: Point) {
  const [sx, sy] = STANDING.world.arms[side].root
  const outward = side === 'left' ? -1 : 1
  return { swing: (Math.atan2(outward * (target[0] - sx), target[1] - sy) * 180) / Math.PI, bend: 0 }
}

/** 子どもの 場所と かっこう。みねを かぞえる: ひとつめ は 左うで、ふたつめ・みっつめ は 右うで。さいごに ばんざい */
function childAt(t: number) {
  const walking = walkDepth(t, { from: CHILD_FROM, to: CHILD_AT, start: WALK, end: STOP, build: 'child', height: CHILD_START_HEIGHT, toHeight: CHILD_HEIGHT })
  const turn = turnAround(t, TURN, 'back', 'front', 0.17, 'right')
  const cheer = span(t, CHEER, CHEER + 0.3, backOut)
  const leftUp = span(t, COUNT_1, COUNT_1 + 0.25, easeOut) - span(t, COUNT_2 - 0.05, COUNT_2 + 0.2, easeInOut)
  // みっつめ を さした うで は、ふりむき ながら おろす
  const rightUp = span(t, COUNT_2, COUNT_2 + 0.28, easeOut) - span(t, TURN - 0.1, TURN + 0.12, easeInOut)
  const toRight = span(t, COUNT_3, COUNT_3 + 0.3, easeInOut)
  const rightAim = mixLimb(pointAt('right', MIDDLE.top), pointAt('right', RIGHT.top), toRight)
  const restLeft = walking.pose.leftArm ?? HANG_ARM
  const restRight = walking.pose.rightArm ?? HANG_ARM
  const hop = (at: number, height: number) => Math.sin(span(t, at, at + 0.32) * Math.PI) * height
  // かぞえる たびに ぴょん。まんなか(いちばん たかい)では 大きく。ばんざい で 2かい はねる
  const hops = hop(COUNT_1, 1) + hop(COUNT_2, 2.2) + hop(COUNT_3, 1) + hop(TURN, 1.4) + hop(CHEER + 0.05, 3) + hop(CHEER + 0.38, 2.2)
  return {
    ...walking,
    ...turn,
    lift: hops,
    face: t >= CHEER ? ('joy' as const) : ('smile' as const),
    pose: {
      ...walking.pose,
      leftArm: mixLimb(mixLimb(restLeft, pointAt('left', LEFT.top), leftUp), BANZAI.leftArm ?? HANG_ARM, cheer),
      rightArm: mixLimb(mixLimb(restRight, rightAim, rightUp), BANZAI.rightArm ?? HANG_ARM, cheer),
      head: -9 * leftUp + 9 * rightUp * toRight,
    },
  }
}

/** リュック(うしろすがた の せなか)。部品に ないので ここで 描く。かた から こし の 手前 まで */
function Pack({ child }: { readonly child: ReturnType<typeof childAt> }) {
  const rig = personRig(child)
  const [px, py] = rig.world.pelvis
  const neck = rig.world.neck[1]
  const torso = py - neck
  const w = rig.body.torsoW * rig.scale * 0.8 * child.squash
  return (
    <g data-part="pack">
      <rect x={px - w / 2} y={neck + torso * 0.1} width={w} height={torso * 0.62} rx={w * 0.25} fill={PACK} />
      <rect x={px - w / 2} y={neck + torso * 0.1} width={w} height={torso * 0.25} rx={w * 0.25} fill={shade(PACK, 0.18)} />
    </g>
  )
}

function Child({ t }: SceneProps) {
  if (t < WALK) return null
  const child = childAt(t)
  return (
    <Layer opacity={span(t, WALK, WALK + 0.2)}>
      <Person {...child} look={CHILD_LOOK} headwear={HAT_SHAPE} />
      {child.facing === 'back' && <Pack child={child} />}
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const dust = (from: number) => span(t, from, from + 0.8, easeOut)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} x={14} y={14} />
        <FarBirds t={t} />
        <Mountain peak={MIDDLE} rise={riseOf(t, RISE_M, 1.2, 0.4)} shake={shakeOf(t, RISE_M, 1.2)} lit={FAR_LIT} shade={FAR_SHADE}>
          <Snow p={MIDDLE} />
        </Mountain>
        <Clouds t={t} at={CLOUD_SPOTS} speed={0.7} opacity={0.95 * span(t, 0.2, 0.9)} />
        <Mountain peak={LEFT} rise={riseOf(t, RISE_L, 0.7, 1)} shake={shakeOf(t, RISE_L, 0.7)} lit={NEAR_LIT} shade={NEAR_SHADE} />
        <Mountain peak={RIGHT} rise={riseOf(t, RISE_R, 0.7, 1)} shake={shakeOf(t, RISE_R, 0.7)} lit={NEAR_LIT} shade={NEAR_SHADE} />
        <Meadow />
        <FootTrees />
        {/* つちけむり は、それぞれの 山が のはら から 出てくる 所(のはら の ふち)に 立つ */}
        <Dust x={21.5} y={85.2} p={dust(RISE_L)} reach={14} />
        <Dust x={89} y={79.2} p={dust(RISE_R)} reach={13} />
        <Dust x={54.5} y={81.8} p={dust(RISE_M)} reach={17} />
        <SummitStar t={t} at={COUNT_1 + 0.15} peak={LEFT} />
        <SummitStar t={t} at={COUNT_2 + 0.15} peak={MIDDLE} big />
        <SummitStar t={t} at={COUNT_3 + 0.2} peak={RIGHT} />
        <Child t={t} />
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
    { at: 0, label: '山が ひとつ、また ひとつ、せりあがる', sound: 'pop' },
    { at: RISE_M, label: 'まんなかの 山が、雲の上まで いちばん たかく のびる', sound: 'pop' },
    { at: WALK, label: '子どもが やってくる' },
    { at: COUNT_1, label: 'みねを ゆびさして かぞえる。ひとつ', sound: 'tap' },
    { at: COUNT_2, label: 'ふたつ。まんなかは いちばん たかい', sound: 'tap' },
    { at: COUNT_3, label: 'みっつ', sound: 'tap' },
    { at: TURN, label: 'ふりむいて ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '山 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
