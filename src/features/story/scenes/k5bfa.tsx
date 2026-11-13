/*
 * 寺(てら): 土の おやま に たつ おてら。手を あわせて おまいり。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … おてらの 上の やね の ひさし(せまい ほう)
 *   2画目(丨)  … やね の てっぺん に たつ かざり(ほうじゅ の とう)
 *   3画目(一)  … 下の やね の ひさし(ひろい ほう)
 *   4画目(一)  … おてらが たつ 石の だん(土の おやま の うえ)
 *   5画目(亅)  … おまいり している 子ども の 体(あたま から あし、さきは つま先)
 *   6画目(丶)  … 子どもが なげた おさいせん の 小ぜに(おさいせんばこ に おちる)
 *
 * ながれ
 *   土の おやま が もりあがり、おてらが ぽん と たつ
 *   → こまった かお の 子が あるいてくる(あたまの上に もやもや)
 *   → おさいせんを ぽいっ。ちゃりん と はこに おちる
 *   → 手を あわせ、目を とじて ぺこり と おまいり
 *   → もやもやが はれて にっこり(おてらの とびらが ぽっと あかるく、小鳥が やねに とまる)
 *   → 子どもの すがた・やね・石の だん に ほね が ひかって、絵が うすくなり、字「寺」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   よこ むき。うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   手を あわせるときは、りょううで が まえで ひじ から まがって 手 が むねの前で あわさる。
 *   おてらは とおくに あるので 小さく、子どもは てまえに いるので 大きく 見える。
 *   小ぜに は ほんもの の ように 山なりに とんで、はこに おちる。
 *   (6画目の 点は、字と ぴったり重ならなくても、小ぜにの おちる ばしょ の だいたい おなじ あたり)
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '寺'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ee8b4f'
const TUNIC_DARK = '#d9733a'
const TUNIC_FAR = '#b95f2e'
const PANTS = '#4a6a9a'
const PANTS_DARK = '#3b5885'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const EARTH = '#b98a5e'
const EARTH_DARK = '#a2744b'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const STONE = '#c3beb2'
const ROOF = '#5f6e82'
const ROOF_LIGHT = '#74849a'
const EAVE = '#3f4a5c'
const WALL = '#f6e6c4'
const PILLAR = '#c8463d'
const DOOR = '#6a3f2c'
const GOLD = '#e0a82e'
const COIN = '#ffc233'
const WORRY = '#8a8fa8'

/** くぎり の時間(秒) */
const WALK = 0.7
const STOP = 2.3
/** おさいせんを とりだし、ぽいっ と なげ、はこに おちる */
const TAKE = 3.1
const TOSS = 3.65
const LAND = 4.3
/** 手を あわせ、ぺこり と おじぎして、あたまを あげる */
const PRAY = 5.0
const BOW_UP = 5.8
const SMILE = 5.9
const INK = 6.6
const DONE = 9.6
const DURATION = 10

/** 子どもの すがた(よこむき・左むき)の 大事な ばしょ。5画目の線の上に のせる */
const BODY_X = 67.6
const SHOULDER: readonly [number, number] = [BODY_X, 62.8]
const HIP: readonly [number, number] = [BODY_X, 78]
const NECK: readonly [number, number] = [BODY_X, 60]
const UPPER_ARM = 8.6
const FORE_ARM = 8
/** おさいせんばこ の すきま(ここに 小ぜにが おちる) */
const SLOT: readonly [number, number] = [44, 83.5]
/** 小ぜにが 手を はなれる ばしょ */
const TOSS_FROM: readonly [number, number] = [56.5, 61]

type Mood = 'worried' | 'pray' | 'happy'

/** うで の かっこう。up = ま下から まえ(左)へ ふった角度 / fore = ひじから先の 角度(ま下から。90 を こえると 上むき) */
type ArmPose = { readonly up: number; readonly fore: number }
type Frame = readonly [time: number, up: number, fore: number]

const HANG: ArmPose = { up: 3, fore: 14 }

/** かぎ になる かっこう を 時間で つないだ うで の うごき */
function armAt(t: number, frames: readonly Frame[]): ArmPose {
  const first = frames[0]
  if (t <= first[0]) return { up: first[1], fore: first[2] }
  for (let i = 0; i < frames.length - 1; i += 1) {
    const [t0, up0, fore0] = frames[i]
    const [t1, up1, fore1] = frames[i + 1]
    if (t < t1) {
      const k = span(t, t0, t1, easeInOut)
      return { up: up0 + (up1 - up0) * k, fore: fore0 + (fore1 - fore0) * k }
    }
  }
  const last = frames[frames.length - 1]
  return { up: last[1], fore: last[2] }
}

/** かた → ひじ → 手 の ばしょ */
function armPoints(pose: ArmPose): { readonly elbow: readonly [number, number]; readonly hand: readonly [number, number] } {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.up)) * UPPER_ARM, SHOULDER[1] + Math.cos(rad(pose.up)) * UPPER_ARM] as const
  const hand = [elbow[0] - Math.sin(rad(pose.fore)) * FORE_ARM, elbow[1] + Math.cos(rad(pose.fore)) * FORE_ARM] as const
  return { elbow, hand }
}

/** 近い ほうの うで の うごき: あるく → おさいせんを とる → なげる → 手を あわせる */
function nearFrames(): readonly Frame[] {
  return [
    [STOP, HANG.up, HANG.fore],
    [TAKE, 38, 115],
    [TOSS - 0.25, 38, 115],
    [TOSS, 56, 150],
    [LAND, 6, 16],
    [PRAY, 14, 127],
  ]
}

/** とおい ほうの うで: おさいせんの間は たらして、さいごに 手を あわせる */
function farFrames(): readonly Frame[] {
  return [
    [STOP, HANG.up, HANG.fore],
    [LAND, HANG.up, HANG.fore],
    [PRAY, 12, 122],
  ]
}

function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="63.4" cy="57.4" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d="M62.9 52.4 l3.2 -1.1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="64.6" cy="54.8" r="1" fill="#2b2b2b" />
          <path d="M62.6 59.2 q1.2 -1.1 2.4 0" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'pray' && (
        <>
          <path d="M63.2 54.8 Q64.7 56.3 66.2 54.8" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M62.9 58.2 Q64.3 59.2 65.6 58.2" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M63.2 55.6 Q64.8 53.4 66.4 55.6" fill="none" stroke="#2b2b2b" strokeWidth="1.15" strokeLinecap="round" />
          <path d="M62.7 57.8 Q64.5 61.4 66.4 57.8 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  /** おじぎ の角度(まえ(左)へ たおれると マイナス) */
  readonly bow: number
}

/** 左むきの 子ども。あたま・どう・あし が 5画目の 線の上に ならぶ。 */
function Child({ step, mood, nearArm, farArm, headTilt, bow }: ChildProps) {
  return (
    <>
      {/* あし: こしから ふる。とおい ほう は 少し うしろ */}
      <Layer rotate={-step * 20} origin={HIP}>
        <rect x="66.6" y="77" width="5" height="15.5" rx="2.5" fill={PANTS_DARK} />
        <ellipse cx="66" cy="93.4" rx="5" ry="2.5" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 20} origin={HIP}>
        <rect x="64.6" y="77" width="5.2" height="15.5" rx="2.6" fill={PANTS} />
        <ellipse cx="63.2" cy="93.4" rx="5" ry="2.5" fill={SHOE} />
      </Layer>
      {/* うえの 体: こし を じく に、おじぎ する */}
      <Layer rotate={bow} origin={HIP}>
        <Arm pose={farArm} color={TUNIC_FAR} />
        {/* くび: みじかく、どう と あたま の 間 */}
        <rect x="65.8" y="57.6" width="3.8" height="5" rx="1.8" fill={SKIN_SHADE} />
        <rect x="62.6" y="60.2" width="10" height="20.5" rx="5" fill={TUNIC} />
        <path d="M63.4 75.4 h8.4" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Arm pose={nearArm} color={TUNIC_DARK} />
        <Layer rotate={headTilt} origin={NECK}>
          <circle cx={BODY_X} cy="54.4" r="5.7" fill={SKIN} />
          <path d="M62.2 53 C61.6 47.8 66 46.2 69.6 46.9 C73.8 47.6 74.8 52.4 73.2 56.8 C72.2 53 69 51 65.4 51.5 C64 51.7 62.8 52.2 62.2 53 Z" fill={HAIR} />
          <path d="M66.4 47.2 Q67 44.6 68.6 46.2" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
          <Face mood={mood} />
        </Layer>
      </Layer>
    </>
  )
}

/** あたまの 上の もやもや(こまりごと)。 */
function WorryCloud({ t }: SceneProps) {
  const grow = span(t, WALK + 0.2, WALK + 0.6, backOut) * (1 - span(t, BOW_UP, SMILE + 0.4, easeIn))
  if (grow <= 0.01) return null
  const wobble = wave(t, 1.3) * 0.8
  return (
    <Layer scale={grow} y={wobble} origin={[67.5, 48]}>
      <rect x="61" y="45.4" width="13" height="3.2" rx="1.6" fill={WORRY} />
      <circle cx="63.6" cy="46" r="3" fill={WORRY} />
      <circle cx="67.8" cy="44" r="3.8" fill={WORRY} />
      <circle cx="71.6" cy="46.2" r="3" fill={WORRY} />
    </Layer>
  )
}

/** もやもや が はれて、きんいろの ほし に かわる。 */
function Relief({ t }: SceneProps) {
  const p = span(t, BOW_UP, SMILE + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p ** 2}>
      <Star cx={67.5} cy={44 - p * 5} r={1.5 + p * 3.4} color={COIN} spin={p * 120} />
      <Star cx={61 - p * 4} cy={47 - p * 2} r={1 + p * 1.8} color="#ffffff" spin={-p * 90} />
      <Star cx={74 + p * 4} cy={47 - p * 3} r={1 + p * 1.8} color="#ffffff" spin={p * 90} />
    </g>
  )
}

/** あるいている間の あせ。体の うしろ(右)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.3, TOSS, 0.25)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.8 0.5 0 1.8 Q-1.8 0.5 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${75 + p * 5} ${50 + p * 6 - Math.sin(p * Math.PI) * 4}) rotate(30)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** おさいせんの 小ぜに。てのひら → 山なりに とんで → はこの すきまへ。 */
function Coin({ t }: SceneProps) {
  const held = t >= TAKE - 0.5 && t < TOSS
  const flying = t >= TOSS && t < LAND
  if (!held && !flying) return null
  let x: number
  let y: number
  if (held) {
    const { hand } = armPoints(armAt(t, nearFrames()))
    x = hand[0] - 1
    y = hand[1] - 3
  } else {
    // 山なりに とぶ(さいしょは うえに、そのあと おちる)
    const p = span(t, TOSS, LAND)
    x = TOSS_FROM[0] + (SLOT[0] - TOSS_FROM[0]) * p
    y = TOSS_FROM[1] - 24 * p + (SLOT[1] - TOSS_FROM[1] + 24) * p * p
  }
  const turn = Math.abs(Math.cos(t * 14))
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" rx={Math.max(0.4, 2.7 * turn)} ry="2.7" fill={COIN} />
      <ellipse cx="0" cy="0" rx={Math.max(0.2, 1.3 * turn)} ry="1.3" fill="#fff0a8" />
    </g>
  )
}

/** ちゃりん! はこに おちた しゅんかん の ひかり。 */
function Chime({ t }: SceneProps) {
  const p = span(t, LAND, LAND + 0.7, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <circle cx={SLOT[0]} cy={SLOT[1]} r={2 + p * 7} fill="none" stroke={COIN} strokeWidth="1.2" />
      <Star cx={SLOT[0] - 2 - p * 4} cy={SLOT[1] - 3 - p * 5} r={2.2 - p} color={COIN} spin={p * 90} />
      <Star cx={SLOT[0] + 4 + p * 4} cy={SLOT[1] - 2 - p * 4} r={1.8 - p * 0.8} color="#ffffff" spin={-p * 90} />
    </g>
  )
}

/** おさいせんばこ。うえの すきま に 小ぜにが おちる。 */
function OfferingBox({ t }: SceneProps) {
  const pop = span(t, 0.5, 1.0, backOut)
  // ちゃりん の とき、はこが ちょっと はずむ
  const jolt = Math.sin(span(t, LAND, LAND + 0.25) * Math.PI) * 0.5
  return (
    <Layer scale={pop} y={-jolt} origin={[41, 95]}>
      <rect x="31" y="86" width="22" height="9" rx="1.6" fill={BARK} />
      <path d="M34 88 v6 M41 88 v6 M48 88 v6" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
      <rect x="29" y="82" width="26" height="5" rx="1.8" fill={BARK_DARK} />
      <rect x="37" y="82.9" width="14" height="1.6" rx="0.8" fill="#2f1c10" />
    </Layer>
  )
}

/** おやま(土)・そら・くも・お日さま。 */
function Land({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  const rise = span(t, 0, 0.55, backOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="22" rx="7" ry="3.2" />
        <ellipse cx="3" cy="20.4" rx="5" ry="3.2" />
        <ellipse cx="96" cy="24" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="22.4" rx="4.4" ry="3" />
      </g>
      {/* 土の おやま: 下から もりあがる。てっぺんは たいら(おてらを のせる ところ) */}
      <Layer scaleY={rise} origin={[55, 99]}>
        <path d="M-4 100 Q8 70 26 66.5 H84 Q102 70 113 100 Z" fill={EARTH} />
        <path d="M10 76 Q16 69.4 26 67 H84 Q94 69.4 100 76 Q90 71.6 84 71.4 H26 Q20 71.6 10 76 Z" fill={LEAF} />
        <ellipse cx="22" cy="84" rx="2.6" ry="1.2" fill={EARTH_DARK} />
        <ellipse cx="90" cy="86" rx="3" ry="1.3" fill={EARTH_DARK} />
        <ellipse cx="78" cy="93" rx="2.4" ry="1.1" fill={EARTH_DARK} />
      </Layer>
      <ellipse cx="54.5" cy="98.4" rx="51" ry="5" fill={GRASS} opacity={rise} />
    </>
  )
}

/** おてら: 石の だん・かべ・ふたつの やね・てっぺんの かざり。とびらは おまいりの あと ぽっと あかるい。 */
function Temple({ t }: SceneProps) {
  const appear = span(t, 0.25, 0.85, backOut)
  const glow = span(t, SMILE, SMILE + 0.7, easeOut)
  return (
    <Layer scale={appear} origin={[55, 66]}>
      {/* やね の てっぺんの かざり(2画目): やねの うしろ から のびる */}
      <Bone char={CHAR} n={2} color={GOLD} width={2.2} />
      <circle cx="52.6" cy="8.6" r="2.4" fill={GOLD} />
      {/* かべ と はしら と とびら */}
      <rect x="25" y="44" width="59" height="19" fill={WALL} />
      <rect x="25" y="44" width="3.4" height="19" fill={PILLAR} />
      <rect x="80.6" y="44" width="3.4" height="19" fill={PILLAR} />
      <rect x="33" y="50" width="9" height="8" rx="1" fill="#d9b98a" />
      <path d="M37.5 50 v8 M33 54 h9" stroke={BARK_DARK} strokeWidth="0.8" />
      <rect x="46" y="49" width="17" height="14" rx="1.2" fill={DOOR} />
      <rect x="46" y="49" width="17" height="14" rx="1.2" fill="#ffe28a" opacity={glow} />
      <path d="M54.5 49 v14" stroke={BARK_DARK} strokeWidth="0.9" opacity={1 - glow * 0.6} />
      {/* 下の やね(3画目の ひさし)と、上の やね(1画目の ひさし) */}
      <path d="M10 46 L28 29 H81 L97 45 Z" fill={ROOF} />
      <path d="M20 40 L32 31 M40 31 L36 40 M58 31 L56 40 M76 31 L78 40 M90 42 L82 32" stroke={ROOF_LIGHT} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <Bone char={CHAR} n={3} color={EAVE} width={3.4} />
      <path d="M29 28 L43 14 H66 L80 27 Z" fill={ROOF} />
      <path d="M45 24 L47 16 M56 24 L57 16 M67 24 L63 16" stroke={ROOF_LIGHT} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <Bone char={CHAR} n={1} color={EAVE} width={3.4} />
      {/* 石の だん(4画目): おやま の てっぺん */}
      <Bone char={CHAR} n={4} color={STONE} width={4.4} />
    </Layer>
  )
}

/** おまいりの あと、おてらが ほわっと あかるく なる。 */
function Halo({ t }: SceneProps) {
  const p = span(t, SMILE, SMILE + 0.8, easeOut)
  if (p <= 0) return null
  return <ellipse cx="54.5" cy="40" rx="46" ry="30" fill="#fff3b0" opacity={0.5 * p} />
}

/** おまいりが おわって、小鳥が やねに とんできて とまる。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, SMILE + 0.1, SMILE + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 57
  const y = 0 + arrive * 11 - Math.sin(arrive * Math.PI) * 6
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // あるく: 右の はしから 入ってきて、はこの よこで とまる
  const walking = 1 - span(t, STOP - 0.3, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, STOP, 58, 0, easeOut)
  const bob = -Math.abs(stride) * 1.4
  const mood: Mood = t < LAND ? 'worried' : t < SMILE ? 'pray' : 'happy'

  // うで: あるくときは あしと ぎゃくに ふる。とまると、おさいせん → 手を あわせる
  const walkArm = (sign: number): ArmPose => ({ up: HANG.up - sign * stride * 26, fore: HANG.fore - sign * stride * 26 })
  const nearArm = t < STOP ? walkArm(1) : armAt(t, nearFrames())
  const farArm = t < STOP ? walkArm(-1) : armAt(t, farFrames())
  // おじぎ: 手を あわせたまま、こし から まえへ ぺこり
  const bow = -16 * (span(t, PRAY - 0.2, PRAY + 0.4, easeInOut) - span(t, BOW_UP - 0.1, BOW_UP + 0.5, easeInOut))
  const headTilt = -8 * (1 - span(t, TOSS - 0.3, TOSS + 0.3)) + (t >= SMILE ? 2 : 0)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Land t={t} />
        <Halo t={t} />
        <Temple t={t} />
        <OfferingBox t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={66 + walkX} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} bow={bow} />
            <WorryCloud t={t} />
            <Sweat t={t} />
          </Layer>
          <Relief t={t} />
        </Layer>
        <Coin t={t} />
        <Chime t={t} />
        <Bird t={t} />
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
    { at: 0, label: '土の おやま に おてらが たつ', sound: 'pop' },
    { at: WALK, label: 'こまった顔の 子が あるいてくる' },
    { at: TAKE, label: 'おさいせんを ぽいっ' },
    { at: LAND, label: 'ちゃりん! 手を あわせて おまいり', sound: 'pop' },
    { at: SMILE, label: 'もやもやが はれて にっこり。小鳥が とまる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '寺 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
