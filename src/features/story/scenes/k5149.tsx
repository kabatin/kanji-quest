/*
 * 光(ひかり): 人が あたまの 上に 火を かかげる。あたりを てらす。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … たいまつの 火の まんなか(ほのおの しん)
 *   2・3画目   … 火の 左右に とびちる ひかりの つぶ(ひかりが ひろがる すじ)
 *   4画目(一)  … かた から ひじ にかけて ひろがる 人の うで(火を かかげた 人の かた はば)
 *   5・6画目   … 人の 左右の あし
 *   (字の形に合わせて 人を ゆがめない。人は ほんものの つくりで 立ち、だいたい 同じ場所に そろう)
 *
 * ながれ
 *   くらい 夜。子どもが たいまつを もって ひとりで 立ち、こわくて きょろきょろ
 *   → こうもりが とんできて びっくり(ぶるぶる)
 *   → そこへ ながれぼしが おちてきて、たいまつに ぽっと 火が つく(わけ)
 *   → 子どもは おどろき、火を あたまの 上に かかげる。まわりが ぱあっと あかるくなり、にっこり
 *   → ほね が ひかって、絵が うすくなり、字「光」が のこる
 *
 * 人は ほんものの つくり を守る(体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手の いちから、ひじを 計算して つなぐ)。
 *   くび は みじかく、あたま は どう の まんなか の上。あし は こし から 左右に ある。
 */
import { backOut, during, easeIn, easeInOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '光'

const SKY = '#bfe3f7'
const NIGHT = '#141c3a'
const HILL = '#e2f2d2'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const BARK = '#8c5b3c'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const STICK = '#8c5b3c'
const CUP = '#5a3b2a'
const FIRE = '#ff8a2a'
const FIRE_CORE = '#ffd24a'
const BAT = '#6c5b8a'

/** くぎり の時間(秒) */
const BAT_AT = 1.2
const STAR_AT = 2.3
const LIGHT_AT = 3.1
const RAISE = 4.2
const RAISED = 5.4
const INK = 6.3
const DONE = 9.5
const DURATION = 10

/** 人の 足もと・かた(左右)。からだの まんなか は x = 54 */
const FEET: readonly [number, number] = [54, 93]
const SHOULDER_L: readonly [number, number] = [46.5, 52]
const SHOULDER_R: readonly [number, number] = [61.5, 52]
/** うで: かた から ひじ、ひじ から 手 までの 長さ */
const UPPER = 13.5
const FORE = 14.5
/** たいまつを さげているとき・あたまの上に かかげたとき の 手の いち(右手が たいまつを にぎる) */
const HANG_R: readonly [number, number] = [66, 77]
const HANG_L: readonly [number, number] = [42, 77]
const HIGH_R: readonly [number, number] = [54.6, 27]
const HIGH_L: readonly [number, number] = [53.4, 31]
/** たいまつの 火の 土台は、にぎる手より これだけ 上 */
const CUP_RISE = 8

type Point = readonly [number, number]

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた と 手の いち から、ひじ を 計算する(ひじ は 外がわへ まがる)。手が とどかないときは のばしきる。 */
function solveArm(shoulder: Point, target: Point, side: 1 | -1): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.min(Math.max(Math.hypot(dx, dy), 0.5), UPPER + FORE - 0.05)
  const ux = dx / Math.hypot(dx, dy)
  const uy = dy / Math.hypot(dx, dy)
  const along = (UPPER ** 2 - FORE ** 2 + dist ** 2) / (2 * dist)
  const height = Math.sqrt(Math.max(0, UPPER ** 2 - along ** 2))
  const base: Point = [shoulder[0] + ux * along, shoulder[1] + uy * along]
  const a: Point = [base[0] - uy * height, base[1] + ux * height]
  const b: Point = [base[0] + uy * height, base[1] - ux * height]
  const elbow = (a[0] - 54) * side > (b[0] - 54) * side ? a : b
  return { elbow, hand: [shoulder[0] + ux * dist, shoulder[1] + uy * dist] }
}

type Mood = 'scared' | 'surprised' | 'happy'

/* ───────── 森 ───────── */

function Forest({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {/* 左の 木 */}
      <Layer scaleY={grow} origin={[14, 97]}>
        <path d="M11 97 Q12.4 90 11.8 56 L17.4 56 Q16.8 90 18.4 97 Z" fill={BARK} />
        <circle cx="9" cy="50" r="8" fill={LEAF_DARK} />
        <circle cx="20" cy="49" r="8" fill={LEAF_DARK} />
        <circle cx="14.5" cy="42" r="9.5" fill={LEAF_DARK} />
        <circle cx="11.5" cy="47" r="7" fill={LEAF} />
        <circle cx="17.5" cy="44" r="7" fill={LEAF} />
      </Layer>
      {/* 右の しげみ */}
      <Layer scale={grow} origin={[95, 97]}>
        <circle cx="97" cy="90" r="7" fill={LEAF_DARK} />
        <circle cx="89.5" cy="92.5" r="5" fill={LEAF_DARK} />
        <circle cx="95.5" cy="87.6" r="5" fill={LEAF} />
        <circle cx="91" cy="91" r="3.6" fill={LEAF} />
      </Layer>
      {/* 地面の 花(あかるくなると 色が 見える) */}
      {(
        [
          [30, 97, '#f07f9e'],
          [38, 98.4, '#ffd24a'],
          [75, 98, '#8f9cec'],
          [82, 96.6, '#f07f9e'],
        ] as const
      ).map(([x, y, color]) => (
        <Layer key={x} scale={grow} origin={[x, y]}>
          <path d={`M${x} ${y} v-4`} stroke={LEAF_DARK} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={x} cy={y - 4.6} r="2" fill={color} />
        </Layer>
      ))}
    </>
  )
}

/* ───────── 子ども ───────── */

type EyeLook = { readonly x: number; readonly y: number }

function Face({ mood, look }: { readonly mood: Mood; readonly look: EyeLook }) {
  return (
    <>
      <circle cx="49.2" cy="44" r="1.6" fill="#ff9d9d" opacity="0.55" />
      <circle cx="58.8" cy="44" r="1.6" fill="#ff9d9d" opacity="0.55" />
      {mood === 'scared' && (
        <>
          <path d="M48.6 38.2 L52 36.8 M59.4 38.2 L56 36.8" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={51 + look.x} cy={40.8 + look.y} r="1.2" fill="#2b2b2b" />
          <circle cx={57 + look.x} cy={40.8 + look.y} r="1.2" fill="#2b2b2b" />
          <path d="M51.6 45.4 q0.9 -1 1.8 0 t1.8 0 t1.8 0" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <circle cx={51 + look.x} cy={40.8 + look.y} r="1.7" fill="#2b2b2b" />
          <circle cx={57 + look.x} cy={40.8 + look.y} r="1.7" fill="#2b2b2b" />
          <ellipse cx="54" cy="45.4" rx="1.4" ry="1.8" fill="#b9483f" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M49.3 41.2 Q51 38.9 52.7 41.2 M55.3 41.2 Q57 38.9 58.7 41.2" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M51.6 44.4 Q54 47.8 56.4 44.4 Z" fill="#b9483f" stroke="#b9483f" strokeWidth="0.8" strokeLinejoin="round" />
        </>
      )}
    </>
  )
}

function Arm({ shoulder, hand, elbow, color }: { readonly shoulder: Point; readonly hand: Point; readonly elbow: Point; readonly color: string }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly look: EyeLook
  readonly sweat: number
  readonly t: number
}

/** たいまつを もった 子ども(まえむき)。 */
function Kid({ mood, look, sweat, t }: KidProps) {
  return (
    <>
      {/* あし */}
      <rect x="46.8" y="66" width="6.2" height="26.5" rx="3.1" fill={PANTS} />
      <rect x="55" y="66" width="6.2" height="26.5" rx="3.1" fill={PANTS} />
      <ellipse cx="49.4" cy="93.2" rx="5" ry="2.6" fill={SHOE} />
      <ellipse cx="57.8" cy="93.2" rx="5" ry="2.6" fill={SHOE} />
      {/* くび と どう */}
      <rect x="51.4" y="46" width="5.2" height="7" rx="2.2" fill={SKIN_SHADE} />
      <rect x="45" y="50.4" width="18" height="21" rx="7" fill={TUNIC} />
      <path d="M47.4 64.5 h13.2" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* あたま */}
      <circle cx="54" cy="40" r="8" fill={SKIN} />
      <path d="M46 40.4 C45.2 32 53 29.4 58.8 32 C62.4 34 62.6 38 62 40.6 C60.4 37 57.2 35.6 54 35.4 C50.4 35.4 47.4 37.4 46 40.4 Z" fill={HAIR} />
      <Face mood={mood} look={look} />
      {/* あせ */}
      {sweat > 0 && <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" opacity={sweat} transform={`translate(${63.4} ${36 + ((t * 5) % 4)})`} />}
    </>
  )
}

/* ───────── たいまつ・火 ───────── */

function TorchStick({ grip }: { readonly grip: Point }) {
  const [x, y] = grip
  return (
    <>
      <path d={`M${x} ${y + 8} L${x} ${y - CUP_RISE + 2}`} stroke={STICK} strokeWidth="3.2" strokeLinecap="round" />
      <path d={`M${x - 3.4} ${y - CUP_RISE - 2} L${x + 3.4} ${y - CUP_RISE - 2} L${x + 2.2} ${y - CUP_RISE + 2.4} L${x - 2.2} ${y - CUP_RISE + 2.4} Z`} fill={CUP} strokeLinejoin="round" />
    </>
  )
}

/** ほのお。土台 (0,0) から 上へ のびる。 */
function Flame({ x, y, size, t }: { readonly x: number; readonly y: number; readonly size: number; readonly t: number }) {
  if (size <= 0) return null
  const flick = wave(t, 0.34)
  return (
    <>
      <circle cx={x} cy={y - 6 * size} r={Math.max(0, 14 * size)} fill={FIRE_CORE} opacity="0.3" />
      <Layer x={x} y={y} scaleX={size * (1 - flick * 0.05)} scaleY={size * (0.92 + flick * 0.07)} rotate={flick * 3}>
        <path d="M0 0 C-5 -1 -6.5 -6 -3 -10.5 C-2.5 -8 -1.5 -7.5 -1 -8.5 C-1.2 -12 0.4 -14 1.2 -16.5 C3.2 -13 6.5 -9 5.4 -4.5 C4.8 -1.5 2.5 0 0 0 Z" fill={FIRE} />
        <path d="M0 0 C-3 -0.5 -3.6 -3.5 -1.6 -6 C-1 -4.5 0.2 -4.5 0.6 -6.5 C2.6 -4 3.2 -1.2 0 0 Z" fill={FIRE_CORE} />
      </Layer>
    </>
  )
}

/** あかるくなったときの ひかりの すじ(火の まわりに ひろがる) */
function Rays({ cx, cy, amount, t }: { readonly cx: number; readonly cy: number; readonly amount: number; readonly t: number }) {
  if (amount <= 0) return null
  return (
    <g opacity={amount} stroke={FIRE_CORE} strokeWidth="1.7" strokeLinecap="round" transform={`rotate(${t * 12} ${cx} ${cy})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const near = 15 + wave(t, 0.8, i * 0.1) * 1.2
        const far = near + 5 + amount * 1.5
        return <path key={i} d={`M${cx + Math.cos(angle) * near} ${cy + Math.sin(angle) * near} L${cx + Math.cos(angle) * far} ${cy + Math.sin(angle) * far}`} />
      })}
    </g>
  )
}

/* ───────── にぎやかし ───────── */

const STARS: readonly (readonly [number, number, number])[] = [
  [10, 10, 2.4],
  [32, 6, 2],
  [76, 8, 2.6],
  [98, 16, 2],
  [90, 36, 1.8],
  [24, 28, 1.8],
]

function NightStars({ t, opacity }: { readonly t: number; readonly opacity: number }) {
  if (opacity <= 0) return null
  return (
    <g opacity={opacity}>
      {STARS.map(([x, y, r], i) => (
        <Star key={x} cx={x} cy={y} r={r * (0.85 + 0.15 * wave(t, 1.4, i * 0.4))} color="#fff6c8" />
      ))}
    </g>
  )
}

/** こうもり: 右から とんできて、子どもの あたまの上を とおって 左へ にげる。 */
function Bat({ t }: SceneProps) {
  const p = span(t, BAT_AT, BAT_AT + 1.6)
  if (p <= 0 || p >= 1) return null
  const x = 116 - p * 124
  const y = 22 + Math.sin(p * Math.PI * 3) * 4
  const flap = wave(t, 0.18) * 32
  return (
    <Layer x={x} y={y}>
      <Layer rotate={-flap} origin={[-1.2, 0]}>
        <path d="M-1.2 0 Q-6 -5 -11 -1 Q-8 -0.6 -7 2.4 Q-4.4 0.4 -1.2 1.6 Z" fill={BAT} />
      </Layer>
      <Layer rotate={flap} origin={[1.2, 0]}>
        <path d="M1.2 0 Q6 -5 11 -1 Q8 -0.6 7 2.4 Q4.4 0.4 1.2 1.6 Z" fill={BAT} />
      </Layer>
      <ellipse cx="0" cy="0.8" rx="2.4" ry="3" fill={BAT} />
      <path d="M-1.8 -1.6 l0.2 -2.2 l1.4 1.2 l1.4 -1.2 l0.2 2.2 Z" fill={BAT} />
      <circle cx="-0.9" cy="0" r="0.5" fill="#ffffff" />
      <circle cx="0.9" cy="0" r="0.5" fill="#ffffff" />
    </Layer>
  )
}

/** ながれぼし: 右上から おちてきて、たいまつの さきに とどく。 */
function ShootingStar({ t, target }: { readonly t: number; readonly target: Point }) {
  const p = span(t, STAR_AT, LIGHT_AT, easeIn)
  if (p <= 0 || p >= 1) return null
  const from: Point = [106, 2]
  const [x, y] = lerpPoint(from, target, p)
  const tail = lerpPoint(from, target, Math.max(0, p - 0.28))
  return (
    <>
      <path d={`M${tail[0]} ${tail[1]} L${x} ${y}`} stroke="#fff6c8" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      <Star cx={x} cy={y} r={3.6} color="#ffe27a" spin={p * 200} />
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 子ども: ぽん と出る → こうもりに びっくり(うしろへ のけぞる)→ 火が ついて おどろく → かかげて にっこり
  const pop = span(t, 0.3, 0.9, backOut)
  const flinch = during(t, BAT_AT + 0.35, BAT_AT + 1.0, 0.15)
  const shiver = (during(t, 0.9, 1.3, 0.1) + during(t, 1.9, LIGHT_AT, 0.2)) * wave(t, 0.1) * 0.45
  const mood: Mood = t < LIGHT_AT ? 'scared' : t < RAISE + 0.2 ? 'surprised' : 'happy'
  const look: EyeLook =
    t < BAT_AT ? { x: wave(t, 1.8), y: 0 } : t < STAR_AT ? { x: -0.6, y: -1 } : t < LIGHT_AT ? { x: 0.9, y: -1.1 } : t < RAISE ? { x: 0.9, y: 0.9 } : { x: 0, y: -1.1 }

  // うで: 右手は たいまつを にぎって あたまの 上へ。左手は あとから そえる
  const lift = span(t, RAISE, RAISED, easeInOut)
  const liftL = span(t, RAISE + 0.4, RAISED + 0.1, easeInOut)
  // 手は あたまの 横を まわって のぼる(あたまや 顔の 前を よこぎらない)
  const swingR = Math.sin(lift * Math.PI) * 11
  const swingL = Math.sin(liftL * Math.PI) * 11
  const baseR = lerpPoint(HANG_R, HIGH_R, lift)
  const baseL = lerpPoint(HANG_L, HIGH_L, liftL)
  const handR: Point = [baseR[0] + swingR, baseR[1]]
  const handL: Point = [baseL[0] - swingL, baseL[1]]
  const armR = solveArm(SHOULDER_R, handR, 1)
  const armL = solveArm(SHOULDER_L, handL, -1)

  // 火: ながれぼしが とどいた しゅんかん に つく
  const flame = Math.max(0, span(t, LIGHT_AT, LIGHT_AT + 0.45, backOut))
  const flameBase: Point = [armR.hand[0], armR.hand[1] - CUP_RISE]
  const night = span(t, 0.2, 0.8) * (1 - span(t, LIGHT_AT + 0.3, RAISED))
  // 火が ついて、ひろがるにつれ、まわりが ぱあっと あかるくなる(よるの くらさが ぬける)
  const darkness = 0.7 * span(t, 0.2, 0.8) * (1 - span(t, LIGHT_AT + 0.1, RAISED + 0.2, easeInOut))
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Forest t={t} />
        <Layer opacity={pop}>
          <ellipse cx="54" cy="97.2" rx="12" ry="2.6" fill="#000000" opacity="0.12" />
          <Layer scale={0.7 + 0.3 * pop} origin={FEET}>
            <Layer x={shiver + flinch * 1.2} y={flinch * 1.5} rotate={flinch * 5} origin={FEET}>
              <Kid mood={mood} look={look} sweat={during(t, 0.7, LIGHT_AT, 0.2)} t={t} />
              <TorchStick grip={armR.hand} />
              <Arm shoulder={SHOULDER_L} elbow={armL.elbow} hand={armL.hand} color={TUNIC_DARK} />
              <Arm shoulder={SHOULDER_R} elbow={armR.elbow} hand={armR.hand} color={TUNIC_DARK} />
            </Layer>
          </Layer>
        </Layer>
        {/* よるの くらさ(火の まわりだけ ぬける) */}
        <rect x="-10" y="-10" width="130" height="130" fill={NIGHT} opacity={darkness} />
        <NightStars t={t} opacity={night} />
        <Layer opacity={night}>
          <Bat t={t} />
        </Layer>
        <ShootingStar t={t} target={[HANG_R[0], HANG_R[1] - CUP_RISE - 1]} />
        <Flame x={flameBase[0]} y={flameBase[1]} size={flame * 0.9} t={t} />
        <Rays cx={flameBase[0]} cy={flameBase[1] - 6} amount={span(t, RAISED, RAISED + 0.4) * 0.9} t={t} />
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
    { at: 0, label: 'くらい 夜。子どもが たいまつを もって ひとり', sound: 'pop' },
    { at: BAT_AT, label: 'こうもりが とんできて びっくり' },
    { at: STAR_AT, label: 'ながれぼしが おちてくる' },
    { at: LIGHT_AT, label: 'たいまつに 火が ついて、まわりが あかるくなる', sound: 'pop' },
    { at: RAISE, label: '火を あたまの 上に かかげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '光 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
