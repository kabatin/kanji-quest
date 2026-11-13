/*
 * 四(よん): しかくい まどの かどを かぞえると 4つ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … まどわく の 左がわ
 *   2画目(𠃍)  … まどわく の 上と 右がわ(右うえ の かど)
 *   5画目(一)  … まどわく の 下(まどの したの わくぎ)
 *   3・4画目   … まどの うちがわ に さがる カーテン(左の カーテン、右の カーテン)
 *
 * ながれ
 *   しかくい まどが できる → 小鳥が とんできて、まどの したの 台に とまる
 *   → 「まどの かどは いくつ?」と くびを かしげる
 *   → 左うえ・右うえ・右した・左した の かど へ とんで、1つずつ かぞえる(かぞえた かど に 星が ともる)
 *   → 4つめ で「よっつ!」と わかって、大よろこび → ほね が ひかり、絵が うすくなって 字「四」になる
 *
 * まどは ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   まどわく は 4つの かど が ある しかく。カーテン は 上の さお から さがる ぬの。
 *   小鳥は はね が せなか から出て、あし は おなか の下。ほんものの 鳥の ように とまる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '四'

const WALL = '#fde9c4'
const WALL_DARK = '#f2d6a6'
const ROOF = '#d9705a'
const ROOF_DARK = '#bf5a46'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const GLASS = '#cdeeff'
const GLASS_LOW = '#e6f7ff'
const CURTAIN = '#f28ab0'
const CURTAIN_LIGHT = '#f9b5cf'
const BIRD = '#5aaee8'
const BIRD_DARK = '#3f90cc'
const BELLY = '#e8f6ff'
const BEAK = '#f2b632'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const STAR = '#ffd24a'
const STAR_LIGHT = '#fff2a8'

/** くぎり の時間(秒) */
const FLY_IN = 0.9
const WONDER = 1.9
const COUNT = 2.9
const CHEER = 6.5
const INK = 7.6
const DONE = 10.2
const DURATION = 10.8

type Point = readonly [number, number]

/** 4つの かど(1画目の はじまり から、書き順どおりに ぐるっと 1まわり) */
const CORNERS: readonly Point[] = [
  [15.5, 31], // 左うえ
  [89, 30], // 右うえ
  [84.5, 79], // 右した
  [22, 80], // 左した
]

/** 台(まどの下の よこ木)の うわ面 の高さ と、まどわく の うわ面 の高さ(小鳥の あしもと) */
const SILL_TOP = 82.5
const FRAME_TOP = 28

type Leg = {
  readonly t0: number
  readonly t1: number
  readonly from: Point
  readonly to: Point
  /** とぶとき の山なり の高さ */
  readonly arc: number
  /** とんでいる間 / とまった とき に 右を むくか */
  readonly flyRight: boolean
  readonly landRight: boolean
}

/** 小鳥の たび。とんで、とまる を つなぐ(かぞえる 順) */
const LEGS: readonly Leg[] = [
  { t0: FLY_IN, t1: 1.8, from: [124, 12], to: [63, SILL_TOP], arc: 6, flyRight: false, landRight: false },
  { t0: COUNT, t1: 3.7, from: [63, SILL_TOP], to: [21, FRAME_TOP], arc: 10, flyRight: false, landRight: false },
  { t0: 3.95, t1: 4.6, from: [21, FRAME_TOP], to: [83, FRAME_TOP], arc: 8, flyRight: true, landRight: true },
  { t0: 4.85, t1: 5.55, from: [83, FRAME_TOP], to: [94, SILL_TOP], arc: 2, flyRight: true, landRight: false },
  { t0: 5.8, t1: CHEER, from: [94, SILL_TOP], to: [12, SILL_TOP], arc: 22, flyRight: false, landRight: true },
]
/** かどに とまった時間(星が ともる) */
const COUNT_AT: readonly number[] = [3.7, 4.6, 5.55, CHEER]
/** よろこびの ジャンプ のあと、空へ とびあがる */
const HOP_END = 6.95
const HOVER: Point = [58, 13]

type BirdState = { readonly x: number; readonly y: number; readonly faceRight: boolean; readonly flying: boolean }

function birdState(t: number): BirdState {
  const last = [...LEGS].reverse().find((leg) => t >= leg.t0)
  if (!last) return { x: LEGS[0].from[0], y: LEGS[0].from[1], faceRight: false, flying: true }
  const p = span(t, last.t0, last.t1, easeInOut)
  if (t < last.t1) {
    const x = last.from[0] + (last.to[0] - last.from[0]) * p
    const y = last.from[1] + (last.to[1] - last.from[1]) * p - Math.sin(p * Math.PI) * last.arc
    return { x, y, faceRight: p > 0.85 ? last.landRight : last.flyRight, flying: true }
  }
  const [px, py] = last.to
  if (t < HOP_END) {
    // かぞえおわったら、うれしくて ぴょん ぴょん
    const hop = t >= CHEER ? Math.abs(Math.sin(span(t, CHEER, HOP_END) * Math.PI * 2)) * 5 : 0
    return { x: px, y: py - hop, faceRight: last.landRight, flying: hop > 1.5 }
  }
  const rise = span(t, HOP_END, INK, easeInOut)
  return {
    x: px + (HOVER[0] - px) * rise,
    y: py + (HOVER[1] - py) * rise - Math.sin(rise * Math.PI) * 6 + (rise >= 1 ? wave(t, 0.9) * 1.2 : 0),
    faceRight: HOVER[0] > px,
    flying: true,
  }
}

type Mood = 'plain' | 'puzzled' | 'happy'

/** 小鳥。あしもと(0,0)が とまる場所。左むきに かいて、右むきは ひっくり返す。 */
function Bird({ t }: SceneProps) {
  const { x, y, faceRight, flying } = birdState(t)
  const mood: Mood = t >= CHEER ? 'happy' : t >= WONDER && t < COUNT ? 'puzzled' : 'plain'
  const puzzled = mood === 'puzzled' ? Math.min(span(t, WONDER, WONDER + 0.3), 1 - span(t, COUNT - 0.2, COUNT)) : 0
  // はばたきは はね の つけね(せなか)を じく に
  const flap = flying ? wave(t, 0.16) * 38 : 0
  const hang = flying ? 0 : 1
  return (
    <Layer x={x} y={y} scaleX={faceRight ? -1 : 1}>
      {/* あし: とまっている ときだけ みえる */}
      {hang > 0 && (
        <g stroke={BEAK} strokeWidth="1" strokeLinecap="round">
          <path d="M-1.8 -2 V0" />
          <path d="M1.6 -2 V0" />
        </g>
      )}
      <path d="M4.6 -7 L11.5 -4.6 L10 -9 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="-6.2" rx="6.4" ry="5" fill={BIRD} />
      <ellipse cx="-1.4" cy="-4.6" rx="4" ry="3" fill={BELLY} />
      <Layer rotate={flap} origin={[0.5, -8]}>
        <path d="M-2.6 -8 Q2.4 -14.6 7.4 -8.2 Q3 -4.4 -2.6 -8 Z" fill={BIRD_DARK} />
      </Layer>
      <Layer rotate={-puzzled * 14} origin={[-3, -8]}>
        <circle cx="-4.2" cy="-11.2" r="4.5" fill={BIRD} />
        <path d="M-8.4 -11.8 L-12 -10.6 L-8.4 -9.4 Z" fill={BEAK} />
        <circle cx="-3.4" cy="-9.4" r="1.15" fill={CHEER_COLOR} opacity="0.55" />
        {mood === 'happy' ? (
          <path d="M-6.9 -11.6 Q-5.9 -13.2 -4.7 -11.6" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
        ) : (
          <circle cx="-5.8" cy="-11.8" r="0.85" fill={EYE} />
        )}
        {mood === 'puzzled' && <path d="M-7.6 -14 L-4.6 -13.2" stroke={BIRD_DARK} strokeWidth="0.8" strokeLinecap="round" />}
      </Layer>
    </Layer>
  )
}

/** ほっぺの 色(CHEEK) */
const CHEER_COLOR = CHEEK

/** うちがわ から みた 絵。しかくい かべ・やね・まど。 */
function House({ t }: SceneProps) {
  const wall = span(t, 0, 0.35, backOut)
  const glass = span(t, 0.3, 0.7)
  // わくは 書き順どおりに のびる(1画目 → 2画目 → 5画目)
  const left = span(t, 0.2, 0.45)
  const topRight = span(t, 0.4, 0.7)
  const bottom = span(t, 0.65, 0.9)
  const sill = span(t, 0.55, 0.9, easeOut)
  const hang = span(t, 0.5, 0.95, backOut)
  const sway = wave(t, 3.2) * 0.8
  return (
    <>
      <circle cx="9" cy="8" r={4.6 * wall} fill={SUN} />
      <Layer scale={wall} origin={[54.5, 97]}>
        <path d="M-2 21 L54.5 2 L111 21 Z" fill={ROOF} />
        <path d="M-2 21 L111 21 V24 H-2 Z" fill={ROOF_DARK} />
        <rect x="3" y="21" width="103" height="76" fill={WALL} />
        <rect x="3" y="21" width="103" height="3.4" fill={WALL_DARK} />
      </Layer>
      <rect x="-4" y="95" width="117" height="14" fill={GRASS} opacity={wall} />
      {[10, 40, 74, 101].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} opacity={wall} />
      ))}
      {/* ガラス: 4つの かどの あいだ を うめる */}
      <path d="M18 33 L88 32.4 L85.4 78 L22.6 79.6 Z" fill={GLASS} opacity={glass} />
      <path d="M22.4 68 L85.6 66.8 L85.4 78 L22.6 79.6 Z" fill={GLASS_LOW} opacity={glass} />
      {/* カーテン: 上の さお から さがる ぬの(3・4画目) */}
      <Layer scaleY={hang} origin={[50, 33]} rotate={sway * 0.5}>
        {/* さお に とおした ぶぶん(わく の すぐ下 から ぬのが はじまる) */}
        <path d="M40.5 33 V36 M59.8 33 V34.3" stroke={CURTAIN} strokeWidth="8" strokeLinecap="butt" />
        <Bone char={CHAR} n={3} color={CURTAIN} width={8} />
        <Bone char={CHAR} n={4} color={CURTAIN} width={8} />
        <Bone char={CHAR} n={3} color={CURTAIN_LIGHT} width={1.8} from={0.1} to={0.9} />
        <Bone char={CHAR} n={4} color={CURTAIN_LIGHT} width={1.8} from={0.1} to={0.9} />
      </Layer>
      <Bone char={CHAR} n={1} color={WOOD} width={6.2} to={left} />
      <Bone char={CHAR} n={2} color={WOOD} width={6.2} to={topRight} />
      <Bone char={CHAR} n={5} color={WOOD} width={6.2} to={bottom} />
      {/* まどの下の 台(小鳥の とまり木) */}
      <Layer scaleX={sill} origin={[53, SILL_TOP]}>
        <rect x="8" y={SILL_TOP} width="90" height="4.8" rx="1.6" fill={WOOD} />
        <rect x="8" y={SILL_TOP + 3.2} width="90" height="1.6" rx="0.8" fill={WOOD_DARK} />
      </Layer>
    </>
  )
}

/** かぞえた かど に ともる 星 */
function CornerStars({ t }: SceneProps) {
  return (
    <>
      {CORNERS.map(([cx, cy], i) => {
        const pop = span(t, COUNT_AT[i], COUNT_AT[i] + 0.35, backOut)
        if (pop <= 0) return null
        const glint = 1 + wave(t, 1.1, i * 0.3) * 0.08
        return (
          <g key={i}>
            <Star cx={cx} cy={cy} r={Math.max(0, 5.4 * pop * glint)} color={STAR} spin={i * 10} />
            <Star cx={cx} cy={cy} r={Math.max(0, 2.4 * pop)} color={STAR_LIGHT} spin={i * 10} />
          </g>
        )
      })}
    </>
  )
}

/** かぞえた ことを しめす 小さな ふきだし(まるい てん が 1・2・3・4こ) */
function Tally({ t }: SceneProps) {
  return (
    <>
      {COUNT_AT.map((at, i) => {
        const show = during(t, at, at + 1.0, 0.18)
        if (show <= 0) return null
        const count = i + 1
        const state = birdState(at)
        const px = Math.min(Math.max(state.x, 12), 97)
        const py = state.y - 20
        const width = count * 4.2 + 3
        const pop = span(t, at, at + 0.3, backOut)
        return (
          <Layer key={i} x={px} y={py} scale={Math.max(0, pop)} opacity={show}>
            <rect x={-width / 2} y="-4" width={width} height="8" rx="4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
            {Array.from({ length: count }, (_, k) => (
              <circle key={k} cx={-width / 2 + 3.1 + k * 4.2 + 0.9} cy="0" r="1.4" fill="#ff7a4d" />
            ))}
          </Layer>
        )
      })}
    </>
  )
}

/** 「まどの かどは いくつ?」と ふしぎがる ふきだし。まどの しかく と ? */
function Wonder({ t }: SceneProps) {
  const show = during(t, WONDER, COUNT, 0.25)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, WONDER, WONDER + 0.35, backOut))
  const bob = wave(t, 1.2) * 0.8
  return (
    <Layer x={62} y={62 + bob} scale={pop} opacity={show}>
      <circle cx="-2" cy="12.4" r="1.2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="-4.4" cy="16.2" r="0.8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <ellipse cx="0" cy="0" rx="13" ry="10.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
      <path d="M-2.8 -3.2 Q-2.8 -6.6 0 -6.6 Q3 -6.6 3 -3.6 Q3 -1.6 0.2 -0.2 V1.8" fill="none" stroke="#6f7cd8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0.2" cy="5.4" r="1.1" fill="#6f7cd8" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <House t={t} />
        <CornerStars t={t} />
        <Wonder t={t} />
        <Bird t={t} />
        <Tally t={t} />
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
    { at: 0, label: 'しかくい まどが できる', sound: 'pop' },
    { at: FLY_IN, label: '小鳥が とんできて、台に とまる' },
    { at: WONDER, label: '「まどの かどは いくつ?」と くびを かしげる', sound: 'pop' },
    { at: COUNT, label: 'かどを 1つずつ かぞえる(1・2・3・4)' },
    { at: CHEER, label: '4つ! と わかって 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '四 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
