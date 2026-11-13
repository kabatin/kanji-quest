/*
 * 三(さん): ぼうを 3本 よこに ならべて、かずを かぞえる。
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
 *   → もどって つぎの ぼう。2本目で まる が 2こ。3本目は せのびを して いちばん上に のせて まる が 3こ
 *   → 男の子は ばんざいで ぴょんぴょん。ほね が ひかって 絵が うすくなり、3本の 字「三」が のこる
 *
 * 男の子は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。ひくい ぼうを のせるときは しゃがみ、高い ぼうは うでを のばす。
 *   ぼうは かついで あるくときは ななめに 立て、のせる しゅんかんに よこへ たおす。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '三'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f0856a'
const SHIRT_DARK = '#d96d54'
const SHIRT_FAR = '#c25c47'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8c'
const SHOE = '#6b4a36'
const WOOD = '#d09a5a'
const WOOD_LIGHT = '#e8bd85'
const POST = '#8c5b3c'
const POST_DARK = '#70452b'
const ROPE = '#d9523f'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const BIRD = '#ff9a5c'
const BIRD_DARK = '#e2733f'

/** ぼうを のせる はしら(はしらの x)。どの ぼうも この2本の上に のる */
const POST_X: readonly [number, number] = [38, 74]
const POST_TOP = 12
const GROUND = 96

/** 男の子が ぼうを のせるときに たつ場所(体の まんなかの x)と、画面の外 */
const REST_X = 16
const AWAY_X = -26
/** うで の ふしの長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 15
const SHOULDER_Y = 46

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

type Boy = {
  readonly x: number
  readonly facing: 1 | -1
  readonly stride: number
  /** いま かついでいる ぼう(なければ -1)と、のせる度合い 0〜1 */
  readonly carry: number
  readonly lay: number
  readonly squat: number
  readonly hop: number
  readonly cheer: number
  readonly mood: Mood
}

type Mood = 'think' | 'smile' | 'cheer'

/** t の しゅんかんの 男の子 */
function boyAt(t: number): Boy {
  let i = -1
  PLANS.forEach((plan, k) => {
    if (t >= plan.start) i = k
  })
  const cheer = span(t, placedAt(2) + 0.1, placedAt(2) + 0.35)
  if (i < 0) return { x: AWAY_X, facing: 1, stride: 0, carry: -1, lay: 0, squat: 0, hop: 0, cheer: 0, mood: 'think' }
  const plan = PLANS[i]
  const u = t - plan.start
  const last = i === PLANS.length - 1
  const lay = span(u, ENTER, PLACED, easeInOut)
  const carrying = u < PLACED
  const entering = u < ENTER
  const leaving = !last && u > EXIT_FROM
  const x = entering ? mix(u, 0, ENTER, AWAY_X, REST_X, easeOut) : leaving ? mix(u, EXIT_FROM, EXIT_TO, REST_X, AWAY_X, easeIn) : REST_X
  const facing = !last && u > TURN + 0.07 ? -1 : 1
  const walking = entering || leaving
  const stride = walking ? Math.sin(t * Math.PI * 2 * 2.2) : 0
  const squat = plan.squat * (carrying ? lay : 1 - span(u, PLACED, PLACED + 0.3, easeInOut))
  // ばんざいの ぴょんぴょん(3本目を のせたあと)
  const hop = last && cheer > 0 ? Math.abs(Math.sin((t - placedAt(2) - 0.1) * Math.PI * 2 * 1.5)) * 4.5 * span(t, placedAt(2) + 0.1, placedAt(2) + 0.3) * (1 - span(t, INK - 0.4, INK)) : 0
  const mood: Mood = last && u >= PLACED ? 'cheer' : i === 0 && u < PLACED ? 'think' : 'smile'
  return { x, facing, stride, carry: carrying ? i : -1, lay, squat, hop, cheer: last ? cheer * (1 - span(t, INK - 0.4, INK)) : 0, mood }
}

/* ───────── 絵の うしろ ───────── */

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="55" ry="5.6" fill={GRASS} />
      {[6, 46, 62, 102].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
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

/* ───────── ぼう ───────── */

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

/** のせおわった 3本の ぼう と、しばった ひも */
function PlacedSticks({ t, count }: SceneProps & { readonly count: number }) {
  return (
    <>
      {PLANS.map((plan, i) => {
        if (i >= count) return null
        const since = t - placedAt(i)
        // ひもを しばる: ぽん と 出る
        const rope = span(since, 0, 0.25, backOut)
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

/** はしらの ところの ぼうの 高さ(画の線 から) */
function ropeY(n: number, x: number): number {
  const ys: Record<number, readonly [number, number]> = { 1: [23.6, 20.2], 2: [55.3, 52.3], 3: [87.3, 85.2] }
  return ys[n][x === POST_X[0] ? 0 : 1]
}

/** かついで はこぶ ぼう。かついでいる間は ななめに立ち、のせるとき よこに たおれる */
function CarriedStick({ boy }: { readonly boy: Boy }) {
  const plan = PLANS[boy.carry]
  const [gx, gy] = plan.grip
  const hand = carryHand(boy)
  return (
    <Layer x={hand[0] - gx} y={hand[1] - gy}>
      <Layer rotate={-72 * (1 - boy.lay)} origin={plan.grip}>
        <Stick n={plan.n} />
      </Layer>
    </Layer>
  )
}

/** かついでいる ぼうの 手の場所: 体の まえ から、のせる 場所へ */
function carryHand(boy: Boy): readonly [number, number] {
  const plan = PLANS[boy.carry]
  return [mix(boy.lay, 0, 1, boy.x + 12, plan.grip[0], (v) => v), mix(boy.lay, 0, 1, 56, plan.grip[1], (v) => v)]
}

/* ───────── 男の子 ───────── */

/** かた・ひじ・手 の2つの ほね。手の場所から、ひじを 計算する(体の つくり を守る) */
function armPoints(shoulder: readonly [number, number], hand: readonly [number, number], bendBack: number) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(0.001, Math.hypot(dx, dy))
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const height = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  const mid = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2] as const
  const candidates = [
    [mid[0] - uy * height, mid[1] + ux * height],
    [mid[0] + uy * height, mid[1] - ux * height],
  ] as const
  const score = (p: readonly [number, number]) => p[1] - bendBack * p[0] * 0.3
  const elbow = score(candidates[0]) >= score(candidates[1]) ? candidates[0] : candidates[1]
  const end = [shoulder[0] + ux * reach, shoulder[1] + uy * reach] as const
  return { elbow, end }
}

function Arm({ shoulder, hand, color, facing }: { readonly shoulder: readonly [number, number]; readonly hand: readonly [number, number]; readonly color: string; readonly facing: number }) {
  const { elbow, end } = armPoints(shoulder, hand, facing)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="3.3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3.2" cy="4.6" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'think' ? (
        <>
          <path d="M4.2 -3.4 l4 0.8" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="6.2" cy="-0.6" r="1.1" fill="#2b2b2b" />
          <path d="M5.2 5.4 q1.2 -0.8 2.6 0.2" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : mood === 'smile' ? (
        <>
          <circle cx="6.2" cy="-0.6" r="1.1" fill="#2b2b2b" />
          <path d="M4.8 4.2 Q6.6 6.6 8.4 4.2" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M4.6 0.2 Q6.2 -2 7.8 0.2" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M4.4 3.8 Q6.4 8.6 8.6 3.8 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

/** 男の子の からだ(うでの手前がわ は のぞく)。足もとが 地面(y = GROUND) */
function BoyBody({ boy, farAngle }: { readonly boy: Boy; readonly farAngle: number }) {
  const shift = boy.squat * 20
  const hipY = 64 + shift
  const legH = GROUND - hipY - 1
  const sy = SHOULDER_Y + shift
  const rad = (deg: number) => (deg * Math.PI) / 180
  const farEnd = [Math.sin(rad(farAngle)) * ARM_PART * 1.9, sy + Math.cos(rad(farAngle)) * ARM_PART * 1.9] as const
  return (
    <>
      {/* むこうの うで: 体の うしろ */}
      <path d={`M0 ${sy} L${farEnd[0] * 0.5 - 1.2} ${sy + (farEnd[1] - sy) * 0.5 + 1.2} L${farEnd[0]} ${farEnd[1]}`} fill="none" stroke={SHIRT_FAR} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={farEnd[0]} cy={farEnd[1]} r="3.2" fill={SKIN_SHADE} />
      {/* あし: かわりばんこに ふる。しゃがむと ひざを まげるので みじかく見せる */}
      <Layer rotate={boy.stride * 24} origin={[0.5, hipY]}>
        <rect x="-2.6" y={hipY} width="6.2" height={legH} rx="3" fill={PANTS_DARK} />
        <ellipse cx="1.6" cy={GROUND - 0.8} rx="5" ry="2.7" fill={SHOE} />
      </Layer>
      <Layer rotate={-boy.stride * 24} origin={[-0.5, hipY]}>
        <rect x="-3.6" y={hipY} width="6.2" height={legH} rx="3" fill={PANTS} />
        <ellipse cx="-0.6" cy={GROUND - 0.8} rx="5" ry="2.7" fill={SHOE} />
      </Layer>
      {/* くび と どう */}
      <rect x="-2.4" y={sy - 12} width="5" height="9" rx="2.4" fill={SKIN_SHADE} />
      <rect x="-7.6" y={sy - 6.4} width="15.2" height={hipY - sy + 9} rx="6.8" fill={SHIRT} />
      <path d={`M-5 ${sy + 13} h10`} stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* あたま */}
      <g transform={`translate(1 ${sy - 17})`}>
        <circle cx="0" cy="0" r="9" fill={SKIN} />
        <path d="M-9 -1.4 C-9.6 -10 1 -12.2 7.4 -7 C9.4 -4.4 9.6 -1 9 2 C7.4 -3.6 3.6 -5 -2 -4.8 C-5.4 -4.6 -8 -3.2 -9 -1.4 Z" fill={HAIR} />
        <Face mood={boy.mood} />
      </g>
    </>
  )
}

/** 男の子の からだ ぜんたい。むきを かえるときは、左右を ひっくり返す(うでの てまえがわ は Scene で あとから かさねる) */
function Boy({ boy }: { readonly boy: Boy }) {
  const farAngle = boy.carry >= 0 ? -6 : -boy.stride * 28 * (1 - boy.cheer) + boy.cheer * 165 + 8 * (1 - boy.cheer)
  return (
    <g transform={`translate(${boy.x} ${-boy.hop})`}>
      <Layer scaleX={boy.facing} origin={[0, 60]}>
        <BoyBody boy={boy} farAngle={farAngle} />
      </Layer>
    </g>
  )
}

/* ───────── 小鳥・まる ───────── */

/** はしらの てっぺんに 小鳥。ぼうを のせるたびに ちゅん と はねる */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 0.7, 1.4, easeOut)
  if (arrive <= 0) return null
  const x = POST_X[1] + 10 * (1 - arrive)
  const baseY = POST_TOP - 3.4 - 14 * (1 - arrive) + Math.sin(arrive * Math.PI) * -4
  const chirps = PLANS.map((_, i) => span(t - placedAt(i), 0, 0.35))
  const hop = chirps.reduce((sum, p) => sum + (p > 0 && p < 1 ? Math.sin(p * Math.PI) * 2.6 : 0), 0)
  const flap = arrive < 1 ? wave(t, 0.16) * 26 : 0
  return (
    <Layer x={x} y={baseY - hop}>
      <path d="M3.2 0.6 l5 -1.6 l-3.6 3.4 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="4.2" ry="3.3" fill={BIRD} />
      <circle cx="-3.2" cy="-2.4" r="2.5" fill={BIRD} />
      <path d="M-5.4 -2.5 l-2.6 0.7 l2.5 1 Z" fill="#f2b632" />
      <circle cx="-3.9" cy="-3" r="0.6" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.8 -4 4.4 -0.6 Q1.8 0.9 -1.2 -0.8 Z" fill={BIRD_DARK} />
      </Layer>
    </Layer>
  )
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
          <g key={i} opacity={Math.sin(p * Math.PI)} fill="#f07f9e">
            <path d={`M${nx + 1} ${ny} v-4.6 l2.6 -0.8 v4.4`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
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
  const arm = boy.carry >= 0 || boy.cheer > 0 || boy.x > AWAY_X
  // 男の子の てまえの うで(ぼうの 上に かさねるので、あとで 描く)
  const f = boy.facing
  const shift = boy.squat * 20
  const shoulder = [boy.x, SHOULDER_Y + shift - boy.hop] as const
  const hanging = [boy.x + f * (2 - boy.stride * 5), shoulder[1] + 25] as const
  const cheering = [boy.x + 19, shoulder[1] - 15] as const
  const carry = boy.carry >= 0 ? carryHand(boy) : null
  const target = carry ?? ([hanging[0] + (cheering[0] - hanging[0]) * boy.cheer, hanging[1] + (cheering[1] - hanging[1]) * boy.cheer] as const)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Posts t={t} />
        <PlacedSticks t={t} count={placed} />
        <ellipse cx={boy.x} cy="97.4" rx="9" ry="2.3" fill="#000000" opacity="0.12" />
        <Boy boy={boy} />
        {boy.carry >= 0 ? <CarriedStick boy={boy} /> : null}
        {arm ? <Arm shoulder={shoulder} hand={target} color={SHIRT_DARK} facing={f} /> : null}
        <Bird t={t} />
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
