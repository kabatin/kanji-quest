/*
 * 教(おしえる): ぼうを もった 先生が、こまっている 子どもに おしえる。
 *
 * ほね(画と絵の対応)
 *   1〜3画目   … 黒板に 先生が 書いて みせる 白い線(土の ような かたち)
 *   4画目(ノ)  … 先生の ぼう(黒板から 子どもの あたまの 上へ ななめに)
 *   5画目      … 子どもの あたま
 *   6画目      … 子どもの どう と あし
 *   7画目(一)  … 子どもが よろこんで ひろげた りょううで
 *   8〜11画目  … 右がわの 先生(ぼうを もって、みちびく ほう)
 *
 * ながれ
 *   黒板と 子どもと 先生が そろう → 子どもは「?」で こまっている(あたまを かく)
 *   → 先生が ぼうを あげて、黒板を とん・とん・とん と たたき、白い線を 書いて みせる
 *   → ぼうで 子どもを さす → 子どもが「あっ!」と わかって、りょううでを ひろげて ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「教」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(かた と 手の いちから ひじ を きめる)。
 *   くび は みじかく、どう の まんなか の上。ぼう は 手の中に ある。
 *   字の形に 近づくのは、子どもが うでを ひろげた しゅんかん と、ぼうが ななめに のびた ところ だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '教'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_GRAY = '#7a6a60'
const KID_TUNIC = '#f2c14e'
const KID_TUNIC_DARK = '#e0a92f'
const KID_PANTS = '#5a8fd0'
const TEA_TUNIC = '#e0794f'
const TEA_TUNIC_DARK = '#c8623b'
const TEA_PANTS = '#4a4f6a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const BOARD = '#2f6b55'
const BOARD_LIGHT = '#3b7d66'
const CHALK = '#f4f1e6'
const STICK = '#c88f4a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const CONFUSED = 0.9
/** 先生が ぼうを あげはじめる */
const RAISE = 2.4
/** 黒板を たたく じかん(1・2・3画目を 書く) */
const TAPS = [3.2, 3.6, 4.0] as const
/** ぼうで 子どもを さす */
const POINT = 4.7
/** 子どもが「あっ!」と わかる */
const GET = 5.2
/** ばんざい */
const JOY = 5.5
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** 子どもの 足もと と、先生の 足もと */
const KID_FEET: readonly [number, number] = [35, 94]
const TEA_FEET: readonly [number, number] = [80, 94]

type Pt = readonly [number, number]

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/* ───────── うで(かた → ひじ → 手) ───────── */

type Joints = { readonly shoulder: Pt; readonly elbow: Pt; readonly hand: Pt }

/**
 * かた と 手の いち から、ひじ の いちを きめる(2本の ほね の ながさ は かわらない)。
 * hint は、ひじ が どちらへ まがるか の めやす(下・外がわ など)。 とどかない ときは まっすぐ のばす。
 */
function reach(shoulder: Pt, target: Pt, len: number, hint: Pt): Joints {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const d = Math.min(dist, len * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const along = d / 2
  const off = Math.sqrt(Math.max(0, len * len - along * along))
  const sign = -uy * hint[0] + ux * hint[1] >= 0 ? 1 : -1
  const elbow: Pt = [shoulder[0] + ux * along - uy * off * sign, shoulder[1] + uy * along + ux * off * sign]
  return { shoulder, elbow, hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

function Arm({ joints, color, width, handR }: { readonly joints: Joints; readonly color: string; readonly width: number; readonly handR: number }) {
  const { shoulder, elbow, hand } = joints
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r={handR} fill={SKIN} />
    </>
  )
}

/* ───────── 場所 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.3" y="2.6" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 98 11)`} />
        ))}
      </Layer>
      <circle cx="98" cy="11" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 黒板。1〜3画目の 白い線は、先生が たたいた ときに 書かれる。 */
function Blackboard({ t, drawn }: SceneProps & { readonly drawn: readonly number[] }) {
  const pop = span(t, 0, 0.6, backOut)
  return (
    <Layer scaleY={pop} scaleX={0.7 + 0.3 * pop} origin={[31, 96]}>
      {/* あし(うしろの 2本) */}
      <rect x="11" y="49" width="3.6" height="46" rx="1.2" fill={BARK_DARK} />
      <rect x="47.4" y="49" width="3.6" height="46" rx="1.2" fill={BARK_DARK} />
      {/* わく と 黒板の めん */}
      <rect x="4" y="5" width="54" height="45.6" rx="3" fill={BARK} />
      <rect x="6.5" y="7.5" width="49" height="40" rx="1.6" fill={BOARD} />
      <rect x="6.5" y="7.5" width="49" height="5" rx="1.6" fill={BOARD_LIGHT} opacity="0.6" />
      {/* チョークの おぼん と チョーク */}
      <rect x="6.5" y="47.5" width="49" height="3.1" fill={BARK_DARK} />
      <rect x="40" y="46.4" width="5" height="1.4" rx="0.7" fill={CHALK} />
      {drawn.map((s, i) => (
        <Bone key={i} char={CHAR} n={i + 1} color={CHALK} width={2.4} to={s} />
      ))}
    </Layer>
  )
}

/* ───────── 子ども(主役) ───────── */

type KidMood = 'puzzled' | 'surprised' | 'happy'

function KidHead({ mood, look }: { readonly mood: KidMood; readonly look: Pt }) {
  const eyes: Pt[] = [
    [-2.9 + look[0], -0.6 + look[1]],
    [2.9 + look[0], -0.6 + look[1]],
  ]
  return (
    <>
      <circle r="7.5" fill={SKIN} />
      {/* かみ(てっぺんの ぴょこんと した ところ つき) */}
      <path d="M-7.6 -1 C-8.2 -8.8 8.2 -9.4 7.7 -1 C5.6 -4.6 -3 -5.6 -7.6 -1 Z" fill={HAIR} />
      <path d="M1 -7.6 Q1.8 -10.8 3.4 -8.6" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-4.6" cy="2.6" r="1.5" fill={CHEEK} opacity="0.55" />
      <circle cx="4.6" cy="2.6" r="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          {eyes.map(([x, y], i) => (
            <path key={i} d={`M${x - 1.7} ${y + 0.6} Q${x} ${y - 1.9} ${x + 1.7} ${y + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          ))}
          <path d="M-3 3.2 Q0 7.2 3 3.2 Z" fill={MOUTH} />
        </>
      ) : mood === 'surprised' ? (
        <>
          {eyes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.5" fill={EYE} />
          ))}
          <ellipse cx="0" cy="4.4" rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      ) : (
        <>
          {eyes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1" fill={EYE} />
          ))}
          {/* まゆ: 左は 上がり、右は 下がる(「うーん?」) */}
          <path d="M-4.6 -3.8 l3 -0.9" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M1.7 -4.4 l3 1" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-2.2 4.4 q1.1 -1.1 2.2 0 t2.2 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: KidMood
  readonly look: Pt
  readonly headTilt: number
  readonly nearArm: Joints
  readonly farArm: Joints
}

function Kid({ mood, look, headTilt, nearArm, farArm }: KidProps) {
  return (
    <>
      {/* あし(こしから 2本) */}
      <rect x="29.8" y="84" width="4.6" height="9" rx="2.2" fill={KID_PANTS} />
      <rect x="35.6" y="84" width="4.6" height="9" rx="2.2" fill={KID_PANTS} />
      <ellipse cx="31.6" cy="93.6" rx="3.6" ry="2" fill={SHOE} />
      <ellipse cx="38.4" cy="93.6" rx="3.6" ry="2" fill={SHOE} />
      {/* くび(みじかく)と どう */}
      <rect x="33.1" y="66" width="3.8" height="7" rx="1.8" fill={SKIN_SHADE} />
      <rect x="28.8" y="70" width="12.4" height="17" rx="5.4" fill={KID_TUNIC} />
      <path d="M30.6 82 h8.8" stroke={KID_TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm joints={farArm} color={KID_TUNIC_DARK} width={4.4} handR={2.3} />
      <Arm joints={nearArm} color={KID_TUNIC} width={4.4} handR={2.3} />
      <Layer x={35} y={62} rotate={headTilt} origin={[0, 7.5]}>
        <KidHead mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** 子どもの あたまの 上の「?」。ゆらゆら ゆれる。 */
function Question({ cx, cy, size, t, phase }: { readonly cx: number; readonly cy: number; readonly size: number; readonly t: number; readonly phase: number }) {
  const show = during(t, CONFUSED + phase, TAPS[0] + 0.2, 0.3)
  if (show <= 0) return null
  const pop = Math.max(0, span(t, CONFUSED + phase, CONFUSED + phase + 0.4, backOut))
  return (
    <Layer x={cx} y={cy + wave(t, 1.3, phase) * 0.8} rotate={wave(t, 1.6, phase) * 10} scale={size * pop} opacity={show}>
      <path d="M-2.3 -2.6 Q-2.3 -5.4 0 -5.4 Q2.5 -5.4 2.5 -3 Q2.5 -1.4 0.3 -0.2 Q-0.2 0.4 -0.2 1.4" fill="none" stroke="#5f7fd6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="-0.2" cy="4" r="0.95" fill="#5f7fd6" />
    </Layer>
  )
}

/* ───────── 先生 ───────── */

type TeacherProps = {
  readonly smile: boolean
  readonly nod: number
  readonly stickArm: Joints
  readonly otherArm: Joints
  /** ぼうの むき(ラジアン。右が 0、下が π/2) と、手の いち */
  readonly stickAngle: number
}

/** ぼうの ながさ */
const STICK_LEN = 26

function Stick({ hand, angle }: { readonly hand: Pt; readonly angle: number }) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  return (
    <>
      <path d={`M${hand[0] - dx * 4} ${hand[1] - dy * 4} L${hand[0] + dx * STICK_LEN} ${hand[1] + dy * STICK_LEN}`} stroke={STICK} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx={hand[0] + dx * STICK_LEN} cy={hand[1] + dy * STICK_LEN} r="1.1" fill={BARK_DARK} />
      <circle cx={hand[0]} cy={hand[1]} r="2.6" fill={SKIN} />
    </>
  )
}

function Teacher({ smile, nod, stickArm, otherArm, stickAngle }: TeacherProps) {
  return (
    <>
      {/* あし(こしから 2本) */}
      <rect x="72.4" y="62" width="5.8" height="30.5" rx="2.9" fill={TEA_PANTS} />
      <rect x="81.8" y="62" width="5.8" height="30.5" rx="2.9" fill={TEA_PANTS} />
      <ellipse cx="74.2" cy="93.4" rx="5" ry="2.6" fill={SHOE} />
      <ellipse cx="85.8" cy="93.4" rx="5" ry="2.6" fill={SHOE} />
      {/* くび(みじかく)と どう */}
      <rect x="77.2" y="31" width="5.6" height="8" rx="2.6" fill={SKIN_SHADE} />
      <rect x="71" y="35.4" width="18" height="30" rx="7" fill={TEA_TUNIC} />
      {/* えり と ネクタイ */}
      <path d="M76 36 L80 42 L84 36 Z" fill="#ffffff" />
      <path d="M80 41 l-1.5 2.4 l1.5 8 l1.5 -8 Z" fill="#3c82c4" />
      <path d="M73 61 h14" stroke={TEA_TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      <Arm joints={otherArm} color={TEA_TUNIC_DARK} width={5.2} handR={2.9} />
      <Arm joints={stickArm} color={TEA_TUNIC} width={5.2} handR={0.01} />
      <Stick hand={stickArm.hand} angle={stickAngle} />
      {/* あたま(うなずくと すこし まえに かたむく) */}
      <Layer x={80} y={24} rotate={nod} origin={[0, 8.5]}>
        <circle r="8.5" fill={SKIN} />
        <path d="M-8.6 -1 C-9 -9.6 9 -10 8.7 -1 C6 -5.6 -3.4 -6.2 -8.6 -1 Z" fill={HAIR_GRAY} />
        <circle cx="-5" cy="3.2" r="1.7" fill={CHEEK} opacity="0.5" />
        <circle cx="5" cy="3.2" r="1.7" fill={CHEEK} opacity="0.5" />
        {/* めがね */}
        <circle cx="-3.7" cy="0.4" r="2.7" fill="#ffffff" fillOpacity="0.5" stroke="#3a3a4a" strokeWidth="0.8" />
        <circle cx="3.7" cy="0.4" r="2.7" fill="#ffffff" fillOpacity="0.5" stroke="#3a3a4a" strokeWidth="0.8" />
        <path d="M-1 0.4 h2" stroke="#3a3a4a" strokeWidth="0.8" />
        <circle cx="-4.5" cy="0.6" r="1" fill={EYE} />
        <circle cx="2.9" cy="0.6" r="1" fill={EYE} />
        {smile ? <path d="M-3.4 4.6 Q-0.6 8.4 2.4 4.6 Z" fill={MOUTH} /> : <path d="M-3.2 5 Q-1 6.8 1.6 5" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />}
      </Layer>
    </>
  )
}

/* ───────── ぼうの うごき ───────── */

/** ぼうを 持つ 手の いち: ふだんは ぼうを 立てて もっている → 黒板の まえへ あげる */
const HAND_REST: Pt = [69, 61]
const HAND_BOARD: Pt = [56, 41]

/** (手から) めあての 点を むく 角度 [0, 2π) */
const aimAt = (target: Pt): number => {
  const a = Math.atan2(target[1] - HAND_BOARD[1], target[0] - HAND_BOARD[0])
  return a < 0 ? a + Math.PI * 2 : a
}

/** 黒板の 白い線の いち(1・2・3画目の あたり) と、子どもの あたまの てっぺん */
const AIM_REST = (265 * Math.PI) / 180
const AIM_CHALK = [aimAt([30, 29.5]), aimAt([31.5, 31]), aimAt([30, 43])] as const
const AIM_KID = aimAt([34, 54])

/** ぼうの むき の きーフレーム(時間, 角度) */
const STICK_KEYS: readonly (readonly [number, number])[] = [
  [0, AIM_REST],
  [RAISE, AIM_REST],
  [3.0, AIM_CHALK[0]],
  [TAPS[0] + 0.05, AIM_CHALK[0]],
  [TAPS[1] - 0.15, AIM_CHALK[1]],
  [TAPS[1] + 0.05, AIM_CHALK[1]],
  [TAPS[2] - 0.15, AIM_CHALK[2]],
  [TAPS[2] + 0.05, AIM_CHALK[2]],
  [POINT + 0.5, AIM_KID],
  [DURATION, AIM_KID],
]

function stickAngleAt(t: number): number {
  const i = STICK_KEYS.findIndex(([at]) => at > t)
  const base = i <= 0 ? STICK_KEYS[STICK_KEYS.length - 1][1] : mix(t, STICK_KEYS[i - 1][0], STICK_KEYS[i][0], STICK_KEYS[i - 1][1], STICK_KEYS[i][1], easeInOut)
  // たたく しゅんかん、ぼうが ちょん と はずむ
  const tap = TAPS.reduce((sum, at) => sum + Math.sin(span(t, at - 0.12, at + 0.1) * Math.PI) * 0.07, 0)
  return base + tap
}

/** チョークの こな。たたいた ところ から ふわっと ひろがる。 */
function Dust({ t, tip }: { readonly t: number; readonly tip: Pt }) {
  return (
    <>
      {TAPS.map((at) => {
        const p = span(t, at, at + 0.45, easeOut)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={at} opacity={1 - p} fill={CHALK}>
            {[-1, 0, 1].map((k) => (
              <circle key={k} cx={tip[0] + k * 2.6 * p} cy={tip[1] - 1 - p * 4 - Math.abs(k)} r={0.7 + p * 0.9} />
            ))}
          </g>
        )
      })}
    </>
  )
}

/** 「あっ!」と わかった ときの ほし。 */
function Pops({ t }: SceneProps) {
  const spots: readonly Pt[] = [
    [15, 62],
    [55, 62],
    [22, 54],
    [48, 54],
  ]
  return (
    <>
      {spots.map(([x, y], i) => {
        const show = during(t, GET + i * 0.08, JOY + 0.9 + i * 0.05, 0.25)
        if (show <= 0) return null
        const pop = Math.max(0, span(t, GET + i * 0.08, GET + 0.4 + i * 0.08, backOut))
        return <Star key={i} cx={x} cy={y} r={2.9 * pop * show} color={i % 2 === 0 ? SUN : '#ff7a4d'} spin={t * 90} />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 11)

  /* 先生: ぼうを もつ うで(かた(72,40) → ひじ → 手) */
  const raise = span(t, RAISE, 3.0, easeInOut)
  const handPos = lerpPt(HAND_REST, HAND_BOARD, raise)
  const stickArm = reach([72, 40], handPos, 11, [0, 1])
  const sway = wave(t, 3.2) * 0.8
  const otherArm = reach([88, 40], [91 + sway * 0.4, 61], 11, [1, 0.4])
  const stickAngle = stickAngleAt(t)
  const tip: Pt = [handPos[0] + Math.cos(stickAngle) * STICK_LEN, handPos[1] + Math.sin(stickAngle) * STICK_LEN]
  const teacherSmile = t >= GET
  const nod = TAPS.reduce((sum, at) => sum + Math.sin(span(t, at - 0.1, at + 0.25) * Math.PI) * 4, 0)

  /* 子ども: こまる → ぼうに 気づく → あっ! → ばんざい */
  const mood: KidMood = t < POINT ? 'puzzled' : t < GET + 0.2 ? 'surprised' : 'happy'
  const scratch = during(t, 1.1, POINT - 0.1, 0.35)
  const wide = span(t, JOY - 0.2, JOY + 0.3, backOut)
  const look: Pt = t < TAPS[0] - 0.3 ? [wave(t, 2.4) * 0.5, -0.2] : t < POINT ? [-1.2, -0.8] : mood === 'happy' ? [0.6, 0] : [1, -0.4]
  const headTilt = t < POINT ? wave(t, 2.0) * 5 * (1 - span(t, TAPS[0] - 0.4, TAPS[0])) : mood === 'happy' ? wave(t, 0.5) * 3 : 0
  const hop = -Math.abs(Math.sin(span(t, JOY, JOY + 1.1) * Math.PI * 3)) * 2.6
  const kidLeft: Pt = lerpPt([28.6, 85.6], [17.2, 73.4], wide)
  const scratchHand: Pt = [42.5 + wave(t, 0.5) * 0.7, 61 + wave(t, 0.5, 0.2) * 0.7]
  const kidRightBase = lerpPt([41.4, 85.6], scratchHand, scratch)
  const kidRight: Pt = lerpPt(kidRightBase, [52.8, 72.6], wide)
  const nearArm = reach([40, 73], kidRight, 6.5, [1, 0.5])
  const farArm = reach([30, 73], kidLeft, 6.5, [-1, 0.5])

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Blackboard t={t} drawn={[span(t, TAPS[0], TAPS[0] + 0.3), span(t, TAPS[1], TAPS[1] + 0.3), span(t, TAPS[2], TAPS[2] + 0.3)]} />
        {/* 子ども(かげ は 地面に のこる) */}
        <ellipse cx="35" cy="97.4" rx="8" ry="2" fill="#000000" opacity="0.12" />
        <Layer scale={Math.max(0, span(t, 0.3, 0.8, backOut))} origin={KID_FEET}>
          <Layer y={hop}>
            <Kid mood={mood} look={look} headTilt={headTilt} nearArm={nearArm} farArm={farArm} />
          </Layer>
        </Layer>
        <Question cx={21} cy={55} size={1.3} t={t} phase={0} />
        <Question cx={49} cy={58} size={0.95} t={t} phase={0.35} />
        <Pops t={t} />
        <ellipse cx="80" cy="97.4" rx="11" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={Math.max(0, span(t, 0.5, 1.0, backOut))} origin={TEA_FEET}>
          <Teacher smile={teacherSmile} nod={nod} stickArm={stickArm} otherArm={otherArm} stickAngle={stickAngle} />
        </Layer>
        <Dust t={t} tip={tip} />
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
    { at: 0, label: '黒板と 子どもと 先生が そろう', sound: 'pop' },
    { at: CONFUSED, label: '子どもは「?」で こまっている' },
    { at: RAISE, label: '先生が ぼうを あげる' },
    { at: TAPS[0], label: '黒板を とん・とん・とん と たたいて 書いて みせる', sound: 'pop' },
    { at: POINT, label: 'ぼうで 子どもを さす' },
    { at: JOY, label: '「あっ!」と わかって ばんざい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '教 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
