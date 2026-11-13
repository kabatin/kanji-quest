/*
 * 子(こ): あたまの 大きな 赤ちゃんが、うれしくて りょうてを ひろげる。
 *
 * ほね(画と絵の対応)
 *   1画目(つり)  … 赤ちゃんの 大きな あたまの てっぺん(たいらな かみの はえぎわ)
 *   2画目(はね)  … どう と あし(まっすぐ立った 体)
 *   3画目(一)    … よこに ひろげた りょうて(かた の高さで、左右に まっすぐ のびる)
 *
 * ながれ
 *   ひとりぼっちの 赤ちゃんは つまらなくて しょんぼり(うで は だらんと下げる)
 *   → ちょうちょ が とんできて、赤ちゃんが 見つける(「あっ」)
 *   → うれしくて、りょうてを ぱっと ひろげる。ちょうちょ は あたまの まわりを ひらひら
 *   → ちょうちょ が とんでいき、手を ひろげた まま の すがた で ほね が ひかって 字「子」になる
 *
 * 赤ちゃんは、ほんものの つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   あたま は 体に くらべて 大きい。くび は みじかい。うで は かた から出て ひじ で まがる。
 *   手を ひろげると、うで が かた の高さで よこに のびる。
 */
import { backOut, during, easeInOut, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '子'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a65a'
const TUNIC_DARK = '#e28f3e'
const PANTS = '#6fb0e8'
const PANTS_DARK = '#5a9ad4'
const SHOE = '#6b4a36'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const WING = '#f07f9e'
const WING_LIGHT = '#ffc2d4'
const WING_DARK = '#c9567b'

/** くぎり の時間(秒) */
const FLY_IN = 2.3
const NOTICE = 3.0
const JOY = 3.8
const SPREAD_END = 5.2
const LEAVE = 4.9
const INK = 6.3
const DONE = 9.2
const DURATION = 9.8

/** 体の つくり: かた の高さ・かたの よこ位置・うで の 1本分の長さ */
const SHOULDER_Y = 47
const SHOULDER_L = 47.5
const SHOULDER_R = 60.5
const ARM_PART = 17.5
/** 3画目の 書きはじめ と 書きおわり(手を ひろげたときの 手の さき) */
const HAND_L: readonly [number, number] = [12.3, 51.5]
const HAND_R: readonly [number, number] = [96.4, 45.8]
const deg = (rad: number) => (rad * 180) / Math.PI
/** 手を ひろげたときの うで の角度(ま下から よこへ 何度か) */
const SPREAD_L = deg(Math.atan2(SHOULDER_L - HAND_L[0], HAND_L[1] - SHOULDER_Y))
const SPREAD_R = deg(Math.atan2(HAND_R[0] - SHOULDER_R, HAND_R[1] - SHOULDER_Y))
/** あたま の まんなか */
const HEAD: readonly [number, number] = [52, 27]
const NECK: readonly [number, number] = [53, 42]

type Mood = 'lonely' | 'surprised' | 'happy'

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="80" cy="14" rx="6" ry="2.8" />
        <ellipse cx="84.5" cy="12.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 78, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {/* 小さな 花(赤ちゃんの よこ) */}
      {[[20, 95], [89, 95.5]].map(([x, y]) => (
        <g key={x}>
          <path d={`M${x} ${y} v-5`} stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 1.7} cy={y - 6 + Math.sin((a * Math.PI) / 180) * 1.7} r="1.3" fill="#ffffff" />
          ))}
          <circle cx={x} cy={y - 6} r="1.1" fill={SUN} />
        </g>
      ))}
    </>
  )
}

/** うで の かっこう。swing = ま下から よこへ ひらいた角度 / bend = ひじ の まがり */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。side: 左 -1 / 右 1 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const rad = (d: number) => (d * Math.PI) / 180
  const shoulderX = side === -1 ? SHOULDER_L : SHOULDER_R
  const dir = (angle: number) => [side * Math.sin(rad(angle)), Math.cos(rad(angle))] as const
  const [ux, uy] = dir(pose.swing)
  const elbow = [shoulderX + ux * ARM_PART, SHOULDER_Y + uy * ARM_PART] as const
  const [fx, fy] = dir(pose.swing - pose.bend)
  const hand = [elbow[0] + fx * ARM_PART, elbow[1] + fy * ARM_PART] as const
  return (
    <>
      {/* 上うで は そで、ひじ から先は はだ */}
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.6" strokeLinecap="round" />
      <path d={`M${shoulderX} ${SHOULDER_Y} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="6.4" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

type FaceProps = { readonly mood: Mood; readonly lookX: number; readonly lookY: number }

function Face({ mood, lookX, lookY }: FaceProps) {
  const ox = lookX * 1.1
  const oy = lookY * 0.9
  return (
    <>
      <circle cx="43.4" cy="32" r="2.3" fill={CHEEK} opacity="0.55" />
      <circle cx="61.4" cy="32" r="2.3" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          {/* にっこり: 目は ^ ^、口は 大きく あく */}
          <path d="M44.3 28.4 Q47 25 49.7 28.4" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M54.3 28.4 Q57 25 59.7 28.4" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M47.6 32.6 Q52 32 56.4 32.6 Q55.6 38.2 52 38.2 Q48.4 38.2 47.6 32.6 Z" fill={MOUTH} />
          <path d="M49.6 36.4 Q52 34.8 54.4 36.4 Q53.4 38 52 38 Q50.6 38 49.6 36.4 Z" fill="#ff8a8a" />
        </>
      ) : (
        <>
          <circle cx={47 + ox} cy={28 + oy} r={mood === 'surprised' ? 2.6 : 1.6} fill={mood === 'surprised' ? '#ffffff' : EYE} stroke={mood === 'surprised' ? EYE : 'none'} strokeWidth="0.6" />
          <circle cx={57 + ox} cy={28 + oy} r={mood === 'surprised' ? 2.6 : 1.6} fill={mood === 'surprised' ? '#ffffff' : EYE} stroke={mood === 'surprised' ? EYE : 'none'} strokeWidth="0.6" />
          {mood === 'surprised' && (
            <>
              <circle cx={47.3 + ox * 1.2} cy={28.2 + oy * 1.2} r="1.2" fill={EYE} />
              <circle cx={57.3 + ox * 1.2} cy={28.2 + oy * 1.2} r="1.2" fill={EYE} />
              <ellipse cx="52" cy="35.6" rx="1.5" ry="1.9" fill={MOUTH} />
            </>
          )}
          {mood === 'lonely' && (
            <>
              {/* まゆ が さがって、口は への字 */}
              <path d="M44 24.4 l5 -1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d="M55 23.4 l5 1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
              <path d="M49.6 36 Q52 34 54.4 36" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
        </>
      )}
    </>
  )
}

type BabyProps = {
  readonly mood: Mood
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  readonly lookX: number
  readonly lookY: number
}

function Baby({ mood, leftArm, rightArm, headTilt, lookX, lookY }: BabyProps) {
  return (
    <>
      {/* あし: みじかくて ふっくら */}
      <rect x="47.8" y="70" width="5.6" height="21" rx="2.8" fill={PANTS_DARK} />
      <rect x="54.6" y="70" width="5.6" height="21" rx="2.8" fill={PANTS} />
      <ellipse cx="49.6" cy="92.6" rx="4.6" ry="2.4" fill={SHOE} />
      <ellipse cx="58.4" cy="92.6" rx="4.6" ry="2.4" fill={SHOE} />
      {/* どう */}
      <rect x="46.2" y="42" width="15.6" height="32" rx="7.6" fill={TUNIC} />
      <path d="M48.4 66 h11.2" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <Arm side={-1} pose={leftArm} />
      <Arm side={1} pose={rightArm} />
      {/* あたま: 体にくらべて 大きい。くび は みじかく、あたま の下に かくれる */}
      <Layer rotate={headTilt} origin={NECK}>
        <circle cx="37.6" cy="29" r="2.8" fill={SKIN_SHADE} />
        <circle cx="66.4" cy="29" r="2.8" fill={SKIN_SHADE} />
        <circle cx={HEAD[0]} cy={HEAD[1]} r="14.5" fill={SKIN} />
        <path d="M38.8 21.6 C37.6 11.6 66.4 11.6 65.2 21.6 C62.6 17.4 57.6 19 53 16.6 C48.6 19.2 42.4 17.2 38.8 21.6 Z" fill={HAIR} />
        <path d="M50 14 Q51.4 8.4 54 11.6 Q56.6 8.6 56 14" fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} lookX={lookX} lookY={lookY} />
      </Layer>
    </>
  )
}

/** ちょうちょ の いる場所(秒 → x, y)。右から とんできて、あたまの まわりを まわり、左上へ とんでいく */
function butterflyAt(t: number): readonly [number, number] {
  if (t < NOTICE + 0.6) {
    const p = span(t, FLY_IN, NOTICE + 0.6, easeOut)
    return [mix(t, FLY_IN, NOTICE + 0.6, 118, 82, easeOut), mix(t, FLY_IN, NOTICE + 0.6, 8, 24, easeOut) + Math.sin(p * 11) * 3]
  }
  if (t < LEAVE) {
    // あたま の まわりを 右から 左へ、上を とおって ひとまわり
    const a = span(t, NOTICE + 0.6, LEAVE, easeInOut) * Math.PI
    return [53 + 29 * Math.cos(a), 24 - 19 * Math.sin(a) + Math.sin(a * 5) * 1.6]
  }
  const p = span(t, LEAVE, LEAVE + 1.1, easeIn)
  return [24 - 30 * p, 24 - 30 * p + Math.sin(p * 9) * 2]
}

function Butterfly({ t }: SceneProps) {
  if (t < FLY_IN || t > LEAVE + 1.1) return null
  const [x, y] = butterflyAt(t)
  // はねの ひらき(はばたき)。ひらくと よこに ひろがり、とじると ほそくなる
  const flap = 0.3 + 0.7 * Math.abs(wave(t, 0.3))
  return (
    <Layer x={x} y={y} opacity={span(t, FLY_IN, FLY_IN + 0.2)}>
      <Layer scaleX={flap}>
        <path d="M0 -0.6 C-3 -6.6 -8.4 -5.6 -7.4 -1.2 C-6.8 1.4 -3 1 0 0 Z" fill={WING} />
        <path d="M0 0.2 C-3.4 1 -6.4 3 -5 5.4 C-3.4 7 -0.8 4 0 1.4 Z" fill={WING_DARK} />
        <circle cx="-4.4" cy="-2.6" r="1.1" fill={WING_LIGHT} />
      </Layer>
      <Layer scaleX={-flap}>
        <path d="M0 -0.6 C-3 -6.6 -8.4 -5.6 -7.4 -1.2 C-6.8 1.4 -3 1 0 0 Z" fill={WING} />
        <path d="M0 0.2 C-3.4 1 -6.4 3 -5 5.4 C-3.4 7 -0.8 4 0 1.4 Z" fill={WING_DARK} />
        <circle cx="-4.4" cy="-2.6" r="1.1" fill={WING_LIGHT} />
      </Layer>
      <ellipse cx="0" cy="0.8" rx="0.9" ry="3.2" fill="#5a3b2a" />
      <path d="M-0.3 -2.2 q-1.2 -2 -2.4 -2.4 M0.3 -2.2 q1.2 -2 2.4 -2.4" fill="none" stroke="#5a3b2a" strokeWidth="0.5" strokeLinecap="round" />
    </Layer>
  )
}

/** 見つけた しゅんかんの「あっ」。あたまの上に 3本の しるし */
function Surprise({ t }: SceneProps) {
  const show = during(t, NOTICE, JOY + 0.1, 0.12)
  if (show <= 0) return null
  const pop = span(t, NOTICE, NOTICE + 0.25, backOut)
  return (
    <g opacity={show} stroke="#e8534a" strokeWidth="1.4" strokeLinecap="round">
      {[-90, -58, -122].map((a) => {
        const r = (a * Math.PI) / 180
        const r1 = 18.5
        const r2 = 18.5 + 4 * pop
        return <line key={a} x1={HEAD[0] + Math.cos(r) * r1} y1={HEAD[1] + Math.sin(r) * r1} x2={HEAD[0] + Math.cos(r) * r2} y2={HEAD[1] + Math.sin(r) * r2} />
      })}
    </g>
  )
}

/** しょんぼりの「はあ」。口の まえに ためいき */
function Sigh({ t }: SceneProps) {
  const show = during(t, 1.1, 2.7, 0.3)
  if (show <= 0) return null
  const p = ((t - 1.1) % 1.6) / 1.6
  return (
    <g opacity={show * (1 - p)}>
      <ellipse cx={42 - p * 6} cy={40 + p * 3} rx={2 + p * 2} ry={1.4 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
    </g>
  )
}

function Heart({ cx, cy, size }: { readonly cx: number; readonly cy: number; readonly size: number }) {
  return <path d="M0 1.8 C-3.4 -0.6 -2.4 -3.6 0 -2 C2.4 -3.6 3.4 -0.6 0 1.8 Z" fill="#f07f9e" transform={`translate(${cx} ${cy}) scale(${size})`} />
}

/** うれしい あいだ、あたまの よこに ハートが ふわっと のぼる */
function Hearts({ t }: SceneProps) {
  const show = during(t, JOY + 0.2, INK + 0.2, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.9].map((offset, i) => {
        const p = ((t - JOY + offset) % 1.8) / 1.8
        return <Heart key={offset} cx={(i === 0 ? 27 : 78) + Math.sin(p * 6) * 1.5} cy={34 - p * 14} size={1.1 + (1 - p) * 0.4} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)

  const appear = span(t, 0.3, 0.9, backOut)
  const mood: Mood = t < NOTICE ? 'lonely' : t < JOY ? 'surprised' : 'happy'

  // 目線: ずっと 下を見て しょんぼり → ちょうちょ を 目で おいかける → まっすぐ まえ
  const [bx, by] = butterflyAt(t)
  const chasing = t >= FLY_IN + 0.5 && t < LEAVE + 0.4
  const lookX = chasing ? Math.max(-1, Math.min(1, (bx - HEAD[0]) / 30)) : 0
  const lookY = t < FLY_IN + 0.5 ? 0.9 : chasing ? Math.max(-1, Math.min(1, (by - HEAD[1]) / 20)) : 0
  const headTilt = t < FLY_IN ? -3 + wave(t, 2) * 0.8 : (chasing ? lookX * 4 : 0) * (1 - span(t, LEAVE, LEAVE + 0.4))

  // うで: しょんぼりの間は だらんと下げて、うれしくなると かた を じく に よこへ ぱっと あげる
  const raise = span(t, JOY, SPREAD_END, backOut)
  const hang: ArmPose = { swing: 16 + wave(t, 2) * 1.2, bend: 8 }
  const leftArm: ArmPose = { swing: hang.swing + (SPREAD_L - hang.swing) * raise, bend: hang.bend * (1 - raise) }
  const rightArm: ArmPose = { swing: hang.swing + (SPREAD_R - hang.swing) * raise, bend: hang.bend * (1 - raise) }

  // うれしくて ぴょんぴょん(手を ひろげきった あとは、ぴたっと 止まる)
  const jump = t >= JOY && t < SPREAD_END + 0.3 ? Math.abs(Math.sin((t - JOY) * Math.PI * 2.2)) * 1.8 * (1 - span(t, JOY + 1, SPREAD_END + 0.3)) : 0
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={appear}>
          <ellipse cx="54" cy="97.4" rx={11 - jump * 0.8} ry="2.4" fill="#000000" opacity="0.12" />
          <Layer y={-jump} scale={0.6 + 0.4 * appear} origin={[54, 94]}>
            <Baby mood={mood} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} lookX={lookX} lookY={lookY} />
          </Layer>
        </Layer>
        <Sigh t={t} />
        <Surprise t={t} />
        <Hearts t={t} />
        <Butterfly t={t} />
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
    { at: 0, label: '赤ちゃんが ぽん と あらわれる', sound: 'pop' },
    { at: 1.1, label: 'ひとりで しょんぼり' },
    { at: FLY_IN, label: 'ちょうちょ が とんでくる' },
    { at: NOTICE, label: '見つけて「あっ」', sound: 'pop' },
    { at: JOY, label: 'うれしくて りょうてを ぱっと ひろげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '子 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
