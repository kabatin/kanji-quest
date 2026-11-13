/*
 * 父(ちち): 手に おのを もって はたらく お父さん。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 家の やねの 小鳥が おどろいて とびたつ すじ(左のほう)
 *   2画目(ヽ)  … 木の えだの 小鳥が おどろいて とびたつ すじ(右のほう)
 *   3画目(ノ)  … お父さんの 手に にぎった おの(かた から 手、えのが、まき の切り口まで)
 *   4画目(ヽ)  … うしろに そびえる 山の みぎ がわの すそ(山の ふもとで はたらいている)
 *
 * ながれ
 *   山の ふもとに 家と きりかぶ。まきが 1本 たっている
 *   → つかれた お父さんが おのを かついで あるいてくる
 *   → 両手で おのを ふりかぶり、コン! まきが ふたつに わかれる(小鳥が びっくり)
 *   → 家の まどから 子どもが 手を ふる。お父さんは にっこり(家を まもるために はたらいている)
 *   → ほね が ひかって、絵が うすくなり、字「父」が のこる
 *
 * 人と おのは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた・ひじ・手 を、手の場所から 計算してつなぐ)。
 *   おの は 長い え の さきに 金ぞくの あたま。きる ほう(は)が まえを むく。
 *   字の形に そろうのは、まきを わった さいごの しゅんかん の おの だけ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '父'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e0824f'
const TUNIC_DARK = '#c76a3b'
const TUNIC_FAR = '#b05a31'
const PANTS = '#4a5d80'
const PANTS_DARK = '#3d4e6e'
const SHOE = '#6b4a36'
const BELT = '#6b4a36'
const BAND = '#ffffff'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const WOOD = '#e8c08a'
const WOOD_RING = '#c99a5e'
const HANDLE = '#a8703f'
const STEEL = '#b9c4d2'
const STEEL_DARK = '#8c9aad'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const MOUNTAIN = '#bcd9ae'
const MOUNTAIN_DARK = '#a5c796'
const SUN = '#ffd24a'
const WALL = '#f5dcb4'
const ROOF = '#cf5a43'
const ROOF_DARK = '#b04733'

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.0
/** おのを ふりかぶりはじめる / ふりおろしはじめる / まきに あたる */
const WIND = 2.2
const SWING = 2.95
const HIT = 3.3
/** まどから 子どもが 手を ふる */
const CHILD = 4.0
const INK = 6.0
const DONE = 8.6
const DURATION = 9.4

type Pt = readonly [number, number]

/** お父さんの かた(てまえ・むこう)と、足もと(ゆれの じく) */
const SHOULDER_NEAR: Pt = [71, 40]
const SHOULDER_FAR: Pt = [76, 40]
const FEET: Pt = [74, 94]
/** うで の ほね1本の長さ(かた→ひじ、ひじ→手) */
const ARM = 12.6
/** おの の え の長さ(にぎり の さき の おしり から、あたま の つけね まで) */
const HANDLE_LEN = 32

/** まきの 場所(きりかぶの 上。まんなかで ふたつに わかれる) */
const LOG_X = 52
const LOG_TOP = 74
const STUMP_TOP = 88

/* ───────── おの と うで ───────── */

/** おのの すがた。b = えの おしり、theta = えの かたむき(ま下 が 0、まえ(左)へ たおすほど 大きい…ではなく、時計まわり) */
type AxePose = { readonly b: Pt; readonly theta: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** えの おしり から g はなれた ところ(にぎる場所)。え の むきは (-sinθ, cosθ) */
function gripAt(axe: AxePose, g: number): Pt {
  return [axe.b[0] - Math.sin(rad(axe.theta)) * g, axe.b[1] + Math.cos(rad(axe.theta)) * g]
}

/**
 * かた と 手 の場所から、ひじ の場所を 計算する(うで は 2本の ほね。とどかないときは 手を ひきよせる)。
 * ひじ は、いつも 下がわ に まがる。
 */
function solveArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const raw = Math.hypot(dx, dy) || 1
  const dist = Math.min(Math.max(raw, 5), ARM * 2 - 0.1)
  const ux = dx / raw
  const uy = dy / raw
  const half = dist / 2
  const lift = Math.sqrt(Math.max(ARM * ARM - half * half, 0))
  const sideA: Pt = [-uy, ux]
  const sideB: Pt = [uy, -ux]
  const side = sideA[1] >= sideB[1] ? sideA : sideB
  return {
    elbow: [shoulder[0] + ux * half + side[0] * lift, shoulder[1] + uy * half + side[1] * lift],
    hand: [shoulder[0] + ux * dist, shoulder[1] + uy * dist],
  }
}

/** おのの 動き: 手に さげる → ふりかぶる → ふりおろす → まきに くいこむ */
function axePoseAt(t: number): AxePose {
  if (t < SWING) {
    return { b: [mix(t, WIND, SWING, 66.5, 77), mix(t, WIND, SWING, 50, 32)], theta: mix(t, WIND, SWING, 20, 200) }
  }
  // ふりおろす: はじめは ゆっくり、あたる ちょくぜん が いちばん はやい(あたまは ゆれる)
  const rebound = Math.sin(span(t, HIT, HIT + 0.3) * Math.PI) * 4
  return {
    b: [mix(t, SWING, HIT, 77, 65.5, easeOut), mix(t, SWING, HIT, 32, 50, easeOut)],
    theta: mix(t, SWING, HIT, 200, 38, easeIn) + rebound,
  }
}

/** おの。えの おしり を 原点、え を 下(+y)、金ぞくの あたま を さき に、きる ほう を +x に描く。 */
function Axe({ axe }: { readonly axe: AxePose }) {
  return (
    <Layer x={axe.b[0]} y={axe.b[1]} rotate={axe.theta}>
      <rect x="-1.5" y="-3" width="3" height={HANDLE_LEN + 4} rx="1.5" fill={HANDLE} />
      <rect x="-4.2" y="26.6" width="2.6" height="7.4" rx="0.8" fill={STEEL_DARK} />
      <path d="M-2 27 L2 26 Q9 24.2 10.4 22.2 L10.4 38.2 Q9 36.2 2 34.4 L-2 33.6 Z" fill={STEEL} />
      <path d="M2.2 33 Q8 33.6 10 36.2 L10.4 38.2 Q9 36.2 2 34.4 Z" fill={STEEL_DARK} />
      <path d="M10.4 23 V37.4" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

function Arm({ shoulder, elbow, hand, upper, fore }: { readonly shoulder: Pt; readonly elbow: Pt; readonly hand: Pt; readonly upper: string; readonly fore: string }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={upper} strokeWidth="6.4" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={fore} strokeWidth="5.2" strokeLinecap="round" />
    </>
  )
}

/* ───────── お父さん ───────── */

type Mood = 'tired' | 'focused' | 'happy'

type FatherProps = {
  readonly t: number
  readonly step: number
  readonly mood: Mood
  readonly axe: AxePose
  /** むこうの手が おのを にぎった度合い(0 = ぶらぶら / 1 = にぎる) */
  readonly grab: number
  readonly headTilt: number
  readonly breath: number
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'tired') {
    return (
      <>
        <path d="M65.8 22.4 l4 1.2" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="68" cy="25.8" r="1.15" fill="#2b2b2b" />
        <ellipse cx="66.2" cy="30.6" rx="1.4" ry="1.8" fill="#b9483f" />
      </>
    )
  }
  if (mood === 'focused') {
    return (
      <>
        <path d="M65.6 22.8 l4.4 -1.4" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="68" cy="25.2" r="1.3" fill="#2b2b2b" />
        <path d="M65 30.6 h3.8" stroke="#b9483f" strokeWidth="1.3" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <path d="M66.2 25.8 Q68 23.6 69.8 25.8" fill="none" stroke="#2b2b2b" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M64.6 29.4 Q67 34.2 70.2 29.4 Z" fill="#b9483f" stroke="#b9483f" strokeWidth="0.8" strokeLinejoin="round" />
    </>
  )
}

function Head({ t, mood, tilt }: { readonly t: number; readonly mood: Mood; readonly tilt: number }) {
  const tail = wave(t, 0.9) * 2
  return (
    <Layer rotate={tilt} origin={[74, 36]}>
      <circle cx="73.5" cy="25" r="9.4" fill={SKIN} />
      {/* はな(ほんものの 大人の 顔は はなが 出ている) */}
      <ellipse cx="64.2" cy="26.8" rx="1.7" ry="1.5" fill={SKIN} />
      <circle cx="79.4" cy="26.4" r="2.1" fill={SKIN_SHADE} />
      {/* かみ と はちまき(はたらく人の しるし) */}
      <path d="M64.4 21 C63.6 11.4 74.5 8.4 81 14 C83.6 16.6 84 20 83.6 23 Q74 15.6 64.4 21 Z" fill={HAIR} />
      <path d="M82.4 20 C85 24 84.6 28 82.4 31.6 C81 27 80.6 24 80 21 Z" fill={HAIR} />
      <path d="M64.4 21.6 Q73.4 15.2 83.4 21.2" fill="none" stroke={BAND} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M83.2 20.6 l${4.6 + tail * 0.3} ${-1.6 + tail * 0.4} M83.2 20.6 l${3.6 + tail * 0.3} ${2.4 + tail * 0.4}`} fill="none" stroke={BAND} strokeWidth="2" strokeLinecap="round" />
      <circle cx="68.2" cy="29.4" r="1.9" fill="#ff9d9d" opacity="0.5" />
      <Face mood={mood} />
    </Layer>
  )
}

function Father({ t, step, mood, axe, grab, headTilt, breath }: FatherProps) {
  // かつぐあいだ、むこうの手は 足と ぎゃくに ふる
  const swing = -step * 20
  const free: Pt = [SHOULDER_FAR[0] - Math.sin(rad(swing)) * 23, SHOULDER_FAR[1] + Math.cos(rad(swing)) * 23]
  const gripFar = gripAt(axe, 4)
  const farTarget: Pt = [free[0] + (gripFar[0] - free[0]) * grab, free[1] + (gripFar[1] - free[1]) * grab]
  const far = solveArm(SHOULDER_FAR, farTarget)
  const near = solveArm(SHOULDER_NEAR, gripAt(axe, 11))
  const farHandOnTop = grab >= 0.5
  return (
    <>
      {/* むこうの うで(体の うしろ) */}
      <Arm shoulder={SHOULDER_FAR} elbow={far.elbow} hand={far.hand} upper={TUNIC_FAR} fore={SKIN_SHADE} />
      {!farHandOnTop && <circle cx={far.hand[0]} cy={far.hand[1]} r="3.2" fill={SKIN_SHADE} />}
      {/* 足: かわりばんこに ふる */}
      <Layer rotate={step * 17} origin={[76, 66]}>
        <rect x="73" y="64" width="6.4" height="28.5" rx="3.2" fill={PANTS_DARK} />
        <ellipse cx="75.4" cy="93.4" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[70, 66]}>
        <rect x="66.6" y="64" width="6.4" height="28.5" rx="3.2" fill={PANTS} />
        <ellipse cx="69" cy="93.4" rx="5.6" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="71.4" y="31.5" width="5.2" height="9" rx="2.4" fill={SKIN_SHADE} />
      {/* どう */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.02} origin={[74, 66]}>
        <rect x="66.5" y="36.6" width="15" height="31" rx="6.8" fill={TUNIC} />
        <rect x="66.5" y="62.6" width="15" height="3.2" fill={BELT} />
        <path d="M68.6 52 h9" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      <Head t={t} mood={mood} tilt={headTilt} />
      {/* てまえの うで */}
      <Arm shoulder={SHOULDER_NEAR} elbow={near.elbow} hand={near.hand} upper={TUNIC_DARK} fore={SKIN} />
      <Axe axe={axe} />
      <circle cx={near.hand[0]} cy={near.hand[1]} r="3.3" fill={SKIN} />
      {farHandOnTop && <circle cx={far.hand[0]} cy={far.hand[1]} r="3.2" fill={SKIN_SHADE} />}
    </>
  )
}

/* ───────── 場所 ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      {/* 山: みぎがわの すそ が 4画目。ふもとで はたらいている */}
      <Layer scaleY={span(t, 0, 0.7, backOut)} origin={[54, 98]}>
        <path d="M-30 98 L34.25 47 c4.83 0 29 25.38 45.99 37.02 c3.54 2.43 7.39 4.55 11.51 5.77 L118 98 V102 H-30 Z" fill={MOUNTAIN} />
        <path d="M34.25 47 L27.6 52.6 Q31 52.4 33.4 54.6 Q36.4 51.4 41.2 52.2 Z" fill="#ffffff" />
        <path d="M-30 98 L8 68 Q12 80 4 98 Z" fill={MOUNTAIN_DARK} />
      </Layer>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 木。えだ の 小鳥が とびたつ(2画目) */
function Tree({ t }: SceneProps) {
  const grow = span(t, 0.2, 0.8, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <Layer scaleY={span(t, 0.2, 0.6, backOut)} origin={[99, 97]}>
        <rect x="97.4" y="44" width="3.8" height="53" rx="1.6" fill={BARK} />
      </Layer>
      <Layer scale={grow} rotate={sway} origin={[99, 46]}>
        <circle cx="99" cy="34" r="9" fill={LEAF_DARK} />
        <circle cx="93.5" cy="41" r="7" fill={LEAF_DARK} />
        <circle cx="104" cy="42" r="6.5" fill={LEAF_DARK} />
        <circle cx="98" cy="35" r="7.4" fill={LEAF} />
        <circle cx="94.4" cy="40" r="5" fill={LEAF} />
        <circle cx="96" cy="31.4" r="3.2" fill={LEAF_LIGHT} />
      </Layer>
    </>
  )
}

/** 家: やねの 小鳥が とびたつ(1画目)。まどから 子どもが 手を ふる。 */
function House({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  const warm = span(t, CHILD - 0.3, CHILD + 0.3)
  const kid = span(t, CHILD, CHILD + 0.4, backOut)
  const smokeOn = span(t, 0.8, 1.4)
  const hand = wave(t, 0.6) * 1.2
  return (
    <>
      <Layer scaleY={rise} origin={[16, 95]}>
        <rect x="23" y="62" width="4.2" height="11" rx="0.8" fill={ROOF_DARK} />
        <rect x="5" y="76" width="23" height="19" rx="1.6" fill={WALL} />
        <path d="M2 77.4 L16.5 62 L31 77.4 Z" fill={ROOF} stroke={ROOF} strokeWidth="2" strokeLinejoin="round" />
        <path d="M5 77.6 H28" stroke={ROOF_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <rect x="22" y="84" width="5" height="11" rx="1" fill={BARK} />
        <rect x="11.6" y="79" width="9.8" height="9.2" rx="1.2" fill="#bfe3f6" />
        <rect x="11.6" y="79" width="9.8" height="9.2" rx="1.2" fill="#ffe9a8" opacity={warm} />
        {kid > 0 && (
          <Layer scale={kid} origin={[16.5, 87]}>
            <circle cx="16.5" cy="84.4" r="3.3" fill={SKIN} />
            <path d="M13.2 83.6 Q16.5 79.4 19.8 83.6 Q16.5 81.8 13.2 83.6 Z" fill={HAIR} />
            <circle cx="15.4" cy="84.6" r="0.5" fill="#2b2b2b" />
            <circle cx="17.7" cy="84.6" r="0.5" fill="#2b2b2b" />
            <path d="M15.4 86 Q16.5 87.2 17.7 86" fill="none" stroke="#b9483f" strokeWidth="0.5" strokeLinecap="round" />
            <circle cx={20 + hand * 0.2} cy={81.4 + hand} r="1.2" fill={SKIN} />
          </Layer>
        )}
        <rect x="11.6" y="79" width="9.8" height="9.2" rx="1.2" fill="none" stroke="#ffffff" strokeWidth="0.9" />
        <path d="M16.5 79 V88.2 M11.6 83.6 H21.4" stroke="#ffffff" strokeWidth="0.6" opacity={1 - kid} />
      </Layer>
      {/* けむり */}
      <g opacity={smokeOn}>
        {[0, 1, 2].map((k) => {
          const p = (t * 0.45 + k / 3) % 1
          return <circle key={k} cx={25.1 + p * 6 + Math.sin(p * 6 + k) * 1.4} cy={61 - p * 14} r={1.6 + p * 2.6} fill="#ffffff" opacity={(1 - p) * 0.85} stroke="#dfe7f0" strokeWidth="0.4" />
        })}
      </g>
    </>
  )
}

function Stump({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.8, backOut)
  return (
    <Layer scale={pop} origin={[LOG_X, 97]}>
      <path d="M38 98 Q41.4 94 41.8 88.4 L62.2 88.4 Q62.6 94 66 98 Z" fill={BARK} />
      <path d="M45 96 q1 -3 0.6 -6 M58 96 q-0.8 -3 -0.2 -6" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx={LOG_X} cy={STUMP_TOP} rx="11.2" ry="3" fill={WOOD} />
      <ellipse cx={LOG_X} cy={STUMP_TOP} rx="6.6" ry="1.6" fill="none" stroke={WOOD_RING} strokeWidth="0.7" />
    </Layer>
  )
}

/** まき。1本 たっていて、コン! で ふたつに わかれて ころがる */
function Log({ t }: SceneProps) {
  const pop = span(t, 0.6, 1.0, backOut)
  if (pop <= 0) return null
  const h = STUMP_TOP - LOG_TOP
  if (t < HIT) {
    return (
      <Layer scaleY={pop} origin={[LOG_X, STUMP_TOP]}>
        <rect x={LOG_X - 5} y={LOG_TOP} width="10" height={h} rx="1.4" fill={BARK} />
        <rect x={LOG_X - 5} y={LOG_TOP + 1.4} width="3" height={h - 2.8} rx="1.2" fill="#a06e49" />
        <ellipse cx={LOG_X} cy={LOG_TOP} rx="5" ry="1.8" fill={WOOD} />
        <ellipse cx={LOG_X} cy={LOG_TOP} rx="2.4" ry="0.8" fill="none" stroke={WOOD_RING} strokeWidth="0.6" />
      </Layer>
    )
  }
  const p = span(t, HIT, HIT + 0.75)
  const cx = [LOG_X - 2.5, LOG_X + 2.5]
  const cy = (LOG_TOP + STUMP_TOP) / 2
  // たおれて ころがった ときの まんなか(まき1本は よこに なる)
  const landY = 96 - 2.5
  const halves = [
    { x: cx[0], rot: -90, to: 36, face: -1 },
    { x: cx[1], rot: 90, to: 56, face: 1 },
  ]
  return (
    <>
      {halves.map((half, i) => (
        <Layer key={i} x={(half.to - half.x) * easeOut(p)} y={(landY - cy) * p * p - 12 * Math.sin(p * Math.PI)} rotate={half.rot * easeOut(p)} origin={[half.x, cy]}>
          <rect x={half.x - 2.5} y={LOG_TOP} width="5" height={h} rx="1.2" fill={BARK} />
          <rect x={half.face > 0 ? half.x - 2.5 : half.x + 1.1} y={LOG_TOP + 0.6} width="1.4" height={h - 1.2} fill={WOOD} />
        </Layer>
      ))}
    </>
  )
}

/** わった しゅんかんの はへん と ひかり */
function Burst({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.8)
  if (p <= 0 || p >= 1) return null
  const chips: readonly (readonly [number, number, number])[] = [
    [-16, -22, 1],
    [-7, -28, -1],
    [10, -24, 1],
    [18, -14, -1],
    [-22, -12, -1],
    [4, -31, 1],
  ]
  return (
    <>
      <Star cx={LOG_X} cy={81} r={Math.max(0, 3 + 7 * span(t, HIT, HIT + 0.3)) * (1 - span(t, HIT + 0.15, HIT + 0.4))} color="#fff3b0" spin={p * 90} />
      <g opacity={1 - p * p}>
        {chips.map(([vx, vy, dir], i) => (
          <path key={i} d="M-1.8 0 L1.8 -0.8 L0.6 1.6 Z" fill={WOOD} transform={`translate(${LOG_X + vx * p} ${80 + vy * p + 38 * p * p}) rotate(${dir * p * 360})`} />
        ))}
      </g>
    </>
  )
}

/** 小鳥。おどろいて とびたつ。 */
type BirdProps = { readonly t: number; readonly from: Pt; readonly to: Pt; readonly body: string; readonly wing: string; readonly faceRight: boolean }

function Bird({ t, from, to, body, wing, faceRight }: BirdProps) {
  const p = span(t, HIT + 0.05, HIT + 1.6, easeOut)
  const flying = p > 0
  const drift = p >= 1 ? wave(t, 2.2) * 1.6 : 0
  const x = from[0] + (to[0] - from[0]) * p + drift
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 4 + (p >= 1 ? wave(t, 1.6) * 1.2 : 0)
  const hop = flying ? 0 : Math.abs(wave(t, 0.8)) * 0.6
  const flap = flying ? wave(t, 0.16) * 30 : 0
  return (
    <Layer x={x} y={y - hop} scaleX={faceRight ? -1.4 : 1.4} scaleY={1.4}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill={wing} />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill={body} />
      <circle cx="-3" cy="-2.3" r="2.3" fill={body} />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill={wing} />
      </Layer>
    </Layer>
  )
}

/** あるいている間の あせ。うしろ(右)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.2, STOP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${84 + p * 8} ${17 + p * 8 - Math.sin(p * Math.PI) * 5}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** わったあとの「ふう」 */
function Sigh({ t, dx }: { readonly t: number; readonly dx: number }) {
  const from = HIT + 0.5
  const to = from + 1.4
  const show = during(t, from, to, 0.2)
  if (show <= 0) return null
  const p = span(t, from, to, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={dx + 61 - p * 9} cy={31 - p * 5} rx={3 + p * 2.6} ry={2 + p * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={dx + 64.5 - p * 6} cy={32.4 - p * 2} rx={1.5 + p} ry={1.1 + p * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // あるく: 右から きりかぶの そばまで。足を ふって、体が 上下する
  const walking = 1 - span(t, STOP - 0.25, STOP)
  const step = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, STOP, 42, 0, easeOut)
  const bob = -Math.abs(step) * 1.4
  // ふりかぶるとき うしろへ、ふりおろすとき まえへ のけぞる。わったあとは すこし まえに もどる
  const lean = t < SWING ? mix(t, WIND, SWING, 0, 4, easeInOut) : t < HIT ? mix(t, SWING, HIT, 4, -4, easeIn) : mix(t, HIT, HIT + 0.6, -4, -1.5, easeOut)
  const grab = span(t, STOP - 0.1, WIND + 0.1, easeInOut)
  const mood: Mood = t < WIND ? 'tired' : t < HIT + 0.35 ? 'focused' : 'happy'
  const headTilt = t < WIND ? -6 + step * 2 : t < HIT + 0.35 ? 0 : 2
  const breath = t > HIT + 0.6 ? wave(t - HIT, 1.8) : 0
  const axe = axePoseAt(t)
  const here = span(t, WALK - 0.1, WALK + 0.15)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <House t={t} />
        <Tree t={t} />
        <Stump t={t} />
        <Log t={t} />
        <Layer opacity={here}>
          <ellipse cx={74 + walkX} cy="97.4" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Layer rotate={lean} origin={FEET}>
              <Father t={t} step={step} mood={mood} axe={axe} grab={grab} headTilt={headTilt} breath={breath} />
            </Layer>
            <Sweat t={t} />
            <Sigh t={t} dx={walkX} />
          </Layer>
        </Layer>
        <Burst t={t} />
        <Layer opacity={span(t, 0.6, 0.9)}>
          <Bird t={t} from={[16.5, 59.5]} to={[38.5, 18.3]} body="#ff9a5c" wing="#e2733f" faceRight />
          <Bird t={t} from={[98, 24]} to={[84, 9]} body="#6fb4ea" wing="#4a93d4" faceRight={false} />
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
    { at: 0, label: '山の ふもとに 家と きりかぶ', sound: 'pop' },
    { at: WALK, label: 'つかれた お父さんが おのを かついで あるいてくる' },
    { at: WIND, label: '両手で おのを ふりかぶる' },
    { at: HIT, label: 'コン! まきが わかれる。小鳥が とびたつ', sound: 'pop' },
    { at: CHILD, label: '家の まどから 子どもが 手を ふる。お父さんは にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '父 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
