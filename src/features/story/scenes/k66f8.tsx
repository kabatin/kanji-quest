/*
 * 書(かく): ふでを 手に もって、もじを かく。
 *
 * ほね(画と絵の対応)
 *   1〜5画目(よこ)… ふでを にぎる 手(ゆびが ふでに まきつく)。さいごに ふでを もちあげた ときの こぶし の あたり
 *   6画目(丨)     … ふでの え(たて に もった ふで。いちばん下が ふでさき)
 *   7〜10画目(日)  … つくえの 上の 紙(かみ)。ここに もじが かかれる
 *                    (字と ぴったり重ならなくても、だいたい 同じ あたりに ある)
 *
 * ながれ
 *   つくえと 紙が できて、子どもが ふでを もって すわる。でも 何を かいたら いいか わからず こまった顔
 *   → すずり の すみに きづいて「あ!」。ふでを すずりに ちょん ちょん とつける
 *   → 紙の 上に「三」と 3本、ゆっくり かく(かおが まじめ)
 *   → できた! ふでを もちあげて にっこり。ふでが 6画目の たて線 に そろう
 *   → ほね が ひかって、絵が うすくなり、字「書」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ の位置は、かた と 手 から 計算して つなげる)。
 *   ふでは えを ゆびで もち、ふでさき は 下を むく。ものを かく ときは ふでが 少し ななめに なる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '書'

const WALL = '#fbefd5'
const WALL_SHADE = '#f2e1bd'
const SKY = '#bfe6fb'
const FRAME = '#c9a06a'
const DESK = '#d9a76a'
const DESK_DARK = '#c18f55'
const DESK_LIGHT = '#e8bd85'
const PAPER = '#fffdf6'
const PAPER_SHADE = '#e8e2cf'
const STONE = '#4a4a56'
const STONE_LIGHT = '#6a6a78'
const SUMI = '#15151c'
const SUMI_LIGHT = '#4a4a5c'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SLEEVE = '#e8715a'
const SLEEVE_DARK = '#c95a45'
const TUNIC = '#ec7f66'
const HANDLE = '#d9a24e'
const FERRULE = '#b48a3c'
const BRISTLE_DRY = '#e9d8b4'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const SPARK = '#ffd24a'

/** くぎり の時間(秒) */
const UNSURE = 1.1
const NOTICE = 1.7
const DIP = 2.5
const WRITE = 3.85
const HAPPY = 5.5
const INK = 6.1
const DONE = 9.0
const DURATION = 9.6

/** かた・うでの 長さ(うえうで・まえうで)。ひじ は これと 手の場所 から きまる */
const SHOULDER: readonly [number, number] = [34, 43]
const FAR_SHOULDER: readonly [number, number] = [28, 44]
const UPPER = 20
const FORE = 19
/** つくえの 手前(から 下)が 見える ところ。ここより 上は むこうの かべ */
const DESK_TOP = 56
/** ふでを もった 手の 中心 と ふでさき(6画目の えが ま上にある ときの 位置) */
const HAND0: readonly [number, number] = [54, 43]
const TIP0: readonly [number, number] = [55, 60]
const TIP_OFFSET: readonly [number, number] = [TIP0[0] - HAND0[0], TIP0[1] - HAND0[1]]
/** すずり の すみ の ところ */
const WELL: readonly [number, number] = [75, 62]

const rad = (deg: number) => (deg * Math.PI) / 180

type Point = readonly [number, number]

/** かた と 手 から、ひじ の場所を きめる(2つの ほね を つなげる)。ひじ は 下がわ に まがる。 */
function elbowOf(shoulder: Point, hand: Point, upper: number, fore: number, side: 1 | -1): { elbow: Point; hand: Point } {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const reach = Math.hypot(dx, dy)
  const d = Math.min(Math.max(reach, 8), upper + fore - 0.05)
  const ux = dx / (reach || 1)
  const uy = dy / (reach || 1)
  const a = (upper * upper - fore * fore + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, upper * upper - a * a))
  return {
    elbow: [shoulder[0] + ux * a - uy * h * side, shoulder[1] + uy * a + ux * h * side],
    hand: [shoulder[0] + ux * d, shoulder[1] + uy * d],
  }
}

/* ───────── ふでの うごき ───────── */

type Key = { readonly t: number; readonly x: number; readonly y: number; readonly r: number; readonly linear?: boolean }

/** ふでさき の 場所(x, y)と ふでの かたむき r(度)。かく ときだけ 一定の はやさで うごく。 */
const KEYS: readonly Key[] = [
  { t: 0, x: 55, y: 60, r: 0 },
  { t: NOTICE, x: 55, y: 60, r: 0 },
  { t: DIP, x: 73, y: 54, r: -18 },
  { t: 2.8, x: WELL[0] - 1, y: WELL[1], r: -18 },
  { t: 3.0, x: WELL[0] - 1, y: WELL[1], r: -18 },
  { t: 3.3, x: 74, y: 54, r: -18 },
  { t: 3.75, x: 46, y: 66, r: 10 },
  { t: WRITE, x: 46.5, y: 70, r: 10 },
  { t: 4.15, x: 62, y: 69.5, r: 10, linear: true },
  { t: 4.3, x: 62, y: 67, r: 10 },
  { t: 4.45, x: 47, y: 72.5, r: 10 },
  { t: 4.55, x: 47.5, y: 75, r: 10 },
  { t: 4.85, x: 63, y: 75, r: 10, linear: true },
  { t: 4.95, x: 63, y: 72.5, r: 10 },
  { t: 5.1, x: 47, y: 77.5, r: 10 },
  { t: 5.2, x: 47.5, y: 80, r: 10 },
  { t: 5.5, x: 62, y: 80, r: 10, linear: true },
  { t: 6.1, x: TIP0[0], y: TIP0[1], r: 0 },
]

function brushAt(t: number): { tip: Point; r: number } {
  const next = KEYS.findIndex((key) => key.t >= t)
  if (next <= 0) return { tip: [KEYS[0].x, KEYS[0].y], r: KEYS[0].r }
  if (next < 0) return { tip: [TIP0[0], TIP0[1]], r: 0 }
  const from = KEYS[next - 1]
  const to = KEYS[next]
  const k = span(t, from.t, to.t, to.linear ? undefined : easeInOut)
  return { tip: [from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k], r: from.r + (to.r - from.r) * k }
}

/** ふでさき と かたむき から、手の 中心を もとめる */
function handOf(tip: Point, r: number): Point {
  const c = Math.cos(rad(r))
  const s = Math.sin(rad(r))
  return [tip[0] - (TIP_OFFSET[0] * c - TIP_OFFSET[1] * s), tip[1] - (TIP_OFFSET[0] * s + TIP_OFFSET[1] * c)]
}

/* ───────── へや ───────── */

function Wall({ t }: SceneProps) {
  const cloudX = (t * 1.6) % 40
  // 小鳥が 窓の まえを よこぎる
  const bird = span(t, 0.9, 3.4)
  const flap = wave(t, 0.25) * 1.5
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={WALL} />
      <rect x="0" y="48" width="109" height="12" fill={WALL_SHADE} />
      <rect x="75" y="7" width="28" height="26" rx="2" fill={FRAME} />
      <clipPath id="k66f8-window">
        <rect x="77" y="9" width="24" height="22" rx="1" />
      </clipPath>
      <g clipPath="url(#k66f8-window)">
        <rect x="77" y="9" width="24" height="22" fill={SKY} />
        <g fill="#ffffff" transform={`translate(${cloudX - 26} 0)`}>
          <ellipse cx="86" cy="24" rx="6" ry="2.8" />
          <ellipse cx="90" cy="22.6" rx="4.2" ry="2.8" />
        </g>
        {bird > 0 && bird < 1 ? (
          <path d={`M${-2.4} 0 Q${-1.2} ${-2 - flap} 0 0 Q${1.2} ${-2 - flap} 2.4 0`} fill="none" stroke="#4a5a74" strokeWidth="0.9" strokeLinecap="round" transform={`translate(${104 - bird * 30} ${18 + Math.sin(bird * 6) * 1.5})`} />
        ) : null}
      </g>
      <path d="M89 9 V31 M77 20 H101" stroke={FRAME} strokeWidth="1.3" />
    </>
  )
}

function DeskTop() {
  return (
    <>
      <rect x="0" y={DESK_TOP} width="109" height={109 - DESK_TOP} fill={DESK} />
      <rect x="0" y={DESK_TOP} width="109" height="2.6" fill={DESK_DARK} />
      <path d="M4 63 H30 M70 101 H104 M12 92 H34 M88 78 H104" stroke={DESK_LIGHT} strokeWidth="1" strokeLinecap="round" />
    </>
  )
}

/** すずり。すみ が たまっている。ふでを つけると なみ が ひろがる。 */
function Inkstone({ t }: SceneProps) {
  const ripple = span(t, 2.75, 3.25)
  return (
    <>
      <rect x="64" y="57" width="22" height="12" rx="3" fill={STONE} />
      <rect x="64" y="57" width="22" height="2.4" rx="1.2" fill={STONE_LIGHT} />
      <ellipse cx={WELL[0]} cy={WELL[1]} rx="8" ry="4" fill={SUMI} />
      <ellipse cx="72.4" cy="60.6" rx="2.2" ry="0.8" fill={SUMI_LIGHT} />
      {ripple > 0 && ripple < 1 ? <ellipse cx={WELL[0] - 1} cy={WELL[1]} rx={1.5 + ripple * 5.5} ry={0.8 + ripple * 2.6} fill="none" stroke={SUMI_LIGHT} strokeWidth="0.6" opacity={1 - ripple} /> : null}
    </>
  )
}

/** 紙と、かかれた「三」の 3本 */
const MARKS: readonly { readonly d: string; readonly from: number; readonly to: number }[] = [
  { d: 'M46.5 70 L62 69.5', from: WRITE, to: 4.15 },
  { d: 'M47.5 75 L63 75', from: 4.55, to: 4.85 },
  { d: 'M47.5 80 L62 80', from: 5.2, to: 5.5 },
]

function Paper({ t }: SceneProps) {
  const slide = span(t, 0.25, 0.8, easeOut)
  return (
    <Layer x={14 * (1 - slide)} opacity={slide}>
      <rect x="37" y="67" width="54" height="33" rx="1.5" fill="#000000" opacity="0.1" />
      <rect x="36" y="66" width="54" height="33" rx="1.5" fill={PAPER} />
      <rect x="36" y="96.6" width="54" height="2.4" rx="1.2" fill={PAPER_SHADE} />
      {MARKS.map((mark) => {
        const p = span(t, mark.from, mark.to)
        if (p <= 0) return null
        return <path key={mark.d} d={mark.d} fill="none" stroke={SUMI} strokeWidth="2.8" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
      })}
    </Layer>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'unsure' | 'notice' | 'focus' | 'happy'

function Face({ mood, look }: { readonly mood: Mood; readonly look: Point }) {
  const eyes: readonly Point[] = [[1.8, 0.6], [6.6, 0.6]]
  return (
    <>
      <circle cx="0.4" cy="3.8" r="1.9" fill={CHEEK} opacity="0.55" />
      <circle cx="7.6" cy="3.8" r="1.5" fill={CHEEK} opacity="0.45" />
      {mood === 'happy' ? (
        <>
          <path d="M0.4 1.4 Q1.8 -0.8 3.2 1.4 M5.2 1.4 Q6.6 -0.8 8 1.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2.4 4.6 Q4.4 8.8 6.8 4.6 Z" fill={MOUTH} />
          <path d="M0.4 -2.6 Q1.8 -4 3.2 -2.6 M5.2 -2.6 Q6.6 -4 8 -2.6" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : (
        <>
          {eyes.map(([x, y]) => (
            <g key={x}>
              <circle cx={x + look[0]} cy={y + look[1]} r={mood === 'notice' ? 1.5 : 1.2} fill={EYE} />
              {mood === 'notice' ? <circle cx={x + look[0] - 0.4} cy={y + look[1] - 0.5} r="0.45" fill="#ffffff" /> : null}
            </g>
          ))}
          {mood === 'unsure' ? (
            <>
              {/* こまった まゆ(まんなか が 上がる) */}
              <path d="M0.2 -1.6 L3 -3.4 M8 -1.6 L5.4 -3.4" fill="none" stroke={HAIR} strokeWidth="0.95" strokeLinecap="round" />
              <path d="M2.8 6.2 Q4.2 4.8 5.8 6.2" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
            </>
          ) : null}
          {mood === 'notice' ? (
            <>
              <path d="M0.4 -2.8 Q1.8 -4.2 3.2 -2.8 M5.2 -2.8 Q6.6 -4.2 8 -2.8" fill="none" stroke={HAIR} strokeWidth="0.95" strokeLinecap="round" />
              <ellipse cx="4.4" cy="5.6" rx="1.1" ry="1.5" fill={MOUTH} />
            </>
          ) : null}
          {mood === 'focus' ? (
            <>
              <path d="M0.2 -2.6 L3 -2 M8 -2.6 L5.4 -2" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d="M3.2 5.6 h2.4" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          ) : null}
        </>
      )}
    </>
  )
}

/** あたま・くび・どう(つくえの うしろ に すわっている) */
function Body({ t, mood, tilt }: { readonly t: number; readonly mood: Mood; readonly tilt: number }) {
  const breath = wave(t, 2.2)
  const look: Point = mood === 'notice' || (t >= 2.5 && t < 3.3) ? [1.5, 0.5] : [0.6, 1]
  return (
    <>
      <Layer scaleX={1 + breath * 0.012} scaleY={1 + breath * 0.02} origin={[34, 70]}>
        <rect x="23" y="39" width="22" height="40" rx="9" fill={TUNIC} />
        <path d="M28 41 Q34 46 40 41" fill="none" stroke={SLEEVE_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <rect x="30.4" y="32" width="6.4" height="9" rx="2.6" fill={SKIN_SHADE} />
      <Layer rotate={tilt} origin={[34, 35]}>
        <g transform="translate(33 27)">
          <circle cx="0" cy="0" r="9.2" fill={SKIN} />
          <circle cx="-8.2" cy="1.6" r="2.3" fill={SKIN_SHADE} />
          <path d="M-9.4 0.4 C-10 -10 2 -12.4 8 -6.4 C9.8 -4.6 9.8 -1.6 9.2 0.6 C7.6 -3.8 3 -6 -3 -5.2 C-6 -4.8 -8 -3 -9.4 0.4 Z" fill={HAIR} />
          <path d="M-2 -10.6 Q-1 -14 1.4 -11.8 Q2.8 -14 3.6 -11" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} look={look} />
        </g>
      </Layer>
    </>
  )
}

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function ArmShape({ shoulder, hand, side, color }: { readonly shoulder: Point; readonly hand: Point; readonly side: 1 | -1; readonly color: string }) {
  const joint = elbowOf(shoulder, hand, UPPER, FORE, side)
  return (
    <path
      d={`M${shoulder[0]} ${shoulder[1]} L${joint.elbow[0]} ${joint.elbow[1]} L${joint.hand[0]} ${joint.hand[1]}`}
      fill="none"
      stroke={color}
      strokeWidth="6.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** ふで。えを ゆびで にぎる。手と ふでは 一緒に かたむく。6画目の たて線 に そろう。 */
function Brush({ inked, hand, r }: { readonly inked: number; readonly hand: Point; readonly r: number }) {
  return (
    <Layer x={hand[0] - HAND0[0]} y={hand[1] - HAND0[1]} rotate={r} origin={HAND0}>
      <Bone char={CHAR} n={6} color={HANDLE} width={3.2} from={0} to={0.74} />
      <Bone char={CHAR} n={6} color={FERRULE} width={4.2} from={0.72} to={0.81} />
      <path d="M52.3 49.5 L57.5 49.5 Q58.2 55.5 55.1 60.8 Q52 55.5 52.3 49.5 Z" fill={BRISTLE_DRY} />
      <path d="M52.3 49.5 L57.5 49.5 Q58.2 55.5 55.1 60.8 Q52 55.5 52.3 49.5 Z" fill={SUMI} opacity={inked} />
      {/* にぎる 手: ゆびが ふでに まきつく */}
      <rect x="49.4" y="37.8" width="10.2" height="10.4" rx="4.8" fill={SKIN} />
      <path d="M53.2 40.2 H58.4 M53.2 42.9 H58.6 M53.2 45.6 H58.2" stroke={SKIN_SHADE} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="50.8" cy="39.6" rx="2.2" ry="1.8" fill={SKIN} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  const mood: Mood = t < NOTICE ? 'unsure' : t < DIP ? 'notice' : t < HAPPY ? 'focus' : 'happy'
  const tilt =
    -5 * (1 - span(t, NOTICE - 0.1, NOTICE + 0.2)) + 5 * span(t, DIP + 0.1, DIP + 0.5) * (1 - span(t, HAPPY - 0.2, HAPPY + 0.2)) + wave(t, 1.6) * 1.2 * during(t, UNSURE, NOTICE, 0.2)
  // 子どもは つくえの うしろ から ぽん と あらわれる
  const rise = 26 * (1 - span(t, 0.45, 1.1, backOut))

  // ふで: こまって ゆらゆら → すみ → 紙
  const brush = brushAt(t)
  const wobble = wave(t, 0.5) * during(t, UNSURE, NOTICE, 0.2)
  const hand = handOf([brush.tip[0] + wobble * 1.4, brush.tip[1]], brush.r + wobble * 4)
  const inked = span(t, 2.7, 2.95)
  const farHand: Point = [41, 71]
  // うれしい しゅんかんに、ちいさく はずむ
  const hop = Math.abs(Math.sin(span(t, HAPPY, HAPPY + 0.5) * Math.PI)) * 0.9

  return (
    <>
      <Layer opacity={ink.picture}>
        <Wall t={t} />
        <Layer y={rise - hop} opacity={span(t, 0.4, 0.6)}>
          <Body t={t} mood={mood} tilt={tilt} />
        </Layer>
        <Layer opacity={span(t, 0, 0.4)}>
          <DeskTop />
          <Inkstone t={t} />
        </Layer>
        <Paper t={t} />
        <Layer y={rise - hop} opacity={span(t, 0.4, 0.6)}>
          <ArmShape shoulder={FAR_SHOULDER} hand={farHand} side={-1} color={SLEEVE_DARK} />
          <circle cx={farHand[0]} cy={farHand[1]} r="3.6" fill={SKIN} />
          <ArmShape shoulder={SHOULDER} hand={hand} side={1} color={SLEEVE} />
          <Brush inked={inked} hand={hand} r={brush.r + wobble * 4} />
        </Layer>
        {/* 「あ!」と きづいた ひらめき */}
        <Layer opacity={during(t, NOTICE, DIP + 0.1, 0.2)} scale={mix(t, NOTICE, NOTICE + 0.3, 0.3, 1, backOut)} origin={[46, 12]}>
          <Star cx={46} cy={12} r={4.6} color={SPARK} spin={wave(t, 1.2) * 12} />
          <Star cx={40} cy={7.5} r={2.2} color={SPARK} />
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
    { at: 0, label: 'つくえと 紙が できる', sound: 'pop' },
    { at: UNSURE, label: 'ふでを もって、何を かこう かな と こまる' },
    { at: NOTICE, label: 'すずり の すみに きづく' },
    { at: DIP, label: 'ふでに すみを つける', sound: 'pop' },
    { at: WRITE, label: '紙に「三」と かく' },
    { at: HAPPY, label: 'できた! ふでを もちあげて にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '書 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
