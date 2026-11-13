/*
 * 首(くび): かみの毛の はえた 頭の形。あたまを ささえる ところ。
 *
 * ほね(画と絵の対応)
 *   1・2画目   … あたまの てっぺんに ぴょこんと たつ、2本の はねた かみの毛
 *   3画目(一)  … ふさふさに のびた かみの毛の、まえがみの 下はし
 *   4画目(ノ)  … おでこに たれた 1本の まえがみ
 *   5・6画目   … 顔から 体にかけての よこがお(ほっぺ → ふく)
 *   7〜9画目   … 口もと と、ふくの 2本の しま
 *
 * ながれ
 *   かみの毛が みじかくて、しょんぼりした 男の子
 *   → 日が くれて 夜になる。男の子は 立ったまま うとうと、あたまが こっくり(くび が あたまを ささえている)
 *   → ねている間に、かみの毛が ぐんぐん のびる
 *   → 朝。目をさまして さわってみると ふさふさ!(びっくり → にこにこ)
 *   → うれしくて あたまを こくん こくん → ほね が ひかり、絵が うすくなって 字「首」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   くび は みじかく、あたま と どう の間に ある。うで は かた から出て ひじ で まがる。
 *   あたまを うごかすのは くび。まえがみ・はねた毛は、かみの毛の 上から はえる。
 *   2頭身ぐらいの 子どもの かっこう(あたま が 大きい)にして、字の高さに 合わせた。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '首'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_DARK = '#46301f'
const HAIR_LIGHT = '#7d5a44'
const SHIRT = '#4f9be0'
const SHIRT_STRIPE = '#f4f9ff'
const SLEEVE = '#3c82c4'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const NIGHT = '#27346b'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const DUSK = 2.4
const GROW_FROM = 2.7
const GROW_TO = 4.4
const WAKE = 4.7
const TOUCH = 4.95
const HAPPY = 5.75
const NOD = 5.95
const INK = 6.9
const DONE = 9.9
const DURATION = 10.5

/** 男の子の まんなか(x)と、足もとの 地面(y) */
const CX = 55.5
const GROUND_Y = 98
/** くび の じく(あたま が うごく ところ) */
const NECK: readonly [number, number] = [CX, 68]
/** かた の場所(左・右)と、うで の ぶぶん の長さ */
const SHOULDER_L: readonly [number, number] = [40, 78]
const SHOULDER_R: readonly [number, number] = [71, 78]
const ARM_HANG = 9.5
const ARM_RAISED = 14.5

type Mood = 'glum' | 'asleep' | 'surprised' | 'happy'

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 18, 90, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** お日さま。ゆっくり まわる ひかりの すじ つき */
function Sun({ t, cx, cy, opacity }: { readonly t: number; readonly cx: number; readonly cy: number; readonly opacity: number }) {
  if (opacity <= 0) return null
  return (
    <Layer opacity={opacity}>
      <Layer rotate={t * 14} origin={[cx, cy]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={cx - 0.8} y={cy - 9} width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} ${cx} ${cy})`} />
        ))}
      </Layer>
      <circle cx={cx} cy={cy} r="5.4" fill={SUN} />
    </Layer>
  )
}

/** 左(あたまの 左がわ)の 空を ゆっくり ながれる 雲 */
function Cloud({ t }: { readonly t: number }) {
  return (
    <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
      <ellipse cx="82" cy="46" rx="7" ry="3.2" />
      <ellipse cx="87" cy="44.2" rx="5" ry="3.2" />
    </g>
  )
}

/** 夜の 空: 三日月 と ほし */
function NightSky({ t, night }: { readonly t: number; readonly night: number }) {
  if (night <= 0) return null
  const stars: readonly (readonly [number, number, number])[] = [
    [34, 8, 0],
    [78, 7, 1.1],
    [98, 24, 2.3],
    [100, 9, 0.6],
    [8, 40, 1.7],
  ]
  return (
    <g opacity={night}>
      {/* 三日月: 外の円 と 内の円 の間 */}
      <path d="M0 -6 A6 6 0 1 0 5.538 2.308 A5 5 0 0 1 0 -6 Z" fill="#fff3b0" transform="translate(16 15)" />
      {stars.map(([x, y, phase]) => (
        <Star key={`${x}-${y}`} cx={x} cy={y} r={1.6 + 0.9 * Math.max(0, wave(t, 1.3, phase))} color="#fff3b0" />
      ))}
    </g>
  )
}

/** ねている間の「ぐう」 */
function Snore({ t }: { readonly t: number }) {
  const show = during(t, DUSK + 0.5, WAKE, 0.3)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#dfe6ff" fontWeight="700" fontFamily="inherit">
      {[0, 0.6, 1.2].map((offset, i) => {
        const p = ((t - DUSK + offset) % 1.8) / 1.8
        return (
          <text key={offset} x={90 + p * 9 + Math.sin(p * 7) * 1.2} y={26 - p * 14} fontSize={4 + i * 1.2 + p * 2} opacity={Math.sin(p * Math.PI)}>
            z
          </text>
        )
      })}
    </g>
  )
}

/** かみの毛が のびている間の きらきら */
function GrowSparkles({ t }: { readonly t: number }) {
  const show = during(t, GROW_FROM, GROW_TO + 0.2, 0.3)
  if (show <= 0) return null
  const spots: readonly (readonly [number, number, number])[] = [
    [12, 36, 0],
    [98, 34, 0.5],
    [27, 17, 1.0],
    [84, 16, 1.5],
  ]
  return (
    <g opacity={show}>
      {spots.map(([x, y, phase]) => (
        <Star key={`${x}-${y}`} cx={x} cy={y} r={1.4 + 1.8 * Math.max(0, wave(t, 0.9, phase))} color="#ffe27a" spin={t * 60} />
      ))}
    </g>
  )
}

/** かみの毛の ぶぶん。growth: 0 = みじかい(あたまに ぴったり) → 1 = ふさふさ。tuft: はねた毛が のびた度合い */
function Hair({ growth, tuft }: { readonly growth: number; readonly tuft: number }) {
  return (
    <Layer scaleX={0.46 + 0.54 * growth} scaleY={0.6 + 0.4 * growth} origin={[CX, 36]}>
      {/* ふさふさ の かみ: おわん の ような形で、顔の 上と よこを つつむ */}
      <path d="M15 44 Q12 31 25 25 Q40 19 55.5 20 Q71 19 86 25 Q98 31 94 44 Q94 51 84 51 Q74 50 73.5 44 L73.5 36.5 L37.5 36.5 L37.5 44 Q37 50 26 51 Q15 51 15 44 Z" fill={HAIR} />
      {/* ふさの すじ と、まえがみの ギザギザ(かみの毛らしく 見せる) */}
      <path d="M55 21 Q36 24 22 42 M55 21 Q74 24 88 42 M47 21 Q37 27 31 37 M63 21 Q73 27 80 37" fill="none" stroke={HAIR_DARK} strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
      {[40.5, 46, 51.5, 57, 62.5, 68, 73].map((x, i) => (
        <circle key={x} cx={x} cy={36 + (i % 2) * 0.6} r="3.1" fill={HAIR} />
      ))}
      <ellipse cx="40" cy="26" rx="8" ry="2.2" fill={HAIR_LIGHT} opacity="0.7" transform="rotate(-12 40 24)" />
      <ellipse cx="74" cy="26" rx="6" ry="1.8" fill={HAIR_LIGHT} opacity="0.6" transform="rotate(10 74 25)" />
      {/* まえがみの 下はし と、おでこに たれた 1本 */}
      <Bone char={CHAR} n={3} color={HAIR_DARK} width={3} opacity={0.55} from={0.06} to={0.94} />
      <Bone char={CHAR} n={4} color={HAIR} width={3.6} />
      {/* てっぺんの はねた毛(根もとから のびる) */}
      <Bone char={CHAR} n={1} color={HAIR_LIGHT} width={4.4} from={1 - tuft} to={1} />
      <Bone char={CHAR} n={2} color={HAIR_LIGHT} width={4.4} from={1 - tuft} to={1} />
    </Layer>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="46" cy="59.5" rx="3.2" ry="2.1" fill={CHEEK} opacity="0.5" />
      <ellipse cx="65" cy="59.5" rx="3.2" ry="2.1" fill={CHEEK} opacity="0.5" />
      {mood === 'glum' && (
        <>
          <path d="M43 50.6 L50 48.4 M61 48.4 L68 50.6" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="47.5" cy="54.2" r="1.7" fill={EYE} />
          <circle cx="63.5" cy="54.2" r="1.7" fill={EYE} />
          <path d="M51.5 63.6 Q55.5 60.4 59.5 63.6" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />
        </>
      )}
      {mood === 'asleep' && (
        <>
          <path d="M44.2 53.6 Q47.5 56.4 50.8 53.6 M60.2 53.6 Q63.5 56.4 66.8 53.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="55.5" cy="62.4" rx="1.5" ry="1.2" fill={MOUTH} />
        </>
      )}
      {mood === 'surprised' && (
        <>
          <path d="M43.6 48.4 Q47.5 45.6 51.4 48.4 M59.6 48.4 Q63.5 45.6 67.4 48.4" fill="none" stroke={HAIR} strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="47.5" cy="54" r="3" fill="#ffffff" />
          <circle cx="63.5" cy="54" r="3" fill="#ffffff" />
          <circle cx="47.5" cy="54" r="1.7" fill={EYE} />
          <circle cx="63.5" cy="54" r="1.7" fill={EYE} />
          <ellipse cx="55.5" cy="62.4" rx="2.1" ry="2.8" fill={MOUTH} />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M44.2 55.4 Q47.5 51.2 50.8 55.4 M60.2 55.4 Q63.5 51.2 66.8 55.4" fill="none" stroke={EYE} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M50 60 Q55.5 68.4 61 60 Z" fill={MOUTH} stroke={MOUTH} strokeWidth="1" strokeLinejoin="round" />
          <path d="M52.6 63.6 Q55.5 66 58.4 63.6 Q55.5 62.6 52.6 63.6 Z" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

/** うで の かっこう。raise: 0 = 下に たれる / 1 = あたまの よこの かみ に さわる。pat: さわって なでる ゆれ */
type ArmPose = { readonly raise: number; readonly pat: number }

/** かた から出て、ひじ で まがる うで。side: -1 = 左(見ている人から 左) / 1 = 右 */
function Arm({ side, pose }: { readonly side: -1 | 1; readonly pose: ArmPose }) {
  const shoulder = side === -1 ? SHOULDER_L : SHOULDER_R
  const rad = (deg: number) => (deg * Math.PI) / 180
  // 角度は ま下から、体の そとがわへ 何度か
  const upper = 6 + 144 * pose.raise
  const fore = 10 + (170 + pose.pat) * pose.raise
  const len = ARM_HANG + (ARM_RAISED - ARM_HANG) * pose.raise
  const elbow = [shoulder[0] + side * Math.sin(rad(upper)) * len, shoulder[1] + Math.cos(rad(upper)) * len] as const
  const hand = [elbow[0] + side * Math.sin(rad(fore)) * len, elbow[1] + Math.cos(rad(fore)) * len] as const
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SLEEVE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.3" fill={SKIN} />
    </>
  )
}

type BoyProps = {
  readonly mood: Mood
  readonly growth: number
  readonly tuft: number
  /** あたまの かたむき(度) と、こくんと 下がる量 */
  readonly tilt: number
  readonly bob: number
  readonly breath: number
  readonly leftArm: ArmPose
}

function Boy({ mood, growth, tuft, tilt, bob, breath, leftArm }: BoyProps) {
  return (
    <>
      {/* あし と くつ */}
      <rect x="43" y="89" width="8.4" height="8" rx="3" fill={PANTS} />
      <rect x="60" y="89" width="8.4" height="8" rx="3" fill={PANTS} />
      <ellipse cx="46.6" cy="97" rx="5.4" ry="2.5" fill={SHOE} />
      <ellipse cx="64.6" cy="97" rx="5.4" ry="2.5" fill={SHOE} />
      {/* くび: あたま と どう の間を みじかく つなぐ */}
      <rect x="49.5" y="64" width="12" height="14" rx="4" fill={SKIN_SHADE} />
      {/* どう(しま の ふく): ねいきに あわせて 少し ふくらむ */}
      <Layer scaleX={1 + breath * 0.025} scaleY={1 + breath * 0.015} origin={[CX, 92]}>
        <rect x="38" y="75.5" width="35" height="18" rx="7" fill={SHIRT} />
        <path d="M38.6 80.4 H72.4 M38.2 89.4 H72.8" stroke={SHIRT_STRIPE} strokeWidth="2.2" />
      </Layer>
      <Arm side={1} pose={{ raise: 0, pat: 0 }} />
      {/* あたま: くび を じく に かたむく・うなずく */}
      <Layer rotate={tilt} y={bob} scaleY={1 - bob * 0.012} origin={NECK}>
        <rect x="37" y="34" width="37" height="35" rx="15" fill={SKIN} />
        <Face mood={mood} />
        <Hair growth={growth} tuft={tuft} />
      </Layer>
      <Arm side={-1} pose={leftArm} />
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  const pop = span(t, 0, 0.5, backOut)
  // 日が のぼって しずみ、夜が きて、また 朝が くる
  const sunP = span(t, 0.2, DUSK)
  const night = span(t, 1.9, 2.6) * (1 - span(t, 4.2, 4.9))

  // かみの毛: 夜の間に のびる。のびきって から はねた毛が ぴょこん
  const growth = span(t, GROW_FROM, GROW_TO, easeInOut)
  const tuft = span(t, GROW_TO - 0.3, GROW_TO + 0.5, backOut)

  // きもち: しょんぼり → ねる → びっくり → にこにこ
  const mood: Mood = t < DUSK + 0.2 ? 'glum' : t < WAKE ? 'asleep' : t < HAPPY ? 'surprised' : 'happy'

  // あたま: ねる ときは くび が かたむき、こっくり。おきて まっすぐ。うれしくて 2回 うなずく
  const sleepy = span(t, DUSK, DUSK + 0.6) * (1 - span(t, WAKE, WAKE + 0.25))
  const nodP = span(t, NOD, NOD + 0.75)
  const nod = nodP > 0 && nodP < 1 ? Math.abs(Math.sin(nodP * Math.PI * 2)) : 0
  const breath = wave(t, 1.8)
  const tilt = sleepy * (7 + wave(t, 1.8) * 1.2)
  const bob = sleepy * (1.4 + breath * 0.5) + nod * 2.4
  // しょんぼり の間は 少し うつむく
  const glumDroop = mood === 'glum' ? 0.6 + wave(t, 2.4) * 0.3 : 0

  // うで: おきたら あたまの よこの かみ に さわって なでる
  const raise = during(t, TOUCH, HAPPY + 0.2, 0.3)
  const pat = wave(t, 0.45) * 8
  const leftArm: ArmPose = { raise, pat }

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground />
        <Cloud t={t} />
        <Sun t={t} cx={mix(t, 0.2, DUSK, 10, 98, (x) => x)} cy={36 - 28 * Math.sin(sunP * Math.PI)} opacity={during(t, 0.2, DUSK, 0.3)} />
        <Sun t={t} cx={mix(t, 4.3, 5.6, 6, 13, easeOut)} cy={mix(t, 4.3, 5.6, 42, 13, easeOut)} opacity={span(t, 4.3, 4.8)} />
        <ellipse cx={CX} cy="98" rx={11 * pop} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={pop} y={glumDroop} origin={[CX, GROUND_Y]}>
          <Boy mood={mood} growth={growth} tuft={tuft} tilt={tilt} bob={bob + glumDroop} breath={breath} leftArm={leftArm} />
        </Layer>
        <GrowSparkles t={t} />
        <rect x="-2" y="-2" width="113" height="113" fill={NIGHT} opacity={night * 0.5} />
        <NightSky t={t} night={night} />
        <Snore t={t} />
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
    { at: 0, label: 'かみの毛が みじかくて しょんぼりした 男の子', sound: 'pop' },
    { at: DUSK, label: '夜になって、立ったまま うとうと。かみの毛が のびる' },
    { at: WAKE, label: '朝。さわってみると ふさふさ!', sound: 'pop' },
    { at: NOD, label: 'うれしくて、あたまを こくん こくん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '首 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
