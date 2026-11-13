/*
 * 冬(ふゆ): あしの したに こおりが はる。さむい きせつ。
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
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために 体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   あしは こし から出て、すべって ひらくときも 同じ長さ(まえを むいたまま ひらく)。
 *   こちらへ あるくと、ちかづくので 大きくなり、足もとも 下に さがる。
 *   字の形になるのは、すべった さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '冬'

const SKY = '#e6f1fb'
const HILL_FAR = '#d3e4f3'
const HILL = '#f2f8fd'
const SNOW = '#f7fbff'
const FIR = '#3f8f6a'
const FIR_DARK = '#33775a'
const WATER = '#6fb8ea'
const ICE = '#d9f0ff'
const ICE_LIGHT = '#f0faff'
const RIM = '#ffffff'
const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const COAT = '#e8534a'
const COAT_DARK = '#c93f38'
const SCARF = '#ffd24a'
const SCARF_DARK = '#e8b830'
const HAT = '#4f9be0'
const HAT_DARK = '#3c82c4'
const PANTS = '#3e5c86'
const BOOT = '#6b4a36'
const MITT = '#4f9be0'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

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
/** こおりの上で すべる子の 足もと(立っているとき)の まんなか と 高さ。じく に使う */
const FEET: readonly [number, number] = [44, 74]
/** 立っているときの こし の高さ。すべって ひらくと 少し さがる */
const HIP_STAND = 38
const HIP_DROP = 6
/** 子どもの ぬいぐるみ みたいな 大きさ(ぜんぶ ここから そろえる) */
const ARM_PART = 10

type Mood = 'cold' | 'happy' | 'oops'
type ArmPose = { readonly swing: number; readonly bend: number }

const mixPose = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({ swing: a.swing + (b.swing - a.swing) * k, bend: a.bend + (b.bend - a.bend) * k })

/** あるくときの うで・さむくて 自分を だきしめる うで・すべって ひろげた うで(左は 1画目、右は 2画目の はじ に そろう) */
const SWING_ARM: ArmPose = { swing: 7, bend: 6 }
const HUG_ARM: ArmPose = { swing: 8, bend: -110 }
const FLAIL_LEFT: ArmPose = { swing: 55, bend: -15 }
const FLAIL_RIGHT: ArmPose = { swing: 130, bend: 20 }

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY} />
      <circle cx="93" cy="13" r={5.4 * sun} fill="#fff6cc" />
      <path d="M-4 60 Q18 40 42 52 Q60 38 82 50 Q98 44 113 56 V70 H-4 Z" fill={HILL_FAR} />
      <Fir x={8} base={56} height={22} />
      <Fir x={101} base={56} height={26} />
      <path d="M-4 62 Q20 52 46 60 Q72 50 113 62 V109 H-4 Z" fill={HILL} />
      <rect x="-4" y="64" width="117" height="50" fill={SNOW} />
    </>
  )
}

/** うしろの もみの木。雪を かぶっている */
function Fir({ x, base, height }: { readonly x: number; readonly base: number; readonly height: number }) {
  const w = height * 0.34
  const tier = (i: number) => {
    const top = base - height + i * (height * 0.22)
    const bottom = base - height * (0.42 - i * 0.2)
    const half = w * (0.55 + i * 0.28)
    return <path key={i} d={`M${x} ${top} L${x + half} ${bottom} L${x - half} ${bottom} Z`} fill={i % 2 === 0 ? FIR : FIR_DARK} stroke={i % 2 === 0 ? FIR : FIR_DARK} strokeWidth="1.4" strokeLinejoin="round" />
  }
  return (
    <>
      <rect x={x - 1.1} y={base - 3} width="2.2" height="4" fill="#70452b" />
      {[2, 1, 0].map(tier)}
      <path d={`M${x} ${base - height - 0.4} L${x + w * 0.45} ${base - height + height * 0.2} Q${x} ${base - height + height * 0.12} ${x - w * 0.45} ${base - height + height * 0.2} Z`} fill="#ffffff" />
    </>
  )
}

const ellipsePath = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`

/** 池。ふちから こおりが はって、まんなかの みずが なくなる。つるつるの つや(4・5画目)も 出る。 */
function Pond({ t }: SceneProps) {
  const freeze = span(t, FREEZE, FROZEN, easeInOut)
  const water = Math.max(0.001, 1 - freeze)
  const shine = span(t, FROZEN - 0.9, FROZEN + 0.3, easeOut)
  return (
    <>
      <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} fill={WATER} />
      {/* こおり: 外のだえん から、のこった みず の だえん を くりぬく */}
      <path d={`${ellipsePath(POND.cx, POND.cy, POND.rx, POND.ry)} ${freeze < 1 ? ellipsePath(POND.cx, POND.cy, POND.rx * water, POND.ry * water) : ''}`} fill={ICE} fillRule="evenodd" />
      <ellipse cx={POND.cx} cy={POND.cy - 4} rx={POND.rx * 0.62 * span(t, FREEZE + 1.2, FROZEN)} ry={POND.ry * 0.45 * span(t, FREEZE + 1.2, FROZEN)} fill={ICE_LIGHT} opacity="0.8" />
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

/** ふっている雪。ゆっくり おちて、くり返す(おちる はやさ は ひとつずつ ちがう)。 */
function Snow({ t }: SceneProps) {
  return (
    <g fill="#ffffff" stroke="#b9d3ea" strokeWidth="0.35">
      {Array.from({ length: 14 }, (_, i) => {
        const speed = 8 + (i % 4) * 2.5
        const x = ((i * 37 + 13) % 109) + Math.sin(t * 1.3 + i) * 2.2
        const y = ((t * speed + i * 17) % 114) - 4
        return <circle key={i} cx={x} cy={y} r={0.8 + (i % 3) * 0.3} />
      })}
    </g>
  )
}

/** かた から出て、ひじ で まがる うで。side は 左(-1)・右(1)。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ side, shoulder, pose }: { readonly side: -1 | 1; readonly shoulder: readonly [number, number]; readonly pose: ArmPose }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={COAT_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={MITT} />
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  /** すべって あしが ひらく度合い(0 = 立つ / 1 = 左右に ひらく) */
  readonly spread: number
  /** あるくとき、左あし(+)・右あし(-)を あげる */
  readonly step: number
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  /** さむい いき(0〜1 のくり返しの 進み。見せないときは null) */
  readonly breath: number | null
}

/** 冬ふくの子。あたまは どう の まんなか の上、あし は こし から、うで は かた から。 */
function Kid({ mood, spread, step, leftArm, rightArm, headTilt, breath }: KidProps) {
  const hipY = HIP_STAND + HIP_DROP * spread
  const leftFoot = [41 - 23 * spread, 74 - 6 * spread - Math.max(0, step) * 4] as const
  const rightFoot = [47 + 27 * spread, 74 - 8 * spread - Math.max(0, -step) * 4] as const
  const headY = hipY - 27.5
  const shoulderY = hipY - 16.5
  const scarfSwing = -spread * 18
  return (
    <>
      {/* あし: こし から まっすぐ。ひらいても おなじ長さの まま すべる */}
      <path d={`M41 ${hipY} L${leftFoot[0]} ${leftFoot[1]}`} stroke={PANTS} strokeWidth="7.6" strokeLinecap="round" />
      <path d={`M47 ${hipY} L${rightFoot[0]} ${rightFoot[1]}`} stroke={PANTS} strokeWidth="7.6" strokeLinecap="round" />
      <ellipse cx={leftFoot[0] - 0.4} cy={leftFoot[1] + 1} rx="5.4" ry="3.1" fill={BOOT} transform={`rotate(${-spread * 18} ${leftFoot[0]} ${leftFoot[1]})`} />
      <ellipse cx={rightFoot[0] + 0.4} cy={rightFoot[1] + 1} rx="5.4" ry="3.1" fill={BOOT} transform={`rotate(${spread * 18} ${rightFoot[0]} ${rightFoot[1]})`} />
      {/* どう */}
      <rect x="35" y={hipY - 19} width="18" height="21" rx="7" fill={COAT} />
      <rect x="37.4" y={hipY - 4.5} width="13.2" height="1.6" rx="0.8" fill={COAT_DARK} />
      <Arm side={-1} shoulder={[36.6, shoulderY]} pose={leftArm} />
      <Arm side={1} shoulder={[51.4, shoulderY]} pose={rightArm} />
      {/* マフラー(くび の まわり。はし が たれる) */}
      <Layer rotate={scarfSwing} origin={[50.4, hipY - 17]}>
        <rect x="48.6" y={hipY - 17} width="3.6" height="9.4" rx="1.7" fill={SCARF_DARK} />
      </Layer>
      <rect x="35.6" y={hipY - 21.4} width="16.8" height="5" rx="2.5" fill={SCARF} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[44, hipY - 19]}>
        <circle cx="36.8" cy={headY + 2} r="2.2" fill={HAIR} />
        <circle cx="51.2" cy={headY + 2} r="2.2" fill={HAIR} />
        <circle cx="44" cy={headY} r="7.8" fill={SKIN} />
        <path d={`M36.1 ${headY - 1.4} A8 8 0 0 1 51.9 ${headY - 1.4} Z`} fill={HAT} />
        <rect x="35.4" y={headY - 3.6} width="17.2" height="3.4" rx="1.7" fill={HAT_DARK} />
        <circle cx="39.4" cy={headY + 4} r="1.7" fill={CHEEK} opacity={mood === 'cold' ? 0.9 : 0.55} />
        <circle cx="48.6" cy={headY + 4} r="1.7" fill={CHEEK} opacity={mood === 'cold' ? 0.9 : 0.55} />
        <Face mood={mood} y={headY} />
      </Layer>
      {breath !== null && <Breath progress={breath} y={headY} />}
    </>
  )
}

/** かおの 表じょう。さむい=目を ぎゅっ、うれしい=にっこり、すべった=目を まるく、口を あける */
function Face({ mood, y }: { readonly mood: Mood; readonly y: number }) {
  const eyeY = y + 1.8
  if (mood === 'cold') {
    return (
      <>
        <path d={`M40.2 ${eyeY} q1.5 1.4 3 0 M45.8 ${eyeY} q1.5 1.4 3 0`} fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
        <path d={`M41.4 ${y + 5.8} q1.3 -1 2.6 0 q1.3 1 2.6 0`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
      </>
    )
  }
  if (mood === 'happy') {
    return (
      <>
        <circle cx="41" cy={eyeY} r="1.15" fill={EYE} />
        <circle cx="47" cy={eyeY} r="1.15" fill={EYE} />
        <path d={`M41.4 ${y + 4.6} Q44 ${y + 7.4} 46.6 ${y + 4.6}`} fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
      </>
    )
  }
  return (
    <>
      <circle cx="41" cy={eyeY} r="1.7" fill="#ffffff" stroke={EYE} strokeWidth="0.7" />
      <circle cx="47" cy={eyeY} r="1.7" fill="#ffffff" stroke={EYE} strokeWidth="0.7" />
      <circle cx="41.2" cy={eyeY + 0.2} r="0.8" fill={EYE} />
      <circle cx="46.8" cy={eyeY + 0.2} r="0.8" fill={EYE} />
      <ellipse cx="44" cy={y + 5.6} rx="1.4" ry="1.9" fill={MOUTH} />
    </>
  )
}

/** さむい いき の しろい「ふう」。口の よこ から ふわっと のぼる。 */
function Breath({ progress, y }: { readonly progress: number; readonly y: number }) {
  const fade = Math.sin(progress * Math.PI)
  return (
    <g opacity={fade * 0.95}>
      <ellipse cx={36 - progress * 8} cy={y + 6 - progress * 5} rx={1.8 + progress * 2.4} ry={1.3 + progress * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <ellipse cx={39 - progress * 5} cy={y + 6.6 - progress * 2} rx={1 + progress * 1.2} ry={0.8 + progress * 0.7} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.45" />
    </g>
  )
}

/** すべった しゅんかんの「!」と あせ。字の線から はなして、左うえに。 */
function Surprise({ t }: SceneProps) {
  const pop = span(t, SLIP + 0.05, SLIP + 0.45, backOut)
  const show = during(t, SLIP, INK + 0.1, 0.1)
  if (show <= 0 || pop <= 0) return null
  return (
    <g opacity={show}>
      <Layer scale={Math.max(0, pop)} origin={[22, 14]} rotate={-10}>
        <rect x="20.2" y="4" width="3.6" height="9" rx="1.8" fill="#e8534a" />
        <circle cx="22" cy="16.6" r="2" fill="#e8534a" />
      </Layer>
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  // あるく: 池の むこうぎし から こちらへ。ちかづくので 大きくなり、足もとも 下がる
  const walk = span(t, WALK, ARRIVE, easeInOut)
  const walking = t >= WALK && t < ARRIVE ? 1 - span(t, ARRIVE - 0.35, ARRIVE) : 0
  const step = Math.sin((t - WALK) * Math.PI * 2 * 1.1) * walking
  const scale = 0.55 + 0.45 * walk
  const footY = 60 + 14 * walk
  const centerX = 70 - 26 * walk
  // さむい間は ぶるぶる。「こおった!」で ぴょん と はねる
  const shiver = t < JOY ? wave(t, 0.11) * 0.5 : 0
  const hop = Math.sin(span(t, JOY, JOY + 0.45) * Math.PI) * 3.2
  const bob = -Math.abs(step) * 1.2

  const slip = span(t, SLIP, SLIP + 0.5, easeOut)
  const flutter = wave(t, 0.4) * 5 * span(t, SLIP + 0.5, INK) * (1 - span(t, INK - 0.3, INK))
  const hug = 1 - span(t, JOY, JOY + 0.4)
  const mood: Mood = t < JOY ? 'cold' : t < SLIP ? 'happy' : 'oops'
  const leftWalk = mixPose(SWING_ARM, HUG_ARM, hug)
  const leftArm = mixPose(leftWalk, { swing: FLAIL_LEFT.swing + flutter, bend: FLAIL_LEFT.bend }, slip)
  const rightArm = mixPose(mixPose({ swing: 7, bend: 6 }, HUG_ARM, hug), { swing: FLAIL_RIGHT.swing - flutter, bend: FLAIL_RIGHT.bend }, slip)
  const breathPhase = (t - 0.3) / 1.4
  const breath = t > 0.3 && t < FROZEN ? breathPhase - Math.floor(breathPhase) : null
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <Pond t={t} />
        <IceGlints t={t} />
        <Layer x={centerX - FEET[0] + shiver} y={footY - FEET[1] - hop + bob} scale={scale} origin={FEET}>
          <ellipse cx="44" cy="74.6" rx="15" ry="2.6" fill="#1d4a7a" opacity="0.14" />
          <Kid mood={mood} spread={slip} step={step} leftArm={leftArm} rightArm={rightArm} headTilt={slip * 6 + (t < JOY ? -3 : 0)} breath={t < JOY ? breath : null} />
        </Layer>
        <Surprise t={t} />
        <Snow t={t} />
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
