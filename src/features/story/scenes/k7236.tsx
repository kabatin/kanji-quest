/*
 * 父(ちち): 手に おのを もって はたらく お父さん。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 家の やねの 小鳥が おどろいて とびたつ すじ(左のほう)
 *   2画目(ヽ)  … 木の てっぺんの 小鳥が おどろいて とびたつ すじ(右のほう)
 *   3画目(ノ)  … お父さんの 手に にぎった おの(かた から 手、えのが、まき の切り口まで)
 *   4画目(ヽ)  … うしろに そびえる 山の みぎ がわの すそ(山の ふもとで はたらいている)
 *
 * ながれ
 *   山の ふもとに 家と きりかぶ。まきが 1本 たっている
 *   → つかれた お父さんが おのを かついで あるいてくる
 *   → 両手で おのを ふりかぶり、コン! まきが ふたつに わかれる(小鳥が びっくり)
 *   → 家の まどから 子どもが 手を ふる。お父さんは にっこり(家を まもるために はたらいている)
 *   → ほね が ひかって、絵が うすくなり、字「父」が のこる
 *
 * お父さんは Person(左むき・おとな)。あるくのは walk。おの は 部品に ないので、お父さんの held として ここで 描き、
 * 両手は おの の えの にぎる 場所へ { to } で とどかせる(手が おの を うごかすのでは なく、おの の 場所に 手を あわせる)。
 * はちまき は headwear、こしの おび は 体の 関節の 場所から 描く(どちらも 部品には ない)。
 * 背景は Backdrop・Mountain・Meadow・Tree・House、小鳥・あせ・ふう は 部品。
 * 字の形に そろうのは、まきを わった さいごの しゅんかん の おの だけ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, House, LOOKS, Meadow, mixLimb, Mountain, PALETTE, Person, personRig, Sigh, Sweat, Tree, walk, type Limb, type PersonProps, type Rig } from '../sceneFigures'

const CHAR = '父'

const BELT = '#6b4a36'
const BAND = '#ffffff'
const WOOD = '#e8c08a'
const WOOD_RING = '#c99a5e'
const BARK = PALETTE.bark
const BARK_DARK = PALETTE.barkDark
const HANDLE = '#a8703f'
const STEEL = '#b9c4d2'
const STEEL_DARK = '#8c9aad'
const SKIN = PALETTE.skin
const HAIR = PALETTE.hair
const FATHER_LOOK = { ...LOOKS.man, top: '#e0824f', bottom: '#4a5d80', hair: HAIR } as const

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.0
/** おのを ふりかぶりはじめる / ふりおろしはじめる / まきに あたる */
const WIND = 2.2
const SWING = 2.95
const HIT = 3.3
/** まどから 子どもが 手を ふる */
const CHILD = 4.0
const INK = 6.0
const DONE = 8.6
const DURATION = 9.4

type Pt = readonly [number, number]

/** お父さんの 立つ ところ(こし の x)・足もと・背の高さ・歩きはじめの x */
const FATHER_X = 74
const FEET_Y = 94
const FATHER_HEIGHT = 74
const START_X = FATHER_X + 42
/** おの の え の長さ(にぎり の さき の おしり から、あたま の つけね まで) */
const HANDLE_LEN = 32

/** まきの 場所(きりかぶの 上。まんなかで ふたつに わかれる) */
const LOG_X = 52
const LOG_TOP = 74
const STUMP_TOP = 88

/** 家 の ばしょ と 大きさ、木 の ばしょ */
const HOUSE_X = 16.5
const HOUSE_W = 26
const TREE_X = 99
const TREE_BASE = 93
const TREE_H = 50
const TREE_TOP = TREE_BASE - TREE_H * 0.72 - TREE_H * 0.42

/* ───────── おの ───────── */

/** おのの すがた。b = えの おしり、theta = えの かたむき(ま下 が 0、時計まわり) */
type AxePose = { readonly b: Pt; readonly theta: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** えの おしり から g はなれた ところ(にぎる場所)。え の むきは (-sinθ, cosθ) */
function gripAt(axe: AxePose, g: number): Pt {
  return [axe.b[0] - Math.sin(rad(axe.theta)) * g, axe.b[1] + Math.cos(rad(axe.theta)) * g]
}

/** おのの 動き: 手に さげる → ふりかぶる → ふりおろす → まきに くいこむ。dx は あるいた ぶんの ずれ */
function axePoseAt(t: number, dx: number): AxePose {
  if (t < SWING) {
    return { b: [mix(t, WIND, SWING, 66.5, 71) + dx, mix(t, WIND, SWING, 50, 32)], theta: mix(t, WIND, SWING, 20, 200) }
  }
  // ふりおろす: はじめは ゆっくり、あたる ちょくぜん が いちばん はやい(あたまは ゆれる)
  const rebound = Math.sin(span(t, HIT, HIT + 0.3) * Math.PI) * 4
  return {
    b: [mix(t, SWING, HIT, 71, 65.5, easeOut), mix(t, SWING, HIT, 32, 50, easeOut)],
    theta: mix(t, SWING, HIT, 200, 38, easeIn) + rebound,
  }
}

/** おの。えの おしり を 原点、え を 下(+y)、金ぞくの あたま を さき に、きる ほう を +x に描く。 */
function Axe({ axe }: { readonly axe: AxePose }) {
  return (
    <Layer x={axe.b[0]} y={axe.b[1]} rotate={axe.theta}>
      <rect x="-1.5" y="-3" width="3" height={HANDLE_LEN + 4} rx="1.5" fill={HANDLE} />
      <rect x="-4.2" y="26.6" width="2.6" height="7.4" rx="0.8" fill={STEEL_DARK} />
      <path d="M-2 27 L2 26 Q9 24.2 10.4 22.2 L10.4 38.2 Q9 36.2 2 34.4 L-2 33.6 Z" fill={STEEL} />
      <path d="M2.2 33 Q8 33.6 10 36.2 L10.4 38.2 Q9 36.2 2 34.4 Z" fill={STEEL_DARK} />
      <path d="M10.4 23 V37.4" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

/** こしの おび。どう の 下の はし(こし の 少し 上)を よこぎる。体の 中の 座標で 両はし を とって 画面に うつす */
function Belt({ rig }: { readonly rig: Rig }) {
  const half = rig.body.torsoW / 2
  const a = rig.toWorld([-half, -5])
  const b = rig.toWorld([half, -5])
  return <path d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={BELT} strokeWidth={rig.scale * 5} strokeLinecap="butt" />
}

/** はちまき(あたまの まんなか が 0,0、半径 1。右むき の 形で描く)。むすびめ が うしろへ ひらひら */
function Headband({ t }: { readonly t: number }) {
  const tail = wave(t, 0.9) * 0.2
  return (
    <>
      <path d="M-0.97 -0.36 Q0 -1.1 0.97 -0.3" fill="none" stroke={BAND} strokeWidth="0.34" strokeLinecap="round" />
      <path d={`M-0.9 -0.4 l${-0.5 - tail} ${-0.16 + tail} M-0.9 -0.4 l${-0.4 - tail} ${0.28 + tail}`} fill="none" stroke={BAND} strokeWidth="0.2" strokeLinecap="round" />
    </>
  )
}

/* ───────── お父さん ───────── */

type Mood = 'tired' | 'focused' | 'happy'

/** お父さんの ばしょ・かっこう。おの を にぎる 両手 は { to } で えの 上 へ(おの の すがた は 先に きめる) */
function fatherAt(t: number, axe: AxePose): PersonProps {
  const w = walk(t, { from: START_X, to: FATHER_X, start: WALK, end: STOP, build: 'adult', height: FATHER_HEIGHT })
  // 左むき では てまえ(見える がわ)が 右手。ふだんは てまえの 手で おのを さげ、むこうの 手は ふる
  const grab = span(t, STOP - 0.1, WIND + 0.1, easeInOut)
  const gripNear: Limb = { to: gripAt(axe, 11) }
  const gripFar: Limb = { to: gripAt(axe, 4) }
  const swing: Limb = w.pose.leftArm ?? { swing: 10, bend: 10 }
  const mood: Mood = t < WIND ? 'tired' : t < HIT + 0.35 ? 'focused' : 'happy'
  // ふりかぶるとき うしろへ、ふりおろすとき まえへ のけぞる(左むき なので 前 = +)
  const lean = t < SWING ? mix(t, WIND, SWING, 0, -4, easeInOut) : t < HIT ? mix(t, SWING, HIT, -4, 4, easeIn) : mix(t, HIT, HIT + 0.6, 4, 1.5, easeOut)
  const head = t < WIND ? 6 : t < HIT + 0.35 ? 0 : -2
  return {
    ...w,
    y: FEET_Y,
    x: w.x,
    look: FATHER_LOOK,
    face: mood === 'tired' ? 'worried' : mood === 'focused' ? 'strain' : 'smile',
    lean,
    opacity: span(t, WALK - 0.1, WALK + 0.15),
    pose: { ...w.pose, rightArm: gripNear, leftArm: mixLimb(swing, gripFar, grab), head },
    headwear: <Headband t={t} />,
  }
}

/* ───────── 場所 ───────── */

function Place({ t }: SceneProps) {
  return (
    <>
      <Backdrop t={t} sun={[13, 13]} clouds={[]} tufts={[]} />
      {/* 山: みぎがわの すそ が 4画目。ふもとで はたらいている */}
      <Mountain shape={{ top: [38, 46], foot: 98, half: 66 }} rise={span(t, 0, 0.7, easeOut)} snow={0.18} />
      <Meadow y={98} tufts={[46, 82, 100]} />
    </>
  )
}

/** 家: やねの 小鳥が とびたつ(1画目)。まどから 子どもが 手を ふる。けむり は えんとつ から。 */
function Home({ t }: SceneProps) {
  const rise = span(t, 0.1, 0.7, backOut)
  const warm = span(t, CHILD - 0.3, CHILD + 0.3)
  const kid = Math.max(0, span(t, CHILD, CHILD + 0.4, backOut))
  const smokeOn = span(t, 0.8, 1.4)
  const hand = wave(t, 0.6) * 1.2
  // まど の まんなか(House は まど を ドア の 右に おく)
  const win: Pt = [HOUSE_X + HOUSE_W * 0.32, 95 - HOUSE_W * 0.7 * 0.78 + HOUSE_W * 0.1]
  return (
    <>
      <rect x={HOUSE_X + 5} y="62" width="3.8" height="10" rx="0.8" fill="#b04733" />
      <House x={HOUSE_X} y={95} width={HOUSE_W} grow={rise} light={warm} />
      {kid > 0 && (
        <Layer scale={kid} origin={[win[0], win[1] + 2.4]}>
          <circle cx={win[0]} cy={win[1] + 0.6} r="2.3" fill={SKIN} />
          <path d={`M${win[0] - 2.4} ${win[1] - 0.2} Q${win[0]} ${win[1] - 3.4} ${win[0] + 2.4} ${win[1] - 0.2} Q${win[0]} ${win[1] - 1.6} ${win[0] - 2.4} ${win[1] - 0.2} Z`} fill={HAIR} />
          <circle cx={win[0] - 0.8} cy={win[1] + 0.8} r="0.35" fill="#2b2b2b" />
          <circle cx={win[0] + 0.8} cy={win[1] + 0.8} r="0.35" fill="#2b2b2b" />
          <circle cx={win[0] + 3.4 + hand * 0.2} cy={win[1] - 1 + hand} r="1" fill={SKIN} />
        </Layer>
      )}
      {/* けむり */}
      <g opacity={smokeOn}>
        {[0, 1, 2].map((k) => {
          const p = (t * 0.45 + k / 3) % 1
          return <circle key={k} cx={HOUSE_X + 7 + p * 6 + Math.sin(p * 6 + k) * 1.4} cy={61 - p * 14} r={1.6 + p * 2.6} fill="#ffffff" opacity={(1 - p) * 0.85} stroke="#dfe7f0" strokeWidth="0.4" />
        })}
      </g>
    </>
  )
}

function Stump({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.8, backOut)
  return (
    <Layer scale={pop} origin={[LOG_X, 97]}>
      <path d="M38 98 Q41.4 94 41.8 88.4 L62.2 88.4 Q62.6 94 66 98 Z" fill={BARK} />
      <path d="M45 96 q1 -3 0.6 -6 M58 96 q-0.8 -3 -0.2 -6" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx={LOG_X} cy={STUMP_TOP} rx="11.2" ry="3" fill={WOOD} />
      <ellipse cx={LOG_X} cy={STUMP_TOP} rx="6.6" ry="1.6" fill="none" stroke={WOOD_RING} strokeWidth="0.7" />
    </Layer>
  )
}

/** まき。1本 たっていて、コン! で ふたつに わかれて ころがる */
function Log({ t }: SceneProps) {
  const pop = span(t, 0.6, 1.0, backOut)
  if (pop <= 0) return null
  const h = STUMP_TOP - LOG_TOP
  if (t < HIT) {
    return (
      <Layer scaleY={pop} origin={[LOG_X, STUMP_TOP]}>
        <rect x={LOG_X - 5} y={LOG_TOP} width="10" height={h} rx="1.4" fill={BARK} />
        <rect x={LOG_X - 5} y={LOG_TOP + 1.4} width="3" height={h - 2.8} rx="1.2" fill="#a06e49" />
        <ellipse cx={LOG_X} cy={LOG_TOP} rx="5" ry="1.8" fill={WOOD} />
        <ellipse cx={LOG_X} cy={LOG_TOP} rx="2.4" ry="0.8" fill="none" stroke={WOOD_RING} strokeWidth="0.6" />
      </Layer>
    )
  }
  const p = span(t, HIT, HIT + 0.75)
  const cx = [LOG_X - 2.5, LOG_X + 2.5]
  const cy = (LOG_TOP + STUMP_TOP) / 2
  // たおれて ころがった ときの まんなか(まき1本は よこに なる)
  const landY = 96 - 2.5
  const halves = [
    { x: cx[0], rot: -90, to: 36, face: -1 },
    { x: cx[1], rot: 90, to: 56, face: 1 },
  ]
  return (
    <>
      {halves.map((half, i) => (
        <Layer key={i} x={(half.to - half.x) * easeOut(p)} y={(landY - cy) * p * p - 12 * Math.sin(p * Math.PI)} rotate={half.rot * easeOut(p)} origin={[half.x, cy]}>
          <rect x={half.x - 2.5} y={LOG_TOP} width="5" height={h} rx="1.2" fill={BARK} />
          <rect x={half.face > 0 ? half.x - 2.5 : half.x + 1.1} y={LOG_TOP + 0.6} width="1.4" height={h - 1.2} fill={WOOD} />
        </Layer>
      ))}
    </>
  )
}

/** わった しゅんかんの はへん と ひかり */
function Burst({ t }: SceneProps) {
  const p = span(t, HIT, HIT + 0.8)
  if (p <= 0 || p >= 1) return null
  const chips: readonly (readonly [number, number, number])[] = [
    [-16, -22, 1],
    [-7, -28, -1],
    [10, -24, 1],
    [18, -14, -1],
    [-22, -12, -1],
    [4, -31, 1],
  ]
  return (
    <>
      <Star cx={LOG_X} cy={81} r={Math.max(0, 3 + 7 * span(t, HIT, HIT + 0.3)) * (1 - span(t, HIT + 0.15, HIT + 0.4))} color="#fff3b0" spin={p * 90} />
      <g opacity={1 - p * p}>
        {chips.map(([vx, vy, dir], i) => (
          <path key={i} d="M-1.8 0 L1.8 -0.8 L0.6 1.6 Z" fill={WOOD} transform={`translate(${LOG_X + vx * p} ${80 + vy * p + 38 * p * p}) rotate(${dir * p * 360})`} />
        ))}
      </g>
    </>
  )
}

/** 小鳥。おどろいて とびたつ(とまっている間は 少し はねる)。 */
type FlyerProps = { readonly t: number; readonly from: Pt; readonly to: Pt; readonly color: string; readonly dark: string; readonly facing: 'left' | 'right' }

function Flyer({ t, from, to, color, dark, facing }: FlyerProps) {
  const p = span(t, HIT + 0.05, HIT + 1.6, easeOut)
  const flying = p > 0
  const drift = p >= 1 ? wave(t, 2.2) * 1.6 : 0
  const x = from[0] + (to[0] - from[0]) * p + drift
  const y = from[1] + (to[1] - from[1]) * p - Math.sin(p * Math.PI) * 4 + (p >= 1 ? wave(t, 1.6) * 1.2 : 0)
  const hop = flying ? 0 : Math.abs(wave(t, 0.8)) * 0.6
  return <Bird x={x} y={y - hop} t={t} flying={flying} facing={facing} size={1.3} color={color} dark={dark} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const here = walk(t, { from: START_X, to: FATHER_X, start: WALK, end: STOP, build: 'adult', height: FATHER_HEIGHT })
  // おの は お父さんが あるいた ぶん だけ いっしょに うごく
  const dx = here.x - FATHER_X
  const axe = axePoseAt(t, dx)
  const father = fatherAt(t, axe)
  const rig = personRig(father)
  const [headX, headY] = rig.world.head
  const headR = rig.body.headR * rig.scale

  return (
    <>
      <Layer opacity={ink.picture}>
        <Place t={t} />
        <Home t={t} />
        <Tree x={TREE_X} y={TREE_BASE} height={TREE_H} grow={span(t, 0.2, 0.8)} sway={wave(t, 3.4) * 1.2} />
        <Stump t={t} />
        <Log t={t} />
        {/* 小鳥は 木に とまっているので、お父さんの うしろ */}
        <Layer opacity={span(t, 0.6, 0.9)}>
          <Flyer t={t} from={[HOUSE_X, 63.5]} to={[38.5, 18.3]} color="#ff9a5c" dark="#e2733f" facing="right" />
          <Flyer t={t} from={[TREE_X, TREE_TOP - 0.5]} to={[84, 9]} color="#6fb4ea" dark="#4a93d4" facing="left" />
        </Layer>
        <Person {...father} held={<><Belt rig={rig} /><Axe axe={axe} /></>} />
        <Sweat t={t} x={headX + headR + 1} y={headY - headR * 0.4} show={during(t, WALK + 0.2, STOP, 0.2)} dir={1} />
        <Sigh x={headX - headR - 1} y={headY + headR * 0.4} p={span(t, HIT + 0.5, HIT + 1.9, easeOut)} show={during(t, HIT + 0.5, HIT + 1.9, 0.2)} dir={-1} />
        <Burst t={t} />
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
    { at: 0, label: '山の ふもとに 家と きりかぶ', sound: 'pop' },
    { at: WALK, label: 'つかれた お父さんが おのを かついで あるいてくる' },
    { at: WIND, label: '両手で おのを ふりかぶる' },
    { at: HIT, label: 'コン! まきが わかれる。小鳥が とびたつ', sound: 'pop' },
    { at: CHILD, label: '家の まどから 子どもが 手を ふる。お父さんは にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '父 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
