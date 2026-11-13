/*
 * 交(まじわる): 女の子が ジャンプして、足を ばってんに くむ。足と足が まじわる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … あたまの 上の リボン から あたまの まんなか
 *   2画目(一)   … よこに ひろげた りょううで(バランスを とる)
 *   3・4画目    … ふわっと ひろがった スカートの 左と右の ふち
 *   5・6画目    … ばってんに くんだ 左右の 足(こしの下から じめんまで)
 *
 * ながれ
 *   草が はえて、女の子が ぽん と出てくる。たいくつ そうに ぼんやり 立っている
 *   → 小鳥が とんできて 枝に とまり、うたいだす。女の子は 顔を上げて びっくり
 *   → たのしくなって、足を ひらいて からだを ゆらす
 *   → 「よーし!」 ジャンプして、空中で 足を ばってんに くむ(うでは バランスを とるために よこへ ひろげる)
 *   → おっとっと と ぐらぐら → ぴたっ と きまって にっこり
 *   → ほね が ひかって、絵が うすくなり、字「交」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   足の ながさは いつも同じ。足を ひらく・くむ と、こしが さがる(足が 長く のびたりは しない)。
 *   うで は かた から出て ひじ で まがる。あたま は どう の 上に のり、くび は みじかい。
 *   足が 字の 5・6画目ほど 大きく ひらかないぶんは、「だいたい 同じ 場所・向き」で 重ねる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '交'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f2799a'
const DRESS_DARK = '#d95f84'
const DRESS_LIGHT = '#ff9bb8'
const RIBBON = '#e8534a'
const SHOE = '#e8534a'
const SOCK = '#ffffff'
const BARK = '#8c5b3c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const BIRD = '#5aaee8'
const BIRD_DARK = '#3f8ccc'
const BIRD_BELLY = '#e8f6ff'
const BEAK = '#f2b632'
const NOTE = '#f07f9e'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const POP = 0.3
const FLY = 1.0
const LAND = 1.9
/** うたが きこえて、顔を上げる */
const HEAR = 1.5
/** たのしくなって からだを ゆらす */
const SWAY = 2.5
/** 「よーし!」 */
const PREP = 3.7
const JUMP = 4.3
const LAND_J = 5.0
/** ぐらぐら が おさまって、ぴたっ と きまる */
const SETTLE = 5.8
const INK = 6.2
const DONE = 9.0
const DURATION = 9.6

/** 足の ながさ(こし から くるぶし まで)と じめん、字の「ばってん」を 立てたときの こしの たかさ */
const LEG = 44
const GROUND = 96
const HIP_FINAL = 58
/** さいごの ばってん で、足が こしの まっすぐ下から 左右に ずれる よこの長さ */
const DX_CROSS = Math.sqrt(LEG ** 2 - (GROUND - HIP_FINAL) ** 2)
const DX_WIDE = -16
const DX_PREP = -21
/** 左右の こし の よこの 場所(体の まんなか は 53.5) */
const CENTER = 53.5
const HIP_A = CENTER - 7
const HIP_B = CENTER + 7
/** ジャンプの たかさ */
const AIR = 2.5
/** うで の ながさ(かた→ひじ、ひじ→手)。さいごに かたから 25 のばして 2画目に とどく */
const ARM_PART = 12.7
const SHOULDER_L: Pt = [46, 30.6]
const SHOULDER_R: Pt = [61, 30.6]

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
const at = (p: Pt) => `${p[0]} ${p[1]}`
const rad = (deg: number) => (deg * Math.PI) / 180

/* ───────── 草・くも ───────── */

function Ground({ t }: SceneProps) {
  const grow = span(t, 0, 0.4, easeOut)
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" opacity={grow} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="8" cy="9" rx="6" ry="2.8" />
        <ellipse cx="12.5" cy="7.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx={51 * grow} ry="5.6" fill={GRASS} />
      {[6, 40, 70, 102].map((x, i) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} transform={`translate(0 ${(1 - span(t, 0.1 + i * 0.1, 0.5 + i * 0.1, backOut)) * 6})`} />
      ))}
    </>
  )
}

/* ───────── 枝と 小鳥 ───────── */

/** 枝の y(右はしが 少し高い) */
const branchY = (x: number) => 12 + (115 - x) * 0.12

function Branch({ t }: SceneProps) {
  const slide = 1 - span(t, 0.3, 0.9, easeOut)
  return (
    <Layer x={slide * 26}>
      <path d="M118 12 L89 15.5" stroke={BARK} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M100 14 q-1 -4 -4.4 -5.4" fill="none" stroke={BARK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="90" cy="17" r="3.4" fill={LEAF_DARK} />
      <circle cx="93" cy="19" r="2.4" fill={LEAF} />
      <circle cx="94.6" cy="8.2" r="2.8" fill={LEAF} />
      <circle cx="109" cy="8" r="4.6" fill={LEAF_DARK} />
      <circle cx="107.4" cy="15.6" r="3.8" fill={LEAF} />
    </Layer>
  )
}

/** 小鳥。からだは ひだり むき(女の子の ほうを 見る)。 */
function BirdBody({ flap, beak }: { readonly flap: number; readonly beak: number }) {
  return (
    <>
      <path d="M3.4 0.2 L8.4 -1.6 L7.6 1.8 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="4.4" ry="3.4" fill={BIRD} />
      <ellipse cx="-0.6" cy="1.3" rx="3" ry="1.9" fill={BIRD_BELLY} />
      <circle cx="-3.4" cy="-2.4" r="2.7" fill={BIRD} />
      {beak > 0.3 ? (
        <>
          <path d="M-5.7 -3.1 L-8.8 -3.5 L-5.8 -2.4 Z" fill={BEAK} />
          <path d="M-5.8 -2.3 L-8.4 -1.1 L-5.4 -1.6 Z" fill={BEAK} />
        </>
      ) : (
        <path d="M-5.7 -3 L-8.4 -2.3 L-5.7 -1.8 Z" fill={BEAK} />
      )}
      <circle cx="-3.9" cy="-3.1" r="0.6" fill={EYE} />
      <Layer rotate={flap} origin={[0.6, -0.8]}>
        <path d="M-1.6 -0.8 Q1.8 -4.6 5.2 -0.6 Q1.8 1.2 -1.6 -0.8 Z" fill={BIRD_DARK} />
      </Layer>
    </>
  )
}

function Bird({ t }: SceneProps) {
  const arrive = span(t, FLY, LAND, easeOut)
  if (arrive <= 0) return null
  const landed = arrive >= 1
  const perchX = 99
  const perchY = branchY(perchX) - 3.6
  // 右上から、ゆるい山なりで おりてくる
  const x = 122 - arrive * (122 - perchX)
  const y = -6 + arrive * (perchY + 6) - Math.sin(arrive * Math.PI) * 6
  const singing = during(t, LAND + 0.1, LAND_J, 0.2)
  const cheer = span(t, SETTLE, SETTLE + 0.1)
  const hop = landed ? Math.abs(wave(t, cheer > 0 ? 0.45 : 1.6)) * (cheer > 0 ? 1.6 : 0.5) : 0
  const flap = landed ? (cheer > 0 ? wave(t, 0.2) * 22 : 0) : wave(t, 0.16) * 30
  const beak = landed && (singing > 0 || cheer > 0) ? (wave(t, 0.3) > 0 ? 1 : 0) : 0
  return (
    <>
      <Layer x={x} y={y - hop}>
        <BirdBody flap={flap} beak={beak} />
        {landed ? <path d="M-1 3.2 v1.2 M1.2 3.2 v1.2" stroke="#e2733f" strokeWidth="0.7" strokeLinecap="round" /> : null}
      </Layer>
      {/* うたう おんぷ: 女の子の ほうへ ふわふわ ただよう */}
      <g opacity={singing}>
        {[0, 0.9, 1.8].map((offset) => {
          const p = ((t - LAND + offset) % 2.7) / 2.7
          const nx = 93 - p * 24
          const ny = 8 + p * 7 - Math.sin(p * Math.PI) * 4
          return (
            <g key={offset} opacity={Math.sin(p * Math.PI)} transform={`translate(${nx} ${ny})`}>
              <path d="M1.2 0 v-5 l2.8 -0.9 v4.6" fill="none" stroke={NOTE} strokeWidth="0.9" strokeLinecap="round" />
              <ellipse cx="0" cy="0.2" rx="1.5" ry="1.1" fill={NOTE} />
              <ellipse cx="2.8" cy="-0.7" rx="1.5" ry="1.1" fill={NOTE} />
            </g>
          )
        })}
      </g>
    </>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'bored' | 'surprised' | 'happy' | 'worried' | 'proud'

/** あたまの 中心(0,0)から 見た、顔。気持ちで 目・まゆ・口 を かえる。 */
function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  const dotEyes = (r: number) => (
    <>
      <circle cx={-3.7 + look * 0.8} cy="1.2" r={r} fill={EYE} />
      <circle cx={3.7 + look * 0.8} cy="1.2" r={r} fill={EYE} />
      <circle cx={-3.2 + look * 0.8} cy="0.6" r={r * 0.36} fill="#ffffff" />
      <circle cx={4.2 + look * 0.8} cy="0.6" r={r * 0.36} fill="#ffffff" />
    </>
  )
  const cheeks = (
    <>
      <circle cx="-5.6" cy="4.2" r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx="5.6" cy="4.2" r="1.7" fill={CHEEK} opacity="0.55" />
    </>
  )
  switch (mood) {
    case 'bored':
      return (
        <>
          <path d="M-5.8 1.6 h3.8 M2 1.6 h3.8" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-1.8 5.6 q1.8 -0.6 3.6 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          {cheeks}
        </>
      )
    case 'surprised':
      return (
        <>
          {dotEyes(1.7)}
          <path d="M-5.8 -2 Q-3.7 -3.6 -1.8 -2 M1.8 -2 Q3.7 -3.6 5.8 -2" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="0" cy="5.6" rx="1.1" ry="1.5" fill={MOUTH} />
          {cheeks}
        </>
      )
    case 'happy':
      return (
        <>
          {dotEyes(1.4)}
          <path d="M-2.4 4.4 Q0 7.2 2.4 4.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
          {cheeks}
        </>
      )
    case 'worried':
      return (
        <>
          {dotEyes(1.3)}
          <path d="M-5.9 -0.8 L-2.3 -2.4 M5.9 -0.8 L2.3 -2.4" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-2.6 6 q1.3 -1.8 2.6 0 q1.3 1.8 2.6 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M7.6 -4.4 Q9 -2.2 7.6 -1 Q6.2 -2.2 7.6 -4.4 Z" fill="#7cc4f2" />
        </>
      )
    case 'proud':
      return (
        <>
          <path d="M-5.6 2 Q-3.7 -0.6 -1.8 2 M1.8 2 Q3.7 -0.6 5.6 2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-3 4.2 Q0 9.4 3 4.2 Z" fill={MOUTH} />
          <path d="M-1.6 6.6 Q0 5.6 1.6 6.6 Q0 8 -1.6 6.6 Z" fill="#ff8a8a" />
          {cheeks}
        </>
      )
  }
}

/** あたま。かみ・リボン・ふたつ むすび(とんだとき 外へ ふわっと ひらく)。 */
function Head({ mood, look, tail }: { readonly mood: Mood; readonly look: number; readonly tail: number }) {
  return (
    <g transform="translate(53.5 19.6)">
      <Layer rotate={tail} origin={[-9.4, -1]}>
        <ellipse cx="-11.4" cy="3.6" rx="3" ry="5.4" fill={HAIR} />
        <circle cx="-9.6" cy="-0.6" r="1.5" fill={RIBBON} />
      </Layer>
      <Layer rotate={-tail} origin={[9.4, -1]}>
        <ellipse cx="11.4" cy="3.6" rx="3" ry="5.4" fill={HAIR} />
        <circle cx="9.6" cy="-0.6" r="1.5" fill={RIBBON} />
      </Layer>
      <circle cx="0" cy="0" r="8.8" fill={SKIN} />
      <path d="M-9 0.5 A9 9.4 0 0 1 9 0.5 Q4.4 -4.6 0 -3.2 Q-4.4 -5 -9 0.5 Z" fill={HAIR} />
      {/* 1画目の はじまり: あたまの てっぺんの リボン */}
      <ellipse cx="-2.2" cy="-9.2" rx="2.6" ry="1.7" fill={RIBBON} transform="rotate(-18 -2.2 -9.2)" />
      <ellipse cx="2.2" cy="-9.2" rx="2.6" ry="1.7" fill={RIBBON} transform="rotate(18 2.2 -9.2)" />
      <circle cx="0" cy="-9" r="1.3" fill="#c4413a" />
      <Face mood={mood} look={look} />
    </g>
  )
}

/** うで の かっこう。angle = ま下から 外へ ひらいた角度 / bend = ひじ の まがり(外へ) */
function Arm({ side, angle, bend }: { readonly side: -1 | 1; readonly angle: number; readonly bend: number }) {
  const shoulder = side < 0 ? SHOULDER_L : SHOULDER_R
  const dir = (a: number): Pt => [side * Math.sin(rad(a)), Math.cos(rad(a))]
  const upper = dir(angle)
  const lower = dir(angle + bend)
  const elbow: Pt = [shoulder[0] + upper[0] * ARM_PART, shoulder[1] + upper[1] * ARM_PART]
  const hand: Pt = [elbow[0] + lower[0] * ARM_PART, elbow[1] + lower[1] * ARM_PART]
  return (
    <>
      <path d={`M${at(shoulder)} L${at(elbow)} L${at(hand)}`} fill="none" stroke={SKIN} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shoulder[0]} cy={shoulder[1]} r="3.6" fill={DRESS_LIGHT} />
      <circle cx={hand[0]} cy={hand[1]} r="2.8" fill={SKIN} />
    </>
  )
}

/** スカート。flare 0 = すとんと 立つ / 1 = ふわっと ひろがる(3・4画目の ふち に そろう)。 */
function Skirt({ flare }: { readonly flare: number }) {
  const leftStart = lerpPt([46.5, 37], [44, 37], flare)
  const leftCtrl = lerpPt([43.5, 44], [36, 40.5], flare)
  const leftHem = lerpPt([41.5, 60], [22, 59.5], flare)
  const rightStart = lerpPt([60.5, 37], [64, 37], flare)
  const rightCtrl = lerpPt([63.5, 44], [72, 40], flare)
  const rightHem = lerpPt([65.5, 60], [86, 52.3], flare)
  // すそ は 少し 下に たれる
  const hemCtrl: Pt = [(leftHem[0] + rightHem[0]) / 2, (leftHem[1] + rightHem[1]) / 2 + 6]
  return (
    <>
      <path d={`M${at(leftStart)} Q${at(leftCtrl)} ${at(leftHem)} Q${at(hemCtrl)} ${at(rightHem)} Q${at(rightCtrl)} ${at(rightStart)} Z`} fill={DRESS} />
      <path d={`M${at(leftHem)} Q${at(hemCtrl)} ${at(rightHem)}`} fill="none" stroke={DRESS_DARK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )
}

/** 足 1本。こし(スカートの中)から くるぶし まで まっすぐ。くつ下と くつ つき。 */
function Leg({ hip, foot, color }: { readonly hip: Pt; readonly foot: Pt; readonly color: string }) {
  const ankle: Pt = [foot[0], foot[1] - 2.4]
  const length = Math.hypot(hip[0] - ankle[0], hip[1] - ankle[1])
  const unit: Pt = [(hip[0] - ankle[0]) / length, (hip[1] - ankle[1]) / length]
  const sockTop: Pt = [ankle[0] + unit[0] * 8, ankle[1] + unit[1] * 8]
  return (
    <>
      <path d={`M${at(hip)} L${at(ankle)}`} stroke={color} strokeWidth="5.2" strokeLinecap="round" />
      <path d={`M${at(sockTop)} L${at(ankle)}`} stroke={SOCK} strokeWidth="5.6" strokeLinecap="round" />
      <ellipse cx={foot[0]} cy={foot[1] - 1.2} rx="4.8" ry="2.7" fill={SHOE} />
    </>
  )
}

/** 足の ひらき(左足の、こし の まっすぐ下から の よこの ずれ)。右足は ぎゃく。 */
function footOffset(t: number): number {
  const sway = (time: number) => {
    const step = mix(time, SWAY, SWAY + 0.5, 0, DX_WIDE, easeOut)
    const tap = 4 * wave(time - SWAY, 0.8) * span(time, SWAY + 0.4, SWAY + 0.8)
    return step + tap
  }
  if (t < PREP) return sway(t)
  if (t < JUMP) return mix(t, PREP, JUMP - 0.05, sway(PREP), DX_PREP, easeInOut)
  return DX_PREP + (DX_CROSS - DX_PREP) * span(t, JUMP, LAND_J, easeInOut)
}

type ArmAngles = { readonly left: number; readonly right: number; readonly bend: number }

/** りょううで の ひらき。さいごは 2画目の よこ線(右が 少し 高い)。 */
function armAngles(t: number): ArmAngles {
  const ramp = span(t, SWAY, SWAY + 0.4)
  const swing = 14 * wave(t - SWAY, 0.8) * ramp
  const hang = 8 + (22 - 8) * ramp
  const ready = span(t, PREP, JUMP - 0.05, easeInOut)
  const leftPre = (hang + swing) * (1 - ready) + 4 * ready
  const rightPre = (hang - swing) * (1 - ready) + 4 * ready
  // ジャンプで ばんざい から よこへ(バランスを とる)
  const up = span(t, JUMP, JUMP + 0.55, easeOut)
  const decay = 1 - span(t, LAND_J, SETTLE)
  const osc = Math.sin((t - LAND_J) * 14) * decay
  const bend = 10 * (1 - up) + 6 * decay * up + 4 * ramp * (1 - up)
  return {
    left: leftPre * (1 - up) + 90 * up + 9 * osc * up,
    right: rightPre * (1 - up) + 98 * up - 9 * osc * up,
    bend,
  }
}

function moodAt(t: number): Mood {
  if (t < HEAR) return 'bored'
  if (t < SWAY) return 'surprised'
  if (t < LAND_J) return 'happy'
  if (t < SETTLE) return 'worried'
  return 'proud'
}

function Girl({ t }: SceneProps) {
  const dx = footOffset(t)
  const jump = span(t, JUMP, LAND_J)
  const air = AIR * Math.sin(Math.PI * jump)
  // 足を ひらく・くむ ほど、こしが さがる(足の ながさは かわらない)
  const hipGround = GROUND - Math.sqrt(LEG ** 2 - dx ** 2)
  const hipY = hipGround - air
  const lift = hipY - HIP_FINAL
  const flare = Math.max(Math.min(1, Math.abs(dx) / DX_CROSS), jump > 0 && jump < 1 ? 0.85 : 0)
  const arms = armAngles(t)
  const mood = moodAt(t)

  // ぐらぐら: じめんの 足もとを じく に、ゆれが だんだん おさまる
  const decay = 1 - span(t, LAND_J, SETTLE)
  const wobble = 5 * Math.sin((t - LAND_J) * 14) * decay * (t >= LAND_J ? 1 : 0)

  const listen = span(t, HEAR - 0.1, HEAR + 0.2) * (1 - span(t, SWAY, SWAY + 0.5))
  const bounce = 5 * wave(t - SWAY, 0.8) * span(t, SWAY, SWAY + 0.5) * (1 - span(t, PREP, PREP + 0.3))
  const tilt = -4 * (1 - span(t, HEAR - 0.1, HEAR + 0.2)) + 7 * listen + bounce
  const look = t >= HEAR && t < PREP ? 1 : 0
  const tail = bounce * 1.4 + 40 * Math.sin(Math.PI * jump) + 14 * decay * Math.sin((t - LAND_J) * 14) * (t >= LAND_J ? 1 : 0)

  const footA: Pt = [HIP_A + dx, GROUND - air]
  const footB: Pt = [HIP_B - dx, GROUND - air]
  const shadow = 0.13 * (1 - air / 8)

  return (
    <Layer rotate={wobble} origin={[CENTER, GROUND]}>
      <ellipse cx={footA[0]} cy="97.4" rx="6.4" ry="1.7" fill="#000000" opacity={shadow} />
      <ellipse cx={footB[0]} cy="97.4" rx="6.4" ry="1.7" fill="#000000" opacity={shadow} />
      {/* むこうの 足 → てまえの 足(ばってんでは、左足が まえ) */}
      <Leg hip={[HIP_B, hipY]} foot={footB} color={SKIN_SHADE} />
      <Leg hip={[HIP_A, hipY]} foot={footA} color={SKIN} />
      <Layer y={lift}>
        <Skirt flare={flare} />
        <rect x="46" y="29.6" width="15" height="11" rx="4.5" fill={DRESS_LIGHT} />
        <rect x="46.4" y="37.6" width="14.2" height="2.2" rx="1.1" fill={DRESS_DARK} />
        <rect x="51.3" y="26" width="4.4" height="6" rx="2" fill={SKIN_SHADE} />
        <Arm side={-1} angle={arms.left} bend={arms.bend} />
        <Arm side={1} angle={arms.right} bend={arms.bend} />
        <Layer rotate={tilt} origin={[CENTER, 28.5]}>
          <Head mood={mood} look={look} tail={tail} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** ぴたっ と きまった しゅんかんの きらきら(絵の にぎやかし) */
function Cheer({ t }: SceneProps) {
  const show = during(t, SETTLE - 0.2, INK + 0.2, 0.3)
  if (show <= 0) return null
  const grow = span(t, SETTLE - 0.2, SETTLE + 0.3, backOut)
  return (
    <g opacity={show}>
      <Star cx={11} cy={18} r={3.2 * grow} color="#ffd24a" spin={t * 60} />
      <Star cx={99} cy={44} r={2.8 * grow} color="#ff9bb8" spin={-t * 60} />
      <Star cx={8} cy={66} r={2.4 * grow} color="#7cc4f2" spin={t * 50} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)
  const pop = span(t, POP, POP + 0.6, easeOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Branch t={t} />
        <Layer opacity={span(t, POP, POP + 0.15)} scale={Math.max(0, pop)} origin={[CENTER, GROUND]}>
          <Girl t={t} />
        </Layer>
        <Bird t={t} />
        <Cheer t={t} />
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
    { at: 0, label: '草が はえて、女の子が ぽん と出る', sound: 'pop' },
    { at: FLY, label: '小鳥が とんでくる' },
    { at: HEAR, label: 'うたが きこえて、びっくり' },
    { at: SWAY, label: 'たのしくて 足を ひらき、からだを ゆらす' },
    { at: PREP, label: '「よーし!」', sound: 'pop' },
    { at: JUMP, label: 'ジャンプ! 足が ばってんに まじわる' },
    { at: LAND_J, label: 'おっとっと と ぐらぐら' },
    { at: SETTLE, label: 'ぴたっ と きまって にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '交 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
