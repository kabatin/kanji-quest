/*
 * 手(て): 5ほんの ゆびを ひろげた 手の かたち。
 *
 * ほね(画と絵の対応)
 *   絵は 「手」を ズームで おおきく 見せる。手の ひらの まんなかを 通る たて線(4画目)が
 *   うで と なかゆび の すじ。よこ線(2・3画目)は 手の ひらを よこぎり、
 *   1画目 は 左うえに ひらいた ゆび の あたり。だいたい 同じ場所・同じ向き に そろう。
 *
 * ながれ
 *   お日さまの ひろば に、ろうそくの たった ケーキ。
 *   → こどもが やってきて「いくつ かな?」と ろうそくを 見る
 *   → うでを あげて、ゆびを 1ぽんずつ たてながら ろうそくを かぞえる(1ぽん、2ほん…)
 *   → 5ほん め! 5ほん ぜんぶ ぱっと ひろげて、うれしくて ぴょんぴょん
 *   → カメラが 手に ズームして、ほね が ひかり、絵が うすくなって 字「手」になる
 *
 * こどもは Person(あるきは walk、むきは turnAround、手を あげるのは { to })。けしき は Backdrop。
 * Person の あげた 手の 先に、5ほんの ゆび(おやゆび は 左はし、ひとさしゆび から こゆび は ならんで 上へ)を かさねて 描く。
 * ケーキ・ろうそく・ふうせん は 部品に ないので ここで 描く。
 * 手が 大きく 見えるのは、ズームしたから(こどもの 手の 大きさは そのまま)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, PALETTE, Person, personRig, turnAround, walk, type Limb } from '../sceneFigures'

const CHAR = '手'

const SKIN = PALETTE.skin
const HAIR_TOP = '#ff9a5c'
const TABLE = '#b57a4c'
const TABLE_DARK = '#8c5b3c'
const CAKE_BOTTOM = '#ff9db4'
const CAKE_TOP = '#fff4dc'
const BERRY = '#e8534a'
const FLAME = '#ffb02e'
const FLAME_CORE = '#ffe27a'
const CANDLE_COLORS = ['#4f9be0', '#ffd24a', '#55b86e', '#ff7a4d', '#8f9cec'] as const
const BALLOON = '#e8534a'
const BALLOON_LIGHT = '#ff8f86'

/** くぎり の時間(秒) */
const WALK = 0.9
const STOP = 2.3
const RAISE = 3.0
/** 1ぽんめ の ゆびを たてる時間 と、つぎの ゆび までの あいだ */
const COUNT_AT = 3.8
const COUNT_GAP = 0.5
/** 5ほんめ を たてた しゅんかん(うれしい) */
const JOY = COUNT_AT + COUNT_GAP * 4
/** ぴょんぴょん はねる 長さ(2回) と、手に ズームする時間 */
const HOP_LEN = 0.7
const ZOOM_FROM = JOY + 0.9
const ZOOM_TO = ZOOM_FROM + 1.0
const INK = ZOOM_TO + 0.2
const DONE = 10.5
const DURATION = 11

/** こども の 場所(こし の x)・足もと・背の高さ */
const KID_X = 30
const FLOOR = 96
const KID_HEIGHT = 80
/** 手を おろした とき / あげた とき / ばんざい の うで */
const FAR_CHEER: Limb = { swing: 158, bend: 8 }
/** あげた 手の 手首 の 目あて(あたまの よこ、かお より 上) */
const RAISED_TO: readonly [number, number] = [KID_X + 17, 16]
const KID_LOOK = { ...LOOKS.boy, top: HAIR_TOP }

type Point = readonly [number, number]
const rad = (deg: number) => (deg * Math.PI) / 180

/** あげた 手の まんなか(手のひら の まんなか)の 絵の中の場所 → ズームの じく */
const RAISED_RIG = personRig({ x: KID_X, y: FLOOR, facing: 'front', build: 'child', height: KID_HEIGHT, pose: { leftArm: { to: RAISED_TO } } })
const RAISED_END = RAISED_RIG.world.arms.left.end
const HAND_CENTER: Point = [RAISED_END[0], RAISED_END[1] - 6]
/** ズームの おわりに 手の まんなかが 来る 場所 と、ズームの 大きさ */
const HAND_GOAL: Point = [54.5, 56]
const ZOOM = 5

/** ろうそく の よこの 場所 */
const CANDLE_X = [75, 79.5, 84, 88.5, 93] as const
const CANDLE_BASE_Y = 54

/** 5ほんの ろうそく。i ばんめ の ゆびを たてたとき、その ろうそくが ぴょん と はずむ。 */
function Candle({ t, index }: { readonly t: number; readonly index: number }) {
  const x = CANDLE_X[index]
  const at = COUNT_AT + COUNT_GAP * index
  const bump = Math.sin(span(t, at, at + 0.4) * Math.PI)
  const flick = 1 + wave(t, 0.4, index * 0.17) * 0.09 + bump * 0.45
  return (
    <>
      <Layer y={-bump * 1.4}>
        <rect x={x - 0.85} y={CANDLE_BASE_Y - 6.5} width="1.7" height="6.7" rx="0.6" fill={CANDLE_COLORS[index]} />
        <Layer x={x} y={CANDLE_BASE_Y - 8} scaleX={1 + bump * 0.2} scaleY={flick} origin={[0, 2]}>
          <path d="M0 -3.4 Q1.9 -0.8 0 1.4 Q-1.9 -0.8 0 -3.4 Z" fill={FLAME} />
          <path d="M0 -1.4 Q0.9 -0.2 0 0.9 Q-0.9 -0.2 0 -1.4 Z" fill={FLAME_CORE} />
        </Layer>
        {bump > 0.02 && <circle cx={x} cy={CANDLE_BASE_Y - 9} r={2 + (1 - bump) * 3.4} fill="none" stroke="#ffd24a" strokeWidth="0.7" opacity={bump} />}
      </Layer>
    </>
  )
}

/** つくえ と ケーキ と ふうせん。ぽん と 出る。 */
function Party({ t }: SceneProps) {
  const pop = span(t, 0.3, 0.85, backOut)
  const sway = wave(t, 2.6)
  return (
    <Layer scale={pop} origin={[83, 96]}>
      <ellipse cx="83" cy="97.4" rx="26" ry="2.6" fill="#000000" opacity="0.1" />
      <rect x="64" y="72" width="3.2" height="25" rx="1.2" fill={TABLE_DARK} />
      <rect x="99" y="72" width="3.2" height="25" rx="1.2" fill={TABLE_DARK} />
      <rect x="60" y="69" width="46" height="4" rx="1.8" fill={TABLE} />
      <rect x="67" y="60" width="32" height="9.4" rx="2.4" fill={CAKE_BOTTOM} />
      <rect x="71.5" y="53.5" width="24" height="7.4" rx="2.2" fill={CAKE_TOP} />
      <path d="M71.5 57.5 q2.4 4 4.8 0 q2.4 4 4.8 0 q2.4 4 4.8 0 q2.4 4 4.8 0 q2.4 4 4.8 0" fill="none" stroke={CAKE_BOTTOM} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="70" cy="62" r="1.7" fill={BERRY} />
      <circle cx="97" cy="62" r="1.7" fill={BERRY} />
      <circle cx="83" cy="65.5" r="1.7" fill={BERRY} />
      {CANDLE_X.map((_, i) => (
        <Candle key={i} t={t} index={i} />
      ))}
      {/* ふうせん: つくえ の すみ から ひもで ふわふわ */}
      <path d={`M103 69 Q${103 + sway * 1.4} 56 ${103 + sway * 2} 47`} fill="none" stroke="#9aa5b5" strokeWidth="0.6" />
      <Layer rotate={sway * 3} origin={[103, 47]}>
        <ellipse cx="103" cy="40" rx="4.8" ry="6.2" fill={BALLOON} />
        <path d="M103 46 l-1.2 1.8 h2.4 Z" fill={BALLOON} />
        <ellipse cx="101.2" cy="37.6" rx="1.2" ry="2" fill={BALLOON_LIGHT} />
      </Layer>
    </Layer>
  )
}

/**
 * 手(てのひら を こちらへ むけた、左手)。手くび が 原点で、ゆびは 上を むく。
 * 左から おやゆび・ひとさしゆび・なかゆび・くすりゆび・こゆび。
 * ext は ゆび 1ぽんごとの のび(0 = にぎる / 1 = ひらく)、fan は ゆびの ひらき ぐあい。
 */
const FINGERS = [
  { x: -2.4, len: 5.2, tilt: -12 },
  { x: -0.8, len: 5.9, tilt: -4 },
  { x: 0.8, len: 5.3, tilt: 4 },
  { x: 2.4, len: 4.1, tilt: 12 },
] as const
const FINGER_WIDTH = 1.55

function Hand({ ext, fan }: { readonly ext: readonly number[]; readonly fan: number }) {
  const thumb = ext[0]
  const thumbLen = 3 + 1.6 * thumb
  return (
    <>
      {FINGERS.map((finger, k) => {
        const e = ext[k + 1]
        const len = finger.len * (0.3 + 0.7 * e)
        return (
          <Layer key={k} rotate={finger.tilt * fan * e} origin={[finger.x, -6]}>
            <rect x={finger.x - FINGER_WIDTH / 2} y={-6 - len} width={FINGER_WIDTH} height={len + 1.6} rx={FINGER_WIDTH / 2} fill={SKIN} />
          </Layer>
        )
      })}
      <rect x="-3.5" y="-7" width="7" height="7.6" rx="2.6" fill={SKIN} />
      {/* おやゆび: にぎっているときは てのひらの まえを よこぎり、のばすと 左へ ひらく */}
      <Layer rotate={58 - 110 * Math.min(thumb, 1.15)} origin={[-3, -2.4]}>
        <rect x="-4" y={-2.4 - thumbLen} width="2.1" height={thumbLen + 1.4} rx="1.05" fill={SKIN} />
      </Layer>
    </>
  )
}

/** 5ほん ひらいた しゅんかん、手の まわりに ぱっ と ひろがる すじ。 */
function Burst({ t }: SceneProps) {
  const show = during(t, JOY, JOY + 0.7, 0.1)
  if (show <= 0) return null
  const p = span(t, JOY, JOY + 0.5, easeOut)
  return (
    <g opacity={show} stroke="#ffc233" strokeWidth="0.9" strokeLinecap="round">
      {Array.from({ length: 9 }, (_, i) => {
        const a = rad(-160 + i * 17.5)
        const r1 = 10.5 + 3 * p
        const r2 = r1 + 3.2
        return <line key={i} x1={HAND_CENTER[0] + Math.cos(a) * r1} y1={HAND_CENTER[1] - 2 + Math.sin(a) * r1} x2={HAND_CENTER[0] + Math.cos(a) * r2} y2={HAND_CENTER[1] - 2 + Math.sin(a) * r2} />
      })}
    </g>
  )
}

/** うれしい ときの きらきら(あたまの まわり)。 */
function Cheer({ t }: SceneProps) {
  const show = during(t, JOY + 0.1, ZOOM_TO - 0.3, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      <Star cx={14} cy={14} r={2.8 + wave(t, 0.5) * 0.5} color="#ffc233" spin={t * 60} />
      <Star cx={44} cy={9} r={2.4 + wave(t, 0.5, 0.2) * 0.5} color="#ff7a4d" spin={-t * 50} />
      <Star cx={12} cy={34} r={2} color="#ffd95a" spin={t * 80} />
    </g>
  )
}

/** こどもの 場所と かっこう。あるいてきて ろうそくを 見て、手を あげ、ゆびを たてて かぞえ、よろこぶ */
function kidAt(t: number) {
  const walking = walk(t, { from: KID_X - 50, to: KID_X, start: WALK, end: STOP, build: 'child', height: KID_HEIGHT })
  const turn = turnAround(t, STOP, 'right', 'front')
  // うれしくて 2かい はねる(ズームの前に おわる)
  const hopping = t >= JOY && t < JOY + HOP_LEN
  const lift = hopping ? Math.abs(Math.sin(((t - JOY) / (HOP_LEN / 2)) * Math.PI)) * 2.4 : 0
  const face = t < STOP ? 'smile' : t < COUNT_AT - 0.4 ? 'surprised' : t < JOY ? 'normal' : 'joy'
  // 手: おろす → あげる(ゆびを たてる あいだ)。5ほん ひらいたら ちょっと ふる
  const up = span(t, RAISE, RAISE + 0.7, easeInOut)
  const shake = wave(t, 0.36) * 2.5 * during(t, JOY + 0.2, JOY + HOP_LEN - 0.1, 0.1)
  const hang: Limb = { swing: 8, bend: 10 }
  const left = mixLimb(hang, { to: [RAISED_TO[0] + shake, RAISED_TO[1]] }, up)
  // もう一方の 手は ふだんは たらして、うれしい ときに ばんざい
  const cheer = span(t, JOY + 0.05, JOY + 0.4, backOut)
  const right = mixLimb(hang, FAR_CHEER, cheer)
  return {
    ...walking,
    ...(t < STOP ? {} : turn),
    y: FLOOR,
    lift,
    look: KID_LOOK,
    face,
    gaze: t < STOP ? 0 : 0.7,
    gazeY: t < STOP ? 0 : -0.3,
    pose: t < STOP ? walking.pose : { leftArm: left, rightArm: right, head: t < RAISE ? 0 : 3 },
  } as const
}

/** あげた 手の 先に 5ほんの ゆびを かさねる(手首 の むきに 合わせて かたむける) */
function RaisedHand({ t, kid }: { readonly t: number; readonly kid: ReturnType<typeof kidAt> }) {
  if (t < RAISE + 0.35) return null
  const arm = personRig(kid).world.arms.left
  const dx = arm.end[0] - arm.mid[0]
  const dy = arm.end[1] - arm.mid[1]
  const tilt = (Math.atan2(dx, -dy) * 180) / Math.PI
  const ext = [0, 1, 2, 3, 4].map((i) => span(t, COUNT_AT + COUNT_GAP * i, COUNT_AT + COUNT_GAP * i + 0.25, backOut))
  const fan = 0.7 + 0.55 * span(t, JOY, JOY + 0.3, backOut)
  return (
    <Layer x={arm.end[0]} y={arm.end[1]} rotate={tilt}>
      <Hand ext={ext} fan={fan} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // カメラ: こどもの手に ズームして、手が 字の大きさに なる
  const zoom = span(t, ZOOM_FROM, ZOOM_TO, easeInOut)
  const kid = kidAt(t)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer x={(HAND_GOAL[0] - HAND_CENTER[0]) * zoom} y={(HAND_GOAL[1] - HAND_CENTER[1]) * zoom} scale={1 + (ZOOM - 1) * zoom} origin={HAND_CENTER}>
          <Backdrop t={t} tufts={[6, 44, 56, 104]} />
          <Party t={t} />
          <Person {...kid} />
          <RaisedHand t={t} kid={kid} />
          <Burst t={t} />
          <Cheer t={t} />
        </Layer>
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
    { at: 0, label: 'ひろばに ケーキと ろうそくが できる', sound: 'pop' },
    { at: WALK, label: 'こどもが あるいてくる' },
    { at: STOP, label: 'ろうそくを 見て「いくつ かな?」' },
    { at: RAISE, label: '手を あげる', sound: 'pop' },
    { at: COUNT_AT, label: 'ゆびを 1ぽんずつ たてて ろうそくを かぞえる' },
    { at: JOY, label: '5ほん! ぱっと ひろげて ぴょんぴょん', sound: 'ok' },
    { at: ZOOM_FROM, label: '手に ズーム' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '手 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
