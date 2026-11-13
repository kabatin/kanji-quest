/*
 * 心(こころ): しんぞうの 形。むねで どきどき うごく。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 子どもの むねの よこで ひびく「どきどき」の しるし(左)
 *   2画目(乚)  … しんぞうの まるい そこ(下の ふくらみ)と、右がわの ひだり あがり
 *   3画目(丶)  … しんぞうの 上で はずむ「どき」の しるし
 *   4画目(丶)  … しんぞうの 右上で はずむ「どき」の しるし
 *   (しるし は、どっくん と うつときだけ ぱっと 出る)
 *
 * ながれ
 *   子どもが 走ってくる → とまって はあはあ(つかれた)
 *   → むねに 手を あてて「あれ? どきどき してる!」(おどろく)
 *   → むねの 中が ぽんと ひろがって、しんぞうが どくん どくん と うごくのが 見える
 *   → 子どもが わかって にっこり → しんぞうの 形が 字「心」に そろって、字になる
 *
 * 人と しんぞうは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の まんなか の上。
 *   しんぞうは、まるい ふくらみと 上に のびる 太い くだ(だいどうみゃく)。
 *   しるし は 体の ものでは なく、まんが の「どきどき」の線。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '心'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2a13a'
const TUNIC_DARK = '#d9852a'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const HEART = '#e8534a'
const HEART_DARK = '#c93d44'
const HEART_LIGHT = '#ff8a86'
const BUBBLE_OUT = '#ffd6d6'
const BUBBLE_IN = '#fff1ee'
const THROB = '#ff6f7a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const RUN = 0.3
const STOP = 2.6
/** むねに 手を あてる */
const HAND = 3.4
/** むねの 中が ひろがる */
const ZOOM = 4.6
const INK = 7.0
const DONE = 9.6
const DURATION = 10.2
/** しんぞうが うつ 間かく(秒) */
const BEAT = 0.85

/** 子どもの まんなか(x)・あしもと(y) */
const CX = 26
const FEET_Y = 94
/** かた の高さ と ひだり・みぎ の かた */
const SHOULDER_Y = 48
const SHOULDER_L: readonly [number, number] = [21, SHOULDER_Y]
const SHOULDER_R: readonly [number, number] = [31, SHOULDER_Y]
/** うで の 長さ(かた→ひじ、ひじ→手) */
const ARM_PART = 9
/** しんぞうの まんなか(うつとき ふくらむ じく) */
const HEART_CENTER: readonly [number, number] = [58, 64]

/** どくん の波(0〜1)。「ど」と「くん」の 2回。start から BEAT 秒ごと。 */
function thump(t: number, start: number): number {
  if (t < start) return 0
  const ph = ((t - start) % BEAT) / BEAT
  const bump = (a: number, b: number) => (ph > a && ph < b ? Math.sin(((ph - a) / (b - a)) * Math.PI) : 0)
  return bump(0, 0.18) + 0.6 * bump(0.26, 0.42)
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
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="62" cy="12" rx="7" ry="3.2" />
        <ellipse cx="67" cy="10.4" rx="5" ry="3.2" />
        <ellipse cx="98" cy="20" rx="6" ry="2.6" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

type Mood = 'effort' | 'puff' | 'surprise' | 'happy'

/** うで の かっこう。swing = ま下から そとへ ひらいた角度 / bend = ひじ の まがり(ま下から みて、そとへ ふやす) */
type ArmPose = { readonly swing: number; readonly bend: number }

/** かた から出て、ひじ で まがる うで。side は そとむき(ひだり = -1、みぎ = +1) */
function Arm({ shoulder, side, pose, color }: { readonly shoulder: readonly [number, number]; readonly side: -1 | 1; readonly pose: ArmPose; readonly color: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow = [shoulder[0] + side * Math.sin(rad(pose.swing)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * ARM_PART] as const
  const fore = pose.swing + pose.bend
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * ARM_PART, elbow[1] + Math.cos(rad(fore)) * ARM_PART] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.7" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="21.6" cy="39.4" r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx="30.4" cy="39.4" r="1.7" fill={CHEEK} opacity="0.55" />
      {mood === 'happy' ? (
        <>
          <path d="M21.4 36.4 Q23.2 34.4 25 36.4 M27 36.4 Q28.8 34.4 30.6 36.4" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M23.2 39.6 Q26 43 28.8 39.6 Z" fill={MOUTH} />
        </>
      ) : mood === 'surprise' ? (
        <>
          <circle cx="23.4" cy="36" r="1.9" fill="#ffffff" />
          <circle cx="28.6" cy="36" r="1.9" fill="#ffffff" />
          <circle cx="23.5" cy="36.2" r="1.05" fill={EYE} />
          <circle cx="28.5" cy="36.2" r="1.05" fill={EYE} />
          <path d="M21.6 32.6 Q23.4 31.4 25 32.4 M27 32.4 Q28.6 31.4 30.4 32.6" fill="none" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="26" cy="41" rx="1.2" ry="1.5" fill={MOUTH} />
        </>
      ) : (
        <>
          {/* がんばって 走る・つかれた: まゆ が ハの字、口は あいている */}
          <circle cx="23.4" cy="36.2" r="1.1" fill={EYE} />
          <circle cx="28.6" cy="36.2" r="1.1" fill={EYE} />
          <path d="M21.6 33.2 l3.2 1 M30.4 33.2 l-3.2 1" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <ellipse cx="26" cy="41" rx={mood === 'puff' ? 1.9 : 1.5} ry={mood === 'puff' ? 1.7 : 1.2} fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  /** 走る あしの ふり(-1〜1) */
  readonly step: number
  readonly mood: Mood
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  /** むねの どくん(0〜1) */
  readonly chest: number
  /** ひざ の はずみ(はあはあ のとき 体が 少し ゆれる) */
  readonly heave: number
}

/** 正面を むいた 子ども。あたま・くび・どう・うで・あし が ちゃんと つながる。 */
function Child({ step, mood, leftArm, rightArm, chest, heave }: ChildProps) {
  const liftL = Math.max(0, step) * 4
  const liftR = Math.max(0, -step) * 4
  return (
    <Layer y={heave} origin={[CX, FEET_Y]}>
      {/* あし: こし から ふる。はしるとき ひざ を あげる */}
      <Layer y={-liftL} rotate={step * 10} origin={[CX - 2.4, 70]}>
        <rect x={CX - 4.6} y="68" width="4.4" height="25" rx="2.2" fill={PANTS_DARK} />
        <ellipse cx={CX - 2.8} cy="94" rx="4.4" ry="2.4" fill={SHOE} />
      </Layer>
      <Layer y={-liftR} rotate={-step * 10} origin={[CX + 2.4, 70]}>
        <rect x={CX + 0.2} y="68" width="4.4" height="25" rx="2.2" fill={PANTS} />
        <ellipse cx={CX + 2.8} cy="94" rx="4.4" ry="2.4" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x={CX - 1.9} y="42" width="3.8" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう: どくん と うつと むねが 少し ふくらむ */}
      <Layer scale={1 + chest * 0.05} origin={[CX, 60]}>
        <rect x={CX - 6.4} y="45" width="12.8" height="26" rx="6" fill={TUNIC} />
        <path d={`M${CX - 4} 64 h8`} stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={SHOULDER_L} side={-1} pose={leftArm} color={TUNIC_DARK} />
      <Arm shoulder={SHOULDER_R} side={1} pose={rightArm} color={TUNIC_DARK} />
      {/* あたま: 子どもは あたまが 大きい */}
      <Layer y={2} scale={1.3} origin={[CX, 36]}>
      <circle cx={CX} cy="36" r="7.6" fill={SKIN} />
      <path d={`M${CX - 7.8} 34.4 C${CX - 8.4} 26.6 ${CX - 1} 25.8 ${CX + 3} 27.2 C${CX + 6.6} 27.6 ${CX + 8.8} 30.4 ${CX + 7.8} 34.4 C${CX + 4} 31.6 ${CX - 3} 31.6 ${CX - 7.8} 34.4 Z`} fill={HAIR} />
      <Face mood={mood} />
      </Layer>
    </Layer>
  )
}

/** はしっている間の あせ。うしろ(左)へ とぶ。 */
function Sweat({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, RUN + 0.5, STOP, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill="#7cc4f2" transform={`translate(${x - 4 - p * 6} ${32 + p * 8}) rotate(-30)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** とまって「はあはあ」。口から ふわっと 白い いき。 */
function Pant({ t }: SceneProps) {
  const show = during(t, STOP + 0.1, HAND + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.5].map((offset) => {
        const p = ((t - STOP + offset) % 1) / 1
        return <ellipse key={offset} cx={33 + p * 7} cy={42 - p * 3} rx={1.8 + p * 2.4} ry={1.3 + p * 1.6} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" opacity={1 - p * 0.8} />
      })}
    </g>
  )
}

/** むねの中の ようす: まるい ふきだし の中で、しんぞう が どくん どくん と うつ。 */
function InsideChest({ t }: SceneProps) {
  const grow = span(t, ZOOM, ZOOM + 0.8, backOut)
  if (grow <= 0) return null
  const beat = thump(t, ZOOM + 0.5) * (1 - span(t, INK - 0.5, INK - 0.2))
  const s = Math.max(0, grow) * (1 + beat * 0.08)
  return (
    <>
      <Layer scale={Math.max(0, grow)} origin={[36, 62]}>
        <circle cx="60" cy="62" r="36" fill={BUBBLE_OUT} />
        <circle cx="60" cy="62" r="33" fill={BUBBLE_IN} />
      </Layer>
      <Layer scale={s} origin={HEART_CENTER}>
        {/* だいどうみゃく: 上に のびる 太い くだ */}
        <path d="M56 52 L56 41.6 Q56 37.4 60.2 37.4 Q64.4 37.4 64.4 41.6 L64.4 52 Z" fill={HEART_DARK} />
        {/* しんぞう の ほんたい: そこ は まるく ふくらみ、上は ふたこぶ */}
        <path d="M31.25 49.25 c9 22.75 27 35.5 53.25 32.25 c7.75 -0.96 7.25 -4.75 3 -9.5 C93 62 91 44 78 42 C70 41 63 45 60 50 C57 44 50 40 42 41 C34 42 29 46 31.25 49.25 Z" fill={HEART} />
        <path d="M36 49 C37 45.5 42 44.5 46 47" fill="none" stroke={HEART_LIGHT} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M70 48 C74 45.5 79 46 81 49" fill="none" stroke={HEART_LIGHT} strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      </Layer>
    </>
  )
}

/** どきどき の しるし。字の 1・3・4画目の線 を そのまま つかう(どくん と うつ ときだけ 出る)。 */
function Throb({ t }: SceneProps) {
  const after = thump(t, HAND + 0.3) * (1 - span(t, INK - 0.5, INK - 0.2))
  const around = thump(t, ZOOM + 0.5) * (1 - span(t, INK - 0.5, INK - 0.2))
  const left = Math.min(1, after * 1.3) * during(t, HAND + 0.3, INK, 0.2)
  const near = Math.min(1, around * 1.3)
  return (
    <>
      {left > 0 && <Bone char={CHAR} n={1} color={THROB} width={2.2} opacity={left} />}
      {near > 0 && (
        <>
          <Bone char={CHAR} n={3} color={THROB} width={2.4} opacity={near} />
          <Bone char={CHAR} n={4} color={THROB} width={2.4} opacity={near} />
        </>
      )}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // 走る: 左から やってきて、だんだん ゆっくり なって とまる
  const running = 1 - span(t, STOP - 0.35, STOP)
  const stride = t < RUN ? 0 : Math.sin((t - RUN) * Math.PI * 2 * 2.4) * running
  const runX = mix(t, RUN, STOP, -52, 0, easeOut)
  const bob = -Math.abs(stride) * 1.4
  // とまってから: はあはあ で 体が 上下に ゆれる
  const heave = t >= STOP && t < HAND + 0.2 ? Math.abs(wave(t - STOP, 0.5)) * 0.9 : 0

  // 手を むねに あてる(みぎ の うで が ひじ で まがって、手が むねの まんなか へ)
  const hand = span(t, HAND, HAND + 0.5, easeInOut)
  const rest = span(t, STOP - 0.3, STOP)
  const swingBase = 6 + 6 * (1 - rest)
  const leftArm: ArmPose = { swing: swingBase + stride * 14, bend: -26 + rest * 18 }
  const freeRight: ArmPose = { swing: swingBase - stride * 14, bend: -26 + rest * 18 }
  const rightArm: ArmPose = { swing: freeRight.swing + (18 - freeRight.swing) * hand, bend: freeRight.bend + (-108 - freeRight.bend) * hand }

  const mood: Mood = t < STOP ? 'effort' : t < HAND ? 'puff' : t < ZOOM + 0.9 ? 'surprise' : 'happy'
  const chest = thump(t, HAND + 0.3) * (1 - span(t, INK - 0.5, INK - 0.2))
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <InsideChest t={t} />
        <ellipse cx={CX + runX} cy="97.4" rx="9" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer x={runX} y={bob}>
          <Child step={stride} mood={mood} leftArm={leftArm} rightArm={rightArm} chest={chest} heave={heave} />
          <Sweat t={t} x={CX} />
        </Layer>
        <Pant t={t} />
        <Throb t={t} />
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
    { at: 0, label: '子どもが 走ってくる', sound: 'pop' },
    { at: STOP, label: 'とまって はあはあ' },
    { at: HAND, label: 'むねに 手を あてて「どきどき?」', sound: 'pop' },
    { at: ZOOM, label: 'むねの中で しんぞうが どくん どくん', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '心 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
