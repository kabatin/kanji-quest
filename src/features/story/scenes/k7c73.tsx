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
 * 人と いねは、ほんものの つくり を守る(字の形に合わせるために、ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の 上。
 *   ほ は くき の さきから えだ が ひろがり、おもい つぶで 下に たれる。葉は くき の ふしから 出る。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '米'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0a04b'
const TUNIC_DARK = '#dd8a35'
const TUNIC_FAR = '#c27a30'
const PANTS = '#4f6fa0'
const PANTS_DARK = '#415d8a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STEM_GREEN = '#7cc05a'
const STEM_GOLD = '#d6b84a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

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

/** 子どもの 足もと(まんなか) */
const CHILD_X = 14
const FEET_Y = 96.5
/** 子どもの かた(足もと から見た 場所。体は 右むき)と、うで 1ぶし の長さ */
const SHOULDER: readonly [number, number] = [1.5, -25]
const ARM_PART = 7.5

/* ───────── ひらがな 色の ほじょ ───────── */

const hex = (color: string): readonly [number, number, number] => [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)]

/** 2つの色を a:0 〜 b:1 で まぜる */
function lerpColor(a: string, b: string, k: number): string {
  const from = hex(a)
  const to = hex(b)
  const channel = (i: number) => Math.round(from[i] + (to[i] - from[i]) * k)
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}

/* ───────── 地面・空 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // ほが みのるとき、お日さまが ぐっと かがやく
  const shine = 1 + 0.35 * during(t, EARS - 0.2, RIPE_TO + 0.2, 0.4)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y={1.6 - (shine - 1) * 4} width="1.6" height={4 + (shine - 1) * 5} rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun * (1 + (shine - 1) * 0.3)} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 44 90 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="9" rx="7" ry="3.2" />
        <ellipse cx="67" cy="7.4" rx="5" ry="3.2" />
        <ellipse cx="94" cy="56" rx="6" ry="2.8" />
        <ellipse cx="98.5" cy="54.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
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

/* ───────── 子ども ───────── */

type Mood = 'hungry' | 'wonder' | 'happy'

/** うで の かっこう。ま下を 0 度に、まえ(右)へ ふった角度。upper = かた から ひじ / fore = ひじ から 手 */
type ArmPose = { readonly upper: number; readonly fore: number }

const BELLY_HAND: ArmPose = { upper: -20, fore: 110 }
const HANG: ArmPose = { upper: 4, fore: 12 }
const REACH: ArmPose = { upper: 80, fore: 85 }
const CHEER_NEAR: ArmPose = { upper: 115, fore: 150 }
const CHEER_FAR: ArmPose = { upper: 100, fore: 135 }

const lerpPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ upper: a.upper + (b.upper - a.upper) * k, fore: a.fore + (b.fore - a.fore) * k })

/** かた → ひじ → 手 の場所(足もとから 見た 場所) */
function armPoints(pose: ArmPose): { readonly elbow: readonly [number, number]; readonly hand: readonly [number, number] } {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [SHOULDER[0] + Math.sin(rad(pose.upper)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.upper)) * ARM_PART] as const
  const hand = [elbow[0] + Math.sin(rad(pose.fore)) * ARM_PART, elbow[1] + Math.cos(rad(pose.fore)) * ARM_PART] as const
  return { elbow, hand }
}

/** つぶが おちてくる てのひらの場所(絵の 座標)。つぶは てのひらの すこし上に のる */
const PALM = armPoints(REACH).hand
const LANDING: readonly [number, number] = [CHILD_X + PALM[0], FEET_Y + PALM[1] - 2.9]

function Arm({ pose, color, grain }: { readonly pose: ArmPose; readonly color: string; readonly grain: boolean }) {
  const { elbow, hand } = armPoints(pose)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
      {grain ? <Grain x={hand[0]} y={hand[1] - 2.9} angle={-12} ripe={1} /> : null}
    </>
  )
}

/** 顔(あたま の中心が 0,0。右むき) */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="-1.4" cy="3.3" r="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'hungry' ? (
        <>
          <path d="M1.8 -2.8 l2.6 0.7" stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="3" cy="-0.1" r="0.95" fill={EYE} />
          <path d="M2.2 4.4 Q3.4 3.2 4.6 4.4" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />
        </>
      ) : null}
      {mood === 'wonder' ? (
        <>
          <circle cx="3" cy="-0.3" r="1.5" fill="#ffffff" stroke={EYE} strokeWidth="0.4" />
          <circle cx="3.3" cy="-0.3" r="0.85" fill={EYE} />
          <path d="M1.6 -3 q1.4 -1 3 -0.2" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="3.2" cy="4.2" rx="1" ry="1.4" fill={MOUTH} />
        </>
      ) : null}
      {mood === 'happy' ? (
        <>
          <path d="M1.5 0.2 Q3 -1.6 4.5 0.2" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M1.6 3 Q3.2 6.4 5 3" fill={MOUTH} stroke={MOUTH} strokeWidth="0.7" strokeLinejoin="round" />
        </>
      ) : null}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly holding: boolean
}

/** 子ども(右むき)。足もとが 0,0。あたま・どう・うで・あし が ちゃんと つながる */
function Child({ step, mood, nearArm, farArm, headTilt, holding }: ChildProps) {
  return (
    <>
      <Arm pose={farArm} color={TUNIC_FAR} grain={false} />
      {/* あし: こし から。あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 20} origin={[0, -13]}>
        <rect x="-1" y="-14" width="4.6" height="13.4" rx="2.3" fill={PANTS_DARK} />
        <ellipse cx="1.6" cy="-0.8" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[0, -13]}>
        <rect x="-3.6" y="-14" width="4.6" height="13.4" rx="2.3" fill={PANTS} />
        <ellipse cx="-1.2" cy="-0.8" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の 上から あたま へ */}
      <rect x="-0.2" y="-30" width="3.4" height="5.6" rx="1.5" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-5.2" y="-27.2" width="10.8" height="16.4" rx="4.6" fill={TUNIC} />
      <path d="M-4 -15.6 h8.4" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <Arm pose={nearArm} color={TUNIC_DARK} grain={holding} />
      {/* あたま: くびの つけねを じく に、上を むいたり 下を むいたり */}
      <Layer rotate={headTilt} origin={[1.5, -27]}>
        <g transform="translate(1.5 -33)">
          <circle cx="0" cy="0" r="6.2" fill={SKIN} />
          <path d="M-6.3 1 C-7.4 -8.4 3.6 -9.6 6 -2.6 C3.4 -4.6 -2 -4.4 -6.3 1 Z" fill={HAIR} />
          <path d="M-1 -6.4 Q-0.6 -9.6 1.4 -8 Q2.4 -10 3.2 -7.2" fill="none" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} />
        </g>
      </Layer>
    </>
  )
}

/** おなかが「ぐう」。おなかの まえに、おとの わ が ひろがる */
function Rumble({ t }: SceneProps) {
  const show = during(t, ARRIVE + 0.05, EARS + 0.7, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#9aa6bd" strokeWidth="0.9" strokeLinecap="round">
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d={`M${CHILD_X + 9 + p * 4} ${FEET_Y - 20 - p * 1.4} q2 2.6 0 5.2`} opacity={1 - p} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // あるく: 左から 田んぼの まえまで。あしを ふって、体が 上下する
  const walking = 1 - span(t, ARRIVE - 0.25, ARRIVE)
  const stride = t < ARRIVE_FROM ? 0 : Math.sin((t - ARRIVE_FROM) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, ARRIVE_FROM, ARRIVE, -34, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2
  // よろこびの ぴょんぴょん(2かい)
  const hop = t >= CHEER && t < INK - 0.05 ? Math.abs(Math.sin(((t - CHEER) / 0.45) * Math.PI)) * 4.5 : 0

  const mood: Mood = t < EARS + 0.5 ? 'hungry' : t < LAND ? 'wonder' : 'happy'
  // 顔の むき: 見あげる → つぶを 目でおう → てのひらを 見る → まえを むいて よろこぶ
  const lookUp = mix(t, EARS + 0.6, EARS + 1.2, 0, -18)
  const follow = mix(t, FALL, LAND, 0, 32, easeIn)
  const relax = span(t, CHEER - 0.1, CHEER + 0.3)
  const headTilt = t < EARS + 0.6 ? stride * 2 - 3 : (lookUp + follow) * (1 - relax) - relax * 6

  // うで: あるくときは おなかを おさえて、立ち止まると おどろいて ぶらん。つぶを うけとり、さいごに ばんざい
  const toHang = span(t, EARS + 0.5, EARS + 0.9, easeInOut)
  const toReach = span(t, LOOSE - 0.2, LOOSE + 0.35, easeInOut)
  const toCheer = span(t, CHEER - 0.05, CHEER + 0.4, easeOut)
  const nearBase = lerpPose(lerpPose(BELLY_HAND, HANG, toHang), REACH, toReach)
  const nearArm = lerpPose(nearBase, CHEER_NEAR, toCheer)
  const farWalk: ArmPose = { upper: -stride * 25, fore: -stride * 25 + 12 }
  const farArm = lerpPose(farWalk, CHEER_FAR, toCheer)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Rice t={t} />
        <Layer opacity={span(t, ARRIVE_FROM - 0.1, ARRIVE_FROM + 0.15)}>
          <ellipse cx={CHILD_X + walkX} cy="97.4" rx={8 - hop * 0.4} ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={CHILD_X + walkX} y={FEET_Y + bob - hop}>
            <Child step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} holding={t >= LAND} />
          </Layer>
        </Layer>
        <Rumble t={t} />
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
