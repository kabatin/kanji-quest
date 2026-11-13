/*
 * 週(しゅう): 子どもが 道を ぐるりと ひと回り。7つの 石で 7日、ひとまわりで 1週。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … はたけを かこむ さく(左がわ と、上・右・右下のはね)
 *   3画目(一)  … 立て札の 板(7つの まるが ならぶ)
 *   4画目(丨)  … 立て札の ぼう
 *   5画目(一)  … はたけの 小さな 石の しきり
 *   6・7・8画目 … 石で くんだ 井戸(口の かたち)
 *   9画目(丶)  … スタートの 旗の ひらひら
 *   10画目      … 左がわを くねくね おりる 道
 *   11画目      … 下がわを 右へ のびる 道
 *   (道は はたけを ぐるっと 一周して、スタートの 旗に もどってくる)
 *
 * ながれ
 *   はたけと 道が できる → 子どもが 旗の下で「よーい」(わくわく)
 *   → 道を 走りだす。石を ふむたびに 1つずつ 黄色く ひかり、立て札の まるも ひかる
 *   → 半分すぎて つかれてくる(あせ・おもい足どり)→ さいごの 力で ラストスパート
 *   → スタートに もどって 7つめの 石が ひかり、両手を あげて ばんざい(7日で 1週)
 *   → ほね が ひかって、絵が うすくなり、字「週」が のこる
 *
 * 子どもは ほんものの つくり を守る:
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。あし は こし から。
 *   道は 上から 見た 地図のように かき、子どもは いつも 立った まま、行く方を 見る。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '週'

const MEADOW = '#e6f4d2'
const FIELD = '#c5e8a9'
const FIELD_DARK = '#b3dc92'
const SAND = '#ecd29c'
const SAND_DARK = '#d9b978'
const FENCE = '#a9744a'
const WOOD = '#d6a26a'
const WOOD_DARK = '#a9744a'
const STONE = '#b9b4ab'
const STONE_DARK = '#9a958c'
const STONE_LIT = '#ffd24a'
const WATER = '#7cc4f2'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8714a'
const SHIRT_DARK = '#cf5b37'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const FLAG = '#e8534a'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const WALK0 = 1.5
const WALK1 = 6.5
const INK = 7.5
const DONE = 10.5
const DURATION = 11

/* ───────── 道すじ(子どもが 走る 線) ───────── */

type Pt = readonly [number, number]
/** スタートの 旗の下 → 左がわ(10画目) → 下がわ(11画目) → 右がわ → 上がわ → スタートに もどる */
const ROUTE: readonly Pt[] = [
  [19, 30], [18, 42], [15, 50], [13.3, 55], [21.6, 54], [29.5, 50.4], [27.7, 56.9], [25.9, 64.7], [30.1, 72], [23.6, 77.8], [16.8, 83.3],
  [13.8, 85.8], [25.2, 85], [36.7, 86.4], [48, 88.4], [59.3, 90.5], [70.6, 92.7], [82, 94.4], [93.5, 94],
  [99, 92], [101, 84], [101, 50], [101, 22], [98, 14], [92, 11], [60, 11], [30, 11], [22, 13], [19, 18],
  [19, 30],
]
const LENGTHS = ROUTE.slice(1).map(([x, y], i) => Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]))
const TOTAL = LENGTHS.reduce((a, b) => a + b, 0)

/** 道を u(0〜1)まで すすんだ ところの 場所 */
function routeAt(u: number): Pt {
  let rest = Math.min(Math.max(u, 0), 1) * TOTAL
  for (let i = 0; i < LENGTHS.length; i++) {
    if (rest <= LENGTHS[i] || i === LENGTHS.length - 1) {
      const k = LENGTHS[i] === 0 ? 0 : Math.min(rest / LENGTHS[i], 1)
      return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k]
    }
    rest -= LENGTHS[i]
  }
  return ROUTE[0]
}

/** 子どもが 行く方(-1 左 〜 1 右)。目の むきに使う */
function lookAt(u: number): number {
  const [x0] = routeAt(u - 0.012)
  const [x1] = routeAt(u + 0.012)
  return Math.max(-1, Math.min(1, (x1 - x0) * 0.35))
}

/** 走る はやさ: はじめは 元気に、後半は つかれて ゆっくり、さいごは ラストスパート */
function pace(x: number): number {
  const v = x < 0.5 ? 1.15 * x : x < 0.9 ? 0.575 + 0.75 * (x - 0.5) : 0.875 + 1.3 * (x - 0.9)
  return Math.min(v / 1.005, 1)
}

/** 7つの 石(7日)。i 番目の 石は 道の i/7 の ところ。7つめは スタートの 旗の下 */
const STONES: readonly Pt[] = Array.from({ length: 7 }, (_, i) => routeAt((i + 1) / 7))

/* ───────── 風景 ───────── */

function Meadow({ t }: SceneProps) {
  const show = span(t, 0, 0.5, easeOut)
  return (
    <Layer opacity={show}>
      <rect x="1" y="2" width="107" height="102" rx="8" fill={MEADOW} />
      {[10, 58, 96].map((x) => (
        <path key={x} d={`M${x} 101 l1.4 -3.4 l1 3 l1.6 -3.8 l0.8 4.2 Z`} fill="#8bd69a" />
      ))}
    </Layer>
  )
}

/** さく に かこまれた はたけ。中に 立て札・石の しきり・井戸 */
function Field({ t, lit }: SceneProps & { readonly lit: number }) {
  const grow = span(t, 0.15, 0.8, backOut)
  const board = span(t, 0.55, 1.0, backOut)
  const flutter = wave(t, 1.6)
  return (
    <>
      <Layer scale={grow} origin={[65, 48]}>
        <rect x="41" y="15" width="49" height="65" rx="5" fill={FIELD} />
        <path d="M43 26 H88 M43 36 H88 M43 46 H88 M43 56 H88 M43 66 H88 M43 76 H88" stroke={FIELD_DARK} strokeWidth="1" opacity="0.55" />
        <Bone char={CHAR} n={1} color={FENCE} width={2.6} />
        <Bone char={CHAR} n={2} color={FENCE} width={2.6} />
        {/* はたけの 花(ゆれる) */}
        {[[50, 38], [85, 36], [49, 72], [85, 72], [84, 52]].map(([x, y], i) => (
          <g key={i} transform={`rotate(${flutter * 5} ${x} ${y + 2})`}>
            <path d={`M${x} ${y + 3} v-3`} stroke="#4c8f52" strokeWidth="0.9" />
            <circle cx={x} cy={y} r="1.5" fill={i % 2 === 0 ? '#ff8fae' : '#fff3a8'} />
          </g>
        ))}
        {/* 5画目: 石の しきり */}
        <Bone char={CHAR} n={5} color={STONE} width={2.8} />
        {/* 6・7・8画目: 石で くんだ 井戸。中は 水 */}
        <path d="M58.2 55.5 L76 53.3 L75.4 65 L60 67.6 Z" fill={WATER} />
        <path d="M60 58 q3 -1.4 6 0" stroke="#d8effc" strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <Bone char={CHAR} n={6} color={STONE_DARK} width={3.2} />
        <Bone char={CHAR} n={7} color={STONE_DARK} width={3.2} />
        <Bone char={CHAR} n={8} color={STONE_DARK} width={3.2} />
      </Layer>
      {/* 立て札: ぼう(4画目)と 板(3画目)。板に 7つの まる */}
      <Layer scale={board} origin={[67, 42]}>
        <Bone char={CHAR} n={4} color={WOOD_DARK} width={3} />
        <Bone char={CHAR} n={3} color={WOOD} width={8.4} />
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={58 + i * 3.4} cy={31.1} r="1.15" fill={i < lit ? STONE_LIT : '#8a6a46'} />
        ))}
      </Layer>
    </>
  )
}

/** 道。10画目・11画目は その まま 道の くねくね。のこりは 右がわ と 上がわ */
function Road({ t }: SceneProps) {
  const show = span(t, 0.3, 1.1, easeOut)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <g fill="none" stroke={SAND_DARK} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" transform="translate(0 0.9)">
        <path d="M19 30 L18 42 Q16 48 13.25 54.95" />
        <path d="M16.8 83.3 L13.75 85.75" />
        <path d="M93.5 94 Q99 94 101 84 L101 22 Q101 11 90 11 L30 11 Q20 11 19 18 L19 30" />
      </g>
      <g fill="none" stroke={SAND} strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 30 L18 42 Q16 48 13.25 54.95" />
        <path d="M16.8 83.3 L13.75 85.75" />
        <path d="M93.5 94 Q99 94 101 84 L101 22 Q101 11 90 11 L30 11 Q20 11 19 18 L19 30" />
      </g>
      <Bone char={CHAR} n={10} color={SAND_DARK} width={7.6} opacity={0.5} />
      <Bone char={CHAR} n={11} color={SAND_DARK} width={7.6} opacity={0.5} />
      <Bone char={CHAR} n={10} color={SAND} width={6.4} />
      <Bone char={CHAR} n={11} color={SAND} width={6.4} />
    </g>
  )
}

/** 道の 7つの 石。子どもが ふむと 黄色く ひかる */
function Stones({ p }: { readonly p: number }) {
  return (
    <>
      {STONES.map(([x, y], i) => {
        const pop = span(p, (i + 1) / 7, (i + 1) / 7 + 0.05, backOut)
        const ring = span(p, (i + 1) / 7, (i + 1) / 7 + 0.09, easeOut)
        return (
          <g key={i}>
            <ellipse cx={x} cy={y + 0.5} rx="3.3" ry="2.6" fill={pop > 0 ? STONE_LIT : STONE} />
            <ellipse cx={x - 0.6} cy={y - 0.4} rx="1.6" ry="1" fill="#ffffff" opacity={pop > 0 ? 0.55 : 0.3} />
            {ring > 0 && ring < 1 && <circle cx={x} cy={y} r={3 + ring * 6} fill="none" stroke={STONE_LIT} strokeWidth="1.2" opacity={1 - ring} />}
          </g>
        )
      })}
    </>
  )
}

/** スタートの 旗。ぼうに、9画目の ひらひら */
function StartFlag({ t }: SceneProps) {
  const rise = span(t, 0.7, 1.2, backOut)
  const sway = wave(t, 1.2) * 1.4
  return (
    <Layer scaleY={rise} origin={[24.5, 33]}>
      <rect x="23.7" y="9" width="1.6" height="24" rx="0.8" fill={WOOD_DARK} />
      <circle cx="24.5" cy="9" r="1.7" fill="#ffd24a" />
      <g transform={`translate(${-sway * 0.4} 0)`}>
        <Bone char={CHAR} n={9} color={FLAG} width={3.4} />
      </g>
    </Layer>
  )
}

/** 野原の ちょうちょ。ひらひら 横ぎる */
function Butterfly({ t }: SceneProps) {
  const show = during(t, 1.0, WALK1 + 0.6, 0.4)
  if (show <= 0) return null
  const x = 66 + Math.sin(t * 1.3) * 16
  const y = 49 + Math.sin(t * 2.1) * 6
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.34))
  return (
    <g opacity={show} transform={`translate(${x} ${y})`}>
      <ellipse cx="-1.6" cy="-0.4" rx={1.7 * flap} ry="1.6" fill="#f07f9e" />
      <ellipse cx="1.6" cy="-0.4" rx={1.7 * flap} ry="1.6" fill="#f07f9e" />
      <rect x="-0.3" y="-1.4" width="0.6" height="3" rx="0.3" fill="#5a3b2a" />
    </g>
  )
}

/* ───────── 主役の 子ども ───────── */

type Mood = 'eager' | 'tired' | 'happy'

/** うで。side = -1 左 / +1 右。upper・fore は ま下から 外がわへ 何度か(180 で ま上) */
function Arm({ side, upper, fore }: { readonly side: -1 | 1; readonly upper: number; readonly fore: number }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const LEN = 4.2
  const shoulder: Pt = [side * 3.6, -13.2]
  const elbow: Pt = [shoulder[0] + side * Math.sin(rad(upper)) * LEN, shoulder[1] + Math.cos(rad(upper)) * LEN]
  const hand: Pt = [elbow[0] + side * Math.sin(rad(fore)) * LEN, elbow[1] + Math.cos(rad(fore)) * LEN]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={side < 0 ? SHIRT_DARK : SHIRT} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.7" fill={SKIN} />
    </>
  )
}

type ChildProps = {
  /** はしる ひとあし(-1〜1) */
  readonly stride: number
  readonly mood: Mood
  /** 目の むき(-1〜1) */
  readonly look: number
  /** 両手を あげる度合い(0〜1) */
  readonly cheer: number
  /** つかれて うなだれる度合い(0〜1) */
  readonly slump: number
}

/** 足もとが (0,0)。高さ 23 ほど。あし は こし から、うで は かた から ひじ で まがる。 */
function Child({ stride, mood, look, cheer, slump }: ChildProps) {
  const liftL = Math.max(0, stride)
  const liftR = Math.max(0, -stride)
  const run = 1 - cheer
  // はしる うで: ひじを まげて 前後に ふる。つかれると だらんと 下がる。ばんざいで ま上へ
  const pump = stride * 38 * run * (1 - slump * 0.6)
  const armUpL = 25 * run + 150 * cheer
  const armUpR = armUpL
  const foreL = (200 - 70 * slump) * run + 168 * cheer + pump
  const foreR = (200 - 70 * slump) * run + 168 * cheer - pump
  return (
    <>
      {/* あし(こしから。かたほうずつ あがる) */}
      <g transform={`translate(0 ${-liftL * 2.4})`}>
        <rect x="-3.7" y="-7.4" width="3" height="7.2" rx="1.5" fill={PANTS} />
        <ellipse cx="-2.4" cy="0.2" rx="2.5" ry="1.4" fill={SHOE} />
      </g>
      <g transform={`translate(0 ${-liftR * 2.4})`}>
        <rect x="0.7" y="-7.4" width="3" height="7.2" rx="1.5" fill={PANTS} />
        <ellipse cx="2.4" cy="0.2" rx="2.5" ry="1.4" fill={SHOE} />
      </g>
      {/* くび(どう と あたま に かくれて、すきま だけ) */}
      <rect x="-1.2" y="-16.4" width="2.4" height="3.4" rx="1" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-3.4" y="-14.6" width="6.8" height="8.6" rx="3" fill={SHIRT} />
      <path d="M-2.4 -9 h4.8" stroke={SHIRT_DARK} strokeWidth="0.7" strokeLinecap="round" />
      <Arm side={-1} upper={armUpL} fore={foreL} />
      <Arm side={1} upper={armUpR} fore={foreR} />
      {/* あたま */}
      <g transform={`rotate(${slump * 7 * (look >= 0 ? 1 : -1)} 0 -15.6) translate(0 ${slump * 0.8})`}>
        <circle cx="0" cy="-19.8" r="4.5" fill={SKIN} />
        <path d="M-4.6 -19.6 C-5.2 -25.6 5.2 -25.6 4.6 -19.6 C3.4 -22.4 -3 -22.6 -4.6 -19.6 Z" fill={HAIR} />
        <path d="M-0.6 -24.4 q0.8 -2.2 2 -1 q0.4 -1.6 1.2 -0.2" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
        <circle cx="-3" cy="-17.6" r="1" fill="#ff9d9d" opacity="0.55" />
        <circle cx="3" cy="-17.6" r="1" fill="#ff9d9d" opacity="0.55" />
        <Face mood={mood} look={look} />
      </g>
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const ex = look * 0.9
  if (mood === 'happy') {
    return (
      <>
        <path d={`M${-2.8 + ex} -19.6 q1 -1.3 2 0 M${0.8 + ex} -19.6 q1 -1.3 2 0`} fill="none" stroke="#2b2b2b" strokeWidth="0.8" strokeLinecap="round" />
        <path d={`M${-1.5 + ex} -17.4 q1.5 2.6 3 0 Z`} fill="#b9483f" />
      </>
    )
  }
  if (mood === 'tired') {
    return (
      <>
        <path d={`M${-3.2 + ex} -21.4 l2 0.7 M${1.2 + ex} -20.7 l2 -0.7`} stroke={HAIR} strokeWidth="0.7" strokeLinecap="round" />
        <circle cx={-1.8 + ex} cy="-19.6" r="0.75" fill="#2b2b2b" />
        <circle cx={1.8 + ex} cy="-19.6" r="0.75" fill="#2b2b2b" />
        <ellipse cx={ex} cy="-17" rx="1" ry="1.3" fill="#b9483f" />
      </>
    )
  }
  return (
    <>
      <circle cx={-1.8 + ex} cy="-19.8" r="0.8" fill="#2b2b2b" />
      <circle cx={1.8 + ex} cy="-19.8" r="0.8" fill="#2b2b2b" />
      <path d={`M${-1.2 + ex} -17.6 q1.2 1.5 2.4 0`} fill="none" stroke="#b9483f" strokeWidth="0.8" strokeLinecap="round" />
    </>
  )
}

/** つかれて かく あせ。あたまの よこから とぶ */
function Sweat({ t, show }: { readonly t: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.6 Q2.2 0.6 0 2.2 Q-2.2 0.6 0 -2.6 Z" fill={SWEAT} transform={`translate(${6 + p * 3} ${-24 + p * 6})`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 走る ときの 土けむり */
function Dust({ x, y, t, show }: { readonly x: number; readonly y: number; readonly t: number; readonly show: number }) {
  if (show <= 0) return null
  return (
    <g opacity={0.5 * show} fill="#ffffff">
      {[0, 0.5].map((offset) => {
        const p = ((t * 2.4 + offset) % 1) / 1
        return <circle key={offset} cx={x - 3 + p * -2} cy={y + 0.5 - p * 2} r={0.8 + p * 1.2} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  // 走る: 道を ぐるっと 1しゅう。はやさは pace で かわる
  const run = span(t, WALK0, WALK1)
  const p = pace(run)
  const [px, py] = routeAt(p)
  const running = run > 0 && run < 1
  const stride = running ? Math.sin((t - WALK0) * Math.PI * 2 * 2.4) : 0
  const look = running ? lookAt(p) : 0

  // 気もち: わくわく → つかれる → ばんざい
  const mood: Mood = t >= WALK1 - 0.15 ? 'happy' : p > 0.55 ? 'tired' : 'eager'
  const slump = mood === 'tired' ? span(p, 0.55, 0.7) * (1 - span(p, 0.93, 1)) : 0
  const cheer = span(t, WALK1 - 0.1, WALK1 + 0.2, easeOut)

  // 走る ときの はね(つかれると 低く)。ゴールで ぴょんぴょん
  const bounce = running ? Math.abs(stride) * (1.6 - slump * 0.9) : 0
  const afterGoal = t - WALK1
  const jump = afterGoal > 0 && afterGoal < 0.9 ? Math.abs(Math.sin((afterGoal * Math.PI) / 0.45)) * 4.2 : 0
  // はじめ: 旗の下で ぴょこんと 登場 → よーい で 足ぶみ
  const pop = span(t, 0.9, 1.3, backOut)
  const waiting = t < WALK0 ? Math.abs(wave(t, 0.5)) * 0.8 * span(t, 1.3, 1.5) : 0
  const lit = STONES.filter((_, i) => p >= (i + 1) / 7).length
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const SIZE = 0.8

  return (
    <>
      <Layer opacity={ink.picture}>
        <Meadow t={t} />
        <Road t={t} />
        <Field t={t} lit={lit} />
        <StartFlag t={t} />
        <Layer opacity={span(t, 0.5, 1.1)}>
          <Stones p={p} />
        </Layer>
        <Butterfly t={t} />
        {pop > 0 && (
          <>
            <ellipse cx={px} cy={py + 8.6} rx={4.6 * pop} ry="1.3" fill="#000000" opacity="0.14" />
            <Dust x={px} y={py + 8.6} t={t} show={running ? 1 : 0} />
            <g transform={`translate(${px} ${py + 8.2 - bounce - jump - waiting}) scale(${SIZE * pop})`}>
              <Child stride={stride} mood={mood} look={look} cheer={cheer} slump={slump} />
              <Sweat t={t} show={mood === 'tired' ? slump : 0} />
            </g>
          </>
        )}
        {/* ゴールで ぱっと 星 */}
        {afterGoal > 0 && afterGoal < 0.8 && (
          <g opacity={1 - span(t, WALK1 + 0.4, WALK1 + 0.8)}>
            {[[-9, -6], [10, -8], [0, -17]].map(([dx, dy], i) => (
              <Star key={i} cx={19 + dx * (0.4 + span(t, WALK1, WALK1 + 0.4, easeOut) * 0.7) + 3} cy={32 + dy} r={2.2 + i * 0.3} color={['#ffc233', '#ff7a4d', '#ffd95a'][i]} spin={afterGoal * 200 + i * 40} />
            ))}
          </g>
        )}
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
    { at: 0, label: 'はたけと 道が できる', sound: 'pop' },
    { at: 0.9, label: '子どもが 旗の下に でてくる。よーい' },
    { at: WALK0, label: '道を 走りだす。石を ふむと 1つずつ ひかる', sound: 'pop' },
    { at: WALK0 + 2.6, label: '半分すぎて つかれてくる' },
    { at: WALK1 - 0.5, label: 'ラストスパート。7つめの 石で ひとまわり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '週 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
