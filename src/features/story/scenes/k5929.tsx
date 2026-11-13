/*
 * 天(てん): 手を ひろげた 人の、あたまの 上の いちばん上。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 子どもの あたまの上に とまった、ながい ほそ長い 雲(いちばん上の 空)
 *   2画目(ノ→) … 子どもが 左右に ひろげた りょううで
 *   3画目(ノ)  … あたま から どう、ひらいた 左の あし
 *   4画目(丶)  … どう から ひらいた 右の あし
 *
 * ながれ
 *   子どもが ひとりで ぼんやり 立っている(ちょっと たいくつ)
 *   → 空を 長い雲が すーっと ながれてきて、子どもは 見上げて「?」
 *   → 雲は 子どもの あたまの 真上で とまる。子どもは 指さして「あっ!」(いちばん上は あそこだ)
 *   → うれしくなって、しゃがんで ぴょん! 手と あしを ひろげて ジャンプ
 *   → ほね が ひかって、絵が うすくなり、字「天」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、あたま は どう の まんなか の上。
 *   さいごの 「大」の形は、ジャンプで 手と あしを ひろげた しゅんかん(ほんとうに そうなる 形)。
 *   あしは 字より 少し みじかいけれど、むきは 字と おなじ(字に 合わせて 長くは しない)。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '天'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0884a'
const TUNIC_DARK = '#d86f35'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const CLOUD = '#ffffff'
const CLOUD_SHADE = '#cfdcec'
const MARK = '#5f7fd6'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const POP = 0.3
/** 雲が ながれはじめる・あたまの上で とまる */
const CLOUD_FROM = 1.0
const CLOUD_STOP = 3.0
/** 子どもが 雲に 気づく */
const NOTICE = 1.3
/** 指さし → 「あっ!」 */
const POINT = 2.4
const REALIZE = 3.5
/** しゃがむ → ジャンプ → 手あしを ひろげる */
const CROUCH = 3.6
const JUMP = 4.1
const SPREAD_END = 4.8
const INK = 6.2
const DONE = 8.8
const DURATION = 9.4

/* ───────── 子どもの 体の つくり(正面むき) ───────── */

/** 体の まんなか の x と、足の うらの 高さ */
const CX = 52
const FOOT_Y = 98
/** かた(うで の つけね)・こし(あし の つけね)の 左右 */
const SHOULDER_L: readonly [number, number] = [45.4, 51.8]
const SHOULDER_R: readonly [number, number] = [58.6, 51.8]
const HIP_L: readonly [number, number] = [48.6, 71.5]
const HIP_R: readonly [number, number] = [55.4, 71.5]
/** かた から ひじ、ひじ から 手 までの 長さ(のばすと 字の 2画目に とどく) */
const ARM_PART = 10
const LEG_LEN = 26.5
/** ジャンプ の いちばん上の たかさ(うでが 2画目の たかさに くる) */
const APEX = 4
const rad = (deg: number) => (deg * Math.PI) / 180

type Mood = 'bored' | 'wonder' | 'joy'

/** うで の かっこう。swing = ま下から 外へ ふった角度 / bend = ひじ の まがり(外へ ふえる) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。side は 左 = -1 / 右 = 1 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const shoulder = side < 0 ? SHOULDER_L : SHOULDER_R
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3" fill={SKIN} />
    </>
  )
}

/** こし から ひらく あし。spread = ま下から 外へ ひらいた角度 */
function Leg({ side, spread }: { readonly side: -1 | 1; readonly spread: number }) {
  const hip = side < 0 ? HIP_L : HIP_R
  const foot = [hip[0] + side * Math.sin(rad(spread)) * LEG_LEN, hip[1] + Math.cos(rad(spread)) * LEG_LEN] as const
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${foot[0]} ${foot[1]}`} stroke={side < 0 ? PANTS : PANTS_DARK} strokeWidth="6.2" strokeLinecap="round" />
      <ellipse cx={foot[0] + side * 0.8} cy={foot[1] - 0.2} rx="4.2" ry="2.8" fill={SHOE} transform={`rotate(${side * spread * 0.5} ${foot[0]} ${foot[1]})`} />
    </>
  )
}

type FaceProps = { readonly mood: Mood; readonly look: number }

/** 顔。気持ちで 目と口を かえる。look = 見上げる度合い(目が 上に よる) */
function Face({ mood, look }: FaceProps) {
  const up = -look * 1.4
  return (
    <>
      <circle cx="45.8" cy="41.6" r="2" fill="#ff9d9d" opacity="0.55" />
      <circle cx="58.2" cy="41.6" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'bored' && (
        <>
          <path d="M46.4 38.6 h4 M53.6 38.6 h4" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M50.2 42.6 h3.6" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'wonder' && (
        <>
          <circle cx="48.4" cy={38 + up} r="1.5" fill={EYE} />
          <circle cx="55.6" cy={38 + up} r="1.5" fill={EYE} />
          <path d={`M46.2 ${34.6 + up} q2.2 -1.4 4.4 0 M53.4 ${34.6 + up} q2.2 -1.4 4.4 0`} fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="52" cy={42.6 + up * 0.5} rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M46.2 39 Q48.4 36.2 50.6 39 M53.4 39 Q55.6 36.2 57.8 39" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M48.8 41.4 Q52 47 55.2 41.4 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly look: number
  readonly headTilt: number
  readonly armL: ArmPose
  readonly armR: ArmPose
  readonly legSpread: number
  readonly breath: number
}

function Kid({ mood, look, headTilt, armL, armR, legSpread, breath }: KidProps) {
  return (
    <>
      <Leg side={-1} spread={legSpread} />
      <Leg side={1} spread={legSpread} />
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="49.6" y="44" width="4.8" height="8" rx="2.2" fill={SKIN_SHADE} />
      {/* どう と ズボン。ジャンプのとき 息で 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.03} scaleY={1 + breath * 0.02} origin={[CX, 70]}>
        <rect x="44" y="48.4" width="16" height="20" rx="6.4" fill={TUNIC} />
        <rect x="44.4" y="64.4" width="15.2" height="8" rx="3.4" fill={PANTS} />
      </Layer>
      <Arm side={-1} pose={armL} />
      <Arm side={1} pose={armR} />
      <Layer rotate={headTilt} origin={[CX, 47]}>
        <circle cx={CX} cy="37.5" r="8.6" fill={SKIN} />
        <path d="M43.4 36.4 C42.8 26.4 61.2 26.4 60.6 36.4 C58.4 32.6 55.4 31.4 52 31.4 C48.6 31.4 45.6 32.6 43.4 36.4 Z" fill={HAIR} />
        {/* あたまの てっぺんの 小さな ぴょこん(3画目の 書きはじめ) */}
        <path d="M49.6 29.8 Q50.6 26 52.8 29.6" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
        <Face mood={mood} look={look} />
      </Layer>
    </>
  )
}

/* ───────── まわりの 景色 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[98, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="97.3" y="2.6" width="1.4" height="3.2" rx="0.7" fill={SUN} transform={`rotate(${i * 45} 98 12)`} />
        ))}
      </Layer>
      <circle cx="98" cy="12" r={4.8 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="99" rx="51" ry="5.2" fill={GRASS} />
      {[8, 22, 80, 100].map((x, i) => (
        <g key={x} transform={`rotate(${wave(t, 2.6, i * 0.5) * 4} ${x} 98)`}>
          <path d={`M${x} 98.4 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
        </g>
      ))}
    </>
  )
}

/** 1画目の 雲: ながい ほそ長い 雲。ほね の線 そのまま(本来 ほそ長い 雲だから) */
function LongCloud({ t }: SceneProps) {
  const drift = span(t, CLOUD_FROM, CLOUD_STOP, easeOut)
  if (drift <= 0) return null
  return (
    <Layer x={-100 * (1 - drift)}>
      <Layer y={1.5}>
        <Bone char={CHAR} n={1} color={CLOUD_SHADE} width={6.4} />
      </Layer>
      <Bone char={CHAR} n={1} color={CLOUD} width={5.6} />
      <circle cx="36" cy="22" r="3.8" fill={CLOUD} />
      <circle cx="62" cy="19" r="4.2" fill={CLOUD} />
    </Layer>
  )
}

/** ひと休み の 小鳥。右から 左へ とおりすぎる(にぎやかし) */
function Bird({ t }: SceneProps) {
  const fly = span(t, 0.5, 3.4)
  if (fly <= 0 || fly >= 1) return null
  const x = 118 - fly * 140
  const y = 10 + Math.sin(fly * 9) * 1.6
  return (
    <Layer x={x} y={y}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
      <Layer rotate={wave(t, 0.2) * 28} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
    </Layer>
  )
}

/** 「?」と「!」 の しるし。あたまの 右上に ぽん と出る */
function Marks({ t }: SceneProps) {
  const ask = during(t, NOTICE + 0.2, POINT + 0.3, 0.2)
  const aha = during(t, REALIZE, CROUCH + 0.3, 0.15)
  return (
    <>
      {ask > 0 && (
        <Layer x={66} y={32 + wave(t, 0.8) * 0.6} opacity={ask} scale={backOut(span(t, NOTICE + 0.2, NOTICE + 0.5))} origin={[0, 4]}>
          <path d="M-2.6 -3 Q-2.6 -6.4 0 -6.4 Q2.8 -6.4 2.8 -3.6 Q2.8 -1.6 0.2 -0.2 Q-0.4 0.4 -0.4 2" fill="none" stroke={MARK} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-0.4" cy="4.4" r="1" fill={MARK} />
        </Layer>
      )}
      {aha > 0 && (
        <Layer x={37} y={34} opacity={aha} scale={backOut(span(t, REALIZE, REALIZE + 0.3))} origin={[0, 4]}>
          <path d="M0 -6.4 L0 0.6" stroke="#f07f9e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="4" r="1.2" fill="#f07f9e" />
        </Layer>
      )}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // うで: 立っている → 雲を 指さす → しゃがんで 引く → ジャンプで ひろげる(さいごに 2画目の たかさで よこ)
  const point = span(t, POINT, POINT + 0.7, easeOut)
  const down = span(t, CROUCH - 0.05, JUMP, easeInOut)
  const spread = span(t, JUMP, SPREAD_END, backOut)
  const reach = (hanging: number, pointing: number) => {
    const raised = hanging + (pointing - hanging) * point
    const wound = raised + (14 - raised) * down
    // ひろげたあとは、うれしくて 手を 少し ぱたぱた(2画目の たかさ は のこる)
    return wound + (90 - wound) * spread + wave(t, 0.7) * 2.5 * span(t, SPREAD_END, SPREAD_END + 0.4)
  }
  const armL: ArmPose = { swing: reach(8, 8), bend: -6 * (1 - spread) }
  const armR: ArmPose = { swing: reach(8, 140), bend: (-6 + 21 * point) * (1 - spread) }
  // あし: ジャンプで ひらく(3・4画目の むき)
  const legSpread = 3 + 55 * span(t, JUMP, SPREAD_END, backOut)

  // ジャンプ: しゃがんで ためて、ぴょんと とびあがり、ふわっと うかぶ
  const squat = 0.09 * span(t, CROUCH, JUMP - 0.05, easeInOut) * (1 - span(t, JUMP - 0.05, JUMP + 0.25))
  const lift = APEX * span(t, JUMP, SPREAD_END, easeOut) + 0.5 * wave(t, 1.4) * span(t, SPREAD_END, SPREAD_END + 0.4)
  const air = Math.max(0, lift)

  // 見上げる: 雲に 気づいて 上を むく。うれしくなると 正面
  const look = span(t, NOTICE, NOTICE + 0.5, easeOut) * (1 - span(t, REALIZE, REALIZE + 0.4))
  const headTilt = look * -5 + (t >= REALIZE ? wave(t, 1.2) * 1.5 : 0)
  const mood: Mood = t < NOTICE ? 'bored' : t < REALIZE ? 'wonder' : 'joy'
  const pop = backOut(span(t, POP, POP + 0.5))
  const breath = t > JUMP ? wave(t, 1.4) : 0
  // ぼんやり 立っている間の ゆらゆら
  const idle = t < NOTICE ? wave(t, 2.2) * 0.8 : 0

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Bird t={t} />
        <LongCloud t={t} />
        <ellipse cx={CX} cy="98.4" rx={Math.max(0, (12 - air * 0.8) * pop)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={pop} origin={[CX, FOOT_Y]} opacity={span(t, POP, POP + 0.1)}>
          <Layer x={idle * 0.3} y={-lift} scaleX={1 + squat * 0.5} scaleY={1 - squat} origin={[CX, FOOT_Y]}>
            <Kid mood={mood} look={look} headTilt={headTilt} armL={armL} armR={armR} legSpread={legSpread} breath={breath} />
          </Layer>
        </Layer>
        <Marks t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05} origin={[54.5, 54.5]}>
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
    { at: 0, label: '子どもが ぼんやり 立っている', sound: 'pop' },
    { at: CLOUD_FROM, label: '長い雲が ながれてきて、見上げる' },
    { at: POINT, label: '雲が あたまの真上で とまる。指さして「あっ」' },
    { at: CROUCH, label: 'しゃがんで ぴょん!', sound: 'pop' },
    { at: SPREAD_END, label: '手と あしを ひろげて ジャンプ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '天 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
