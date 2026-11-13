/*
 * 竹(たけ): 竹の はが たれて、かぜで ゆれる。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)  … 左の 竹の てっぺんから ぶらさがる、ほそながい 竹の は
 *   2画目(一)  … 左の 竹の ふしから でた よこえだ
 *   3画目(丨)  … 左の 竹の くき
 *   4画目(ノ)  … 右の 竹の てっぺんから ぶらさがる、ほそながい 竹の は
 *   5画目(一)  … 右の 竹の ふしから でた よこえだ
 *   6画目(亅)  … 右の 竹の くき(ねもとは すこし まがって 地面に はいる)
 *
 * ながれ
 *   竹が のびて、てっぺんが おじぎをして は が たれ下がる
 *   → あつくて ぐったりした パンダが 竹の あいだに ちょこんと すわる(あせが ぽたり。は は しずか)
 *   → かぜが ふいてくる! は が ゆらゆら ゆれて、パンダは すずしくて うっとり
 *   → 目をあけて にっこり。うれしくて 手を あげる
 *   → かぜが やんで、は が すっと 下に たれた しゅんかん、ほね が ひかって、絵が うすくなり 字「竹」が のこる
 *
 * 竹・パンダは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   竹は くき が まっすぐで、ふし が ある。は は えだの さきから ぶらさがる。
 *   パンダは あたまが まるくて 耳が 上に つく。うで は かた から出て ひじ で まがる。くび は みじかい。
 *   は が ゆれるのは かぜの せい。かぜの すじ を見せて、わけ を わかるようにする。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '竹'

const STALK = '#6dbb6a'
const STALK_DARK = '#4f9d55'
const STALK_LIGHT = '#a6dc8a'
const STEM = '#5ea85c'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const WIND_LINE = '#9fd3ee'
const BLACK = '#33333c'
const FUR = '#fbfbf7'
const FUR_SHADE = '#e6e6df'
const PAD = '#6b6b78'
const CHEEK = '#ff9d9d'
const MOUTH = '#c4504a'

/** くぎり の時間(秒) */
const PANDA_IN = 0.9
/** かぜが ふきはじめる */
const WIND = 3.0
/** かぜで うっとり(目を とじる) */
const COOL = 3.3
/** 目をあけて にっこり。手を あげる */
const JOY = 4.5
const INK = 6.5
const DONE = 9.1
const DURATION = 9.8

/** パンダの すわる 場所(まんなか の x と、地面の y) */
const PX = 55
const GROUND = 97

type Pt = readonly [number, number]

/** 1画目・4画目の 通り道(は の しんの線)。はじまりが えだの さき、おわりが は の さき */
const LEAF1_PTS: readonly Pt[] = [[30.2, 16.4], [29.5, 21.9], [27.8, 27.2], [25.8, 32.3], [23.6, 37.4], [21, 42.3], [18, 47], [14.6, 51.4]]
const LEAF4_PTS: readonly Pt[] = [[68.7, 11.7], [68, 17.6], [66, 23.3], [63.6, 28.8], [60.9, 34.2], [57.9, 39.4], [54.6, 44.5], [51.1, 49.4]]

/**
 * 通り道の点から、両はしが とがった 細長い は の形を作る。
 * shift で、はば の中心を 少し 左(あかるい側)へ ずらせる(ハイライト用)。
 */
function bladePath(points: readonly Pt[], maxWidth: number, shift = 0): string {
  const edge = (side: 1 | -1) =>
    points.map((p, i) => {
      const a = points[Math.max(i - 1, 0)]
      const b = points[Math.min(i + 1, points.length - 1)]
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      // 進む向きの よこ(左むき)
      const nx = -(b[1] - a[1]) / length
      const ny = (b[0] - a[0]) / length
      const width = maxWidth * Math.sin(Math.PI * (i / (points.length - 1)) ** 0.8)
      const offset = shift * width + (side * width) / 2
      return `${(p[0] + nx * offset).toFixed(2)} ${(p[1] + ny * offset).toFixed(2)}`
    })
  const left = edge(1)
  const right = edge(-1).reverse()
  return `M${left.join(' L')} L${right.join(' L')} Z`
}

const LEAF1_OUTER = bladePath(LEAF1_PTS, 5.6)
const LEAF1_INNER = bladePath(LEAF1_PTS, 2.8, 0.35)
const LEAF4_OUTER = bladePath(LEAF4_PTS, 5.6)
const LEAF4_INNER = bladePath(LEAF4_PTS, 2.8, 0.35)

type PlantSpec = {
  /** くき・よこえだ の画番号 */
  readonly stalkN: number
  readonly branchN: number
  /** くき の x と、ふし の y */
  readonly stalkX: number
  readonly nodes: readonly number[]
  /** くき の ハイライト線(x, 上, 下) */
  readonly shine: readonly [number, number, number]
  /** てっぺんの えだ(くき の上から おじぎ して、は を ぶらさげる)。つけねと 通り道 */
  readonly twigBase: Pt
  readonly twigD: string
  /** は を ぶらさげる えだの さき */
  readonly pivot: Pt
  readonly leafOuter: string
  readonly leafInner: string
  /** のびはじめ の おくれ(秒) と、ゆれの ずれ */
  readonly delay: number
  readonly phase: number
}

const LEFT_PLANT: PlantSpec = {
  stalkN: 3,
  branchN: 2,
  stalkX: 36.7,
  nodes: [60, 74, 88],
  shine: [35.1, 54, 91],
  twigBase: [36, 45],
  twigD: 'M36 45 Q40 26 30.2 16.4',
  pivot: [30.2, 16.4],
  leafOuter: LEAF1_OUTER,
  leafInner: LEAF1_INNER,
  delay: 0,
  phase: 0,
}

const RIGHT_PLANT: PlantSpec = {
  stalkN: 6,
  branchN: 5,
  stalkX: 78.8,
  nodes: [56, 70, 84],
  shine: [77.2, 48, 88],
  twigBase: [77.6, 38],
  twigD: 'M77.6 38 Q83 20 68.7 11.7',
  pivot: [68.7, 11.7],
  leafOuter: LEAF4_OUTER,
  leafInner: LEAF4_INNER,
  delay: 0.15,
  phase: 0.45,
}

/** かぜの つよさ(0〜1)。ふきはじめて、すこしして やむ */
const windAmount = (t: number): number => span(t, WIND, WIND + 0.7, easeOut) * (1 - span(t, 5.3, 6.2, easeInOut))

/** かぜの ない間の、ほんの すこしの ゆれ(は は ぶらさがって じっとしている) */
const idleAmount = (t: number): number => 1 - span(t, WIND - 0.2, WIND + 0.4)

/** は・えだ の かたむき(角度)。かぜで みぎへ ふかれ、ゆらゆら もどる。やむと 0(まっすぐ 下に たれる) */
function swayAngle(t: number, phase: number): number {
  return windAmount(t) * (-8 + 11 * wave(t, 1.1, phase)) + idleAmount(t) * 0.6 * wave(t, 2.6, phase)
}

function Plant({ t, spec }: { readonly t: number; readonly spec: PlantSpec }) {
  const { stalkN, branchN, stalkX, nodes, shine, twigBase, twigD, pivot, leafOuter, leafInner, delay, phase } = spec
  // くき が下から のびて、よこえだ・てっぺんの えだ・は の じゅんに ひろがる
  const grow = span(t, delay, delay + 0.8, backOut)
  const branch = span(t, delay + 0.6, delay + 1.0, backOut)
  const twig = span(t, delay + 0.8, delay + 1.3, easeOut)
  const leaf = span(t, delay + 1.1, delay + 1.7, backOut)
  const sway = swayAngle(t, phase)
  const [shineX, shineTop, shineBottom] = shine
  return (
    <>
      <Layer scaleX={0.7 + 0.3 * Math.min(grow, 1)} scaleY={grow} origin={[stalkX, 96]}>
        <Bone char={CHAR} n={stalkN} color={STALK} width={7.4} />
        <path d={`M${shineX} ${shineTop} V${shineBottom}`} stroke={STALK_LIGHT} strokeWidth="1.3" strokeLinecap="round" />
        {/* ふし: くき が すこし ふくらむ */}
        {nodes.map((y) => (
          <rect key={y} x={stalkX - 4.3} y={y} width="8.6" height="2.2" rx="1.1" fill={STALK_DARK} />
        ))}
      </Layer>
      <Layer scale={branch} origin={[stalkX, 43]}>
        <Bone char={CHAR} n={branchN} color={STEM} width={3.2} />
      </Layer>
      {/* てっぺん: くき の つづきが おじぎ して、さきから は が ぶらさがる */}
      <Layer scale={twig} rotate={sway * 0.35} origin={twigBase}>
        <path d={twigD} fill="none" stroke={STEM} strokeWidth="2.2" strokeLinecap="round" />
        <Layer scale={leaf} rotate={sway * 0.9} origin={pivot}>
          <path d={leafOuter} fill={LEAF_DARK} stroke={LEAF_DARK} strokeWidth="0.6" strokeLinejoin="round" />
          <path d={leafInner} fill={LEAF} />
        </Layer>
      </Layer>
    </>
  )
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // あつい間は お日さまが ぎらぎら(すこし ふくらむ)
  const hot = (1 - span(t, WIND, WIND + 0.8)) * span(t, PANDA_IN, PANDA_IN + 0.5)
  const drift = t * 1.6 + span(t, WIND, 6.0) * 10
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="0.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 12)`} />
        ))}
      </Layer>
      <circle cx="96" cy="12" r={Math.max(0, (6.2 + hot * 0.7 * (1 + wave(t, 0.8)) * 0.5) * sun)} fill={SUN} />
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${drift} 0)`}>
        <ellipse cx="-4" cy="8" rx="7" ry="3.4" />
        <ellipse cx="1" cy="6" rx="5" ry="3.4" />
        <ellipse cx="92" cy="60" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="58.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
    </>
  )
}

/** 地面の くさ。くき の ねもとに かぶせる */
function Tufts() {
  return (
    <>
      {[8, 22, 46, 64, 90, 101].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

type Mood = 'hot' | 'cool' | 'happy'

/** うで の かっこう。out = ま下から よこへ ひらいた角度 / fore = ひじ から さきの 角度(同じ きまり) */
type ArmPose = { readonly out: number; readonly fore: number }

const ARM_PART = 9

/** かた から出て、ひじ で まがる うで。side は 左=-1 / 右=1。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const shoulder: Pt = [PX + side * 11, 78]
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow: Pt = [shoulder[0] + side * Math.sin(rad(pose.out)) * ARM_PART, shoulder[1] + Math.cos(rad(pose.out)) * ARM_PART]
  const hand: Pt = [elbow[0] + side * Math.sin(rad(pose.fore)) * ARM_PART, elbow[1] + Math.cos(rad(pose.fore)) * ARM_PART]
  return <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={BLACK} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
}

type PandaProps = {
  readonly mood: Mood
  readonly blink: boolean
  /** 目の むき(-1〜1) */
  readonly gaze: Pt
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
}

function Eye({ cx, mood, blink, gaze, tilt }: { readonly cx: number; readonly mood: Mood; readonly blink: boolean; readonly gaze: Pt; readonly tilt: number }) {
  const closed = mood === 'cool' || blink
  return (
    <>
      <ellipse cx={cx} cy="68" rx="3.7" ry="4.6" fill={BLACK} transform={`rotate(${tilt} ${cx} 68)`} />
      {closed ? (
        <path d={`M${cx - 1.9} 68.3 Q${cx} 66.2 ${cx + 1.9} 68.3`} fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={cx} cy="67.8" rx="1.6" ry={mood === 'hot' ? 1 : 1.6} fill="#ffffff" />
          <circle cx={cx + gaze[0] * 0.6} cy={67.8 + gaze[1] * 0.5} r={mood === 'hot' ? 0.75 : 0.95} fill={BLACK} />
        </>
      )}
    </>
  )
}

/** パンダ(正面で すわる)。あたま は まるく、耳は 上、くび は みじかく あたま の下。 */
function Panda({ mood, blink, gaze, leftArm, rightArm, headTilt }: PandaProps) {
  return (
    <>
      {/* 足: 前に なげだす(くろい あし と うらの ざらざら) */}
      <ellipse cx={PX - 8.5} cy="92.2" rx="7" ry="5" fill={BLACK} />
      <ellipse cx={PX + 8.5} cy="92.2" rx="7" ry="5" fill={BLACK} />
      <ellipse cx={PX - 8.5} cy="93.4" rx="3.2" ry="2.1" fill={PAD} />
      <ellipse cx={PX + 8.5} cy="93.4" rx="3.2" ry="2.1" fill={PAD} />
      {/* どう と、かた の くろい おび */}
      <ellipse cx={PX} cy="85" rx="14" ry="12.2" fill={FUR} />
      <path d={`M${PX - 11} 92 Q${PX} 99 ${PX + 11} 92 Q${PX} 96 ${PX - 11} 92 Z`} fill={FUR_SHADE} />
      <ellipse cx={PX} cy="78.5" rx="13.4" ry="4.4" fill={BLACK} />
      <Arm side={-1} pose={leftArm} />
      <Arm side={1} pose={rightArm} />
      {/* あたま: くび(みじかい)を じく に かたむく */}
      <Layer rotate={headTilt} origin={[PX, 79]}>
        <circle cx={PX - 9.6} cy="58.4" r="4.4" fill={BLACK} />
        <circle cx={PX + 9.6} cy="58.4" r="4.4" fill={BLACK} />
        <circle cx={PX} cy="68" r="12.4" fill={FUR} />
        <Eye cx={PX - 4.8} mood={mood} blink={blink} gaze={gaze} tilt={25} />
        <Eye cx={PX + 4.8} mood={mood} blink={blink} gaze={gaze} tilt={-25} />
        <circle cx={PX - 8.4} cy="73.2" r="2" fill={CHEEK} opacity="0.55" />
        <circle cx={PX + 8.4} cy="73.2" r="2" fill={CHEEK} opacity="0.55" />
        <ellipse cx={PX} cy="72.4" rx="2.1" ry="1.4" fill={BLACK} />
        {mood === 'hot' && <path d={`M${PX - 2.4} 76.6 Q${PX} 74.8 ${PX + 2.4} 76.6`} fill="none" stroke={BLACK} strokeWidth="1" strokeLinecap="round" />}
        {mood === 'cool' && <path d={`M${PX - 2.6} 74.8 Q${PX} 77.2 ${PX + 2.6} 74.8`} fill="none" stroke={BLACK} strokeWidth="1" strokeLinecap="round" />}
        {mood === 'happy' && (
          <>
            <path d={`M${PX - 2.8} 74.6 Q${PX} 80.2 ${PX + 2.8} 74.6 Z`} fill={MOUTH} stroke={BLACK} strokeWidth="0.7" strokeLinejoin="round" />
            <ellipse cx={PX} cy="77.6" rx="1.2" ry="0.8" fill="#ff8a8a" />
          </>
        )}
      </Layer>
    </>
  )
}

/** あつい間の あせ。こめかみ から よこへ とぶ。 */
function Sweat({ t, tilt }: { readonly t: number; readonly tilt: number }) {
  const show = during(t, PANDA_IN + 0.7, WIND + 0.2, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show} transform={`rotate(${tilt} ${PX} ${GROUND})`}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill="#7cc4f2" transform={`translate(${PX + 13.5 + p * 4} ${60 + p * 9}) rotate(-20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** かぜの すじ。左から 右へ ふきぬける(は が ゆれる わけ)。 */
function Wind({ t }: SceneProps) {
  const lines: readonly (readonly [number, number])[] = [[22, 0], [50, 0.4], [88, 0.8]]
  return (
    <>
      {lines.map(([y, late]) => {
        const p = span(t, WIND + late * 0.5, WIND + 2.2 + late * 0.5)
        const alpha = during(p, 0, 1, 0.25)
        if (alpha <= 0) return null
        return (
          <path key={y} d="M0 0 H16 Q21 0 21 -3.2 Q21 -6.2 17.6 -5.6 M3 4 H11" fill="none" stroke={WIND_LINE} strokeWidth="1.5" strokeLinecap="round" opacity={alpha * 0.9} transform={`translate(${-24 + p * 150} ${y + wave(t, 0.9, late) * 1.4})`} />
        )
      })}
    </>
  )
}

/** かぜに ふかれて とぶ 小さな は(にぎやかし) */
function BlownLeaf({ t, y, late }: { readonly t: number; readonly y: number; readonly late: number }) {
  const p = span(t, WIND + 0.2 + late, WIND + 2.6 + late)
  const alpha = during(p, 0, 1, 0.15)
  if (alpha <= 0) return null
  return <path d="M-3 0 Q0 -1.7 3 0 Q0 1.7 -3 0 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.4" opacity={alpha} transform={`translate(${-6 + p * 124} ${y + Math.sin(p * 11) * 4 + p * 6}) rotate(${p * 420})`} />
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const pandaIn = span(t, PANDA_IN, PANDA_IN + 0.5, backOut)
  const wind = windAmount(t)
  const cool = span(t, WIND, WIND + 0.6)
  const mood: Mood = t < COOL ? 'hot' : t < JOY ? 'cool' : 'happy'
  const blink = mood === 'happy' && t % 3.4 > 3.28
  // うれしくて 手を あげる(ばんざい)。かぜが やむ ころには おろす
  const raise = span(t, JOY, JOY + 0.6, backOut) * (1 - span(t, 5.7, 6.3, easeInOut))
  const joy = raise * wave(t, 0.5)
  // あつい間は ぐったり(うでを だらんと おろす)。かぜで すこし しゃんと する
  const limp = 1 - cool
  const restLeft: ArmPose = { out: mix(t, WIND, WIND + 0.6, 14, 10), fore: mix(t, WIND, WIND + 0.6, -20, -45) }
  const leftArm: ArmPose = { out: restLeft.out + (135 - restLeft.out) * raise + joy * 6, fore: restLeft.fore + (170 - restLeft.fore) * raise + joy * 6 }
  const rightArm: ArmPose = { out: restLeft.out + (135 - restLeft.out) * raise - joy * 6, fore: restLeft.fore + (170 - restLeft.fore) * raise - joy * 6 }
  // からだ と あたま: かぜに ゆれる。あつい間は あたまを すこし かたむける
  const bodyTilt = wind * wave(t, 1.6) * 3
  const headTilt = limp * 5 + wind * wave(t, 1.6, 0.3) * 5
  const bounce = -Math.abs(wave(t, 0.5)) * 1.2 * raise
  // 目: あつい間は 上の は を ながめる。かぜの間は ゆれる は を 目で おう
  const gaze: Pt = [wind * wave(t, 1.1) * 0.8, -0.7 * limp]

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Plant t={t} spec={LEFT_PLANT} />
        <Plant t={t} spec={RIGHT_PLANT} />
        <Tufts />
        {/* かぜ は パンダの うしろを ふく(かおに かぶらない) */}
        <Wind t={t} />
        <BlownLeaf t={t} y={66} late={0.2} />
        <BlownLeaf t={t} y={34} late={0.9} />
        <Layer opacity={pandaIn} scale={pandaIn} origin={[PX, GROUND]}>
          <ellipse cx={PX} cy="97.4" rx="17" ry="2.6" fill="#000000" opacity="0.12" />
          <Layer rotate={bodyTilt} y={bounce} origin={[PX, GROUND]}>
            <Panda mood={mood} blink={blink} gaze={gaze} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} />
          </Layer>
          <Sweat t={t} tilt={bodyTilt} />
        </Layer>
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
    { at: 0, label: '竹が のびて、てっぺんから は が たれ下がる', sound: 'pop' },
    { at: PANDA_IN, label: 'あつくて ぐったりの パンダが すわる', sound: 'pop' },
    { at: WIND, label: 'かぜが ふいて、は が ゆらゆら ゆれる' },
    { at: JOY, label: 'パンダは すずしくて にっこり、手を あげる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '竹 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
