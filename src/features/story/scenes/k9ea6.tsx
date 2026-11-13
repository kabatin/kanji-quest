/*
 * 麦(むぎ): 子どもが 麦の なえを あしで ふむと、つよく そだつ。
 *
 * ほね(画と絵の対応)
 *   1・3・4画目(一) … 麦の くき から ひろがる 3だんの 葉(上から 小さい葉、まんなか、いちばん大きな 下の葉)
 *   2画目(丨)       … 麦の くき と、てっぺんの ほ(ほ の 先が 画の はじまり)
 *   5・6・7画目     … 子どもの あし(夂)。うしろ あし は 左下へ、まえ あし は 右下の 地面へ。
 *                      (字になる ときは、子どもが 右の 地面に たっていて、だいたい この あたり)
 *
 * ながれ
 *   ほそくて よわい 麦の なえが ならぶ。子どもが 見て「ちゃんと そだつかな」と しんぱい
 *   → 「よし!」と きめて、なえを ぎゅっ ぎゅっ と あしで ふんで あるく(ふむと ねっこが ふかく のびる)
 *   → ふまれた なえが ぴょん と おきあがって、つよく なる
 *   → まんなかの 麦が ぐんぐん のびて、葉が ひろがり、金いろの ほが 出る
 *   → 子どもは ふりかえって 大よろこび(小鳥も とんでくる) → ほね が ひかって、絵が うすくなり、字「麦」が のこる
 *
 * 子どもは、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あし は こし から 出て ひざ で まがり、あるくと うでと あしは ぎゃく に ふれる。
 *   麦は、くき から 葉が 左右に のびる。字の形に なるのは さいごの しゅんかん だけ。
 */
import { backOut, during, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '麦'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ee7b5a'
const SHIRT_DARK = '#d4633f'
const SHIRT_FAR = '#bb5636'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const SPROUT_WEAK = '#86c26a'
const SPROUT_WEAK_DARK = '#6fb058'
const GRASS = '#c5e8a9'
const SOIL = '#c99f78'
const ROOT = '#f3e6c8'
const SUN = '#ffd24a'
const GOLD = '#f0c445'
const GOLD_DARK = '#c99a2e'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const POP = 0.2
/** 「よし!」と きめる */
const DECIDE = 2.2
/** あるき はじめ・つく */
const WALK = 2.7
const ARRIVE = 5.3
/** 麦が のびはじめ・のびおわり */
const GROW = 4.7
const GROW_END = 6.4
/** ふりかえって うれしい・とびはねる */
const HAPPY = 5.55
const CHEER = 5.9
const INK = 6.8
const DONE = 9.9
const DURATION = 10.4

/** 地面(子どもの 足の うら)の 高さ */
const GROUND = 97
/** 子どもの あるく はじまり・おわり の x */
const START_X = 12
const END_X = 80
/** あるくとき、足が 1しゅうする 回数(1秒に) */
const STEP_RATE = 1.75
/** 麦の くきの x と、くきの 根もと */
const STALK_X = 54.3
const STALK_BASE = 92
/** 子どもが ふむ なえの x(まんなかの 54 が、あとで のびる 麦) */
const SPROUTS: readonly number[] = [24, 34, 44, 54, 64, 72]

/* ───────── 地面・空 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 96 Q18 72 44 88 Q72 66 113 90 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-6" cy="30" rx="7" ry="3.2" />
        <ellipse cx="-1" cy="28" rx="5" ry="3.2" />
        <ellipse cx="88" cy="16" rx="6.4" ry="3" />
        <ellipse cx="93" cy="14.4" rx="4.6" ry="3" />
      </g>
      {/* 土(ねっこが のびる ところ)と、上の 草 */}
      <rect x="-4" y="99" width="117" height="12" fill={SOIL} />
    </>
  )
}

function GrassStrip() {
  return (
    <>
      <path d="M-4 97 Q54 93 113 97 V100.2 Q54 102.4 -4 100.2 Z" fill={GRASS} />
      {[6, 18, 48, 60, 86, 98, 106].map((x) => (
        <path key={x} d={`M${x} 97.4 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ふまれた なえの ねっこ。つよくなるほど、ふかく のびる(g は 0〜1) */
function Roots({ x, g }: { readonly x: number; readonly g: number }) {
  if (g <= 0) return null
  const d = `M${x} 99.5 L${x + 0.5} ${99.5 + 9 * g} M${x} 101 Q${x - 3 * g} ${102 + g} ${x - 5.5 * g} ${101 + 5 * g} M${x} 102.6 Q${x + 3 * g} ${103.6 + g} ${x + 5.5 * g} ${102.6 + 4.4 * g}`
  return <path d={d} fill="none" stroke={ROOT} strokeWidth="0.95" strokeLinecap="round" />
}

/* ───────── 麦の なえ ───────── */

type Blade = { readonly dx: number; readonly h: number; readonly lean: number }
const BLADES: readonly Blade[] = [
  { dx: -3.6, h: 0.8, lean: -1 },
  { dx: -1.8, h: 1, lean: -0.4 },
  { dx: 0, h: 1.15, lean: 0.2 },
  { dx: 1.8, h: 0.95, lean: 0.7 },
  { dx: 3.6, h: 0.75, lean: 1.1 },
]

/** 草の 葉 5まい。strength 0 = ほそくて 先が たれる / 1 = ふとくて まっすぐ。 */
function Blades({ x, strength, sway, weak }: { readonly x: number; readonly strength: number; readonly sway: number; readonly weak: boolean }) {
  const height = 10 + 4 * strength
  const droop = 1 - strength
  const half = 1.1 + 0.5 * strength
  return (
    <>
      {BLADES.map((b, i) => {
        const baseX = x + b.dx
        const tipX = x + b.dx * (0.6 + 0.8 * droop) + b.lean * 1.2 + sway * droop * 1.5
        const tipY = GROUND - height * b.h * (1 - 0.35 * droop)
        const left = `${baseX - half + (tipX - baseX) * 0.2} ${GROUND - height * b.h * 0.6}`
        const right = `${baseX + half + (tipX - baseX) * 0.6} ${GROUND - height * b.h * 0.45}`
        const fill = weak ? (i % 2 ? SPROUT_WEAK : SPROUT_WEAK_DARK) : i % 2 ? LEAF : LEAF_DARK
        return <path key={i} d={`M${baseX - half} ${GROUND} Q${left} ${tipX} ${tipY} Q${right} ${baseX + half} ${GROUND} Z`} fill={fill} />
      })}
    </>
  )
}

type SproutProps = { readonly t: number; readonly x: number; readonly index: number; readonly childX: number }

/** ふまれる なえ。子どもが 近づくと つぶれ、とおりすぎると ぴょん と おきて つよくなる */
function Sprout({ t, x, index, childX }: SproutProps) {
  const appear = span(t, index * 0.06, 0.45 + index * 0.06, backOut)
  if (appear <= 0) return null
  const pressed = Math.sin(Math.PI * span(childX, x - 6, x + 2))
  const rebound = Math.sin(Math.PI * span(childX, x + 2, x + 9))
  const strength = span(childX, x + 1, x + 10, easeOut)
  const sway = wave(t, 2.6, x * 0.1)
  return (
    <Layer scaleX={appear * (1 + 0.3 * pressed)} scaleY={appear * (1 - 0.6 * pressed + 0.22 * rebound)} origin={[x, GROUND]}>
      <g opacity={1 - strength}>
        <Blades x={x} strength={0} sway={sway} weak />
      </g>
      <g opacity={strength}>
        <Blades x={x} strength={1} sway={sway} weak={false} />
      </g>
    </Layer>
  )
}

/** ふんだ しゅんかんの ほこり */
function Dust({ x, childX }: { readonly x: number; readonly childX: number }) {
  const p = span(childX, x - 3, x + 7)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill="#ffffff" opacity={(1 - p) * 0.8}>
      {[-1, 1].map((side) => (
        <ellipse key={side} cx={x + side * (3 + p * 6)} cy={95.4 - p * 3.4} rx={1.2 + p * 2.2} ry={0.9 + p * 1.6} />
      ))}
    </g>
  )
}

/* ───────── のびた 麦 ───────── */

type Point = readonly [number, number]

/** くき から のびる 1まいの 葉。lift は 葉の まんなかが 上へ ふくらむ 高さ */
function Leaf({ node, tip, lift, scale }: { readonly node: Point; readonly tip: Point; readonly lift: number; readonly scale: number }) {
  if (scale <= 0) return null
  const mx = (node[0] + tip[0]) / 2
  const my = (node[1] + tip[1]) / 2 - 2 * lift
  const body = `M${node[0]} ${node[1] - 1} Q${mx} ${my} ${tip[0]} ${tip[1]} Q${mx} ${my + 4.6} ${node[0]} ${node[1] + 1.4} Z`
  return (
    <Layer scale={scale} origin={node}>
      <path d={body} fill={LEAF_DARK} transform="translate(0 0.9)" />
      <path d={body} fill={LEAF} />
    </Layer>
  )
}

type LeafPair = { readonly nodeY: number; readonly left: Point; readonly right: Point; readonly lift: number }
/** 1画目(上)・3画目(まんなか)・4画目(下)の 葉。tip は 画の はし に 合わせる */
const LEAF_PAIRS: readonly LeafPair[] = [
  { nodeY: 51.2, left: [22.5, 54.5], right: [89, 49.2], lift: 4.4 },
  { nodeY: 38.4, left: [29, 39.6], right: [80.5, 36], lift: 4 },
  { nodeY: 25.8, left: [30, 26.6], right: [81, 23.3], lift: 3.8 },
]

/** 金いろの ほ。つぶが 2れつ ならび、先から ほそい 毛(のぎ)が 出る。てっぺんが y=11 */
function Ear({ sway }: { readonly sway: number }) {
  const rows = [24, 20.6, 17.2, 13.8]
  return (
    <Layer rotate={sway} origin={[STALK_X, 26]}>
      <path d={`M${STALK_X} 26 L${STALK_X} 11`} stroke={GOLD_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {rows.map((y) =>
        [-1, 1].map((side) => {
          const gx = STALK_X + side * 2.2
          return (
            <g key={`${y}-${side}`}>
              <path d={`M${gx + side * 0.9} ${y - 2.6} L${gx + side * 4.6} ${y - 8.6}`} stroke={GOLD_DARK} strokeWidth="0.5" strokeLinecap="round" />
              <ellipse cx={gx} cy={y + 0.5} rx="1.8" ry="3.1" fill={GOLD_DARK} transform={`rotate(${side * 26} ${gx} ${y})`} />
              <ellipse cx={gx} cy={y} rx="1.8" ry="3.1" fill={GOLD} transform={`rotate(${side * 26} ${gx} ${y})`} />
            </g>
          )
        }),
      )}
      <path d={`M${STALK_X} 8.2 L${STALK_X} 1.8`} stroke={GOLD_DARK} strokeWidth="0.5" strokeLinecap="round" />
      <ellipse cx={STALK_X} cy="10.2" rx="1.6" ry="3" fill={GOLD} />
    </Layer>
  )
}

/** 子どもが ふんだ まんなかの 麦。くきが のびて、葉が 左右に ひろがり、てっぺんに ほが 出る */
function Wheat({ t }: SceneProps) {
  const grow = span(t, GROW, GROW_END, easeOut)
  if (grow <= 0) return null
  const topY = mix(grow, 0, 1, STALK_BASE, 11, (v) => v)
  const earSway = wave(t, 2.2) * 2.2 * span(grow, 0.9, 1)
  return (
    <>
      <path d={`M${STALK_X} ${STALK_BASE} L${STALK_X} ${topY}`} stroke={LEAF_DARK} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M${STALK_X - 0.6} ${STALK_BASE} L${STALK_X - 0.6} ${topY + 1}`} stroke={LEAF_LIGHT} strokeWidth="1.1" strokeLinecap="round" />
      {LEAF_PAIRS.map((pair) => {
        const reached = (STALK_BASE - pair.nodeY) / (STALK_BASE - 11)
        const scale = span(grow, reached, reached + 0.1, backOut)
        const node = [STALK_X, pair.nodeY] as const
        return (
          <g key={pair.nodeY}>
            <Leaf node={node} tip={pair.left} lift={pair.lift} scale={scale} />
            <Leaf node={node} tip={pair.right} lift={pair.lift} scale={scale} />
          </g>
        )
      })}
      <Layer y={topY - 11} scale={span(grow, 0.8, 1, backOut)} origin={[STALK_X, 26]}>
        <Ear sway={earSway} />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'worried' | 'resolved' | 'happy'

/** うで・あし の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ・ひざ の まがり */
type Joint = { readonly swing: number; readonly bend: number }

const lerpJoint = (a: Joint, b: Joint, k: number): Joint => ({ swing: a.swing + (b.swing - a.swing) * k, bend: a.bend + (b.bend - a.bend) * k })

const SHOULDER: Point = [0, -25]
const HIP_Y = -15
const ARM_PART = 6.6
const LEG_PART = 6.6
const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。からだは 右むき(まえ = x が ふえる ほう)。 */
function Arm({ pose, color }: { readonly pose: Joint; readonly color: string }) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.4" fill={SKIN} />
    </>
  )
}

/** こし から出て、ひざ で まがる あし。ひざ が まがると、あし先は うしろへ あがる。 */
function legAnkle(pose: Joint, hipX: number): { readonly knee: Point; readonly ankle: Point } {
  const knee: Point = [hipX + Math.sin(rad(pose.swing)) * LEG_PART, HIP_Y + Math.cos(rad(pose.swing)) * LEG_PART]
  const shin = pose.swing - pose.bend
  const ankle: Point = [knee[0] + Math.sin(rad(shin)) * LEG_PART, knee[1] + Math.cos(rad(shin)) * LEG_PART]
  return { knee, ankle }
}

function Leg({ pose, hipX, color }: { readonly pose: Joint; readonly hipX: number; readonly color: string }) {
  const { knee, ankle } = legAnkle(pose, hipX)
  return (
    <>
      <path d={`M${hipX} ${HIP_Y} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={ankle[0] + 1.3} cy={ankle[1] + 0.4} rx="3.3" ry="1.9" fill={SHOE} />
    </>
  )
}

/** かお。みぎむき。ずっと 見本の あたま(左むき)の かたち を うらがえして 使う */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g transform="translate(0.5 -34.8) scale(-0.696 0.696) translate(-30.2 -24.6)">
      <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
      <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
      <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' && (
        <>
          {/* まゆ: まんなか が 上がる(しんぱい) */}
          <path d="M23.4 23.2 L27.2 21.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="25.4" cy="25.6" r="1.25" fill={EYE} />
          <path d="M23.4 31 Q24.9 29.4 26.4 30.9" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'resolved' && (
        <>
          {/* まゆ: まんなか が 下がる(きめた かお) */}
          <path d="M23.4 22.2 L27.2 23.6" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="25.4" cy="25.8" r="1.25" fill={EYE} />
          <path d="M23.4 30.4 L26.6 30.4" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M23.6 26.4 Q25.4 23.4 27.2 26.4" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M23 29.2 Q24.9 33.8 27.2 29.4 Z" fill={MOUTH} />
        </>
      )}
    </g>
  )
}

type ChildProps = {
  readonly t: number
  readonly mood: Mood
  readonly nearArm: Joint
  readonly farArm: Joint
  readonly nearLeg: Joint
  readonly farLeg: Joint
  readonly lean: number
  readonly headTilt: number
}

function Child({ t, mood, nearArm, farArm, nearLeg, farLeg, lean, headTilt }: ChildProps) {
  // 足の うら が 地面に つくように、いちばん ひくい あしくび に 合わせて 体を 上下させる
  const lowest = Math.max(legAnkle(nearLeg, 1.4).ankle[1], legAnkle(farLeg, -1.4).ankle[1])
  const settle = -2.3 - lowest
  const worry = during(t, 0.7, DECIDE + 0.1, 0.25)
  const drip = ((t * 0.9) % 1) * 5
  return (
    <Layer y={settle}>
      <Leg pose={farLeg} hipX={-1.4} color={PANTS_DARK} />
      <Leg pose={nearLeg} hipX={1.4} color={PANTS} />
      <Layer rotate={lean} origin={[0, HIP_Y]}>
        <Arm pose={farArm} color={SHIRT_FAR} />
        <rect x="-1.8" y="-30.4" width="3.6" height="4.6" rx="1.6" fill={SKIN_SHADE} />
        <rect x="-4.8" y="-28" width="9.6" height="14.8" rx="4.4" fill={SHIRT} />
        <path d="M-3.4 -18.6 h6.8" stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Arm pose={nearArm} color={SHIRT_DARK} />
        <Layer rotate={headTilt} origin={[0, -29.5]}>
          <Face mood={mood} />
          {/* しんぱいの あせ */}
          <g opacity={worry}>
            <path d={`M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z`} fill="#7cc4f2" transform={`translate(7.6 ${-40 + drip})`} />
          </g>
        </Layer>
      </Layer>
    </Layer>
  )
}

/** うれしい とき の ほし(子どもの まわりで ぽん ぽん) */
function Cheer({ t, x }: { readonly t: number; readonly x: number }) {
  const show = during(t, CHEER, INK + 0.7, 0.2)
  if (show <= 0) return null
  const spots: readonly (readonly [number, number, number])[] = [[-9, -50, 0], [8, -54, 0.25], [-1, -60, 0.5]]
  return (
    <g opacity={show}>
      {spots.map(([dx, dy, late], i) => {
        const p = span(t, CHEER + late, CHEER + late + 0.35, backOut)
        return <Star key={i} cx={x + dx} cy={GROUND + dy - wave(t, 0.8, late) * 0.8} r={Math.max(0, 2.8 * p)} color={i % 2 ? '#ffc233' : '#ff9ec4'} spin={t * 60} />
      })}
    </g>
  )
}

/** 小鳥。麦の ほの よこの 葉に とまって ちゅんちゅん。(葉は 右上に のびた 1画目の 葉) */
function Bird({ t }: SceneProps) {
  const start = 5.5
  const arrive = span(t, start, start + 0.8, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 50
  const y = 6 + arrive * 11.7 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  const note = during(t, start + 1, INK + 1, 0.25)
  return (
    <>
      <Layer x={x} y={y - hop}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
        <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
        </Layer>
      </Layer>
      <g opacity={note} stroke="#f07f9e" strokeWidth="0.8" fill="none">
        <path d={`M${80 - wave(t, 1.2) * 1.2} ${13 - ((t * 5) % 6)} v-4.4 l2.6 -0.8 v4.2`} />
      </g>
    </>
  )
}

/* ───────── 場面 ───────── */

const idleNear: Joint = { swing: 6, bend: 14 }
const idleFar: Joint = { swing: -4, bend: 10 }
const fistNear: Joint = { swing: 32, bend: 100 }
const fistFar: Joint = { swing: 20, bend: 105 }

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // あるく: 左から 右へ。あし の ふり に 合わせて、体が まえに すすむ
  const childX = mix(t, WALK, ARRIVE, START_X, END_X, (v) => v)
  const walking = span(t, WALK, WALK + 0.25) * (1 - span(t, ARRIVE - 0.3, ARRIVE))
  const phase = (t - WALK) * Math.PI * 2 * STEP_RATE
  const swingNow = Math.sin(phase) * walking
  const forwardNow = Math.cos(phase) * walking

  // とびはねる(うれしい)
  const cheerAmp = span(t, CHEER, CHEER + 0.15) * (1 - span(t, 7.6, 7.9))
  const hopRaw = Math.abs(Math.sin(Math.max(0, t - CHEER) * Math.PI * 2.2)) * cheerAmp
  const cheerOn = span(t, CHEER - 0.1, CHEER + 0.25, backOut)

  // あし: あるくとき かわりばんこに ふり、まえに ふるときに ひざを まげて あげる。とぶとき は ひざを たたむ
  const nearLeg: Joint = { swing: 34 * swingNow + 10 * hopRaw, bend: 45 * Math.max(0, forwardNow) + 36 * hopRaw }
  const farLeg: Joint = { swing: -34 * swingNow - 6 * hopRaw, bend: 45 * Math.max(0, -forwardNow) + 36 * hopRaw }

  // うで: 立つときは たらす → 「よし」で こぶし → あるくときは あしと ぎゃくに ふる → たったら たらす → ばんざい
  const fist = span(t, DECIDE - 0.2, DECIDE + 0.1, easeOut)
  const walkIn = span(t, WALK - 0.1, WALK + 0.2)
  const walkOut = span(t, ARRIVE - 0.1, ARRIVE + 0.3)
  const flap = wave(t, 0.45) * 10
  const armFor = (idle: Joint, fistPose: Joint, walkPose: Joint, cheerPose: Joint): Joint => {
    const a = lerpJoint(lerpJoint(idle, fistPose, fist), walkPose, walkIn)
    return lerpJoint(lerpJoint(a, idle, walkOut), cheerPose, cheerOn)
  }
  const nearArm = armFor(idleNear, fistNear, { swing: -swingNow * 30 + 6, bend: 20 }, { swing: 140 + flap, bend: 8 })
  const farArm = armFor(idleFar, fistFar, { swing: swingNow * 30 + 6, bend: 20 }, { swing: 215 - flap, bend: 8 })

  const lean = 8 - 6 * span(t, DECIDE - 0.2, DECIDE + 0.1) + 3 * span(t, WALK, WALK + 0.3) - 5 * span(t, ARRIVE - 0.2, ARRIVE + 0.3) - 4 * span(t, CHEER, CHEER + 0.2)
  const headTilt = (10 + wave(t, 1.6) * 4) * (1 - span(t, DECIDE - 0.2, DECIDE + 0.1)) - 6 * span(t, HAPPY, HAPPY + 0.3)
  const mood: Mood = t < DECIDE - 0.05 ? 'worried' : t < HAPPY ? 'resolved' : 'happy'
  // 右むきで あるき、ついたら 麦のほうへ ふりかえる
  const facing = mix(t, ARRIVE, ARRIVE + 0.4, 1, -1)
  const pop = span(t, POP, POP + 0.45, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        {SPROUTS.map((x) => (
          <Roots key={x} x={x} g={span(t, 0.4, 1.0) * (0.3 + 0.7 * span(childX, x + 1, x + 10, easeOut))} />
        ))}
        <GrassStrip />
        {SPROUTS.map((x, i) => (
          <Sprout key={x} t={t} x={x} index={i} childX={childX} />
        ))}
        <Wheat t={t} />
        {SPROUTS.map((x) => (
          <Dust key={x} x={x} childX={childX} />
        ))}
        <Layer x={childX} y={GROUND - hopRaw * 5} scale={pop * 1.2} origin={[0, 0]}>
          <Layer scaleX={facing}>
            <Child t={t} mood={mood} nearArm={nearArm} farArm={farArm} nearLeg={nearLeg} farLeg={farLeg} lean={lean} headTilt={headTilt} />
          </Layer>
        </Layer>
        <Cheer t={t} x={childX} />
        <Bird t={t} />
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
    { at: 0, label: 'ほそい 麦の なえが ならぶ。子どもが しんぱい', sound: 'pop' },
    { at: DECIDE, label: '「よし!」と きめる' },
    { at: WALK, label: 'なえを あしで ふんで あるく', sound: 'pop' },
    { at: GROW, label: 'ふまれた 麦が ぐんぐん のびる' },
    { at: HAPPY, label: 'ふりかえって 大よろこび。小鳥が とまる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '麦 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
