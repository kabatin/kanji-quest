/*
 * 里(さと): たんぼと 土が ある ところに、人が すむ。
 *
 * ほね(画と絵の対応)
 *   1画目(ノ)   … たんぼの 左の あぜ(田の 左がわ)
 *   2画目(𠃍)   … たんぼの 上と 右の あぜ
 *   3画目(一)   … たんぼの まんなかの よこの あぜ
 *   4画目(一)   … たんぼの 下の あぜ(これで 4つの 田に わかれる)
 *   5画目(丨)   … たんぼの まんなかを とおる、土に さした 旗ざお(田の まんなかの たて)
 *   6画目(一)   … 土の いちばん上、草の はえた 地面
 *   7画目(一)   … 土の いちばん下、かたい 岩の そう
 *
 * ながれ
 *   旗ざおが 立つ なにも ない 土地 → つかれた人が くわを かついで あるいてくる
 *   → 「ふう」と ひといき ついて、くわで 土を たがやす(1回 うつごとに たんぼが ひとつずつ 水で いっぱいになり、苗が そだつ)
 *   → 4つの たんぼが 青々として、人は にっこり → 旗ざおに 旗を ひっぱり上げる
 *   → うれしくて ぴょんぴょん。家の えんとつから けむり(ここで くらす) → ほね が ひかって、絵が うすくなり、字「里」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くわは 両手で もち、ふりかぶって 前へ うつ。
 *   旗は、ロープを かわりばんこに ひっぱって 上げる(本物の 旗ざおと おなじ やりかた)。
 *   くわは うった あと、土に さしたまま のこす(あるいていく とき、うしろに なる)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '里'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#e8923f'
const SHIRT_DARK = '#cc7a2e'
const SHIRT_FAR = '#b56a28'
const PANTS = '#5b6f94'
const PANTS_DARK = '#4c5f82'
const SHOE = '#6b4a36'
const TOWEL = '#ffffff'
const SUN = '#ffd24a'
const HILL_BACK = '#dcefc9'
const GRASS = '#c5e8a9'
const GRASS_EDGE = '#74b955'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const RIDGE = '#8c5b3c'
const DRY = '#d8b48a'
const WATER = '#7cc4f2'
const WATER_LIGHT = '#d8effc'
const SOIL = '#b07c52'
const SOIL_DARK = '#8f6340'
const SOIL_DEEP = '#7a5a45'
const ROCK = '#c9b79e'
const POLE = '#b8844f'
const FLAG = '#e8534a'
const WOOD = '#b07a48'
const IRON = '#8d99a6'

/** くぎり の時間(秒) */
const ARRIVE_FROM = 0.4
const ARRIVE_TO = 1.5
/** 「ふう」と ひといき。そのあと くわを ふりかぶる */
const SIGH = 1.6
const RAISE_FROM = 2.05
const RAISE_TO = 2.45
/** くわを うつ しゅんかん(1回ごとに たんぼが ひとつ 水で いっぱいになる) */
const STRIKES: readonly number[] = [2.7, 3.25, 3.8, 4.35]
const SWING_DOWN = 0.15
/** くわを 土に さしたまま、手を はなす */
const RELEASE = 4.5
const WALK_FROM = 4.75
const WALK_TO = 5.55
const HOIST_FROM = 5.75
const HOIST_TO = 6.85
const CHEER = 6.95
const INK = 7.5
const DONE = 10.8
const DURATION = 11.3

type Pt = readonly [number, number]

/** 地面の たかさ(人の 足もと) */
const FLOOR = 69
/** 人が くわを うつ ばしょ と、そのときの かた */
const DIG_X = 10
const DIG_SHOULDER: Pt = [DIG_X, FLOOR - 19]
/** 旗ざお(5画目)の x と、ロープの x */
const POLE_X = 54
const ROPE_X = 50.6
const FLAG_LOW = 59
const FLAG_HIGH = 22

/* ───────── たんぼ ───────── */

/** 4つの 田(あぜ の 内がわ)。くわを うつ じゅんに ならべる: 左上 → 左下 → 右上 → 右下 */
const PLOTS: readonly (readonly Pt[])[] = [
  [[27.4, 24], [52.3, 21.6], [52.3, 33.6], [29.2, 35.2]],
  [[29.8, 38.7], [52.3, 37], [52.3, 49.9], [32, 51.2]],
  [[55.7, 21.1], [81, 20.3], [81.3, 31.5], [55.7, 33.3]],
  [[55.7, 36.7], [80.6, 34.8], [78.1, 48.1], [55.7, 49.7]],
]

const toPath = (points: readonly Pt[]) => `M${points.map(([x, y]) => `${x} ${y}`).join(' L')} Z`
const centerOf = (points: readonly Pt[]): Pt => [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]
const shrink = (points: readonly Pt[], k: number): Pt[] => {
  const [cx, cy] = centerOf(points)
  return points.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k])
}

/** 田の 苗。3ぼん ずつ、風で ゆれる */
function Seedlings({ center, grow, t }: { readonly center: Pt; readonly grow: number; readonly t: number }) {
  if (grow <= 0) return null
  return (
    <>
      {[-7, -0.5, 6.5].map((dx, i) => (
        <Layer key={dx} x={center[0] + dx} y={center[1] + 3 - i * 0.6} scale={grow} rotate={wave(t, 2.4, i * 0.5) * 5}>
          <path d="M0 0 Q-1 -3 -2.8 -5.2 M0 0 Q0.2 -3.6 0 -6.4 M0 0 Q1 -3 2.8 -5.2" fill="none" stroke={LEAF_DARK} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0 0 Q0.2 -3.6 0 -6.4" fill="none" stroke={LEAF} strokeWidth="0.8" strokeLinecap="round" />
        </Layer>
      ))}
    </>
  )
}

function Field({ t }: SceneProps) {
  return (
    <>
      {PLOTS.map((plot, k) => {
        const wetAt = STRIKES[k] + 0.2
        const wet = span(t, wetAt, wetAt + 0.4)
        return (
          <g key={k}>
            <path d={toPath(plot)} fill={DRY} />
            <path d={toPath(plot)} fill={WATER} opacity={wet} />
            <path d={toPath(shrink(plot, 0.6))} fill={WATER_LIGHT} opacity={wet * 0.35} />
            <Seedlings center={centerOf(plot)} grow={span(t, wetAt + 0.5, wetAt + 0.95, backOut)} t={t} />
          </g>
        )
      })}
      {/* あぜ(1〜4画目)。もともと ある 土の もりあがり */}
      <Bone char={CHAR} n={1} color={RIDGE} width={3.4} />
      <Bone char={CHAR} n={2} color={RIDGE} width={3.4} />
      <Bone char={CHAR} n={3} color={RIDGE} width={3.4} />
      <Bone char={CHAR} n={4} color={RIDGE} width={3.4} />
    </>
  )
}

/* ───────── 旗ざお ───────── */

/** ロープを ひっぱる ふたりぶん(かわりばんこ)。0〜1 の三角波 */
const tri = (x: number) => 1 - Math.abs(2 * (((x % 1) + 1) % 1) - 1)

function Pole({ t }: SceneProps) {
  const hoist = span(t, HOIST_FROM, HOIST_TO, easeInOut)
  const flagY = FLAG_LOW + (FLAG_HIGH - FLAG_LOW) * hoist
  // ひっぱり上げる いきおいで はためく。上がりきると 風で ゆるやかに
  const flutter = wave(t, 0.55) * (0.5 + 0.5 * hoist)
  const cloth = `M${POLE_X + 2.2} ${flagY} Q${POLE_X + 9.5} ${flagY - 1.8 * flutter} ${POLE_X + 17} ${flagY + 0.5 * flutter} L${POLE_X + 17} ${flagY + 9.6 + 0.5 * flutter} Q${POLE_X + 9.5} ${flagY + 9.6 - 1.8 * flutter} ${POLE_X + 2.2} ${flagY + 9.6} Z`
  return (
    <>
      {/* ロープ: 左の すじを ひっぱると、右の すじと 旗が 上がる */}
      <path d={`M${ROPE_X} 66 V25 Q${ROPE_X} 20.8 ${POLE_X} 20.8 Q${POLE_X + 2.4} 20.8 ${POLE_X + 2.4} 25 V66`} fill="none" stroke="#7a5a3a" strokeWidth="0.55" strokeLinecap="round" />
      <circle cx={ROPE_X} cy={30 + 34 * hoist} r="0.9" fill="#7a5a3a" />
      <Bone char={CHAR} n={5} color={POLE} width={3.3} />
      <circle cx="53.9" cy="19.2" r="2.3" fill={SUN} />
      <path d={cloth} fill={FLAG} />
      <circle cx={POLE_X + 9.6} cy={flagY + 4.8 + 0.2 * flutter} r="2.3" fill="#fff4d6" />
    </>
  )
}

/* ───────── 家 ───────── */

function House({ t }: SceneProps) {
  // 旗が 上がって、人が よろこぶころ、まどに あかりが つき、えんとつから けむりが のぼる
  const home = span(t, HOIST_TO - 0.1, HOIST_TO + 0.4)
  return (
    <>
      <rect x="99" y="50.5" width="3.6" height="8" rx="0.8" fill="#b9684c" />
      <rect x="88.5" y="59" width="14" height="10" rx="1" fill="#f3e2c0" />
      <path d="M85.2 60.4 L95.5 50 L105.8 60.4 Z" fill="#d9593f" stroke="#d9593f" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="93.8" y="62.6" width="3.6" height="6.4" rx="1.2" fill={RIDGE} />
      <rect x="89.8" y="62" width="2.8" height="2.8" rx="0.5" fill="#6b7b8f" />
      <rect x="89.8" y="62" width="2.8" height="2.8" rx="0.5" fill="#ffe07a" opacity={home} />
      {home > 0 &&
        [0, 0.7, 1.4].map((offset) => {
          const p = ((t + offset) % 2.1) / 2.1
          return <circle key={offset} cx={100.8 + wave(t, 1.6, offset) * 1.4 + p * 3} cy={49 - p * 15} r={1.5 + p * 2.6} fill="#ffffff" stroke="#d6dfe8" strokeWidth="0.4" opacity={(1 - p) * 0.95 * home} />
        })}
    </>
  )
}

/* ───────── 空と 地面 ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      <g fill="#ffffff" opacity="0.92" transform={`translate(${t * 1.5} 0)`}>
        <ellipse cx="62" cy="7" rx="7" ry="3.2" />
        <ellipse cx="67" cy="5.4" rx="5" ry="3.2" />
        <ellipse cx="94" cy="14" rx="6" ry="2.6" />
        <ellipse cx="98.5" cy="12.6" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** 土の だんめん。上は 草の はえた 地面(6画目)、下は 岩の そう(7画目) */
function Earth({ t }: SceneProps) {
  // 土の中を ミミズが ゆっくり すすむ
  const crawl = wave(t, 2.6) * 2
  return (
    <>
      <path d="M-6 69 Q14 52 40 56 Q70 50 115 62 V70 H-6 Z" fill={GRASS} />
      <rect x="-2" y="70" width="113" height="40" fill={SOIL} />
      <rect x="-2" y="87" width="113" height="23" fill={SOIL_DEEP} />
      {[[8, 76, 1.4], [24, 81, 1.1], [38, 77, 1.5], [67, 83, 1.3], [96, 78, 1.2], [84, 84, 1], [30, 98, 1.6], [70, 100, 1.4], [100, 96, 1.2]].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={SOIL_DARK} />
      ))}
      <path d={`M72 78.6 q3 ${-2 + crawl} 6 0 t6 0 t5 0`} fill="none" stroke="#e08a8a" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="-2" y="67.6" width="113" height="3.4" rx="1.7" fill={GRASS_EDGE} />
      <Bone char={CHAR} n={6} color={GRASS_EDGE} width={3.6} />
      <Bone char={CHAR} n={7} color={ROCK} width={3.4} />
    </>
  )
}

/* ───────── 人 ───────── */

type Mood = 'tired' | 'work' | 'happy'

const ARM_PART = 6.2

/** かた から 手に のばす 2つの ほね。ひじ は 下か うしろへ まがる。 */
function reach(shoulder: Pt, target: Pt): { readonly elbow: Pt; readonly hand: Pt } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const d = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const h = Math.sqrt(Math.max(ARM_PART * ARM_PART - (d / 2) ** 2, 0))
  const candidates: Pt[] = [[-uy, ux], [uy, -ux]]
  const [px, py] = candidates.reduce((best, c) => (c[1] - 0.4 * c[0] > best[1] - 0.4 * best[0] ? c : best))
  return {
    elbow: [shoulder[0] + (ux * d) / 2 + px * h, shoulder[1] + (uy * d) / 2 + py * h],
    hand: [shoulder[0] + ux * d, shoulder[1] + uy * d],
  }
}

function Arm({ shoulder, target, color }: { readonly shoulder: Pt; readonly target: Pt; readonly color: string }) {
  const { elbow, hand } = reach(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2" fill={SKIN} />
    </>
  )
}

function Face({ mood, hx, hy }: { readonly mood: Mood; readonly hx: number; readonly hy: number }) {
  return (
    <>
      <circle cx={hx + 1.2} cy={hy + 2.4} r="1.3" fill="#ff9d9d" opacity="0.6" />
      {mood === 'tired' && (
        <>
          <path d={`M${hx + 1.2} ${hy - 1.8} l3 0.8`} stroke={HAIR} strokeWidth="0.8" strokeLinecap="round" />
          <circle cx={hx + 2.8} cy={hy - 0.2} r="0.8" fill="#2b2b2b" />
          <ellipse cx={hx + 3.6} cy={hy + 3} rx="0.8" ry="1.1" fill="#b9483f" />
        </>
      )}
      {mood === 'work' && (
        <>
          <path d={`M${hx + 1.2} ${hy - 2} l3 0.9`} stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <circle cx={hx + 2.9} cy={hy - 0.2} r="0.9" fill="#2b2b2b" />
          <path d={`M${hx + 2.2} ${hy + 3.2} h2.2`} stroke="#b9483f" strokeWidth="0.9" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d={`M${hx + 1.6} ${hy - 0.1} Q${hx + 2.9} ${hy - 1.9} ${hx + 4.2} ${hy - 0.1}`} fill="none" stroke="#2b2b2b" strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${hx + 2.2} ${hy + 2.3} Q${hx + 3.5} ${hy + 4.8} ${hx + 4.7} ${hy + 2.3} Z`} fill="#b9483f" />
        </>
      )}
    </>
  )
}

type PersonProps = {
  /** 足もとの x と y */
  readonly fx: number
  readonly fy: number
  readonly mood: Mood
  /** あるくときの 足の ふり(-1〜1) */
  readonly stride: number
  readonly tilt: number
  readonly near: Pt
  readonly far: Pt
  /** 手に もっている もの(くわ)。からだ と てまえの うで の間に 描く */
  readonly holding?: React.ReactNode
}

function Person({ fx, fy, mood, stride, tilt, near, far, holding }: PersonProps) {
  const shoulder: Pt = [fx, fy - 19]
  const hx = fx + 0.5
  const hy = fy - 27.4
  return (
    <>
      <Arm shoulder={shoulder} target={far} color={SHIRT_FAR} />
      <Layer rotate={stride * 20} origin={[fx + 0.8, fy - 9.5]}>
        <rect x={fx - 1} y={fy - 10} width="3.6" height="9.6" rx="1.8" fill={PANTS_DARK} />
        <ellipse cx={fx + 1.8} cy={fy - 0.9} rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      <Layer rotate={-stride * 20} origin={[fx - 0.8, fy - 9.5]}>
        <rect x={fx - 2.6} y={fy - 10} width="3.6" height="9.6" rx="1.8" fill={PANTS} />
        <ellipse cx={fx - 0.6} cy={fy - 0.9} rx="3" ry="1.6" fill={SHOE} />
      </Layer>
      <rect x={fx - 1.6} y={fy - 24} width="3.2" height="4" rx="1.4" fill={SKIN_SHADE} />
      <rect x={fx - 4.4} y={fy - 21} width="8.8" height="12.4" rx="4" fill={SHIRT} />
      <path d={`M${fx - 4} ${fy - 12.6} h8`} stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {holding}
      <Arm shoulder={shoulder} target={near} color={SHIRT_DARK} />
      <Layer rotate={tilt} origin={[fx, fy - 22.8]}>
        <circle cx={hx} cy={hy} r="5.2" fill={SKIN} />
        <path d={`M${hx - 5.3} ${hy + 1.2} C${hx - 6.2} ${hy - 6} ${hx + 1} ${hy - 8} ${hx + 4.8} ${hy - 3.8} C${hx + 1.6} ${hy - 4.2} ${hx - 1.4} ${hy - 3} ${hx - 2.6} ${hy + 1.8} Z`} fill={HAIR} />
        {/* てぬぐいの はちまき */}
        <path d={`M${hx - 5.1} ${hy - 2.2} Q${hx} ${hy - 4.6} ${hx + 5} ${hy - 2.4}`} fill="none" stroke={TOWEL} strokeWidth="1.7" strokeLinecap="round" />
        <Face mood={mood} hx={hx} hy={hy} />
      </Layer>
    </>
  )
}

/* ───────── くわ ───────── */

type HoePose = { readonly grip: Pt; readonly angle: number }
const HOE_LEN = 17

const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]
const lerpPose = (a: HoePose, b: HoePose, k: number): HoePose => ({ grip: lerpPt(a.grip, b.grip, k), angle: a.angle + (b.angle - a.angle) * k })
const dirOf = (angle: number): Pt => [Math.cos((angle * Math.PI) / 180), Math.sin((angle * Math.PI) / 180)]

/** かた(shoulder)を もとに、かつぐ・ふりかぶる・うつ の 3つの かっこうを つなぐ */
function hoeHeld(t: number, shoulder: Pt): HoePose {
  const carry: HoePose = { grip: [shoulder[0] + 4, shoulder[1] + 2.5], angle: -152 }
  const up: HoePose = { grip: [shoulder[0] + 2.5, shoulder[1] - 5], angle: -125 }
  const hit: HoePose = { grip: [shoulder[0] + 8, shoulder[1] + 6.5], angle: 46 }
  // 1: ふりかぶった / 0: うった。うつたびに ふりおろして、さいごの 1回は そのまま 土に さす
  const raised = STRIKES.reduce((a, at, k) => {
    if (t < at - SWING_DOWN) return a
    const down = span(t, at - SWING_DOWN, at, easeIn)
    const rise = k === STRIKES.length - 1 ? 0 : span(t, at + 0.05, at + 0.32, easeOut)
    return 1 - down + rise
  }, 1)
  return lerpPose(carry, lerpPose(hit, up, raised), span(t, RAISE_FROM, RAISE_TO, easeInOut))
}

function Hoe({ pose }: { readonly pose: HoePose }) {
  const [dx, dy] = dirOf(pose.angle)
  const nx = -dy
  const ny = dx
  const [gx, gy] = pose.grip
  const back: Pt = [gx - dx * 4.2, gy - dy * 4.2]
  const tip: Pt = [gx + dx * HOE_LEN, gy + dy * HOE_LEN]
  // はがね の 刃: くわの さきから、うつ人の ほうへ まがる
  const p1: Pt = [tip[0] - dx * 1.6, tip[1] - dy * 1.6]
  const p2: Pt = [tip[0] + dx * 1, tip[1] + dy * 1]
  const blade = [p1, p2, [p2[0] + nx * 5.2, p2[1] + ny * 5.2], [p1[0] + nx * 5.2, p1[1] + ny * 5.2]] as const
  return (
    <>
      <path d={`M${back[0]} ${back[1]} L${tip[0]} ${tip[1]}`} stroke={WOOD} strokeWidth="1.9" strokeLinecap="round" />
      <path d={toPath(blade)} fill={IRON} stroke={IRON} strokeWidth="0.8" strokeLinejoin="round" />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** うつたびの つちけむり・とびちる つちの かたまり・もりあがる つち */
const DIG_TIP_X = 29.8
const CLUMPS: readonly (readonly [number, number])[] = [[5, -26], [11, -20], [-2, -18]]

function Digging({ t }: SceneProps) {
  return (
    <>
      {STRIKES.map((at, k) => {
        const u = t - at
        const mound = span(t, at + 0.1, at + 0.3, backOut)
        return (
          <g key={at}>
            <ellipse cx={22.5 + k * 3.6} cy="68.2" rx={Math.max(0, 3.2 * mound)} ry={Math.max(0, 1.9 * mound)} fill={SOIL_DARK} />
            {u > 0 && u < 0.6 && <ellipse cx={DIG_TIP_X} cy="68.6" rx={1.5 + u * 10} ry={0.8 + u * 3.6} fill="#ead9bf" opacity={(1 - u / 0.6) * 0.7} />}
            {u > 0 && u < 0.46 && CLUMPS.map(([vx, vy], i) => <circle key={i} cx={DIG_TIP_X + vx * u} cy={68 + vy * u + 55 * u * u} r={1.1 + i * 0.25} fill={SOIL_DARK} />)}
          </g>
        )
      })}
    </>
  )
}

function Sweat({ t, fx, fy }: { readonly t: number; readonly fx: number; readonly fy: number }) {
  const show = during(t, ARRIVE_FROM + 0.2, SIGH + 0.3, 0.2)
  if (show <= 0) return null
  return (
    <g opacity={show}>
      {[0, 0.4].map((offset) => {
        const p = ((t + offset) % 0.8) / 0.8
        return <path key={offset} d="M0 -2.2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2.2 Z" fill={WATER} transform={`translate(${fx - 4 - p * 3} ${fy - 33 + p * 6}) rotate(-25)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** 「ふう」と ひといき。口もとから 右へ */
function Sigh({ t, fx, fy }: { readonly t: number; readonly fx: number; readonly fy: number }) {
  const show = during(t, SIGH, RAISE_FROM + 0.3, 0.2)
  if (show <= 0) return null
  const p = span(t, SIGH, RAISE_FROM + 0.3, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={fx + 7 + p * 6} cy={fy - 25 - p * 3} rx={2.2 + p * 2.2} ry={1.5 + p * 1.4} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={fx + 6.4 + p * 2.5} cy={fy - 24.4 - p} rx={1.1 + p * 0.8} ry={0.8 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** 手の ばしょ: くわを もつ → あるく(うでを ふる) → ロープを ひく → ばんざい */
function handsAt(t: number, shoulder: Pt, stride: number): { readonly near: Pt; readonly far: Pt } {
  const swing = (deg: number): Pt => [shoulder[0] + Math.sin((deg * Math.PI) / 180) * 11.4, shoulder[1] + Math.cos((deg * Math.PI) / 180) * 11.4]
  const free = { near: swing(6 + stride * 28), far: swing(2 - stride * 28) }
  const hoe = hoeHeld(t, shoulder)
  const [dx, dy] = dirOf(hoe.angle)
  const hold = span(t, RAISE_FROM - 0.4, RAISE_FROM)
  const holding = {
    near: hoe.grip,
    far: lerpPt(swing(2 - stride * 28), [hoe.grip[0] - dx * 3.2, hoe.grip[1] - dy * 3.2], hold),
  }
  const base = t < RELEASE ? holding : free
  const pull = (t - HOIST_FROM) / (HOIST_TO - HOIST_FROM)
  const rope = { near: [ROPE_X - 0.4, 53 + 7 * tri(pull * 3)] as Pt, far: [ROPE_X - 0.4, 53 + 7 * tri(pull * 3 + 0.5)] as Pt }
  const toRope = span(t, HOIST_FROM - 0.3, HOIST_FROM, easeInOut)
  const roped = { near: lerpPt(base.near, rope.near, toRope), far: lerpPt(base.far, rope.far, toRope) }
  const cheer = { near: [shoulder[0] + 5, shoulder[1] - 10.5] as Pt, far: [shoulder[0] - 2, shoulder[1] - 11.5] as Pt }
  const toCheer = span(t, CHEER - 0.1, CHEER + 0.1)
  return { near: lerpPt(roped.near, cheer.near, toCheer), far: lerpPt(roped.far, cheer.far, toCheer) }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // あるく: 左から くわを うつ ばしょ まで、そのあと 旗ざおの そば まで
  const arrive = span(t, ARRIVE_FROM, ARRIVE_TO, easeOut)
  const over = span(t, WALK_FROM, WALK_TO, easeInOut)
  const fx = -14 + (DIG_X + 14) * arrive + (POLE_X - 11 - DIG_X) * over
  const walking = (t >= ARRIVE_FROM && t < ARRIVE_TO) || (t >= WALK_FROM && t < WALK_TO)
  const settle = 1 - span(t, ARRIVE_TO - 0.25, ARRIVE_TO) * (t < WALK_FROM ? 1 : 0) - span(t, WALK_TO - 0.25, WALK_TO) * (t >= WALK_FROM ? 1 : 0)
  const stride = walking ? Math.sin(t * Math.PI * 2 * 1.9) * settle : 0
  const cheerHop = 3 * Math.abs(Math.sin(span(t, CHEER, CHEER + 0.6) * Math.PI * 2))
  const fy = FLOOR - Math.abs(stride) * 0.9 - cheerHop

  const mood: Mood = t < RAISE_FROM - 0.1 ? 'tired' : t < STRIKES[STRIKES.length - 1] + 0.2 ? 'work' : 'happy'
  const tilt = t < RAISE_FROM - 0.1 ? 6 : t < RELEASE ? 2 : t < HOIST_FROM ? mix(t, RELEASE, RELEASE + 0.3, 2, -5) : -7
  const shoulder: Pt = [fx, fy - 19]
  const hands = handsAt(t, shoulder, stride)
  const hoePose = hoeHeld(t, t < RELEASE ? shoulder : DIG_SHOULDER)
  const land = span(t, 0, 0.6, backOut)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Layer opacity={Math.min(1, land * 1.4)} scaleY={0.9 + 0.1 * land} origin={[54.5, 109]}>
          <path d="M-6 69 Q8 26 54 11 Q100 26 115 69 Z" fill={HILL_BACK} />
          <Field t={t} />
          <House t={t} />
          <Earth t={t} />
          <Pole t={t} />
        </Layer>
        <Digging t={t} />
        <Sweat t={t} fx={fx} fy={fy} />
        <Sigh t={t} fx={fx} fy={fy} />
        <Person fx={fx} fy={fy} mood={mood} stride={stride} tilt={tilt} near={hands.near} far={hands.far} holding={t < RELEASE ? <Hoe pose={hoePose} /> : null} />
        {t >= RELEASE && <Hoe pose={hoePose} />}
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
    { at: 0, label: '旗ざおの 立つ 土地が ひろがる', sound: 'pop' },
    { at: ARRIVE_FROM, label: 'つかれた人が くわを かついで あるいてくる' },
    { at: SIGH, label: 'ふう と ひといき。くわを ふりかぶる' },
    { at: STRIKES[0], label: 'くわで たがやす。たんぼに 水が はいって 苗が そだつ', sound: 'pop' },
    { at: WALK_FROM, label: '4つの たんぼが 青々。人は 旗ざおの そばへ' },
    { at: HOIST_FROM, label: 'ロープを ひいて 旗を あげる' },
    { at: CHEER, label: 'うれしくて ぴょんぴょん。家に あかりと けむり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '里 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
