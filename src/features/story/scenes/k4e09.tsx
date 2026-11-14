/*
 * 三(さん): ぼうを 3本 よこに ならべて、かずを かぞえる。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … いちばん上に のせる ぼう(3本目に のせる)
 *   2画目(一)  … まんなかの ぼう(2本目に のせる)
 *   3画目(一)  … いちばん下の 長い ぼう(さいしょに のせる)
 *   ぼうは 画の線を そのまま 使う(ぼう は もともと 画と おなじ 形だから)。
 *   2本の はしら は、ぼうを のせる だい。字には ふくまれない。
 *
 * ながれ
 *   はしらが 立つ → 男の子が 長い ぼうを かついで、「どこに おこうかな」と あるいてくる
 *   → ぼうを ななめから よこに たおして、はしらに のせる(ひもで しばる)。小鳥が ちゅん、右に まるが 1こ
 *   → くるっと むきを かえて もどり、つぎの ぼう。2本目で まる が 2こ。3本目は いちばん上に のせて まる が 3こ
 *   → 男の子は ばんざいで ぴょんぴょん。ほね が ひかって 絵が うすくなり、3本の 字「三」が のこる
 *
 * 人は Person。あるきは walk、むきかえは turnAround、しゃがむのは posture('squat')。
 * ぼうは 男の子の held に わたし(体の てまえ・てまえの うで の うしろ)、りょうてを { to } で ぼうの上に おく。
 * ひもを しばる・「ちゅん」の おんぷ・まる は ここで 描く。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, Bird, mixLimb, mixPose, PALETTE, Person, posture, turnAround, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '三'

const WOOD = '#d09a5a'
const WOOD_LIGHT = '#e8bd85'
const POST = PALETTE.bark
const POST_DARK = PALETTE.barkDark
const ROPE = '#d9523f'

/** ぼうを のせる はしら(はしらの x)。どの ぼうも この2本の上に のる */
const POST_X: readonly [number, number] = [38, 74]
const POST_TOP = 12
const GROUND = 96

/** 男の子が ぼうを のせるときに たつ場所(こし の x)と、画面の外 */
const REST_X = 16
const AWAY_X = -26
const BOY = { build: 'child', height: 78 } as const
const STAND = posture('stand', 'right')
const SQUAT = posture('squat', 'right')
const HANG: Limb = { swing: 4, bend: 8 }
const BANZAI: Limb = { swing: 135, bend: 10 }
/** ぼうの かたむき(字の線 と おなじ)と、かついでいる ときの たおれぐあい(度) */
const SLOPE_DEG = -2.9
const CARRY_DEG = -72

/** ぼう1本ごとの ようす。n=画の番号 / grip=手で にぎる場所(画の書きはじめの すこし右) / squat=しゃがむ度合い */
type StickPlan = { readonly n: number; readonly grip: readonly [number, number]; readonly squat: number; readonly start: number }
/** さいしょは いちばん下の 長いぼう(3画目)、つぎ 2画目、さいごに いちばん上(1画目) */
const PLANS: readonly StickPlan[] = [
  { n: 3, grip: [18, 87.8], squat: 1, start: 0.5 },
  { n: 2, grip: [33.8, 55.1], squat: 0.15, start: 2.1 },
  { n: 1, grip: [32.5, 23.7], squat: 0, start: 3.7 },
]
/** 1本ぶんの 時間の ながれ(はじまりからの 秒) */
const ENTER = 0.55
const PLACED = 0.95
const TURN = 1.05
const EXIT_FROM = 1.15
const EXIT_TO = 1.6

const INK = 6.4
const DONE = 9.0
const DURATION = 9.6

/** ぼうを のせおわった 時間(コマの目あて・小鳥・まる) */
const placedAt = (i: number) => PLANS[i].start + PLACED

type Pt = readonly [number, number]

type Boy = {
  readonly person: PersonProps
  /** いま かついでいる ぼう(なければ -1) */
  readonly carry: number
  readonly lay: number
  /** 手で にぎる ぼうの 場所 */
  readonly hand: Pt
}

/** かついでいる ぼうの 手の場所: 体の まえ から、のせる 場所へ */
function carryHand(x: number, lay: number, plan: StickPlan): Pt {
  return [mix(lay, 0, 1, x + 12, plan.grip[0], (v) => v), mix(lay, 0, 1, 56, plan.grip[1], (v) => v)]
}

/** t の しゅんかんの 男の子。あるく・むきを かえる・しゃがむ・ばんざい を 1か所の Person に まとめる */
function boyAt(t: number): Boy {
  const i = PLANS.reduce((found, plan, k) => (t >= plan.start ? k : found), -1)
  const plan = PLANS[Math.max(i, 0)]
  const last = i === PLANS.length - 1
  const u = t - plan.start
  const enter = walk(t, { from: AWAY_X, to: REST_X, start: plan.start, end: plan.start + ENTER, ...BOY })
  const leave = !last && u > EXIT_FROM ? walk(t, { from: REST_X, to: AWAY_X, start: plan.start + EXIT_FROM, end: plan.start + EXIT_TO, ...BOY }) : null
  const base = leave ?? enter
  const turn = leave || last ? {} : turnAround(t, plan.start + TURN, 'right', 'left')
  const carrying = i >= 0 && u < PLACED
  const lay = span(u, ENTER, PLACED, easeInOut)
  const squat = leave ? 0 : plan.squat * (carrying ? lay : 1 - span(u, PLACED, PLACED + 0.3, easeInOut))
  const cheer = last ? span(t, placedAt(2) + 0.1, placedAt(2) + 0.35) * (1 - span(t, INK - 0.4, INK)) : 0
  // ばんざいの ぴょんぴょん(3本目を のせたあと)
  const hop = cheer > 0 ? Math.abs(Math.sin((t - placedAt(2) - 0.1) * Math.PI * 2 * 1.5)) * 4.5 * span(t, placedAt(2) + 0.1, placedAt(2) + 0.3) : 0
  const hand = carryHand(base.x, lay, plan)
  // ぼうを にぎる: てまえの 手(右むき は 左手)は ぼうの 上、むこうの 手は すこし 右
  const angle = ((CARRY_DEG * (1 - lay) + SLOPE_DEG) * Math.PI) / 180
  const far: Pt = [hand[0] + Math.cos(angle) * 5, hand[1] + Math.sin(angle) * 5]
  const hold = i < 0 ? 0 : carrying ? 1 : 1 - span(u, PLACED, PLACED + 0.15)
  const sit = mixPose(STAND, SQUAT, squat)
  const nearArm = mixLimb(base.pose.leftArm ?? HANG, { to: hand }, hold)
  const farArm = mixLimb(base.pose.rightArm ?? HANG, { to: far }, hold)
  const person: PersonProps = {
    ...base,
    ...turn,
    y: GROUND,
    lift: hop,
    face: last && u >= PLACED ? 'joy' : i === 0 && u < PLACED ? 'normal' : 'smile',
    pose: {
      ...base.pose,
      ...sit,
      leftArm: mixLimb(nearArm, BANZAI, cheer),
      rightArm: mixLimb(farArm, BANZAI, cheer),
      // あるいている あいだ は あるきの 足、とまっている あいだ は しゃがみ の 足
      leftLeg: leave || enter.moving ? base.pose.leftLeg : sit.leftLeg,
      rightLeg: leave || enter.moving ? base.pose.rightLeg : sit.rightLeg,
    },
  }
  return { person, carry: carrying ? i : -1, lay, hand }
}

/** ぼうを のせる 2本の はしら。下から ぐんと のびる */
function Posts({ t }: SceneProps) {
  const grow = span(t, 0.05, 0.55, backOut)
  return (
    <Layer scaleY={grow} origin={[56, GROUND + 1]}>
      {POST_X.map((x) => (
        <g key={x}>
          <rect x={x - 2.7} y={POST_TOP} width="5.4" height={GROUND + 1 - POST_TOP} rx="2.7" fill={POST} />
          <rect x={x - 0.4} y={POST_TOP + 2} width="1.2" height={GROUND - POST_TOP - 4} rx="0.6" fill={POST_DARK} opacity="0.55" />
        </g>
      ))}
    </Layer>
  )
}

/** ぼう 1本。画の線を そのまま 使う(ぼう は 画と おなじ 形) */
function Stick({ n }: { readonly n: number }) {
  return (
    <>
      <Bone char={CHAR} n={n} color={WOOD} width={6.6} />
      <Layer y={-1.3}>
        <Bone char={CHAR} n={n} color={WOOD_LIGHT} width={1.5} from={0.03} to={0.97} />
      </Layer>
    </>
  )
}

/** はしらの ところの ぼうの 高さ(画の線 から) */
function ropeY(n: number, x: number): number {
  const ys: Record<number, readonly [number, number]> = { 1: [23.6, 20.2], 2: [55.3, 52.3], 3: [87.3, 85.2] }
  return ys[n][x === POST_X[0] ? 0 : 1]
}

/** のせおわった ぼう と、しばった ひも */
function PlacedSticks({ t, count }: SceneProps & { readonly count: number }) {
  return (
    <>
      {PLANS.map((plan, i) => {
        if (i >= count) return null
        // ひもを しばる: ぽん と 出る
        const rope = span(t - placedAt(i), 0, 0.25, backOut)
        return (
          <g key={plan.n}>
            <Stick n={plan.n} />
            {POST_X.map((x) => (
              <rect key={x} x={x - 2.2} y={ropeY(plan.n, x) - 4.4} width="4.4" height={8.8 * Math.max(0, rope)} rx="1.2" fill={ROPE} />
            ))}
          </g>
        )
      })}
    </>
  )
}

/** かついで はこぶ ぼう(男の子の held)。かついでいる間は ななめに立ち、のせるとき よこに たおれる */
function CarriedStick({ boy }: { readonly boy: Boy }) {
  const plan = PLANS[boy.carry]
  const [gx, gy] = plan.grip
  return (
    <Layer x={boy.hand[0] - gx} y={boy.hand[1] - gy}>
      <Layer rotate={CARRY_DEG * (1 - boy.lay)} origin={plan.grip}>
        <Stick n={plan.n} />
      </Layer>
    </Layer>
  )
}

/** はしらの てっぺんに 小鳥。ぼうを のせるたびに ちゅん と はねる */
function Songbird({ t }: SceneProps) {
  const arrive = span(t, 0.7, 1.4, easeOut)
  if (arrive <= 0) return null
  const chirps = PLANS.map((_, i) => span(t - placedAt(i), 0, 0.35))
  const hop = chirps.reduce((sum, p) => sum + (p > 0 && p < 1 ? Math.sin(p * Math.PI) * 2.6 : 0), 0)
  return <Bird x={POST_X[1] + 10 * (1 - arrive)} y={POST_TOP - 3.4 - 14 * (1 - arrive) - Math.sin(arrive * Math.PI) * 4 - hop} t={t} flying={arrive < 1} />
}

/** ちゅん の おんぷ。ぼうを のせた しゅんかんに ひとつ のぼる */
function Notes({ t }: SceneProps) {
  return (
    <>
      {PLANS.map((_, i) => {
        const p = span(t - placedAt(i), 0.05, 0.9)
        if (p <= 0 || p >= 1) return null
        const nx = 66 - p * 8 + Math.sin(p * 8) * 1.2
        const ny = 6 - p * 4
        return (
          <g key={i} opacity={Math.sin(p * Math.PI)} fill={PALETTE.heart}>
            <path d={`M${nx + 1} ${ny} v-4.6 l2.6 -0.8 v4.4`} fill="none" stroke={PALETTE.heart} strokeWidth="0.8" />
            <ellipse cx={nx} cy={ny} rx="1.2" ry="0.9" />
            <ellipse cx={nx + 2.6} cy={ny - 0.8} rx="1.2" ry="0.9" />
          </g>
        )
      })}
    </>
  )
}

/** かぞえる まる。ぼうを 1本のせるたびに 1こ ふえる(右はしの たて ならび) */
function Counter({ t }: SceneProps) {
  return (
    <>
      {PLANS.map((_, i) => {
        const pop = span(t - placedAt(i), 0.1, 0.5, backOut)
        if (pop <= 0) return null
        const r = Math.max(0, 3.4 * pop)
        const cy = 34 + i * 12
        return (
          <g key={i}>
            <circle cx="99" cy={cy} r={r} fill="#ffb938" />
            <circle cx="97.8" cy={cy - 1.1} r={r * 0.4} fill="#ffe6a0" />
          </g>
        )
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  const boy = boyAt(t)
  const placed = PLANS.filter((_, i) => t >= placedAt(i)).length
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} clouds={[]} tufts={[6, 46, 62, 102]} />
        <Posts t={t} />
        <PlacedSticks t={t} count={placed} />
        <Person {...boy.person} held={boy.carry >= 0 ? <CarriedStick boy={boy} /> : undefined} />
        <Songbird t={t} />
        <Notes t={t} />
        <Counter t={t} />
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
    { at: 0, label: 'はしらが 立つ', sound: 'pop' },
    { at: PLANS[0].start, label: '男の子が 長い ぼうを かついで くる' },
    { at: placedAt(0), label: '1本目を のせる。まる 1こ', sound: 'pop' },
    { at: placedAt(1), label: '2本目を のせる。まる 2こ', sound: 'pop' },
    { at: placedAt(2), label: '3本目を のせる。まる 3こ。ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '三 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
