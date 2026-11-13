/*
 * 入(はいる): さむい 夕ぐれ、あかりの もれる テントの 入り口から、子どもが 中に はいる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … テントの 左がわの ささえの ぼう(てっぺん から 左の 地面まで)
 *   2画目(㇏)  … テントの 右がわの ささえの ぼう。ながい ぼうは てっぺん から つきぬけて、はたが ひらひら
 *   (2本の ぼうが ななめに 立つ「入り口の かたち」。まんなかの 三角が、中に はいる 入り口)
 *
 * ながれ
 *   テントが 立つ → さむそうな 子どもが 右から あるいてくる(息が しろい)
 *   → テントの 入り口から あかりが もれているのに 気づいて、ぱっと うれしい 顔
 *   → 入り口の 前で むきを 変えて、うしろ向きで 中に はいる
 *   → 中で ふりむいて、あたたかい あかりの 中で にっこり 手を ふる
 *   → ほね が ひかって、絵が うすくなり、字「入」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(横・うしろ・正面 とも):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。あし は こし から。
 *   むきを 変えるときは、体を よこから ほそく して うらがえす(かたちを ゆがめない)。
 */
import { backOut, during, easeInOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '入'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#e8715a'
const COAT_DARK = '#c95a46'
const COAT_FAR = '#b44d3b'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const CHEEK_COLD = '#9fc4f0'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const POLE = '#8c5b3c'
const CLOTH = '#f6dca4'
const CLOTH_SHADE = '#e8c485'
const CLOTH_FOLD = '#d9a95f'
const WARM = '#f4b04f'
const WARM_LIGHT = '#ffd978'
const GRASS = '#a9d58f'
const GRASS_FAR = '#b9d6b0'

/** くぎり の時間(秒) */
const WALK0 = 0.9
/** あかりに 気づく */
const SEE = 2.4
/** 入り口の 前に ついて とまる */
const ARRIVE = 3.3
/** よこ向き → うしろ向き */
const TURN1 = 3.5
const ENTER0 = 3.9
const ENTER1 = 5.0
/** うしろ向き → 正面 */
const TURN2 = 5.1
const SMILE = 5.5
const INK = 6.6
const DONE = 9.6
const DURATION = 10.2

/** テントの 地面と、入り口(三角)の かたち */
const BASE_Y = 88.6
const TENT_ORIGIN: readonly [number, number] = [55, BASE_Y]
const DOOR_POINTS = '55,56 29,88.6 81,88.6'
/** 入り口の まんなか(子どもが はいる 場所) */
const DOOR_X = 55
/** 地面の 高さ: 手前(あるくとき)と、入り口の 中 */
const FRONT_Y = 96
const INSIDE_Y = 90.4
const START_SCALE = 0.48
const INSIDE_SCALE = 0.39

const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 空と 地面 ───────── */

function Sky({ t }: SceneProps) {
  const twinkle = (phase: number) => 1 + wave(t, 1.6, phase) * 0.25
  return (
    <>
      <defs>
        <linearGradient id="k5165-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7cdf3" />
          <stop offset="1" stopColor="#f6dcd2" />
        </linearGradient>
      </defs>
      <rect x="-2" y="-2" width="113" height="95" fill="url(#k5165-sky)" />
      {/* 月 */}
      <circle cx="96" cy="13" r="8" fill="#ffffff" opacity="0.35" />
      <circle cx="96" cy="13" r="5.6" fill="#fff5c4" />
      <circle cx="98" cy="11.6" r="1.2" fill="#f1e3a0" />
      <circle cx="94.4" cy="15" r="0.9" fill="#f1e3a0" />
      {/* 星(ちかちか) */}
      <Star cx={12} cy={11} r={2.6 * twinkle(0)} color="#fffbe0" />
      <Star cx={74} cy={8} r={2.2 * twinkle(0.5)} color="#fffbe0" />
      <Star cx={101} cy={42} r={2 * twinkle(1)} color="#fffbe0" />
      <Star cx={12} cy={38} r={2.1 * twinkle(0.8)} color="#fffbe0" />
      <Star cx={54} cy={9} r={1.7 * twinkle(0.3)} color="#fffbe0" />
      {/* とおくの おか と 地面 */}
      <path d="M-4 92 Q20 72 46 86 Q74 68 113 90 V96 H-4 Z" fill={GRASS_FAR} />
      <path d="M-2 90 Q55 86.4 111 90 V111 H-2 Z" fill={GRASS} />
      {[6, 22, 90, 103].map((x) => (
        <path key={x} d={`M${x} 100 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill="#7fbf6a" />
      ))}
    </>
  )
}

/* ───────── テント ───────── */

/** 左の ぼう(1画目)の 点を 下から 上へ、右の ぼう(2画目)の 点を 上から 下へ つないだ、布の ふち */
const CLOTH_POINTS =
  '14.5,88.6 21.6,83.9 28.2,79.1 34.4,73.9 40.3,68.2 45.8,62.2 50.9,55.9 54.8,48.8 58.3,51.9 66,62.4 74.7,72.1 84.2,81 94.8,88.6'

function Flag({ t }: SceneProps) {
  // 長い ぼうの さき(2画目の 書きはじめ)で ひらひら
  const flutter = wave(t, 0.7) * 1.6
  return (
    <path d={`M37.6 19.6 Q43 ${16.4 + flutter} 49.6 ${18.4 + flutter * 1.4} Q44 ${21.6 + flutter} 40.6 25 Z`} fill="#e8534a" />
  )
}

function Tent({ t }: SceneProps) {
  // ぼう が 立ち、布が ぴん と はられる
  const raise = span(t, 0, 0.8, backOut)
  const flicker = 1 + wave(t, 0.37) * 0.06 + wave(t, 0.23) * 0.04
  return (
    <>
      {/* あかりが 地面に もれる */}
      <ellipse cx="55" cy="93.6" rx={24 * span(t, 0.5, 1.0)} ry="3.8" fill={WARM_LIGHT} opacity={0.5 * flicker} />
      <Layer scaleX={0.6 + 0.4 * raise} scaleY={raise} origin={TENT_ORIGIN}>
        <polygon points={CLOTH_POINTS} fill={CLOTH} stroke={CLOTH} strokeWidth="2" strokeLinejoin="round" />
        {/* 右がわは かげ */}
        <polygon points="57.5,52.5 94.8,88.6 81,88.6 55,56" fill={CLOTH_SHADE} />
        {/* 入り口: 中は あたたかい あかり */}
        <polygon points={DOOR_POINTS} fill={WARM} stroke={WARM} strokeWidth="0.6" strokeLinejoin="round" />
        {/* 中の ぬくもり(入り口の 三角を ひとまわり ちいさく した 明るい面。ゆらゆら) */}
        <polygon points="55,66 38,88.6 72,88.6" fill={WARM_LIGHT} opacity={0.55 + (flicker - 1) * 2} />
        {/* 床の ざぶとん と ランタン */}
        <rect x="38" y="86" width="16" height="2.6" rx="1.3" fill="#c0763c" />
        <path d="M66.2 82.4 Q68.2 79.4 70.2 82.4" fill="none" stroke="#7a4a2a" strokeWidth="0.8" />
        <rect x="65.2" y="82" width="6" height="6.4" rx="1.6" fill="#b9722f" />
        <rect x="66.4" y="83.2" width="3.6" height="3.4" rx="1" fill="#fff6c0" />
        {/* 入り口の ふち の 布(めくれた ところ) */}
        <polygon points="55,56 29,88.6 33.5,88.6 55,61" fill={CLOTH_FOLD} />
        <polygon points="55,56 81,88.6 76.5,88.6 55,61" fill={CLOTH_FOLD} />
        {/* ささえの ぼう */}
        <Bone char={CHAR} n={1} color={POLE} width={3.8} />
        <Bone char={CHAR} n={2} color={POLE} width={3.8} />
        <Flag t={t} />
      </Layer>
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'cold' | 'glad'

/** かた から出て ひじ で まがる うで。upper・fore は ま下から の角度(+ は 右(x が ふえる ほう))。 */
function Limb({ from, upper, fore, color }: { readonly from: readonly [number, number]; readonly upper: number; readonly fore: number; readonly color: string }) {
  const LEN = 12
  const ex = from[0] + Math.sin(rad(upper)) * LEN
  const ey = from[1] + Math.cos(rad(upper)) * LEN
  const hx = ex + Math.sin(rad(fore)) * LEN
  const hy = ey + Math.cos(rad(fore)) * LEN
  return (
    <>
      <path d={`M${from[0]} ${from[1]} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="3.3" fill={SKIN} />
    </>
  )
}

/** 足もと(0,0)が 地面。からだ は 上(マイナス)へ。せの高さ 74 */
type SideProps = { readonly step: number; readonly mood: Mood; readonly nearUpper: number; readonly nearFore: number; readonly farUpper: number; readonly farFore: number; readonly headTilt: number; readonly puff: number }

function SideKid({ step, mood, nearUpper, nearFore, farUpper, farFore, headTilt, puff }: SideProps) {
  return (
    <>
      <Limb from={[0, -49]} upper={farUpper} fore={farFore} color={COAT_FAR} />
      <Layer rotate={step * 20} origin={[0, -28]}>
        <rect x="-3" y="-29" width="6" height="27" rx="3" fill={PANTS_DARK} />
        <ellipse cx="-2" cy="-1.4" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[0, -28]}>
        <rect x="-3" y="-29" width="6" height="27" rx="3" fill={PANTS} />
        <ellipse cx="-2" cy="-1.4" rx="5" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の 上 */}
      <rect x="-2.6" y="-56" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="-6.5" y="-53" width="13" height="28" rx="6" fill={COAT} />
      <path d="M-4.5 -29 h9" stroke={COAT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <Limb from={[0, -49]} upper={nearUpper} fore={nearFore} color={COAT_DARK} />
      <Layer rotate={headTilt} origin={[0, -55]}>
        <circle cx="-1.5" cy="-64" r="9.2" fill={SKIN} />
        <path d="M-10.2 -65.6 C-10.3 -74.8 0.1 -77.4 6.1 -71.6 C8.5 -68.4 8.5 -62.6 6.5 -58.4 C5.9 -64.2 1.7 -68.4 -5.1 -68 C-7.3 -67.8 -9.1 -66.8 -10.2 -65.6 Z" fill={HAIR} />
        <circle cx="-5.2" cy="-59.8" r="2.1" fill={mood === 'cold' ? CHEEK_COLD : CHEEK} opacity="0.65" />
        {mood === 'cold' ? (
          <>
            <path d="M-8.1 -64.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="-6.3" cy="-63" r="1.15" fill={EYE} />
            <path d="M-8.6 -58.4 q1.1 -1.2 2.2 0 q1.1 1.2 2.2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M-7.9 -63.7 Q-6.3 -62 -4.7 -63.7" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
            <path d="M-8.7 -59.2 Q-6.9 -57.1 -4.9 -58.7" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}
      </Layer>
      {/* 白い息(さむい ときだけ)。口の まえへ ふわっと */}
      {puff > 0 && puff < 1 ? (
        <g opacity={1 - puff}>
          <ellipse cx={-13 - puff * 9} cy={-58 - puff * 5} rx={3 + puff * 3} ry={2 + puff * 2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
          <ellipse cx={-10 - puff * 5} cy={-57 - puff * 2} rx={1.6 + puff} ry={1.2 + puff * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
        </g>
      ) : null}
    </>
  )
}

/** 正面・うしろ向き の あし・どう・くび。lift は 足が あがる高さ(左・右) */
function FrontBody({ lift }: { readonly lift: readonly [number, number] }) {
  return (
    <>
      <Layer y={-lift[0]}>
        <rect x="-8.2" y="-29" width="6.4" height="27" rx="3.2" fill={PANTS} />
        <ellipse cx="-5.8" cy="-1.4" rx="4.8" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer y={-lift[1]}>
        <rect x="1.8" y="-29" width="6.4" height="27" rx="3.2" fill={PANTS_DARK} />
        <ellipse cx="5.8" cy="-1.4" rx="4.8" ry="2.6" fill={SHOE} />
      </Layer>
      <rect x="-2.6" y="-56" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="-8.5" y="-53" width="17" height="28" rx="7" fill={COAT} />
      <path d="M-5.5 -29 h11" stroke={COAT_DARK} strokeWidth="1.4" strokeLinecap="round" />
    </>
  )
}

function BackKid({ lift }: { readonly lift: readonly [number, number] }) {
  return (
    <>
      <FrontBody lift={lift} />
      <Limb from={[-8, -49]} upper={-7} fore={-3} color={COAT_DARK} />
      <Limb from={[8, -49]} upper={7} fore={3} color={COAT_DARK} />
      {/* 耳 と あたま(かみ だけ 見える) */}
      <circle cx="-9.4" cy="-62.5" r="1.9" fill={SKIN} />
      <circle cx="9.4" cy="-62.5" r="1.9" fill={SKIN} />
      <circle cx="0" cy="-64" r="9.6" fill={HAIR} />
      <path d="M-4 -70.6 Q0 -73 4.4 -70.2" fill="none" stroke="#7a553e" strokeWidth="1.3" strokeLinecap="round" />
    </>
  )
}

function FrontKid({ wavePhase, waving }: { readonly wavePhase: number; readonly waving: number }) {
  // 右手(画面の 右)を あげて ふる。ひじ で まがる
  const upperRight = 40 + 18 * waving
  const foreRight = 170 - 24 * waving * wavePhase
  return (
    <>
      <FrontBody lift={[0, 0]} />
      <Limb from={[-8, -49]} upper={-9} fore={-4} color={COAT_DARK} />
      <Limb from={[8, -49]} upper={upperRight * waving + 7 * (1 - waving)} fore={waving > 0 ? foreRight : 3} color={COAT_DARK} />
      <circle cx="0" cy="-64" r="9.4" fill={SKIN} />
      <path d="M-9.6 -64 C-10.6 -75.4 10.6 -75.6 9.6 -64 C6.4 -68.8 -4.8 -68.8 -9.6 -64 Z" fill={HAIR} />
      <circle cx="-6.4" cy="-59.6" r="2.1" fill={CHEEK} opacity="0.65" />
      <circle cx="6.4" cy="-59.6" r="2.1" fill={CHEEK} opacity="0.65" />
      <path d="M-5.2 -63.2 Q-3.6 -65.2 -2 -63.2" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
      <path d="M2 -63.2 Q3.6 -65.2 5.2 -63.2" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
      <path d="M-2.8 -59.4 Q0 -55.2 2.8 -59.4 Z" fill={MOUTH} />
    </>
  )
}

type View = { readonly kind: 'side' | 'back' | 'front'; readonly sx: number }

/** むきを 変えるとき、体を ほそく して うらがえす */
function viewAt(t: number): View {
  const half = 0.2
  if (t < TURN1) return { kind: 'side', sx: 1 }
  if (t < TURN1 + half) return { kind: 'side', sx: 1 - 0.9 * span(t, TURN1, TURN1 + half) }
  if (t < TURN1 + 2 * half) return { kind: 'back', sx: 0.1 + 0.9 * span(t, TURN1 + half, TURN1 + 2 * half) }
  if (t < TURN2) return { kind: 'back', sx: 1 }
  if (t < TURN2 + half) return { kind: 'back', sx: 1 - 0.9 * span(t, TURN2, TURN2 + half) }
  return { kind: 'front', sx: 0.1 + 0.9 * span(t, TURN2 + half, TURN2 + 2 * half) }
}

/** 子どもの いる場所: 右から あるいて 入り口の 前 → うしろ向きで 中へ */
function Kid({ t }: SceneProps) {
  if (t < WALK0 - 0.3) return null
  const view = viewAt(t)
  const cold = t < SEE
  const mood: Mood = cold ? 'cold' : 'glad'
  const walkAmp = 1 - span(t, ARRIVE - 0.45, ARRIVE)
  const stride = t < WALK0 || t >= ARRIVE ? 0 : Math.sin((t - WALK0) * Math.PI * 2 * 1.9) * walkAmp
  const enterStride = t < ENTER0 || t >= ENTER1 ? 0 : Math.sin((t - ENTER0) * Math.PI * 2 * 1.7) * (1 - span(t, ENTER1 - 0.3, ENTER1))
  const x = mix(t, WALK0, ARRIVE, 128, DOOR_X, (u) => u)
  const enter = span(t, ENTER0, ENTER1, easeInOut)
  const scale = START_SCALE + (INSIDE_SCALE - START_SCALE) * enter
  // きづいた しゅんかん、ちょん と はねる
  const hop = Math.sin(span(t, SEE, SEE + 0.3) * Math.PI) * 3
  // さむい あいだは ぶるぶる ふるえる
  const shiver = cold && t >= WALK0 ? Math.sin(t * 38) * 0.8 : 0
  const y = FRONT_Y + (INSIDE_Y - FRONT_Y) * enter - hop

  // うで: さむい あいだは 手を むねの まえで ぎゅっと、あたたまったら ふって あるく
  const warm = span(t, SEE, SEE + 0.5)
  const nearUpper = -8 * (1 - warm) + -stride * 26 * warm
  const nearFore = -125 * (1 - warm) + (-stride * 26 - 14) * warm
  const farUpper = -4 * (1 - warm) + stride * 26 * warm
  const farFore = -110 * (1 - warm) + (stride * 26 - 14) * warm
  const puff = cold && t > WALK0 + 0.2 && t < SEE ? ((t + 0.3) % 1.1) / 1.1 : 0
  const lift: readonly [number, number] = [Math.max(0, enterStride) * 2.4, Math.max(0, -enterStride) * 2.4]
  const waving = span(t, SMILE, SMILE + 0.35)
  const wavePhase = wave(t, 0.6)

  return (
    <>
      <ellipse cx={x} cy={y + 0.6} rx={9 * scale * 1.6} ry={2.2 * scale * 1.6} fill="#000000" opacity="0.14" />
      <Layer x={x + shiver * scale} y={y} scaleX={scale * view.sx} scaleY={scale} origin={[0, 0]}>
        {view.kind === 'side' ? (
          <SideKid step={stride} mood={mood} nearUpper={nearUpper} nearFore={nearFore} farUpper={farUpper} farFore={farFore} headTilt={cold ? 4 : -4} puff={puff} />
        ) : view.kind === 'back' ? (
          <BackKid lift={lift} />
        ) : (
          <FrontKid wavePhase={wavePhase} waving={waving} />
        )}
      </Layer>
      <Surprise t={t} x={x} y={y} scale={scale} />
    </>
  )
}

/** 「!」: あかりに 気づいた しゅんかん、あたまの 上に ぽん と出る */
function Surprise({ t, x, y, scale }: SceneProps & { readonly x: number; readonly y: number; readonly scale: number }) {
  const show = during(t, SEE + 0.05, SEE + 0.85, 0.15)
  if (show <= 0) return null
  const pop = span(t, SEE + 0.05, SEE + 0.3, backOut)
  return (
    <Layer x={x - 3 * scale} y={y - 80 * scale} scale={Math.max(0, pop)} origin={[0, 0]} opacity={show}>
      <rect x="-1.3" y="-6" width="2.6" height="5.4" rx="1.3" fill="#ff8a3c" />
      <circle cx="0" cy="1.4" r="1.4" fill="#ff8a3c" />
    </Layer>
  )
}

/** はいった あと、入り口から ぽかぽか ほし が のぼる */
function Warmth({ t }: SceneProps) {
  const show = during(t, SMILE, INK + 0.3, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.55, 1.1].map((offset, i) => {
        const p = ((t - SMILE + offset) % 1.6) / 1.6
        const sx = 48 + i * 7.5 + Math.sin(p * 6 + i) * 1.6
        return <Star key={offset} cx={sx} cy={80 - p * 26} r={2.2 * Math.sin(p * Math.PI)} color={i === 1 ? '#ffffff' : '#ffc233'} spin={p * 120} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Tent t={t} />
        <Kid t={t} />
        <Warmth t={t} />
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
    { at: 0, label: '夕ぐれ。テントが 立つ', sound: 'pop' },
    { at: WALK0, label: 'さむそうな 子どもが あるいてくる' },
    { at: SEE, label: 'あかりに 気づいて うれしい顔', sound: 'pop' },
    { at: TURN1, label: '入り口の 前で うしろを むく' },
    { at: ENTER0, label: '中に はいる' },
    { at: SMILE, label: 'ふりむいて にっこり 手を ふる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '入 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
