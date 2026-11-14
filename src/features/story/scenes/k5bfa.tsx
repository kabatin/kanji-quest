/*
 * 寺(てら): 土の おやま に たつ おてら。手を あわせて おまいり。(共通部品 sceneFigures で 書きなおした もの)
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … おてらの 上の やね の ひさし(せまい ほう)
 *   2画目(丨)  … やね の てっぺん に たつ かざり(ほうじゅ の とう)
 *   3画目(一)  … 下の やね の ひさし(ひろい ほう)
 *   4画目(一)  … おてらが たつ 石の だん(土の おやま の うえ)
 *   5画目(亅)  … おまいり している 子ども の 体(あたま から あし)
 *   6画目(丶)  … 子どもが なげた おさいせん の 小ぜに(おさいせんばこ に おちる)
 *   ※ 子どもは ほんものの つくり を優先。5・6画目とは「だいたい」同じ あたり
 *
 * ながれ
 *   土の おやま が もりあがり、おてらが ぽん と たつ
 *   → こまった かお の 子が あるいてくる(あたまの上に もやもや)
 *   → おさいせんを ぽいっ。ちゃりん と はこに おちる
 *   → 手を あわせ、目を とじて ぺこり と おまいり
 *   → もやもやが はれて にっこり(おてらの とびらが ぽっと あかるく、小鳥が やねに とまる)
 *   → 子どもの すがた・やね・石の だん に ほね が ひかって、絵が うすくなり、字「寺」が のこる
 *
 * 子は Person(左むき)。あるきは walk()。手を あわせるのは 両手を むねの 前の 点へ { to }。
 * おてらは とおくに あるので 小さく、子どもは てまえに いるので 大きく 見える。
 * 小ぜには 山なりに とんで はこに おちる(6画目は 字と ぴったり重ならなくてよい)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Bird, HANG_ARM, LOOKS, Meadow, mixLimb, Person, personRig, Sweat, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '寺'

const LOOK = { ...LOOKS.boy, top: '#ee8b4f', bottom: '#4a6a9a' } as const
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const EARTH = '#b98a5e'
const EARTH_DARK = '#a2744b'
const LEAF = '#55b86e'
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

const GROUND = 96
const KID_H = 50
/** 子どもの こし の x(5画目の 線の 近く) */
const BODY_X = 67.6
/** おさいせんばこ の すきま(ここに 小ぜにが おちる) */
const SLOT: readonly [number, number] = [44, 83.5]

type Pt = readonly [number, number]

/** 子どもの かっこう。左むき。あるく → おさいせん → なげる → 手を あわせて おじぎ → にっこり */
function kidAt(t: number): PersonProps {
  const w = walk(t, { from: 125, to: BODY_X, start: WALK, end: STOP, build: 'child', height: KID_H, armSwing: 14 })
  const bow = 22 * (span(t, PRAY - 0.2, PRAY + 0.4, easeInOut) - span(t, BOW_UP - 0.1, BOW_UP + 0.5, easeInOut))
  const base = { x: w.x, y: GROUND, build: 'child', height: KID_H, look: LOOK, facing: 'left' } as const
  // 手を あわせる 点: おじぎ した 上体の むねの 前(右むき の 形は 左むきで 点が 左へ)
  const rig = personRig({ ...base, pose: { torso: bow } })
  const prayPt: Pt = [rig.world.neck[0] - 5, rig.world.neck[1] + 7]
  const pray = span(t, PRAY - 0.4, PRAY, easeInOut)

  const walkArm = (limb: Limb | undefined): Limb => limb ?? HANG_ARM
  let near: Limb = t < STOP ? walkArm(w.pose.rightArm) : HANG_ARM
  near = mixLimb(near, { swing: 45, bend: 95 }, span(t, STOP, TAKE, easeInOut))
  near = mixLimb(near, { swing: 110, bend: 25 }, span(t, TOSS - 0.25, TOSS, easeOut))
  near = mixLimb(near, HANG_ARM, span(t, TOSS + 0.1, LAND, easeInOut))
  near = mixLimb(near, { to: prayPt }, pray)
  let far: Limb = t < STOP ? walkArm(w.pose.leftArm) : HANG_ARM
  far = mixLimb(far, { to: prayPt }, pray)

  const face = t < LAND ? 'worried' : t < SMILE ? (t < PRAY ? 'normal' : 'closed') : 'joy'
  const head = -8 * (1 - span(t, TOSS - 0.3, TOSS + 0.3)) + (t >= SMILE ? 2 : 0)
  return { ...base, pose: t < STOP ? { ...w.pose, rightArm: near, leftArm: far, head } : { rightArm: near, leftArm: far, torso: bow, head }, face }
}

/** あたまの 上の もやもや(こまりごと)。 */
function WorryCloud({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const grow = span(t, WALK + 0.2, WALK + 0.6, backOut) * (1 - span(t, BOW_UP, SMILE + 0.4, easeIn))
  if (grow <= 0.01) return null
  const wobble = wave(t, 1.3) * 0.8
  return (
    <Layer scale={grow} x={x} y={y + wobble}>
      <rect x="-6.5" y="1.4" width="13" height="3.2" rx="1.6" fill={WORRY} />
      <circle cx="-3.9" cy="2" r="3" fill={WORRY} />
      <circle cx="0.3" cy="0" r="3.8" fill={WORRY} />
      <circle cx="4.1" cy="2.2" r="3" fill={WORRY} />
    </Layer>
  )
}

/** もやもや が はれて、きんいろの ほし に かわる。 */
function Relief({ t, x, y }: { readonly t: number; readonly x: number; readonly y: number }) {
  const p = span(t, BOW_UP, SMILE + 0.7)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p ** 2}>
      <Star cx={x} cy={y - p * 5} r={1.5 + p * 3.4} color={COIN} spin={p * 120} />
      <Star cx={x - 6.5 - p * 4} cy={y + 3 - p * 2} r={1 + p * 1.8} color="#ffffff" spin={-p * 90} />
      <Star cx={x + 6.5 + p * 4} cy={y + 3 - p * 3} r={1 + p * 1.8} color="#ffffff" spin={p * 90} />
    </g>
  )
}

/** おさいせんの 小ぜに。てのひら → 山なりに とんで → はこの すきまへ。 */
function Coin({ t, hand, from }: { readonly t: number; readonly hand: Pt; readonly from: Pt }) {
  const held = t >= TAKE - 0.5 && t < TOSS
  const flying = t >= TOSS && t < LAND
  if (!held && !flying) return null
  let x: number
  let y: number
  if (held) {
    x = hand[0]
    y = hand[1] - 2
  } else {
    // 山なりに とぶ(さいしょは うえに、そのあと おちる)
    const p = span(t, TOSS, LAND)
    x = from[0] + (SLOT[0] - from[0]) * p
    y = from[1] - 24 * p + (SLOT[1] - from[1] + 24) * p * p
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

/** 土の おやま: 下から もりあがる。てっぺんは たいら(おてらを のせる ところ) */
function Mound({ t }: SceneProps) {
  const rise = span(t, 0, 0.55, backOut)
  return (
    <>
      <Layer scaleY={rise} origin={[55, 99]}>
        <path d="M-4 100 Q8 70 26 66.5 H84 Q102 70 113 100 Z" fill={EARTH} />
        <path d="M10 76 Q16 69.4 26 67 H84 Q94 69.4 100 76 Q90 71.6 84 71.4 H26 Q20 71.6 10 76 Z" fill={LEAF} />
        <ellipse cx="22" cy="84" rx="2.6" ry="1.2" fill={EARTH_DARK} />
        <ellipse cx="90" cy="86" rx="3" ry="1.3" fill={EARTH_DARK} />
        <ellipse cx="78" cy="93" rx="2.4" ry="1.1" fill={EARTH_DARK} />
      </Layer>
      <g opacity={rise}>
        <Meadow y={98.4} tufts={[]} />
      </g>
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

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const kid = kidAt(t)
  const rig = personRig(kid)
  const head = rig.world.head
  const headR = rig.body.headR * rig.scale
  const tossHand = personRig(kidAt(TOSS)).world.arms.right.end

  // おまいりが おわって、小鳥が やねに とんできて とまる
  const arrive = span(t, SMILE + 0.1, SMILE + 0.9, easeOut)
  const landed = arrive >= 1
  const birdY = arrive * 11 - Math.sin(arrive * Math.PI) * 6 - (landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} tufts={[]} />
        <Mound t={t} />
        <ellipse cx="54.5" cy="40" rx="46" ry="30" fill="#fff3b0" opacity={0.5 * span(t, SMILE, SMILE + 0.8, easeOut)} />
        <Temple t={t} />
        <OfferingBox t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <Person {...kid} />
          <WorryCloud t={t} x={head[0]} y={head[1] - headR - 5} />
          <Sweat t={t} x={head[0] + headR} y={head[1] - 2} show={during(t, WALK + 0.3, TOSS, 0.25)} dir={1} />
          <Relief t={t} x={head[0]} y={head[1] - headR - 5} />
        </Layer>
        <Coin t={t} hand={rig.world.arms.right.end} from={tossHand} />
        <Chime t={t} />
        {arrive > 0 && <Bird x={118 - arrive * 57} y={birdY} t={t} flying={!landed} facing="left" />}
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
