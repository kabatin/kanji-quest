/*
 * 冬(ふゆ): あしの したに こおりが はる。さむい きせつ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … つるっと すべった子の、左うで(バランスを とって ななめ下へ ひろげる)
 *   2画目(ノ)  … 右うで(上へ ばんざい)から、左へ ひらいた あし(夂の あし)
 *   3画目(ヽ)  … 右へ ひらいた あし
 *   4・5画目   … あしの下の こおりの ぴかぴか(つるつるの つや)
 *
 * ながれ
 *   雪の日。子どもが 池の むこうぎしで ぶるぶる ふるえる(いきが 白い)
 *   → 池の ふちから こおりが はって、まんなかまで 池ぜんぶが こおる
 *   → 子どもは 「こおった!」と にっこり、こおりの上を こちらへ あるいてくる
 *   → つるっ! あしが 左右に ひらいて、うでを ばたばた。あしの下は つるつるの こおり
 *   → ほね が ひかって、絵が うすくなり、字「冬」が のこる
 *
 * 子どもは Person(正面)。むこうぎしから こちらへは walkDepth で あるく(ちかづくので 大きくなる)。
 * さむい ときは りょううでで 自分を だきしめる({ to, depth })。
 * すべる ときは、あしを 同じ 長さの まま 左右へ ひらく(まえを むいたまま)。字の形に なるのは さいごの しゅんかん だけ。
 */
import { during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, CLOTHES, HANG_ARM, LOOKS, Notice, PineTree, Person, STRAIGHT_LEG, Sigh, Snowfall, mixLimb, personRig, walkDepth, type PersonPose } from '../sceneFigures'

const CHAR = '冬'

const HILL_FAR = '#d3e4f3'
const HILL = '#f2f8fd'
const SNOW = '#f7fbff'
const WATER = '#6fb8ea'
const ICE = '#d9f0ff'
const ICE_LIGHT = '#f0faff'
const RIM = '#ffffff'

/** くぎり の時間(秒) */
/** 池が ふちから こおりはじめる・ぜんぶ こおる */
const FREEZE = 0.9
const FROZEN = 2.8
/** 「こおった!」と よろこぶ */
const JOY = 2.9
/** こちらへ あるいてくる */
const WALK = 3.5
const ARRIVE = 5.6
/** つるっ と すべる */
const SLIP = 5.7
const INK = 6.9
const DONE = 9.7
const DURATION = 10.4

/** 池(だえん)。まんなか と はんけい */
const POND = { cx: 54, cy: 80, rx: 56, ry: 20 } as const
/** 子どもが こおりの 上を あるく みち(足もと)。むこうぎし から まんなか の てまえへ */
const FAR_FEET: readonly [number, number] = [62, 64]
const NEAR_FEET: readonly [number, number] = [48, 90]
const FAR_HEIGHT = 26
const NEAR_HEIGHT = 46

const KID_LOOK = { ...LOOKS.boy, top: CLOTHES.red.top, bottom: '#3e5c86', hat: 'knit', hatColor: '#4f9be0', hair: '#5a3b2a' } as const

const ellipsePath = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`

/** ゆきの けしき。くもりぞら と、むこうの おか・もみの木 の 上に、雪の のはら */
function SnowyLand({ t }: SceneProps) {
  return (
    <>
      <Backdrop t={t} sun={null} tufts={[]} overcast={0.8} />
      <path d="M-4 60 Q18 40 42 52 Q60 38 82 50 Q98 44 113 56 V70 H-4 Z" fill={HILL_FAR} />
      <PineTree x={8} y={56} height={22} />
      <PineTree x={101} y={56} height={26} />
      <path d="M-4 62 Q20 52 46 60 Q72 50 113 62 V109 H-4 Z" fill={HILL} />
      <rect x="-4" y="64" width="117" height="50" fill={SNOW} />
    </>
  )
}

/** 池。ふちから こおりが はって、まんなかの みずが なくなる。つるつるの つや(4・5画目)も 出る。 */
function FrozenPond({ t }: SceneProps) {
  const freeze = span(t, FREEZE, FROZEN, easeInOut)
  const water = Math.max(0.001, 1 - freeze)
  const shine = span(t, FROZEN - 0.9, FROZEN + 0.3, easeOut)
  const core = span(t, FREEZE + 1.2, FROZEN)
  return (
    <>
      <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} fill={WATER} />
      {/* こおり: 外のだえん から、のこった みず の だえん を くりぬく */}
      <path d={`${ellipsePath(POND.cx, POND.cy, POND.rx, POND.ry)} ${freeze < 1 ? ellipsePath(POND.cx, POND.cy, POND.rx * water, POND.ry * water) : ''}`} fill={ICE} fillRule="evenodd" />
      <ellipse cx={POND.cx} cy={POND.cy - 4} rx={POND.rx * 0.62 * core} ry={POND.ry * 0.45 * core} fill={ICE_LIGHT} opacity="0.8" />
      <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} fill="none" stroke={RIM} strokeWidth="2.2" />
      {/* 氷の つや: あしの下で ぴかっと ひかる */}
      <Bone char={CHAR} n={4} color="#ffffff" width={2.6} to={shine} />
      <Bone char={CHAR} n={5} color="#ffffff" width={2.6} to={shine} />
    </>
  )
}

/** こおった しゅんかん の きらっ。線の よこ ではなく、はしの ほうに 小さく。 */
function IceGlints({ t }: SceneProps) {
  const show = during(t, FROZEN - 0.4, WALK + 0.4, 0.3)
  if (show <= 0) return null
  const spots: ReadonlyArray<readonly [number, number, number]> = [
    [10, 86, 2.6],
    [98, 80, 3],
    [82, 94, 2.2],
    [24, 94, 2],
  ]
  return (
    <g opacity={show}>
      {spots.map(([cx, cy, r], i) => (
        <Star key={i} cx={cx} cy={cy} r={r * (0.8 + 0.2 * wave(t, 0.9, i * 0.3))} color="#ffffff" spin={i * 20} />
      ))}
    </g>
  )
}

/** 子の ふるまい。さむい → よろこぶ → あるく → すべる を、1人の Person の 手足 として まとめる */
function kidAt(t: number) {
  const w = walkDepth(t, { from: FAR_FEET, to: NEAR_FEET, start: WALK, end: ARRIVE, height: FAR_HEIGHT, toHeight: NEAR_HEIGHT, armSwing: 14 })
  const slip = span(t, SLIP, SLIP + 0.5, easeOut)
  const flutter = wave(t, 0.4) * 8 * span(t, SLIP + 0.5, INK) * (1 - span(t, INK - 0.3, INK))
  const hug = 1 - span(t, JOY, JOY + 0.4)

  // さむくて 自分を だきしめる うで(てまえへ まわして、むねの 前で 交差)
  const chest = personRig({ ...w, pose: {} }).world.neck
  const h = w.height
  const hugLeft = { to: [chest[0] - 0.1 * h, chest[1] + 0.2 * h], depth: 0.12 * h } as const
  const hugRight = { to: [chest[0] + 0.1 * h, chest[1] + 0.16 * h], depth: 0.14 * h } as const
  const leftWalk = mixLimb(w.pose.leftArm ?? HANG_ARM, hugLeft, hug)
  const rightWalk = mixLimb(w.pose.rightArm ?? HANG_ARM, hugRight, hug)

  // すべって あしが ひらき、うでを ばたばた(左うでは 1画目、右うでは 2画目の はじ)
  const pose: PersonPose = {
    ...w.pose,
    leftArm: mixLimb(leftWalk, { swing: 62 + flutter, bend: 14 }, slip),
    rightArm: mixLimb(rightWalk, { swing: 128 - flutter, bend: 12 }, slip),
    leftLeg: mixLimb(w.pose.leftLeg ?? STRAIGHT_LEG, { swing: 36, bend: 0 }, slip),
    rightLeg: mixLimb(w.pose.rightLeg ?? STRAIGHT_LEG, { swing: 40, bend: 0 }, slip),
    head: slip * 6 + (t < JOY ? -3 : 0),
  }
  // さむい間は ぶるぶる。「こおった!」で ぴょん と はねる
  const shiver = t < JOY ? wave(t, 0.11) * 0.5 : 0
  const hop = Math.sin(span(t, JOY, JOY + 0.45) * Math.PI) * 3.2
  const face = t < JOY ? 'strain' : t < SLIP ? 'smile' : 'surprised'
  return { place: { ...w, x: w.x + shiver, lift: hop, pose }, face } as const
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)
  const { place, face } = kidAt(t)
  const head = personRig(place).world.head
  const breathPhase = (t - 0.3) / 1.4
  const breath = breathPhase - Math.floor(breathPhase)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <SnowyLand t={t} />
        <FrozenPond t={t} />
        <IceGlints t={t} />
        <Person {...place} look={KID_LOOK} face={face} />
        {/* さむい いき の しろい「ふう」 */}
        <Sigh x={head[0] - 4} y={head[1] + 4} p={breath} show={t > 0.3 && t < JOY ? 1 : 0} />
        {/* すべった しゅんかんの「!」。字の線から はなして、あたまの ななめ上に */}
        <Notice x={head[0] - 9} y={head[1] - 15} r={3} show={during(t, SLIP, INK + 0.1, 0.1)} dir={-1} />
        <Snowfall t={t} amount={0.7} ground={100} />
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
    { at: 0, label: '雪の日。子どもが ぶるぶる ふるえる', sound: 'pop' },
    { at: FREEZE, label: '池の ふちから こおりが はる' },
    { at: JOY, label: '池ぜんぶ こおった! にっこり', sound: 'pop' },
    { at: WALK, label: 'こおりの上を こちらへ あるいてくる' },
    { at: SLIP, label: 'つるっ! あしが ひらく。あしの下は つるつるの こおり', sound: 'tap' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '冬 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
