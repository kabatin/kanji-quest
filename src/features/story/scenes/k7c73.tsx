/*
 * 米(こめ): いねの ほに、こめの つぶが ならんで いる。
 *
 * ほね(画と絵の対応)
 *   1画目(、)  … 左に たれた ほ。えだ の さき から、つぶが ならんで ぶらさがる
 *   2画目(ノ)  … 右に たれた ほ。つぶが ならんで ぶらさがる
 *   3画目(一)  … いねの ながい 葉(くきの よこに のびる)
 *   4画目(丨)  … いねの くき
 *   5・6画目   … くきから 左右へ おじぎする ほそながい 葉
 *
 * ながれ
 *   いねが 田んぼで のびる → おなかを すかせた 子どもが あるいてくる(おなかが ぐう)
 *   → お日さまが かがやき、ほが でて つぶが ならび、みどりから きん色に みのる
 *   → 子どもが 見あげて びっくり。つぶが 1つ ぽとんと おちて、てのひらに のる
 *   → 子どもが にっこり、つぶを かかげて ぴょんぴょん よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「米」が のこる
 *
 *
 * 子どもは Person(共通部品)。右むき。あるきは walk、おなか・てのひらは { to } で 手を 置く。
 * 空・おか・雲は Backdrop、お日さまは Sun(みのるとき 大きく かがやく)。いね・つぶ・なえ・おなかの おとは ここで 描く。
 */
import { backOut, during, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, LOOKS, mixLimb, Person, personRig, Sun, walk, type Limb, type PersonProps } from '../sceneFigures'

const CHAR = '米'

const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM_GREEN = '#7cc05a'
const STEM_GOLD = '#d6b84a'
const TUNIC = '#f0a04b'
/** くぎり の時間(秒) */
const ARRIVE_FROM = 0.8
const ARRIVE = 2.3
/** ほが でて、つぶが ならびはじめる */
const EARS = 2.5
/** つぶが きん色に みのる */
const RIPE_FROM = 3.4
const RIPE_TO = 4.2
/** つぶが ぐらぐら して おちはじめる / てのひらに のる */
const LOOSE = 4.1
const FALL = 4.55
const LAND = 5.25
const CHEER = 5.6
const INK = 6.6
const DONE = 9.6
const DURATION = 10

/** 子どもの 足もと(まんなか)と 背の高さ */
const CHILD_X = 14
const FEET_Y = 96.5
const KID_HEIGHT = 41

/* ───────── ひらがな 色の ほじょ ───────── */

const hex = (color: string): readonly [number, number, number] => [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)]

/** 2つの色を a:0 〜 b:1 で まぜる */
function lerpColor(a: string, b: string, k: number): string {
  const from = hex(a)
  const to = hex(b)
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * k)
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}

/* ───────── 空・なえ ───────── */

function Sky({ t }: SceneProps) {
  // ほが みのるとき、お日さまが ぐっと かがやく
  const shine = 1 + 0.35 * during(t, EARS - 0.2, RIPE_TO + 0.2, 0.4)
  return (
    <>
      <Backdrop t={t} sun={null} clouds={[[62, 9, 0.9], [94, 56, 0.8]]} ground={98} tufts={[]} />
      <Sun t={t} x={13} y={13} r={6.2 * (1 + (shine - 1) * 0.3)} />
      {/* ちかくの なえ(いねの こども) */}
      {[7, 38, 76, 99].map((x, i) => (
        <path key={x} d={`M${x} 97.6 q-1.2 -4 -3 -5.2 q3 0.2 4 3 q0.4 -3.6 2.2 -5.4 q0.2 3.4 -0.6 7.6 Z`} fill={i % 2 === 0 ? LEAF : LEAF_DARK} />
      ))}
    </>
  )
}

/* ───────── いね ───────── */

type Spot = { readonly x: number; readonly y: number; readonly angle: number }

/** 画の 通り道の点(scene-info の点)。つぶを ならべる場所 */
const EAR_LEFT_POINTS: readonly (readonly [number, number])[] = [
  [26.6, 25.5], [28.7, 26.9], [30.5, 28.6], [32.3, 30.4], [33.9, 32.3], [35.4, 34.3], [36.8, 36.4], [37.8, 38.8],
]
const EAR_RIGHT_POINTS: readonly (readonly [number, number])[] = [
  [78.5, 19.6], [78, 22.4], [76.4, 24.9], [74.7, 27.2], [72.9, 29.3], [70.8, 31.4], [68.7, 33.3], [66.6, 35.2],
]
/** 左の ほで、おちる つぶ(何こめか) */
const FALLING_INDEX = 5

/** 点の ならびの 向きに そって、つぶを 左右 ちがいに ずらして ならべる */
function spotsAlong(points: readonly (readonly [number, number])[]): readonly Spot[] {
  return points.map(([x, y], i) => {
    const before = points[Math.max(i - 1, 0)]
    const after = points[Math.min(i + 1, points.length - 1)]
    const dx = after[0] - before[0]
    const dy = after[1] - before[1]
    const length = Math.hypot(dx, dy)
    const side = i % 2 === 0 ? 0.9 : -0.9
    return { x: x - (dy / length) * side, y: y + (dx / length) * side, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
  })
}

const LEFT_SPOTS = spotsAlong(EAR_LEFT_POINTS)
const RIGHT_SPOTS = spotsAlong(EAR_RIGHT_POINTS)
/** つぶが おちる まえの 場所と、てのひらに のる場所 */
const FALL_FROM = LEFT_SPOTS[FALLING_INDEX]

/** こめの つぶ 1こ。ripe 0 = わかい みどり / 1 = きん色 */
function Grain({ x, y, angle, scale = 1, ripe }: Spot & { readonly scale?: number; readonly ripe: number }) {
  if (scale <= 0) return null
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="2.7" ry="1.55" fill={lerpColor('#8fcb55', '#eebc3c', ripe)} />
      <ellipse cx="-0.5" cy="-0.5" rx="1.2" ry="0.5" fill={lerpColor('#c5e68f', '#fff0b0', ripe)} />
      <path d="M2.4 0 l1.7 -0.2" stroke={lerpColor('#6fae43', '#c99a28', ripe)} strokeWidth="0.5" strokeLinecap="round" />
    </g>
  )
}

/** 1本の ほ。えだ が くき の さきから のび、つぶが ならぶ */
function Ear({ t, branch, spots, delay, skip }: SceneProps & { readonly branch: string; readonly spots: readonly Spot[]; readonly delay: number; readonly skip: number | null }) {
  const reach = span(t, EARS + delay, EARS + delay + 0.5, easeOut)
  const ripe = span(t, RIPE_FROM, RIPE_TO)
  return (
    <>
      <path d={branch} fill="none" stroke={lerpColor(STEM_GREEN, STEM_GOLD, ripe)} strokeWidth="1.5" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - reach} />
      {spots.map((spot, i) => {
        if (i === skip) return null
        const pop = span(t, EARS + delay + 0.45 + i * 0.07, EARS + delay + 0.75 + i * 0.07, backOut)
        return <Grain key={i} {...spot} scale={pop} ripe={ripe} />
      })}
    </>
  )
}

/** おちる つぶ: ぐらぐら ゆれて、ぽとんと おちて、てのひらに のる */
function FallingGrain({ t, landing }: SceneProps & { readonly landing: readonly [number, number] }) {
  if (t < LOOSE || t >= LAND) return null
  if (t < FALL) {
    const shake = wave(t, 0.14) * 14 * span(t, LOOSE, FALL)
    return <Grain {...FALL_FROM} angle={FALL_FROM.angle + shake} ripe={1} />
  }
  const p = span(t, FALL, LAND, easeIn)
  const x = mix(t, FALL, LAND, FALL_FROM.x, landing[0], (k) => k)
  const y = FALL_FROM.y + (landing[1] - FALL_FROM.y) * p
  return <Grain x={x} y={y} angle={FALL_FROM.angle + p * 150} ripe={1} />
}

function Rice({ t }: SceneProps) {
  const sprout = span(t, 0, 0.8, backOut)
  const leaf = (from: number, to: number) => span(t, from, to, easeOut)
  const ripe = span(t, RIPE_FROM, RIPE_TO)
  const sway = wave(t, 3.2) * 1.1
  const longLeaf = leaf(0.4, 1.0)
  const hasFallen = t >= LOOSE ? FALLING_INDEX : null
  return (
    <>
      <ellipse cx="54" cy="97.4" rx={13 * Math.min(sprout, 1)} ry="2.4" fill="#000000" opacity="0.1" />
      {/* 葉: くきの ふし から ひろがる(5・6画目は おじぎする 葉、3画目は よこに のびた ながい葉) */}
      <Bone char={CHAR} n={3} color={LEAF_DARK} width={3.6} from={0.5 - 0.5 * longLeaf} to={0.5} />
      <Bone char={CHAR} n={3} color={LEAF_DARK} width={3.6} from={0.5} to={0.5 + 0.5 * longLeaf} />
      <Bone char={CHAR} n={3} color={LEAF} width={2.3} from={0.5 - 0.5 * longLeaf} to={0.5} />
      <Bone char={CHAR} n={3} color={LEAF} width={2.3} from={0.5} to={0.5 + 0.5 * longLeaf} />
      <Bone char={CHAR} n={5} color={LEAF_DARK} width={3.6} to={leaf(0.6, 1.2)} />
      <Bone char={CHAR} n={5} color={LEAF} width={2.3} to={leaf(0.6, 1.2)} />
      <Bone char={CHAR} n={6} color={LEAF_DARK} width={3.6} to={leaf(0.65, 1.25)} />
      <Bone char={CHAR} n={6} color={LEAF} width={2.3} to={leaf(0.65, 1.25)} />
      {/* くき: 下から のびる。みのると きん色に */}
      <Layer scaleX={0.6 + 0.4 * Math.min(sprout, 1)} scaleY={sprout} origin={[54, 96]}>
        <Bone char={CHAR} n={4} color={lerpColor(STEM_GREEN, STEM_GOLD, ripe)} width={3.2} />
      </Layer>
      {/* ほ: くき の さきの ふし から、左右に えだが のびて たれる。風で ゆっくり ゆれる */}
      <Layer rotate={sway * 0.5} origin={[54, 26]}>
        <Ear t={t} branch="M54 25 C47 10 26 10 26.6 25.5" spots={LEFT_SPOTS} delay={0} skip={hasFallen} />
        <Ear t={t} branch="M54 25 C61 9 79 9 78.5 19.6" spots={RIGHT_SPOTS} delay={0.12} skip={null} />
      </Layer>
    </>
  )
}

/* ───────── 子ども(右むき) ───────── */

type Mood = 'hungry' | 'wonder' | 'happy'
const FACES = { hungry: 'worried', wonder: 'surprised', happy: 'joy' } as const

const BELLY_HAND: Limb = { to: [CHILD_X + 5, FEET_Y - 17] }
const HANG: Limb = { swing: 4, bend: 12 }
/** つぶが おちてくる てのひらの 場所(つぶは てのひらの すこし上に のる) */
const PALM: readonly [number, number] = [CHILD_X + 15, FEET_Y - 24]
const REACH: Limb = { to: PALM }
const LANDING: readonly [number, number] = [PALM[0], PALM[1] - 2.9]
const CHEER_NEAR: Limb = { swing: 125, bend: 5 }
const CHEER_FAR: Limb = { swing: 100, bend: 10 }

/** 子どもの 場所と かっこう。左から あるいてきて、立ち止まって 見あげる(近い 手は 左うで) */
function kidAt(t: number): PersonProps {
  const walking = walk(t, { from: CHILD_X - 34, to: CHILD_X, start: ARRIVE_FROM, end: ARRIVE, build: 'child', height: KID_HEIGHT, armSwing: 14 })
  // よろこびの ぴょんぴょん(2かい)
  const hop = t >= CHEER && t < INK - 0.05 ? Math.abs(Math.sin(((t - CHEER) / 0.45) * Math.PI)) * 4.5 : 0
  const mood: Mood = t < EARS + 0.5 ? 'hungry' : t < LAND ? 'wonder' : 'happy'
  // 顔の むき: 見あげる → つぶを 目でおう → てのひらを 見る → まえを むいて よろこぶ
  const lookUp = mix(t, EARS + 0.6, EARS + 1.2, 0, -18)
  const follow = mix(t, FALL, LAND, 0, 32, easeIn)
  const relax = span(t, CHEER - 0.1, CHEER + 0.3)
  const head = t < EARS + 0.6 ? -3 : (lookUp + follow) * (1 - relax) - relax * 6

  // うで: あるくときは おなかを おさえて、立ち止まると おどろいて ぶらん。つぶを うけとり、さいごに ばんざい
  const toHang = span(t, EARS + 0.5, EARS + 0.9)
  const toReach = span(t, LOOSE - 0.2, LOOSE + 0.35)
  const toCheer = span(t, CHEER - 0.05, CHEER + 0.4, easeOut)
  const nearBase = mixLimb(mixLimb(BELLY_HAND, HANG, toHang), REACH, toReach)
  const farBase = t < ARRIVE ? walking.pose.rightArm ?? HANG : HANG
  return {
    ...walking,
    y: FEET_Y,
    look: { ...LOOKS.boy, top: TUNIC, bottom: '#4f6fa0' },
    face: FACES[mood],
    lift: hop,
    opacity: span(t, ARRIVE_FROM - 0.1, ARRIVE_FROM + 0.15),
    pose: { ...walking.pose, ...(t < ARRIVE_FROM ? {} : { head }), leftArm: mixLimb(nearBase, CHEER_NEAR, toCheer), rightArm: mixLimb(farBase, CHEER_FAR, toCheer) },
  }
}

/** おなかが「ぐう」。おなかの まえに、おとの わ が ひろがる */
function Rumble({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, ARRIVE + 0.05, EARS + 0.7, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#9aa6bd" strokeWidth="0.9" strokeLinecap="round">
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d={`M${x + 9 + p * 4} ${FEET_Y - 20 - p * 1.4} q2 2.6 0 5.2`} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const kid = kidAt(t)
  const hand = personRig(kid).world.arms.left.end
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Rice t={t} />
        <Person {...kid} />
        {t >= LAND && <Grain x={hand[0]} y={hand[1] - 2.9} angle={-12} ripe={1} />}
        <Rumble t={t} x={kid.x} />
        <FallingGrain t={t} landing={LANDING} />
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
    { at: 0, label: 'いねが のびる', sound: 'pop' },
    { at: ARRIVE_FROM, label: 'おなかを すかせた 子どもが あるいてくる' },
    { at: EARS, label: 'ほが でて、つぶが ならぶ。きん色に みのる', sound: 'pop' },
    { at: LOOSE, label: 'つぶが 1つ おちて、てのひらに のる' },
    { at: CHEER, label: 'にっこり。つぶを かかげて ぴょんぴょん', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '米 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
