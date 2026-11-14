/*
 * 数(かず・かぞえる): ぼうを もって、ひとつ、ふたつ と たたいて かぞえる。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1〜9画目(娄) … 左がわ。丸太の上の どんぐり(かぞえられる もの)と、かぞえた ぶんだけ ならぶ 黄色い まる
 *   10〜13画目(攵) … 右がわ。ぼう(むち)を 手に もって たたく 子ども
 *                    (字の形に合わせず、子どもは ほんものの 人の つくり のまま 描く。
 *                     さいごは「だいたい 左に どんぐり、右に ぼうを もつ人」の 場所に そろう)
 *
 * ながれ
 *   丸太の上に どんぐりが 3つ → 子どもが ぼうを もって やってくる。「いくつ あるのかな?」と くびを かしげる
 *   → 「そうだ!」と ぼうを かまえる → どんぐりを 1つ たたいて「ひとつ」(まる が 1こ ふえる)
 *   → 1ほ ふみだして「ふたつ」(まる 2こ)→ もう 1ほ ふみだして「みっつ」(まる 3こ)
 *   → かぞえ おわって にっこり、ぼうを かかげて とびはねる → ほね が ひかって、絵が うすくなり、字「数」が のこる
 *
 * 子どもは Person(あるきは walk、ぼうは tools の stick、手は { to } で どんぐりの 上へ)。
 * ぼうは 手の中で きまった 長さ。とおい どんぐりには、1ほ あるいて 近づいて とどかせる。
 * 丸太・どんぐり・かぞえた まる は ここで 描く。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, personRig, Question, walk, type Limb, type PersonProps, type Point, type WalkResult } from '../sceneFigures'

const CHAR = '数'

const LOG = '#a8724a'
const LOG_DARK = '#8c5b3c'
const LOG_RING = '#f0d3a4'
const LOG_RING_DARK = '#d9b27a'
const ACORN = '#c98b4e'
const ACORN_LIGHT = '#e3a96c'
const ACORN_CAP = '#7a4a2b'
const COUNT = '#ffc233'
const COUNT_DARK = '#e8a010'
/** 元の 子どもの 服(だいだい の うわぎ・あお の ズボン) */
const KID_LOOK = { ...LOOKS.boy, top: '#ef7a5a' }

/** くぎり の時間(秒) */
const WALK = 1.0
const ARRIVE = 2.5
/** ぼうを かまえる */
const READY = 2.8
/** どんぐりを たたく しゅんかん(1つめ・2つめ・3つめ) */
const TAPS = [3.9, 4.9, 5.9] as const
/** かぞえおわって よろこぶ */
const CHEER = 6.3
const INK = 7.3
const DONE = 10.3
const DURATION = 10.9

/** 子どもの 背の高さ・地面 */
const KID_HEIGHT = 54
const FLOOR = 94
/** 丸太の上の どんぐり(左から 3つ)。右の ほうから 数える */
const LOG_TOP = 70
const ACORN_X = [48, 38, 28] as const
/** ぼうの さきが ふれる ところ(どんぐりの ぼうし の上) */
const TAP_Y = 59
/** 子どもが たつ ところ(どんぐり の 右。1つ かぞえる ごとに 1ほ 左へ) */
const STAND_X = [72, 62, 52] as const
/** ぼうを もつ 手は、ふれる 先 より 右(むねの たかさ。先は 少し 上を むく) */
const GRIP_OFFSET: Point = [14, 3]
const DOT_Y = 46
/** 1ほ あるく 前に ぼうを あげて、おろす とき の まわす 角度 */
const STICK_RAISE = 42

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k
const lerpAt = (values: readonly number[], u: number): number => {
  const i = Math.min(Math.floor(u), values.length - 2)
  return lerp(values[i], values[i + 1], u - i)
}
const rad = (deg: number): number => (deg * Math.PI) / 180

/** 点 p を、中心 c の まわりで deg 度(画面で 右まわり)まわす */
function rotateAbout(p: Point, c: Point, deg: number): Point {
  const r = rad(deg)
  const dx = p[0] - c[0]
  const dy = p[1] - c[1]
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)]
}

/** 丸太: よこに ねた 木の みき。左はし の 切り口に 年輪が 見える。 */
function Log({ t }: SceneProps) {
  const grow = span(t, 0.15, 0.75, backOut)
  return (
    <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[34, 92]}>
      <ellipse cx="34" cy="92.6" rx="26" ry="2.6" fill="#000000" opacity="0.1" />
      <rect x="15" y={LOG_TOP} width="39" height="21" rx="3" fill={LOG} />
      <rect x="15" y={LOG_TOP} width="39" height="4" rx="2" fill="#bd855a" />
      <path d="M27 80 h9 M41 84.5 h8 M20 87 h7" stroke={LOG_DARK} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <ellipse cx="15" cy="80.5" rx="5.2" ry="10.5" fill={LOG_RING_DARK} />
      <ellipse cx="15" cy="80.5" rx="4" ry="8.6" fill={LOG_RING} />
      <ellipse cx="15" cy="80.5" rx="2.2" ry="4.8" fill="none" stroke={LOG_RING_DARK} strokeWidth="0.9" />
    </Layer>
  )
}

/** どんぐり。足もと(丸太の上)を じく に、はね・つぶれる。 */
function Acorn({ x, appear, hop, squash }: { readonly x: number; readonly appear: number; readonly hop: number; readonly squash: number }) {
  return (
    <Layer x={x} y={LOG_TOP - hop} scale={appear} origin={[0, 0]}>
      <Layer scaleY={1 - 0.3 * squash} scaleX={1 + 0.15 * squash} origin={[0, 0]}>
        <ellipse cx="0" cy="-4.2" rx="3.7" ry="4.5" fill={ACORN} />
        <path d="M-0.7 0.1 L0 1.5 L0.7 0.1 Z" fill={ACORN_CAP} />
        <ellipse cx="-1.3" cy="-3.6" rx="0.9" ry="1.8" fill={ACORN_LIGHT} />
        <path d="M-4.6 -7.2 Q0 -12.6 4.6 -7.2 Q4.8 -5.4 3.6 -5.2 L-3.6 -5.2 Q-4.8 -5.4 -4.6 -7.2 Z" fill={ACORN_CAP} />
        <rect x="-0.6" y="-11.4" width="1.2" height="2" rx="0.6" fill={ACORN_CAP} />
      </Layer>
    </Layer>
  )
}

/** かぞえた しるし: どんぐりの上に、かぞえた ぶんの 黄色い まる(1つめは 1こ、2つめは 2こ、3つめは 3こ)。 */
function CountDots({ t, x, count, at, bounce }: { readonly t: number; readonly x: number; readonly count: number; readonly at: number; readonly bounce: number }) {
  const pop = span(t, at + 0.05, at + 0.3, backOut)
  if (pop <= 0) return null
  return (
    <Layer y={-bounce}>
      {Array.from({ length: count }, (_, i) => {
        const cx = x + (i - (count - 1) / 2) * 4.8
        return (
          <g key={i}>
            <circle cx={cx} cy={DOT_Y + 0.5} r={2.1 * pop} fill={COUNT_DARK} />
            <circle cx={cx} cy={DOT_Y} r={2.1 * pop} fill={COUNT} />
            <circle cx={cx - 0.6} cy={DOT_Y - 0.7} r={0.6 * pop} fill="#fff3c4" />
          </g>
        )
      })}
    </Layer>
  )
}

/** たたいた しゅんかん の ぽん(まるい わ) */
function TapRing({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  const p = span(t, at, at + 0.4, easeOut)
  if (p <= 0 || p >= 1) return null
  return <circle cx={x} cy={TAP_Y + 1} r={2 + p * 6} fill="none" stroke="#fff3c4" strokeWidth={1.4 * (1 - p)} opacity={1 - p} />
}

/** 子どもが あるく 3つの みち(やってくる → 2つめへ 1ほ → 3つめへ 1ほ)。いま 使うのを えらぶ */
function kidWalk(t: number): { readonly plan: WalkResult; readonly u: number } {
  const common = { build: 'child', height: KID_HEIGHT } as const
  const stepAt = (k: number) => ({ start: TAPS[k] - 0.65, end: TAPS[k] - 0.3 })
  const come = walk(t, { ...common, from: 118, to: STAND_X[0], start: WALK, end: ARRIVE })
  const step1 = walk(t, { ...common, from: STAND_X[0], to: STAND_X[1], ...stepAt(1) })
  const step2 = walk(t, { ...common, from: STAND_X[1], to: STAND_X[2], ...stepAt(2) })
  const plan = t >= stepAt(2).start ? step2 : t >= stepAt(1).start ? step1 : come
  return { plan, u: step1.progress + step2.progress }
}

/** 子どもの 場所と かっこう。ぼうは 右手に もつ(左むき だから てまえ の 手) */
function kidAt(t: number): { readonly props: PersonProps; readonly tipFor: (hand: Point) => Point } {
  const { plan, u } = kidWalk(t)
  const ready = span(t, READY, READY + 0.5, easeInOut) * (1 - span(t, CHEER, CHEER + 0.4, easeInOut))
  const cheer = span(t, CHEER, CHEER + 0.5, easeOut)
  const hop = -Math.abs(Math.sin((t - CHEER) * Math.PI * 2.2)) * 3.2 * during(t, CHEER, INK - 0.3, 0.1)
  // ぼうを あげて おろす(手を じく に さきが あがる)。ふれる しゅんかん に 0
  const raise = Math.max(...TAPS.map((tk) => span(t, tk - 0.8, tk - 0.55, easeOut) * (1 - span(t, tk - 0.25, tk, easeIn))))

  const tap: Point = [lerpAt(ACORN_X, u), TAP_Y]
  const grip: Point = [tap[0] + GRIP_OFFSET[0], tap[1] + GRIP_OFFSET[1]]
  const carry: Limb = { swing: 28, bend: 30 }
  const hold = mixLimb(carry, { to: grip }, ready)
  const rightArm = mixLimb(hold, { swing: 150, bend: 18 }, cheer)
  const leftArm = mixLimb(plan.pose.leftArm ?? { swing: 4, bend: 6 }, { swing: 150, bend: 18 }, cheer)
  const mood = t < READY ? 'worried' : t < TAPS[1] ? 'normal' : 'smile'
  const say = TAPS.some((tk) => t > tk && t < tk + 0.4) || (cheer > 0.2 && t < INK - 0.4)
  const props: PersonProps = {
    ...plan,
    y: FLOOR,
    look: KID_LOOK,
    lift: -hop,
    face: say ? 'joy' : mood,
    pose: { ...plan.pose, leftArm, rightArm, torso: 8 * ready },
  }
  // ぼうの 先: 手 から みて、かまえる ときは どんぐり へ(あげる ときは 手を じくに まわす)、
  // ふだんは ま下 ななめ まえ、よろこぶ ときは 上
  const tipFor = (hand: Point): Point => {
    const aimed = rotateAbout(tap, grip, STICK_RAISE * raise)
    const idle: Point = [hand[0] - 7, hand[1] + 17]
    const up: Point = [hand[0] - 3, hand[1] - 18]
    const base = ready > 0 ? [lerp(idle[0], aimed[0] + (hand[0] - grip[0]), ready), lerp(idle[1], aimed[1] + (hand[1] - grip[1]), ready)] : idle
    return [lerp(base[0], up[0], cheer), lerp(base[1], up[1], cheer)]
  }
  return { props, tipFor }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 13)

  // どんぐり: 丸太の上に ぽん ぽん ぽん と 出る
  const appear = (i: number) => span(t, 0.55 + i * 0.2, 0.95 + i * 0.2, backOut)
  // どんぐり ごとの はね(たたかれて つぶれ・はねる。かぞえおわりで みんなで はねる)
  const acornMove = (k: number) => {
    const tk = TAPS[k]
    const hitP = span(t, tk, tk + 0.45)
    const cheerP = span(t, CHEER + 0.1 * k, CHEER + 0.1 * k + 0.5)
    const hop = Math.sin(hitP * Math.PI) * 4 * (1 - hitP * 0.5) + Math.sin(cheerP * Math.PI) * 5
    const squash = Math.sin(span(t, tk, tk + 0.14) * Math.PI) * (1 - span(t, tk + 0.14, tk + 0.3))
    return { hop, squash }
  }
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  const { props, tipFor } = kidAt(t)
  const rig = personRig(props)
  const hand = rig.world.arms.right.end
  const stickShown = t >= WALK - 0.05
  const kid = <Person {...props} tools={stickShown ? { right: { kind: 'stick', tip: tipFor(hand) } } : undefined} />
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[6, 62, 98, 104]} />
        <Log t={t} />
        {ACORN_X.map((x, k) => {
          // 右の ほう(k = 0)から かぞえる。ならんだ じゅんに 出す
          const m = acornMove(k)
          return <Acorn key={x} x={x} appear={appear(k)} hop={m.hop} squash={m.squash} />
        })}
        {ACORN_X.map((x, k) => (
          <TapRing key={x} t={t} x={x} at={TAPS[k]} />
        ))}
        {ACORN_X.map((x, k) => (
          <CountDots key={x} t={t} x={x} count={k + 1} at={TAPS[k]} bounce={acornMove(k).hop * 0.6} />
        ))}
        {kid}
        <Question x={head[0] + headR * 0.8} y={head[1] - headR * 2.3} show={during(t, ARRIVE - 0.3, READY + 0.15, 0.25)} t={t} size={9} />
        <Layer opacity={during(t, READY, READY + 0.6, 0.2)}>
          <Star cx={70} cy={20} r={3.6 + wave(t, 0.5) * 0.4} color={COUNT} spin={t * 60} />
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
    { at: 0, label: '丸太の上に どんぐりが 3つ', sound: 'pop' },
    { at: WALK, label: '子どもが ぼうを もって あるいてくる' },
    { at: ARRIVE, label: '「いくつ あるのかな?」と くびを かしげる' },
    { at: READY, label: '「そうだ!」と ぼうを かまえる', sound: 'pop' },
    { at: TAPS[0], label: 'ぼうで たたいて「ひとつ」', sound: 'pop' },
    { at: TAPS[1], label: '1ほ ふみだして「ふたつ」', sound: 'pop' },
    { at: TAPS[2], label: 'もう 1ほ ふみだして「みっつ」', sound: 'pop' },
    { at: CHEER, label: 'かぞえおわって にっこり、とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '数 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
