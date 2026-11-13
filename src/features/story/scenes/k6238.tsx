/*
 * 戸(と): かたほうだけ ひらく とびら。大きな門の とびらを、子どもが ぐっと おして あける。
 *
 * ほね(画と絵の対応)
 *   1画目(一)   … 門の うえに わたした 木の はり(かもい)
 *   2画目(𠃍)   … とびらの うえの わく と、右の ちょうつがい(まど の ふち)
 *   3画目(一)   … とびらの まんなかの よこぎ(まど の した)
 *   4画目(ノ)   … ひらいた とびらの 左はし(あけた ほう の ふち)。さいごに 左下へ ななめに おちる
 *
 * ながれ
 *   門が たつ → 子どもが あるいてくる。上を ちょうちょが とんでいる
 *   → ちょうちょが 門の むこうへ きえて、子どもは がっかり
 *   → 「よし」と とびらを ぐっと おす → とびらが かたほうだけ ぱたんと ひらく
 *   → 中は おひさまの にわ。ちょうちょが いた! 子どもは とびはねて よろこぶ
 *   → ほね が ひかって、絵が うすくなり、字「戸」が のこる
 *
 * とびら・人は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   とびらは 右の ちょうつがい を じく に、おすと むこうへ ひらく(ひらくほど 左はし が ちぢみ、ゆかは 少し ななめに 見える)。
 *   門には 左にも とびらが あって、そちらは しまったまま(かたほうだけ ひらく)。
 *   人は うで が かた から出て ひじ で まがる。おす手は とびらの 面に つき、おわると だらんと おりる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '戸'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f0866a'
const TUNIC_DARK = '#d86d52'
const TUNIC_FAR = '#b95a44'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const DOOR = '#c98a54'
const DOOR_LINE = '#a9703f'
const GLASS = '#bfe6fb'
const GLASS_LIGHT = '#eaf8ff'
const WALL = '#f2e3c6'
const WALL_SHADE = '#e0cba5'
const WALL_CAP = '#c9ae86'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const SUN = '#ffd24a'
const WING = '#c78bf0'
const WING_LIGHT = '#ecd2fb'

/** くぎり の時間(秒) */
const ENTER = 0.7
const ARRIVE = 2.0
/** ちょうちょ が 門の むこうへ きえる */
const GONE = 3.1
/** とびらを おしはじめる / てを はなす / ぜんぶ ひらく */
const PUSH = 3.7
const RELEASE = 4.7
const OPENED = 5.6
const INK = 6.6
const DONE = 9.8
const DURATION = 10.4

/** 地面(子どもの あしもと)の たかさ */
const GROUND_Y = 96

/* ───────── とびら ───────── */

type Point = readonly [number, number]
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpPoint = (a: Point, b: Point, k: number): Point => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/** 右の ちょうつがい(うごかない) */
const HINGE_TOP: Point = [76, 33]
const HINGE_BOTTOM: Point = [76, GROUND_Y]
/** しまっているとき・ひらいたとき の、とびらの 左はし(あけた ほう の ふち) */
const FREE_TOP_CLOSED: Point = [3, 33]
const FREE_BOTTOM_CLOSED: Point = [3, GROUND_Y]
/** ひらいたとき: 4画目の ノ(33,37)→(15,95) に だいたい かさなる */
const FREE_TOP_OPEN: Point = [33, 37]
const FREE_BOTTOM_OPEN: Point = [15, 95]

/** とびらの 上の点。u = 左はし(0)から ちょうつがい(1) / v = 上(0)から 下(1)。open = 0(しまる)〜1(ひらく) */
function doorPoint(open: number, u: number, v: number): Point {
  const left = lerpPoint(lerpPoint(FREE_TOP_CLOSED, FREE_TOP_OPEN, open), lerpPoint(FREE_BOTTOM_CLOSED, FREE_BOTTOM_OPEN, open), v)
  const right = lerpPoint(HINGE_TOP, HINGE_BOTTOM, v)
  return lerpPoint(left, right, u)
}

const toPath = (points: readonly Point[]) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`
const quad = (open: number, u0: number, v0: number, u1: number, v1: number) => toPath([doorPoint(open, u0, v0), doorPoint(open, u1, v0), doorPoint(open, u1, v1), doorPoint(open, u0, v1)])
const line = (open: number, u0: number, v0: number, u1: number, v1: number) => {
  const a = doorPoint(open, u0, v0)
  const b = doorPoint(open, u1, v1)
  return `M${a[0].toFixed(2)} ${a[1].toFixed(2)} L${b[0].toFixed(2)} ${b[1].toFixed(2)}`
}

/** 大きな とびら。まどの わく が 字の 2・3画目、左はし が 4画目 になる */
function GateLeaf({ open }: { readonly open: number }) {
  const top = doorPoint(open, 0, 0)
  const topRight = doorPoint(open, 1, 0)
  const bottomRight = doorPoint(open, 1, 1)
  const bottom = doorPoint(open, 0, 1)
  const knob = doorPoint(open, 0.12, 0.62)
  return (
    <>
      <path d={toPath([top, topRight, bottomRight, bottom])} fill={DOOR} />
      {/* したの 板の すじ */}
      {[0.25, 0.5, 0.75].map((u) => (
        <path key={u} d={line(open, u, 0.42, u, 0.97)} stroke={DOOR_LINE} strokeWidth="0.9" strokeLinecap="round" fill="none" />
      ))}
      {/* まどの ガラス(うえの はこ) */}
      <path d={quad(open, 0.1, 0.08, 0.9, 0.34)} fill={GLASS} />
      <path d={quad(open, 0.18, 0.12, 0.34, 0.3)} fill={GLASS_LIGHT} opacity="0.8" />
      <path d={quad(open, 0.1, 0.08, 0.9, 0.34)} fill="none" stroke={BARK} strokeWidth="1.6" strokeLinejoin="round" />
      {/* まんなかの よこぎ */}
      <path d={line(open, 0.03, 0.375, 0.97, 0.375)} stroke={BARK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* ふち */}
      <path d={line(open, 0, 0, 1, 0)} stroke={BARK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={line(open, 0, 1, 1, 1)} stroke={BARK_DARK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d={line(open, 0, 0, 0, 1)} stroke={BARK_DARK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      {/* とって */}
      <circle cx={knob[0]} cy={knob[1]} r="1.7" fill="#f2b632" stroke={BARK_DARK} strokeWidth="0.5" />
    </>
  )
}

/* ───────── 門・にわ ───────── */

function Backdrop({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <circle cx="99" cy="5" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 84 44 94 Q72 80 113 95 V101 H-4 Z" fill="#e2f2d2" />
    </>
  )
}

/** かべ・門の はしら・はり。 */
function Wall() {
  return (
    <>
      <rect x="-2" y="9" width="113" height="90" fill={WALL} />
      <rect x="-2" y="9" width="113" height="3.4" fill={WALL_CAP} />
      <rect x="-2" y="90" width="113" height="9" fill={WALL_SHADE} />
      {/* はり(1画目)のした の かげ */}
      <g transform="translate(0 2.4)">
        <Bone char={CHAR} n={1} color={WALL_SHADE} width={4.6} />
      </g>
      <Bone char={CHAR} n={1} color={BARK} width={4.6} />
    </>
  )
}

/** 左の とびら(しまったまま)。すこしだけ 見える。 */
function LeftLeaf() {
  return (
    <>
      <rect x="-2" y="33" width="6" height="63" fill={DOOR} />
      <path d="M0.6 42 V94 M-1 42 V94" stroke={DOOR_LINE} strokeWidth="0.8" fill="none" />
      <rect x="-2" y="33" width="6" height="2" fill={BARK} />
      <rect x="3" y="33" width="1.6" height="63" fill={BARK_DARK} />
    </>
  )
}

/** あいた とびらの むこうの おひさまの にわ(のぞき見えるのは 左の すこし)。 */
function Garden({ t }: SceneProps) {
  return (
    <>
      <rect x="3" y="33" width="75" height="64" fill="#cdeefb" />
      <rect x="3" y="33" width="75" height="64" fill="#fff6c8" opacity="0.35" />
      <rect x="3" y="64" width="75" height="33" fill="#a8dc82" />
      <path d="M3 66 Q18 60 34 66 V70 H3 Z" fill="#8fcf72" />
      {/* 木 */}
      <rect x="19" y="52" width="3" height="19" rx="1.2" fill={BARK} />
      <circle cx="21" cy="46" r="9" fill={LEAF_DARK} />
      <circle cx="18.5" cy="43.5" r="6.6" fill={LEAF} />
      <circle cx="16.5" cy="41" r="2.6" fill={LEAF_LIGHT} />
      <circle cx="24.5" cy="48" r="1.5" fill="#e8534a" />
      {/* 花 */}
      {[
        [8, 86, '#ff8fab'],
        [14, 90, '#ffd24a'],
        [19.5, 86.5, '#ff8fab'],
        [25, 91, '#ffffff'],
      ].map(([x, y, color]) => (
        <g key={String(x)} transform={`rotate(${wave(t, 2.2, Number(x) * 0.1) * 5} ${x} ${Number(y) + 4})`}>
          <path d={`M${x} ${Number(y) + 1} v5`} stroke={LEAF_DARK} strokeWidth="1" strokeLinecap="round" />
          <circle cx={x} cy={y} r="2.1" fill={String(color)} />
          <circle cx={x} cy={y} r="0.8" fill="#ffb347" />
        </g>
      ))}
    </>
  )
}

/** 右の はしら(ちょうつがい のところ)と、とびらの うえの わく。 */
function FrameFront() {
  return (
    <>
      <rect x="76" y="27" width="6.4" height="71" rx="1.4" fill={BARK} />
      <rect x="1.6" y="27.5" width="80.8" height="5.6" rx="1.4" fill={BARK_DARK} />
      <circle cx="76.6" cy="40" r="1.2" fill="#f2b632" />
      <circle cx="76.6" cy="88" r="1.2" fill="#f2b632" />
    </>
  )
}

/** てまえの 地面。子どもは ここに たつ。 */
function FrontGround() {
  return (
    <>
      <rect x="-2" y="96" width="113" height="12" fill={GRASS} />
      {[6, 40, 66, 90, 106].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.8 l1 3.4 l1.6 -4.4 l0.8 4.8 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── ちょうちょ ───────── */

function Butterfly({ t, x, y, size = 1 }: SceneProps & { readonly x: number; readonly y: number; readonly size?: number }) {
  const flap = 0.3 + 0.7 * Math.abs(wave(t, 0.34))
  const wings = (side: 1 | -1) => (
    <g transform={`scale(${side * flap} 1)`}>
      <ellipse cx="3.4" cy="-1.8" rx="3.6" ry="2.7" fill={WING} transform="rotate(-18 3.4 -1.8)" />
      <ellipse cx="2.6" cy="1.8" rx="2.6" ry="2" fill={WING} />
      <circle cx="3.8" cy="-1.9" r="0.9" fill={WING_LIGHT} />
    </g>
  )
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${size})`}>
      {wings(1)}
      {wings(-1)}
      <ellipse cx="0" cy="0" rx="0.8" ry="2.7" fill={HAIR} />
      <path d="M0 -2.4 q-0.9 -1.8 -2.2 -2.2 M0 -2.4 q0.9 -1.8 2.2 -2.2" fill="none" stroke={HAIR} strokeWidth="0.5" strokeLinecap="round" />
    </g>
  )
}

/** 門の上を とんで、むこうがわへ きえる(かべの うしろに かくれる) */
function ButterflyAbove({ t }: SceneProps) {
  const show = span(t, 0.4, 0.7) * (t < 3.95 ? 1 : 0)
  if (show <= 0) return null
  const x = mix(t, 0.5, 3.7, 6, 92, easeInOut)
  const y = 5 + 1.6 * wave(t, 0.8) + 9 * span(t, 3.4, 3.9)
  return (
    <Layer opacity={show}>
      <Butterfly t={t} x={x} y={y} />
    </Layer>
  )
}

/* ───────── 子ども(主役) ───────── */

type Mood = 'wonder' | 'sad' | 'push' | 'joy'

/** うで の ながさ(かた→ひじ、ひじ→手 の それぞれ) */
const ARM_PART = 8
const SHOULDER_NEAR: Point = [1, -32]
const SHOULDER_FAR: Point = [-1, -32]

/** かた と 手 の位置から、ひじ を きめる。うでが とどかないときは のばしきった ところ まで。 */
function armJoints(shoulder: Point, target: Point): { readonly elbow: Point; readonly hand: Point } {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, ARM_PART * 2 - 0.02)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Point = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const mid: Point = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const h = Math.sqrt(Math.max(0, ARM_PART ** 2 - (reach / 2) ** 2))
  const a: Point = [mid[0] - uy * h, mid[1] + ux * h]
  const b: Point = [mid[0] + uy * h, mid[1] - ux * h]
  // ひじ は したを むく(おなじ たかさ なら うしろ)
  const elbow = a[1] > b[1] + 0.01 || (Math.abs(a[1] - b[1]) <= 0.01 && a[0] < b[0]) ? a : b
  return { elbow, hand }
}

function Arm({ shoulder, target, color }: { readonly shoulder: Point; readonly target: Point; readonly color: string }) {
  const { elbow, hand } = armJoints(shoulder, target)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0].toFixed(2)} ${elbow[1].toFixed(2)} L${hand[0].toFixed(2)} ${hand[1].toFixed(2)}`} fill="none" stroke={color} strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="3" cy="-39.4" rx="1.9" ry="1.2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'wonder' && (
        <>
          <circle cx="4.4" cy="-42.4" r="1.05" fill="#2b2b2b" />
          <ellipse cx="5" cy="-38.6" rx="0.9" ry="1.15" fill="#b9483f" />
        </>
      )}
      {mood === 'sad' && (
        <>
          <circle cx="4.4" cy="-42" r="1.05" fill="#2b2b2b" />
          <path d="M2.8 -44.4 L5.8 -45.6" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M3.4 -37.8 Q4.8 -39.4 6.2 -37.8" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'push' && (
        <>
          <path d="M3.4 -43.6 L5.4 -42.4 L3.4 -41.2" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3.4" y="-39.4" width="3.4" height="1.5" rx="0.7" fill="#ffffff" stroke="#b9483f" strokeWidth="0.6" />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M3.2 -42 Q4.6 -44.2 6 -42" fill="none" stroke="#2b2b2b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M3.2 -39.6 Q4.9 -36.6 6.6 -39.6 Z" fill="#b9483f" />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly near: Point
  readonly far: Point
  readonly headTilt: number
}

/** あしもと(0,0)が 地面の 子ども。右むき。からだは 小さく、あたま は 大きめ。 */
function Child({ step, mood, near, far, headTilt }: ChildProps) {
  return (
    <>
      {/* むこうの うで: どう の うしろ */}
      <Arm shoulder={SHOULDER_FAR} target={far} color={TUNIC_FAR} />
      {/* あし: うしろ・まえ(あるくとき かわりばんこ) */}
      <Layer rotate={step * 20} origin={[0, -15]}>
        <rect x="-3.2" y="-16" width="4.2" height="15.4" rx="2.1" fill={PANTS_DARK} />
        <ellipse cx="-1.4" cy="-0.8" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[0, -15]}>
        <rect x="0.4" y="-16" width="4.2" height="15.4" rx="2.1" fill={PANTS} />
        <ellipse cx="2.6" cy="-0.8" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の あいだ */}
      <rect x="-1.4" y="-38" width="4.2" height="6" rx="2" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-5.2" y="-35.5" width="10.4" height="22" rx="4.6" fill={TUNIC} />
      <path d="M-4 -19 h8" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {/* てまえの うで */}
      <Arm shoulder={SHOULDER_NEAR} target={near} color={TUNIC_DARK} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[0, -36]}>
        <circle cx="-1.4" cy="-41.4" r="1.6" fill={SKIN_SHADE} />
        <circle cx="1.2" cy="-42" r="6.5" fill={SKIN} />
        <path d="M-5.3 -41.5 C-5.9 -49.2 5.4 -51 7.4 -44.8 C5 -46.6 1.6 -46 -0.4 -43.2 C-1.6 -41.8 -3.6 -41.4 -5.3 -41.5 Z" fill={HAIR} />
        <path d="M0.6 -48.2 Q1.2 -51.2 2.8 -49.2 Q3.8 -51.4 4.6 -48.8" fill="none" stroke={HAIR} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** おしているときの あせ。 */
function Sweat({ t, cx, y }: SceneProps & { readonly cx: number; readonly y: number }) {
  const show = during(t, PUSH + 0.1, RELEASE + 0.1, 0.2)
  if (show <= 0) return null
  const p = ((t - PUSH) % 0.7) / 0.7
  return <path d="M0 -2 Q1.8 0.6 0 1.8 Q-1.8 0.6 0 -2 Z" fill="#7cc4f2" opacity={show * (1 - p)} transform={`translate(${(cx - 4.6).toFixed(2)} ${(y - 46 + p * 6).toFixed(2)})`} />
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // とびら: おしている間に 0 → 0.57 ぐらいまで、てを はなしても いきおいで さいごまで ひらく
  const open = span(t, PUSH, OPENED, easeInOut)
  const wall = span(t, 0, 0.55, backOut)

  // 子ども: あるいてくる → とびらの ところで おす(足が すこし まえへ) → おわって うしろへ さがる
  const walking = t < ENTER ? 0 : 1 - span(t, ARRIVE - 0.2, ARRIVE)
  const stride = Math.sin((t - ENTER) * Math.PI * 2 * 1.9) * walking
  const cx = mix(t, ENTER, ARRIVE, -14, 10, easeOut) + 7 * span(t, PUSH, RELEASE) - 7 * span(t, RELEASE, OPENED + 0.1, easeInOut)
  const pushW = span(t, PUSH - 0.3, PUSH) * (1 - span(t, RELEASE, RELEASE + 0.35))
  const cheerW = span(t, RELEASE + 0.3, RELEASE + 0.7, easeOut)
  const hop = span(t, 5.2, 6.2)
  const jump = -Math.abs(Math.sin(hop * Math.PI * 2)) * 6
  const bob = -Math.abs(stride) * 1.2
  const lean = 3 * pushW
  const feetY = GROUND_Y + jump + bob

  // 手: ふだんは だらんと おろす(あるくときは ふる)。おすときは とびらの 面。うれしいときは 上へ。
  const hangNear: Point = [2.5 + stride * 7, -17.5]
  const hangFar: Point = [-1 - stride * 7, -17.5]
  const door = doorPoint(open, 0.22, 0.52)
  const pushNear: Point = [door[0] - cx, door[1] - feetY]
  const pushFar: Point = [pushNear[0] - 0.8, pushNear[1] + 2.2]
  const wiggle = wave(t, 0.4) * 1.4 * cheerW
  const cheerNear: Point = [7.5 + wiggle, -47]
  const cheerFar: Point = [-6.5 - wiggle, -47]
  const near = lerpPoint(lerpPoint(hangNear, pushNear, pushW), cheerNear, cheerW)
  const far = lerpPoint(lerpPoint(hangFar, pushFar, pushW), cheerFar, cheerW)

  const mood: Mood = t < GONE ? 'wonder' : t < PUSH ? 'sad' : t < RELEASE + 0.2 ? 'push' : 'joy'
  // ちょうちょ を 見あげる → がっくり うつむく → ふんばる → よろこんで 見あげる
  const headTilt = -14 * span(t, 1.4, 1.8) * (1 - span(t, GONE - 0.1, GONE + 0.4)) + 5 * span(t, GONE + 0.1, GONE + 0.4) * (1 - span(t, PUSH - 0.2, PUSH + 0.1)) + 2 * pushW - 8 * span(t, RELEASE + 0.3, RELEASE + 0.7)

  // ちょうちょ: にわで ひらひら → ひらいたら 子どもの あたまの 上へ
  const garden = t >= RELEASE - 0.2 && t < OPENED + 0.1
  const fly = span(t, OPENED + 0.1, OPENED + 0.7, easeInOut)
  const gardenBf: Point = [17 + 3 * wave(t, 1.6), 41 + 2.2 * wave(t, 1.1, 0.3)]
  const w = (t - OPENED) * 3.2
  const orbit: Point = [cx + 9 + 4.5 * Math.cos(w), 37 + 2.5 * Math.sin(2 * w)]
  const flyBf = lerpPoint(gardenBf, orbit, fly)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} />
        <ButterflyAbove t={t} />
        <Layer scaleY={wall} origin={[54.5, 98]}>
          <Wall />
          <LeftLeaf />
          <Garden t={t} />
          {garden && <Butterfly t={t} x={gardenBf[0]} y={gardenBf[1]} />}
          <GateLeaf open={open} />
          <FrameFront />
        </Layer>
        <FrontGround />
        <ellipse cx={cx} cy={GROUND_Y + 0.8} rx={7.5 - jump * 0.3} ry="1.8" fill="#000000" opacity="0.12" />
        <Layer x={cx} y={feetY} rotate={lean}>
          <Child step={stride} mood={mood} near={near} far={far} headTilt={headTilt} />
        </Layer>
        <Sweat t={t} cx={cx} y={feetY} />
        {t >= OPENED + 0.1 && <Butterfly t={t} x={flyBf[0]} y={flyBf[1]} />}
        {/* ひらいた むこうの ひかり */}
        {t > OPENED - 0.4 && (
          <>
            <g opacity={0.5 + 0.5 * wave(t, 0.9)}>
              <Star cx={27} cy={39} r={1.9} color="#ffffff" spin={t * 60} />
            </g>
            <g opacity={0.5 + 0.5 * wave(t, 0.9, 0.45)}>
              <Star cx={23} cy={67} r={1.5} color="#fff6c8" spin={-t * 50} />
            </g>
          </>
        )}
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
    { at: 0, label: '大きな 門が たつ。ちょうちょが とんでいる', sound: 'pop' },
    { at: ENTER, label: '子どもが あるいてくる' },
    { at: GONE, label: 'ちょうちょが 門の むこうへ。がっかり' },
    { at: PUSH, label: 'とびらを ぐっと おす', sound: 'pop' },
    { at: RELEASE, label: 'とびらが かたほうだけ ぱたんと ひらく。ちょうちょが いた!', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '戸 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
