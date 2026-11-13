/*
 * 貝(かい): うみで ひろった かいがら。むかしは お金のかわりに なった。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … かいがらの 左のふち
 *   2画目(𠃍)  … かいがらの 上と 右のふち
 *   3・4・5画目 … かいがらの よこすじ(すじ が 3本)。5画目は 下のふちも かねる
 *   6・7画目   … かいがらを のせた 木の 台の、ハの字に ひらいた 2本の あし
 *
 * ながれ
 *   はらぺこの 子どもが あるいてくる(あたまの上に パンの ゆめ)。ぐう と おなかが なる
 *   → 波が きて、大きな かいがらを 砂はまに おいていく。子どもは びっくり して、だいじに だきあげる
 *   → 木の台に かいがらを のせると、台の となりの カニが「おかね だね」と パンを ぽーんと なげてくれる
 *   → 子どもは パンを うけとって 大よろこび。カメラが かいがらに ぐーっと よると、
 *     ほね が ひかって、絵が うすくなり、字「貝」が のこる
 *
 * 絵は、ほんものの つくり を守る(字の形に合わせるために、ゆがめない):
 *   子どもは かた から出て ひじ で まがる うで、こし から ひざ で まがる あし、みじかい くび。
 *   かいがらや 台は、字と同じ 大きさで えがいてから 1/3 に ちぢめて 場面に おき、
 *   さいごに カメラが 3ばい に よると、字の画と ぴったり かさなる。
 */
import { backOut, clamp01, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type Ease, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '貝'

type Pt = readonly [number, number]

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef7b5a'
const TUNIC_NEAR = '#d9633f'
const TUNIC_FAR = '#b5502f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const SKY = '#d7f0fb'
const SEA = '#7cc4f2'
const SEA_FAR = '#a9dbf6'
const SAND = '#f7e4b5'
const SAND_DARK = '#efd9a2'
const SHELL = '#fbe3d6'
const SHELL_RIM = '#e59b86'
const SHELL_RIDGE = '#eeaa94'
const WOOD = '#b9824f'
const WOOD_DARK = '#8f5f35'
const CRAB = '#e8604c'
const CRAB_DARK = '#c74a38'
const BREAD = '#e9b266'
const BREAD_LIGHT = '#f6d08e'
const BREAD_LINE = '#c98a46'

/** くぎり の時間(秒) */
const WALK_START = 0.2
const WALK_END = 1.4
/** おなかが すいて、パンを おもう */
const HUNGRY = 1.5
const WAVE_IN = 1.9
const WAVE_LAND = 2.9
const WAVE_OUT = 3.7
const SURPRISE = 2.9
const BEND_START = 3.5
const LIFT_START = 4.0
const LIFT_END = 4.7
const CARRY_END = 5.7
const SET_START = 5.75
const SET_END = 6.1
const LET_GO = 6.25
const BACK_START = 6.3
const BACK_END = 7.0
const TOSS_START = 6.7
const TOSS_END = 7.3
const ZOOM_START = 7.9
const ZOOM_END = 9.0
const INK = 9.1
const DONE = 11.3
const DURATION = 11.8

/** 地面の たかさ と、場面の カメラの じく(かいがらの まんなか) */
const GROUND = 64
const FOCUS: Pt = [54.5, 47]
/** 字と同じ大きさで えがいた もの(かいがら・台)を、場面に おくときの ちぢめかた */
const MINI = 1 / 3
const ZOOM = 3

const PICK_X = 20
const PLACE_X = 37.5
const CHEER_X = 28
const SAND_X = 36
/** 子どもが かいがらを だくとき、こし から かいがらの まんなか までの よこの きょり */
const HOLD_GAP = 17
const BREAD_REST: Pt = [67.6, 45.9]

type Key = readonly [number, number]

/** 子どもの こし の よこの いち(時間, x) */
const HIP_X_KEYS: readonly Key[] = [
  [WALK_START, -8],
  [WALK_END, PICK_X],
  [LIFT_END, PICK_X],
  [CARRY_END, PLACE_X],
  [BACK_START, PLACE_X],
  [BACK_END, CHEER_X],
]

/** くぎりごとの 値を、なめらかに つなぐ */
function track(t: number, keys: readonly Key[], ease: Ease = easeInOut): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (t <= first[0]) return first[1]
  if (t >= last[0]) return last[1]
  const i = keys.findIndex((key) => key[0] > t)
  const a = keys[i - 1]
  const b = keys[i]
  return a[1] + (b[1] - a[1]) * ease(span(t, a[0], b[0]))
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const rad = (deg: number) => (deg * Math.PI) / 180

type Limb = { readonly root: Pt; readonly joint: Pt; readonly end: Pt }

/** 2つの ほね(かた→ひじ→手 / こし→ひざ→足)を、手や足の いち に とどくように まげる。side で まがる向きを きめる。 */
function reach(root: Pt, target: Pt, length: number, side: 1 | -1): Limb {
  const dx = target[0] - root[0]
  const dy = target[1] - root[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const far = Math.min(dist, length * 2 - 0.02)
  const ux = dx / dist
  const uy = dy / dist
  const along = far / 2
  const out = Math.sqrt(Math.max(length * length - along * along, 0))
  return {
    root,
    joint: [root[0] + ux * along - uy * out * side, root[1] + uy * along + ux * out * side],
    end: [root[0] + ux * far, root[1] + uy * far],
  }
}

function LimbShape({ limb, color, width }: { readonly limb: Limb; readonly color: string; readonly width: number }) {
  const { root, joint, end } = limb
  return <path d={`M${root[0]} ${root[1]} L${joint[0]} ${joint[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
}

function Hand({ at }: { readonly at: Pt }) {
  return <circle cx={at[0]} cy={at[1]} r="2.3" fill={SKIN} />
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const flap = wave(t, 0.5) * 0.6
  return (
    <>
      <rect x="0" y="0" width="109" height="42" fill={SKY} />
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="52" cy="14" rx="7" ry="3.2" />
        <ellipse cx="57" cy="12.4" rx="5" ry="3.2" />
        <ellipse cx="92" cy="25" rx="6" ry="2.6" />
      </g>
      {/* うみ と 水平線 */}
      <rect x="0" y="36" width="109" height="23" fill={SEA} />
      <rect x="0" y="36" width="109" height="4.4" fill={SEA_FAR} />
      {[
        [14, 45],
        [46, 48],
        [78, 44],
        [30, 53],
        [66, 54],
        [96, 51],
      ].map(([x, y]) => (
        <path key={`${x}-${y}`} d="M0 0 q2 -1.4 4 0 q2 1.4 4 0" fill="none" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" transform={`translate(${x + wave(t, 2.4, x * 0.1) * 2} ${y})`} />
      ))}
      {/* すなはま(うみとの さかいに あわ) */}
      <path d="M0 58 Q14 56 28 58.4 T56 58 T84 58.4 T112 58 V112 H0 Z" fill={SAND} />
      <path d="M0 58 Q14 56 28 58.4 T56 58 T84 58.4 T112 58" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0 84 Q30 80 60 85 T112 83 V112 H0 Z" fill={SAND_DARK} />
      {[
        [8, 70],
        [46, 76],
        [92, 68],
        [74, 90],
        [20, 94],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.6" ry="0.8" fill="#e6cb92" />
      ))}
      {/* かもめ */}
      <g transform={`translate(${86 - t * 1.6} ${22 + wave(t, 3) * 1.2})`} fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round">
        <path d={`M-3.4 0 Q-1.7 ${-2.2 - flap} 0 0 Q1.7 ${-2.2 - flap} 3.4 0`} />
      </g>
    </>
  )
}

/** 字と同じ 大きさ(座標)で えがいた かいがら。1/3 に ちぢめて 場面に おく。 */
function ShellArt() {
  return (
    <>
      <path d="M31 19 C31 15 34 14 37.5 13.6 L71 14.6 C75.6 14.8 77.2 16.4 77.2 20.4 L76.8 70 C76.6 75 76.4 77.6 73 77.8 L36 77.8 C32 77.8 30.8 75.4 30.8 71 Z" fill={SHELL} />
      <Bone char={CHAR} n={3} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={4} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={5} color={SHELL_RIDGE} width={4.4} />
      <Bone char={CHAR} n={1} color={SHELL_RIM} width={3.4} />
      <Bone char={CHAR} n={2} color={SHELL_RIM} width={3.4} />
      <ellipse cx="42" cy="27" rx="4.4" ry="2.2" fill="#ffffff" opacity="0.65" />
    </>
  )
}

/** 場面の中の かいがら。cx, cy は まんなか。rock は 波の ゆれ。 */
function Shell({ at, rock }: { readonly at: Pt; readonly rock: number }) {
  return (
    <Layer rotate={rock} origin={[at[0], at[1] + 10]}>
      <Layer x={at[0] - FOCUS[0]} y={at[1] - FOCUS[1]} scale={MINI} origin={FOCUS}>
        <ShellArt />
      </Layer>
    </Layer>
  )
}

/** 木の台。2本の あし(6・7画目)は ハの字に ひらく。 */
function Stool({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <>
      <ellipse cx={FOCUS[0]} cy="64.6" rx={10.6 * grow} ry="1.6" fill="#000000" opacity="0.12" />
      <Layer scale={MINI * grow} origin={FOCUS}>
        <Bone char={CHAR} n={6} color={WOOD_DARK} width={4.6} />
        <Bone char={CHAR} n={7} color={WOOD_DARK} width={4.6} />
        <rect x="28" y="77" width="53" height="4.4" rx="2.2" fill={WOOD} />
      </Layer>
    </>
  )
}

function Bread({ at, spin = 0 }: { readonly at: Pt; readonly spin?: number }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${spin})`}>
      <ellipse cx="0" cy="0" rx="3.6" ry="3" fill={BREAD} />
      <ellipse cx="-0.8" cy="-1.2" rx="2" ry="1" fill={BREAD_LIGHT} />
      <path d="M-1.6 -2 l0.8 1.8 M0.2 -2.4 l0.8 2 M1.9 -1.8 l0.6 1.6" stroke={BREAD_LINE} strokeWidth="0.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

type CrabProps = SceneProps & { readonly bread: boolean }

/** 台の となりに いる カニ。パンを はさみに のせて いる。かいがらを みると よろこんで、パンを なげる。 */
function Crab({ t, bread }: CrabProps) {
  const glad = span(t, 6.1, 6.4)
  const tossed = t >= TOSS_START
  const bob = Math.sin(t * 5) * 0.25 * (1 + glad)
  const eyeUp = glad * 1.4
  // パンを なげたあとは、りょうほうの はさみを ふって よろこぶ
  const cheer = tossed ? Math.abs(wave(t, 0.5)) * 2.4 : 0
  const leftClaw: Pt = [67.6, 51.6 - cheer + bob]
  const rightClaw: Pt = [84.4, 52.6 - glad * 1.2 - cheer * 0.8 + bob]
  return (
    <g transform={`translate(0 ${bob})`}>
      {[
        [70.8, 61.2, 67.8, 64.2],
        [72, 62.8, 69.6, 64.7],
        [73.4, 63.6, 72, 65],
      ].map(([x1, y1, x2, y2]) => (
        <g key={x1} stroke={CRAB_DARK} strokeWidth="1.3" strokeLinecap="round" fill="none">
          <path d={`M${x1} ${y1} L${x2} ${y2}`} />
          <path d={`M${152 - x1} ${y1} L${152 - x2} ${y2}`} />
        </g>
      ))}
      <path d={`M71.4 57.6 L${leftClaw[0] + 1} ${leftClaw[1] + 1.2}`} stroke={CRAB_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <path d={`M80.6 57.6 L${rightClaw[0] - 1} ${rightClaw[1] + 1.2}`} stroke={CRAB_DARK} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="76" cy="59.6" rx="6.8" ry="4.7" fill={CRAB} />
      <ellipse cx="76" cy="61.2" rx="4.6" ry="2.6" fill="#f08572" />
      {[leftClaw, rightClaw].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.6" fill={CRAB} />
          <path d={`M${x} ${y - 0.4} L${x} ${y - 2.6}`} stroke="#a83a2c" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
      {[74, 78].map((x) => (
        <g key={x}>
          <path d={`M${x} 56 L${x} ${53.4 - eyeUp}`} stroke={CRAB_DARK} strokeWidth="1" strokeLinecap="round" />
          <circle cx={x} cy={52.8 - eyeUp} r="1.9" fill="#ffffff" />
          <circle cx={x - 0.2} cy={52.9 - eyeUp} r="0.9" fill="#2b2b2b" />
        </g>
      ))}
      {glad > 0.5 ? <ellipse cx="76" cy="60.6" rx="1.4" ry="1.2" fill="#8a2c22" /> : <path d="M74.4 60 Q76 61.8 77.6 60" fill="none" stroke="#8a2c22" strokeWidth="0.9" strokeLinecap="round" />}
      <circle cx="72.6" cy="60" r="1" fill="#ff9d9d" opacity="0.6" />
      <circle cx="79.4" cy="60" r="1" fill="#ff9d9d" opacity="0.6" />
      {bread ? <Bread at={[leftClaw[0], leftClaw[1] - 5.7]} /> : null}
    </g>
  )
}

/** 波。かいがらを のせて、左から すべってきて、のこして ひいていく。 */
function Tongue({ front, opacity }: { readonly front: number; readonly opacity: number }) {
  if (opacity <= 0) return null
  const edge = `M${front - 3} 59.6 Q${front + 3} 62 ${front + 1} 65.5 Q${front + 4} 69 ${front - 2} 72`
  return (
    <g opacity={opacity}>
      <path d={`M-30 59 L${front - 3} 59.6 ${edge.slice(edge.indexOf('Q'))} L-30 73 Z`} fill="#bfe6fa" />
      <path d={edge} fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  )
}

type FaceMood = 'sad' | 'surprised' | 'happy'

/** 顔。体は 右むき。 */
function Face({ mood }: { readonly mood: FaceMood }) {
  return (
    <>
      <circle cx="1.2" cy="-21.8" r="6.6" fill={SKIN} />
      <path d="M-5.4 -20.5 C-6.8 -29.8 5.2 -30.6 7.6 -25 C5 -26.2 2.4 -25.2 0.6 -22.8 C-1 -20.6 -3.4 -19.4 -5.4 -20.5 Z" fill={HAIR} />
      <path d="M-1 -28.2 Q-0.4 -31 1.4 -29.4 Q2.6 -31.4 3.6 -28.8" fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.2" cy="-18.6" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {mood === 'sad' ? (
        <>
          <circle cx="4.6" cy="-21.4" r="1.05" fill="#2b2b2b" />
          <path d="M3.2 -22.8 L6.2 -24.2" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M4.2 -17.2 Q5.8 -18.8 7.4 -17.2" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'surprised' ? (
        <>
          <circle cx="4.8" cy="-22" r="1.8" fill="#ffffff" stroke="#2b2b2b" strokeWidth="0.6" />
          <circle cx="5.1" cy="-22" r="0.95" fill="#2b2b2b" />
          <ellipse cx="6" cy="-17.6" rx="1" ry="1.4" fill="#b9483f" />
        </>
      ) : null}
      {mood === 'happy' ? (
        <>
          <path d="M3.4 -21.4 Q4.8 -23.6 6.2 -21.4" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M4 -19 Q5.8 -15.8 7.6 -19 Z" fill="#b9483f" />
        </>
      ) : null}
    </>
  )
}

type PersonProps = {
  readonly hip: Pt
  readonly lean: number
  readonly footNear: Pt
  readonly footFar: Pt
  readonly armFar: Limb
  readonly mood: FaceMood
  readonly headTilt: number
}

/** 子ども。かた から うで、こし から あし が出て、くび は みじかく どう の上。うで の 手前がわ は あとで べつに かく。 */
function Person({ hip, lean, footNear, footFar, armFar, mood, headTilt }: PersonProps) {
  const legFar = reach([hip[0] - 1.2, hip[1] + 0.5], footFar, 8.6, -1)
  const legNear = reach([hip[0] + 1.2, hip[1] + 0.5], footNear, 8.6, -1)
  return (
    <>
      <LimbShape limb={armFar} color={TUNIC_FAR} width={3.8} />
      <Hand at={armFar.end} />
      <LimbShape limb={legFar} color={PANTS_DARK} width={4.6} />
      <ellipse cx={footFar[0] + 1.6} cy={footFar[1] + 0.9} rx="3.4" ry="1.8" fill={SHOE} />
      <LimbShape limb={legNear} color={PANTS} width={4.6} />
      <ellipse cx={footNear[0] + 1.6} cy={footNear[1] + 0.9} rx="3.4" ry="1.8" fill={SHOE} />
      <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${lean})`}>
        {/* くび: どう と あたま の間を みじかく つなぐ */}
        <rect x="-1.6" y="-18" width="3.2" height="4" rx="1.4" fill={SKIN_SHADE} />
        <rect x="-5.4" y="-15" width="10.8" height="16" rx="5" fill={TUNIC} />
        <path d="M-4 -5 h8" stroke={TUNIC_NEAR} strokeWidth="1.2" strokeLinecap="round" />
        <g transform={`rotate(${headTilt} 0 -15)`}>
          <Face mood={mood} />
        </g>
      </g>
    </>
  )
}

/** 「！」のしるし。びっくり した とき あたまの上に ぽん と出る。 */
function Surprise({ at, pop }: { readonly at: Pt; readonly pop: number }) {
  if (pop <= 0) return null
  return (
    <Layer x={at[0]} y={at[1]} scale={pop} origin={[0, 4]}>
      <path d="M-1.1 -4.4 h2.2 l-0.4 6.2 h-1.4 Z" fill="#f5a623" />
      <circle cx="0" cy="3.8" r="1.2" fill="#f5a623" />
    </Layer>
  )
}

/** おなかが すいて パンを おもう ふきだし。 */
function Dream({ at, show, t }: { readonly at: Pt; readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <circle cx={at[0] - 5.4} cy={at[1] + 8} r="1" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx={at[0] - 3.4} cy={at[1] + 4.6} r="1.7" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx={at[0]} cy={at[1]} r="6.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <Bread at={[at[0], at[1] + wave(t, 1.2) * 0.3]} />
    </g>
  )
}

/** おなかの「ぐう」。からだの まえに、ふるえる 小さな 線。 */
function Rumble({ at, show, t }: { readonly at: Pt; readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  const k = 0.5 + 0.5 * Math.abs(wave(t, 0.4))
  return (
    <g opacity={show * k} fill="none" stroke="#8aa0c0" strokeWidth="0.9" strokeLinecap="round">
      <path d={`M${at[0]} ${at[1]} q1.2 -1.2 2.4 0 q1.2 1.2 2.4 0`} />
      <path d={`M${at[0] + 0.6} ${at[1] + 2.6} q1.2 -1.2 2.4 0 q1.2 1.2 2.4 0`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // 子どもの うごき: あるく → たちどまる → かがんで ひろう → だいて あるく → 台に おく → さがる
  const hx = track(t, HIP_X_KEYS)
  // あるくときの あしの ふり は、すすんだ きょり に合わせる(すべって見えないように)
  const hxAhead = track(t + 0.03, HIP_X_KEYS)
  const hxBehind = track(t - 0.03, HIP_X_KEYS)
  const velocity = (hxAhead - hxBehind) / 0.06
  const walking = clamp01(Math.abs(velocity) / 4)
  const dir = velocity >= 0 ? 1 : -1
  const phase = hx * 0.628
  // かがむ度合い(0 = まっすぐ / 1 = ひろう ふかさ)
  const crouch = track(t, [
    [BEND_START, 0],
    [LIFT_START - 0.1, 1],
    [LIFT_START, 1],
    [LIFT_END, 0],
    [SET_START, 0],
    [SET_END, 0.45],
    [LET_GO, 0.45],
    [LET_GO + 0.3, 0],
  ])
  // よろこびの ぴょん
  const hop = t > TOSS_END ? Math.abs(Math.sin((t - TOSS_END) * Math.PI * 2.6)) * during(t, TOSS_END, ZOOM_END, 0.1) * 3 : 0
  const bob = -Math.abs(Math.sin(phase)) * 0.9 * walking
  const hip: Pt = [hx - 3 * crouch, 47 + 8 * crouch + bob - hop]
  const lean = 40 * crouch
  const shoulder: Pt = [hip[0] + Math.sin(rad(lean)) * 12.5, hip[1] - Math.cos(rad(lean)) * 12.5]

  const stride = (sign: 1 | -1, stance: number): Pt => [
    hx + stance * (1 - walking) + sign * Math.sin(phase) * 5 * walking,
    GROUND - 1.8 - Math.max(0, sign * Math.cos(phase) * dir) * 2.6 * walking - hop,
  ]
  const footNear = stride(1, 2.5)
  const footFar = stride(-1, -2.5)

  // かいがらの いち: 波に のって くる → すなはま → だきあげる → 台の上
  const shellX = mix(t, WAVE_IN, WAVE_LAND, -9, SAND_X, easeOut)
  const sand: Pt = [shellX, GROUND - 10]
  const held: Pt = [hx + HOLD_GAP, 41 + 6 * span(t, SET_START, SET_END)]
  const shellAt: Pt = t >= LET_GO ? FOCUS : lerpPt(sand, held, span(t, LIFT_START, LIFT_END))
  const rock = t < LIFT_START ? (1 - span(t, WAVE_IN, WAVE_LAND)) * wave(t, 0.45) * 12 : 0

  // パン: カニの はさみ → ぽーん → 子どもの 手
  const toss = span(t, TOSS_START, TOSS_END)
  const catchAt: Pt = [CHEER_X + 10, 41 - hop]
  const breadAt: Pt =
    t < TOSS_START ? BREAD_REST : t < TOSS_END ? [BREAD_REST[0] + (CHEER_X + 10 - BREAD_REST[0]) * toss, BREAD_REST[1] + (41 - BREAD_REST[1]) * toss - Math.sin(toss * Math.PI) * 15] : catchAt

  // 手の いち: ふだんは たれる。おなかを おさえる → びっくり → かいがらを だく → パンを うける
  const swing = Math.sin(phase) * 4 * walking
  const hangNear: Pt = [shoulder[0] - swing, shoulder[1] + 14.3]
  const hangFar: Pt = [shoulder[0] + swing, shoulder[1] + 14.3]
  const belly = span(t, HUNGRY, HUNGRY + 0.3) * (1 - span(t, WAVE_LAND - 0.1, WAVE_LAND + 0.1))
  const spread = during(t, SURPRISE, SURPRISE + 0.7, 0.15)
  const grip = span(t, BEND_START + 0.1, LIFT_START - 0.1) * (1 - span(t, LET_GO, LET_GO + 0.25))
  const catching = span(t, 6.6, 7.1)
  const handNear = [
    (p: Pt) => lerpPt(p, [hip[0] + 4.5, hip[1] - 5.5], belly),
    (p: Pt) => lerpPt(p, [shoulder[0] + 8.5, shoulder[1] + 1], spread),
    (p: Pt) => lerpPt(p, [shellAt[0] - 6.3, shellAt[1] + 5.5], grip),
    (p: Pt) => lerpPt(p, [catchAt[0] - 1.6, catchAt[1] + 3.2], catching),
  ].reduce((p, step) => step(p), hangNear)
  const handFar = [
    (p: Pt) => lerpPt(p, [shoulder[0] + 7, shoulder[1] - 1], spread),
    (p: Pt) => lerpPt(p, [shellAt[0] - 6.3, shellAt[1] + 2.5], grip),
    (p: Pt) => lerpPt(p, [catchAt[0] + 1.6, catchAt[1] + 3.6], catching),
  ].reduce((p, step) => step(p), hangFar)
  const armNear = reach(shoulder, handNear, 8, 1)
  const armFar = reach(shoulder, handFar, 8, 1)

  const mood: FaceMood = t < SURPRISE ? 'sad' : t < SURPRISE + 0.7 ? 'surprised' : 'happy'
  const headTilt = track(t, [
    [0, 5],
    [SURPRISE - 0.1, 5],
    [SURPRISE + 0.1, -5],
    [SURPRISE + 0.7, 0],
    [TOSS_END - 0.3, 0],
    [TOSS_END, -5],
  ])

  // ぐるっと カメラが かいがらに よる
  const zoom = 1 + (ZOOM - 1) * span(t, ZOOM_START, ZOOM_END, easeInOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const wet = span(t, WAVE_IN, WAVE_IN + 0.3) * (1 - span(t, WAVE_LAND + 0.3, WAVE_OUT))
  const front = t < WAVE_LAND ? shellX + 9 : mix(t, WAVE_LAND, WAVE_OUT, SAND_X + 9, -30, easeIn)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer scale={zoom} origin={FOCUS}>
          <Ground t={t} />
          <Stool t={t} />
          <Tongue front={front} opacity={wet} />
          {/* すなはま の かいがら の かげ */}
          <ellipse cx={shellAt[0]} cy="64.6" rx="7" ry="1.4" fill="#000000" opacity={0.12 * span(t, WAVE_IN, WAVE_LAND) * (1 - span(t, LIFT_START, LIFT_END))} />
          <Crab t={t} bread={t < TOSS_START} />
          <Layer opacity={span(t, WALK_START, WALK_START + 0.2)}>
            <Dream at={[hx + 9, 9]} show={during(t, HUNGRY, WAVE_LAND - 0.2, 0.25)} t={t} />
            <Person hip={hip} lean={lean} footNear={footNear} footFar={footFar} armFar={armFar} mood={mood} headTilt={headTilt} />
            <Rumble at={[hx + 6.5, 42]} show={during(t, HUNGRY + 0.2, WAVE_LAND - 0.2, 0.2)} t={t} />
            <Surprise at={[hx + 8, 13]} pop={backOut(span(t, SURPRISE, SURPRISE + 0.2)) * (1 - span(t, SURPRISE + 0.55, SURPRISE + 0.7))} />
          </Layer>
          {t >= WAVE_IN ? <Shell at={shellAt} rock={rock} /> : null}
          {t >= TOSS_START ? <Bread at={breadAt} spin={t < TOSS_END ? toss * 540 : 0} /> : null}
          <Layer opacity={span(t, WALK_START, WALK_START + 0.2)}>
            <LimbShape limb={armNear} color={TUNIC_NEAR} width={3.8} />
            <Hand at={armNear.end} />
          </Layer>
        </Layer>
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
    { at: 0, label: 'うみべ。はらぺこの 子どもが あるいてくる', sound: 'pop' },
    { at: WAVE_IN, label: '波が かいがらを はこんでくる' },
    { at: SURPRISE, label: '子どもが びっくり', sound: 'pop' },
    { at: LIFT_START, label: 'だいじに だきあげて 台へ' },
    { at: SET_START, label: '台に のせると カニが パンを ぽーん' },
    { at: ZOOM_START, label: 'カメラが かいがらに よる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '貝 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
