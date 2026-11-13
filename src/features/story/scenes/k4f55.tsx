/*
 * 何(なに): にもつを かついだ 人が あるいてくる。「それ、なあに?」
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … あたまの はねた かみ から、かた を通って、まえに ふった うで
 *                  (さいごに うで を まえへ ふって あいさつ したときだけ、この線に重なる)
 *   2画目(丨)  … 人の どう と あし
 *   3画目(一)  … にもつを のせた せおいわく の いちばん上の よこ木
 *   4・5・6画目 … わくに しばった 四角い はこ(左がわ・上と右がわ・した)
 *   7画目(亅)  … せおいわく の 右の 長い はしら と、した の ささえ
 *
 * ながれ
 *   木の わく に 大きな にもつ を のせた 人が、おもくて ふうふう いいながら あるいてくる
 *   → 立ちどまって ひとやすみ。にもつの上に 小鳥が とまって「なあに?」と くびを かしげる
 *   → 人は びっくり して、にっこり。うでを まえへ ふって「やあ」と あいさつ
 *   → ほね が ひかって、絵が うすくなり、字「何」が のこる
 *
 * 人・小鳥・にもつは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。あるくときは ふる。にもつは ひもで かた に かける。
 *   せおいわく は 人の せなか がわ(右)に あり、人は 左むきに あるく。
 *   字の形になるのは、あいさつで うでを ふった さいごの しゅんかん だけ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '何'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const ROPE = '#e2c48c'
const CRATE = '#e8b062'
const CRATE_LIGHT = '#f4cc8a'
const CRATE_DARK = '#c58a43'
const SACK = '#f2e6c8'
const SACK_DARK = '#dcc9a0'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const BIRD = '#ff9a5c'
const BIRD_DARK = '#e2733f'
const NOTE = '#5f7fd6'

/** くぎり の時間(秒) */
const WALK = 0.45
/** 立ちどまる */
const STOP = 3.3
/** 小鳥が とんでくる・とまる */
const FLY = 3.6
const PERCH = 4.3
/** 人が 小鳥に きづく */
const NOTICE = 4.8
/** うれしくなって、うでを まえへ ふりはじめる */
const GREET = 5.2
const INK = 6.3
const DONE = 8.9
const DURATION = 9.4

/** 人の 足もと(せなかを そらす・かたむく ときの じく)と、かた(うでを ふる じく) */
const FEET: readonly [number, number] = [27.5, 94]
const SHOULDER: readonly [number, number] = [25.4, 40]
/** 1画目の 書きおわり(うで を ふったときの 手先) */
const HAND_GOAL: readonly [number, number] = [11.3, 56.8]
/** にのうで・うでさき の長さ(ふると、かた から 1画目の書きおわりに ちょうど とどく) */
const ARM_PART = Math.hypot(HAND_GOAL[0] - SHOULDER[0], HAND_GOAL[1] - SHOULDER[1]) / 2
/** うで を ふったときの 角度(ま下から、まえへ 何度か) */
const STRETCH = (Math.atan2(SHOULDER[0] - HAND_GOAL[0], HAND_GOAL[1] - SHOULDER[1]) * 180) / Math.PI
const NECK: readonly [number, number] = [28, 35]
/** 小鳥が とまる 場所(にもつの 上の よこ木 の まんなか あたり) */
const PERCH_AT: readonly [number, number] = [70, 19]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[103, 8]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="102.2" y="-3.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 103 8)`} />
        ))}
      </Layer>
      <circle cx="103" cy="8" r={5.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="10" rx="7" ry="3.2" />
        <ellipse cx="11" cy="8.2" rx="5" ry="3.2" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** せおいわく と にもつ。人の せなか がわ(右)に ひもで かける。 */
function Load() {
  return (
    <>
      {/* 左の はしら(人の せなか のすぐ うしろ。うすい色で おくに) */}
      <path d="M36.6 25 V90" fill="none" stroke={BARK_DARK} strokeWidth="3.2" strokeLinecap="round" />
      {/* した の ささえ(にもつの ざぶとん) */}
      <path d="M36.6 90.6 H84" fill="none" stroke={BARK} strokeWidth="3.2" strokeLinecap="round" />
      {/* まるい ふくろ(わくの した の ほうに おく) */}
      <path d="M58 70.5 Q62 66 66 70.5 Z" fill={SACK_DARK} />
      <circle cx="62" cy="80" r="10.2" fill={SACK_DARK} />
      <circle cx="61.2" cy="79" r="9.6" fill={SACK} />
      <path d="M58.6 70 L65.4 70" stroke={BARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* 四角い はこ(4・5・6画目) */}
      <path d="M40 44.6 L66.8 40.8 Q68.8 40.6 68.4 42.6 L64.8 61.4 Q64.5 62.6 63.4 62.8 L45.8 65.2 Q44.6 65.3 44.4 64 L39.6 46.4 Q39.4 44.8 40 44.6 Z" fill={CRATE} />
      <path d="M40.4 45 L66.6 41.3 Q68 41.2 67.8 42.4 L67.4 44.6 L41.6 48 Z" fill={CRATE_LIGHT} />
      {/* はこの ふた の あわせめ(ガムテープ) */}
      <path d="M54 41.8 L52.6 63.6" fill="none" stroke={CRATE_DARK} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <path d="M44.4 64 L64.2 61.4 L64.6 59.6 L43.8 62.4 Z" fill={CRATE_DARK} />
      {/* はこ と 右の はしら を つなぐ ひも */}
      <path d="M67.6 52 L83 52" fill="none" stroke={ROPE} strokeWidth="1.8" strokeLinecap="round" />
      {/* 3画目 の よこ木 と 7画目 の 長い はしら */}
      <Bone char={CHAR} n={3} color={BARK} width={4.4} />
      <Bone char={CHAR} n={7} color={BARK} width={4.2} />
    </>
  )
}

type Mood = 'tired' | 'surprised' | 'happy'

/** うで の かっこう。swing = ま下から まえへ ふった角度 / bend = ひじ の まがり(まえへ) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ pose, color }: { readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 体は 左むき。まえ = 左(x が へる ほう)
  const elbow = [SHOULDER[0] - Math.sin(rad(pose.swing)) * ARM_PART, SHOULDER[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] - Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.6" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'tired') {
    return (
      <>
        <path d="M23.6 23.8 l3 1.2" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25.4" cy="25.6" r="1.15" fill="#2b2b2b" />
        <ellipse cx="24.6" cy="30.2" rx="1.3" ry="1.7" fill="#b9483f" />
      </>
    )
  }
  if (mood === 'surprised') {
    return (
      <>
        <path d="M23.4 22.2 l3 -0.9" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="25.4" cy="25.2" r="1.5" fill="#2b2b2b" />
        <ellipse cx="24.4" cy="30.2" rx="1" ry="1.3" fill="#b9483f" />
      </>
    )
  }
  return (
    <>
      <path d="M23.8 24.9 Q25.4 26.6 27 24.9" fill="none" stroke="#2b2b2b" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M23 29.4 Q24.8 31.5 26.8 29.9" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
    </>
  )
}

type PersonProps = {
  readonly step: number
  readonly mood: Mood
  /** てまえの うで・むこうの うで */
  readonly nearArm: ArmPose
  readonly farArm: ArmPose
  readonly headTilt: number
}

function Person({ step, mood, nearArm, farArm, headTilt }: PersonProps) {
  return (
    <>
      {/* むこうの うで: 体の うしろに かくれる */}
      <Arm pose={farArm} color={TUNIC_FAR} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={step * 17} origin={[30, 68]}>
        <rect x="27.2" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS_DARK} />
        <ellipse cx="28.6" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 17} origin={[25, 68]}>
        <rect x="21.6" y="65" width="6.2" height="27.5" rx="3.1" fill={PANTS} />
        <ellipse cx="23" cy="93.4" rx="5.2" ry="2.8" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を、みじかく つなぐ */}
      <rect x="24.8" y="32" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      <rect x="20.4" y="36.6" width="14" height="34" rx="6.8" fill={TUNIC} />
      <path d="M22.4 62.5 h10" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* にもつを かける ひも: うしろの はしら から かた を こえて、むねへ。こしの ひもも */}
      <path d="M36.6 30 L31 36.6 L23.6 49" fill="none" stroke={ROPE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 66 H36.6" fill="none" stroke={ROPE} strokeWidth="2" strokeLinecap="round" />
      {/* てまえの うで: あいさつで ふると、1画目の線に重なる */}
      <Arm pose={nearArm} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={NECK}>
        <g transform="translate(-1.4 0.6)">
          <circle cx="30.2" cy="24.6" r="9.2" fill={SKIN} />
          <path d="M21.5 23 C21.4 13.8 31.8 11.2 37.8 17 C40.2 20.2 40.2 26 38.2 30.2 C37.6 24.4 33.4 20.2 26.6 20.6 C24.4 20.8 22.6 21.8 21.5 23 Z" fill={HAIR} />
          <circle cx="26.5" cy="28.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
          <Face mood={mood} />
        </g>
        {/* 1画目の 書きはじめ: ぴょこんと はねた かみ */}
        <path d="M32.4 17.6 Q33.2 14.4 35 16.5 Q36.2 13.8 37 16.9" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
    </>
  )
}

/** あるいている間の あせ。うしろ(右)へ とぶ。 */
function Sweat({ t }: SceneProps) {
  const show = during(t, WALK + 0.3, STOP + 0.3, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${37 + p * 7} ${15 + p * 6 - Math.sin(p * Math.PI) * 5}) rotate(35)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 立ちどまった しゅんかんの「ふう」。 */
function Sigh({ t }: SceneProps) {
  const show = during(t, STOP, STOP + 1.0, 0.25)
  if (show <= 0) return null
  const p = span(t, STOP, STOP + 1.0, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={18 - p * 9} cy={30 - p * 5} rx={3 + p * 2.6} ry={2 + p * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <ellipse cx={22.5 - p * 6} cy={31.4 - p * 2} rx={1.5 + p} ry={1.1 + p * 0.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

/** にもつの 上に とまった 小鳥が くびを かしげて たずねる「?」(自分で 線を ひいた しるし) */
function Ask({ t }: SceneProps) {
  const pop = span(t, PERCH + 0.15, PERCH + 0.6, backOut)
  const show = during(t, PERCH + 0.15, GREET + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <Layer opacity={show} x={PERCH_AT[0] + 6} y={PERCH_AT[1] - 8.5} scale={Math.max(0, pop)} origin={[0, 3]}>
      <path d="M-2.4 -1.8 Q-2.4 -4.6 0.2 -4.6 Q2.8 -4.6 2.8 -2 Q2.8 -0.2 0.8 0.9 Q0.1 1.4 0.1 2.6" fill="none" stroke={NOTE} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="0.1" cy="5.4" r="0.95" fill={NOTE} />
    </Layer>
  )
}

/** 小鳥が とんできて、にもつの 上に とまる。はじめは くびを かしげ、うれしくなると うたう。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, FLY, PERCH, easeOut)
  if (arrive <= 0) return null
  // 右上から、ゆるい山なり で おりてくる
  const x = PERCH_AT[0] + 46 - arrive * 46
  const y = PERCH_AT[1] - 22 + arrive * 22 - Math.sin(arrive * Math.PI) * 8
  const landed = arrive >= 1
  const hop = landed && t > GREET ? Math.abs(wave(t, 0.7)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  // 小鳥の 体は 左むき。「なあに」のときは あたまを かしげる
  const tilt = landed ? 14 * (1 - span(t, GREET - 0.2, GREET + 0.2)) * span(t, PERCH, PERCH + 0.3) : 0
  const song = during(t, GREET + 0.2, INK + 0.3, 0.25)
  return (
    <>
      <Layer x={x} y={y - hop}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill={BIRD_DARK} />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill={BIRD} />
        <Layer rotate={-tilt} origin={[-1.4, -0.4]}>
          <circle cx="-3" cy="-2.3" r="2.3" fill={BIRD} />
          <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
          <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
        </Layer>
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill={BIRD_DARK} />
        </Layer>
        {/* あしは よこ木に つかむ */}
        {landed && <path d="M-1 3 v1.4 M1 3 v1.4" stroke="#e2733f" strokeWidth="0.7" strokeLinecap="round" />}
      </Layer>
      <g opacity={song} fill="#f07f9e">
        <path d={`M${80 - wave(t, 1.2) * 1.2} ${15 - ((t * 5) % 6)} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx={79.2 - wave(t, 1.2) * 1.2} cy={15 - ((t * 5) % 6)} rx="1.1" ry="0.8" />
        <ellipse cx={81.8 - wave(t, 1.2) * 1.2} cy={14.2 - ((t * 5) % 6)} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // あるく: 右から 左へ。おもい にもつで、少し まえかがみ
  const walking = 1 - span(t, STOP - 0.5, STOP)
  const stride = t < WALK ? 0 : Math.sin((t - WALK) * Math.PI * 2 * 2.1) * walking
  const walkX = mix(t, WALK, STOP, 85, 0, (x) => 1 - (1 - x) ** 1.5)
  const bob = -Math.abs(stride) * 1.3
  // 立ちどまると、まえかがみ が もどって まっすぐ に(字になるときは まっすぐ)
  const lean = mix(t, STOP - 0.7, STOP + 0.6, -5, 0)

  // 小鳥に きづいて びっくり → にっこり
  const mood: Mood = t < NOTICE ? 'tired' : t < GREET ? 'surprised' : 'happy'
  // うで: あるくときは ふる。立っているときは ま下に たれる。うれしくなったら まえへ ふって あいさつ
  const greet = span(t, GREET, INK - 0.1, easeInOut)
  const hanging = 3
  const nearArm: ArmPose = t < STOP ? { swing: stride * 22, bend: 20 } : { swing: hanging + (STRETCH - hanging) * greet, bend: 8 * (1 - greet) }
  const farArm: ArmPose = t < STOP ? { swing: -stride * 22, bend: 20 } : { swing: hanging, bend: 8 }
  const headTilt = t < NOTICE ? -4 + stride * 2 : mix(t, NOTICE, GREET, 6, 2) * (1 - span(t, GREET, INK - 0.1))
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.1)}>
          <ellipse cx={27.5 + walkX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob} rotate={lean} origin={FEET}>
            <Load />
            <Person step={stride} mood={mood} nearArm={nearArm} farArm={farArm} headTilt={headTilt} />
            <Sweat t={t} />
          </Layer>
          <Sigh t={t} />
        </Layer>
        <Bird t={t} />
        <Ask t={t} />
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
    { at: 0, label: 'お日さまが でる', sound: 'pop' },
    { at: WALK, label: 'にもつを かついだ 人が あるいてくる' },
    { at: STOP, label: '立ちどまって ふう', sound: 'pop' },
    { at: PERCH, label: '小鳥が にもつに とまって「なあに?」' },
    { at: GREET, label: '人は にっこり。うでを ふって あいさつ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '何 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
