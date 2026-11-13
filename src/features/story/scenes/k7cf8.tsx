/*
 * 糸(いと): まゆから ほそい 糸を とって、ねじって たばねた 形。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ→)  … かけた 糸の ひとつめの わ(手の ところから ななめに さがって、すこし まがる)
 *   2画目(ノ→)  … ふたつめの わ(上で かけた 糸が さがって、また すこし まがる)
 *   3画目(ゝ)   … ねじれた ところから ぴょんと とびだした 糸の はし
 *   4画目(丨)   … まんなかで たばねられて まっすぐ たれた 糸
 *   5・6画目    … 下で 左右に ひろがった 糸の はし
 *
 * ながれ
 *   きりかぶの 上に 女の子が とびのる → 手にした まゆを ふしぎそうに 見る
 *   → まゆから はみだした 糸の はしを つまむ → つまんで ひっぱると、ほそい 糸が するする のびる(まゆは くるくる まわる)
 *   → 糸を 手に かけて ねじり、たばねていくと わが ふえる → 手を たかく のばして、たばねた 糸を さげて にっこり
 *   → ほね が ひかって、絵が うすくなり、字「糸」が のこる
 *
 * 女の子は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。さいごに 手を たかく のばすときは、せのびを して(きりかぶの上で つま先立ち)とどく。
 *   字の形になる 糸は、女の子の 手から さがった 本ものの 糸の わ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'
import type { ReactNode } from 'react'

const CHAR = '糸'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BLOUSE = '#8ec9f0'
const BLOUSE_DARK = '#6fb2e0'
const SKIRT = '#e8658a'
const SKIRT_DARK = '#cf4f75'
const SHOE = '#6b4a36'
const RIBBON = '#ffd24a'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const RING = '#d9b184'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const COCOON = '#fffaf0'
const COCOON_SHADE = '#e6d8b8'
const THREAD = '#fff4cf'
const THREAD_SHADE = '#dba63f'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const LOOK = 0.9
const REACH = 1.8
const PINCH = 2.5
const PULL = 3.0
const PULL_END = 4.8
const WIND_END = 6.3
const INK = 7.0
const DONE = 10.4
const DURATION = 11

type Pt = readonly [number, number]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** 糸を つまんで ひっぱる 手の みちすじ: はじめ(まゆの よこ)→ 右へ ふくらんで → 糸の わの はじまり(1画目の 書きはじめ) */
const REST_HAND: Pt = [38.5, 75]
const PINCH_AT: Pt = [45.5, 57]
const PULL_CTRL: Pt = [58, 36]
const TOP: Pt = [51.25, 11.5]
/** まゆの 糸の はし(まゆの ふち) */
const STRAND_ROOT: Pt = [40.8, 60.5]
/** 女の子の かた(ひだり・みぎ) と、うでの 1ほん の ながさ(かた→ひじ、ひじ→手) */
const SHOULDER_L: Pt = [21.5, 44]
const SHOULDER_R: Pt = [33.5, 44]
const ARM_PART = 17
/** まゆを のせた 左手の ばしょ */
const HOLD_HAND: Pt = [35, 72]
const COCOON_AT: Pt = [35, 66]
/** せのびの たかさ(さいごに 手が 1画目の はじまりに とどくための 分) */
const STRETCH = 3.5

function bezier(from: Pt, ctrl: Pt, to: Pt, k: number): Pt {
  const a = (1 - k) ** 2
  const b = 2 * (1 - k) * k
  const c = k * k
  return [a * from[0] + b * ctrl[0] + c * to[0], a * from[1] + b * ctrl[1] + c * to[1]]
}

/**
 * かた から 手まで、ひじ で まがる うで。ひじ は、できるだけ 下(と そと)に まがる ほうを えらぶ。
 * とどかない ときは、のばしきった ところ で とまる。
 */
function armPoints(shoulder: Pt, target: Pt, outward: number): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(0, ARM_PART * ARM_PART - half * half))
  const mid: Pt = [shoulder[0] + ux * half, shoulder[1] + uy * half]
  const a: Pt = [mid[0] - uy * bulge, mid[1] + ux * bulge]
  const b: Pt = [mid[0] + uy * bulge, mid[1] - ux * bulge]
  const score = (p: Pt) => p[1] + outward * p[0]
  return { elbow: score(a) >= score(b) ? a : b, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

/* ───────── まわりの けしき ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="12" rx="6.5" ry="3" />
        <ellipse cx="7" cy="10.2" rx="4.6" ry="3" />
        <ellipse cx="80" cy="34" rx="7" ry="3" />
        <ellipse cx="85" cy="32.2" rx="4.8" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 女の子が のる きりかぶ。上の だえんが 年輪 */
function Stump({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <Layer scaleY={grow} origin={[27, 98]}>
      <path d="M11.5 88 L12.6 95.4 Q10 97.6 7.5 99 H46.5 Q44 97.6 41.4 95.4 L42.5 88 Z" fill={BARK} />
      <path d="M18 91 q0.6 3 -0.4 6 M36 91 q-0.6 3 0.6 5.6" fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="27" cy="88" rx="15.6" ry="3.8" fill={RING} />
      <ellipse cx="27" cy="88" rx="9.6" ry="2.2" fill="none" stroke={BARK} strokeWidth="0.8" />
      <ellipse cx="27" cy="88" rx="4" ry="0.9" fill="none" stroke={BARK} strokeWidth="0.8" />
    </Layer>
  )
}

/** くわの 木の しげみ と、はっぱを もぐもぐ たべる かいこ(まゆの もと) */
function MulberryBush({ t }: SceneProps) {
  const inch = (t * 2.6) % (Math.PI * 2)
  return (
    <>
      <circle cx="99" cy="90" r="9.5" fill={LEAF_DARK} />
      <circle cx="92.5" cy="93.4" r="6" fill={LEAF} />
      <circle cx="104" cy="94" r="5.4" fill={LEAF} />
      <circle cx="97" cy="86.6" r="3.4" fill={LEAF_LIGHT} />
      {/* かいこ が のっている 大きな 葉 */}
      <ellipse cx="97.5" cy="81.6" rx="8.4" ry="3.4" fill={LEAF} transform="rotate(-8 97.5 81.6)" />
      <path d="M90 82.8 L105 80.4" stroke={LEAF_DARK} strokeWidth="0.7" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={97 + i * 2.5} cy={79.2 - Math.max(0, Math.sin(inch - i * 0.7)) * 1.2} r="1.5" fill="#fff3d6" stroke="#e6d8b8" strokeWidth="0.4" />
      ))}
      <circle cx="94.6" cy={79 + Math.sin(t * 7) * 0.25} r="1.55" fill="#fff3d6" stroke="#e6d8b8" strokeWidth="0.4" />
      <circle cx="93.9" cy="78.7" r="0.4" fill={EYE} />
    </>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'curious' | 'amazed' | 'happy'

function Face({ mood, look }: { readonly mood: Mood; readonly look: Pt }) {
  const eyes = [23.3, 31.7]
  if (mood === 'happy') {
    return (
      <>
        {eyes.map((x) => (
          <path key={x} d={`M${x - 1.8} 29.2 Q${x} 26.6 ${x + 1.8} 29.2`} fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        ))}
        <path d="M24.2 32.6 Q27.5 37.6 30.8 32.6 Z" fill={MOUTH} />
      </>
    )
  }
  const big = mood === 'amazed'
  return (
    <>
      {eyes.map((x) => (
        <g key={x}>
          <circle cx={x + look[0]} cy={28.8 + look[1]} r={big ? 2.1 : 1.5} fill={EYE} />
          <circle cx={x + look[0] + 0.6} cy={28.8 + look[1] - 0.6} r={big ? 0.7 : 0.5} fill="#ffffff" />
          <path d={`M${x - 1.9} ${big ? 24.2 : 25.6} Q${x} ${big ? 22.6 : 24.4} ${x + 1.9} ${big ? 24.2 : 25.6}`} fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
        </g>
      ))}
      {big ? <ellipse cx="27.5" cy="34.4" rx="1.7" ry="2.2" fill={MOUTH} /> : <ellipse cx="27.5" cy="34" rx="0.9" ry="1.1" fill={MOUTH} />}
    </>
  )
}

function Head({ mood, look, tilt }: { readonly mood: Mood; readonly look: Pt; readonly tilt: number }) {
  return (
    <Layer rotate={tilt} origin={[27.5, 39]}>
      {/* うしろがみ と ふたつ むすび */}
      <circle cx="27.5" cy="25" r="13.4" fill={HAIR} />
      <circle cx="14.4" cy="31" r="4.2" fill={HAIR} />
      <circle cx="40.6" cy="31" r="4.2" fill={HAIR} />
      <circle cx="15" cy="26.6" r="1.8" fill={RIBBON} />
      <circle cx="40" cy="26.6" r="1.8" fill={RIBBON} />
      <circle cx="27.5" cy="28" r="11.4" fill={SKIN} />
      <path d="M16.2 26 C16 14 39 14 38.8 26 C36 20.5 31 19.8 27.5 22.5 C24 19.8 19 20.5 16.2 26 Z" fill={HAIR} />
      <circle cx="21.2" cy="32.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      <circle cx="33.8" cy="32.8" r="2.1" fill="#ff9d9d" opacity="0.55" />
      <Face mood={mood} look={look} />
    </Layer>
  )
}

function Arm({ shoulder, elbow, hand }: { readonly shoulder: Pt; readonly elbow: Pt; readonly hand: Pt }) {
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shoulder[0]} cy={shoulder[1] + 0.6} r="4.3" fill={BLOUSE_DARK} />
    </>
  )
}

type GirlProps = {
  readonly lift: number
  readonly mood: Mood
  readonly look: Pt
  readonly tilt: number
  readonly rightTarget: Pt
  /** 左手の うえの まゆ */
  readonly cocoon: ReactNode
  /** みぎ手と まゆを むすぶ 糸 */
  readonly strand: ReactNode
}

function Girl({ lift, mood, look, tilt, rightTarget, cocoon, strand }: GirlProps) {
  const left = armPoints([SHOULDER_L[0], SHOULDER_L[1] - lift], [HOLD_HAND[0], HOLD_HAND[1] - lift], -0.9)
  const right = armPoints([SHOULDER_R[0], SHOULDER_R[1] - lift], rightTarget, 0.9)
  return (
    <>
      {/* あし: せのびで つま先立ちに なる */}
      {[21, 29.4].map((x) => (
        <g key={x}>
          <rect x={x} y={78 - lift} width="4.6" height={7.4 + lift} rx="2.2" fill={SKIN} />
          <ellipse cx={x + 2.3} cy="85.8" rx={4.3 - lift * 0.3} ry="1.9" fill={SHOE} />
        </g>
      ))}
      <Layer y={-lift}>
        <rect x="25" y="37" width="5" height="7" rx="2" fill={SKIN_SHADE} />
        <path d="M18.6 60 H36.4 Q41 70 42.5 79 Q27.5 82 12.5 79 Q14 70 18.6 60 Z" fill={SKIRT} />
        <path d="M13 77 Q27.5 80.6 42 77" fill="none" stroke={SKIRT_DARK} strokeWidth="1.4" strokeLinecap="round" />
        <rect x="19.5" y="42" width="15" height="22" rx="6.5" fill={BLOUSE} />
        <path d="M21.5 61 h11" stroke={BLOUSE_DARK} strokeWidth="1.4" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={[SHOULDER_L[0], SHOULDER_L[1] - lift]} elbow={left.elbow} hand={left.hand} />
      {cocoon}
      <circle cx={left.hand[0]} cy={left.hand[1]} r="3.1" fill={SKIN} />
      <Layer y={-lift}>
        <Head mood={mood} look={look} tilt={tilt} />
      </Layer>
      <Arm shoulder={[SHOULDER_R[0], SHOULDER_R[1] - lift]} elbow={right.elbow} hand={right.hand} />
      {strand}
      <circle cx={right.hand[0]} cy={right.hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

/* ───────── まゆ・糸 ───────── */

/** まゆ。糸が ほどけるほど 小さくなり、くるくる まわる */
function Cocoon({ lift, spin, size }: { readonly lift: number; readonly spin: number; readonly size: number }) {
  return (
    <Layer x={COCOON_AT[0]} y={COCOON_AT[1] - lift} scale={size} rotate={spin + 20}>
      <ellipse cx="0" cy="0" rx="5.8" ry="7.6" fill={COCOON_SHADE} />
      <ellipse cx="-0.5" cy="-0.5" rx="5.4" ry="7.2" fill={COCOON} />
      <path d="M-4.6 -2.6 Q0 0.6 4.8 -2.8 M-5 1.6 Q0 4.6 5 1.4 M-3 -5.4 Q0 -3.4 3 -5.6" fill="none" stroke={COCOON_SHADE} strokeWidth="0.8" strokeLinecap="round" />
    </Layer>
  )
}

function ThreadLine({ d, width, color, opacity = 1 }: { readonly d: string; readonly width: number; readonly color: string; readonly opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} />
}

/**
 * まゆの はし から みぎ手まで はった 糸。はじめは ゆるく たるみ、ひっぱるほど ぴんと のびる。
 * 糸が わに なって いく ころには、まゆ の がわが 手の ほうへ すいこまれて みじかくなる。
 */
function Strand({ t, lift, hand }: { readonly t: number; readonly lift: number; readonly hand: Pt }) {
  if (t < PINCH - 0.3) {
    // まだ 手が とどく まえ: まゆから はみだした 糸の はしが ふわふわ
    const sway = wave(t, 1.1)
    const root: Pt = [STRAND_ROOT[0], STRAND_ROOT[1] - lift]
    const d = `M${root[0]} ${root[1]} Q${root[0] + 2.6} ${root[1] - 4.4 + sway * 0.8} ${PINCH_AT[0] + sway * 0.6} ${PINCH_AT[1] - 0.6}`
    return (
      <>
        <ThreadLine d={d} width={1.5} color={THREAD_SHADE} />
        <ThreadLine d={d} width={0.8} color={THREAD} />
      </>
    )
  }
  const retract = easeIn(span(t, PULL_END + 0.6, WIND_END))
  if (retract >= 1) return null
  const root: Pt = [STRAND_ROOT[0], STRAND_ROOT[1] - lift]
  const start: Pt = [lerp(root[0], hand[0], retract), lerp(root[1], hand[1], retract)]
  const slack = 10 * (1 - span(t, PULL, PULL_END, easeOut)) + 2.4 + wave(t, 0.5) * 0.9
  const ctrl: Pt = [(start[0] + hand[0]) / 2, (start[1] + hand[1]) / 2 + slack]
  const d = `M${start[0]} ${start[1]} Q${ctrl[0]} ${ctrl[1]} ${hand[0]} ${hand[1]}`
  return (
    <>
      <ThreadLine d={d} width={1.5} color={THREAD_SHADE} />
      <ThreadLine d={d} width={0.8} color={THREAD} />
      {/* ひっぱる間、糸が きらきら ひかる */}
      {[0.35, 0.65].map((k, i) => {
        const p = bezier(start, ctrl, hand, k)
        const glint = during(t, PULL + 0.2 + i * 0.4, PULL_END + 0.5, 0.3)
        return glint > 0 ? <Star key={k} cx={p[0] + 2.4} cy={p[1] - 2} r={1.2 + glint * 1.2} color="#ffd24a" spin={t * 120} /> : null
      })}
    </>
  )
}

/** 手に かけて ねじっていくと ふえる わ。字の画の線が そのまま 糸の わに なる */
const SKEIN_ARC = 'M51.25 11.5 Q62 5 70.5 21'
const SKEIN_STEPS = 7
/** 下に こい色(かげ)、上に うすい色 の 2回 かさねて 糸らしく */
const SKEIN_LOOKS = [
  { color: THREAD_SHADE, width: 3.6 },
  { color: THREAD, width: 2 },
] as const

function Skein({ t }: SceneProps) {
  const p = span(t, PULL_END, WIND_END)
  if (p <= 0) return null
  // 手から さがった 糸の わ。出きった あと すこし ゆれて、字になる前に ぴたっと とまる
  const sway = wave(t, 1.4) * 2.2 * span(t, WIND_END - 0.4, WIND_END) * (1 - span(t, WIND_END, INK - 0.3))
  const step = (index: number) => Math.min(Math.max(p * SKEIN_STEPS - index, 0), 1)
  const arc = step(1)
  const strokes: readonly (readonly [number, number])[] = [
    [1, step(0)],
    [2, step(2)],
    [3, step(3)],
    [4, step(4)],
    [5, step(5)],
    [6, step(6)],
  ]
  return (
    <Layer rotate={sway} origin={TOP}>
      {SKEIN_LOOKS.map(({ color, width }) => (
        <g key={color}>
          {strokes.map(([n, to]) => (
            <Bone key={n} char={CHAR} n={n} color={color} width={width} to={to} />
          ))}
          {arc > 0 ? <path d={SKEIN_ARC} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={`${arc} 2`} /> : null}
        </g>
      ))}
    </Layer>
  )
}

/** 手に 糸を かけて くるくる ねじる しるし */
function Twirl({ t }: SceneProps) {
  const show = during(t, PULL_END, WIND_END, 0.25)
  if (show <= 0) return null
  return (
    <Layer opacity={show} rotate={t * 240} origin={TOP}>
      <circle cx={TOP[0]} cy={TOP[1]} r="7.4" fill="none" stroke={SUN} strokeWidth="1.1" strokeLinecap="round" strokeDasharray="6 8" />
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // 女の子: 左から ぴょんと とんで、きりかぶに のる
  const jump = span(t, 0.3, 0.9)
  const slideX = mix(t, 0.3, 0.9, -34, 0, easeOut)
  const hop = -Math.sin(jump * Math.PI) * 9

  // きもち: ふしぎ → おどろき → にっこり
  const mood: Mood = t < PINCH - 0.1 ? 'curious' : t < PULL + 0.6 ? 'amazed' : 'happy'
  const look: Pt = mood === 'curious' ? [0.6, 0.7] : [0.4, 0.5]
  const tilt = 7 * span(t, LOOK, LOOK + 0.5) * (1 - span(t, PINCH - 0.1, PINCH + 0.3)) + 4 * span(t, PULL + 0.6, PULL_END)

  // せのび: 手が 上へ のびるのに あわせて つま先立ち
  const pull = span(t, PULL, PULL_END, easeInOut)
  const lift = STRETCH * pull

  // みぎ手: 下げた手 → まゆの 糸の はし → 右へ ふくらんで 上へ(かけた 糸の はじまり)。ねじるとき すこし まわす
  const reach = span(t, REACH, PINCH, easeInOut)
  const rest: Pt = [lerp(REST_HAND[0], PINCH_AT[0], reach), lerp(REST_HAND[1], PINCH_AT[1], reach)]
  const base = pull > 0 ? bezier(PINCH_AT, PULL_CTRL, TOP, pull) : rest
  const twist = during(t, PULL_END, WIND_END, 0.2) * Math.min(1, span(t, PULL_END, PULL_END + 0.3))
  const rightTarget: Pt = [base[0] + Math.cos(t * 14) * 0.8 * twist, base[1] + Math.sin(t * 14) * 0.8 * twist]
  const handNow: Pt = armPoints([SHOULDER_R[0], SHOULDER_R[1] - lift], rightTarget, 0.9).hand

  // まゆ: 糸が ほどけるほど 小さく、くるくる
  const unwind = span(t, PINCH, WIND_END)
  const cocoon = <Cocoon lift={lift} spin={unwind * 720} size={1 - 0.3 * unwind} />

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stump t={t} />
        <MulberryBush t={t} />
        <Layer opacity={span(t, 0.3, 0.45)} x={slideX} y={hop}>
          <Girl lift={lift} mood={mood} look={look} tilt={tilt} rightTarget={rightTarget} cocoon={cocoon} strand={<Strand t={t} lift={lift} hand={handNow} />} />
        </Layer>
        <Skein t={t} />
        <Twirl t={t} />
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
    { at: 0, label: 'きりかぶが できる。女の子が とんでくる', sound: 'pop' },
    { at: LOOK, label: 'まゆを 見て ふしぎそう' },
    { at: PINCH, label: 'まゆの 糸の はしを つまむ', sound: 'pop' },
    { at: PULL, label: 'ひっぱると、ほそい 糸が するする' },
    { at: PULL_END, label: '手に かけて ねじって、たばねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '糸 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
