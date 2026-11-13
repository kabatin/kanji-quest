/*
 * 九(きゅう): うでを ぐっと まげた 形。ちからこぶ を みせる おとこの子。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … まげた うで の 先(ひじ から 上へ たてた うでさき と こぶし)
 *   2画目(乙)  … かた から よこへ のばした うで(上うで)と、まっすぐ立つ 体・あし
 *                  (字と ぴったり重ならなくても、だいたい 同じ場所・同じ向き)
 *
 * ながれ
 *   おとこの子が 立っている → ひよこが やってきて「ちからこぶ みせて」と ふきだしで ねがう
 *   → おとこの子は ちょっと はずかしそう → よし と うなずいて、うでを よこへ あげ、ぐっと まげる
 *   (かおは がんばり顔) → ちからこぶ が ぽこっ。ほこらしい顔、ひよこは おおよろこび
 *   → ほね が ひかって、まげた うで が 字「九」に なる
 *
 * 人は、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て、ひじ で まがる。上うで を よこへ あげてから、ひじ を 曲げて うでさき を たてる。
 *   ちからこぶ は、ひじ の内がわ(まがった がわ)の 上うで が もりあがる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '九'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const SKIN_LIGHT = '#fde3c6'
const HAIR = '#5a3b2a'
const TUNIC = '#f0894a'
const TUNIC_DARK = '#d26e34'
const PANTS = '#4f6fb5'
const PANTS_DARK = '#3f5c9c'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const CHICK = '#ffd95a'
const CHICK_DARK = '#f2bd2f'
const BEAK = '#f08a3c'
const INKY = '#2b2b2b'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const CHICK_IN = 0.8
const ASK = 2.0
const NOD = 3.0
const RAISE_END = 3.9
const BEND_END = 4.8
const CHEER = 4.9
const INK = 6.2
const DONE = 8.8
const DURATION = 9.4

/** 体の まんなか(たて)と、足もと */
const CX = 64
const GROUND = 96
/** 左(絵の左がわ)・右の かた。左の うで を まげる */
const SHOULDER_L: readonly [number, number] = [57, 42]
const SHOULDER_R: readonly [number, number] = [71, 42]
/** 上うで・うでさき の長さ(ひじ は かた から 16 よこ、こぶし は ひじ から 19 上) */
const UPPER = 16
const FORE = 19

type Mood = 'shy' | 'effort' | 'proud'

/** うで の かっこう。swing = ま下から 外がわへ あげた角度 / bend = ひじ の まがり(うでさき が 上へ むかう ほう) */
type ArmPose = { readonly swing: number; readonly bend: number }

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた・ひじ・手 の場所。side = 左の うで は -1、右の うで は +1(外がわへ ふる向き) */
function limb(shoulder: readonly [number, number], side: -1 | 1, pose: ArmPose) {
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.swing)) * UPPER, shoulder[1] + Math.cos(rad(pose.swing)) * UPPER] as const
  const fore = pose.swing + pose.bend * -side
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * FORE, elbow[1] + Math.cos(rad(fore)) * FORE] as const
  return { elbow, hand }
}

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="78" cy="14" rx="7" ry="3.2" />
        <ellipse cx="83" cy="12" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 46, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** かた から出て、ひじ で まがる うで。そで → うで → こぶし。 */
function Arm({ shoulder, side, pose }: { readonly shoulder: readonly [number, number]; readonly side: -1 | 1; readonly pose: ArmPose }) {
  const { elbow, hand } = limb(shoulder, side, pose)
  const sleeveEnd = [shoulder[0] + (elbow[0] - shoulder[0]) * 0.42, shoulder[1] + (elbow[1] - shoulder[1]) * 0.42] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${sleeveEnd[0]} ${sleeveEnd[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="7.2" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.7" fill={SKIN} />
      <path d={`M${hand[0] - 1.8} ${hand[1] + 0.6} h3.6`} stroke={SKIN_SHADE} strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

/** ちからこぶ: ひじ の内がわ(まがった がわ)の 上うで が、ぽこっと もりあがる */
function Bump({ pose, size }: { readonly pose: ArmPose; readonly size: number }) {
  if (size <= 0) return null
  const { elbow } = limb(SHOULDER_L, -1, pose)
  const dx = elbow[0] - SHOULDER_L[0]
  const dy = elbow[1] - SHOULDER_L[1]
  const len = Math.hypot(dx, dy)
  // うで の向きの 内がわ(うで を よこにしたとき 上がわ)
  const nx = -dy / len
  const ny = dx / len
  const cx = SHOULDER_L[0] + dx * 0.55 + nx * 2.8 * size
  const cy = SHOULDER_L[1] + dy * 0.55 + ny * 2.8 * size
  const r = Math.max(0, 4.6 * size)
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={SKIN} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.42} fill={SKIN_LIGHT} />
      <path d={`M${cx - r * 0.7} ${cy + r * 0.85} Q${cx} ${cy + r * 1.1} ${cx + r * 0.8} ${cy + r * 0.75}`} fill="none" stroke={SKIN_SHADE} strokeWidth="0.9" strokeLinecap="round" />
    </>
  )
}

function Face({ mood, look }: { readonly mood: Mood; readonly look: number }) {
  return (
    <g transform="translate(2 0)">
      <circle cx="62" cy="26" r="10" fill={SKIN} />
      <path d="M52.2 25 C50.5 13.5 73.5 13.5 71.8 25 C68.5 19.5 55.5 19.5 52.2 25 Z" fill={HAIR} />
      <path d="M60 16.4 Q61 12.6 63.4 14.8 Q64.6 12.4 65.6 16" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="55.6" cy="30.6" r="2.1" fill={CHEEK} opacity={mood === 'shy' ? 0.45 : 0.7} />
      <circle cx="68.4" cy="30.6" r="2.1" fill={CHEEK} opacity={mood === 'shy' ? 0.45 : 0.7} />
      {mood === 'shy' && (
        <>
          <path d="M54.8 24.6 L58.8 23.2 M69.2 24.6 L65.2 23.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={57.8 + look} cy="27.2" r="1.2" fill={INKY} />
          <circle cx={66.2 + look} cy="27.2" r="1.2" fill={INKY} />
          <path d="M59.6 33.2 q1.2 -1 2.4 0 q1.3 1 2.5 0" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'effort' && (
        <>
          <path d="M55.6 25.4 l3.2 1.7 l-3.2 1.7 M68.4 25.4 l-3.2 1.7 l3.2 1.7" fill="none" stroke={INKY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="58.6" y="32" width="6.8" height="3" rx="1.2" fill="#ffffff" stroke="#b9483f" strokeWidth="0.9" />
        </>
      )}
      {mood === 'proud' && (
        <>
          <path d="M55.4 27.8 q2.2 -3 4.4 0 M64.2 27.8 q2.2 -3 4.4 0" fill="none" stroke={INKY} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M58 31.6 Q62 38 66 31.6 Z" fill="#b9483f" />
          <path d="M60 34.6 Q62 33.6 64 34.6 Q62 36.4 60 34.6 Z" fill="#ff8a8a" />
        </>
      )}
    </g>
  )
}

type BoyProps = {
  readonly mood: Mood
  readonly look: number
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
  readonly breath: number
  readonly bump: number
}

function Boy({ mood, look, nearArm, farArm, headTilt, breath, bump }: BoyProps) {
  return (
    <>
      {/* あし: かた はば より すこし せまく、まっすぐ立つ */}
      <rect x="56.4" y="64" width="6.2" height="29" rx="3.1" fill={PANTS_DARK} />
      <rect x="65.4" y="64" width="6.2" height="29" rx="3.1" fill={PANTS} />
      <ellipse cx="58.6" cy="94" rx="5.4" ry="2.8" fill={SHOE} />
      <ellipse cx="68.8" cy="94" rx="5.4" ry="2.8" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="61.2" y="32.6" width="5.6" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: いきに合わせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.015} origin={[CX, 68]}>
        <rect x="56" y="37.6" width="16" height="31" rx="7" fill={TUNIC} />
        <path d="M58 62 h12" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={SHOULDER_R} side={1} pose={farArm} />
      <Bump pose={nearArm} size={bump} />
      <Arm shoulder={SHOULDER_L} side={-1} pose={nearArm} />
      <Layer rotate={headTilt} origin={[CX, 34]}>
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/** ひよこ。右から ぴょんぴょん はねて きて、さいごは おおよろこびで とびはねる。 */
function Chick({ t }: SceneProps) {
  const arrive = span(t, CHICK_IN, ASK, easeOut)
  if (arrive <= 0) return null
  const x = 125 - arrive * 34
  const walking = arrive < 1
  const cheering = during(t, CHEER, INK + 0.4, 0.2)
  const hop = (walking ? Math.abs(Math.sin(arrive * Math.PI * 4)) * 4 : 0) + Math.abs(wave(t - CHEER, 0.6)) * 8 * cheering
  const wing = walking ? wave(t, 0.2) * 12 : cheering > 0 ? -55 + wave(t, 0.2) * 18 * cheering : 0
  const y = GROUND - 6.5 - hop
  return (
    <>
      <ellipse cx={x} cy="97.4" rx={6.4 - hop * 0.3} ry="1.6" fill="#000000" opacity="0.12" />
      <Layer x={x} y={y}>
        <path d="M-1.6 5 V7 M1.6 5 V7" stroke={BEAK} strokeWidth="1" strokeLinecap="round" />
        <path d="M5.6 -1 l3.2 -1.8 l-0.6 3.4 Z" fill={CHICK_DARK} />
        <ellipse cx="0" cy="0" rx="6.4" ry="5.6" fill={CHICK} />
        <circle cx="-3.4" cy="-5.4" r="4.4" fill={CHICK} />
        <path d="M-7.2 -5.2 l-2.8 0.9 l2.7 1.2 Z" fill={BEAK} />
        <circle cx="-4.4" cy="-6" r="0.75" fill={INKY} />
        <circle cx="-2.2" cy="-3.6" r="1.1" fill={CHEEK} opacity="0.7" />
        <path d="M-3.4 -9.6 q0.6 -2 1.8 -0.8" fill="none" stroke={CHICK_DARK} strokeWidth="0.9" strokeLinecap="round" />
        <Layer rotate={wing} origin={[1.4, -1.8]}>
          <ellipse cx="1.8" cy="0.6" rx="3.8" ry="2.4" fill={CHICK_DARK} />
        </Layer>
      </Layer>
    </>
  )
}

/** ひよこの ふきだし: まげた うでの え(「ちからこぶ みせて」) */
function Wish({ t }: SceneProps) {
  const show = during(t, ASK + 0.1, NOD + 0.2, 0.25)
  if (show <= 0) return null
  const pop = span(t, ASK + 0.1, ASK + 0.5, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[90, 80]}>
      <circle cx="89.4" cy="78" r="1.5" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="88.4" cy="81.6" r="0.95" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx="91" cy="64.5" rx="12.5" ry="10" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
      <path d="M84.5 69.5 H92.5 V59.5" fill="none" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92.5" cy="58.6" r="2.2" fill={SKIN_SHADE} />
    </Layer>
  )
}

/** がんばっている間の あせ */
function Sweat({ t }: SceneProps) {
  const show = during(t, NOD + 0.4, BEND_END, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${75.5 + p * 2} ${20 + p * 9}) rotate(-15)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ちからこぶ が出た しゅんかんの「ぐっ」の すじ */
function Power({ t }: SceneProps) {
  const show = during(t, BEND_END - 0.1, BEND_END + 0.9, 0.15)
  if (show <= 0) return null
  const grow = span(t, BEND_END - 0.1, BEND_END + 0.3, easeOut)
  return (
    <g opacity={show} stroke="#ffb02e" strokeWidth="1.3" strokeLinecap="round" fill="none">
      <path d={`M48.4 ${33 - 2 * grow} v${-3 * grow}`} />
      <path d={`M${53 + grow} ${34 - grow} l${2.4 * grow} ${-2.4 * grow}`} />
      <path d={`M${44 - grow} ${34 - grow} l${-2.4 * grow} ${-2.4 * grow}`} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 2)

  const appear = span(t, 0, 0.6, backOut)
  const breath = wave(t, 2.2)
  const asking = t >= ASK && t < NOD
  // うで: さいしょは ま下に たれる → よこへ あげる → ひじ を まげて うでさき を たてる
  const swing = mix(t, NOD + 0.1, RAISE_END, 6, 90, easeInOut)
  const bend = mix(t, RAISE_END, BEND_END, 0, 90, backOut)
  const nearArm: ArmPose = { swing, bend }
  const farArm: ArmPose = { swing: 6 + wave(t, 2.2) * 1.2, bend: 8 }
  // ちからこぶ: ぽこっと出て、ほこらしい間は ぐっぐっと ちから が入る
  const pulse = span(t, BEND_END - 0.3, BEND_END + 0.2, backOut) * (1 + 0.12 * wave(t - BEND_END, 0.55) * span(t, BEND_END + 0.3, BEND_END + 0.6))
  const mood: Mood = t < NOD ? 'shy' : t < BEND_END ? 'effort' : 'proud'
  // ひよこを 見る(右がわ)。ひよこが ふきだしを出す間は、そわそわ
  const look = asking ? 1.2 : 0.6 * span(t, CHICK_IN, ASK)
  const headTilt = asking ? 4 + wave(t, 1.2) * 1.5 : t < NOD ? 2 : mix(t, BEND_END, BEND_END + 0.4, -2, -4)
  const pop = 1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <ellipse cx={CX} cy="97.4" rx="12" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={appear} origin={[CX, GROUND]}>
          <Boy mood={mood} look={look} nearArm={nearArm} farArm={farArm} headTilt={headTilt} breath={breath} bump={pulse} />
          <Sweat t={t} />
          <Power t={t} />
        </Layer>
        <Chick t={t} />
        <Wish t={t} />
        <Layer opacity={during(t, CHEER + 0.1, INK + 0.3, 0.2)}>
          <Star cx={84} cy={72 - wave(t, 0.7) * 1.5} r={3} color={SUN} spin={t * 90} />
          <Star cx={98} cy={80 + wave(t, 0.9) * 1.5} r={2.2} color="#ff7a4d" spin={-t * 90} />
          <Star cx={26} cy={58} r={2.4} color={SUN} spin={t * 70} />
        </Layer>
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={pop} origin={[54.5, 54.5]}>
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
    { at: 0, label: 'おとこの子が 立っている', sound: 'pop' },
    { at: CHICK_IN, label: 'ひよこが やってくる' },
    { at: ASK, label: 'ひよこが「ちからこぶ みせて」と ねがう', sound: 'pop' },
    { at: NOD, label: 'うでを ぐっと まげる(がんばり顔)' },
    { at: BEND_END, label: 'ちからこぶ が ぽこっ。ほこらしい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '九 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
