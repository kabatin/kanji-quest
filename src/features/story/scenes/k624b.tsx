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
 * こどもは ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。あげた手の ゆびは 5ほん(おやゆび は 左はし、ひとさしゆび から こゆび は ならんで 上へ)。
 *   くび は みじかく、あたま は どう の まんなか の上。
 *   手が 大きく 見えるのは、ズームしたから(こどもの 手の 大きさは そのまま)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '手'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ff9a5c'
const SHIRT_DARK = '#e8834a'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
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
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

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

/** かた(てまえ = 右手、むこう = 左手)。あたまは x=30、どうは x=22〜38 */
const SHOULDER_NEAR: readonly [number, number] = [37.5, 42]
const SHOULDER_FAR: readonly [number, number] = [22.5, 42]
/** かた→ひじ、ひじ→手くび の 長さ */
const UPPER = 15
const FORE = 11.3
/** うで の かくど: ま下が 0、そとへ ひらくほど ふえ、まっすぐ上が 180 */
type Angles = { readonly upper: number; readonly fore: number }
const HANG: Angles = { upper: 10, fore: 12 }
const RAISED: Angles = { upper: 33, fore: 172 }
const FAR_CHEER: Angles = { upper: 35, fore: 150 }

const rad = (deg: number) => (deg * Math.PI) / 180

type Point = readonly [number, number]
/** かた から ひじ、手くび の 場所。sign が -1 なら 左右 はんたい(むこうの うで) */
function joints(shoulder: Point, sign: 1 | -1, angles: Angles): { readonly elbow: Point; readonly wrist: Point } {
  const elbow: Point = [shoulder[0] + sign * Math.sin(rad(angles.upper)) * UPPER, shoulder[1] + Math.cos(rad(angles.upper)) * UPPER]
  const wrist: Point = [elbow[0] + sign * Math.sin(rad(angles.fore)) * FORE, elbow[1] + Math.cos(rad(angles.fore)) * FORE]
  return { elbow, wrist }
}

/** あげた手の まんなか(手のひらの まんなか)の 絵の中の場所 → ズームの じく */
const RAISED_WRIST = joints(SHOULDER_NEAR, 1, RAISED).wrist
const HAND_TILT = 180 - RAISED.fore
const HAND_CENTER: Point = [RAISED_WRIST[0] + 3.5 * Math.sin(rad(HAND_TILT)), RAISED_WRIST[1] - 3.5 * Math.cos(rad(HAND_TILT))]
/** ズームの おわりに 手の まんなかが 来る 場所 と、ズームの 大きさ */
const HAND_GOAL: Point = [54.5, 56]
const ZOOM = 5

/** ろうそく の よこの 場所 */
const CANDLE_X = [75, 79.5, 84, 88.5, 93] as const
const CANDLE_BASE_Y = 54

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="60" cy="14" rx="7" ry="3.2" />
        <ellipse cx="65" cy="12.2" rx="5" ry="3.2" />
        <ellipse cx="96" cy="26" rx="6" ry="2.6" />
        <ellipse cx="100.5" cy="24.4" rx="4.4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 44, 56, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

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

type Mood = 'smile' | 'wonder' | 'count' | 'joy'

function Face({ mood, dx }: { readonly mood: Mood; readonly dx: number }) {
  const eyes = mood === 'joy' ? (
    <>
      <path d="M24.2 26 Q26.3 22.6 28.4 26" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M31.6 26 Q33.7 22.6 35.8 26" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ) : (
    <>
      <circle cx={26.3 + dx} cy="25.4" r={mood === 'wonder' ? 1.5 : 1.3} fill={EYE} />
      <circle cx={33.7 + dx} cy="25.4" r={mood === 'wonder' ? 1.5 : 1.3} fill={EYE} />
    </>
  )
  const brows = mood === 'wonder' ? (
    <>
      <path d="M23.8 21.4 Q26.2 19.4 28.4 21" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
      <path d="M31.6 20.4 Q33.8 18.8 36.2 20" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
    </>
  ) : mood === 'count' ? (
    <>
      <path d="M24 21.8 L28.2 22.2" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
      <path d="M31.8 22.2 L36 21.8" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
    </>
  ) : null
  const mouth =
    mood === 'joy' ? (
      <>
        <path d="M25.8 29 Q30 36.4 34.2 29 Z" fill={MOUTH} />
        <ellipse cx="30" cy="32.8" rx="2" ry="1.1" fill="#ff8a8a" />
      </>
    ) : mood === 'wonder' ? (
      <ellipse cx="30" cy="31.2" rx="1.2" ry="1.6" fill={MOUTH} />
    ) : mood === 'count' ? (
      <path d="M28.4 31 Q30 32.2 31.6 31" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
    ) : (
      <path d="M27.4 30.2 Q30 33 32.6 30.2" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
    )
  return (
    <>
      <circle cx="23.6" cy="29.6" r="2.1" fill={CHEEK} opacity="0.55" />
      <circle cx="36.4" cy="29.6" r="2.1" fill={CHEEK} opacity="0.55" />
      {eyes}
      {brows}
      {mouth}
    </>
  )
}

/** あたま: ほんものの 人と おなじく、どう の まんなか の 上に のる。 */
function Head({ mood, dx, tilt }: { readonly mood: Mood; readonly dx: number; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={[30, 36]}>
      <circle cx="19.6" cy="25.4" r="2.1" fill={SKIN_SHADE} />
      <circle cx="40.4" cy="25.4" r="2.1" fill={SKIN_SHADE} />
      <circle cx="30" cy="24.4" r="10.6" fill={SKIN} />
      <path d="M19.2 23 C17.6 11.6 26.4 8.2 31 8.4 C38.4 8.8 43 14 40.8 23 C38.2 18.4 33.4 16.2 28.6 16.6 C24.6 17 21.4 19.6 19.2 23 Z" fill={HAIR} />
      <path d="M29.6 9.2 Q30.4 5.6 32.4 7.2 Q33.6 4.6 34.8 7.6" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Face mood={mood} dx={dx} />
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

/** かた から ひじ、手くび へ つながる うで。そでが かたがわ を おおい、ひじ から 先は はだ。 */
function ArmLimb({ shoulder, sign, angles }: { readonly shoulder: Point; readonly sign: 1 | -1; readonly angles: Angles }) {
  const { elbow, wrist } = joints(shoulder, sign, angles)
  const sleeve: Point = [shoulder[0] + (elbow[0] - shoulder[0]) * 0.5, shoulder[1] + (elbow[1] - shoulder[1]) * 0.5]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${wrist[0]} ${wrist[1]}`} fill="none" stroke={SKIN} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${sleeve[0]} ${sleeve[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5.8" strokeLinecap="round" />
    </>
  )
}

function Child({ t }: SceneProps) {
  // あるいてくる: 左から ひろばの まんなかへ。あしを かわりばんこに あげる
  const arriving = 1 - span(t, STOP - 0.3, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * arriving
  const walkX = mix(t, WALK, STOP, -50, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2
  // うれしくて 2かい はねる(ズームの前に おわる)
  const hopping = t >= JOY && t < JOY + HOP_LEN
  const hop = hopping ? -Math.abs(Math.sin(((t - JOY) / (HOP_LEN / 2)) * Math.PI)) * 2.4 : 0

  const mood: Mood = t < STOP ? 'smile' : t < COUNT_AT - 0.4 ? 'wonder' : t < JOY ? 'count' : 'joy'
  const dx = t < STOP ? 0.3 : t < JOY ? 1.2 : 0
  const tilt = t < STOP ? 0 : t < RAISE ? 6 : t < JOY ? 3 : 0

  // 右手: おろす → あげる(ひじ から先が おくれて ついてくる)。5ほん ひらいたら ちょっと ふる
  const up = span(t, RAISE, RAISE + 0.7, easeInOut)
  const foreUp = span(t, RAISE + 0.1, RAISE + 0.8, easeInOut)
  const shake = wave(t, 0.36) * 3.5 * during(t, JOY + 0.2, JOY + HOP_LEN - 0.1, 0.1)
  const near: Angles = {
    upper: HANG.upper + stride * 6 + (RAISED.upper - HANG.upper) * up,
    fore: HANG.fore + stride * 6 + (RAISED.fore - HANG.fore) * foreUp + shake,
  }
  // 左手: ふだんは たらして、うれしい ときに ばんざい
  const cheer = span(t, JOY + 0.05, JOY + 0.4, backOut)
  const far: Angles = {
    upper: HANG.upper - stride * 6 + (FAR_CHEER.upper - HANG.upper) * cheer,
    fore: HANG.fore - stride * 6 + (FAR_CHEER.fore - HANG.fore) * cheer,
  }

  const ext = [0, 1, 2, 3, 4].map((i) => span(t, COUNT_AT + COUNT_GAP * i, COUNT_AT + COUNT_GAP * i + 0.25, backOut))
  const fan = 0.7 + 0.55 * span(t, JOY, JOY + 0.3, backOut)
  const nearWrist = joints(SHOULDER_NEAR, 1, near).wrist
  const farWrist = joints(SHOULDER_FAR, -1, far).wrist

  return (
    <>
      <ellipse cx="30" cy="96.8" rx="12" ry="2.2" fill="#000000" opacity="0.12" transform={`translate(${walkX} 0)`} />
      <Layer x={walkX} y={bob + hop}>
        <ArmLimb shoulder={SHOULDER_FAR} sign={-1} angles={far} />
        <circle cx={farWrist[0]} cy={farWrist[1]} r="3" fill={SKIN} />
        {/* あし: ひだり・みぎ を かわりばんこに あげる */}
        <Layer y={-Math.max(0, stride) * 2.2}>
          <rect x="23.4" y="60" width="6.2" height="33" rx="3.1" fill={PANTS} />
          <ellipse cx="26" cy="94.2" rx="5.2" ry="2.6" fill={SHOE} />
        </Layer>
        <Layer y={-Math.max(0, -stride) * 2.2}>
          <rect x="30.4" y="60" width="6.2" height="33" rx="3.1" fill={PANTS} />
          <ellipse cx="34" cy="94.2" rx="5.2" ry="2.6" fill={SHOE} />
        </Layer>
        {/* くび: みじかく、どう と あたま の すきま だけ */}
        <rect x="27.4" y="32.5" width="5.2" height="6" rx="2.2" fill={SKIN_SHADE} />
        <rect x="22" y="36" width="16" height="29" rx="6.5" fill={SHIRT} />
        <path d="M23.4 59.6 h13.2" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <ArmLimb shoulder={SHOULDER_NEAR} sign={1} angles={near} />
        <Layer x={nearWrist[0]} y={nearWrist[1]} rotate={180 - near.fore}>
          <Hand ext={ext} fan={fan} />
        </Layer>
        <Head mood={mood} dx={dx} tilt={tilt} />
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

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  // カメラ: こどもの手に ズームして、手が 字の大きさに なる
  const zoom = span(t, ZOOM_FROM, ZOOM_TO, easeInOut)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Layer x={(HAND_GOAL[0] - HAND_CENTER[0]) * zoom} y={(HAND_GOAL[1] - HAND_CENTER[1]) * zoom} scale={1 + (ZOOM - 1) * zoom} origin={HAND_CENTER}>
          <Ground t={t} />
          <Party t={t} />
          <Child t={t} />
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
