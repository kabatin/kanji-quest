/*
 * 社(やしろ): 土を もりあげて、かみさまを まつる ばしょ。
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
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(スコップを もつ手の いちから、ひじ を 計算する)。
 *   くび は みじかく、どう の 上。あし は こし から。
 *   字の画と 絵が 重なるのは、ひかりが おりてきた さいごの しゅんかん だけ(だいたい 同じ場所・同じ向き)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '社'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a03d'
const TUNIC_DARK = '#d98a2a'
const TUNIC_FAR = '#c47a22'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const EARTH = '#a9754a'
const EARTH_DARK = '#8d5d3a'
const EARTH_TOP = '#c9975f'
const SHRINE_WOOD = '#b07a4a'
const SHRINE_ROOF = '#b5503d'
const SHRINE_ROOF_LIGHT = '#d06a53'
const GLOW = '#fff3a8'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
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

/** 子どもの 足もと(ここが 地面)の 高さと、立つ ばしょ */
const GROUND_Y = 97
const CHILD_X = 58
/** 子どもの かた(足もとから みた いち。右むきの とき) */
const SHOULDER: Pt = [0, -23]
const ARM_PART = 7

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

/* ───────── 風景 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[101, 9]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="100.2" y="-2.4" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 101 9)`} />
        ))}
      </Layer>
      <circle cx="101" cy="9" r={5.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98.4" rx="53" ry="5.4" fill={GRASS} />
      {[6, 24, 84, 103].map((x) => (
        <path key={x} d={`M${x} 97.6 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── ほこら ───────── */

function Shrine({ t }: SceneProps) {
  const pop = span(t, 0, 0.7, backOut)
  const lit = span(t, ORB_AT - 0.1, ORB_AT + 0.5, easeOut)
  // しで: かぜに ふかれて、右下へ なびく(4画目の むき)。かみさまが きたら 少し おおきく ゆれる
  const flutter = -40 + wave(t, 1.5) * (4 + 5 * lit)
  return (
    <Layer scale={pop} origin={[SHRINE_X, 96]}>
      <ellipse cx={SHRINE_X} cy="97" rx="8.4" ry="2.2" fill="#000000" opacity="0.12" />
      <Bone char={CHAR} n={3} color={BARK_DARK} width={5.4} />
      <ellipse cx={SHRINE_X} cy="96.6" rx="6" ry="2.2" fill="#9b9690" />
      {/* しで(かみの ひも) */}
      <Layer rotate={flutter} origin={[38, 56]}>
        <path d="M38 56 v12" stroke="#ffffff" strokeWidth="0.7" />
        <path d="M35.6 58 h4.8 v4 l-2.4 3.4 l-2.4 -3.4 Z" fill="#ffffff" stroke="#d6dde6" strokeWidth="0.5" />
        <path d="M35.6 65 h4.8 v3.6 l-2.4 3 l-2.4 -3 Z" fill="#ffffff" stroke="#d6dde6" strokeWidth="0.5" />
      </Layer>
      {/* はこ */}
      <rect x={SHRINE_X - 11} y="41" width="22" height="15" rx="1.6" fill={SHRINE_WOOD} />
      <rect x={SHRINE_X - 11} y="53.6" width="22" height="2.4" rx="1" fill={BARK_DARK} />
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
      {[
        [52, 94.6],
        [64, 96.2],
        [86, 93.4],
        [98, 95.8],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="1.3" fill={EARTH_DARK} />
      ))}
    </Layer>
  )
}

/** ほうった つち の かたまり。blade の さき から、もりの 上へ ゆるい 山なりで おちる */
function Clods({ t }: SceneProps) {
  return (
    <>
      {[0, 1, 2].map((k) => {
        const p = span(t, landing(k) - FLIGHT, landing(k))
        if (p <= 0 || p >= 1) return null
        const x = CHILD_X + TOSS_TIP[0] + 6 * p
        const y = GROUND_Y + TOSS_TIP[1] - 12 * p + (MOUND_TOP_Y - (GROUND_Y + TOSS_TIP[1]) + 12) * p * p
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

function Tree({ t }: SceneProps) {
  const sprout = span(t, SPROUT - 0.3, SPROUT, backOut) * (1 - span(t, SPROUT, SPROUT + 0.25))
  const grow = span(t, SPROUT, GROW_DONE, backOut)
  const sway = wave(t, 3.2) * 1.2
  return (
    <>
      {/* めばえ(たねから 出た ふたば) */}
      <Layer scale={Math.max(0, sprout)} origin={TREE_ROOT}>
        <path d="M71 86 v-4" stroke={LEAF_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <path d="M71 82.5 Q66 79 66 83 Q69 84 71 82.5 Z" fill={LEAF} />
        <path d="M71 82.5 Q76 79 76 83 Q73 84 71 82.5 Z" fill={LEAF_LIGHT} />
      </Layer>
      <Layer scale={Math.max(0, grow)} origin={TREE_ROOT}>
        <path d="M65 87 Q69.5 85 69 80 L73.4 80 Q73 85 78 87 Z" fill={BARK} />
        <Bone char={CHAR} n={6} color={BARK} width={6.2} />
        <Bone char={CHAR} n={5} color={BARK} width={4.2} />
        <path d="M69.6 62 q1.2 4 0 8 M72.6 36 q-1 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1" strokeLinecap="round" />
        {/* えだの先の 小さな しげみ */}
        <Layer rotate={sway * 0.7} origin={[71, 50]}>
          <circle cx="52.4" cy="51.6" r="4.2" fill={LEAF_DARK} />
          <circle cx="54" cy="49.6" r="3" fill={LEAF} />
          <circle cx="91.4" cy="49.4" r="4.4" fill={LEAF_DARK} />
          <circle cx="89.6" cy="47.4" r="3" fill={LEAF} />
        </Layer>
        {/* 上の しげみ */}
        <Layer rotate={sway} origin={[70, 30]}>
          <circle cx="57" cy="22" r="10" fill={LEAF_DARK} />
          <circle cx="84" cy="22" r="10" fill={LEAF_DARK} />
          <circle cx="70" cy="14" r="14" fill={LEAF_DARK} />
          <circle cx="64" cy="23" r="9.4" fill={LEAF} />
          <circle cx="77.5" cy="23" r="9.4" fill={LEAF} />
          <circle cx="70" cy="17" r="10.5" fill={LEAF} />
          <circle cx="64" cy="11" r="4.4" fill={LEAF_LIGHT} />
          <circle cx="78" cy="14" r="3.2" fill={LEAF_LIGHT} />
        </Layer>
      </Layer>
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

type Mood = 'worried' | 'tired' | 'joy' | 'calm'

/** かたから ひじ を とおって 手に とどく うで。手の いち から ひじ を 計算する(ひじ は 下・うしろ へ まがる) */
function Arm({ hand, color }: { readonly hand: Pt; readonly color: string }) {
  const dx = hand[0] - SHOULDER[0]
  const dy = hand[1] - SHOULDER[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const lift = Math.sqrt(ARM_PART * ARM_PART - half * half)
  // ひじ が むく ほうこうは ふたとおり。「下・うしろ」に ちかい ほう
  const cand: readonly Pt[] = [
    [-uy, ux],
    [uy, -ux],
  ]
  const score = (p: Pt) => -0.35 * p[0] + p[1]
  const side = score(cand[0]) >= score(cand[1]) ? cand[0] : cand[1]
  const elbow: Pt = [SHOULDER[0] + ux * half + side[0] * lift, SHOULDER[1] + uy * half + side[1] * lift]
  const end: Pt = [SHOULDER[0] + ux * reach, SHOULDER[1] + uy * reach]
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${end[0]} ${end[1]}`} fill="none" stroke={color} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={end[0]} cy={end[1]} r="2.9" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="2.2" cy="-29.4" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d="M2.4 -35 L5.6 -36.4" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4.2" cy="-32.6" r="1.15" fill={EYE} />
          <path d="M3 -28 Q4.4 -29.4 5.8 -28" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'tired' && (
        <>
          <path d="M2.8 -33 L5.6 -32.6" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="4.4" cy="-28.6" rx="1.2" ry="1.5" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M2.6 -32 Q4.2 -34.4 5.8 -32" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M2.8 -29.6 Q4.4 -26.4 6.4 -29.6 Z" fill={MOUTH} />
        </>
      )}
      {mood === 'calm' && (
        <>
          <path d="M2.6 -32.8 Q4.2 -31.2 5.8 -32.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.2 -28.8 Q4.6 -27.6 6 -28.8" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/* スコップの かまえ。theta = ま下から まえへ かたむけた 角度、hand = 上の 手の いち(足もとから) */
type ShovelPose = { readonly theta: number; readonly hand: Pt }
const SHOVEL_LEN = 27
const DIG_POSE: ShovelPose = { theta: 50, hand: [5.3, -17.4] }
const LIFT_POSE: ShovelPose = { theta: 95, hand: [6, -19] }
const TOSS_POSE: ShovelPose = { theta: 150, hand: [7, -22] }
const tipOf = (pose: ShovelPose): Pt => [pose.hand[0] + Math.sin(rad(pose.theta)) * SHOVEL_LEN, pose.hand[1] + Math.cos(rad(pose.theta)) * SHOVEL_LEN]
/** ほうりあげた とき の スコップの さき(つち が とびだす ところ) */
const TOSS_TIP: Pt = tipOf(TOSS_POSE)
/** たねを おとす 手の いち(地面の 絵の 座標) */
const SEED_REACH: Pt = [11, -17]
const SEED_HAND: Pt = [CHILD_X + SEED_REACH[0], GROUND_Y + SEED_REACH[1]]

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

function Shovel({ pose, loaded }: { readonly pose: ShovelPose; readonly loaded: boolean }) {
  return (
    <g transform={`translate(${pose.hand[0]} ${pose.hand[1]}) rotate(${-pose.theta})`}>
      <path d="M0 -4 V19" stroke={SHOVEL_WOOD} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-3.4 18 H3.4 L3 25.6 Q0 28.6 -3 25.6 Z" fill={SHOVEL_IRON} />
      {loaded && <ellipse cx="0" cy="17" rx="3.2" ry="2.2" fill={EARTH} />}
    </g>
  )
}

type ChildProps = {
  readonly stride: number
  readonly mood: Mood
  readonly nearHand: Pt
  readonly farHand: Pt
  readonly shovel: { readonly pose: ShovelPose; readonly loaded: boolean } | null
  readonly headTilt: number
  readonly seed: boolean
}

/** 右むきの 子ども(足もとが 0,0)。くび は みじかく、うで は かた から。 */
function Child({ stride, mood, nearHand, farHand, shovel, headTilt, seed }: ChildProps) {
  return (
    <>
      <Arm hand={farHand} color={TUNIC_FAR} />
      <Layer rotate={stride * 22} origin={[0, -14]}>
        <rect x="0.4" y="-15" width="5" height="14" rx="2.5" fill={PANTS_DARK} />
        <ellipse cx="3.6" cy="-0.8" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 22} origin={[0, -14]}>
        <rect x="-5.4" y="-15" width="5" height="14" rx="2.5" fill={PANTS} />
        <ellipse cx="-1.8" cy="-0.8" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      <rect x="-1.9" y="-28" width="3.8" height="6" rx="1.6" fill={SKIN_SHADE} />
      <rect x="-5.6" y="-26.4" width="11.2" height="14.6" rx="4.6" fill={TUNIC} />
      <path d="M-4.6 -15.4 h9.2" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {shovel && <Shovel pose={shovel.pose} loaded={shovel.loaded} />}
      <Arm hand={nearHand} color={TUNIC_DARK} />
      {seed && <ellipse cx={nearHand[0] + 1.4} cy={nearHand[1] - 1.4} rx="1.5" ry="1.1" fill="#5a3b2a" />}
      <Layer rotate={headTilt} origin={[0, -26.4]}>
        <circle cx="0.8" cy="-32" r="6.8" fill={SKIN} />
        <path d="M-6.1 -31 C-7 -40.2 4.4 -41.8 7.2 -34.4 C3.6 -37.4 -1.6 -36.6 -3.6 -33.4 C-4.2 -32.4 -4.6 -31.6 -6.1 -31 Z" fill={HAIR} />
        <path d="M-0.6 -38.6 Q0.4 -42.4 2.4 -40.2" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** ひとかき ごとの あせ(子どもの うしろへ とぶ) */
function Sweat({ show, t }: { readonly show: number; readonly t: number }) {
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.9 0.5 0 1.9 Q-1.9 0.5 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${-8 - p * 6} ${-37 + p * 9}) rotate(25)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** スコップが じめんに ささった しゅんかんの つち けむり(さきの 近く) */
function Dust({ u }: { readonly u: number }) {
  const p = (u - 0.02) / 0.3
  if (p <= 0 || p >= 1) return null
  const tip = tipOf(DIG_POSE)
  return (
    <g opacity={1 - p}>
      <circle cx={tip[0] - 4 - p * 3} cy={-1.5 - p * 4} r={1.5 + p * 1.2} fill="#d9c3a0" />
      <circle cx={tip[0] + 1 + p * 4} cy={-1.5 - p * 3} r={1.2 + p} fill="#d9c3a0" />
    </g>
  )
}

function ChildActor({ t }: SceneProps) {
  const walkX = mix(t, WALK_FROM, ARRIVE, 62, 0, easeOut)
  const walking = t >= WALK_FROM && t < ARRIVE ? 1 - span(t, ARRIVE - 0.25, ARRIVE) : 0
  const stride = Math.sin((t - WALK_FROM) * Math.PI * 2 * 1.8) * walking
  const bob = -Math.abs(stride) * 1.2
  // むき: あるいてくる(左) → つちを ほる(右) → おまいり(左)
  const facing = t < ARRIVE ? -1 : t < PRAY_TURN ? mix(t, ARRIVE, TURN_DONE, -1, 1) : mix(t, PRAY_TURN, PRAY_TURN + 0.3, 1, -1)
  const digging = t >= DIG_FROM && t < SEED_FROM
  const k = Math.min(SCOOPS - 1, Math.max(0, Math.floor((t - DIG_FROM) / CYCLE)))
  const u = (t - DIG_FROM - k * CYCLE) / CYCLE
  const pose = digging ? shovelPose(u) : null
  const loaded = digging && u >= 0.3 && u < 0.75

  const joyP = span(t, JOY_FROM, JOY_FROM + 0.6)
  const joyHop = t >= JOY_FROM && t < PRAY_TURN ? Math.abs(Math.sin((t - JOY_FROM) * Math.PI * 2.6)) * 4 * (1 - span(t, PRAY_TURN - 0.4, PRAY_TURN)) : 0
  const mood: Mood = t < DIG_FROM ? 'worried' : t < SEED_FROM ? 'tired' : t < JOY_FROM ? 'calm' : t < PRAY_TURN ? 'joy' : t < ORB_AT ? 'joy' : 'calm'
  const praying = t >= PRAY_TURN + 0.3

  const swing = rad(stride * 28)
  const around = (angle: number): Pt => [SHOULDER[0] + Math.sin(angle) * 12, SHOULDER[1] + Math.cos(angle) * 12]
  let nearHand: Pt = around(swing)
  let farHand: Pt = around(-swing)
  if (pose) {
    // りょうてで スコップを もつ(した の 手は えの 少し 下)
    nearHand = pose.hand
    farHand = [pose.hand[0] + Math.sin(rad(pose.theta)) * 9, pose.hand[1] + Math.cos(rad(pose.theta)) * 9]
  } else if (t >= SEED_FROM && t < JOY_FROM) {
    // たねを もった 手を まえに のばす
    const reach = span(t, SEED_FROM, SEED_FROM + 0.3, easeOut)
    nearHand = [SHOULDER[0] + 4 + (SEED_REACH[0] - 4) * reach, SHOULDER[1] + 7 + (SEED_REACH[1] - SHOULDER[1] - 7) * reach]
    farHand = around(0.1)
  } else if (t >= JOY_FROM && !praying) {
    // よろこんで りょうて を あげる
    nearHand = [SHOULDER[0] + 4 * joyP, SHOULDER[1] - 12.5 * joyP + 12 * (1 - joyP)]
    farHand = [SHOULDER[0] - 3 * joyP, SHOULDER[1] - 12.5 * joyP + 12 * (1 - joyP)]
  } else if (praying) {
    // てを あわせる
    const hold = span(t, PRAY_TURN + 0.3, PRAY_TURN + 0.6, easeOut)
    nearHand = [SHOULDER[0] + 7.5 * hold, SHOULDER[1] + 3 * hold - 5 * (1 - hold)]
    farHand = nearHand
  }
  const tilt = praying ? 9 * span(t, PRAY_TURN + 0.4, PRAY_TURN + 0.8) : 0
  const seedInHand = t >= SEED_FROM && t < SEED_FROM + 0.35
  const tiredShow = digging ? 1 : 0

  return (
    <Layer x={CHILD_X + walkX} y={GROUND_Y + bob - joyHop} scaleX={facing}>
      <Child stride={stride} mood={mood} nearHand={nearHand} farHand={farHand} shovel={pose ? { pose, loaded } : null} headTilt={tilt} seed={seedInHand} />
      <Sweat show={tiredShow} t={t} />
      {digging && <Dust u={u} />}
    </Layer>
  )
}

/** かげ(足もとに おく) */
function ChildShadow({ t }: SceneProps) {
  const walkX = mix(t, WALK_FROM, ARRIVE, 62, 0, easeOut)
  if (t < WALK_FROM - 0.2) return null
  return <ellipse cx={CHILD_X + walkX} cy={GROUND_Y + 0.4} rx="8" ry="2.2" fill="#000000" opacity="0.12" />
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
        <Ground t={t} />
        <Mound t={t} />
        <Shrine t={t} />
        <Tree t={t} />
        <ChildShadow t={t} />
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
