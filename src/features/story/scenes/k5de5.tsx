/*
 * 工(こう): 大工さんが どうぐで ものを つくる。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 上に のせる 長い いた(大工さんが かついで きて、はしらの上に のせる)
 *   2画目(丨)  … 立っている はしら
 *   3画目(一)  … 下の どだい(2つの 石の上に のった 太い いた)
 *   →  どだい・はしら・いた の 3つが ならぶと、字「工」の形になる(とりの とまりぎ)
 *
 * ながれ
 *   石と どだいと はしらが できる → 大工さんが 長い いたを かついで、ふうふう あるいてくる
 *   → 地面で さびしそうな 小鳥に 気づく(「!」)→ いたを はしらの上に のせる
 *   → かなづちで トントントン(3かい)→ すこし さがって ながめる
 *   → 小鳥が とんできて いたに とまり、大工さんも 小鳥も にっこり
 *   → ほね が ひかって、絵が うすくなり、字「工」が のこる
 *
 * 大工さんは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ の場所は、手の とどく場所から 計算する)。
 *   いたを 上に もつときは、うで を まっすぐ のばして、つまさき で 立つくらい。
 *   くび は みじかく、どう の まんなか の上。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, linear, mix, span, wave, type SceneModule } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '工'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const COAT = '#e8944a'
const COAT_DARK = '#cc7a33'
const COAT_FAR = '#b36a2b'
const PANTS = '#4a5f86'
const PANTS_DARK = '#3d4f72'
const SHOE = '#6b4a36'
const BELT = '#8b5a3a'
const TOWEL = '#ffffff'
const BARK = '#8c5b3c'
const STONE = '#b8b2a7'
const STONE_DARK = '#9a948a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const IRON = '#8d949e'
const IRON_DARK = '#6d747e'
const BIRD = '#ffc94a'
const BIRD_DARK = '#e8a92f'
const BIRD_BELLY = '#fff1b8'
const BEAK = '#f08a3c'
const TWIG = '#7a5230'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK_FROM = 0.5
/** いたを かついだ大工さんが、はしらの 手まえに ついた */
const ARRIVE = 2.7
/** 小鳥に 気づく */
const NOTICE = 2.7
/** いたを はしらの上に のせる */
const SETTLE = 3.4
/** かなづちで トントン(はじまり) */
const NAIL = 4.0
const KNOCK_EVERY = 0.38
const KNOCK_FIRST = NAIL + 0.15
/** 3かい目の トン が おわる */
const NAIL_END = KNOCK_FIRST + KNOCK_EVERY * 3 - 0.05
/** 大工さんが すこし さがって ながめる */
const BACK = 5.4
const BACK_END = 6.1
/** 小鳥が とんでくる */
const FLY = 5.25
const FLY_END = 6.1
const INK = 6.6
const DONE = 9.5
const DURATION = 10.1

/** 地面の たかさ(大工さんの 足もと) */
const FLOOR = 98
/** 大工さんが いたを もつ ばしょ(はしらの 左がわ) */
const STAND_X = 35
/** 大工さんの かた(足もとから 見た 位置)と、うで の ぶぶん の長さ */
const SHOULDER: readonly [number, number] = [0, -41]
const ARM_PART = 13.5
/** いたを かついで あるくとき、いたは 字の位置より 少し 上を とおる(はしらの てっぺん に ぶつからない) */
const CARRY_LIFT = 4
/** いたの 左はしから 手までの きょり(字の 1画目の 上で、手が ふれる 所) */
const HAND_ON_PLANK: readonly [number, number] = [7.5, -66.5]
const HAND_ON_PLANK_FAR: readonly [number, number] = [3.5, -66.5]

type Point = readonly [number, number]
const lerp2 = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

function Ground({ t }: { readonly t: number }) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="12" rx="7" ry="3.2" />
        <ellipse cx="67" cy="10.4" rx="5" ry="3.2" />
        <ellipse cx="96" cy="16" rx="6" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 44, 70, 101].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** どだいを うける 2つの 石 */
function Stones({ t }: { readonly t: number }) {
  const pop = span(t, 0.05, 0.45, backOut)
  return (
    <Layer scale={pop} origin={[55, 96]}>
      {[24, 86].map((x) => (
        <g key={x}>
          <rect x={x - 6.5} y="84" width="13" height="12" rx="4.5" fill={STONE} />
          <path d={`M${x - 3} 86.5 h5`} stroke={STONE_DARK} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </Layer>
  )
}

/** どだい(3画目)と はしら(2画目) */
function Frame({ t }: { readonly t: number }) {
  const sill = span(t, 0.3, 0.75, easeOut)
  const post = span(t, 0.6, 1.0, backOut)
  const settled = span(t, NAIL_END - 0.2, NAIL_END)
  return (
    <>
      <Layer scaleX={sill} origin={[55, 81]}>
        <Bone char={CHAR} n={3} color={BARK} width={5.6} />
      </Layer>
      <Layer scaleY={post} origin={[54, 80]}>
        <Bone char={CHAR} n={2} color={BARK} width={4.8} />
      </Layer>
      {/* くぎの あたま: トントン が おわると、はしらと いたの つぎめ に のこる */}
      <circle cx="53.6" cy="34" r="0.9" fill={IRON_DARK} opacity={settled} />
    </>
  )
}

type Mood = 'effort' | 'surprise' | 'work' | 'happy'

/** かた から ひじ を通って 手 へ。手が とどかない ときは、まっすぐ のばして とどく所まで。 */
function elbowFor(hand: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const dist = Math.hypot(dx, dy) || 1
  const d = Math.min(dist, ARM_PART * 2 - 0.01)
  const ux = dx / dist
  const uy = dy / dist
  const mid: Point = [SHOULDER[0] + (ux * d) / 2, SHOULDER[1] + (uy * d) / 2]
  const height = Math.sqrt(Math.max(ARM_PART ** 2 - (d / 2) ** 2, 0))
  const a: Point = [mid[0] - uy * height, mid[1] + ux * height]
  const b: Point = [mid[0] + uy * height, mid[1] - ux * height]
  // ひじ は 下か うしろ へ まがる
  const pick = Math.abs(a[1] - b[1]) < 0.5 ? (a[0] < b[0] ? a : b) : a[1] > b[1] ? a : b
  return { elbow: pick, hand: [SHOULDER[0] + ux * d, SHOULDER[1] + uy * d] }
}

function Arm({ target, color, hammerAngle }: { readonly target: Point; readonly color: string; readonly hammerAngle?: number }) {
  const { elbow, hand } = elbowFor(target)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
      {hammerAngle !== undefined ? <Hammer x={hand[0]} y={hand[1]} angle={hammerAngle} /> : null}
    </>
  )
}

/** かなづち。angle 0 = え が 上、かお(うつ面)が 右。 */
function Hammer({ x, y, angle }: { readonly x: number; readonly y: number; readonly angle: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x="-1.1" y="-10" width="2.2" height="13" rx="1.1" fill={BARK} />
      <rect x="-4.2" y="-13.2" width="8.4" height="4.4" rx="1.2" fill={IRON} />
      <rect x="1.4" y="-13.2" width="2.8" height="4.4" rx="1" fill={IRON_DARK} />
    </g>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3.2" cy="-48.6" r="1.8" fill={CHEEK} opacity="0.55" />
      {mood === 'effort' ? (
        <>
          <path d="M3.2 -55 L7.4 -53.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="5.4" cy="-52" r="1.1" fill="#2b2b2b" />
          <path d="M4.2 -47.2 h3.6" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'surprise' ? (
        <>
          <path d="M3.4 -56 Q5.4 -57.4 7.6 -56" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="5.4" cy="-52" r="1.5" fill="#2b2b2b" />
          <ellipse cx="6" cy="-47" rx="1.3" ry="1.8" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'work' ? (
        <>
          <path d="M3.4 -54.6 L7.4 -54.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="5.4" cy="-52" r="1.15" fill="#2b2b2b" />
          <path d="M4 -47.8 Q6 -46 8 -48" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'happy' ? (
        <>
          <path d="M3.8 -52 Q5.4 -54.2 7 -52" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M3.8 -48.2 Q6.4 -43.6 9 -48.4 Z" fill={MOUTH} />
        </>
      ) : null}
    </>
  )
}

type CarpenterProps = {
  readonly stride: number
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  /** かなづちを もっているとき の かくど(もっていなければ なし) */
  readonly hammerAngle?: number
  readonly headTilt: number
  readonly flutter: number
}

/** 大工さん(右むき)。足もとが (0, 0)。上へ いくほど y が マイナス。 */
function Carpenter({ stride, mood, nearHand, farHand, hammerAngle, headTilt, flutter }: CarpenterProps) {
  return (
    <>
      {/* むこうの うで: どう の うしろ */}
      <Arm target={farHand} color={COAT_FAR} />
      <Layer rotate={-stride * 22} origin={[0, -26]}>
        <rect x="-3" y="-26" width="6" height="24" rx="3" fill={PANTS_DARK} />
        <ellipse cx="1.8" cy="-1.6" rx="5.2" ry="2.6" fill={SHOE} />
      </Layer>
      <Layer rotate={stride * 22} origin={[0, -26]}>
        <rect x="-3" y="-26" width="6" height="24" rx="3" fill={PANTS} />
        <ellipse cx="1.8" cy="-1.6" rx="5.2" ry="2.6" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま を つなぐ */}
      <rect x="-2.6" y="-47" width="5.2" height="7" rx="2.2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-7.2" y="-44" width="14.4" height="20" rx="6" fill={COAT} />
      <rect x="-7.2" y="-30" width="14.4" height="3" fill={BELT} />
      <rect x="-1" y="-30.4" width="3" height="3.8" rx="0.8" fill="#d9b25a" />
      <path d="M-4.4 -38 v4" stroke={COAT_DARK} strokeWidth="1.4" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm target={nearHand} color={COAT_DARK} hammerAngle={hammerAngle} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -45]}>
        <circle cx="1" cy="-52" r="8.5" fill={SKIN} />
        <circle cx="-1.6" cy="-51" r="1.7" fill={SKIN_SHADE} />
        <path d="M-7.3 -52 C-8 -62.4 4 -63.6 8.6 -57.6 C3 -57 -3 -55.4 -7.3 -52 Z" fill={HAIR} />
        {/* はちまき(白い てぬぐい): うしろで むすんだ はし が ゆれる */}
        <path d="M-7.6 -55.6 Q1 -62.6 9.4 -56" fill="none" stroke={TOWEL} strokeWidth="3" strokeLinecap="round" />
        <path d={`M-7.4 -55.4 l${-4.2 - flutter} 1.6 M-7.4 -55.4 l${-3.4 - flutter} ${3.4 + flutter * 0.4}`} fill="none" stroke={TOWEL} strokeWidth="2" strokeLinecap="round" />
        <circle cx="9.6" cy="-50.4" r="1.1" fill={SKIN_SHADE} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** いたを かついで あるく間の あせ。あたまの うしろへ とぶ。 */
function Sweat({ t }: { readonly t: number }) {
  const show = during(t, WALK_FROM + 0.6, ARRIVE + 0.1, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${-9 - p * 6} ${-60 + p * 9}) rotate(25)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 小鳥に 気づいた しるしの「!」(字ではなく、ぼうと てん) */
function Notice({ t }: { readonly t: number }) {
  const show = during(t, NOTICE + 0.1, SETTLE + 0.1, 0.15)
  if (show <= 0) return null
  const pop = span(t, NOTICE + 0.1, NOTICE + 0.4, backOut)
  return (
    <Layer x={21} y={44} scale={pop} origin={[0, 6]} opacity={show}>
      <rect x="-1.5" y="-8" width="3" height="9" rx="1.5" fill="#f2a23a" />
      <circle cx="0" cy="4" r="1.7" fill="#f2a23a" />
    </Layer>
  )
}

type BirdProps = {
  readonly mood: 'sad' | 'happy'
  readonly flap: number
  readonly peck: number
  readonly beakOpen: boolean
}

/** 小鳥(左むき)。足もとが (0, 0)。くちばし に 小えだ を くわえている。 */
function Bird({ mood, flap, peck, beakOpen }: BirdProps) {
  const droop = mood === 'sad' ? 1 : 0
  const headY = -8.6 + droop * 1 + peck
  return (
    <>
      <path d="M-1.4 -1.6 V0 M1.4 -1.6 V0" stroke={BEAK} strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M4 -5.4 l6 ${-3 + droop * 3.6} l-1.2 5 Z`} fill={BIRD_DARK} />
      <ellipse cx="0" cy="-5" rx="5.3" ry="4.3" fill={BIRD} />
      <ellipse cx="-0.6" cy="-3.6" rx="3.4" ry="2.4" fill={BIRD_BELLY} />
      <Layer rotate={flap} origin={[1.5, -7]}>
        <ellipse cx="1.4" cy="-5.2" rx="3.6" ry="2.2" fill={BIRD_DARK} />
      </Layer>
      <circle cx="-4" cy={headY} r="3.4" fill={BIRD} />
      <path d={`M-6.9 ${headY - 0.2} l${beakOpen ? -3.2 : -2.8} ${beakOpen ? -0.4 : 0.6} l${beakOpen ? 3 : 2.6} ${beakOpen ? 1.6 : 1.2} Z`} fill={BEAK} />
      <path d={`M-9.6 ${headY + 0.2} L-16 ${headY - 2.4} M-13 ${headY - 1.2} l-1.4 -2`} fill="none" stroke={TWIG} strokeWidth="0.8" strokeLinecap="round" />
      {mood === 'sad' ? (
        <>
          <circle cx="-5.2" cy={headY - 0.7} r="0.75" fill="#2b2b2b" />
          <path d={`M-7 ${headY - 3.2} L-4.2 ${headY - 2.2}`} stroke="#2b2b2b" strokeWidth="0.7" strokeLinecap="round" />
        </>
      ) : (
        <path d={`M-6.2 ${headY - 0.6} Q-5 ${headY - 2.2} -3.8 ${headY - 0.6}`} fill="none" stroke="#2b2b2b" strokeWidth="0.8" strokeLinecap="round" />
      )}
    </>
  )
}

/** 小鳥が たのしそうに うたう おんぷ */
function Note({ t }: { readonly t: number }) {
  const show = during(t, FLY_END + 0.1, INK + 0.4, 0.2)
  if (show <= 0) return null
  const rise = (t * 5) % 6
  const sway = wave(t, 1.2) * 1.2
  return (
    <g opacity={show} fill="#f07f9e">
      <path d={`M${68 - sway} ${16 - rise} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
      <ellipse cx={67.2 - sway} cy={16 - rise} rx="1.1" ry="0.8" />
      <ellipse cx={69.8 - sway} cy={15.2 - rise} rx="1.1" ry="0.8" />
    </g>
  )
}

/** トントン の たびに でる、ちいさな ひかり */
function KnockFlash({ t }: { readonly t: number }) {
  const hit = Math.max(
    ...[1, 2, 3].map((k) => during(t, KNOCK_FIRST + KNOCK_EVERY * (k - 1) + KNOCK_EVERY - 0.02, KNOCK_FIRST + KNOCK_EVERY * k + 0.12, 0.04)),
  )
  if (hit <= 0) return null
  return (
    <g opacity={hit}>
      <Star cx={51} cy={35.4} r={4.2 * hit} color="#ffd95a" spin={20} />
      <path d="M46.6 31.4 l-2 -2 M51.8 30.4 v-3 M56 32 l2.2 -1.8" stroke="#ffd95a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </g>
  )
}

function Scene({ t }: { readonly t: number }) {
  const ink = inkTiming(t, INK, DONE, 3)

  // あるく: いたを かついで 左から。ついたら すこし さがって ながめる
  const carryX = mix(t, WALK_FROM, ARRIVE, -16, STAND_X, linear)
  const backX = mix(t, BACK, BACK_END, 0, -16, easeInOut)
  const x = carryX + backX
  const walking = Math.min(span(t, WALK_FROM, WALK_FROM + 0.15), 1 - span(t, ARRIVE - 0.2, ARRIVE)) + Math.min(span(t, BACK, BACK + 0.1), 1 - span(t, BACK_END - 0.15, BACK_END))
  const stride = Math.sin(t * Math.PI * 2 * 0.8) * walking
  const bob = -Math.abs(stride) * 1.2

  // いたの たかさ: かついで あるくときは 少し 上、はしらの上に のせると 字の位置
  const settle = span(t, SETTLE, SETTLE + 0.5, easeOut)
  const plankX = carryX - STAND_X
  const plankY = -CARRY_LIFT * (1 - settle) + (t < NAIL ? bob : 0)

  // かなづち: かまえて(pull)、トン と うつ。3かい
  const cycle = (t - KNOCK_FIRST + KNOCK_EVERY) / KNOCK_EVERY
  const knocking = t >= KNOCK_FIRST - KNOCK_EVERY && t < KNOCK_FIRST + KNOCK_EVERY * 3 - KNOCK_EVERY
  const c = cycle % 1
  const pull = knocking ? (c < 0.7 ? easeOut(c / 0.7) : 1 - easeIn((c - 0.7) / 0.3)) : 0

  // 手の場所(足もとから 見た 場所)。いたを もつ → かなづち → やすめ → ばんざい
  const carryNear: Point = [HAND_ON_PLANK[0], HAND_ON_PLANK[1] + CARRY_LIFT * settle]
  const carryFar: Point = [HAND_ON_PLANK_FAR[0], HAND_ON_PLANK_FAR[1] + CARRY_LIFT * settle]
  const toNail = span(t, NAIL - 0.05, NAIL + 0.2, easeInOut)
  const nailNear: Point = [12 - 5 * pull, -55 - 4 * pull]
  const restNear: Point = [7, -34]
  const cheerNear: Point = [9, -64]
  const toRest = span(t, NAIL_END, BACK, easeInOut)
  const toCheer = span(t, BACK_END - 0.05, BACK_END + 0.4, backOut)
  const nearHand = lerp2(lerp2(lerp2(carryNear, nailNear, toNail), restNear, toRest), cheerNear, toCheer)
  const farHang: Point = [2, -21]
  const farCheer: Point = [-4, -64]
  const farHand = lerp2(lerp2(lerp2(carryFar, farHang, toNail), farHang, toRest), farCheer, toCheer)
  const hasHammer = t >= NAIL - 0.05
  const hammerAngle = hasHammer ? mix(t, NAIL_END, BACK, -30 * pull + 3, 170) + (toCheer > 0 ? (20 - 170) * Math.min(toCheer, 1) : 0) : undefined

  const mood: Mood = t < NOTICE ? 'effort' : t < SETTLE ? 'surprise' : t < FLY ? 'work' : 'happy'
  const headTilt = 9 * during(t, NOTICE, SETTLE + 0.4, 0.2)
  const flutter = Math.abs(wave(t, 0.4)) * walking * 1.6

  // 小鳥: 地面で さびしそう → いたが できて とんでくる → とまって うたう
  const appear = span(t, 0.7, 1.1, backOut)
  const fly = span(t, FLY, FLY_END, easeInOut)
  const birdX = mix(t, FLY, FLY_END, 97, 74)
  const birdY = 94 + (25.5 - 94) * fly - Math.sin(fly * Math.PI) * 16
  const flying = fly > 0 && fly < 1
  const birdMood = t < FLY ? 'sad' : 'happy'
  const peck = t < FLY ? Math.max(0, wave(t, 1.4)) * 0.8 : 0
  const hop = t >= FLY_END ? Math.abs(wave(t, 0.8)) * 0.8 : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stones t={t} />
        <Frame t={t} />
        <Layer x={plankX} y={plankY} opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <Bone char={CHAR} n={1} color={BARK} width={5.2} />
        </Layer>
        <KnockFlash t={t} />
        <Layer opacity={span(t, WALK_FROM, WALK_FROM + 0.2)}>
          <ellipse cx={x} cy={FLOOR - 0.6} rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <g transform={`translate(${x} ${FLOOR + bob})`}>
            <Carpenter stride={stride} mood={mood} nearHand={nearHand} farHand={farHand} hammerAngle={hammerAngle} headTilt={headTilt} flutter={flutter} />
            <Sweat t={t} />
          </g>
        </Layer>
        <Notice t={t} />
        <Layer opacity={appear}>
          <Layer x={birdX} y={birdY - hop} scale={t < FLY ? appear : 1} origin={[0, 0]}>
            <Bird mood={birdMood} flap={flying ? wave(t, 0.14) * 35 : 0} peck={peck} beakOpen={t >= FLY_END && wave(t, 0.8) > 0.2} />
          </Layer>
        </Layer>
        <Note t={t} />
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
    { at: 0, label: '石と どだいと はしらが できる', sound: 'pop' },
    { at: WALK_FROM + 0.3, label: '大工さんが 長い いたを かついで あるいてくる' },
    { at: NOTICE, label: 'さびしそうな 小鳥に 気づく', sound: 'pop' },
    { at: SETTLE, label: 'いたを はしらの上に のせる' },
    { at: NAIL, label: 'かなづちで トントン', sound: 'pop' },
    { at: FLY, label: '小鳥が とんできて、いたに とまる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '工 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
