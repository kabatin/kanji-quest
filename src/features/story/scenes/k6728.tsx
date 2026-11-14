/*
 * 木(き): りすが どんぐりを うめると、めが出て、きが いっぽん たつ。みきと えだと ねっこ。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 土の いちばん上(じめんの線)。くさ の はえた ところ
 *   2画目(丨)  … みき(じめんより上)と、まっすぐ下に のびる ふとい ねっこ(じめんより下)
 *   3画目(ノ)  … じめんの下で 左ななめ下に ひろがる ねっこ
 *   4画目(\)   … じめんの下で 右ななめ下に ひろがる ねっこ
 *   (どんぐりを うめた ばしょ が、みき と ねっこ の はじまり。じめんの下が 見える「だんめん」の絵)
 *
 * ながれ
 *   どんぐりを 1こ もった りすが しょんぼり あるいてくる(おなかが すいて、どんぐりが たりない)
 *   → 「そうだ!」と ひらめいて、どんぐりを じめんに おき、土を ほる
 *   → どんぐりを あなに いれて、土を かぶせて ぽんぽん。雲が きて 雨を ふらせる
 *   → どんぐりから ねっこが のびて、めが 出て、みきが のび、はが しげって 木になる
 *   → りすは びっくり、そして 大よろこびで ぴょんぴょん
 *   → ほね が ひかって、絵が うすくなり、字「木」が のこる
 *
 * りすは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。しっぽ は せなか から、みみ は あたまの上。
 *   手は ほんとうに とどく ところ へ だけ のばす(とどかない ときは 体を まえに かたむける)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import { Canopy, Cloud, Hills, PALETTE, Sun } from '../sceneFigures'

const CHAR = '木'

const SOIL = '#a8734a'
const SOIL_DARK = '#8c5b3c'
const SOIL_LIGHT = '#c99467'
const HOLE = '#6d4630'
const ROOT = '#f4dfb6'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const FUR = '#c9803f'
const FUR_DARK = '#a9642c'
const FUR_LIGHT = '#e3a465'
const BELLY = '#f7e0bb'
const NUT = '#c98a4b'
const NUT_CAP = '#8a5a34'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const CLOUD = '#c9d3e0'
const CLOUD_DARK = '#a9b7ca'
const RAIN = '#7cc4f2'

/** くぎり の時間(秒) */
const ARRIVE_FROM = 0.3
const ARRIVE_TO = 1.5
/** 「そうだ!」と ひらめく */
const IDEA = 2.0
/** どんぐりを じめんに おく → つちを ほる */
const PUT_DOWN = 2.2
const DIG = 2.7
const DIG_END = 3.6
/** どんぐりを ひろって、あなの上へ はこび、おとす */
const CARRY = 4.0
const RELEASE = 4.45
const LANDED = 4.75
/** つちを かぶせて ぽんぽん */
const COVER = 5.0
const PAT_END = 5.7
/** 雲が きて 雨 */
const CLOUD_IN = 5.0
const CLOUD_OUT = 6.3
/** そだつ */
const ROOT_AT = 5.9
const SHOOT_AT = 6.2
const GROWN = 7.3
const CROWN_AT = 7.0
const CHEER = 7.6
const INK = 8.4
const DONE = 11.2
const DURATION = 11.5

type Pt = readonly [number, number]

/** じめんの たかさ(1画目の線) と、うめる ばしょ */
const GROUND_Y = 38
const SPOT_X = 53.7
const HOLE_Y = 44
/** 2画目の線のうえで、じめん(y=38)に あたる ばしょ(0〜1) */
const GROUND_AT = 0.31
const ACORN_ON_GROUND: Pt = [47, 36.6]
const ACORN_IN_HOLE: Pt = [SPOT_X, HOLE_Y + 1.6]

/** りす の おおきさ と、ひじ・かた の ながさ(りす の中の座標) */
const SQ_SCALE = 1.1
const HIP: Pt = [0, -5]
const SHOULDER_NEAR: Pt = [3, -12]
const SHOULDER_FAR: Pt = [4.6, -12.4]
const ARM = 6.2

type SquirrelPose = {
  /** あしもと(じめん)の ばしょ */
  readonly x: number
  readonly y: number
  /** まえへ かたむく角度(こし を じくに) */
  readonly lean: number
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** りす の体の中の点 → 絵の座標(かたむき も ふくめる) */
function atUpper(p: SquirrelPose, point: Pt): Pt {
  const dx = point[0] - HIP[0]
  const dy = point[1] - HIP[1]
  const c = Math.cos(rad(p.lean))
  const s = Math.sin(rad(p.lean))
  return [p.x + SQ_SCALE * (HIP[0] + dx * c - dy * s), p.y + SQ_SCALE * (HIP[1] + dx * s + dy * c)]
}

/** 絵の座標 → りす の体の中の点(手を とどかせたい場所を、体の中の座標に直す) */
function toUpper(p: SquirrelPose, world: Pt): Pt {
  const ux = (world[0] - p.x) / SQ_SCALE - HIP[0]
  const uy = (world[1] - p.y) / SQ_SCALE - HIP[1]
  const c = Math.cos(rad(p.lean))
  const s = Math.sin(rad(p.lean))
  return [HIP[0] + ux * c + uy * s, HIP[1] - ux * s + uy * c]
}

/** かた から ひじ を通って 手 まで。手が とどかない ときは、とどく ところまで。ひじ は うしろへ まがる。 */
function reachArm(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Pt = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const mid: Pt = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const h = Math.sqrt(Math.max(ARM * ARM - (reach / 2) ** 2, 0))
  const a: Pt = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Pt = [mid[0] + uy * h, mid[1] - ux * h]
  return { elbow: a[0] < b[0] ? a : b, hand }
}

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

type Mood = 'sad' | 'focus' | 'wonder' | 'happy'

function Arm({ shoulder, target, color }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = reachArm(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="1.7" fill={color} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3.6" cy="-15.2" r="1.2" fill={CHEEK} opacity="0.6" />
      {mood === 'happy' ? (
        <>
          <path d="M3.9 -18 Q5.2 -19.6 6.5 -18" fill="none" stroke={EYE} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M6 -15.3 Q7 -13.6 8.2 -15.3 Z" fill={MOUTH} />
        </>
      ) : mood === 'wonder' ? (
        <>
          <circle cx="5.2" cy="-18" r="1.4" fill={EYE} />
          <circle cx="5.6" cy="-18.4" r="0.5" fill="#ffffff" />
          <ellipse cx="7" cy="-14.7" rx="0.9" ry="1.1" fill={MOUTH} />
        </>
      ) : mood === 'sad' ? (
        <>
          <circle cx="5.2" cy="-17.8" r="0.95" fill={EYE} />
          <path d="M3.8 -19.7 l2.8 -0.9" stroke={FUR_DARK} strokeWidth="0.8" strokeLinecap="round" />
          <path d="M5.8 -14.4 Q7 -15.4 8.2 -14.4" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="5.2" cy="-17.8" r="0.95" fill={EYE} />
          <path d="M3.8 -19.4 l2.8 0.7" stroke={FUR_DARK} strokeWidth="0.8" strokeLinecap="round" />
          <path d="M5.8 -15.2 Q7 -14.2 8.2 -15.2" fill="none" stroke={MOUTH} strokeWidth="0.8" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type SquirrelProps = {
  readonly pose: SquirrelPose
  readonly mood: Mood
  readonly nearTarget: Pt
  readonly farTarget: Pt
  readonly tailSwing: number
}

/** 右むきの りす。うで は かた→ひじ→手。しっぽ は せなか から。 */
function Squirrel({ pose, mood, nearTarget, farTarget, tailSwing }: SquirrelProps) {
  const nearUpper = toUpper(pose, nearTarget)
  const farUpper = toUpper(pose, farTarget)
  return (
    <Layer x={pose.x} y={pose.y} scale={SQ_SCALE}>
      {/* しっぽ: おしり から ふわっと 上へ */}
      <Layer rotate={tailSwing} origin={[-3, -6]}>
        <ellipse cx="-6.4" cy="-12" rx="3.9" ry="8.6" transform="rotate(-18 -6.4 -12)" fill={FUR_DARK} />
        <ellipse cx="-5.8" cy="-12.6" rx="2.1" ry="6" transform="rotate(-18 -5.8 -12.6)" fill={FUR} />
      </Layer>
      {/* あし: こし から まえへ のびた足 */}
      <circle cx="-0.4" cy="-4" r="3.6" fill={FUR_DARK} />
      <ellipse cx="1.8" cy="-1.1" rx="3.8" ry="1.9" fill={FUR_DARK} />
      <Layer rotate={pose.lean} origin={HIP}>
        <Arm shoulder={SHOULDER_FAR} target={farUpper} color={FUR_DARK} />
        <ellipse cx="0.6" cy="-8.6" rx="4.7" ry="6.6" fill={FUR} />
        <ellipse cx="1.9" cy="-8" rx="2.6" ry="4.9" fill={BELLY} />
        <Arm shoulder={SHOULDER_NEAR} target={nearUpper} color={FUR_LIGHT} />
        {/* あたま: みみ は あたまの上 */}
        <path d="M0.6 -20.8 L1.4 -24.8 L3.6 -21.6 Z" fill={FUR_DARK} />
        <path d="M3.8 -21.8 L5.6 -25.2 L7 -21.2 Z" fill={FUR_DARK} />
        <circle cx="3.4" cy="-17.4" r="4.7" fill={FUR} />
        <ellipse cx="6.9" cy="-16.1" rx="2.4" ry="1.8" fill={BELLY} />
        <circle cx="8.7" cy="-16.5" r="0.8" fill={EYE} />
        <Face mood={mood} />
      </Layer>
    </Layer>
  )
}

function Acorn({ at }: { readonly at: Pt }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <ellipse cx="0" cy="0.4" rx="1.9" ry="2.3" fill={NUT} />
      <path d="M-2.1 -0.9 Q0 -3.6 2.1 -0.9 Q0 -0.2 -2.1 -0.9 Z" fill={NUT_CAP} />
      <path d="M0 -2.9 l0.3 -1" stroke={NUT_CAP} strokeWidth="0.6" strokeLinecap="round" />
    </g>
  )
}

function Ground({ t }: SceneProps) {
  return (
    <>
      <Sun t={t} />
      {/* とおくの おか(おくゆき) */}
      <Hills y={-60} />
      {/* 土の だんめん */}
      <rect x="-2" y={GROUND_Y} width="113" height="73" fill={SOIL} />
      <path d={`M-2 62 Q20 58 40 64 T80 62 T111 66 V111 H-2 Z`} fill={SOIL_DARK} opacity="0.35" />
      {[
        [10, 52, 2.4],
        [27, 90, 3],
        [78, 57, 2.2],
        [96, 92, 2.8],
        [70, 100, 2],
        [14, 70, 1.6],
        [92, 64, 1.8],
      ].map(([x, y, r]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={r} ry={r * 0.72} fill={SOIL_LIGHT} />
      ))}
      {/* じめんの くさ(1画目の線) */}
      <rect x="-2" y="35.6" width="113" height="4" rx="2" fill={LEAF} />
      <rect x="-2" y="35.6" width="113" height="2" rx="1" fill={GRASS} />
      {[8, 28, 70, 96].map((x) => (
        <path key={x} d={`M${x} 35.8 l1 -3.4 l1 3 l1.4 -3.8 l0.6 4.2 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** どんぐりの あな と、かぶせた 土の もりあがり */
function Hole({ t }: SceneProps) {
  const open = span(t, DIG, DIG_END, easeOut) * (1 - span(t, COVER, COVER + 0.6))
  const mound = span(t, COVER + 0.2, COVER + 0.7, backOut) * (1 - span(t, ROOT_AT, GROWN))
  const pat = mound * (1 - 0.18 * Math.max(0, wave(t - COVER, 0.5)) * (1 - span(t, PAT_END - 0.4, PAT_END)))
  return (
    <>
      {open > 0 && (
        <>
          <ellipse cx={SPOT_X} cy={HOLE_Y} rx={5.4 * open} ry={4.4 * open} fill={HOLE} />
          <rect x={SPOT_X - 4.6 * open} y="35.6" width={9.2 * open} height="4.4" rx="1.6" fill={HOLE} />
        </>
      )}
      {mound > 0 && <ellipse cx={SPOT_X} cy="36.4" rx={5.8 * mound} ry={2.6 * pat} fill={SOIL_LIGHT} />}
    </>
  )
}

/** ほった 土の かけら: ぽん ぽん と とぶ */
function Crumbs({ t }: SceneProps) {
  const show = during(t, DIG, DIG_END, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} fill={SOIL_LIGHT}>
      {[0, 0.33, 0.66].map((offset, i) => {
        const p = ((t * 1.7 + offset) % 1)
        const dir = i % 2 === 0 ? 1 : -1
        return <circle key={offset} cx={SPOT_X + dir * p * 7} cy={36 - Math.sin(p * Math.PI) * 8} r={1 - p * 0.3} />
      })}
    </g>
  )
}

function RainCloud({ t }: SceneProps) {
  const x = t < CLOUD_OUT ? mix(t, CLOUD_IN, CLOUD_IN + 0.7, 130, 66, easeOut) : mix(t, CLOUD_OUT, CLOUD_OUT + 0.8, 66, 134, easeIn)
  if (x > 125) return null
  const drops = during(t, CLOUD_IN + 0.7, CLOUD_OUT - 0.1, 0.15)
  return (
    <>
      <g opacity={drops} stroke={RAIN} strokeWidth="1" strokeLinecap="round">
        {[0, 0.34, 0.68, 0.17, 0.5, 0.85].map((offset, i) => {
          const p = (t * 1.5 + offset) % 1
          const dropX = 56 + (i % 3) * 3.6
          const dropY = 14 + p * 21
          return <path key={offset} d={`M${dropX} ${dropY} v2.4`} />
        })}
      </g>
      <g transform={`translate(${x} 8)`}>
        <Cloud x={-4} y={2} size={1.5} opacity={1} color={CLOUD} />
        <ellipse cx="0" cy="3.6" rx="11" ry="1.6" fill={CLOUD_DARK} />
      </g>
    </>
  )
}

/** うめた どんぐりから ねっこ・みき・は が そだつ */
function Tree({ t }: SceneProps) {
  const rootG = span(t, ROOT_AT, GROWN, easeOut)
  const shootG = span(t, SHOOT_AT, GROWN, easeOut)
  const crown = Math.max(0, span(t, CROWN_AT, CROWN_AT + 0.7, backOut))
  const sway = wave(t, 3.2) * 1.2 * crown
  const nut = span(t, CROWN_AT + 0.5, CROWN_AT + 1.0, backOut)
  return (
    <>
      {/* ねっこ: 2画目の したがわ(まっすぐ下)・3画目・4画目 */}
      {rootG > 0 && <Bone char={CHAR} n={2} color={ROOT} width={3.4} from={GROUND_AT} to={GROUND_AT + (1 - GROUND_AT) * rootG} />}
      {rootG > 0 && <Bone char={CHAR} n={3} color={ROOT} width={2.8} from={0} to={rootG} />}
      {rootG > 0 && <Bone char={CHAR} n={4} color={ROOT} width={2.8} from={0} to={rootG} />}
      {/* みき: 2画目の うえがわ。じめんから 上へ のびる */}
      {shootG > 0 && <Bone char={CHAR} n={2} color={BARK} width={5.4} from={GROUND_AT - GROUND_AT * shootG} to={GROUND_AT + 0.015} />}
      <Canopy x={54} y={9} r={16} grow={span(t, CROWN_AT, CROWN_AT + 0.7)} sway={sway} />
      <Layer scale={nut} origin={[54, 24]}>
        <Acorn at={[47.2, 22.6]} />
        <Acorn at={[61.4, 22]} />
      </Layer>
    </>
  )
}

/** てのばしょ(絵の座標)。じゅんばんに つながる なめらかな うごき。 */
function handTargets(t: number, pose: SquirrelPose, acorn: Pt): { readonly near: Pt; readonly far: Pt } {
  const rest = atUpper(pose, [7, -5.5])
  const restFar = atUpper(pose, [5.6, -6])
  // ほっている あいだ: かわりばんこに じめんを かく
  const scratchNear: Pt = [52 + wave(t, 0.6) * 1.6, 37.6 - 2.6 * (0.5 + 0.5 * wave(t, 0.45))]
  const scratchFar: Pt = [50.4 + wave(t, 0.6, 0.25) * 1.6, 37.6 - 2.6 * (0.5 + 0.5 * wave(t, 0.45, 0.22))]
  // うめおわって ぽんぽん
  const patNear: Pt = [53 + wave(t, 0.5) * 0.8, 36.8 - 2.2 * (0.5 + 0.5 * wave(t, 0.5))]
  const patFar: Pt = [50.8 + wave(t, 0.5) * 0.8, 36.8 - 2.2 * (0.5 + 0.5 * wave(t, 0.5, 0.25))]
  const above: Pt = [SPOT_X, 32.4]
  const cheerNear = atUpper(pose, [9.5, -26])
  const cheerFar = atUpper(pose, [6, -27.5])

  if (t < PUT_DOWN) return { near: acorn, far: [acorn[0] - 1.6, acorn[1] - 0.2] }
  if (t < DIG) return { near: acorn, far: [acorn[0] - 1.6, acorn[1] - 0.2] }
  if (t < DIG_END - 0.1) return { near: lerpPt(acorn, scratchNear, span(t, DIG, DIG + 0.2)), far: lerpPt(acorn, scratchFar, span(t, DIG, DIG + 0.2)) }
  if (t < RELEASE) {
    const toAcorn = span(t, DIG_END - 0.1, CARRY)
    return { near: lerpPt(scratchNear, acorn, toAcorn), far: lerpPt(scratchFar, [acorn[0] - 1.6, acorn[1] - 0.2], toAcorn) }
  }
  if (t < COVER) return { near: lerpPt(above, patNear, span(t, LANDED, COVER)), far: lerpPt([above[0] - 1.6, above[1]], patFar, span(t, LANDED, COVER)) }
  if (t < PAT_END) return { near: patNear, far: patFar }
  if (t < CHEER) {
    const k = span(t, PAT_END, PAT_END + 0.4)
    return { near: lerpPt(patNear, rest, k), far: lerpPt(patFar, restFar, k) }
  }
  const k = span(t, CHEER, CHEER + 0.3, easeOut)
  return { near: lerpPt(rest, cheerNear, k), far: lerpPt(restFar, cheerFar, k) }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // りす: 左から あるいてきて、木が そだつと すこし さがる
  const walkX = mix(t, ARRIVE_FROM, ARRIVE_TO, -14, 39, easeOut)
  const stepBack = mix(t, 6.6, 7.3, 0, -7)
  const walking = t > ARRIVE_FROM && t < ARRIVE_TO
  const bob = walking ? -Math.abs(Math.sin((t - ARRIVE_FROM) * Math.PI * 2 * 2.2)) * 1.1 : 0
  const cheering = during(t, CHEER, INK + 0.1, 0.15)
  const hop = cheering > 0 ? -Math.abs(wave(t - CHEER, 0.7)) * 4 * cheering : 0
  // かたむき: ひろう・ほる・うめる ときに まえへ。ほかは まっすぐ
  const lean =
    mix(t, PUT_DOWN, PUT_DOWN + 0.4, 0, 22) * (1 - span(t, CARRY + 0.2, RELEASE)) +
    mix(t, RELEASE, LANDED, 0, 12) * (1 - span(t, LANDED, COVER)) +
    mix(t, COVER, COVER + 0.2, 0, 22) * (1 - span(t, PAT_END, PAT_END + 0.4))
  const pose: SquirrelPose = { x: walkX + stepBack, y: 98 - 60 + bob + hop, lean: Math.min(lean, 28) }

  // どんぐり: もつ → じめんに おく → ひろう → はこぶ → あなに おとす
  const handsHeld = atUpper(pose, [9.4, -9.6])
  let acorn: Pt
  if (t < PUT_DOWN) acorn = handsHeld
  else if (t < PUT_DOWN + 0.4) acorn = lerpPt(handsHeld, ACORN_ON_GROUND, span(t, PUT_DOWN, PUT_DOWN + 0.4, easeInOut))
  else if (t < CARRY) acorn = ACORN_ON_GROUND
  else if (t < RELEASE) acorn = lerpPt(ACORN_ON_GROUND, [SPOT_X, 32.4], span(t, CARRY, RELEASE, easeInOut))
  else acorn = lerpPt([SPOT_X, 32.4], ACORN_IN_HOLE, span(t, RELEASE, LANDED, easeIn))
  const acornShow = t < ROOT_AT + 0.3 ? 1 : 1 - span(t, ROOT_AT + 0.3, ROOT_AT + 0.7)
  const hands = handTargets(t, pose, acorn)

  const mood: Mood = t < IDEA ? 'sad' : t < IDEA + 0.7 ? 'wonder' : t < SHOOT_AT ? 'focus' : t < CHEER ? 'wonder' : 'happy'
  const idea = during(t, IDEA, IDEA + 0.9, 0.2)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Hole t={t} />
        {acornShow > 0 && t >= LANDED && <Layer opacity={acornShow}><Acorn at={acorn} /></Layer>}
        <Tree t={t} />
        <Crumbs t={t} />
        <Layer opacity={span(t, ARRIVE_FROM - 0.1, ARRIVE_FROM + 0.1)}>
          <Squirrel pose={pose} mood={mood} nearTarget={hands.near} farTarget={hands.far} tailSwing={wave(t, 1.6) * 5} />
        </Layer>
        {t < LANDED && <Acorn at={acorn} />}
        <Layer opacity={idea} scale={0.6 + 0.4 * idea} origin={[48.5, 8.5]}>
          <Star cx={48.5} cy={8.5} r={3.6} color={PALETTE.sun} spin={t * 60} />
        </Layer>
        <RainCloud t={t} />
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
    { at: 0, label: 'お日さまと 土の だんめん', sound: 'pop' },
    { at: ARRIVE_FROM, label: 'どんぐりを もった りすが しょんぼり あるいてくる' },
    { at: IDEA, label: '「そうだ!」と ひらめく', sound: 'pop' },
    { at: DIG, label: 'どんぐりを おいて、土を ほる' },
    { at: CARRY, label: 'どんぐりを あなに いれる' },
    { at: COVER, label: '土を かぶせて ぽんぽん。雲が 雨を ふらせる' },
    { at: ROOT_AT, label: 'ねっこが のびて、めが 出て、木が そだつ', sound: 'pop' },
    { at: CHEER, label: 'りすは びっくり、大よろこび' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '木 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
