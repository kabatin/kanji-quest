/*
 * 日(ひ): まるい お日さまを、つちの かべに ほろうとした子が、四角に した。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … つちの かべに ほった、四角の 左の たて線
 *   2画目(𠃍)   … 四角の うえの よこ線 と、右の たて線(ひと筆で ほる)
 *   3画目(一)   … 四角の まんなかの よこ線(お日さまの まんなか)
 *   4画目(一)   … 四角の いちばん下の よこ線(とじる)
 *   空の お日さま … 字には ならない。「見ほん」として 右上で かがやく
 *
 * ながれ
 *   つちの かべが たち、空に まるい お日さまが かがやく
 *   → 子どもが ながい ぼうを もって あるいてきて、お日さまを ゆびさす(ぴかぴか!)
 *   → ぼうで まるを ほろうとするけど、つちは かたくて がたがた。まるく ならなくて こまる
 *   → ひらめき! まっすぐなら ほりやすい。まるを けして、まっすぐな線で 四角を ほる
 *   → 四角が できて、子どもは よろこんで ぴょんぴょん
 *   → ほね が ひかり、絵が うすくなって 字「日」が のこる
 *
 * 子は Person(右むき。あるきは walk)。ぼうは tools の stick で、長さは かわらない(手と 先の きょりは いつも 同じ):
 *   先を かべの ほる ばしょに おき、手は その うしろ(ぼうの 長さ ぶん)。とどかなければ のばした うで の むきまで。
 *   ほる ときは 体を うごかさず、ぼうの 先で 画を ほる(つかれない ように 長い ぼう)。
 *   「さがって はなれる」ところ は 省いて、その場で よろこぶ(あとずさり の あるきは 部品に ないので)。
 * かべ・ほった線・電球 は ここで 描く。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, PALETTE, Person, personRig, Sweat, walk, type PersonProps, type Point } from '../sceneFigures'

const CHAR = '日'

const SUN = PALETTE.sun
const SUN_LIGHT = '#fff2a8'
const CLAY = '#e8c79a'
const CLAY_SHADE = '#d9b183'
const CARVE = '#7a5233'
const DUST = '#f3e0c0'
/** 元の 子の 服(だいだい の うわぎ・あおい ズボン) */
const KID_LOOK = { ...LOOKS.boy, top: '#ef7d57', bottom: '#4a6fa5' } as const

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
const WALK_TO = 1.4
/** お日さまを ゆびさす */
const POINT_FROM = 1.4
const POINT_TO = 2.1
/** まるを ほる */
const CIRCLE_FROM = 2.4
const CIRCLE_TO = 3.6
/** まるを けす(つちを ならす) */
const ERASE_TO = 4.0
/** ひらめき */
const IDEA_FROM = 4.0
const IDEA_TO = 4.7
/** 四角を ほる(画ごとの 時間) */
const CHEER = 7.4
const INK = 8.3
const DONE = 10.9
const DURATION = 11.4

const lerp = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 点の列(画の 通り道)の、0〜1 の所の 場所 */
function along(pts: readonly Point[], p: number): Point {
  const f = clamp01(p) * (pts.length - 1)
  const i = Math.min(Math.floor(f), pts.length - 2)
  return lerp(pts[i], pts[i + 1], f - i)
}

/** ほる画。scene-info の「通り道の点」と 同じ。from〜to の間に ほる */
const CARVES = [
  { n: 1, from: 4.7, to: 5.2, pts: [[31.5, 24.5], [33.2, 33.4], [33.2, 42.8], [33.2, 52.1], [33.1, 61.5], [33.1, 70.8], [33.1, 80.2], [33.2, 89.5]] as const },
  { n: 2, from: 5.25, to: 6.2, pts: [[33.5, 26], [49.2, 24.8], [64.9, 23.5], [79.1, 25.9], [79.2, 41.7], [79.1, 57.5], [79, 73.2], [79, 89]] as const },
  { n: 3, from: 6.4, to: 6.8, pts: [[34.2, 55.3], [40.5, 54.8], [46.8, 54.4], [53.1, 54], [59.4, 53.6], [65.7, 53.2], [72, 52.8], [78.3, 52.5]] as const },
  { n: 4, from: 6.95, to: 7.4, pts: [[34.2, 86.5], [40.5, 86.1], [46.7, 85.7], [53, 85.3], [59.3, 85], [65.5, 84.7], [71.8, 84.4], [78, 84.3]] as const },
]
const CARVE_START: Point = CARVES[0].pts[0]
const CARVE_END: Point = CARVES[CARVES.length - 1].pts[7]

/** 四角を ほっているときの、ぼうの さき の場所 */
function squareTip(t: number): Point {
  let pos: Point = CARVE_START
  CARVES.forEach((c, i) => {
    const next = CARVES[i + 1]
    if (t >= c.from) pos = along(c.pts, span(t, c.from, c.to))
    if (next && t > c.to) {
      const k = span(t, c.to, next.from, easeInOut)
      const moved = lerp(c.pts[7], next.pts[0], k)
      // 画と画の間は、ぼうを すこし うかせて うつる
      pos = [moved[0], moved[1] - Math.sin(k * Math.PI) * 4]
    }
  })
  return pos
}

/** うまく いかなかった まる(がたがた で、おわりが つながらない) */
const CIRCLE_CENTER: Point = [52, 56]
function circlePoint(p: number): Point {
  const theta = -Math.PI / 2 + p * Math.PI * 2 * 1.06
  const r = 14 * (1 + 0.16 * Math.sin(2.1 * theta + 0.8) + 0.09 * Math.sin(5 * theta))
  return [CIRCLE_CENTER[0] + Math.cos(theta) * r, CIRCLE_CENTER[1] + Math.sin(theta) * r]
}
const CIRCLE_STEPS = 48

/* ───────── 子どもの 場所と うごき ───────── */

const KID_HEIGHT = 54
const FLOOR = 95.5
/** かべの 左(ここで ほる)。あるいてきて、おくで すこし 近づく */
const STAND_FAR = 13
const STAND_NEAR = 22
const STEP_FROM = 1.9
const STEP_TO = 2.4
/** ぼうの ながさ(手 から 先)と、手が かた から はなれる 上限 */
const STICK_LEN = 38
const HAND_REACH = 18
/** tools の stick が 手の うしろへ 出す わりあい(部品の きまり) */
const STICK_BACK_RATIO = 0.12

type Grip = { readonly hand: Point; readonly tip: Point }

/** 2つの もちかた の あいだ(きりかわる ほんの ちょっと の 間 だけ ぼうの 長さが かわる) */
const blend = (a: Grip, b: Grip, k: number): Grip => ({ hand: lerp(a.hand, b.hand, k), tip: lerp(a.tip, b.tip, k) })

/** 先を T に おく とき の 手(かた S から 先 へ むかう むき。先に とどく うで の 長さ に おさめる) */
function gripAt(S: Point, T: Point): Grip {
  const dx = T[0] - S[0]
  const dy = T[1] - S[1]
  const dist = Math.hypot(dx, dy) || 1
  // 先が ちかい ときは、ぼうの うしろ が 手より うしろへ のびる(手は かた の 少し まえ)
  const reach = Math.min(Math.max(dist - STICK_LEN, 4), HAND_REACH)
  const hand: Point = [S[0] + (dx / dist) * reach, S[1] + (dy / dist) * reach]
  return { hand, tip: T }
}

/** 先 の むき を 決めて 持つ(手 を おく ばしょ と むき) */
function holdAt(hand: Point, dir: Point): Grip {
  const d = Math.hypot(dir[0], dir[1]) || 1
  return { hand, tip: [hand[0] + (dir[0] / d) * STICK_LEN, hand[1] + (dir[1] / d) * STICK_LEN] }
}

/** ぼうの もちかた(かた S から みて)。あるく ときは つえ のように、お日さまは 高く、ばんざい は まっすぐ 上 */
function gripAtTime(t: number, S: Point): Grip {
  const rest = holdAt([S[0] + 6, S[1] + 14], [0.3, -1])
  const sunDir: Point = [96 - S[0], 14 - S[1]]
  const point = holdAt([S[0] + (sunDir[0] / Math.hypot(...sunDir)) * 14, S[1] + (sunDir[1] / Math.hypot(...sunDir)) * 14 + wave(t, 0.5) * 0.8], sunDir)
  const cheer = holdAt([S[0] + 8, S[1] - 22 + wave(t, 0.5) * 1.5], [0.2, -1])
  const carve = (p: Point) => gripAt(S, p)
  if (t < POINT_FROM) return rest
  if (t < POINT_TO) return blend(rest, point, span(t, POINT_FROM, POINT_FROM + 0.3, easeInOut))
  if (t < CIRCLE_FROM) return blend(point, carve(circlePoint(0)), span(t, POINT_TO, CIRCLE_FROM, easeInOut))
  if (t < CIRCLE_TO) return carve(circlePoint(span(t, CIRCLE_FROM, CIRCLE_TO)))
  if (t < 4.3) return blend(carve(circlePoint(1)), rest, span(t, CIRCLE_TO, 4.2, easeInOut))
  if (t < 4.7) return blend(rest, carve(CARVE_START), span(t, 4.3, 4.7, easeInOut))
  if (t < CHEER) return carve(squareTip(t))
  return blend(carve(CARVE_END), cheer, span(t, CHEER, CHEER + 0.4, easeOut))
}

type Mood = 'calm' | 'happy' | 'focus' | 'worry' | 'eureka' | 'joy'

function moodAt(t: number): Mood {
  if (t < POINT_FROM) return 'calm'
  if (t < CIRCLE_FROM) return 'happy'
  if (t < 3.0) return 'focus'
  if (t < IDEA_FROM) return 'worry'
  if (t < IDEA_TO) return 'eureka'
  if (t < CHEER) return 'happy'
  return 'joy'
}

const FACES = { calm: 'normal', happy: 'smile', focus: 'normal', worry: 'worried', eureka: 'surprised', joy: 'joy' } as const

/** 子どもの 場所と かっこう(右むき。ぼうを もつ のは てまえの 左手) */
function kidAt(t: number): PersonProps {
  const first = walk(t, { from: -14, to: STAND_FAR, start: WALK_FROM, end: WALK_TO, build: 'child', height: KID_HEIGHT })
  const second = walk(t, { from: STAND_FAR, to: STAND_NEAR, start: STEP_FROM, end: STEP_TO, build: 'child', height: KID_HEIGHT })
  const plan = t >= STEP_FROM ? second : first
  const mood = moodAt(t)
  const base: PersonProps = {
    ...plan,
    y: FLOOR,
    look: KID_LOOK,
    face: FACES[mood],
    opacity: span(t, WALK_FROM - 0.1, WALK_FROM + 0.1),
    lift: t >= CHEER + 0.3 && t < 9.7 ? Math.abs(wave(t - CHEER, 1.4)) * 3 * span(t, CHEER + 0.3, CHEER + 0.5) : 0,
  }
  const shoulder = personRig(base).world.arms.left.root
  const grip = gripAtTime(t, shoulder)
  const banzai = span(t, CHEER, CHEER + 0.4, easeOut)
  const far = mixLimb(plan.pose.rightArm ?? { swing: 4, bend: 6 }, { swing: 165, bend: 10 }, banzai)
  const head = t >= POINT_FROM && t < CIRCLE_FROM ? -10 * span(t, POINT_FROM, POINT_FROM + 0.3) : mood === 'worry' ? 5 : 0
  return { ...base, pose: { ...plan.pose, leftArm: { to: grip.hand }, rightArm: far, head } }
}

/** ひらめき の 電球。あたま の上に ぽん と出る。 */
function Bulb({ t, head, r }: { readonly t: number; readonly head: Point; readonly r: number }) {
  const show = during(t, IDEA_FROM, IDEA_TO, 0.15)
  if (show <= 0) return null
  const s = Math.max(0, span(t, IDEA_FROM, IDEA_FROM + 0.25, backOut))
  const [x, y] = [head[0] + 2, head[1] - r - 6]
  return (
    <Layer opacity={show} scale={s * 1.4} origin={[x, y + 2]}>
      <circle cx={x} cy={y} r="4" fill={SUN} />
      <circle cx={x - 1.2} cy={y - 1.4} r="1.3" fill={SUN_LIGHT} />
      <rect x={x - 1.8} y={y + 3.4} width="3.6" height="2.4" rx="0.8" fill="#9aa4b2" />
      {[-60, -30, 0, 30, 60].map((deg) => (
        <rect key={deg} x={x - 0.6} y={y - 9} width="1.2" height="2.4" rx="0.6" fill={SUN} transform={`rotate(${deg} ${x} ${y})`} />
      ))}
    </Layer>
  )
}

/** まるを けすときの つちぼこり */
function DustPuffs({ t }: SceneProps) {
  const p = span(t, CIRCLE_TO, ERASE_TO)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4
        const d = 6 + p * 12
        return <circle key={i} cx={CIRCLE_CENTER[0] + Math.cos(a) * d} cy={CIRCLE_CENTER[1] + Math.sin(a) * d - p * 4} r={Math.max(0, 2.2 + p * 2)} fill={DUST} />
      })}
    </g>
  )
}

/** ゆびさした ときの お日さまの ぴかぴか */
function Glint({ t }: SceneProps) {
  const glint = during(t, POINT_FROM + 0.1, POINT_TO + 0.3, 0.2)
  return (
    <Layer opacity={glint}>
      <Star cx={86} cy={5} r={2.6} color="#ffffff" spin={t * 60} />
      <Star cx={104} cy={26} r={2.2} color="#ffffff" spin={-t * 60} />
    </Layer>
  )
}

/** 地面から たちあがる、つちの かべ */
function Wall({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <Layer opacity={grow > 0.03 ? 1 : 0} scaleY={Math.max(0.01, grow)} origin={[56, 96]}>
      <rect x="26" y="15" width="61" height="81" rx="5" fill={CLAY} />
      <path d="M81 15 H82 Q87 15 87 20 V91 Q87 96 82 96 H81 Z" fill={CLAY_SHADE} />
      <circle cx="30" cy="19.5" r="1.1" fill={CLAY_SHADE} />
      <circle cx="83" cy="91" r="1.1" fill={CLAY_SHADE} />
    </Layer>
  )
}

/** かべに ほった 線: がたがたの まる と、まっすぐな 四角 */
function Carvings({ t }: SceneProps) {
  const circleP = span(t, CIRCLE_FROM, CIRCLE_TO)
  const circleOpacity = 1 - span(t, CIRCLE_TO, ERASE_TO)
  const steps = Math.floor(circleP * CIRCLE_STEPS)
  const circlePts = Array.from({ length: steps + 1 }, (_, i) => circlePoint(Math.min(i / CIRCLE_STEPS, circleP)))
  return (
    <>
      {circleP > 0 && circleOpacity > 0 ? (
        <path d={`M${circlePts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L')}`} fill="none" stroke={CARVE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity={circleOpacity} />
      ) : null}
      {CARVES.map((c) => (
        <Bone key={c.n} char={CHAR} n={c.n} color={CARVE} width={2.6} to={span(t, c.from, c.to)} />
      ))}
    </>
  )
}

/** ほっている とき、ぼうの さき から ちる つちの かけら */
function Flecks({ t }: SceneProps) {
  const carvingSquare = CARVES.some((c) => t > c.from && t < c.to)
  const carvingCircle = t > CIRCLE_FROM && t < CIRCLE_TO
  if (!carvingSquare && !carvingCircle) return null
  const tip = carvingCircle ? circlePoint(span(t, CIRCLE_FROM, CIRCLE_TO)) : squareTip(t)
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = (t * 3 + i / 3) % 1
        return <circle key={i} cx={tip[0] + (i - 1) * 3 * p} cy={tip[1] - p * 5 + p * p * 7} r={Math.max(0, 0.8 * (1 - p))} fill="#caa072" />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const grip = gripAtTime(t, rig.world.arms.left.root)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  // 手 から 先 までが ぼうの 長さ より みじかい ぶんだけ、ぼうは 手の うしろへ のびる
  const handToTip = Math.hypot(grip.tip[0] - rig.world.arms.left.end[0], grip.tip[1] - rig.world.arms.left.end[1])
  const stickBack = Math.max(STICK_LEN - handToTip, 3)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[96, 14]} clouds={[[8, 11, 0.9]]} tufts={[6, 100]} />
        <Glint t={t} />
        <Wall t={t} />
        <Carvings t={t} />
        <DustPuffs t={t} />
        <Person {...kid} tools={{ left: { kind: 'stick', tip: grip.tip, length: stickBack / STICK_BACK_RATIO } }} />
        <Sweat t={t} x={head[0] - headR} y={head[1] - headR * 0.3} show={during(t, 3.0, IDEA_FROM, 0.2)} dir={-1} />
        <Bulb t={t} head={head} r={headR} />
        <Flecks t={t} />
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
    { at: 0, label: 'つちの かべが たち、お日さまが かがやく', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが ぼうを もって あるいてくる' },
    { at: POINT_FROM, label: 'まるい お日さまを ゆびさす' },
    { at: CIRCLE_FROM, label: 'まるを ほろうとするけど、がたがた' },
    { at: IDEA_FROM, label: 'ひらめき! まっすぐなら ほりやすい', sound: 'pop' },
    { at: CARVES[0].from, label: 'まっすぐな線で 四角を ほる' },
    { at: CHEER, label: '四角が できて、ぴょんぴょん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '日 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
