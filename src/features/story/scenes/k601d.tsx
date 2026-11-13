/*
 * 思(おもう): あたま と こころ で じっと おもう。
 *
 * ほね(画と絵の対応)
 *   1〜5画目(田) … 上の 大きな あたま(あたまの 中で、いろいろ かんがえる)
 *   6画目       … 左の ひざの あたりに ういた こころ の つぶ
 *   7画目       … あぐらを かいた あしの まるい ライン(こころ の うつわ)
 *   8画目       … むねの まんなか の こころ の つぶ
 *   9画目       … 右の ひざの あたりに ういた こころ の つぶ
 *   (あたまの大きさ・あぐらの形は、ほんものの 子どもの かっこうを守って、字と だいたい 同じ場所・向きに した)
 *
 * ながれ
 *   原っぱに 子どもが すわる → ちょうちょうが ひらひら とんできて「なんで?」と こまった顔
 *   → ひじを ひざに のせるように 手を あたまに あて、目を とじて じっと かんがえる
 *   (あたまが あたたかく ひかり、むねの こころ も どきどき)
 *   → こころ の つぶが あふれて「あっ、わかった!」と ひらめく。ちょうちょうが ひざに とまる
 *   → ほね が ひかって、絵が うすくなり、字「思」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ の位置は 手の場所から 計算する)。くび は みじかい。
 *   あぐら は、ひざ が 左右に ひらいて、足の先 が まんなかで 合わさる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '思'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f2a03d'
const SHIRT_DARK = '#d98828'
const PANTS = '#4f7fbf'
const PANTS_DARK = '#3f6aa6'
const HEART = '#ff7a9a'
const HEART_LIGHT = '#ffb3c6'
const GLOW = '#ffe08a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const SIT = 0.9
/** ちょうちょうが とんでくる */
const FLY = 1.3
/** 手を あたまに あてて かんがえる */
const THINK = 2.8
/** こころ が どきどき しはじめる */
const BEAT = 4.0
/** ひらめく */
const AHA = 5.5
const INK = 6.7
const DONE = 9.9
const DURATION = 10.5

/** むこうがわ の しゅんかん に ちかい かたち を まとめる */
type Point = readonly [number, number]

/** かた の場所(左・右) と、うで の ほね の長さ(うえうで・ひじから先) */
const SHOULDER_L: Point = [45, 62]
const SHOULDER_R: Point = [63, 62]
const ARM_PART = 14.5
/** ひざ の上の 手の場所 */
const KNEE_L: Point = [29, 85]
const KNEE_R: Point = [79, 85]
/** かんがえる ときの 手(あごの 下) */
const TEMPLE: Point = [48, 54.5]
/** あたま の まんなか と おおきさ */
const HEAD: Point = [54, 34]
const NECK: Point = [54, 54]

/** かた と 手の場所 から、ひじ の場所を 計算する(かた・ひじ・手 が 同じ長さで つながる)。ひじ は 体の そとがわ へ まがる */
function elbowOf(shoulder: Point, hand: Point, outward: 1 | -1): Point {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.hypot(dx, dy)
  const d = Math.min(Math.max(reach, 0.5), ARM_PART * 2 - 0.2)
  const ux = dx / (reach || 1)
  const uy = dy / (reach || 1)
  const a = d / 2
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - a * a, 0))
  const candidateA: Point = [shoulder[0] + ux * a - uy * h, shoulder[1] + uy * a + ux * h]
  const candidateB: Point = [shoulder[0] + ux * a + uy * h, shoulder[1] + uy * a - ux * h]
  // そとがわ = 左の うで なら x が小さい ほう、右の うで なら x が大きい ほう
  return outward * candidateA[0] < outward * candidateB[0] ? candidateA : candidateB
}

function lerpPoint(a: Point, b: Point, k: number): Point {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[94, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="93.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 94 14)`} />
        ))}
      </Layer>
      <circle cx="94" cy="14" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="12" rx="7" ry="3.2" />
        <ellipse cx="11" cy="10.4" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

type Mood = 'puzzled' | 'think' | 'aha'

/** かお。mood で 目と口と まゆ が かわる。look = 目の むき(ちょうちょうを 見る) */
function Face({ mood, look }: { readonly mood: Mood; readonly look: Point }) {
  const eyes: readonly number[] = [47.6, 60.4]
  return (
    <>
      <circle cx="43.8" cy="41" r="2.5" fill={CHEEK} opacity="0.55" />
      <circle cx="64.2" cy="41" r="2.5" fill={CHEEK} opacity="0.55" />
      {mood === 'puzzled' && (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy="36" r="2.1" fill={EYE} transform={`translate(${look[0]} ${look[1]})`} />
              <circle cx={x + 0.7 + look[0]} cy={35.3 + look[1]} r="0.7" fill="#ffffff" />
            </g>
          ))}
          <path d="M44.6 31.8 l5.8 -1.6 M57.6 30.2 l5.8 1.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M51.6 43.2 q1.2 -1.4 2.4 0 q1.2 1.4 2.4 0" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'think' && (
        <>
          {eyes.map((x) => (
            <path key={x} d={`M${x - 2.4} 36 Q${x} 38.4 ${x + 2.4} 36`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          ))}
          <path d="M44.6 31.6 l5.8 0.6 M57.6 32.2 l5.8 -0.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M51.4 43 h5.2" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'aha' && (
        <>
          {eyes.map((x) => (
            <g key={x}>
              <circle cx={x} cy="35.6" r="2.8" fill={EYE} />
              <circle cx={x + 0.9} cy="34.7" r="1" fill="#ffffff" />
            </g>
          ))}
          <path d="M44.4 30.4 q3 -1.6 6 0 M57.6 30.4 q3 -1.6 6 0" fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M50 41.6 Q54 48 58 41.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Head({ mood, look, tilt }: { readonly mood: Mood; readonly look: Point; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={NECK}>
      {/* みみ */}
      <circle cx="35.4" cy="36" r="3.6" fill={SKIN_SHADE} />
      <circle cx="72.6" cy="36" r="3.6" fill={SKIN_SHADE} />
      <circle cx={HEAD[0]} cy={HEAD[1]} r="19.2" fill={SKIN} />
      {/* かみ: ぼうしの ように あたまの上を おおい、まえがみ を おろす */}
      <path d="M34.6 34 C32 12 76 12 73.4 34 C70 25 63 23.4 54 25 C46 23.4 38.6 25 34.6 34 Z" fill={HAIR} />
      <path d="M52.4 16.4 Q54 12.4 56 15.8" fill="none" stroke={HAIR} strokeWidth="2" strokeLinecap="round" />
      <Face mood={mood} look={look} />
    </Layer>
  )
}

/** かた から ひじ を とおって 手 に つながる うで */
function Arm({ shoulder, hand, outward, color }: { readonly shoulder: Point; readonly hand: Point; readonly outward: 1 | -1; readonly color: string }) {
  const elbow = elbowOf(shoulder, hand, outward)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
    </>
  )
}

type ChildProps = {
  readonly t: number
  readonly mood: Mood
  readonly look: Point
  readonly tilt: number
  readonly handL: Point
  readonly handR: Point
}

function Child({ t, mood, look, tilt, handL, handR }: ChildProps) {
  const breath = wave(t, 2.4) * 0.012
  return (
    <>
      {/* あぐら: ひざ が 左右に ひらき、あしさき が まんなかで あわさる */}
      <path d="M24 87.5 Q54 98 84 87.5" fill="none" stroke={PANTS_DARK} strokeWidth="12.4" strokeLinecap="round" />
      <path d="M26 86.4 Q54 94.4 82 86.4" fill="none" stroke={PANTS} strokeWidth="8.4" strokeLinecap="round" />
      <ellipse cx="46.6" cy="93.2" rx="5" ry="2.8" fill={SKIN} />
      <ellipse cx="61.4" cy="93.2" rx="5" ry="2.8" fill={SKIN_SHADE} />
      {/* どう */}
      <Layer scaleY={1 + breath} origin={[54, 84]}>
        <rect x="41.6" y="55" width="24.8" height="29" rx="9" fill={SHIRT} />
        <path d="M44 78 h20" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* くび */}
      <rect x="50.6" y="50" width="6.8" height="8" rx="3" fill={SKIN_SHADE} />
      <Arm shoulder={SHOULDER_R} hand={handR} outward={1} color={SHIRT_DARK} />
      <Head mood={mood} look={look} tilt={tilt} />
      <Arm shoulder={SHOULDER_L} hand={handL} outward={-1} color={SHIRT_DARK} />
    </>
  )
}

/** むねの こころ。どきどき と ふくらむ */
function ChestHeart({ t }: SceneProps) {
  const show = span(t, BEAT, BEAT + 0.35, backOut)
  if (show <= 0) return null
  const beat = 1 + Math.max(0, wave(t, 0.7)) * 0.22
  const size = show * beat * 1.05
  return (
    <Layer x={54} y={69} scale={size}>
      <path d="M0 6 C-12 -2 -7 -10 0 -4 C7 -10 12 -2 0 6 Z" fill={HEART} />
      <circle cx="-4" cy="-3.4" r="1.4" fill={HEART_LIGHT} />
    </Layer>
  )
}

/** こころ の つぶ: むね から ふわっと あふれて、ひざの 上と むねに おちつく(6・8・9画目のあたり) */
const MOTES: readonly { readonly to: Point; readonly delay: number }[] = [
  { to: [22, 74], delay: 0 },
  { to: [59, 64], delay: 0.2 },
  { to: [88, 66], delay: 0.4 },
]

function Motes({ t }: SceneProps) {
  return (
    <>
      {MOTES.map(({ to, delay }, i) => {
        const p = span(t, AHA - 0.5 + delay, AHA + 0.5 + delay, easeOut)
        if (p <= 0) return null
        const [x, y] = lerpPoint([54, 69], to, p)
        const bob = Math.sin(t * 3 + i * 2) * 0.8 * p
        return (
          <Layer key={i} x={x} y={y - Math.sin(p * Math.PI) * 5 + bob} scale={0.55 + p * 0.25}>
            <path d="M0 3 C-6 -1 -3.4 -6 0 -2.4 C3.4 -6 6 -1 0 3 Z" fill={HEART} />
          </Layer>
        )
      })}
    </>
  )
}

/** かんがえている あたまの ひかり(あたたかい 色)。ひらめきの しゅんかん は ぱっと 大きく */
function HeadGlow({ t }: SceneProps) {
  const warm = during(t, THINK + 0.5, AHA + 0.2, 0.5) * (0.35 + 0.15 * wave(t, 0.9))
  const flash = during(t, AHA, AHA + 0.8, 0.15) * 0.85
  const a = Math.max(warm, flash)
  if (a <= 0) return null
  return (
    <g opacity={a}>
      <circle cx={HEAD[0]} cy={HEAD[1]} r={23 + flash * 5} fill={GLOW} />
    </g>
  )
}

/** こまった「?」。あたまの よこで ゆれる */
function Question({ t, cx, cy, size }: { readonly t: number; readonly cx: number; readonly cy: number; readonly size: number }) {
  const show = during(t, FLY + 0.7, BEAT + 0.4, 0.3)
  if (show <= 0) return null
  const sway = wave(t, 1.4, cx) * 4
  return (
    <Layer opacity={show} x={cx} y={cy + wave(t, 1.1, cx) * 0.8} rotate={sway} scale={size}>
      <path d="M-3 -3.6 Q-3 -7.4 0 -7.4 Q3.4 -7.4 3.4 -4.2 Q3.4 -2 0.8 -0.6 Q0 -0.1 0 1.8" fill="none" stroke="#5f7fd6" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="0" cy="5" r="1.2" fill="#5f7fd6" />
    </Layer>
  )
}

/** ひらめきの 光の すじ */
function Idea({ t }: SceneProps) {
  const p = span(t, AHA, AHA + 0.9, easeOut)
  const show = during(t, AHA, AHA + 0.9, 0.12)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[-50, -20, 20, 50].map((deg) => (
        <path key={deg} d="M0 -26 v-5" stroke="#ffc233" strokeWidth="2" strokeLinecap="round" transform={`translate(${HEAD[0]} ${HEAD[1]}) rotate(${deg}) scale(${0.8 + p * 0.5})`} />
      ))}
      <Star cx={HEAD[0]} cy={9 - p * 2} r={4 + p * 2} color="#ffc233" spin={p * 90} />
    </g>
  )
}

/** ちょうちょう: とんできて、ふらふら とび、さいごに ひざに とまる */
function Butterfly({ t }: SceneProps) {
  const arrive = span(t, FLY, THINK, easeOut)
  if (arrive <= 0) return null
  const land = span(t, AHA + 0.2, AHA + 1.0, easeInOut)
  const hoverX = 86 + Math.sin(t * 2.2) * 5
  const hoverY = 40 + Math.sin(t * 3.1) * 4
  const flyX = mix(t, FLY, THINK, 120, hoverX, easeOut)
  const flyY = mix(t, FLY, THINK, 18, hoverY, easeOut)
  const x = lerpPoint([flyX, flyY], [KNEE_R[0] + 1, KNEE_R[1] - 6.5], land)
  const flap = land >= 1 ? 0.45 + 0.4 * Math.abs(wave(t, 1.6)) : Math.abs(wave(t, 0.22))
  return (
    <Layer x={x[0]} y={x[1]} rotate={land >= 1 ? 0 : wave(t, 1.2) * 12}>
      <Layer scaleX={0.25 + flap * 0.75} origin={[0, 0]}>
        <ellipse cx="-3.8" cy="-2" rx="3.8" ry="3" fill="#ff9ad0" />
        <ellipse cx="3.8" cy="-2" rx="3.8" ry="3" fill="#ff9ad0" />
        <ellipse cx="-3" cy="2.2" rx="2.6" ry="2.2" fill="#ffc6e4" />
        <ellipse cx="3" cy="2.2" rx="2.6" ry="2.2" fill="#ffc6e4" />
      </Layer>
      <rect x="-0.7" y="-3.6" width="1.4" height="8" rx="0.7" fill="#5a3b2a" />
      <path d="M-0.4 -3.4 q-1.4 -2.6 -2.8 -2.8 M0.4 -3.4 q1.4 -2.6 2.8 -2.8" fill="none" stroke="#5a3b2a" strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  const pop = span(t, 0.3, SIT, backOut)
  const mood: Mood = t < THINK ? 'puzzled' : t < AHA ? 'think' : 'aha'

  // 手: ひざ → あたまの よこ → ひざ
  const raise = span(t, THINK, THINK + 0.8, easeInOut) * (1 - span(t, AHA - 0.1, AHA + 0.6, easeInOut))
  const handL = lerpPoint(KNEE_L, TEMPLE, raise)
  const handR: Point = [KNEE_R[0], KNEE_R[1] + wave(t, 2.4) * 0.3]

  // 目は ちょうちょうを 見る(かんがえはじめる まで)。右の ほうへ
  const look: Point = t < THINK ? [0.9 * span(t, FLY, FLY + 0.8), -0.5 * span(t, FLY, FLY + 0.8)] : [0, 0]
  // あたまを かしげる: こまって ななめ → かんがえて うつむく → ひらめいて ぴん
  const tilt = t < THINK ? mix(t, FLY + 0.6, THINK, 0, 7) : t < AHA ? mix(t, THINK, THINK + 0.6, 7, -4) : mix(t, AHA, AHA + 0.3, -4, 0, backOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx="54" cy="97.4" rx="36" ry="3" fill="#000000" opacity="0.1" />
        <HeadGlow t={t} />
        <Layer scale={pop} origin={[54, 96]}>
          <Child t={t} mood={mood} look={look} tilt={tilt} handL={handL} handR={handR} />
          <ChestHeart t={t} />
        </Layer>
        <Motes t={t} />
        <Question t={t} cx={26} cy={22} size={1.1} />
        <Question t={t} cx={84} cy={24} size={0.85} />
        <Idea t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: '原っぱに 子どもが すわる', sound: 'pop' },
    { at: FLY, label: 'ちょうちょうが とんできて「なんで?」' },
    { at: THINK, label: 'あたまに 手を あてて、じっと かんがえる', sound: 'pop' },
    { at: BEAT, label: 'むねの こころ も どきどき' },
    { at: AHA, label: 'あっ、わかった! こころ が あふれる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '思 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
