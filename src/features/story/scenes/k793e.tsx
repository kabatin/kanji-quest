/*
 * 社(やしろ): 土を もりあげて、かみさまを まつる ばしょ。(共通部品 sceneFigures で 書きなおした)
 *
 * ほね(画と絵の対応)
 *   1画目(丶)  … かみさまの ひかり(ほこらの やねの 上に おりてくる)
 *   2画目(ネ)  … ほこらの やね と はこ(おおまかに 同じ場所)
 *   3画目(丨)  … ほこらを のせた はしら
 *   4画目(丶)  … かぜに なびく しろい かみの ひも(しで)
 *   5画目(一)  … 木の よこに のびた えだ
 *   6画目(丨)  … 木の みき(もりあげた 土の 上に そだつ)
 *   7画目(一)  … もりあげた 土の たいらな てっぺん
 *
 * ながれ
 *   ちいさな ほこらが できる → 子どもが あるいてきて、からっぽの ほこらを 見て こまった かお
 *   → スコップで 土を すくっては ほうり、3かい ほうって 土を もりあげる(あせを かく)
 *   → もりあげた 土に たねを うめると、木が ぐんぐん そだつ → 子どもは おおよろこび
 *   → 木と ほこらが そろうと、かみさまの ひかりが そらから おりてくる
 *   → 子どもは ほこらに むきなおって、てを あわせて おまいり → ほね が ひかって、絵が うすくなり 字「社」が のこる
 *
 * 子どもは Person。あるきは walk()、むき かえは turnAround()。
 * スコップは tools(ぼう)で 手に にぎらせ、さきの 金ぐ(はば の ひろい ところ)だけ 場面で 描く。
 * 字の画と 絵が 重なるのは、ひかりが おりてきた さいごの しゅんかん だけ(だいたい 同じ場所・同じ向き)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Backdrop, Canopy, Dust, HANG_ARM, LOOKS, mixLimb, PALETTE, Person, personRig, Sweat, turnAround, walk, type Expression, type Limb } from '../sceneFigures'

const CHAR = '社'

const TUNIC = '#f2a03d'
const EARTH = '#a9754a'
const EARTH_DARK = '#8d5d3a'
const EARTH_TOP = '#c9975f'
const SHRINE_WOOD = '#b07a4a'
const SHRINE_ROOF = '#b5503d'
const SHRINE_ROOF_LIGHT = '#d06a53'
const GLOW = '#fff3a8'
const SHOVEL_WOOD = '#b9854f'
const SHOVEL_IRON = '#9aa7b5'

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
const ARRIVE = 1.4
const TURN_DONE = 1.65
const DIG_FROM = 1.7
/** スコップの 1かい ぶん の 長さと、かいすう */
const CYCLE = 0.7
const SCOOPS = 3
/** スコップが つち を ほうりあげて から 土の 上に おちるまで */
const FLIGHT = 0.35
const SEED_FROM = 4.1
const SPROUT = 4.55
const GROW_DONE = 5.5
const JOY_FROM = 5.3
const ORB_FROM = 5.5
const ORB_AT = 6.4
const PRAY_TURN = 5.9
const INK = 7.0
const DONE = 10.2
const DURATION = 10.8

/** 子どもの 足もと(ここが 地面)の 高さと、立つ ばしょ、はじめの いち(わく の 外)、背の高さ */
const GROUND_Y = 97
const CHILD_X = 58
const KID_FROM = 120
const KID_HEIGHT = 46
const KID_LOOK = { ...LOOKS.boy, top: TUNIC } as const

type Pt = readonly [number, number]

/** 木の みき の 根もと(6画目の おわり)と、もりあげた 土の てっぺん の 高さ */
const TREE_ROOT: Pt = [71, 86]
const MOUND_TOP_Y = 85.5
/** ほこら: はしら の 上に のった はこ と やね */
const SHRINE_X = 32
/** かみさまの ひかり が とまる ばしょ(1画目の 上) */
const ORB_REST: Pt = [34, 19]
const ORB_START: Pt = [8, 3]

const rad = (deg: number): number => (deg * Math.PI) / 180

/* ───────── ほこら ───────── */

function Shrine({ t }: SceneProps) {
  const pop = span(t, 0, 0.7, backOut)
  const lit = span(t, ORB_AT - 0.1, ORB_AT + 0.5, easeOut)
  // しで: かぜに ふかれて、右下へ なびく(4画目の むき)。かみさまが きたら 少し おおきく ゆれる
  const flutter = -40 + wave(t, 1.5) * (4 + 5 * lit)
  return (
    <Layer scale={pop} origin={[SHRINE_X, 96]}>
      <ellipse cx={SHRINE_X} cy="97" rx="8.4" ry="2.2" fill="#000000" opacity="0.12" />
      <Bone char={CHAR} n={3} color={PALETTE.barkDark} width={5.4} />
      <ellipse cx={SHRINE_X} cy="96.6" rx="6" ry="2.2" fill="#9b9690" />
      {/* しで(かみの ひも) */}
      <Layer rotate={flutter} origin={[38, 56]}>
        <path d="M38 56 v12" stroke="#ffffff" strokeWidth="0.7" />
        <path d="M35.6 58 h4.8 v4 l-2.4 3.4 l-2.4 -3.4 Z" fill="#ffffff" stroke="#d6dde6" strokeWidth="0.5" />
        <path d="M35.6 65 h4.8 v3.6 l-2.4 3 l-2.4 -3 Z" fill="#ffffff" stroke="#d6dde6" strokeWidth="0.5" />
      </Layer>
      {/* はこ */}
      <rect x={SHRINE_X - 11} y="41" width="22" height="15" rx="1.6" fill={SHRINE_WOOD} />
      <rect x={SHRINE_X - 11} y="53.6" width="22" height="2.4" rx="1" fill={PALETTE.barkDark} />
      <rect x={SHRINE_X - 5.4} y="44" width="10.8" height="10" rx="1.2" fill="#5a3b2a" />
      <rect x={SHRINE_X - 5.4} y="44" width="10.8" height="10" rx="1.2" fill="#ffe27a" opacity={lit} />
      <path d={`M${SHRINE_X} 44 v10`} stroke="#5a3b2a" strokeWidth="0.7" opacity="0.7" />
      {/* やね */}
      <path d="M12 43.6 L32 26 L52 43.6 Z" fill={SHRINE_ROOF} />
      <path d="M32 26 L52 43.6 L47.4 43.6 L32 30 Z" fill={SHRINE_ROOF_LIGHT} opacity="0.55" />
      <path d="M12.6 43 L32 26.6 L51.4 43" fill="none" stroke="#8e3b2c" strokeWidth="1" strokeLinejoin="round" />
    </Layer>
  )
}

/* ───────── もりあげた 土 と 木 ───────── */

/** スコップで ほうった つち が おちる 時間(1かい目, 2かい目, 3かい目) */
const landing = (k: number): number => DIG_FROM + CYCLE * k + 0.75 * CYCLE + FLIGHT

function Mound({ t }: SceneProps) {
  // おちるたびに 3分の1 ずつ もりあがる
  const grow = [0, 1, 2].reduce((sum, k) => sum + span(t, landing(k) - 0.1, landing(k) + 0.15, easeOut), 0) / SCOOPS
  if (grow <= 0) return null
  return (
    <Layer scaleX={0.6 + 0.4 * grow} scaleY={grow} origin={[70, 99]}>
      <path d="M33 99 C37 94 40 90 44 88.5 L98 85.5 C103 88 106.5 94 108 99 Z" fill={EARTH} />
      <path d="M40 99 C44 94 48 91 52 90 L50 99 Z" fill={EARTH_DARK} opacity="0.5" />
      <Bone char={CHAR} n={7} color={EARTH_TOP} width={4.6} />
      {[[52, 94.6], [64, 96.2], [86, 93.4], [98, 95.8]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.3" fill={EARTH_DARK} />
      ))}
    </Layer>
  )
}

function Tree({ t }: SceneProps) {
  const sprout = span(t, SPROUT - 0.3, SPROUT, backOut) * (1 - span(t, SPROUT, SPROUT + 0.25))
  const grow = span(t, SPROUT, GROW_DONE, backOut)
  const sway = wave(t, 3.2) * 1.2
  return (
    <>
      {/* めばえ(たねから 出た ふたば) */}
      <Layer scale={Math.max(0, sprout)} origin={TREE_ROOT}>
        <path d="M71 86 v-4" stroke={PALETTE.leafDark} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M71 82.5 Q66 79 66 83 Q69 84 71 82.5 Z" fill={PALETTE.leaf} />
        <path d="M71 82.5 Q76 79 76 83 Q73 84 71 82.5 Z" fill={PALETTE.leafLight} />
      </Layer>
      <Layer scale={Math.max(0, grow)} origin={TREE_ROOT}>
        <path d="M65 87 Q69.5 85 69 80 L73.4 80 Q73 85 78 87 Z" fill={PALETTE.bark} />
        <Bone char={CHAR} n={6} color={PALETTE.bark} width={6.2} />
        <Bone char={CHAR} n={5} color={PALETTE.bark} width={4.2} />
        <path d="M69.6 62 q1.2 4 0 8 M72.6 36 q-1 4 0.2 8" fill="none" stroke={PALETTE.barkDark} strokeWidth="1" strokeLinecap="round" />
        {/* えだの先の 小さな しげみ */}
        <Layer rotate={sway * 0.7} origin={[71, 50]}>
          <circle cx="52.4" cy="51.6" r="4.2" fill={PALETTE.leafDark} />
          <circle cx="54" cy="49.6" r="3" fill={PALETTE.leaf} />
          <circle cx="91.4" cy="49.4" r="4.4" fill={PALETTE.leafDark} />
          <circle cx="89.6" cy="47.4" r="3" fill={PALETTE.leaf} />
        </Layer>
      </Layer>
      {/* 上の しげみ */}
      <Layer scale={Math.max(0, grow)} origin={TREE_ROOT}>
        <Canopy x={70} y={19} r={26} sway={sway} />
      </Layer>
    </>
  )
}

/* ───────── スコップ ───────── */

/** スコップの かまえ。theta = ま下から まえへ かたむけた 角度、hand = 上の 手の いち(足もとから) */
type ShovelPose = { readonly theta: number; readonly hand: Pt }
/** スコップの 手から さきまで の 長さ、手から うしろへ はみ出す 長さ、2本目の 手を そえる ところ */
const SHOVEL_LEN = 27
const DIG_POSE: ShovelPose = { theta: 50, hand: [5.3, -17.4] }
const LIFT_POSE: ShovelPose = { theta: 95, hand: [6, -19] }
const TOSS_POSE: ShovelPose = { theta: 150, hand: [7, -22] }
const dirOf = (pose: ShovelPose): Pt => [Math.sin(rad(pose.theta)), Math.cos(rad(pose.theta))]
const absOf = (p: Pt): Pt => [CHILD_X + p[0], GROUND_Y + p[1]]
const tipOf = (pose: ShovelPose): Pt => {
  const h = absOf(pose.hand)
  const d = dirOf(pose)
  return [h[0] + d[0] * SHOVEL_LEN, h[1] + d[1] * SHOVEL_LEN]
}
/** ほうりあげた とき の スコップの さき(つち が とびだす ところ) */
const TOSS_TIP = tipOf(TOSS_POSE)
/** たねを おとす 手の いち(地面の 絵の 座標) */
const SEED_HAND: Pt = [CHILD_X + 11, GROUND_Y - 17]

const lerpPose = (a: ShovelPose, b: ShovelPose, k: number): ShovelPose => ({
  theta: a.theta + (b.theta - a.theta) * k,
  hand: [a.hand[0] + (b.hand[0] - a.hand[0]) * k, a.hand[1] + (b.hand[1] - a.hand[1]) * k],
})

/** 1かい ぶん の スコップの うごき(u = 0〜1): ほる → すくいあげる → ほうる → もどる */
function shovelPose(u: number): ShovelPose {
  if (u < 0.3) return lerpPose(DIG_POSE, { theta: DIG_POSE.theta + 4, hand: [DIG_POSE.hand[0] - 0.8, DIG_POSE.hand[1] + 0.8] }, Math.sin((u / 0.3) * Math.PI))
  if (u < 0.6) return lerpPose(DIG_POSE, LIFT_POSE, easeInOut((u - 0.3) / 0.3))
  if (u < 0.75) return lerpPose(LIFT_POSE, TOSS_POSE, easeOut((u - 0.6) / 0.15))
  return lerpPose(TOSS_POSE, DIG_POSE, easeInOut((u - 0.75) / 0.25))
}

/** スコップの さき の 金ぐ(え は tools で 手に にぎらせる)。手から の 長さ 18〜28 の あたり */
function Blade({ pose, loaded }: { readonly pose: ShovelPose; readonly loaded: boolean }) {
  const h = absOf(pose.hand)
  return (
    <g transform={`translate(${h[0]} ${h[1]}) rotate(${-pose.theta})`}>
      <path d="M0 18 V20" stroke={SHOVEL_WOOD} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-3.4 18 H3.4 L3 25.6 Q0 28.6 -3 25.6 Z" fill={SHOVEL_IRON} />
      {loaded && <ellipse cx="0" cy="17" rx="3.2" ry="2.2" fill={EARTH} />}
    </g>
  )
}

/** ほうった つち の かたまり。blade の さき から、もりの 上へ ゆるい 山なりで おちる */
function Clods({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2].map((k) => {
        const p = span(t, landing(k) - FLIGHT, landing(k))
        if (p <= 0 || p >= 1) return null
        const x = TOSS_TIP[0] + 6 * p
        const y = TOSS_TIP[1] - 12 * p + (MOUND_TOP_Y - TOSS_TIP[1] + 12) * p * p
        return (
          <g key={k}>
            <circle cx={x} cy={y} r="2.6" fill={EARTH} />
            <circle cx={x - 0.8} cy={y - 0.8} r="1.1" fill={EARTH_TOP} />
          </g>
        )
      })}
    </>
  )
}

/** たね: 子どもの 手から ころんと おちて、もりの 上に うまる */
function Seed({ t }: SceneProps) {
  const fall = span(t, SEED_FROM + 0.35, SEED_FROM + 0.65)
  if (t < SEED_FROM + 0.35 || t >= SPROUT) return null
  const x = SEED_HAND[0] + (TREE_ROOT[0] - SEED_HAND[0]) * fall
  const y = SEED_HAND[1] + (MOUND_TOP_Y - 1.4 - SEED_HAND[1]) * fall * fall
  return <ellipse cx={x} cy={y} rx="1.5" ry="1.1" fill="#5a3b2a" />
}

/* ───────── 子ども ───────── */

function faceAt(t: number): Expression {
  if (t < DIG_FROM) return 'worried'
  if (t < SEED_FROM) return 'strain'
  if (t < JOY_FROM) return 'smile'
  return t < PRAY_TURN + 0.3 ? 'joy' : 'closed'
}

/** 手を もつ 道具 の 軸 に、もうひとつ の 手を そえる ところ(かた に いちばん 近い 点) */
function gripOn(from: Pt, dir: Pt, shoulder: Pt): Pt {
  const s = Math.min(16, Math.max(3, (shoulder[0] - from[0]) * dir[0] + (shoulder[1] - from[1]) * dir[1]))
  return [from[0] + dir[0] * s, from[1] + dir[1] * s]
}

function ChildActor({ t }: SceneProps) {
  const come = walk(t, { from: KID_FROM, to: CHILD_X, start: WALK_FROM, end: ARRIVE, height: KID_HEIGHT })
  // むき: あるいてくる(左) → つちを ほる(右) → おまいり(左)
  const spin = t < PRAY_TURN ? turnAround(t, ARRIVE, 'left', 'right', TURN_DONE - ARRIVE) : turnAround(t, PRAY_TURN, 'right', 'left', 0.3)
  const sign = spin.facing === 'right' ? 1 : -1
  const stand = personRig({ ...come, ...spin, y: GROUND_Y })

  const digging = t >= DIG_FROM && t < SEED_FROM
  const k = Math.min(SCOOPS - 1, Math.max(0, Math.floor((t - DIG_FROM) / CYCLE)))
  const u = (t - DIG_FROM - k * CYCLE) / CYCLE
  const pose = digging ? shovelPose(u) : null
  const loaded = digging && u >= 0.3 && u < 0.75

  const joyP = span(t, JOY_FROM, JOY_FROM + 0.6)
  const joyHop = t >= JOY_FROM && t < PRAY_TURN ? Math.abs(Math.sin((t - JOY_FROM) * Math.PI * 2.6)) * 4 * (1 - span(t, PRAY_TURN - 0.4, PRAY_TURN)) : 0
  const praying = t >= PRAY_TURN + 0.3
  const swingArms = { leftArm: come.pose.leftArm ?? HANG_ARM, rightArm: come.pose.rightArm ?? HANG_ARM }

  let arms: { readonly leftArm: Limb; readonly rightArm: Limb } = swingArms
  let tools: { readonly left: { readonly kind: 'stick'; readonly tip: Pt } } | undefined
  if (pose) {
    // りょうてで スコップを もつ(上の 手は え の おしり、した の 手は え の 途中)
    const h = absOf(pose.hand)
    const d = dirOf(pose)
    const shoulder = stand.world.arms.right.root
    tools = { left: { kind: 'stick', tip: [h[0] + d[0] * 19, h[1] + d[1] * 19] } }
    arms = { leftArm: { to: h }, rightArm: { to: gripOn(h, d, shoulder) } }
  } else if (t >= SEED_FROM && t < JOY_FROM) {
    // たねを もった 手を まえに のばす
    arms = { leftArm: mixLimb(HANG_ARM, { to: SEED_HAND }, span(t, SEED_FROM, SEED_FROM + 0.3, easeOut)), rightArm: HANG_ARM }
  } else if (t >= JOY_FROM && !praying) {
    // よろこんで りょうて を あげる
    arms = { leftArm: mixLimb(HANG_ARM, { swing: 150, bend: 25 }, joyP), rightArm: mixLimb(HANG_ARM, { swing: 160, bend: 20 }, joyP) }
  } else if (praying) {
    // てを あわせる(ほこらの ほう の むねの まえ)
    const hold = span(t, PRAY_TURN + 0.3, PRAY_TURN + 0.6, easeOut)
    const chest: Pt = [CHILD_X + sign * 7.5, stand.world.arms.left.root[1] + 4]
    arms = { leftArm: mixLimb({ swing: 150, bend: 25 }, { to: chest }, hold), rightArm: mixLimb({ swing: 160, bend: 20 }, { to: chest }, hold) }
  }
  const tilt = praying ? 9 * span(t, PRAY_TURN + 0.4, PRAY_TURN + 0.8) : 0
  const props = { ...come, ...spin, y: GROUND_Y, lift: joyHop, pose: { ...come.pose, ...arms, torso: digging ? 6 : come.pose.torso, head: tilt } }
  const head = personRig(props).world.head
  const hand = personRig(props).world.arms.left.end
  const seedInHand = t >= SEED_FROM && t < SEED_FROM + 0.35
  const tip = pose ? tipOf(pose) : TOSS_TIP

  return (
    <>
      <Person {...props} look={KID_LOOK} face={faceAt(t)} tools={tools} />
      {pose && <Blade pose={pose} loaded={loaded} />}
      {seedInHand && <ellipse cx={hand[0] + 1.4} cy={hand[1] - 1.4} rx="1.5" ry="1.1" fill="#5a3b2a" />}
      <Sweat t={t} x={head[0] - 4} y={head[1] - 3} show={digging ? 1 : 0} />
      {digging && <Dust x={tip[0]} y={GROUND_Y} p={(u - 0.02) / 0.3} reach={4} color="#d9c3a0" />}
    </>
  )
}

/* ───────── かみさまの ひかり ───────── */

function Orb({ t }: SceneProps) {
  const e = span(t, ORB_FROM, ORB_AT, easeInOut)
  const appear = span(t, ORB_FROM - 0.1, ORB_FROM + 0.3, backOut)
  if (appear <= 0) return null
  const bob = wave(t, 1.2) * 0.7 * e
  const x = ORB_START[0] + (ORB_REST[0] - ORB_START[0]) * e
  const y = ORB_START[1] + (ORB_REST[1] - ORB_START[1]) * e + bob
  const pulse = 1 + wave(t, 0.8) * 0.12
  return (
    <Layer x={x} y={y} scale={appear * 1.3}>
      <circle r={8.5 * pulse} fill={GLOW} opacity="0.32" />
      <circle r={5.6 * pulse} fill={GLOW} opacity="0.55" />
      <circle r="3.4" fill="#ffffff" />
      {[0, 1, 2].map((i) => {
        const angle = t * 2.2 + (i * Math.PI * 2) / 3
        return <Star key={i} cx={Math.cos(angle) * 8} cy={Math.sin(angle) * 6.4} r={1.9} color="#ffd95a" spin={t * 90 + i * 40} />
      })}
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[101, 9]} clouds={[]} tufts={[6, 24, 84, 103]} />
        <Mound t={t} />
        <Shrine t={t} />
        <Tree t={t} />
        <ChildActor t={t} />
        <Clods t={t} />
        <Seed t={t} />
        <Orb t={t} />
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
    { at: 0, label: '小さな ほこらが ぽんと できる', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが あるいてきて、からっぽの ほこらを 見て こまる' },
    { at: DIG_FROM, label: 'スコップで 土を すくって ほうり、もりあげる' },
    { at: SEED_FROM, label: 'もりあげた 土に たねを うめる', sound: 'pop' },
    { at: SPROUT, label: '木が ぐんぐん そだつ。子どもは おおよろこび' },
    { at: ORB_FROM, label: 'かみさまの ひかりが そらから おりてくる' },
    { at: ORB_AT + 0.2, label: 'ほこらに むかって、てを あわせて おまいり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '社 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
