/*
 * 見(みる): ちょうちょうに きづいた子が、めを まんまるに あけて じっと みる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … 「めの まど」の 左の わく
 *   2画目(コ)  … 「めの まど」の 上と 右の わく
 *   3画目(一)  … まどの 中の まゆ(おどろいて 上がる)
 *   4画目(一)  … まどの 中の おおきな め の まんなか
 *   5画目(一)  … まどの いちばん下の まどべ(した の わく)
 *   6画目(ノ)  … 子どもの ひだりあし(あし と どうの かたむき)
 *   7画目(乚)  … 子どもの みぎあし と、ちょうちょうの いる みぎ がわ
 *   (子どもの あし は ほんものの 形のまま。字の 6・7画目とは だいたい 同じ あたり)
 *
 * ながれ
 *   たいくつそうな子が あるいてきて たちどまる(うつむいて、ぼんやり)
 *   → ちょうちょうが とんでくる。「!」 と めを まんまるに(おどろき)
 *   → あたまの上に 「めの まど」が ぽん と ひらき、おおきな ひとみが ちょうちょうを おいかける
 *   → 子どもが 手を のばすと、ちょうちょうが ゆびに とまる。にこにこ(うれしい)
 *   → ほね が ひかって、絵が うすくなり、字「見」が のこる
 *
 * 子どもは ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく、あたま は どう の まんなか の上。うで は かた から出て ひじ で まがる。
 *   あし は こし から 左右に 1ぽんずつ。ひとみは ちょうちょうの ほうへ うごく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '見'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f08a5d'
const TUNIC_DARK = '#d9703f'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const IRIS = '#7a5238'
const WING = '#ff9ac1'
const WING_DARK = '#f2709e'
const WING_LIGHT = '#ffd0e2'

/** くぎり の時間(秒) */
const WALK = 0.5
const STOP = 2.0
const FLY = 2.3
const NOTICE = 3.1
const FRAME = 3.9
const REACH = 5.0
const LAND = 5.9
const INK = 6.6
const DONE = 9.2
const DURATION = 10.2

/** 子どもの 足もと の まんなか(x)と 地面(y)。からだ は ここから 上に 立つ */
const CHILD_X = 51
const HIP_Y = 89
const SHOULDER_Y = 80
const SHOULDER_X = 5.8
/** うで の ぶぶん(かた〜ひじ、ひじ〜手)の長さ */
const ARM_PART = 5.2
/** 頭の中心(子ども の 内がわ の 座標)と くび */
const HEAD: readonly [number, number] = [0, 70]
const NECK: readonly [number, number] = [0, 77]

/** 「めの まど」の まんなか(ひとみ の ゆれる中心) */
const EYE_C: readonly [number, number] = [52, 42]

type Vec = readonly [number, number]

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
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="52" rx="7" ry="3.2" />
        <ellipse cx="3" cy="50" rx="5" ry="3.2" />
        <ellipse cx="96" cy="58" rx="6" ry="2.8" />
        <ellipse cx="100.5" cy="56.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 84, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** うで の かっこう。swing = ま下から そとへ ひらいた角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** ゆびを さすときの みぎうで(ま下から そとへ 108度、ひじ から さらに 16度) */
const REACH_POSE: ArmPose = { swing: 108, bend: 16 }

/** かた → ひじ → 手 の じゅんの 3点。side = 1 は 右がわ(画面の右)、-1 は 左がわ */
function armPoints(side: 1 | -1, pose: ArmPose): readonly [Vec, Vec, Vec] {
  const shoulder: Vec = [side * SHOULDER_X, SHOULDER_Y]
  const elbow: Vec = [shoulder[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Vec = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART]
  return [shoulder, elbow, hand]
}

function Arm({ side, pose, color }: { readonly side: 1 | -1; readonly pose: ArmPose; readonly color: string }) {
  const [s, e, h] = armPoints(side, pose)
  return (
    <>
      <path d={`M${s[0]} ${s[1]} L${e[0]} ${e[1]} L${h[0]} ${h[1]}`} fill="none" stroke={color} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={h[0]} cy={h[1]} r="2.2" fill={SKIN} />
    </>
  )
}

type Mood = 'bored' | 'wow' | 'glad'

type ChildProps = {
  readonly mood: Mood
  readonly step: number
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  /** ひとみ の むき(-1〜1) */
  readonly gaze: Vec
}

function Face({ mood, gaze }: { readonly mood: Mood; readonly gaze: Vec }) {
  const eyes = [-2.9, 2.9]
  return (
    <>
      <circle cx="-4.7" cy="73.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      <circle cx="4.7" cy="73.2" r="1.5" fill="#ff9d9d" opacity="0.55" />
      {eyes.map((x) =>
        mood === 'bored' ? (
          <circle key={x} cx={x + gaze[0] * 0.6} cy={70.6 + gaze[1] * 0.6} r="1.05" fill="#2b2b2b" />
        ) : (
          <g key={x}>
            <circle cx={x} cy="70.3" r="2.2" fill="#ffffff" />
            <circle cx={x + gaze[0] * 0.9} cy={70.3 + gaze[1] * 0.9} r="1.2" fill="#2b2b2b" />
          </g>
        ),
      )}
      {mood === 'bored' && <path d="M-1.4 74.9 q1.4 -0.8 2.8 0" fill="none" stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />}
      {mood === 'wow' && <ellipse cx="0" cy="74.6" rx="1.2" ry="1.6" fill="#b9483f" />}
      {mood === 'glad' && <path d="M-2.3 73.6 Q0 77.4 2.3 73.6 Z" fill="#b9483f" stroke="#b9483f" strokeWidth="0.6" strokeLinejoin="round" />}
    </>
  )
}

/** 正面を向いた子ども。くび は みじかく、あたま は どう の まんなか の上。 */
function Child({ mood, step, leftArm, rightArm, headTilt, gaze }: ChildProps) {
  return (
    <>
      {/* あし: こし から 左右に 1ぽんずつ(あるくとき かわりばんこに ふる) */}
      <Layer rotate={step * 18} origin={[-2.9, HIP_Y]}>
        <rect x="-5" y="88" width="4.2" height="8.4" rx="2.1" fill={PANTS} />
        <ellipse cx="-2.9" cy="96.7" rx="3.4" ry="1.7" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 18} origin={[2.9, HIP_Y]}>
        <rect x="0.8" y="88" width="4.2" height="8.4" rx="2.1" fill={PANTS} />
        <ellipse cx="2.9" cy="96.7" rx="3.4" ry="1.7" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま に かくれて すきまだけ 見える */}
      <rect x="-2" y="74.4" width="4" height="5" rx="1.8" fill={SKIN_SHADE} />
      <rect x="-6.2" y="77" width="12.4" height="13" rx="5" fill={TUNIC} />
      <path d="M-4.6 86.4 h9.2" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm side={-1} pose={leftArm} color={TUNIC_DARK} />
      <Arm side={1} pose={rightArm} color={TUNIC_DARK} />
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="-7.6" cy="70.8" r="1.6" fill={SKIN_SHADE} />
        <circle cx="7.6" cy="70.8" r="1.6" fill={SKIN_SHADE} />
        <circle cx={HEAD[0]} cy={HEAD[1]} r="7.6" fill={SKIN} />
        <path d="M-7.9 69 C-8.4 61 -1 58.6 3.5 60 C7.8 61 8.4 65.6 7.9 69 C5.4 65.4 1 63.4 -2 63.8 C-4.6 64 -6.6 66 -7.9 69 Z" fill={HAIR} />
        <Face mood={mood} gaze={gaze} />
      </Layer>
    </>
  )
}

/** ちょうちょう の いま の場所 と、はばたきの はやさ */
type Fly = { readonly pos: Vec; readonly flap: number; readonly seen: boolean }

/** 手の さき の 画面の場所(子どもが のびを したときの みぎ手) */
const HAND: Vec = (() => {
  const [, , hand] = armPoints(1, REACH_POSE)
  return [CHILD_X + hand[0], hand[1]]
})()

function butterfly(t: number): Fly {
  if (t < FLY) return { pos: [118, 6], flap: 0, seen: false }
  const hoverAt = (u: number): Vec => [89 + Math.sin(u * 2.1) * 5, 32 + Math.sin(u * 3.3) * 3]
  const arrive = span(t, FLY, NOTICE + 0.4, easeOut)
  const hover = hoverAt(t)
  if (t < NOTICE + 0.4) return { pos: [mix(t, FLY, NOTICE + 0.4, 118, hover[0], easeOut), mix(t, FLY, NOTICE + 0.4, 6, hover[1], easeOut) + Math.sin(arrive * 12) * 1.2], flap: 1, seen: true }
  const leave = REACH + 0.2
  if (t < leave) return { pos: hover, flap: 1, seen: true }
  const from = hoverAt(leave)
  const land = span(t, leave, LAND, easeInOut)
  if (land < 1) return { pos: [from[0] + (HAND[0] - from[0]) * land, from[1] + (HAND[1] - 2.4 - from[1]) * land + Math.sin(land * Math.PI) * -3], flap: 1, seen: true }
  return { pos: [HAND[0], HAND[1] - 2.4 + wave(t, 1.3) * 0.2], flap: 0.35, seen: true }
}

function Butterfly({ fly, t }: { readonly fly: Fly; readonly t: number }) {
  if (!fly.seen) return null
  const beat = 0.3 + 0.7 * Math.abs(wave(t, fly.flap >= 1 ? 0.3 : 1.1))
  return (
    <Layer x={fly.pos[0]} y={fly.pos[1]}>
      <Layer scaleX={beat}>
        <ellipse cx="-3.6" cy="-1.2" rx="3.6" ry="2.8" fill={WING} />
        <ellipse cx="-2.8" cy="2" rx="2.4" ry="2" fill={WING_DARK} />
        <circle cx="-4.2" cy="-1.6" r="0.9" fill={WING_LIGHT} />
        <ellipse cx="3.6" cy="-1.2" rx="3.6" ry="2.8" fill={WING} />
        <ellipse cx="2.8" cy="2" rx="2.4" ry="2" fill={WING_DARK} />
        <circle cx="4.2" cy="-1.6" r="0.9" fill={WING_LIGHT} />
      </Layer>
      <ellipse cx="0" cy="0.4" rx="0.9" ry="3" fill="#5a3b2a" />
      <path d="M-0.4 -2.4 Q-1.6 -4.4 -2.6 -4.6 M0.4 -2.4 Q1.6 -4.4 2.6 -4.6" fill="none" stroke="#5a3b2a" strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/** 「めの まど」: 子どもの め を おおきく うつす。ひとみが ちょうちょうを おいかける。 */
function EyeWindow({ t, fly }: { readonly t: number; readonly fly: Fly }) {
  const pop = span(t, FRAME, FRAME + 0.5, backOut)
  if (pop <= 0) return null
  const open = mix(t, FRAME + 0.25, FRAME + 0.85, 0.08, 1, easeOut)
  // ひとみ: ちょうちょうの ほうへ(まんなか から 4 まで)
  const dx = fly.pos[0] - EYE_C[0]
  const dy = fly.pos[1] - EYE_C[1]
  const len = Math.max(1, Math.hypot(dx, dy))
  const reach = Math.min(1, len / 22) * 4.2
  const ix = EYE_C[0] + (dx / len) * reach
  const iy = EYE_C[1] + (dy / len) * reach * 0.8
  const [cx, cy] = EYE_C
  const almond = `M37.5 ${cy} Q${cx} ${cy - 24 * open} 66.5 ${cy} Q${cx} ${cy + 18 * open} 37.5 ${cy} Z`
  return (
    <Layer scale={Math.max(0.01, pop)} origin={[51, 62]}>
      {/* ふきだし の しっぽ: あたま の 上 から まど へ */}
      <path d="M46 59 L51 65 L56 59 Z" fill={BARK} />
      {/* まど の わく(1・2画目)と まどべ(5画目) */}
      <rect x="33.4" y="13.4" width="37" height="46.6" rx="5" fill={SKIN} stroke={BARK} strokeWidth="2.6" />
      <rect x="31.2" y="56.2" width="41.6" height="4.8" rx="2.2" fill={BARK} />
      {/* まゆ(3画目): ひとみが ひらく と 上がる */}
      <path d={`M39.5 ${31 - 2 * open} Q${cx} ${23 - 2.4 * open} 64.5 ${30 - 2 * open}`} fill="none" stroke={HAIR} strokeWidth="2.4" strokeLinecap="round" />
      <clipPath id="k898b-eye-clip">
        <path d={almond} />
      </clipPath>
      <path d={almond} fill="#ffffff" />
      <g clipPath="url(#k898b-eye-clip)">
        <circle cx={ix} cy={iy} r="8" fill={IRIS} />
        <circle cx={ix} cy={iy} r="4.2" fill="#2b2b2b" />
        <circle cx={ix - 2.6} cy={iy - 2.8} r="2" fill="#ffffff" />
        <circle cx={ix + 2.4} cy={iy + 2.6} r="1" fill="#ffffff" opacity="0.8" />
      </g>
      <path d={`M37.5 ${cy} Q${cx} ${cy - 24 * open} 66.5 ${cy}`} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
      {/* したまぶた の かげ: ひらくほど こく */}
      <path d={`M41 ${cy + 10 * open + 2} Q${cx} ${cy + 15 * open + 2} 63 ${cy + 10 * open + 2}`} fill="none" stroke={SKIN_SHADE} strokeWidth="1.2" strokeLinecap="round" opacity={open} />
    </Layer>
  )
}

/** おどろいた「!」 */
function Bang({ t }: SceneProps) {
  const show = during(t, NOTICE, FRAME + 0.2, 0.15)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, NOTICE, NOTICE + 0.25, backOut))
  return (
    <Layer opacity={show} x={CHILD_X - 12} y={64} scale={pop} origin={[0, 0]}>
      <rect x="-1.1" y="-6" width="2.2" height="5.4" rx="1.1" fill="#e8534a" />
      <circle cx="0" cy="1.6" r="1.2" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // あるく: 左から まんなか へ。止まる ちょくぜん に ふりを へらす
  const walking = 1 - span(t, STOP - 0.25, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  const walkX = mix(t, WALK, STOP, -62, 0, easeOut)
  const bob = -Math.abs(stride) * 1.2

  const fly = butterfly(t)
  const mood: Mood = t < NOTICE ? 'bored' : t < REACH + 0.2 ? 'wow' : 'glad'

  // ひとみの むき: たいくつ の間は 足もと、きづいてからは ちょうちょう を おう
  const head: Vec = [CHILD_X + walkX + HEAD[0], HEAD[1]]
  const gx = fly.pos[0] - head[0]
  const gy = fly.pos[1] - head[1]
  const glen = Math.max(1, Math.hypot(gx, gy))
  const look = span(t, NOTICE, NOTICE + 0.3)
  const gaze: Vec = [mix(t, NOTICE, NOTICE + 0.3, 0, gx / glen), mix(t, NOTICE, NOTICE + 0.3, 0.8, gy / glen)]
  const headTilt = t < NOTICE ? -3 + stride * 2 : look * Math.max(-8, Math.min(8, gx * 0.12))

  // うで: あるくとき は ぎゃくに ふる。たったら だらんと下げ、ゆびを さす とき みぎ手を のばす
  const hang: ArmPose = { swing: 8, bend: 6 }
  const reach = span(t, REACH, REACH + 0.5, easeInOut)
  const leftArm: ArmPose = t < STOP ? { swing: 8 - stride * 24, bend: 10 } : hang
  const rightArm: ArmPose =
    t < STOP
      ? { swing: 8 + stride * 24, bend: 10 }
      : { swing: hang.swing + (REACH_POSE.swing - hang.swing) * reach, bend: hang.bend + (REACH_POSE.bend - hang.bend) * reach }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.15)}>
          <ellipse cx={CHILD_X + walkX} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={CHILD_X + walkX} y={bob}>
            <Child mood={mood} step={stride} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} gaze={gaze} />
          </Layer>
        </Layer>
        <Bang t={t} />
        <EyeWindow t={t} fly={fly} />
        <Butterfly fly={fly} t={t} />
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
    { at: 0, label: 'たいくつそうな子が あるいてくる', sound: 'pop' },
    { at: FLY, label: 'ちょうちょうが とんでくる' },
    { at: NOTICE, label: 'きづいて、めを まんまるに', sound: 'pop' },
    { at: FRAME, label: 'おおきな め で じっと みる' },
    { at: LAND, label: 'ゆびに とまって にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '見 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
