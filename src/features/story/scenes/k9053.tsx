/*
 * 道(みち): あたまを まえに むけて、みちを すすむ。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … 子どもの あたまの上で ぴょこんと はねた かみ(あほ毛)
 *   3画目(一)  … あたまの すぐ下の よこの ライン(くびまわり)
 *   4〜9画目   … 「首」の 目の ぶぶん。子どもの あたま・かお から 体の あたり
 *   10画目(丶) … 空を とぶ ちょうちょ の あたり(丘の上の ひとつぶ)
 *   11画目     … 丘を くねくね おりてくる 道
 *   12画目(ノ) … 丘の ふもとから 右の おうちへ のびる 長い みち(子どもの あしもと)
 *   (子どもは 絵のとおりの 大きさで 立つ。字と ぴったり重ならなくても、だいたい同じ場所なら よい)
 *
 * ながれ
 *   丘から おりてくる 道が のびる → ランドセルの子が、下を むいて とぼとぼ あるいてくる
 *   → ちょうちょが めのまえを ひらひら。びっくりして とまり、ふっと あたまを あげる
 *   → ちょうちょは 右へ とんでいき、その先に おうち が見える。にこっと わらって
 *   → あたまを まえに むけて、すたすた みちを すすむ → ほね が ひかって、絵が うすくなり、字「道」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは 足と ぎゃくに ふる。
 *   くび は みじかく、どう の まんなか の上。あたま は くび を じく に 上下に うごく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '道'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a93b'
const TUNIC_DARK = '#dc9020'
const TUNIC_FAR = '#b9761a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const PACK = '#e8534a'
const PACK_DARK = '#c9433b'
const ROAD = '#ecd3a0'
const ROAD_EDGE = '#d6b87c'
const GRASS = '#c5e8a9'
const HILL = '#d3edb9'
const HILL_FAR = '#e2f2d2'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const WALL = '#fff3dc'
const ROOF = '#e2733f'

/** くぎり の時間(秒) */
const ROAD_GROW = 0.9
/** 子どもが 左から あるきはじめる */
const WALK = 0.9
/** ちょうちょが とんでくる */
const FLUTTER = 2.4
/** 子どもが ちょうちょに きづいて とまる */
const STOP = 3.2
/** ちょうちょが 右へ とびさる・子どもが また あるきだす */
const GO = 4.5
const ARRIVE = 6.0
const INK = 6.3
const DONE = 9.6
const DURATION = 10.2

/** 子どもの いる場所(左から あるいてきて、止まって、また すすむ) */
const START_X = -16
const STOP_X = 36
const END_X = 64
/** 子どもの 大きさ(からだの ぜんぶを この倍率で) */
const KID = 1.2

/** 12画目の 道の 通り道の点。道の たかさ を x から しらべるのに使う */
const ROAD_POINTS: readonly (readonly [number, number])[] = [
  [12.5, 81.7],
  [24, 81],
  [35.3, 82.6],
  [46.4, 85.7],
  [57.3, 89],
  [68.4, 92.1],
  [79.6, 94.7],
  [91, 96.1],
]

/** x の所の 道の まんなかの たかさ(y)。はしの外は まっすぐ のばす */
function roadY(x: number): number {
  const first = ROAD_POINTS[0]
  const last = ROAD_POINTS[ROAD_POINTS.length - 1]
  if (x <= first[0]) return first[1]
  if (x >= last[0]) return last[1] + (x - last[0]) * 0.05
  const i = ROAD_POINTS.findIndex((p) => p[0] >= x)
  const [x0, y0] = ROAD_POINTS[i - 1]
  const [x1, y1] = ROAD_POINTS[i]
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

/** 足の うら が 道に つく たかさ(まんなかより 少し 下) */
const footY = (x: number) => roadY(x) + 1.4

/* ───────── けしき ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[93, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="92.2" y="0.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 93 12)`} />
        ))}
      </Layer>
      <circle cx="93" cy="12" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="14" rx="7" ry="3.4" />
        <ellipse cx="11" cy="12" rx="5" ry="3.4" />
        <ellipse cx="48" cy="9" rx="6" ry="2.8" />
        <ellipse cx="52.5" cy="7.4" rx="4.4" ry="3" />
      </g>
    </>
  )
}

/** 右の とおくの 丘 と おうち。子どもが めざす ばしょ(さいしょから ちいさく 見えている) */
function FarHouse() {
  return (
    <>
      <path d="M62 100 Q86 70 118 80 V104 Z" fill={HILL_FAR} />
      <rect x="94" y="76.4" width="12" height="9" rx="1" fill={WALL} />
      <path d="M92.4 77 L100 69.6 L107.6 77 Z" fill={ROOF} strokeLinejoin="round" />
      <rect x="98.2" y="80" width="3.6" height="5.4" rx="0.8" fill="#a8744c" />
      <rect x="102.6" y="78.4" width="2.4" height="2.4" rx="0.4" fill="#9fd4f2" />
      <path d="M103.2 70.6 v-4 h2 v5" fill={ROOF} />
    </>
  )
}

function Field() {
  return (
    <>
      {/* 左の 丘(11画目の くねくね道 が おりてくる) */}
      <path d="M-6 100 L-6 66 Q4 40 24 40 Q44 42 54 84 Z" fill={HILL} />
      <path d="M-4 74 Q50 78 113 84 V113 H-4 Z" fill={GRASS} />
      {[6, 44, 74, 100].map((x) => (
        <path key={x} d={`M${x} 104 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {[
        [30, 102],
        [86, 104],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="1.5" fill="#ff9db0" />
          <circle cx={x} cy={y} r="0.6" fill="#ffd24a" />
        </g>
      ))}
    </>
  )
}

/** 道。11画目(丘を おりる くねくね) と 12画目(ふもとから 右へ のびる みち)を 画の線 そのままに。 */
function Road({ t }: SceneProps) {
  const hill = span(t, 0, ROAD_GROW * 0.5, easeOut)
  const flat = span(t, ROAD_GROW * 0.35, ROAD_GROW, easeOut)
  return (
    <>
      {/* ふち(こい色)→ みち(うすい色)の じゅん */}
      <Bone char={CHAR} n={11} color={ROAD_EDGE} width={6.4} from={1 - hill} to={1} />
      <Bone char={CHAR} n={11} color={ROAD} width={4.4} from={1 - hill} to={1} />
      {/* わく の外へ つづく ところは、道が のびきって から あらわれる */}
      <g opacity={span(t, ROAD_GROW * 0.85, ROAD_GROW)}>
        <path d="M-6 81.6 L12.5 81.7" stroke={ROAD_EDGE} strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M-6 81.6 L12.5 81.7" stroke={ROAD} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M91 96.05 L113 97.1" stroke={ROAD_EDGE} strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M91 96.05 L113 97.1" stroke={ROAD} strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>
      <Bone char={CHAR} n={12} color={ROAD_EDGE} width={9} to={flat} />
      <Bone char={CHAR} n={12} color={ROAD} width={7} to={flat} />
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'down' | 'surprised' | 'happy'

/** うで の かっこう。swing = ま下から まえ(右)へ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** 子どもの かた(うでの つけね)。どう の 上のほう */
const SHOULDER: readonly [number, number] = [0, -35]
/** くび の ねもと。あたま は ここを じく に うごく */
const NECK: readonly [number, number] = [0.6, -39.5]
/** にのうで・うでさき の長さ */
const ARM_PART = 8

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。体は 右むき(まえ = 右) */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="2.6" cy="-43" rx="1.7" ry="1.1" fill="#ff9d9d" opacity="0.6" />
      {mood === 'down' && (
        <>
          <path d="M3.2 -48.2 l3 0.8" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="4.8" cy="-45.4" r="0.95" fill="#2b2b2b" />
          <path d="M4 -41.2 Q5.6 -42.4 7.2 -41.2" fill="none" stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M3.4 -49.4 l3 -0.4" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="5" cy="-46.4" r="1.6" fill="#2b2b2b" />
          <circle cx="5.5" cy="-47" r="0.5" fill="#ffffff" />
          <ellipse cx="6" cy="-41.6" rx="1.1" ry="1.5" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M3.2 -45.8 Q4.9 -48.2 6.7 -45.8" fill="none" stroke="#2b2b2b" strokeWidth="1" strokeLinecap="round" />
          <path d="M3.8 -42.6 Q5.7 -39.4 7.8 -42.6 Z" fill="#b9483f" strokeLinejoin="round" />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  /** 足の ふり(てまえの足 = +stride、むこうの足 = -stride) */
  readonly stride: number
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
}

/** 足もと(0,0)から、右むきに 立つ 子ども。はたらく ところは ほんものの人と同じ つくり。 */
function Kid({ mood, stride, nearArm, farArm, headTilt }: KidProps) {
  return (
    <>
      {/* むこうの うで・ランドセル・むこうの足 */}
      <Arm pose={farArm} color={TUNIC_FAR} />
      <rect x="-10" y="-37" width="7.4" height="16" rx="2.6" fill={PACK_DARK} />
      <rect x="-9.4" y="-37" width="6.4" height="14.6" rx="2.4" fill={PACK} />
      <Layer rotate={-stride} origin={[0, -19]}>
        <rect x="-2.6" y="-19" width="5.2" height="17" rx="2.6" fill={PANTS_DARK} />
        <ellipse cx="1.4" cy="-1.4" rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={stride} origin={[0, -19]}>
        <rect x="-2.6" y="-19" width="5.2" height="17" rx="2.6" fill={PANTS} />
        <ellipse cx="1.4" cy="-1.4" rx="4.2" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="-1.2" y="-41.5" width="3.6" height="6.5" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-5.6" y="-38" width="11.2" height="21.4" rx="4.8" fill={TUNIC} />
      <path d="M-4 -22.4 h8" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま: くび の ねもと を じく に、うつむく・見あげる */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="0" cy="-46" r="8.6" fill={HAIR} />
        <circle cx="1.6" cy="-45.4" r="7.3" fill={SKIN} />
        <circle cx="-1.6" cy="-44.6" r="1.7" fill={SKIN_SHADE} />
        <Face mood={mood} />
        {/* 1・2画目の もと: ぴょこんと はねた かみ(あほ毛) */}
        <path d="M-1.4 -53.6 Q-2.4 -58 0.6 -57.2 M2 -53.9 Q3.6 -58 6 -56.2" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/* ───────── ちょうちょ ───────── */

/** 右の空から ひらひら きて、子どもの かおの まえで とまり、右の おうちの ほうへ とんでいく */
function butterflyAt(t: number): { readonly x: number; readonly y: number; readonly size: number } {
  const come = span(t, FLUTTER, STOP + 0.3, easeOut)
  const leave = span(t, GO, ARRIVE - 0.2, easeInOut)
  const hover = wave(t, 0.9) * 1.6
  const comeX = 118 - come * 66
  const comeY = 6 + come * 23 + Math.sin(come * 7) * 3
  return {
    x: t < GO ? comeX : 52 + leave * 46 + Math.sin(leave * 9) * 2,
    y: t < GO ? comeY + (come >= 1 ? hover : 0) : 29 + leave * 30 + hover * (1 - leave),
    size: 1 - leave * 0.4,
  }
}

function Butterfly({ t }: SceneProps) {
  const show = span(t, FLUTTER, FLUTTER + 0.2) * (1 - span(t, ARRIVE - 0.3, ARRIVE + 0.1))
  if (show <= 0) return null
  const { x, y, size } = butterflyAt(t)
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.22))
  return (
    <Layer x={x} y={y} scale={size} opacity={show}>
      <g transform={`scale(${flap} 1)`}>
        <ellipse cx="-3" cy="-2.2" rx="3.2" ry="3.6" fill="#ff8fb4" />
        <ellipse cx="3" cy="-2.2" rx="3.2" ry="3.6" fill="#ff8fb4" />
        <ellipse cx="-2.4" cy="2" rx="2.4" ry="2.6" fill="#ffc2d6" />
        <ellipse cx="2.4" cy="2" rx="2.4" ry="2.6" fill="#ffc2d6" />
      </g>
      <rect x="-0.5" y="-3.6" width="1" height="7.6" rx="0.5" fill="#5a3b2a" />
    </Layer>
  )
}

/** ちょうちょに おどろいた しゅんかんの「!」 */
function Surprise({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const show = during(t, STOP, STOP + 0.9, 0.15)
  if (show <= 0) return null
  const pop = backOut(span(t, STOP, STOP + 0.25))
  return (
    <Layer x={x} y={y} scale={pop} opacity={show} origin={[0, 4]}>
      <rect x="-1" y="-5" width="2" height="5.4" rx="1" fill="#e8534a" />
      <circle cx="0" cy="2.4" r="1.2" fill="#e8534a" />
    </Layer>
  )
}

/* ───────── おはなし ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  // あるく: 左から とぼとぼ → ちょうちょで 止まる → あたまを あげて すたすた
  const first = t < STOP ? mix(t, WALK, STOP, START_X, STOP_X, (u) => 1 - (1 - u) ** 1.5) : STOP_X
  const second = mix(t, GO, ARRIVE, STOP_X, END_X, easeInOut)
  const x = t < GO ? first : second
  const moving = t < STOP ? span(t, WALK, WALK + 0.2) * (1 - span(t, STOP - 0.3, STOP)) : span(t, GO, GO + 0.2) * (1 - span(t, ARRIVE - 0.3, ARRIVE))
  const stride = Math.sin(x * 0.42) * 22 * moving
  const bob = -Math.abs(Math.sin(x * 0.42)) * 1.1 * moving
  const feetY = footY(x)

  // 気持ち: うつむく → おどろく → にこっ
  const mood: Mood = t < STOP + 0.1 ? 'down' : t < GO - 0.2 ? 'surprised' : 'happy'
  // あたま: うつむいて あるく → ちょうちょを 見あげる → まっすぐ まえを 向く
  const headTilt = t < STOP ? 20 + Math.sin(x * 0.42) * 2 : t < GO - 0.2 ? mix(t, STOP, STOP + 0.5, 20, -12) : mix(t, GO - 0.2, GO + 0.5, -12, 0)
  // からだ: とぼとぼは 少し まえかがみ。あたまを あげると のびる
  const lean = mix(t, STOP, STOP + 0.7, 6, 0)
  // うで: あるくときは 足と ぎゃくに ふる。ちょうちょに 手を のばす(かたから まえへ あげる)
  const reach = span(t, STOP + 0.3, STOP + 0.6, easeOut) * (1 - span(t, GO - 0.2, GO + 0.2))
  const lively = t < STOP ? 0.7 : 1.1
  const nearArm: ArmPose = { swing: (-stride * lively) * (1 - reach) + 78 * reach, bend: 14 * (1 - reach) + 6 * reach }
  const farArm: ArmPose = { swing: stride * lively + 2, bend: 14 }

  // さいごに すたすた 立ちどまって、うれしくて ぴょん
  const hop = Math.sin(span(t, ARRIVE, ARRIVE + 0.4) * Math.PI) * 2.4
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <FarHouse />
        <Field />
        <Road t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={x} cy={feetY + 0.6} rx="8.4" ry="2" fill="#000000" opacity="0.14" />
          <Layer x={x} y={feetY + bob - hop} scale={KID}>
            <Layer rotate={lean}>
              <Kid mood={mood} stride={stride} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
            </Layer>
          </Layer>
        </Layer>
        <Surprise t={t} x={x + 12} y={feetY - 64} />
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
    { at: 0, label: '丘から おりてくる 道が のびる', sound: 'pop' },
    { at: WALK, label: '子どもが 下を むいて とぼとぼ あるいてくる' },
    { at: FLUTTER, label: 'ちょうちょが ひらひら とんでくる' },
    { at: STOP, label: 'びっくり。あたまを あげて 見あげる', sound: 'pop' },
    { at: GO, label: 'ちょうちょが 右へ。にこっと わらって あるきだす' },
    { at: ARRIVE, label: 'あたまを まえに むけて、みちを すすむ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '道 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
