/*
 * 顔(かお): あたまの 前の ところ。めや はなが ある。
 *
 * ほね(画と絵の対応)
 *   10〜16画目 … 右がわの 子どもの あたま(10・11 は かみの毛、13 は かおの まるみ、
 *                  12・14〜16 は かおの まんなかに ならぶ めと はな と くち)
 *   17・18画目 … 子どもの 左右に ひらいた あし
 *   1〜9画目   … 左がわの 大きな 立てかがみ(わく・あし・かがみに うつる すがた)
 *   (字の形に ぴったりは 重ならない。だいたい 同じ場所・同じ むき)
 *
 * ながれ
 *   どろんこの 子どもが、かがみの 前に 立つ(かおに どろが ついている ことに まだ きづかない)
 *   → かがみに うつった かおを 見て「!」と びっくり
 *   → もっていた タオルで ごしごし ふく(どろが タオルに うつる)
 *   → きれいになった かお。めと はなと くちが きらっと ひかって、にっこり。ばんざい
 *   → ほね が ひかって、絵が うすくなり、字「顔」が のこる
 *
 * 人は、ほんものの 人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は そとがわに 出る)。くび は みじかく、どう の まんなか の上。
 *   かがみに うつるのは、おなじ 子どもの すがた(かおも うでも おなじ うごき)。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '顔'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#ff8a65'
const SHIRT_DARK = '#e5694b'
const SHORTS = '#4f7fc4'
const SHOE = '#6b4a36'
const FRAME = '#8c5b3c'
const FRAME_DARK = '#70452b'
const GLASS = '#d7eefb'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const MUD = '#8a6a4c'
const TOWEL = '#ffb3c1'
const TOWEL_STRIPE = '#ff8aa1'
const RING = '#ffc233'

/** くぎり の時間(秒) */
const LOOK = 1.1
const SURPRISE = 2.3
const WIPE = 3.3
const CLEAN = 5.0
const CHEER = 6.2
const INK = 7.0
const DONE = 10.0
const DURATION = 10.5

/** かがみ: わく の まんなか と、ガラスの 大きさ */
const MIRROR: readonly [number, number] = [31.5, 49]
const GLASS_RX = 17.5
const GLASS_RY = 31

/** 子どもの あたまの まんなか(かお)、めの 位置 */
const HEAD: readonly [number, number] = [76, 56]
const EYE_XS: readonly number[] = [71.2, 80.8]
const EYE_Y = 56
const NOSE: readonly [number, number] = [76, 59.4]
const MOUTH_AT: readonly [number, number] = [76, 65]
/** かた(うで の つけね)。どう の 左右の はし の 中 */
const SHOULDER_L: readonly [number, number] = [68.5, 76.5]
const SHOULDER_R: readonly [number, number] = [83.5, 76.5]
/** うで の ほね: かた→ひじ、ひじ→手 の 長さ */
const ARM_PART = 7.8

type Mood = 'happy' | 'surprised' | 'squint' | 'joy'
type Point = readonly [number, number]

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** かた と 手の 場所 から、ひじ の 場所を 出す(ひじ は そとがわ = outward の ほうへ まがる) */
function reachArm(shoulder: Point, target: Point, outward: 1 | -1): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.min(Math.max(Math.hypot(dx, dy), 0.5), ARM_PART * 2 - 0.05)
  const base = Math.atan2(dy, dx)
  const cosA = (ARM_PART * ARM_PART + dist * dist - ARM_PART * ARM_PART) / (2 * ARM_PART * dist)
  const a = Math.acos(Math.min(Math.max(cosA, -1), 1))
  const candidates = [base + a, base - a].map((angle): Point => [shoulder[0] + Math.cos(angle) * ARM_PART, shoulder[1] + Math.sin(angle) * ARM_PART])
  const elbow = (candidates[0][0] - shoulder[0]) * outward >= (candidates[1][0] - shoulder[0]) * outward ? candidates[0] : candidates[1]
  return { elbow, hand: [shoulder[0] + Math.cos(base) * dist, shoulder[1] + Math.sin(base) * dist] }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[101, 10]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="100.2" y="1.4" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 101 10)`} />
        ))}
      </Layer>
      <circle cx="101" cy="10" r={4.8 * sun} fill={SUN} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="9" rx="7" ry="3" />
        <ellipse cx="2.5" cy="7.4" rx="4.6" ry="3" />
        <ellipse cx="62" cy="8" rx="6" ry="2.6" />
        <ellipse cx="66" cy="6.6" rx="4" ry="2.6" />
      </g>
      <path d="M-4 99 Q18 84 44 94 Q72 80 113 96 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 54, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 立てかがみ。ガラスの中には、子どもの すがた(reflection)が うつる。 */
function Mirror({ t, reflection }: SceneProps & { readonly reflection: ReactNode }) {
  const pop = span(t, 0, 0.7, backOut)
  const show = span(t, LOOK - 0.3, LOOK + 0.3)
  // きらっ と ひかる 白い おび: びっくり した とき と きれいに なった とき
  const glint = (from: number) => mix(t, from, from + 0.8, -30, 70, easeInOut)
  const glintOn = (from: number) => (t >= from && t <= from + 0.8 ? 0.6 : 0)
  return (
    <Layer scale={pop} origin={[MIRROR[0], 96]}>
      {/* うしろの 2本の あし */}
      <path d="M23 72 L14.5 96 M40 72 L48.5 96" fill="none" stroke={FRAME_DARK} strokeWidth="3.4" strokeLinecap="round" />
      <ellipse cx={MIRROR[0]} cy={MIRROR[1]} rx={GLASS_RX + 3} ry={GLASS_RY + 3} fill={FRAME} />
      <ellipse cx={MIRROR[0]} cy={MIRROR[1]} rx={GLASS_RX + 3} ry={GLASS_RY + 3} fill="none" stroke={FRAME_DARK} strokeWidth="1" opacity="0.5" />
      <ellipse cx={MIRROR[0]} cy={MIRROR[1]} rx={GLASS_RX} ry={GLASS_RY} fill={GLASS} />
      <clipPath id="k9854-glass">
        <ellipse cx={MIRROR[0]} cy={MIRROR[1]} rx={GLASS_RX} ry={GLASS_RY} />
      </clipPath>
      <g clipPath="url(#k9854-glass)">
        <g opacity={show}>{reflection}</g>
        <rect x="14" y="16" width="35" height="64" fill="#ffffff" opacity="0.14" />
        {[SURPRISE, CLEAN].map((from) => (
          <g key={from} opacity={glintOn(from)} transform={`translate(${glint(from)} 0)`}>
            <rect x="0" y="10" width="5" height="76" fill="#ffffff" transform="skewX(-18)" />
            <rect x="8" y="10" width="2" height="76" fill="#ffffff" transform="skewX(-18)" />
          </g>
        ))}
      </g>
    </Layer>
  )
}

type HeadProps = {
  readonly mood: Mood
  /** 目の むき(-1 = 左 / 1 = 右) */
  readonly look: number
  /** どろの こさ(0〜1) */
  readonly dirt: number
  readonly t: number
}

const BROWS: Record<Mood, { readonly dy: number; readonly tilt: number }> = {
  happy: { dy: 0, tilt: 0 },
  surprised: { dy: -2.2, tilt: -0.4 },
  squint: { dy: 0.8, tilt: 0 },
  joy: { dy: -0.6, tilt: 0 },
}

function Eye({ x, mood, look }: { readonly x: number; readonly mood: Mood; readonly look: number }) {
  const dx = look * 1
  if (mood === 'squint') {
    // ごしごし されて、ぎゅっと つぶる
    return <path d={`M${x - 1.9} ${EYE_Y - 0.4} Q${x} ${EYE_Y + 1.3} ${x + 1.9} ${EYE_Y - 0.4}`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
  }
  if (mood === 'surprised') {
    return (
      <>
        <circle cx={x} cy={EYE_Y} r="3.1" fill="#ffffff" stroke={EYE} strokeWidth="0.6" />
        <circle cx={x + dx * 0.8} cy={EYE_Y} r="1.5" fill={EYE} />
      </>
    )
  }
  const r = mood === 'joy' ? 1.95 : 1.6
  return (
    <>
      <circle cx={x + dx} cy={EYE_Y} r={r} fill={EYE} />
      <circle cx={x + dx + 0.6} cy={EYE_Y - 0.6} r="0.55" fill="#ffffff" />
    </>
  )
}

function Mouth({ mood }: { readonly mood: Mood }) {
  if (mood === 'surprised') return <ellipse cx={MOUTH_AT[0]} cy={MOUTH_AT[1] + 0.4} rx="1.8" ry="2.3" fill={MOUTH} />
  if (mood === 'squint') return <path d="M74.2 65 Q76 64.2 77.8 65" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
  if (mood === 'joy') {
    return (
      <>
        <path d="M72.4 63.4 Q76 64 79.6 63.4 Q78.6 68.8 76 68.8 Q73.4 68.8 72.4 63.4 Z" fill={MOUTH} />
        <ellipse cx="76" cy="67.5" rx="1.7" ry="0.9" fill="#ff8a8a" />
      </>
    )
  }
  return <path d="M73.4 64.4 Q76 66.6 78.6 64.4" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
}

/** あたま: かみ・かお(め・はな・くち・ほっぺ)。どろ は かおの 3か所に ついている。 */
function Head({ mood, look, dirt, t }: HeadProps) {
  const brow = BROWS[mood]
  const y = 51.4 + brow.dy
  return (
    <>
      <ellipse cx="76" cy="46" rx="14.6" ry="16" fill={HAIR} />
      <circle cx="63.4" cy="57" r="2.4" fill={SKIN_SHADE} />
      <circle cx="88.6" cy="57" r="2.4" fill={SKIN_SHADE} />
      <ellipse cx={HEAD[0]} cy="56.5" rx="12.6" ry="14.4" fill={SKIN} />
      {/* まえがみ と、ぴょこんと はねた かみ */}
      <path d="M63 52 C62 38 72 32 80 33 C88 34 91 44 89 52 C86 46 82 44.5 76 45.5 C70 46 66 48 63 52 Z" fill={HAIR} />
      <Layer rotate={wave(t, 1.3) * 4} origin={[76, 29]}>
        <path d="M74.5 30 Q71 24 76.5 22.6 Q74.4 25.2 77.6 29.4" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </Layer>
      <ellipse cx="69" cy="61.5" rx="2.6" ry="1.7" fill="#ff9d9d" opacity={mood === 'joy' ? 0.75 : 0.5} />
      <ellipse cx="83" cy="61.5" rx="2.6" ry="1.7" fill="#ff9d9d" opacity={mood === 'joy' ? 0.75 : 0.5} />
      <path d={`M69.2 ${y} Q71.2 ${y - 0.9} 73.2 ${y + brow.tilt}`} fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
      <path d={`M78.8 ${y + brow.tilt} Q80.8 ${y - 0.9} 82.8 ${y}`} fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
      {EYE_XS.map((x) => (
        <Eye key={x} x={x} mood={mood} look={look} />
      ))}
      <ellipse cx={NOSE[0]} cy={NOSE[1]} rx="1.5" ry="1.1" fill="#f0b58a" />
      <Mouth mood={mood} />
      {/* どろ: ふくと うすくなる */}
      <g fill={MUD} opacity={dirt * 0.8}>
        <ellipse cx="83.4" cy="60.2" rx="3.4" ry="2.1" transform="rotate(-20 83.4 60.2)" />
        <ellipse cx="68.4" cy="59" rx="1.9" ry="1.3" />
        <circle cx="78.4" cy="69" r="1.1" />
      </g>
    </>
  )
}

type ArmProps = { readonly shoulder: Point; readonly target: Point; readonly outward: 1 | -1 }

/** かた から出て、ひじ で まがる うで。かた・ひじ・手 の じゅんに つながる。 */
function Arm({ shoulder, target, outward }: ArmProps) {
  const { elbow, hand } = reachArm(shoulder, target, outward)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

/** もっている タオル。ふくときは 手の ひらに おさまり、どろが うつる。 */
function Towel({ hand, wipe, stain, t }: { readonly hand: Point; readonly wipe: number; readonly stain: number; readonly t: number }) {
  const w = 5 + 2 * wipe
  const h = 10 - 5 * wipe
  const cy = hand[1] + (h / 2 - 1) * (1 - wipe)
  return (
    <Layer rotate={wave(t, 0.35) * 8 * wipe} origin={[hand[0], cy]}>
      <rect x={hand[0] - w / 2} y={cy - h / 2} width={w} height={h} rx="1.2" fill={TOWEL} />
      <rect x={hand[0] - w / 2} y={cy - h / 2 + h * 0.62} width={w} height={h * 0.16} fill={TOWEL_STRIPE} />
      <ellipse cx={hand[0]} cy={cy} rx={w * 0.3} ry={h * 0.22} fill={MUD} opacity={stain * wipe * 0.85} />
    </Layer>
  )
}

type PersonProps = {
  readonly mood: Mood
  readonly look: number
  readonly dirt: number
  readonly leftTarget: Point
  readonly rightTarget: Point
  readonly wipe: number
  readonly t: number
}

/** 子ども。あし・どう・くび・あたま・うで。(かがみにも おなじ すがたが うつる) */
function Person({ mood, look, dirt, leftTarget, rightTarget, wipe, t }: PersonProps) {
  const right = reachArm(SHOULDER_R, rightTarget, 1)
  return (
    <>
      <path d="M71 88 L67.5 95 M81 88 L84.5 95" fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
      <ellipse cx="66.2" cy="95.8" rx="4.2" ry="2.2" fill={SHOE} />
      <ellipse cx="85.8" cy="95.8" rx="4.2" ry="2.2" fill={SHOE} />
      <rect x="67" y="83.4" width="18" height="7" rx="3" fill={SHORTS} />
      <rect x="67" y="72.5" width="18" height="14" rx="5.4" fill={SHIRT} />
      <rect x="72.6" y="68" width="6.8" height="7" rx="2.4" fill={SKIN_SHADE} />
      <Head mood={mood} look={look} dirt={dirt} t={t} />
      <Arm shoulder={SHOULDER_L} target={leftTarget} outward={-1} />
      <Towel hand={right.hand} wipe={wipe} stain={1 - dirt} t={t} />
      <Arm shoulder={SHOULDER_R} target={rightTarget} outward={1} />
    </>
  )
}

/** きれいに なった とき、めと はなと くちが 順に きらっ と ひかる(わっか が ひろがる)。 */
function FeatureRings({ t }: SceneProps) {
  const ring = (cx: number, cy: number, from: number, key: string) => {
    const p = span(t, from, from + 0.55, easeOut)
    if (p <= 0 || p >= 1) return null
    return <circle key={key} cx={cx} cy={cy} r={2 + 4.4 * p} fill="none" stroke={RING} strokeWidth="1.2" opacity={1 - p} />
  }
  return (
    <>
      {EYE_XS.map((x) => ring(x, EYE_Y, CLEAN + 0.2, `e${x}`))}
      {ring(NOSE[0], NOSE[1], CLEAN + 0.7, 'n')}
      {ring(MOUTH_AT[0], MOUTH_AT[1] + 1, CLEAN + 1.15, 'm')}
    </>
  )
}

/** びっくりの「!」。あたまの よこで ぽん と はずんで きえる。 */
function Bang({ t }: SceneProps) {
  const pop = span(t, SURPRISE, SURPRISE + 0.3, backOut)
  const show = during(t, SURPRISE, WIPE + 0.2, 0.15)
  if (show <= 0) return null
  return (
    <Layer opacity={show} scale={pop} rotate={wave(t, 0.4) * 6} origin={[93.4, 40]}>
      <rect x="91.8" y="25" width="3.2" height="8.6" rx="1.6" fill="#e8534a" />
      <circle cx="93.4" cy="37.6" r="1.9" fill="#e8534a" />
    </Layer>
  )
}

/** かがみと 子どもの あいだを ひらひら とぶ ちょうちょ。 */
function Butterfly({ t }: SceneProps) {
  const show = span(t, 0.9, 1.3)
  if (show <= 0) return null
  const x = 56.5 + Math.sin(t * 1.3) * 2.6
  const y = 74 + Math.sin(t * 2.1) * 4
  const flap = 0.25 + Math.abs(wave(t, 0.36)) * 0.75
  return (
    <Layer opacity={show} x={x} y={y}>
      <Layer scaleX={flap}>
        <ellipse cx="-1.9" cy="-1.1" rx="2.2" ry="1.7" fill="#c58cf0" />
        <ellipse cx="1.9" cy="-1.1" rx="2.2" ry="1.7" fill="#c58cf0" />
        <ellipse cx="-1.5" cy="1.2" rx="1.5" ry="1.2" fill="#a56ad8" />
        <ellipse cx="1.5" cy="1.2" rx="1.5" ry="1.2" fill="#a56ad8" />
      </Layer>
      <ellipse cx="0" cy="0" rx="0.55" ry="2" fill="#4a3560" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 18)

  // 子どもが ぽん と 出てくる(足もとを じく に)
  const enter = span(t, 0.3, 0.95, backOut)
  // きもち: ふつう → びっくり → ぎゅっと(ふいている) → にっこり
  const mood: Mood = t < SURPRISE ? 'happy' : t < WIPE + 0.1 ? 'surprised' : t < CLEAN ? 'squint' : 'joy'
  // 目の むき: かがみを 見る。さいごは こちらを 見る
  const look = mix(t, 0.5, LOOK, 0, -1) * (1 - span(t, CLEAN, CLEAN + 0.4))
  // どろ: ふくと きえる
  const dirt = 1 - span(t, WIPE + 0.4, CLEAN - 0.1)

  // うで: ふだんは 体の よこ。びっくり では 左手が ほっぺへ。ふくときは 右手が ほっぺへ。ばんざいで 両手が 上へ
  const surpriseHand = span(t, SURPRISE + 0.05, SURPRISE + 0.3, easeOut) * (1 - span(t, WIPE, WIPE + 0.4, easeInOut))
  const wipe = span(t, WIPE - 0.2, WIPE + 0.25, easeInOut) * (1 - span(t, CLEAN, CLEAN + 0.45, easeInOut))
  const cheer = span(t, CHEER, CHEER + 0.4, easeOut)
  const scrub: Point = [83 + wave(t, 0.35) * 1.4, 63.2 + wave(t, 0.35, 0.25) * 1.1]
  const leftBase = lerpPoint([65.5, 89], [66, 64], surpriseHand)
  const rightBase = lerpPoint([87, 89], scrub, wipe)
  const leftTarget = lerpPoint(leftBase, [62, 65], cheer)
  const rightTarget = lerpPoint(rightBase, [90, 65], cheer)

  // はずみ: びっくり で ちょこっと、ばんざい で ぴょん
  const hop = Math.sin(span(t, SURPRISE, SURPRISE + 0.4) * Math.PI) * 1.6 + Math.sin(span(t, CHEER, CHEER + 0.55) * Math.PI) * 3
  const breath = wave(t, 1.6) * 0.25

  const person = <Person mood={mood} look={look} dirt={dirt} leftTarget={leftTarget} rightTarget={rightTarget} wipe={wipe} t={t} />
  // かがみの 中の すがた: すこし ちいさく、おなじ うごき
  const reflection = (
    <Layer scale={0.95} x={-44.5} origin={HEAD}>
      <Layer y={-hop + breath}>
        <Person mood={mood} look={-look} dirt={dirt} leftTarget={leftTarget} rightTarget={rightTarget} wipe={wipe} t={t} />
      </Layer>
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Mirror t={t} reflection={reflection} />
        <Butterfly t={t} />
        <ellipse cx="76" cy="97.6" rx={12 * Math.min(enter, 1)} ry="2.4" fill="#000000" opacity="0.12" />
        <Layer scale={Math.max(enter, 0)} origin={[76, 96]}>
          <Layer y={-hop + breath}>
            {person}
            <FeatureRings t={t} />
          </Layer>
        </Layer>
        <Bang t={t} />
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
    { at: 0, label: 'かがみが 立ち、どろんこの 子どもが 出てくる', sound: 'pop' },
    { at: LOOK, label: 'かがみの 前に 立つ(かおの どろに まだ きづかない)' },
    { at: SURPRISE, label: 'かがみの かおを 見て「!」と びっくり', sound: 'pop' },
    { at: WIPE, label: 'タオルで ごしごし ふく(どろが タオルに うつる)' },
    { at: CLEAN, label: 'きれいな かお。めと はなと くちが きらっ と ひかる', sound: 'ok' },
    { at: CHEER, label: 'にっこり ばんざい' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '顔 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
