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
 * 人は 共通部品 Person(右むき)。手の 行き先を 点で 指定して、ひじ は 部品が 計算する。
 *   とおい たな は、あるいて 近づいて、ひくい たな は ひざを まげて うつ。
 *   うしろへ さがる ときは 体ごと 左を むいて あるき、もどったら また 右を むく。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, mixPose, Person, personRig, posture, Sigh, Sweat, turnAround, walk, type Expression, type Facing, type Limb, type PersonPose, type WalkPlan } from '../sceneFigures'

const CHAR = '作'

const KID_LOOK = { ...LOOKS.boy, top: '#f0a43c' } as const
const WOOD = '#d29a5c'
const WOOD_DARK = '#a8723c'
const IRON = '#8a96a6'
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

/** 足もとの 地面・人の 立つ x(こし)・背の高さ。右むき */
const GROUND_Y = 94
const HOME_X = 28.4
const KID_HEIGHT = 78

/** あるきの くぎり: たなを つくる 所に 近づく(右へ)。さいごは 体ごと 左を むいて さがる */
const CLOSE_WALKS: readonly WalkPlan[] = [
  { from: HOME_X, to: 40.4, start: IDEA + 0.2, end: 3.0, build: 'child', height: KID_HEIGHT },
  { from: 40.4, to: 43.4, start: 3.9, end: 4.2, build: 'child', height: KID_HEIGHT },
  { from: 43.4, to: 45.4, start: 4.9, end: 5.2, build: 'child', height: KID_HEIGHT },
  { from: 45.4, to: 46.4, start: 5.7, end: 5.9, build: 'child', height: KID_HEIGHT },
]
const NEAR_X = 46.4
const BACK_WALK: WalkPlan = { from: NEAR_X, to: HOME_X, start: BUILD_END + 0.35, end: BACK_AT - 0.05, build: 'child', height: KID_HEIGHT }
/** ひくい たなを うつ とき は ひざを まげる(0 = 立つ / 1 = しゃがむ) */
const CROUCH_KEYS: readonly (readonly [number, number])[] = [[0, 0], [5.5, 0], [5.9, 1], [6.4, 1], [6.9, 0]]

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

/** かなづち。ひじ → 手 の むき に そって、えが のびる(手の まんなか が 0,0) */
function Hammer({ from, to, scale }: { readonly from: V; readonly to: V; readonly scale: number }) {
  if (scale <= 0) return null
  const angle = (Math.atan2(-(to[0] - from[0]), to[1] - from[1]) * 180) / Math.PI
  return (
    <g transform={`translate(${to[0]} ${to[1]}) rotate(${angle}) scale(${scale})`}>
      <rect x="-1.1" y="-1" width="2.2" height="9" rx="1" fill={WOOD_DARK} />
      <rect x="-3.4" y="5.6" width="6.8" height="3.6" rx="0.9" fill={IRON} />
      <rect x="-3.4" y="5.6" width="6.8" height="1.2" rx="0.6" fill="#b5bfcc" />
    </g>
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

/** かなづち を うつ 仕事の あいだ の 手。じゅんばんに 手を うつす(絵の 点を 手先に する) */
function workArm(t: number, hang: Limb, cockScale: number): Limb {
  let arm = hang
  for (const stage of STAGES) {
    const r = raise(t, stage)
    const k = (r ?? 0.55) * cockScale
    const target: Limb = { to: [stage.hand[0] + stage.cock[0] * k, stage.hand[1] + stage.cock[1] * k] }
    arm = mixLimb(arm, target, span(t, stage.from - 0.35, stage.from, easeInOut))
  }
  return mixLimb(arm, hang, span(t, BUILD_END, BUILD_END + 0.4, easeInOut))
}

/* ───────── 人の いち・かっこう ───────── */

type Standing = { readonly x: number; readonly facing: Facing; readonly squash?: number; readonly pose: PersonPose }

/** 人の いち と むき: たたずむ → 近づく → 左を むいて さがる → もどって 右を むく */
function standingAt(t: number): Standing {
  if (t < BUILD_END) {
    const plan = [...CLOSE_WALKS].reverse().find((p) => t >= p.start) ?? CLOSE_WALKS[0]
    const w = walk(t, plan)
    return { x: w.x, facing: 'right', pose: w.pose }
  }
  if (t < BACK_WALK.start) return { x: NEAR_X, ...turnAround(t, BUILD_END, 'right', 'left'), pose: {} }
  if (t < BACK_AT) {
    const w = walk(t, BACK_WALK)
    return { x: w.x, facing: 'left', pose: w.pose }
  }
  return { x: HOME_X, ...turnAround(t, BACK_AT, 'left', 'right'), pose: {} }
}

function moodAt(t: number): Expression {
  if (t < IDEA) return 'worried'
  if (t < STAGES[0].from - 0.1) return 'smile'
  if (t < BUILD_END) return 'strain'
  return t < CHEER ? 'smile' : 'joy'
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  const crouch = track(t, CROUCH_KEYS)
  const lift = Math.sin(span(t, CHEER, CHEER + 0.4) * Math.PI) * 5
  const place = standingAt(t)
  const hang: Limb = { swing: 3, bend: 8 }
  const walking = t < BUILD_END || (t >= BACK_WALK.start && t < BACK_AT)
  const nearHang = (walking && place.pose.leftArm) || hang
  const farHang = (walking && place.pose.rightArm) || hang

  // うで: かなづち を うつ → ばんざい → いたを もつ(1画目に かさねる いた)
  const cheer = during(t, CHEER - 0.05, 8.5, 0.2)
  const hold = span(t, 8.3, 8.7, easeInOut)
  const nearCheer = mixLimb(workArm(t, nearHang, 1), { swing: 140, bend: 20 + wave(t, 0.3) * 8 }, cheer)
  const nearArm = mixLimb(nearCheer, { to: [44, 47] }, hold)
  const farArm = mixLimb(workArm(t, farHang, 0.3), { swing: 165, bend: 10 + wave(t, 0.3, 0.15) * 8 }, cheer)
  const squat = mixPose({}, posture('squat', 'right'), crouch * 0.7)
  const pose: PersonPose = { ...(crouch > 0 ? squat : place.pose), leftArm: nearArm, rightArm: farArm, head: t < IDEA ? 9 + wave(t, 1.4) * 2 : t < BUILD_END ? 3 : 0 }
  const kid = { ...place, y: GROUND_Y, build: 'child', height: KID_HEIGHT, lift, pose } as const
  const rig = personRig(kid)
  const head = rig.world.head
  const tool = Math.max(0, span(t, 2.45, 2.8, backOut) * (1 - span(t, BUILD_END + 0.1, BUILD_END + 0.45)))
  const plank = span(t, 8.5, 8.9, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[13, 13]} tufts={[6, 40, 100]} />
        <Shelf t={t} />
        {TOYS.map((plan) => (
          <Layer key={plan.kind} opacity={span(t, 0.15 + TOYS.indexOf(plan) * 0.12, 0.5 + TOYS.indexOf(plan) * 0.12) || 0.0001}>
            <Toy t={t} plan={plan} />
          </Layer>
        ))}
        {/* たてかける いた: 手もと から のびる */}
        <Board n={3} width={5.6} from={1 - Math.min(plank, 1)} />
        <Person {...kid} look={KID_LOOK} face={moodAt(t)} held={<Hammer from={rig.world.arms.left.mid} to={rig.world.arms.left.end} scale={tool} />} />
        <Sweat t={t} x={head[0] - 8} y={head[1] - 6} show={during(t, 0.3, IDEA, 0.2)} />
        <Sigh x={head[0] + 6} y={head[1] + 5} p={span(t, 1.2, 2.0, easeOut)} show={during(t, 1.2, 2.0, 0.2)} dir={1} />
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
