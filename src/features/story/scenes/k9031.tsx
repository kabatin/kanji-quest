/*
 * 週(しゅう): 子どもが 道を ぐるりと ひと回り。7つの 石で 7日、ひとまわりで 1週。(共通部品 sceneFigures で 書きなおした)
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
 * 道は 上から 見た 地図のように かく。子どもは Person で、道を まっすぐな 区間に わけ、横むきの 区間は run、
 * 手まえ・おくへ むかう 区間は runDepth で 走る(曲がりかどで 体の むきは turnAround)。
 * つかれてくると 足は 低く・うでは 小さく、さいごは ラストスパートで 大きく ふる。
 */
import { backOut, during, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Butterfly, Dust, Flower, LOOKS, mixPose, Person, personRig, posture, run, runDepth, Sweat, turnAround, type Facing, type PersonProps, type Point } from '../sceneFigures'

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
const FLAG = '#e8534a'
const KID_LOOK = { ...LOOKS.boy, top: '#e8714a' } as const

/** くぎり の時間(秒) */
const WALK0 = 1.5
const WALK1 = 6.5
const INK = 7.5
const DONE = 10.5
const DURATION = 11

/** 子の 背の高さ と、道の 点(体の まんなか)から 足もと までの 下がり(元の 絵 と 同じ) */
const KID_H = 20
const FOOT_DY = 8
/** 曲がりかどで 体の むきを かえる 時間(秒) */
const TURN = 0.15

/* ───────── 道すじ(子どもが 走る 線) ───────── */

/** スタートの 旗の下 → 左がわ(10画目) → 下がわ(11画目) → 右がわ → 上がわ → スタートに もどる。石を おく ばしょ(ほぼ 道の 中心) */
const ROUTE: readonly Point[] = [
  [19, 30], [18, 42], [15, 50], [13.3, 55], [21.6, 54], [29.5, 50.4], [27.7, 56.9], [25.9, 64.7], [30.1, 72], [23.6, 77.8], [16.8, 83.3],
  [13.8, 85.8], [25.2, 85], [36.7, 86.4], [48, 88.4], [59.3, 90.5], [70.6, 92.7], [82, 94.4], [93.5, 94],
  [99, 92], [101, 84], [101, 50], [101, 22], [98, 14], [92, 11], [60, 11], [30, 11], [22, 13], [19, 18],
  [19, 30],
]
const LENGTHS = ROUTE.slice(1).map(([x, y], i) => Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]))
const ROUTE_TOTAL = LENGTHS.reduce((a, b) => a + b, 0)

/** 道を u(0〜1)まで すすんだ ところの 場所 */
function routeAt(u: number): Point {
  let rest = Math.min(Math.max(u, 0), 1) * ROUTE_TOTAL
  for (let i = 0; i < LENGTHS.length; i++) {
    if (rest <= LENGTHS[i] || i === LENGTHS.length - 1) {
      const k = LENGTHS[i] === 0 ? 0 : Math.min(rest / LENGTHS[i], 1)
      return [ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k, ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k]
    }
    rest -= LENGTHS[i]
  }
  return ROUTE[0]
}

/** 7つの 石(7日)。i 番目の 石は 道の i/7 の ところ。7つめは スタートの 旗の下 */
const STONES: readonly Point[] = Array.from({ length: 7 }, (_, i) => routeAt((i + 1) / 7))

/** 走る はやさ: はじめは 元気に、後半は つかれて ゆっくり、さいごは ラストスパート */
function pace(x: number): number {
  const v = x < 0.5 ? 1.15 * x : x < 0.9 ? 0.575 + 0.75 * (x - 0.5) : 0.875 + 1.3 * (x - 0.9)
  return Math.min(v / 1.005, 1)
}

/** pace が u に なる 時間の わりあい(pace は ふえる だけ なので 2分法) */
function paceTime(u: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2
    if (pace(mid) < u) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/* ───────── 道を まっすぐな 区間に わける ───────── */

type Leg = {
  /** side = 横むき(run)/ depth = 手まえ・おくへ(runDepth) */
  readonly kind: 'side' | 'depth'
  /** 道の 点(体の まんなか)での はじめ と おわり */
  readonly from: Point
  readonly to: Point
  /** 横の 区間で、x から y を もとめる 折れ線(x の じゅん) */
  readonly line: readonly Point[]
}

const straight = (kind: Leg['kind'], from: Point, to: Point): Leg => ({ kind, from, to, line: [from, to] })

const LEG_LIST: readonly Leg[] = [
  straight('depth', [19, 30], [13.3, 55]),
  { kind: 'side', from: [13.3, 55], to: [29.5, 50.4], line: [[13.3, 55], [21.6, 54], [29.5, 50.4]] },
  straight('depth', [29.5, 50.4], [25.9, 64.7]),
  straight('side', [25.9, 64.7], [30.1, 72]),
  { kind: 'side', from: [30.1, 72], to: [13.8, 85.8], line: [[30.1, 72], [23.6, 77.8], [16.8, 83.3], [13.8, 85.8]] },
  { kind: 'side', from: [13.8, 85.8], to: [99, 92], line: [[13.8, 85.8], [25.2, 85], [36.7, 86.4], [48, 88.4], [59.3, 90.5], [70.6, 92.7], [82, 94.4], [93.5, 94], [99, 92]] },
  straight('depth', [99, 92], [101, 22]),
  { kind: 'side', from: [101, 22], to: [22, 13], line: [[101, 22], [98, 14], [92, 11], [60, 11], [30, 11], [22, 13]] },
  straight('depth', [22, 13], [19, 30]),
]

const chord = (leg: Leg) => Math.hypot(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1])
/** 短い 区間にも ある程度の 時間を あげる */
const weightOf = (leg: Leg) => Math.max(chord(leg), 14)
const WEIGHT_TOTAL = LEG_LIST.reduce((a, leg) => a + weightOf(leg), 0)
const CHORD_TOTAL = LEG_LIST.reduce((a, leg) => a + chord(leg), 0)

type Timed = Leg & {
  readonly start: number
  readonly end: number
  /** この 区間の はじめまでに 走った 道のり(0〜1) */
  readonly before: number
  readonly gait: 'run' | 'tired' | 'sprint'
}

/** 区間ごとの 時間 と はやさ。はやさの かわりめ(pace)に 合わせて 区間の 時間を きめる */
const LEGS: readonly Timed[] = LEG_LIST.map((leg, i) => {
  const w0 = LEG_LIST.slice(0, i).reduce((a, l) => a + weightOf(l), 0) / WEIGHT_TOTAL
  const w1 = w0 + weightOf(leg) / WEIGHT_TOTAL
  const mid = (w0 + w1) / 2
  return {
    ...leg,
    start: WALK0 + paceTime(w0) * (WALK1 - WALK0),
    end: WALK0 + paceTime(w1) * (WALK1 - WALK0),
    before: LEG_LIST.slice(0, i).reduce((a, l) => a + chord(l), 0) / CHORD_TOTAL,
    gait: mid < 0.55 ? 'run' : mid < 0.9 ? 'tired' : 'sprint',
  }
})

/** 道の 折れ線 の上で、x の ときの y(x が 小さい じゅん でも 大きい じゅん でも よい) */
function lineY(line: readonly Point[], x: number): number {
  const k = line.findIndex((p, n) => n > 0 && (x - line[n - 1][0]) * (x - p[0]) <= 0)
  if (k < 1) return line[x <= Math.min(line[0][0], line[line.length - 1][0]) === line[0][0] < line[line.length - 1][0] ? 0 : line.length - 1][1]
  const [x0, y0] = line[k - 1]
  const [x1, y1] = line[k]
  return x1 === x0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

const facingOf = (leg: Leg): Facing => (leg.kind === 'depth' ? (leg.to[1] >= leg.from[1] ? 'front' : 'back') : leg.to[0] >= leg.from[0] ? 'right' : 'left')

/** はやさ ごとの 走りかた(つかれると 足は 低く、うでは 小さく) */
const GAIT_STYLE = {
  run: { footLift: 14, armSwing: 40 },
  tired: { footLift: 6, armSwing: 20 },
  sprint: { footLift: 20, armSwing: 55 },
} as const

type Kid = { readonly place: PersonProps; readonly moving: boolean; readonly progress: number }

/** その しゅんかん の 子の いち・むき・ポーズ と、道を どこまで 走ったか */
function kidAt(t: number): Kid {
  const i = LEGS.reduce((found, leg, k) => (leg.start <= t ? k : found), 0)
  const leg = LEGS[i]
  const prev = i > 0 ? facingOf(LEGS[i - 1]) : null
  const here = facingOf(leg)
  const turning = prev !== null && prev !== here && t < leg.start + TURN
  const base = { build: 'child', height: KID_H } as const
  if (turning) {
    const turn = turnAround(t, leg.start, prev, here, TURN, prev === 'front' && here === 'back' ? 'right' : prev === 'back' && here === 'front' ? 'right' : undefined)
    return { place: { ...base, x: leg.from[0], y: leg.from[1] + FOOT_DY, facing: turn.facing, squash: turn.squash }, moving: false, progress: leg.before }
  }
  const start = prev !== null && prev !== here ? leg.start + TURN : leg.start
  const style = GAIT_STYLE[leg.gait]
  const share = chord(leg) / CHORD_TOTAL
  if (leg.kind === 'depth') {
    const r = runDepth(t, { from: [leg.from[0], leg.from[1] + FOOT_DY], to: [leg.to[0], leg.to[1] + FOOT_DY], start, end: leg.end, height: KID_H, stride: Math.min(12, chord(leg) / 2), ...style })
    const frac = (r.y - FOOT_DY - leg.from[1]) / (leg.to[1] - leg.from[1])
    return { place: r, moving: r.moving, progress: leg.before + share * Math.min(Math.max(frac, 0), 1) }
  }
  const r = run(t, { from: leg.from[0], to: leg.to[0], start, end: leg.end, height: KID_H, stride: Math.min(12, chord(leg) / 2), ...style })
  const frac = (r.x - leg.from[0]) / (leg.to[0] - leg.from[0])
  return { place: { ...r, y: lineY(leg.line, r.x) + FOOT_DY }, moving: r.moving, progress: leg.before + share * Math.min(Math.max(frac, 0), 1) }
}

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
  const sway = wave(t, 1.6) * 5
  return (
    <>
      <Layer scale={grow} origin={[65, 48]}>
        <rect x="41" y="15" width="49" height="65" rx="5" fill={FIELD} />
        <path d="M43 26 H88 M43 36 H88 M43 46 H88 M43 56 H88 M43 66 H88 M43 76 H88" stroke={FIELD_DARK} strokeWidth="1" opacity="0.55" />
        <Bone char={CHAR} n={1} color={FENCE} width={2.6} />
        <Bone char={CHAR} n={2} color={FENCE} width={2.6} />
        {/* はたけの 花(ゆれる) */}
        {[[50, 38], [85, 36], [49, 72], [85, 72], [84, 52]].map(([x, y], i) => (
          <Flower key={i} x={x} y={y + 3} size={0.35} sway={sway} color={i % 2 === 0 ? '#ff8fae' : '#fff3a8'} />
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
          <circle key={i} cx={58 + i * 3.4} cy={31.1} r={1.15} fill={i < lit ? STONE_LIT : '#8a6a46'} />
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

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  const { place, moving, progress: p } = kidAt(t)
  const running = t >= WALK0 && t < WALK1 && moving
  const tired = p > 0.55 && p < 0.93
  const slump = tired ? span(p, 0.55, 0.7) * (1 - span(p, 0.88, 0.93)) : 0
  const done = t >= WALK1
  const cheer = span(t, WALK1 - 0.1, WALK1 + 0.2, easeOut)
  const hop = done ? Math.abs(wave(t - WALK1, 0.6)) * 3.6 : 0
  // はじめ: 旗の下で ぴょこんと 登場 → よーい で 足ぶみ
  const pop = span(t, 0.9, 1.3, backOut)
  const waiting = t < WALK0 ? Math.abs(wave(t, 0.5)) * 0.8 * span(t, 1.3, 1.5) : 0
  const lit = STONES.filter((_, i) => p >= (i + 1) / 7).length

  const pose = cheer > 0 ? mixPose(place.pose ?? {}, posture('banzai', 'front'), cheer) : { ...place.pose, head: (place.pose?.head ?? 0) + slump * 10, torso: (place.pose?.torso ?? 0) + slump * 8 }
  const face = done ? 'joy' : tired ? 'worried' : 'smile'
  const base = { ...place, facing: cheer > 0 ? ('front' as const) : place.facing }
  const head = personRig({ ...base, pose }).world.head
  // できあがりで 字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  const afterGoal = t - WALK1
  const flutter = during(t, 1.0, WALK1 + 0.6, 0.4)

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
        <g opacity={flutter}>
          <Butterfly x={66 + Math.sin(t * 1.3) * 16} y={49 + Math.sin(t * 2.1) * 6} t={t} size={0.5} />
        </g>
        {pop > 0 && (
          <Layer scale={pop} origin={[base.x, base.y]}>
            <Dust x={base.x} y={base.y} p={running ? (t * 2.4) % 1 : 0} reach={2.5} />
            <Person {...base} pose={pose} lift={(place.lift ?? 0) + hop + waiting} look={KID_LOOK} face={face} />
            <Sweat t={t} x={head[0] + 3} y={head[1] - 3} show={slump} dir={1} />
          </Layer>
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
