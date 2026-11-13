/*
 * 汽(き): さむい日、おなべの みずが ぐらぐら あつくなって、ゆげが ふわふわ のぼる。
 *
 * ほね(画と絵の対応)
 *   1・2画目(点) … おなべから はねとんだ 水の しずく(あたまの上のほうに ならぶ)
 *   3画目(はね) … 左へ とんでいった しずく が おちていく あと
 *   4画目(ノ)   … うえへ のぼる ゆげの、左に はみ出した ほそい すじ
 *   5・6画目    … ゆげの 2だんめ・3だんめの よこに ひろがる かたまり
 *   7画目       … いちばん下の ゆげの かたまり(おなべの すぐ上)
 *   (ゆげは おなべから 上へ のぼって ひろがるので、字の形とは だいたい おなじ場所・むき にしている)
 *
 * ながれ
 *   ゆきが ふる さむい日。女の子が マフラーで ぶるぶる ふるえている
 *   → ひを たいた おなべに 手をかざして、ほっと ぬくもる
 *   → みずが ぼこぼこ わきたって、ゆげが もくもく のぼる(女の子は おどろく)
 *   → 水が ぽん ぽんと はねて、女の子は 両手を あげて よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「汽」が のこる
 *
 * 女の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   ゆげは おなべの 水面から のぼり、水は おなべの 中で あわだつ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '汽'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f07f9e'
const DRESS_DARK = '#d9648a'
const SCARF = '#e8534a'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const POT = '#9aa8b8'
const POT_DARK = '#7a8898'
const POT_LIGHT = '#c3cdd8'
const IRON = '#4a4f5c'
const WATER = '#7cc4f2'
const WATER_DARK = '#56aae6'
const FLAME = '#ff8a3d'
const FLAME_CORE = '#ffd24a'
const STEAM = '#ffffff'
const STEAM_SHADE = '#a9c2dc'
const SNOW = '#dbe9f7'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WARM_UP = 1.5
const BOIL = 2.4
const STEAM_AT = 3.4
const CHEER = 4.7
const INK = 5.8
const DONE = 8.2
const DURATION = 9

/** 女の子の まんなか(x)と 足もと(y)。かた は どう の 上 */
const GIRL_X = 34
const SHOULDER_L: readonly [number, number] = [29.5, 60]
const SHOULDER_R: readonly [number, number] = [38.5, 60]
/** うで・うでさき の長さ */
const ARM_PART = 8

/** おなべの まんなか(x)・ふち の高さ(y)・半はば */
const POT_X = 72
const POT_TOP = 64
const POT_HALF = 16

type Vec = readonly [number, number]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ───────── まわりの けしき ───────── */

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 18, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** さむい間だけ ふる ゆき。おなべが あったまると、やむ */
function Snow({ t }: SceneProps) {
  const show = 1 - span(t, 1.4, 2.6)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[10, 26, 48, 64, 84, 100].map((x, i) => {
        const fall = (t * (0.18 + (i % 3) * 0.05) + i * 0.17) % 1
        return <circle key={x} cx={x + Math.sin(fall * 9 + i) * 3} cy={-2 + fall * 70} r={1.1 + (i % 2) * 0.5} fill={SNOW} stroke="#bcd3ea" strokeWidth="0.3" />
      })}
    </g>
  )
}

/* ───────── ひ と おなべ ───────── */

/** ひ(ほのお)。あたためるほど おおきく なる。たきぎ は 使わず、こんろ の中で もえる */
function Fire({ t }: SceneProps) {
  const power = mix(t, 0, 3.0, 0.55, 1.15, easeOut)
  const tongues: readonly (readonly [number, number, number])[] = [
    [66, 8, 0],
    [72, 10.5, 1.7],
    [78, 8, 3.1],
  ]
  return (
    <>
      {tongues.map(([x, h, phase]) => {
        const height = h * power * (1 + wave(t, 0.35, phase) * 0.12)
        const sway = wave(t, 0.5, phase) * 0.9
        return (
          <g key={x}>
            <path d={`M${x - 3.2} 95.5 Q${x - 3.6} ${95.5 - height * 0.5} ${x + sway} ${95.5 - height} Q${x + 3.6} ${95.5 - height * 0.5} ${x + 3.2} 95.5 Z`} fill={FLAME} />
            <path d={`M${x - 1.6} 95.5 Q${x - 1.8} ${95.5 - height * 0.3} ${x + sway * 0.6} ${95.5 - height * 0.6} Q${x + 1.8} ${95.5 - height * 0.3} ${x + 1.6} 95.5 Z`} fill={FLAME_CORE} />
          </g>
        )
      })}
    </>
  )
}

/** こんろ: 足が 2本と、おなべを のせる 板 */
function Stove() {
  return (
    <>
      <rect x="57" y="84" width="3.6" height="12" rx="1.4" fill={IRON} />
      <rect x="83.4" y="84" width="3.6" height="12" rx="1.4" fill={IRON} />
      <rect x="55" y="83.4" width="34" height="3.2" rx="1.6" fill={IRON} />
    </>
  )
}

/** あわ: 水面で ふくらんで、ぱちん と われる。あつくなるほど たくさん */
function Bubbles({ t }: SceneProps) {
  const heat = span(t, BOIL - 0.5, BOIL + 1.1)
  if (heat <= 0) return null
  const spots: readonly (readonly [number, number, number, number])[] = [
    [-8, 0.2, 0.9, 0.0],
    [-2, 0.6, 1.25, 0.35],
    [6, -0.1, 1.05, 0.7],
    [11, 0.5, 1.4, 0.15],
    [1, -0.5, 0.8, 0.55],
  ]
  return (
    <>
      {spots.map(([dx, dy, speed, phase], i) => {
        const age = (t * speed * (0.7 + heat * 0.6) + phase) % 1
        const grow = Math.min(age / 0.85, 1)
        const r = (0.7 + 1.7 * grow) * (0.5 + 0.5 * heat)
        const popped = age > 0.85
        return popped ? (
          <path key={i} d={`M${POT_X + dx - 2} ${POT_TOP + dy} l-1 -1.2 M${POT_X + dx + 2} ${POT_TOP + dy} l1 -1.2`} stroke="#e8f6ff" strokeWidth="0.7" strokeLinecap="round" opacity={heat} />
        ) : (
          <g key={i} opacity={heat}>
            <circle cx={POT_X + dx} cy={POT_TOP + dy} r={r} fill="#e8f6ff" />
            <circle cx={POT_X + dx - r * 0.3} cy={POT_TOP + dy - r * 0.3} r={r * 0.3} fill="#ffffff" />
          </g>
        )
      })}
    </>
  )
}

function Pot({ t }: SceneProps) {
  // ぼこぼこ わくと おなべが かたかた ゆれる
  const rattle = span(t, STEAM_AT - 0.2, STEAM_AT + 0.4) * wave(t, 0.14) * 0.5
  // 水面は あたたまると ゆらゆら
  const ripple = span(t, 1.0, BOIL) * wave(t, 0.6) * 0.5
  return (
    <>
      <Stove />
      <Fire t={t} />
      <Layer x={rattle} origin={[POT_X, 84]}>
        {/* とって(左右) */}
        <path d={`M${POT_X - POT_HALF} 68 q-6 0.5 -5.4 4 q0.4 2.4 5.4 2.2`} fill="none" stroke={POT_DARK} strokeWidth="2.2" strokeLinecap="round" />
        <path d={`M${POT_X + POT_HALF} 68 q6 0.5 5.4 4 q-0.4 2.4 -5.4 2.2`} fill="none" stroke={POT_DARK} strokeWidth="2.2" strokeLinecap="round" />
        {/* どう */}
        <rect x={POT_X - POT_HALF} y={POT_TOP} width={POT_HALF * 2} height="20" rx="4" fill={POT} />
        <rect x={POT_X - POT_HALF + 2.4} y={POT_TOP + 4} width="3" height="13" rx="1.5" fill={POT_LIGHT} />
        <rect x={POT_X - POT_HALF} y="80" width={POT_HALF * 2} height="4" rx="2" fill={POT_DARK} />
        {/* ふち と 水面 */}
        <ellipse cx={POT_X} cy={POT_TOP} rx={POT_HALF} ry="3.8" fill={POT_DARK} />
        <ellipse cx={POT_X} cy={POT_TOP + 0.4} rx={POT_HALF - 1.8} ry="2.9" fill={WATER} />
        <ellipse cx={POT_X + ripple * 2} cy={POT_TOP + 0.8} rx={POT_HALF - 5} ry="1.6" fill={WATER_DARK} opacity="0.55" />
        <Bubbles t={t} />
      </Layer>
    </>
  )
}

/* ───────── ゆげ と しずく ───────── */

/** ゆげ の ひとつ。おなべから 上へ のぼって、行き先で ふわふわ ゆれる */
type Puff = { readonly to: Vec; readonly r: number; readonly start: number }

/** 上の だん から のぼる(とおくへ行くので、さきに出る)。字の 5・6・7画目 と 4画目 の あたりへ */
const PUFFS: readonly Puff[] = [
  { to: [50, 24], r: 3.8, start: 3.4 },
  { to: [60, 23], r: 4, start: 3.5 },
  { to: [70, 22], r: 4, start: 3.6 },
  { to: [80, 21], r: 3.6, start: 3.7 },
  { to: [49, 14], r: 3, start: 3.45 },
  { to: [46, 27], r: 3, start: 3.6 },
  { to: [44, 36], r: 3, start: 3.7 },
  { to: [53, 36], r: 4.2, start: 3.8 },
  { to: [57, 35], r: 4.4, start: 3.9 },
  { to: [67, 34], r: 4.4, start: 4.0 },
  { to: [77, 33], r: 4, start: 4.1 },
  { to: [47, 52], r: 4.2, start: 4.2 },
  { to: [56, 50], r: 4.6, start: 4.25 },
  { to: [60, 49], r: 4.8, start: 4.3 },
  { to: [70, 48], r: 4.8, start: 4.35 },
  { to: [79, 48], r: 4.2, start: 4.4 },
]
const TRAVEL = 1.25

function Steam({ t }: SceneProps) {
  return (
    <>
      {PUFFS.map((puff, i) => {
        const k = span(t, puff.start, puff.start + TRAVEL, easeOut)
        if (k <= 0) return null
        // おなべの 水面 の まんなか あたりから、ひろがりながら のぼる
        const sway = wave(t, 2.2, i * 0.9) * 0.9 * k
        const x = lerp(POT_X + (i % 3) * 2 - 2, puff.to[0], k) + sway
        const y = lerp(POT_TOP - 2, puff.to[1], k) + wave(t, 1.8, i * 1.3) * 0.6 * k
        const r = Math.max(0.1, puff.r * (0.4 + 0.6 * k))
        return (
          <g key={i} opacity={0.5 + 0.5 * k}>
            <circle cx={x + 0.4} cy={y + 0.8} r={r + 0.7} fill={STEAM_SHADE} />
            <circle cx={x} cy={y} r={r} fill={STEAM} />
          </g>
        )
      })}
    </>
  )
}

/** おなべから はねとぶ 水の しずく。字の 点(1・2画目)と 3画目 の ほうへ とんでいく */
type Splash = { readonly start: number; readonly to: Vec; readonly lift: number }
const SPLASHES: readonly Splash[] = [
  { start: 4.25, to: [18.8, 19.5], lift: 18 },
  { start: 4.5, to: [14.6, 42], lift: 24 },
  { start: 4.7, to: [20, 80], lift: 40 },
]
const SPLASH_END = 5.75

function Splashes({ t }: SceneProps) {
  return (
    <>
      {SPLASHES.map((splash, i) => {
        const p = span(t, splash.start, SPLASH_END)
        if (p <= 0) return null
        const x = lerp(POT_X - 6, splash.to[0], p)
        // うえへ はねて、てっぺん を すぎると おちていく(とちゅう で ゆるやかな やまなり)
        const y = lerp(POT_TOP, splash.to[1], easeInOut(p)) - splash.lift * Math.sin(p * Math.PI)
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M0 -3 Q2.4 0.4 0 2.2 Q-2.4 0.4 0 -3 Z" fill={WATER} stroke={WATER_DARK} strokeWidth="0.4" />
            <circle cx="-0.6" cy="0" r="0.5" fill="#e8f6ff" />
          </g>
        )
      })}
    </>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'cold' | 'warm' | 'wow' | 'cheer'

/** うで の かっこう。angle = ま下から まえ(外)へ ひらいた角度 / bend = ひじ の まがり */
type ArmPose = { readonly angle: number; readonly bend: number }
type ArmPair = { readonly left: ArmPose; readonly right: ArmPose }

/** 手を むねの前で ぎゅっと だきしめる(さむい) */
const HUG: ArmPair = { left: { angle: -15, bend: 100 }, right: { angle: 15, bend: -100 } }
/** おなべに 手を かざす(右のうでは おなべの ほうへ) */
const WARM: ArmPair = { left: { angle: 40, bend: 40 }, right: { angle: 72, bend: 8 } }
/** 両手を 上へ(よろこぶ) */
const HURRAY: ArmPair = { left: { angle: -155, bend: 10 }, right: { angle: 155, bend: -10 } }

function blendArms(a: ArmPair, b: ArmPair, k: number): ArmPair {
  const side = (x: ArmPose, y: ArmPose): ArmPose => ({ angle: lerp(x.angle, y.angle, k), bend: lerp(x.bend, y.bend, k) })
  return { left: side(a.left, b.left), right: side(a.right, b.right) }
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる */
function Arm({ shoulder, pose }: { readonly shoulder: Vec; readonly pose: ArmPose }) {
  const elbow: Vec = [shoulder[0] + Math.sin(rad(pose.angle)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.angle)) * ARM_PART]
  const fore = pose.angle + pose.bend
  const hand: Vec = [elbow[0] + Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={DRESS_DARK} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  const cheek = mood === 'cold' ? '#9cc6ee' : '#ff9d9d'
  return (
    <>
      <circle cx="29.2" cy="51.6" r="2" fill={cheek} opacity="0.6" />
      <circle cx="39.8" cy="51.6" r="2" fill={cheek} opacity="0.6" />
      {mood === 'cold' && (
        <>
          <path d="M29.6 46.6 l2.8 1.5 l-2.8 1.5 M39.4 46.6 l-2.8 1.5 l2.8 1.5" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M31.4 53.4 q0.9 -1 1.8 0 q0.9 1 1.8 0 q0.9 -1 1.8 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'warm' && (
        <>
          <path d="M29.6 48.6 q1.7 -1.9 3.4 0 M36.2 48.6 q1.7 -1.9 3.4 0" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M32 52.6 q2.2 2.2 4.4 0" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'wow' && (
        <>
          <circle cx="31.4" cy="47.8" r="1.7" fill="#2b2b2b" />
          <circle cx="37.6" cy="47.8" r="1.7" fill="#2b2b2b" />
          <circle cx="31.9" cy="47.2" r="0.55" fill="#ffffff" />
          <circle cx="38.1" cy="47.2" r="0.55" fill="#ffffff" />
          <ellipse cx="34.5" cy="53.4" rx="1.4" ry="1.9" fill={MOUTH} />
        </>
      )}
      {mood === 'cheer' && (
        <>
          <path d="M29.6 48.8 q1.7 -2 3.4 0 M36.2 48.8 q1.7 -2 3.4 0" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M31.4 51.6 q3.1 4.6 6.2 0 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

function Girl({ mood, arms, shiver }: { readonly mood: Mood; readonly arms: ArmPair; readonly shiver: number }) {
  return (
    <Layer x={shiver}>
      {/* あし(スカートの 下から 短く 2本)と くつ */}
      <rect x="29.4" y="76" width="3.6" height="16.6" rx="1.8" fill={SKIN} />
      <rect x="35.2" y="76" width="3.6" height="16.6" rx="1.8" fill={SKIN} />
      <ellipse cx="30.4" cy="93.2" rx="3.8" ry="2.2" fill={SHOE} />
      <ellipse cx="37.6" cy="93.2" rx="3.8" ry="2.2" fill={SHOE} />
      {/* どう(ワンピース) */}
      <path d="M28 59 Q34 56.4 40 59 L43.4 77.6 Q34 80 24.6 77.6 Z" fill={DRESS} />
      <path d="M26.2 72.4 Q34 74.6 41.8 72.4" fill="none" stroke={DRESS_DARK} strokeWidth="1.4" strokeLinecap="round" />
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <rect x="31.8" y="54" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
      {/* マフラー: くびに まいて、せなかへ たれる */}
      <ellipse cx="34" cy="58.4" rx="6.4" ry="2.4" fill={SCARF} />
      <path d="M38.6 59 l1.6 7.6 q-1.6 1 -3 0 l-0.4 -6.6 Z" fill={SCARF} />
      {/* うで */}
      <Arm shoulder={SHOULDER_L} pose={arms.left} />
      <Arm shoulder={SHOULDER_R} pose={arms.right} />
      {/* あたま: かみ(おかっぱ)と 顔 */}
      <path d="M24.6 52 C22.4 36 45.6 36 43.4 52 C43 54.6 41.4 55 40.6 53 L27.4 53 C26.6 55 25 54.6 24.6 52 Z" fill={HAIR} />
      <circle cx="34" cy="48.6" r="7.8" fill={SKIN} />
      <path d="M26.2 47.6 C26 40.2 42 40.2 41.8 47.6 C39.6 44.4 37 43.4 34 43.4 C31 43.4 28.4 44.4 26.2 47.6 Z" fill={HAIR} />
      <Face mood={mood} />
    </Layer>
  )
}

/** さむい間の ぶるぶる と、ふるえの せん */
function Shiver({ t }: SceneProps) {
  const show = 1 - span(t, WARM_UP - 0.3, WARM_UP + 0.3)
  if (show <= 0) return null
  const w = wave(t, 0.12)
  return (
    <g opacity={show} stroke="#7aa6d8" strokeWidth="0.9" strokeLinecap="round" fill="none">
      <path d={`M${22 + w} 52 l-2.6 1 M${22 - w} 58 l-3 0.2 M${22 + w} 64 l-2.6 -0.8`} />
      <path d={`M${46 - w} 52 l2.6 1 M${46 + w} 58 l3 0.2 M${46 - w} 64 l2.6 -0.8`} />
    </g>
  )
}

/** てが あたたまった ときの「ほっ」 */
function Relief({ t }: SceneProps) {
  const show = during(t, WARM_UP + 0.5, BOIL + 0.5, 0.2)
  if (show <= 0) return null
  const p = span(t, WARM_UP + 0.5, BOIL + 0.5, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={44.5 + p * 3} cy={42 - p * 5} rx={2 + p * 1.4} ry={1.4 + p * 0.9} fill="#ffffff" stroke="#b8cde2" strokeWidth="0.6" />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  const mood: Mood = t < WARM_UP ? 'cold' : t < STEAM_AT ? 'warm' : t < CHEER ? 'wow' : 'cheer'
  // うで: だきしめる → おなべに かざす → りょうてを あげる
  const toWarm = span(t, WARM_UP - 0.1, WARM_UP + 0.5, easeInOut)
  const toHurray = span(t, CHEER - 0.1, CHEER + 0.5, backOut)
  const arms = blendArms(blendArms(HUG, WARM, toWarm), HURRAY, Math.min(toHurray, 1))
  const shiver = t < WARM_UP ? wave(t, 0.12) * 0.5 : 0
  // よろこびの ぴょん(もどる ぶんだけ はねる)
  const hop = t > CHEER + 0.3 && t < INK ? -Math.abs(wave(t, 0.55)) * 1.6 : 0
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Snow t={t} />
        <ellipse cx={GIRL_X} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
        <ellipse cx={POT_X} cy="97.6" rx="19" ry="2.2" fill="#000000" opacity="0.1" />
        <Pot t={t} />
        <Layer y={hop}>
          <Girl mood={mood} arms={arms} shiver={shiver} />
        </Layer>
        <Shiver t={t} />
        <Relief t={t} />
        <Steam t={t} />
        <Splashes t={t} />
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
    { at: 0, label: 'ゆきの さむい日。女の子が ぶるぶる', sound: 'pop' },
    { at: WARM_UP, label: 'ひで おなべを あたためて、ほっ' },
    { at: BOIL, label: 'みずが ぼこぼこ あつく なる' },
    { at: STEAM_AT, label: 'ゆげが ふわふわ のぼる', sound: 'pop' },
    { at: CHEER, label: '水が はねて、女の子は おおよろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '汽 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
