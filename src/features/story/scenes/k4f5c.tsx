/*
 * 作(つくる): 人が 手を うごかして ものを つくる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 人の あたまの てっぺん から せなか がわ へ おりる ライン(人の かたち)
 *   2画目(丨)  … 人の どう と あし
 *   3画目(ノ)  … 人が てで ささえる、ななめの 長い いた(さいごに たてかける)
 *   4画目(一)  … たなの いちばん上の いた
 *   5画目(丨)  … たなの はしら
 *   6・7画目   … はしら から 右へ のびる、2だんの たなの いた
 *
 * ながれ
 *   おもちゃが ちらかって こまっている子(ふう…) → 「たなが あれば!」と ひらめく
 *   → かなづちを もって、はしら・うえの いた・たな1・たな2 を とんとん うちつける
 *   → うしろへ さがって おもちゃが たなへ もどる のを みて うれしい!
 *   → いたを ひょいと たてかけると、ほね が ひかって 絵が うすくなり 字「作」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の 行き先から ひじ の 場所を 計算する)。
 *   とおい たな は、足を ふみだして、ひくい たな は ひざを まげて うつ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '作'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a43c'
const TUNIC_DARK = '#d98d27'
const TUNIC_FAR = '#bb7820'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const WOOD = '#d29a5c'
const WOOD_DARK = '#a8723c'
const IRON = '#8a96a6'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const IDEA = 2.2
const BUILD_END = 6.6
const BACK_AT = 7.5
const CHEER = 7.85
const INK = 9.2
const DONE = 11.8
const DURATION = 12

type V = readonly [number, number]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpV = (a: V, b: V, k: number): V => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/** 人の かた(うでの つけね)。ひじ までの 長さ = 手くびまでの 長さ */
const SHOULDER_X = 28.6
const SHOULDER_Y = 40
const ARM_PART = 12.5

/** 足もとの 地面 */
const GROUND_Y = 94

/** 数字の おれせん: [時間, 値] を なめらかに つなぐ */
function track(t: number, keys: readonly (readonly [number, number])[]): number {
  let value = keys[0][1]
  for (let i = 1; i < keys.length; i += 1) {
    const [at, to] = keys[i]
    const [from, prev] = keys[i - 1]
    if (t >= at) value = to
    else {
      value = mix(t, from, at, prev, to, easeInOut)
      break
    }
  }
  return value
}

/** 人の あるく場所(足の位置の ずれ)。たなを つくる所に よって 近づく */
const WALK_KEYS: readonly (readonly [number, number])[] = [
  [0, 0], [IDEA + 0.2, 0], [3.0, 12], [3.9, 12], [4.2, 15], [4.9, 15], [5.2, 17], [5.7, 17], [5.9, 18], [BUILD_END, 18], [BACK_AT, 0],
]
/** ひくい たなを うつ とき は ひざを まげる(0 = 立つ / 1 = しゃがむ) */
const CROUCH_KEYS: readonly (readonly [number, number])[] = [[0, 0], [5.5, 0], [5.9, 1], [6.4, 1], [6.9, 0]]

/* ───────── たな を つくる じゅんばん ───────── */

type Stage = {
  readonly from: number
  readonly hits: number
  /** かなづち を うちおろした ときの 手の 場所(絵の 座標) */
  readonly hand: V
  /** ふりかぶった ときの 手の ずれ */
  readonly cock: V
}
const HIT_PERIOD = 0.4
const STAGES: readonly Stage[] = [
  { from: 3.0, hits: 2, hand: [59, 43], cock: [-3, -9] },
  { from: 4.1, hits: 2, hand: [57, 31], cock: [-3, -7] },
  { from: 5.0, hits: 2, hand: [60, 52], cock: [-3, -9] },
  { from: 5.8, hits: 2, hand: [60, 70], cock: [-3, -9] },
]

/** うつ 動き: 1 = ふりかぶる / 0 = うちおろす。うって いない時は null */
function raise(t: number, stage: Stage): number | null {
  const k = (t - stage.from) / HIT_PERIOD
  if (k < 0 || k >= stage.hits) return null
  const p = k % 1
  return p < 0.55 ? 1 - easeIn(p / 0.55) : easeOut((p - 0.55) / 0.45)
}

/* ───────── うで(かた → ひじ → 手) ───────── */

type Joints = { readonly elbow: V; readonly hand: V }

/** 手の いきさき から、ひじ の場所を 計算する。ひじ は 下(うしろ)がわ に まがる */
function joints(shoulder: V, target: V): Joints {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = ARM_PART * 2 * 0.985
  const k = d > reach ? reach / d : 1
  const hand: V = [shoulder[0] + dx * k, shoulder[1] + dy * k]
  const dist = Math.max(d * k, 1)
  const half = dist / 2
  const h = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - half * half))
  const ux = (hand[0] - shoulder[0]) / dist
  const uy = (hand[1] - shoulder[1]) / dist
  return { elbow: [shoulder[0] + ux * half - uy * h, shoulder[1] + uy * half + ux * h], hand }
}

function Hammer({ from, to, scale }: { readonly from: V; readonly to: V; readonly scale: number }) {
  if (scale <= 0) return null
  // 手くび の むき(ひじ → 手)に そって、えが のびる
  const angle = (Math.atan2(-(to[0] - from[0]), to[1] - from[1]) * 180) / Math.PI
  return (
    <g transform={`translate(${to[0]} ${to[1]}) rotate(${angle}) scale(${scale})`}>
      <rect x="-1.1" y="-1" width="2.2" height="9" rx="1" fill={WOOD_DARK} />
      <rect x="-3.4" y="5.6" width="6.8" height="3.6" rx="0.9" fill={IRON} />
      <rect x="-3.4" y="5.6" width="6.8" height="1.2" rx="0.6" fill="#b5bfcc" />
    </g>
  )
}

function Arm({ shoulder, target, color, tool }: { readonly shoulder: V; readonly target: V; readonly color: string; readonly tool?: number }) {
  const { elbow, hand } = joints(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.5" fill={SKIN} />
      {tool !== undefined && <Hammer from={elbow} to={hand} scale={tool} />}
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'worried' | 'focus' | 'happy'

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  readonly drop: number
  readonly crouch: number
  readonly nearTarget: V
  readonly farTarget: V
  readonly tool: number
  readonly headTilt: number
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="32.4" cy="29.4" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M32.2 25.8 Q33.9 23.8 35.6 25.8" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
          <path d="M33.6 29 Q36 33.4 38 28.8 Z" fill="#b9483f" stroke="#b9483f" strokeWidth="0.8" strokeLinejoin="round" />
        </>
      ) : mood === 'worried' ? (
        <>
          <path d="M31.6 24.2 L35.4 22.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="34" cy="26" r="1.15" fill="#2b2b2b" />
          <path d="M34 31.2 Q35.6 29.8 37.4 31.2" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M31.6 22.8 L35.2 23" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="34" cy="25.8" r="1.2" fill="#2b2b2b" />
          <path d="M34.4 30.2 h3" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

function Person({ step, mood, drop, crouch, nearTarget, farTarget, tool, headTilt }: PersonProps) {
  const shoulder: V = [SHOULDER_X, SHOULDER_Y + drop]
  const legScale = 1 - 0.5 * crouch
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <Arm shoulder={[SHOULDER_X - 1.4, SHOULDER_Y + drop]} target={farTarget} color={TUNIC_FAR} />
      {/* あし: こし を じく に ふる。しゃがむと ちぢむ */}
      <Layer scaleY={legScale} origin={[28.4, GROUND_Y]}>
        <Layer rotate={-step * 17} origin={[27, 68]}>
          <rect x="24" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
          <ellipse cx="28.4" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
        <Layer rotate={step * 17} origin={[29, 68]}>
          <rect x="29" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
          <ellipse cx="33.4" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
        </Layer>
      </Layer>
      <Layer y={drop}>
        {/* くび: みじかく、どう と あたま の間 */}
        <rect x="25.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
        <rect x="21.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
        <path d="M23.4 63 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
        <Layer rotate={headTilt} origin={[28.4, 34]}>
          <circle cx="29.6" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M20.6 25.4 C19.6 14.6 28 11 34 13.6 C37.4 15 38.4 18.6 38 21 C34.4 18.8 29.6 18.6 26.2 21.4 C24 23.2 23.4 26 23.2 29.6 C21.8 29.2 20.8 27.6 20.6 25.4 Z" fill={HAIR} />
          <path d="M31 13.8 Q31.2 10.4 33.6 12.2" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
          <Face mood={mood} />
        </Layer>
      </Layer>
      {/* てまえの うで: かなづち を もつ */}
      <Arm shoulder={shoulder} target={nearTarget} color={TUNIC_DARK} tool={tool} />
    </>
  )
}

/* ───────── ばしょ ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="46" cy="10" rx="7" ry="3.2" />
        <ellipse cx="51" cy="8.4" rx="5" ry="3.2" />
        <ellipse cx="100" cy="12" rx="6" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 木の いた。かげ を 1だん したに のせる */
function Board({ n, width, from = 0, to = 1 }: { readonly n: number; readonly width: number; readonly from?: number; readonly to?: number }) {
  return (
    <>
      <g transform="translate(0 1.5)">
        <Bone char={CHAR} n={n} color={WOOD_DARK} width={width} from={from} to={to} />
      </g>
      <Bone char={CHAR} n={n} color={WOOD} width={width} from={from} to={to} />
    </>
  )
}

function Shelf({ t }: SceneProps) {
  const post = span(t, 3.1, 3.55, easeOut)
  const top = span(t, 4.2, 4.65, easeOut)
  const low1 = span(t, 5.1, 5.5, easeOut)
  const low2 = span(t, 5.9, 6.3, easeOut)
  return (
    <>
      {/* はしら: 下から のびる */}
      <Board n={5} width={6.4} from={1 - post} />
      <Board n={4} width={5.8} to={top} />
      <Board n={6} width={5.2} to={low1} />
      <Board n={7} width={5.2} to={low2} />
    </>
  )
}

/** おもちゃ(まんなか が 0,0) */
type ToyKind = 'ball' | 'block' | 'duck'
function ToyShape({ kind }: { readonly kind: ToyKind }) {
  if (kind === 'ball') {
    return (
      <>
        <circle r="3.3" fill="#e8534a" />
        <path d="M-3.2 -0.4 Q0 1.6 3.2 -0.4" fill="none" stroke="#ffffff" strokeWidth="0.9" />
        <circle cx="-1.1" cy="-1.5" r="0.8" fill="#ffffff" opacity="0.7" />
      </>
    )
  }
  if (kind === 'block') {
    return (
      <>
        <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#4f9be0" />
        <rect x="-3" y="-3" width="6" height="1.8" rx="0.9" fill="#8cc4f2" />
        <circle cx="0" cy="0.8" r="1" fill="#ffffff" />
      </>
    )
  }
  return (
    <>
      <ellipse cx="0" cy="0.6" rx="3.2" ry="2.6" fill="#ffd24a" />
      <circle cx="2.2" cy="-2" r="1.9" fill="#ffd24a" />
      <path d="M3.8 -2.2 l2.4 0.6 l-2.4 1 Z" fill="#f2862f" />
      <circle cx="2.8" cy="-2.6" r="0.45" fill="#2b2b2b" />
    </>
  )
}

type ToyPlan = { readonly kind: ToyKind; readonly start: V; readonly end: V; readonly at: number; readonly spin: number }
const TOYS: readonly ToyPlan[] = [
  { kind: 'ball', start: [58, 94.6], end: [86, 64], at: 7.4, spin: 360 },
  { kind: 'block', start: [78, 94], end: [82, 44.5], at: 7.7, spin: 180 },
  { kind: 'duck', start: [92, 94.2], end: [84, 22.6], at: 8.0, spin: 0 },
]
const HOP_TIME = 0.75

function Toy({ t, plan }: { readonly t: number; readonly plan: ToyPlan }) {
  const p = span(t, plan.at, plan.at + HOP_TIME)
  const x = lerp(plan.start[0], plan.end[0], easeInOut(p))
  const y = lerp(plan.start[1], plan.end[1], easeOut(p)) - Math.sin(p * Math.PI) * 14
  const land = Math.sin(span(t, plan.at + HOP_TIME, plan.at + HOP_TIME + 0.3) * Math.PI) * 0.22
  return (
    <Layer x={x} y={y} rotate={p * plan.spin} scaleX={1.4 * (1 + land)} scaleY={1.4 * (1 - land)}>
      <ToyShape kind={plan.kind} />
    </Layer>
  )
}

/** ひらめきの ふきだし: 子どもの あたまから ぽこぽこ。なかに たなの え */
function Bubble({ t }: SceneProps) {
  const show = during(t, 0.9, IDEA + 0.1, 0.25)
  if (show <= 0) return null
  const pop = span(t, 0.9, 1.4, backOut)
  return (
    <g opacity={show}>
      <circle cx="46.5" cy="19" r="1.2" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="52" cy="16.4" r="1.8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="58" cy="13.6" r="2.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <Layer scale={Math.max(pop, 0)} origin={[80, 13]}>
        <ellipse cx="80" cy="13" rx="14" ry="10" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
        <g fill="none" stroke={WOOD_DARK} strokeWidth="1.5" strokeLinecap="round">
          <path d="M73 8.4 H87 M80 8.4 V19 M80 13 H87 M80 17 H87" />
        </g>
      </Layer>
    </g>
  )
}

/** こまっている間の 汗 と ため息。 */
function Worry({ t, walkX }: SceneProps & { readonly walkX: number }) {
  const show = during(t, 0.3, IDEA, 0.2)
  if (show <= 0) return null
  const p = ((t * 0.9) % 1)
  const sigh = span(t, 1.2, 2.0, easeOut)
  return (
    <g opacity={show} transform={`translate(${walkX} 0)`}>
      <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${39.4} ${16 + p * 8})`} opacity={1 - p} />
      {sigh > 0 && sigh < 1 && (
        <g opacity={1 - sigh * 0.8}>
          <ellipse cx={41 + sigh * 7} cy={32 - sigh * 3} rx={2 + sigh * 2.4} ry={1.5 + sigh * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
        </g>
      )}
    </g>
  )
}

function Strikes({ t }: SceneProps) {
  return (
    <>
      {STAGES.map((stage) => {
        const k = (t - stage.from) / HIT_PERIOD
        if (k < 0 || k >= stage.hits) return null
        const p = (k % 1 - 0.55) / 0.3
        if (p < 0 || p > 1) return null
        return <Star key={stage.from} cx={stage.hand[0] + 8.6} cy={stage.hand[1] + 2} r={3.2 * (1 - p * 0.5)} color={SUN} spin={p * 90} />
      })}
    </>
  )
}

/* ───────── ぜんたい ───────── */

/** 手を ぶらんと 下げる ときの 手の 場所(あるくと ふる) */
function hangHand(shoulder: V, swing: number): V {
  const a = (swing * Math.PI) / 180
  return [shoulder[0] + Math.sin(a) * 23 + 2, shoulder[1] + Math.cos(a) * 23]
}

/** かなづち を うつ 仕事の あいだ の 手の 場所。じゅんばんに 手を うつす */
function workHand(t: number, walkX: number, hang: V, cockScale: number): V {
  let hand = hang
  for (const stage of STAGES) {
    const r = raise(t, stage)
    const k = (r ?? 0.55) * cockScale
    const world: V = [stage.hand[0] + stage.cock[0] * k, stage.hand[1] + stage.cock[1] * k]
    hand = lerpV(hand, [world[0] - walkX, world[1]], span(t, stage.from - 0.35, stage.from, easeInOut))
  }
  return lerpV(hand, hang, span(t, BUILD_END, BUILD_END + 0.4, easeInOut))
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  const walkX = track(t, WALK_KEYS)
  const crouch = track(t, CROUCH_KEYS)
  const speed = (track(t + 0.02, WALK_KEYS) - track(t - 0.02, WALK_KEYS)) / 0.04
  const step = Math.sin(walkX * 0.6) * Math.min(1, Math.abs(speed) / 5)
  const jump = span(t, CHEER, CHEER + 0.4)
  const bob = -Math.sin(jump * Math.PI) * 5
  const drop = 11 * crouch

  const shoulder: V = [SHOULDER_X, SHOULDER_Y + drop]
  const swing = step * 26
  const hangNear = hangHand(shoulder, swing)
  const hangFar = hangHand(shoulder, -swing)
  const cheerUp: V = [shoulder[0] + 19 + wave(t, 0.3) * 1.4, shoulder[1] - 13]
  const cheerFar: V = [shoulder[0] - 8 + wave(t, 0.3, 0.15) * 1.4, shoulder[1] - 19]
  const cheer = during(t, CHEER - 0.05, 8.5, 0.2)
  const hold = span(t, 8.3, 8.7, easeInOut)
  const PLANK_HAND: V = [44, 47]

  const near = lerpV(lerpV(workHand(t, walkX, hangNear, 1), cheerUp, cheer), PLANK_HAND, hold)
  const far = lerpV(workHand(t, walkX, hangFar, 0.3), cheerFar, cheer)

  const mood: Mood = t < IDEA ? 'worried' : t < STAGES[0].from - 0.1 ? 'happy' : t < BUILD_END ? 'focus' : 'happy'
  const headTilt = t < IDEA ? 9 + wave(t, 1.4) * 2 : t < BUILD_END ? 3 : 0
  const tool = Math.max(0, span(t, 2.45, 2.8, backOut) * (1 - span(t, BUILD_END + 0.1, BUILD_END + 0.45)))
  const plank = span(t, 8.5, 8.9, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Shelf t={t} />
        {TOYS.map((plan) => (
          <Layer key={plan.kind} opacity={span(t, 0.15 + TOYS.indexOf(plan) * 0.12, 0.5 + TOYS.indexOf(plan) * 0.12) || 0.0001}>
            <Toy t={t} plan={plan} />
          </Layer>
        ))}
        <ellipse cx={28.4 + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
        {/* たてかける いた: 手もと から のびる */}
        <Board n={3} width={5.6} from={1 - Math.min(plank, 1)} />
        <Layer x={walkX} y={bob}>
          <Person step={step} mood={mood} drop={drop} crouch={crouch} nearTarget={near} farTarget={far} tool={tool} headTilt={headTilt} />
        </Layer>
        <Worry t={t} walkX={walkX} />
        <Bubble t={t} />
        <Strikes t={t} />
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
    { at: 0, label: 'おもちゃが ちらかって こまっている', sound: 'pop' },
    { at: 0.9, label: '「たなが あれば!」と ひらめく' },
    { at: STAGES[0].from, label: 'かなづちで はしら を とんとん', sound: 'pop' },
    { at: STAGES[1].from, label: 'うえの いた を うつ' },
    { at: STAGES[2].from, label: 'たなの いた を 2だん うつ' },
    { at: BACK_AT - 0.2, label: 'さがって、おもちゃが たなに もどる', sound: 'pop' },
    { at: 8.3, label: 'いたを ひょいと たてかける' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '作 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
