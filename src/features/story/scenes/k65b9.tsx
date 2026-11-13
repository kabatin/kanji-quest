/*
 * 方(ほう): すきで つちを たがやす。おす ほうへ すすむ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … すきの いちばん上の、にぎりの ぼう
 *   2画目(一)  … すきの よこに ながい とって(てを かけて おす)
 *   3画目(𠃍)  … おす子の からだ(かた から せなか、さいごは 前に出した あし)
 *   4画目(ノ)  … すきの ながい え(とって から 下へ。さきは つちの中の はさき)
 *
 * ながれ
 *   はたけが ひろがる → すきを もった子が あるいてくる
 *   → はさきを つちに さす。つちが かたくて うごかない(こまった顔・あせ)
 *   → 足を ふんばり、からだごと ぐーっと おす(ひっしな顔)
 *   → ぐらっと うごいて、かたい つちが ほりおこされる。子は にっこり(小鳥も やってくる)
 *   → すき と 子が ほね に なって ひかり、絵が うすくなり、字「方」が のこる
 *
 * すきも 子も、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがり、手は とって を にぎる(あいだは IK で つなげる)。
 *   すきの はさき は 鉄で、つちの中に 入る。おす ほうへ はさき が むく。
 */
import { during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '方'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const BAND = '#e8534a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const WOOD = '#9a6a42'
const WOOD_DARK = '#70452b'
const IRON = '#9fb0c0'
const IRON_DARK = '#7a8b9c'
const SOIL = '#d9a46f'
const SOIL_DARK = '#8f5c3a'
const SOIL_LIGHT = '#a8704a'
const CRACK = '#a87245'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const SWEAT = '#7cc4f2'

/** くぎり の時間(秒) */
const ENTER = 0.3
const DROP = 1.7
const STUCK = 2.0
const PUSH = 3.2
const FREE = 5.0
const INK = 6.4
const DONE = 9.0
const DURATION = 10

/** 子が あるいて入ってくる はじめの ずれ と、つちに さして とまる ばしょ の ずれ(右へ) */
const START_X = 62
const STUCK_X = 22
/** すきの はさき の さきっぽ(ここを じく に すきが かたむく) */
const TIP: readonly [number, number] = [14, 93]
/** からだの じく: こし */
const HIP: readonly [number, number] = [66, 73]
/** かた(てまえ・むこう) */
const SHOULDER_NEAR: readonly [number, number] = [66, 51]
const SHOULDER_FAR: readonly [number, number] = [67.6, 51]
/** とって の にぎる ばしょ(2画目の線の上) */
const GRIP_NEAR: readonly [number, number] = [56.5, 29.6]
const GRIP_FAR: readonly [number, number] = [64, 28.6]
/** うで の ほね1本の長さ */
const ARM_PART = 13
/** 子は すきの うしろに 立つので、とって から 少し はなして おく(うでが 前へ のびて、顔が かくれない) */
const BODY_X = 8
const HEAD: readonly [number, number] = [67.2, 42.6]
const NECK: readonly [number, number] = [66.6, 49]

type Point = readonly [number, number]
type Mood = 'calm' | 'troubled' | 'push' | 'happy'

const rotateAround = (p: Point, origin: Point, deg: number): Point => {
  const rad = (deg * Math.PI) / 180
  const dx = p[0] - origin[0]
  const dy = p[1] - origin[1]
  return [origin[0] + dx * Math.cos(rad) - dy * Math.sin(rad), origin[1] + dx * Math.sin(rad) + dy * Math.cos(rad)]
}

/** 子が ぜんぶ の動きの もと になる 数字 */
type Motion = {
  /** 子と すきを まとめて ずらす よこの量(0 = できあがりの ばしょ) */
  readonly gx: number
  /** すきの はさき を もちあげている量 / かたむき */
  readonly lift: number
  readonly tilt: number
  /** あしの ふり(-1〜1)と、からだの かたむき(ま下から まえへ 負) */
  readonly stride: number
  readonly lean: number
  readonly mood: Mood
}

function motionAt(t: number): Motion {
  const walkIn = mix(t, ENTER, DROP, START_X, STUCK_X, easeOut)
  const pushed = mix(t, PUSH, FREE, STUCK_X, 0, easeOut)
  const gx = t < PUSH ? walkIn : pushed
  // あるくのは、はたけに 入る間 と、おして すすむ間 だけ。足の ふりは すすんだ きょり に合わせる(すべらない)
  const walking = t < DROP ? 1 : t >= PUSH && t < FREE + 0.2 ? 1 - span(t, FREE - 0.5, FREE + 0.2) : 0
  const stride = Math.sin(((START_X - gx) * Math.PI * 2) / 25) * walking * (t < DROP ? 0.9 : 0.7)
  // はさきを つちに さす: ちょっと うかせて いたのを、すとんと おろす
  const lift = 4 * (1 - span(t, DROP - 0.15, DROP + 0.15))
  // うごかない とき すきが ぷるぷる、おす とき まえに かたむく
  const shake = t >= STUCK && t < PUSH ? Math.sin(t * 38) * 0.9 * span(t, STUCK, STUCK + 0.3) : 0
  const tilt = shake + mix(t, PUSH, PUSH + 0.4, 0, -2.5, easeOut) * (1 - span(t, FREE, FREE + 0.6))
  // からだは 子の ふんばり に合わせて まえへ かたむく
  const press = span(t, STUCK + 0.3, PUSH - 0.1, easeInOut)
  const lean = t < STUCK ? -3 : t < PUSH ? mix(t, STUCK, PUSH, -4, -10, easeInOut) + shake * 1.2 * press : mix(t, PUSH, FREE, -10, -4, easeOut) * (1 - span(t, FREE, FREE + 0.9)) - 3 * span(t, FREE, FREE + 0.9) * (1 - span(t, INK - 0.4, INK - 0.1))
  const mood: Mood = t < DROP + 0.1 ? 'calm' : t < PUSH - 0.4 ? 'troubled' : t < FREE ? 'push' : 'happy'
  return { gx, lift, tilt, stride, lean, mood }
}

/** すき の ほね の点が、すきの かたむき・もちあげ で どこへ うごくか */
function plowPoint(p: Point, m: Motion): Point {
  const r = rotateAround(p, TIP, m.tilt)
  return [r[0], r[1] - m.lift]
}

/** かた から ひじ を通って 手 へ。ほね2本が つながる(にぎる ばしょ に とどかないときは のばしきる)。 */
function armPoints(shoulder: Point, grip: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = grip[0] - shoulder[0]
  const dy = grip[1] - shoulder[1]
  const dist = Math.hypot(dx, dy)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const half = reach / 2
  const bulge = Math.sqrt(Math.max(ARM_PART * ARM_PART - half * half, 0))
  const mid: Point = [shoulder[0] + ux * half, shoulder[1] + uy * half]
  // ひじ は 下(まえ下)へ まがる
  const a: Point = [mid[0] - uy * bulge, mid[1] + ux * bulge]
  const b: Point = [mid[0] + uy * bulge, mid[1] - ux * bulge]
  const elbow = a[1] >= b[1] ? a : b
  return { elbow, hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach] }
}

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[93, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="92.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 93 14)`} />
        ))}
      </Layer>
      <circle cx="93" cy="14" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 90 Q18 66 44 82 Q72 62 113 85 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="16" rx="7" ry="3.2" />
        <ellipse cx="7" cy="14" rx="5" ry="3.2" />
        <ellipse cx="60" cy="9" rx="5.4" ry="2.4" />
        <ellipse cx="64" cy="7.6" rx="4" ry="2.6" />
      </g>
      {/* はたけ: かたく かわいた つち。ひびわれ が ある */}
      <ellipse cx="54.5" cy="97" rx="58" ry="8.5" fill={SOIL} />
      <g fill="none" stroke={CRACK} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 95 l4 -2 l3 2 l4 -1" />
        <path d="M7 93 l1 3 l-2 3" />
        <path d="M45 99 l5 -1.6 l3 2 l6 -1" />
        <path d="M50 98 l-1 -3" />
        <path d="M86 97 l4 -2 l4 1.6 l5 -1.4" />
        <path d="M92 95 l1 4" />
        <path d="M72 100 l3 -1 l3 1.4" />
      </g>
      {[6, 44, 80, 104].map((x) => (
        <path key={x} d={`M${x} 90 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      <ellipse cx="54.5" cy="86.4" rx="58" ry="1.2" fill={GRASS} opacity="0.7" />
    </>
  )
}

/** ほりおこされた つち(はさき が とおった あと)。はさき から うしろへ のびる。 */
function Furrow({ bladeX }: { readonly bladeX: number }) {
  const width = STUCK_X + 16 - bladeX + 4
  if (width <= 6) return null
  const left = bladeX - 1
  return (
    <>
      <path d={`M${left} 98 Q${left + 1} 91.5 ${left + 6} 91.4 L${left + width - 3} 91.8 Q${left + width} 94 ${left + width - 2} 98 Z`} fill={SOIL_DARK} />
      {/* おこされた つちの かたまり */}
      {[0.12, 0.34, 0.58, 0.8].map((f, i) => (
        <ellipse key={f} cx={left + 4 + f * (width - 8)} cy={92.6 + (i % 2) * 1.4} rx={2.8 - (i % 2) * 0.5} ry={1.5} fill={SOIL_LIGHT} />
      ))}
    </>
  )
}

/** すき。字の画(1・2・4画目)の上に のせる。てまえに はさき。 */
function Plow() {
  return (
    <>
      {/* え(4画目)・とって(2画目)・にぎりの ぼう(1画目) */}
      <Bone char={CHAR} n={4} color={WOOD} width={5.2} />
      <Bone char={CHAR} n={2} color={WOOD} width={4.8} />
      <Bone char={CHAR} n={1} color={WOOD} width={4.6} />
      {/* 手の あたる ところ に 赤い ぬの を まく */}
      <ellipse cx={GRIP_NEAR[0]} cy={GRIP_NEAR[1] + 0.2} rx="3.4" ry="2.9" fill={BAND} />
      <ellipse cx={GRIP_FAR[0]} cy={GRIP_FAR[1] + 0.2} rx="3.4" ry="2.9" fill={BAND} />
      {/* えの うらがわ の かげ */}
      <path d="M52.6 38 Q44 56 33 72" fill="none" stroke={WOOD_DARK} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      {/* 鉄の はさき: えの さきに はめて、つちの中に さす */}
      <path d="M17.6 81.2 L24.6 86 L19.4 97 L9.6 95.2 Z" fill={IRON} />
      <path d="M17.6 81.2 L24.6 86 L23 89 L15.4 84.6 Z" fill={IRON_DARK} />
      <circle cx="20" cy="84" r="0.9" fill={IRON_DARK} />
    </>
  )
}

type PersonProps = {
  readonly m: Motion
  readonly t: number
}

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  const eye = '#2b2b2b'
  const mouth = '#b9483f'
  return (
    <>
      <circle cx="62.4" cy="46.6" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'calm' && (
        <>
          <circle cx="62.6" cy="43.2" r="1.1" fill={eye} />
          <path d="M60.8 47.6 Q62.4 49 64.2 47.8" fill="none" stroke={mouth} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'troubled' && (
        <>
          <path d="M60.4 40.8 l3.2 -1.2" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx="62.6" cy="43.4" r="1.15" fill={eye} />
          <path d="M60.6 48.6 q1.2 -1.4 2.4 0 q1.2 1.4 2.4 0" fill="none" stroke={mouth} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'push' && (
        <>
          <path d="M60.2 40.2 l3.6 1.4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M61.2 43.4 l2.6 0.6" stroke={eye} strokeWidth="1.3" strokeLinecap="round" />
          <rect x="60.6" y="47" width="4.6" height="2.4" rx="1" fill="#ffffff" stroke={mouth} strokeWidth="0.8" />
          <path d="M62.9 47 v2.4" stroke={mouth} strokeWidth="0.6" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <path d="M61 43.8 Q62.6 41.8 64.2 43.8" fill="none" stroke={eye} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M60.6 47 Q62.8 51 65 47.2 Z" fill={mouth} />
        </>
      )}
      {/* はちまきの しっぽ: かぜ・うごき で ゆれる */}
      <path d={`M73.6 39.6 Q77 ${38 + wave(t, 0.5) * 1.2} 80 ${40 + wave(t, 0.5, 0.2) * 1.8}`} fill="none" stroke={BAND} strokeWidth="1.8" strokeLinecap="round" />
    </>
  )
}

function Person({ m, t }: PersonProps) {
  const stride = m.stride
  const nearShoulder = rotateAround(SHOULDER_NEAR, HIP, m.lean)
  const farShoulder = rotateAround(SHOULDER_FAR, HIP, m.lean)
  const toBody = (p: Point): Point => [p[0] - BODY_X, p[1]]
  const near = armPoints(nearShoulder, toBody(plowPoint(GRIP_NEAR, m)))
  const far = armPoints(farShoulder, toBody(plowPoint(GRIP_FAR, m)))
  const breath = wave(t, 1.6) * 0.3
  return (
    <Layer x={BODY_X}>
      {/* むこうの うで */}
      <path d={`M${farShoulder[0]} ${farShoulder[1]} L${far.elbow[0]} ${far.elbow[1]} L${far.hand[0]} ${far.hand[1]}`} fill="none" stroke={TUNIC_FAR} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={far.hand[0]} cy={far.hand[1]} r="3" fill={SKIN_SHADE} />
      {/* てまえの うで(あたまの うしろに まわして、顔を かくさない) */}
      <path d={`M${nearShoulder[0]} ${nearShoulder[1]} L${near.elbow[0]} ${near.elbow[1]} L${near.hand[0]} ${near.hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={near.hand[0]} cy={near.hand[1]} r="3.1" fill={SKIN} />
      {/* あし(こしから ふる)。てまえ = 前の足、むこう = うしろの足 */}
      <Layer rotate={-stride * 17} origin={[69, 71]}>
        <rect x="66" y="70" width="6" height="22.6" rx="3" fill={PANTS_DARK} />
        <ellipse cx="68.2" cy="93.2" rx="4.6" ry="2.5" fill={SHOE} />
      </Layer>
      <Layer rotate={stride * 17} origin={[63, 71]}>
        <rect x="60" y="70" width="6" height="22.6" rx="3" fill={PANTS} />
        <ellipse cx="58.2" cy="93.2" rx="4.6" ry="2.5" fill={SHOE} />
      </Layer>
      {/* うえの からだ: こしを じく に まえへ かたむく */}
      <Layer rotate={m.lean} origin={HIP}>
        <rect x="64.2" y="44" width="5" height="8" rx="2.2" fill={SKIN_SHADE} />
        <Layer scaleY={1 + breath * 0.04} origin={[66, 74]}>
          <rect x="59" y="48.6" width="14" height="26" rx="6.4" fill={TUNIC} />
          <path d="M61 67 h10" stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        </Layer>
        <Layer rotate={m.mood === 'push' ? -4 : m.mood === 'happy' ? 3 : 0} origin={NECK}>
          <circle cx={HEAD[0]} cy={HEAD[1]} r="7.4" fill={SKIN} />
          <path d="M59.9 41 C59.6 33.4 70 33 75.2 37.4 C77.6 40.4 77.2 46.4 75.8 50 C75 44.6 71 40.6 66 40.2 C63.4 40.4 61.2 40.6 59.9 41 Z" fill={HAIR} />
          <path d="M60 40.8 Q67.6 38 75.6 41" fill="none" stroke={BAND} strokeWidth="2" strokeLinecap="round" />
          <Face mood={m.mood} t={t} />
        </Layer>
      </Layer>
    </Layer>
  )
}

/** うごかない間の あせ。あたまから とびちる。 */
function Sweat({ t, m }: { readonly t: number; readonly m: Motion }) {
  const show = during(t, DROP + 0.2, PUSH + 0.2, 0.2)
  if (show <= 0) return null
  const head = rotateAround(HEAD, HIP, m.lean)
  return (
    <g opacity={show}>
      {[0, 0.45].map((offset) => {
        const p = ((t + offset) % 0.9) / 0.9
        return <path key={offset} d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(${head[0] + BODY_X + 7 + p * 6} ${head[1] - 6 + p * 9 - Math.sin(p * Math.PI) * 5}) rotate(20)`} opacity={1 - p} />
      })}
    </g>
  )
}

/** ほりおこされた つちが、はさき から とびだして うしろへ おちる。 */
function Clods({ t }: SceneProps) {
  const times = [3.3, 3.6, 3.9, 4.2, 4.5, 4.75]
  return (
    <>
      {times.map((spawn, i) => {
        const p = (t - spawn) / 0.8
        if (p <= 0 || p >= 1) return null
        const bladeX = 12 + motionAt(spawn).gx
        const x = bladeX + 4 + p * (12 + (i % 3) * 3)
        const y = 91 - Math.sin(p * Math.PI) * (12 + (i % 2) * 5) + p * 1.2
        return <ellipse key={spawn} cx={x} cy={y} rx={1.9 + (i % 2) * 0.6} ry={1.5} fill={SOIL_DARK} opacity={1 - p ** 3} />
      })}
    </>
  )
}

/** すきを さした しゅんかん の ほこり。 */
function Dust({ t }: SceneProps) {
  const p = span(t, DROP, DROP + 0.7)
  if (p <= 0 || p >= 1) return null
  const x = 8 + STUCK_X
  return (
    <g opacity={1 - p}>
      <ellipse cx={x - 8 * p} cy={90 - 3 * p} rx={2 + 3 * p} ry={1.5 + 2 * p} fill="#f3dfc2" />
      <ellipse cx={x + 12 * p} cy={90.4 - 2 * p} rx={1.6 + 2.6 * p} ry={1.2 + 1.6 * p} fill="#f3dfc2" />
    </g>
  )
}

/** おす ほうへ、左むきの やじるし が すすむ。 */
function Heading({ t }: SceneProps) {
  const show = during(t, PUSH, FREE + 0.8, 0.3)
  if (show <= 0) return null
  const slide = ((t * 6) % 4) * 0.6
  return (
    <g opacity={show * 0.9} fill="none" stroke="#ef7b3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${12 - slide} 54 l-3.4 3.6 l3.4 3.6`} transform={`translate(${i * 4.6} 0)`} opacity={0.45 + i * 0.25} />
      ))}
    </g>
  )
}

/** おこされた つちに 小鳥が とんできて、つちの中の むしを つつく。 */
function Bird({ t }: SceneProps) {
  const from = FREE + 0.2
  const arrive = span(t, from, from + 0.9, easeOut)
  if (arrive <= 0) return null
  const x = 8 + arrive * 25
  const y = 36 + arrive * 52 - Math.sin(arrive * Math.PI) * 14
  const landed = arrive >= 1
  const peck = landed ? Math.max(0, wave(t, 0.7)) * 2.4 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <>
      {landed && <path d="M36.4 90.6 q1.6 -1.6 3 0 q1.6 1.6 3 0" fill="none" stroke="#f08a99" strokeWidth="1.1" strokeLinecap="round" />}
      <Layer x={x} y={y}>
        <Layer rotate={peck * 6} origin={[0, 1]}>
          <path d="M3 0.4 l4.4 -1.5 l-3.2 3 Z" fill="#e2733f" />
          <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
          <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
          <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
          <circle cx="-3.6" cy="-2.8" r="0.55" fill="#2b2b2b" />
          <Layer rotate={flap} origin={[0.4, -0.6]}>
            <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
          </Layer>
        </Layer>
        <path d="M-0.6 3 v2.2 M1 3 v2.2" stroke="#e2733f" strokeWidth="0.6" strokeLinecap="round" />
      </Layer>
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  const m = motionAt(t)
  const fade = span(t, ENTER - 0.2, ENTER + 0.2)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  // ちからを こめる とき、子が ぶるぶる ふるえる
  const tremble = t >= STUCK && t < PUSH ? Math.sin(t * 45) * 0.45 : 0
  const bladeX = 12 + m.gx

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Furrow bladeX={t < PUSH ? STUCK_X + 12 : bladeX} />
        <Layer opacity={fade}>
          <ellipse cx={64 + m.gx} cy="96.4" rx="14" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={m.gx + tremble}>
            <Layer y={-m.lift} rotate={m.tilt} origin={TIP}>
              <Plow />
            </Layer>
            <Person m={m} t={t} />
            <Sweat t={t} m={m} />
          </Layer>
        </Layer>
        {/* はさきの まわり の つち(まえに もりあがる)。はさきが つちの中に あるように 見せる */}
        <Layer x={m.gx} opacity={fade}>
          <path d="M2 99 Q2 93.6 8 92.4 Q13 88.8 19 91.2 Q26 90.6 29 94.6 Q30 97 29 99 Z" fill={SOIL_DARK} />
          <ellipse cx="11" cy="90.6" rx="3" ry="1.3" fill={SOIL_LIGHT} />
          <ellipse cx="22" cy="92" rx="2.4" ry="1.1" fill={SOIL_LIGHT} />
        </Layer>
        <Dust t={t} />
        <Clods t={t} />
        <Heading t={t} />
        <Bird t={t} />
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
    { at: 0, label: 'かわいた はたけが ひろがる', sound: 'pop' },
    { at: ENTER, label: 'すきを もった子が やってくる' },
    { at: DROP, label: 'はさき を つちに さす', sound: 'pop' },
    { at: STUCK, label: 'つちが かたくて うごかない' },
    { at: PUSH, label: 'ふんばって、ぐーっと おす' },
    { at: FREE, label: 'うごいた! つちが おこされて にっこり', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '方 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
