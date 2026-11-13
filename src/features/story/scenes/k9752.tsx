/*
 * 青(あお): 草の めと、いどの みず。どちらも あおい。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 草の いちばん上の 葉(左右に ひらく 1まい ずつ)
 *   2画目(丨)  … 草の くき
 *   3画目(一)  … 草の 2だんめの 葉
 *   4画目(一)  … 草の いちばん下の 大きな 葉(左右に ながく のびる)
 *   5画目(丨)  … いど の 左がわ
 *   6画目(𠃍)  … いど の ふち(上)と 右がわ
 *   7・8画目   … いど の いし の つぎめ(よこ線)
 *
 * ながれ
 *   あつい日。いどの ふちに はえた 草の めが、みずが なくて しおれている
 *   → 子どもが いどの みずを じょうろに くんで、あるいてくる(しんぱいな 顔)
 *   → じょうろで 草の ねもとに みずを かける
 *   → 草が げんきに 立ちあがり、ぐんぐん のびて 葉が ひろがる(子どもは おどろいて、うれしそうに)
 *   → 子どもが じょうろを おいて、バンザイ! ちょうちょも きた
 *   → ほね が ひかって、絵が うすくなり、字「青」が のこる
 *
 * 人・草・いどは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかい。草の 葉は くき から 左右に のび、
 *   みずが ないと しおれて 下を むく。いど は 石を つんだ はこ で、ふち に 土が たまって 草が はえる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '青'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const STEM = '#4c9e54'
const WILT_LEAF = '#bdb866'
const WILT_LEAF_DARK = '#a29e55'
const WILT_STEM = '#a9a35a'
const STONE = '#cfc8ba'
const STONE_DARK = '#b3ab9b'
const STONE_CAP = '#e4ddd0'
const SOIL = '#8a6a4a'
const SOIL_WET = '#5e4630'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const WOOD = '#b27a4c'
const WOOD_DARK = '#8f5e37'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ef8a62'
const SHIRT_DARK = '#d6714a'
const SHORTS = '#4a6fa5'
const SHOE = '#6b4a36'
const CAN = '#e8645a'
const CAN_DARK = '#c94d45'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const WALK = 0.7
const ARRIVE = 2.3
/** じょうろ を もちあげる */
const RAISE = 2.4
/** みず を かけはじめる / かけおわる */
const POUR_FROM = 3.1
const POUR_TO = 4.6
/** みず が しみて、草が ぴんと 立つ */
const PERK = 3.6
/** ぐんぐん のびる */
const GROW_FROM = 3.9
const GROW_TO = 5.7
/** じょうろ を おく / バンザイ */
const LOWER_END = 5.2
const CHEER = 5.45
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** 絵の きまった 場所 */
const GROUND_Y = 96.5
/** いど の ふち(上)の たかさ。草は ここの 土から はえる */
const RIM_Y = 52
const STEM_X = 54.5

/** 子どもの からだ(まんなかの x と、かたの たかさ) */
const CX = 26
const SHOULDER_Y = 71
const ARM_PART = 9

type Point = readonly [number, number]

const mixColor = (from: string, to: string, k: number): string => {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const part = (i: number) =>
    Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * Math.min(Math.max(k, 0), 1))
      .toString(16)
      .padStart(2, '0')
  return `#${part(0)}${part(1)}${part(2)}`
}

/* ───────── けしき ───────── */

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
      <path d="M-4 99 Q18 76 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="88" cy="14" rx="7" ry="3.2" />
        <ellipse cx="93" cy="12" rx="5" ry="3.2" />
        <ellipse cx="-2" cy="30" rx="6" ry="2.8" />
        <ellipse cx="2.4" cy="28.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** いど: 石を つんだ はこ。ふち(上)に 土が たまって いる。 */
function Well({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  return (
    <Layer scaleY={rise} origin={[55, GROUND_Y]}>
      <rect x="36.8" y="56" width="36.7" height={GROUND_Y - 56} rx="2" fill={STONE} />
      {/* 石の つぎめ: よこ線 2本(7・8画目)と、たて の みじかい線 */}
      <g stroke={STONE_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none">
        <path d="M37.4 67.4 H72.9 M37.4 78.4 H72.9" />
        <path d="M49 58 V66.8 M62 58 V66.8 M43 68 V77.8 M55.5 68 V77.8 M67.5 68 V77.8 M49 79 V95.5 M62 79 V95.5" />
      </g>
      <rect x="68.5" y="58" width="5" height={GROUND_Y - 58} rx="2" fill={STONE_DARK} opacity="0.55" />
      <rect x="33.6" y={RIM_Y} width="43" height="6.4" rx="3.2" fill={STONE_CAP} />
      <ellipse cx="55" cy={GROUND_Y + 0.6} rx="22" ry="2.6" fill="#000000" opacity="0.1" />
    </Layer>
  )
}

/** いどの そばに おいた、みずの はいった おけ。 */
function Bucket({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.8, backOut)
  const ripple = 1.4 + wave(t, 1.6) * 0.5
  return (
    <Layer scale={pop} origin={[83.5, GROUND_Y]}>
      <ellipse cx="83.5" cy={GROUND_Y + 0.4} rx="8" ry="1.8" fill="#000000" opacity="0.1" />
      <path d="M77.6 85.5 L89.4 85.5 L88 96 L79 96 Z" fill={WOOD} />
      <path d="M78 89 H89 M78.6 93 H88.4" stroke={WOOD_DARK} strokeWidth="1.1" />
      <ellipse cx="83.5" cy="85.5" rx="5.9" ry="1.8" fill={WATER} />
      <ellipse cx="82.6" cy="85.3" rx={ripple + 1.2} ry="0.55" fill={WATER_LIGHT} />
      <path d="M77.8 85.5 Q83.5 75 89.2 85.5" fill="none" stroke={WOOD_DARK} strokeWidth="1.2" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── 草 ───────── */

type LeafPairProps = {
  readonly ax: number
  readonly ay: number
  readonly length: number
  /** 字の よこ線に そろえて、まとめて かたむける角度 */
  readonly tilt: number
  /** しおれて 下を むく角度 */
  readonly droop: number
  readonly scale: number
  readonly main: string
  readonly dark: string
}

/** 右むきの 葉 1まい。上半分を 明るく、下半分を 少し くらく ぬる。 */
function LeafShape({ length, main, dark }: { readonly length: number; readonly main: string; readonly dark: string }) {
  const w = 2.2 + length * 0.1
  return (
    <>
      <path d={`M0 0 C${length * 0.25} ${-w} ${length * 0.7} ${-w * 0.9} ${length} 0 Z`} fill={main} />
      <path d={`M0 0 C${length * 0.25} ${w * 0.8} ${length * 0.7} ${w * 0.8} ${length} 0 Z`} fill={dark} />
      <path d={`M0.5 0 H${length * 0.9}`} stroke="#ffffff" strokeOpacity="0.35" strokeWidth="0.7" strokeLinecap="round" />
    </>
  )
}

/** くき の 左右に でる 葉。みぎは そのまま、ひだり は ひっくりかえして 同じ形。 */
function LeafPair({ ax, ay, length, tilt, droop, scale, main, dark }: LeafPairProps) {
  if (scale <= 0.01) return null
  return (
    <Layer scale={scale} origin={[ax, ay]}>
      <g transform={`translate(${ax} ${ay}) rotate(${tilt + droop})`}>
        <LeafShape length={length} main={main} dark={dark} />
      </g>
      <g transform={`translate(${ax} ${ay}) scale(-1 1) rotate(${-tilt + droop})`}>
        <LeafShape length={length} main={main} dark={dark} />
      </g>
    </Layer>
  )
}

type PlantProps = {
  /** みず を もらって ぴんと 立った度合い(0 = しおれている) */
  readonly perk: number
  /** のびた 度合い(0 = ちいさな め) */
  readonly grow: number
  readonly sway: number
  readonly wet: number
}

function Plant({ perk, grow, sway, wet }: PlantProps) {
  const droop = 1 - perk
  const stemHeight = 6 + 38 * grow
  const top = RIM_Y - stemHeight
  // しおれた くきは、さきが 右下へ おじぎ する
  const lean = droop * (1 - grow)
  const stemColor = mixColor(WILT_STEM, STEM, perk)
  const main = mixColor(WILT_LEAF, LEAF, perk)
  const dark = mixColor(WILT_LEAF_DARK, LEAF_DARK, perk)
  const lowAttachY = 49 - 4.2 * span(grow, 0, 0.3, easeOut)
  const lowLength = 42 * (0.26 + 0.74 * span(grow, 0, 0.55, easeOut))
  const tipX = STEM_X + 5 * lean
  const tipY = top + 2.5 * lean
  return (
    <>
      {/* 土: みず を すうと こい色に */}
      <ellipse cx={STEM_X} cy={RIM_Y - 0.4} rx="6.4" ry="2" fill={mixColor(SOIL, SOIL_WET, wet)} />
      <Layer rotate={sway} origin={[STEM_X, RIM_Y]}>
        <path d={`M${STEM_X} ${RIM_Y} Q${STEM_X} ${RIM_Y - stemHeight * 0.55} ${tipX} ${tipY}`} fill="none" stroke={stemColor} strokeWidth="3" strokeLinecap="round" />
        <LeafPair ax={STEM_X} ay={lowAttachY} length={lowLength} tilt={-3} droop={42 * droop} scale={1} main={main} dark={dark} />
        <LeafPair ax={STEM_X} ay={31.7} length={20.5} tilt={-4.9} droop={20 * droop} scale={span(grow, 0.42, 0.72, backOut)} main={main} dark={dark} />
        <LeafPair ax={STEM_X} ay={20.1} length={22.3} tilt={-3.4} droop={20 * droop} scale={span(grow, 0.68, 0.95, backOut)} main={main} dark={dark} />
        {/* てっぺんの め */}
        <g transform={`translate(${tipX} ${tipY}) rotate(${lean * 75})`}>
          <ellipse cx="0" cy="-1.6" rx="1.9" ry="3.4" fill={mixColor(WILT_LEAF, LEAF_LIGHT, perk)} />
        </g>
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'worried' | 'surprised' | 'happy'

type ArmAngles = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** うで の さき。swing = ま下から そとへ あげた角度 / bend = ひじ から さきを さらに あげた角度。 */
function armPoints(shoulder: Point, pose: ArmAngles, side: 1 | -1): { readonly elbow: Point; readonly hand: Point } {
  const elbow: Point = [shoulder[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Point = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return { elbow, hand }
}

/** かた から出て、ひじ で まがる うで。そで(シャツ)から 先は はだ。 */
function Arm({ shoulder, pose, side }: { readonly shoulder: Point; readonly pose: ArmAngles; readonly side: 1 | -1 }) {
  const { elbow, hand } = armPoints(shoulder, pose, side)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="4.6" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="3.6" strokeLinecap="round" />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <g>
      <circle cx="-5.4" cy="3.8" r="1.8" fill={CHEEK} opacity="0.55" />
      <circle cx="5.4" cy="3.8" r="1.8" fill={CHEEK} opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d="M-5.4 -1.2 L-2.2 -2.8 M5.4 -1.2 L2.2 -2.8" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="-2.9" cy="1.2" r="1.15" fill={EYE} />
          <circle cx="3.5" cy="1.2" r="1.15" fill={EYE} />
          <path d="M-1.7 5.9 Q0.2 4.3 2.1 5.9" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M-5.2 -2.6 Q-3.4 -4.2 -1.6 -2.8 M1.8 -2.8 Q3.6 -4.2 5.4 -2.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="-2.9" cy="1" r="1.6" fill={EYE} />
          <circle cx="3.5" cy="1" r="1.6" fill={EYE} />
          <circle cx="-2.4" cy="0.4" r="0.5" fill="#ffffff" />
          <circle cx="4" cy="0.4" r="0.5" fill="#ffffff" />
          <ellipse cx="0.3" cy="5.6" rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M-4.9 1.8 Q-3.3 -0.6 -1.7 1.8 M1.9 1.8 Q3.5 -0.6 5.1 1.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.8 4.4 Q0.2 9 3.2 4.4 Z" fill={MOUTH} />
        </>
      )}
    </g>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmAngles
  readonly farArm: ArmAngles
  readonly sweat: number
  readonly t: number
}

const NEAR_SHOULDER: Point = [CX + 4.5, SHOULDER_Y]
const FAR_SHOULDER: Point = [CX - 4.5, SHOULDER_Y]
const HEAD: Point = [CX, 58.2]

function Child({ step, mood, nearArm, farArm, sweat, t }: ChildProps) {
  return (
    <>
      <Arm shoulder={FAR_SHOULDER} pose={farArm} side={-1} />
      {/* あし: こし から ふる。くつ は 少し まえ(右)へ */}
      {[-3.3, 3.3].map((dx, i) => (
        <Layer key={dx} rotate={step * (i === 0 ? 20 : -20)} origin={[CX + dx, 83]}>
          <rect x={CX + dx - 2.3} y="81" width="4.6" height="14" rx="2.3" fill={SKIN} />
          <ellipse cx={CX + dx + 1} cy="95.2" rx="4.4" ry="2.3" fill={SHOE} />
        </Layer>
      ))}
      {/* くび(みじかい) */}
      <rect x={CX - 1.9} y="65.4" width="3.8" height="4" rx="1.4" fill={SKIN_SHADE} />
      <rect x={CX - 5.6} y="67.6" width="11.2" height="16" rx="4.6" fill={SHIRT} />
      <rect x={CX - 5.9} y="79" width="11.8" height="6.4" rx="2.6" fill={SHORTS} />
      <Arm shoulder={NEAR_SHOULDER} pose={nearArm} side={1} />
      {/* あたま */}
      <circle cx={HEAD[0]} cy={HEAD[1]} r="8.4" fill={SKIN} />
      <path d={`M${CX - 8.6} 56.4 C${CX - 9} 47 ${CX + 9} 47 ${CX + 8.6} 56.4 C${CX + 6} 52.4 ${CX - 5} 52 ${CX - 8.6} 56.4 Z`} fill={HAIR} />
      <path d={`M${CX + 1} 50.2 Q${CX + 1.8} 47 ${CX + 3.6} 49 Q${CX + 4.6} 46.6 ${CX + 5.4} 49.4`} fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${HEAD[0]} ${HEAD[1]})`}>
        <Face mood={mood} />
      </g>
      {sweat > 0 && (
        <g opacity={sweat}>
          {[0, 0.5].map((offset) => {
            const p = ((t + offset) % 1) / 1
            return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={WATER} transform={`translate(${CX + 10.5 + p * 1.5} ${50 + p * 9})`} opacity={1 - p} />
          })}
        </g>
      )}
    </>
  )
}

/* ───────── じょうろ・みず ───────── */

/** 手の 場所(0,0)を じく に かいた じょうろ。さきの くち は (SPOUT_X, SPOUT_Y)。 */
const SPOUT: Point = [11, -9]

function WateringCan() {
  return (
    <>
      <path d="M6 8 L11 -8" stroke={CAN_DARK} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="11.2" cy="-9.2" rx="2.4" ry="1.1" fill={CAN_DARK} transform="rotate(-18 11.2 -9.2)" />
      <path d="M-5.2 3.2 Q-5.6 0 0 0 Q5.6 0 5.2 3.2" fill="none" stroke={CAN_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="-6" y="2.5" width="12" height="9" rx="2.2" fill={CAN} />
      <rect x="-6" y="6.2" width="12" height="1.4" fill={CAN_DARK} />
    </>
  )
}

function WaterStream({ from, flow, t }: { readonly from: Point; readonly flow: number; readonly t: number }) {
  if (flow <= 0) return null
  const end: Point = [STEM_X - 0.6, RIM_Y - 1.2]
  return (
    <g opacity={flow}>
      {Array.from({ length: 7 }, (_, i) => {
        const p = (t * 2.4 + i / 7) % 1
        const x = from[0] + (end[0] - from[0]) * p
        const y = from[1] + (end[1] - from[1]) * p * p
        return <path key={i} d="M0 -1.8 Q1.3 0.4 0 1.5 Q-1.3 0.4 0 -1.8 Z" fill={WATER} transform={`translate(${x} ${y}) scale(1.5)`} />
      })}
      <ellipse cx={end[0]} cy={RIM_Y - 0.6} rx={2.4 + wave(t, 0.4) * 0.7} ry="0.8" fill={WATER_LIGHT} />
    </g>
  )
}

/* ───────── にぎやかし ───────── */

function Butterfly({ t }: SceneProps) {
  const p = span(t, CHEER, CHEER + 1.5, easeOut)
  if (p <= 0) return null
  const x = 112 - 26 * p + wave(t, 0.9) * 2
  const y = 30 + wave(t, 1.1) * 3 - p * 3
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.5))
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${flap} 1)`}>
        <ellipse cx="-2.4" cy="-1.4" rx="2.6" ry="2" fill="#f07f9e" />
        <ellipse cx="2.4" cy="-1.4" rx="2.6" ry="2" fill="#f07f9e" />
        <ellipse cx="-1.8" cy="1.2" rx="1.8" ry="1.5" fill="#ffb3c6" />
        <ellipse cx="1.8" cy="1.2" rx="1.8" ry="1.5" fill="#ffb3c6" />
      </g>
      <ellipse cx="0" cy="0" rx="0.6" ry="2.2" fill="#5a3b2a" />
    </g>
  )
}

/* ───────── 場面 ───────── */

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // あるく: 左から いどの そばまで
  const walking = 1 - span(t, ARRIVE - 0.3, ARRIVE)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, ARRIVE, -52, 0, (x) => x * (2 - x) * 0.5 + x * 0.5)
  const bob = -Math.abs(stride) * 1.2
  const hp = span(t, CHEER, CHEER + 1.0)
  const hop = hp > 0 && hp < 1 ? Math.abs(Math.sin(hp * Math.PI * 2)) * 3.2 : 0

  const mood: Mood = t < 3.4 ? 'worried' : t < 4.4 ? 'surprised' : 'happy'

  // 右うで: じょうろ を さげて あるく → もちあげて みず を かける → おろす → バンザイ
  const up = span(t, RAISE, POUR_FROM, easeInOut)
  const down = span(t, POUR_TO, LOWER_END, easeInOut)
  const cheer = span(t, LOWER_END, LOWER_END + 0.55, backOut)
  const carry: ArmAngles = { swing: 14 + stride * 5, bend: 60 }
  const pourPose: ArmAngles = { swing: 140, bend: 27 }
  const cheerPose: ArmAngles = { swing: 135, bend: 15 }
  const hold = up * (1 - down)
  const nearArm: ArmAngles = {
    swing: carry.swing + (pourPose.swing - carry.swing) * hold + (cheerPose.swing - carry.swing) * cheer,
    bend: carry.bend + (pourPose.bend - carry.bend) * hold + (cheerPose.bend - carry.bend) * cheer,
  }
  const farCheer = span(t, LOWER_END + 0.1, LOWER_END + 0.65, backOut)
  const farArm: ArmAngles = { swing: lerp(8 + stride * 4, 135, farCheer), bend: lerp(6, 15, farCheer) }

  // じょうろ: 手に もたれて うごく。かたむけると、さきから みず が でる
  const tilt = 9 * span(t, POUR_FROM - 0.1, POUR_FROM + 0.35) * (1 - span(t, POUR_TO - 0.3, POUR_TO))
  const canHand = armPoints(NEAR_SHOULDER, nearArm, 1).hand
  const restHand = armPoints(NEAR_SHOULDER, { swing: 14, bend: 60 }, 1).hand
  const holding = t < LOWER_END
  const spoutTip: Point = [
    canHand[0] + walkX + SPOUT[0] * Math.cos(rad(tilt)) - SPOUT[1] * Math.sin(rad(tilt)),
    canHand[1] + SPOUT[0] * Math.sin(rad(tilt)) + SPOUT[1] * Math.cos(rad(tilt)),
  ]
  const flow = tilt > 4 ? during(t, POUR_FROM + 0.1, POUR_TO - 0.1, 0.15) : 0

  // 草: みず が しみて ぴんと 立ち、ぐんぐん のびる
  const perk = span(t, PERK, PERK + 0.7, easeOut)
  const grow = span(t, GROW_FROM, GROW_TO, easeInOut)
  const wet = span(t, POUR_FROM + 0.4, POUR_FROM + 1.2) * (1 - span(t, GROW_TO, DONE))
  const sway = wave(t, 3) * 1.1 * grow * (1 - span(t, INK - 0.5, INK - 0.1))

  const sweat = during(t, WALK + 0.2, 3.2, 0.3)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Well t={t} />
        <Bucket t={t} />
        <Layer opacity={span(t, 0.5, 0.9)}>
          <Plant perk={perk} grow={grow} sway={sway} wet={wet} />
        </Layer>
        {/* 子どもの かげ と 子ども */}
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={CX + walkX} cy={GROUND_Y + 0.6} rx={9 - hop} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob - hop}>
            <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} sweat={sweat} t={t} />
            {holding && (
              <g transform={`translate(${canHand[0]} ${canHand[1]}) rotate(${tilt})`}>
                <WateringCan />
              </g>
            )}
            {holding && <circle cx={canHand[0]} cy={canHand[1]} r="2.5" fill={SKIN} />}
          </Layer>
        </Layer>
        {!holding && (
          <g transform={`translate(${restHand[0]} ${restHand[1] + (GROUND_Y - 0.8 - (restHand[1] + 11.5))})`}>
            <WateringCan />
          </g>
        )}
        <WaterStream from={[spoutTip[0], spoutTip[1]]} flow={flow} t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: 'いどの ふちの 草の めが しおれている', sound: 'pop' },
    { at: WALK, label: '子どもが いどの みずを じょうろに くんで あるいてくる' },
    { at: POUR_FROM, label: '草の ねもとに みずを かける', sound: 'pop' },
    { at: PERK, label: '草が ぴんと 立つ。子どもは びっくり' },
    { at: GROW_FROM, label: '草が ぐんぐん のびて 葉が ひろがる' },
    { at: CHEER, label: '子どもは バンザイ。ちょうちょも くる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '青 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
