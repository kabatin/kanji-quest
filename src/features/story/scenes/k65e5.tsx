/*
 * 日(ひ): まるい お日さまを、つちの かべに ほろうとした子が、四角に した。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … つちの かべに ほった、四角の 左の たて線
 *   2画目(𠃍)   … 四角の うえの よこ線 と、右の たて線(ひと筆で ほる)
 *   3画目(一)   … 四角の まんなかの よこ線(お日さまの まんなか)
 *   4画目(一)   … 四角の いちばん下の よこ線(とじる)
 *   空の お日さま … 字には ならない。「見ほん」として 右上で かがやく
 *
 * ながれ
 *   つちの かべが たち、空に まるい お日さまが かがやく
 *   → 子どもが ながい ぼうを もって あるいてきて、お日さまを ゆびさす(ぴかぴか!)
 *   → ぼうで まるを ほろうとするけど、つちは かたくて がたがた。まるく ならなくて こまる
 *   → ひらめき! まっすぐなら ほりやすい。まるを けして、まっすぐな線で 四角を ほる
 *   → 四角が できて、子どもは よろこんで ぴょんぴょん
 *   → 子どもが すこし さがって、ほね が ひかり、絵が うすくなって 字「日」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の上。あし は こし から。
 *   ぼうは ながい ものを にぎって、さきを かべに とどかせる(うでが のびすぎないように、体も よこに うごく)。
 *   字の線は、ぼうの さきが ほった あと が そのまま 字の画に なる。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Bone, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '日'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ef7d57'
const TUNIC_DARK = '#d9663f'
const TUNIC_FAR = '#c4572f'
const PANTS = '#4a6fa5'
const PANTS_DARK = '#3d5d8f'
const SHOE = '#6b4a36'
const STICK = '#a8743f'
const STICK_TIP = '#6b4a36'
const CLAY = '#e8c79a'
const CLAY_SHADE = '#d9b183'
const CARVE = '#7a5233'
const DUST = '#f3e0c0'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const SUN_LIGHT = '#fff2a8'
const SWEAT = '#7cc4f2'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const WALK_FROM = 0.4
const WALK_TO = 1.4
/** お日さまを ゆびさす */
const POINT_FROM = 1.4
const POINT_TO = 2.1
/** まるを ほる */
const CIRCLE_FROM = 2.4
const CIRCLE_TO = 3.6
/** まるを けす(つちを ならす) */
const ERASE_TO = 4.0
/** ひらめき */
const IDEA_FROM = 4.0
const IDEA_TO = 4.7
/** 四角を ほる(画ごとの 時間) */
const CHEER = 7.4
const BACK_TO = 8.2
const INK = 8.3
const DONE = 10.9
const DURATION = 11.4

type Pt = readonly [number, number]

const lerp = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 点の列(画の 通り道)の、0〜1 の所の 場所 */
function along(pts: readonly Pt[], p: number): Pt {
  const f = clamp01(p) * (pts.length - 1)
  const i = Math.min(Math.floor(f), pts.length - 2)
  return lerp(pts[i], pts[i + 1], f - i)
}

/** ほる画。scene-info の「通り道の点」と 同じ。from〜to の間に ほる */
const CARVES = [
  { n: 1, from: 4.7, to: 5.2, pts: [[31.5, 24.5], [33.2, 33.4], [33.2, 42.8], [33.2, 52.1], [33.1, 61.5], [33.1, 70.8], [33.1, 80.2], [33.2, 89.5]] as const },
  { n: 2, from: 5.25, to: 6.2, pts: [[33.5, 26], [49.2, 24.8], [64.9, 23.5], [79.1, 25.9], [79.2, 41.7], [79.1, 57.5], [79, 73.2], [79, 89]] as const },
  { n: 3, from: 6.4, to: 6.8, pts: [[34.2, 55.3], [40.5, 54.8], [46.8, 54.4], [53.1, 54], [59.4, 53.6], [65.7, 53.2], [72, 52.8], [78.3, 52.5]] as const },
  { n: 4, from: 6.95, to: 7.4, pts: [[34.2, 86.5], [40.5, 86.1], [46.7, 85.7], [53, 85.3], [59.3, 85], [65.5, 84.7], [71.8, 84.4], [78, 84.3]] as const },
]
const CARVE_START: Pt = CARVES[0].pts[0]
const CARVE_END: Pt = CARVES[CARVES.length - 1].pts[7]

/** 四角を ほっているときの、ぼうの さき の場所 */
function squareTip(t: number): Pt {
  let pos: Pt = CARVE_START
  CARVES.forEach((c, i) => {
    const next = CARVES[i + 1]
    if (t >= c.from) pos = along(c.pts, span(t, c.from, c.to))
    if (next && t > c.to) {
      const k = span(t, c.to, next.from, easeInOut)
      const moved = lerp(c.pts[7], next.pts[0], k)
      // 画と画の間は、ぼうを すこし うかせて うつる
      pos = [moved[0], moved[1] - Math.sin(k * Math.PI) * 4]
    }
  })
  return pos
}

/** うまく いかなかった まる(がたがた で、おわりが つながらない) */
const CIRCLE_CENTER: Pt = [52, 56]
function circlePoint(p: number): Pt {
  const theta = -Math.PI / 2 + p * Math.PI * 2 * 1.06
  const r = 14 * (1 + 0.16 * Math.sin(2.1 * theta + 0.8) + 0.09 * Math.sin(5 * theta))
  return [CIRCLE_CENTER[0] + Math.cos(theta) * r, CIRCLE_CENTER[1] + Math.sin(theta) * r]
}
const CIRCLE_STEPS = 48

/* ───────── 子どもの 場所と うごき ───────── */

/** かたの 高さ(足もとは 地面 y=95.5) */
const SHOULDER_Y = 60
/** ぼうの 先から かた までが とどく 長さの めやす / ぼうの ながさ / にぎる 手が かた から はなれる 上限 */
const STICK_LEN = 50
const HAND_MAX = 22
/** じゅうぶんな うで(かた〜ひじ・ひじ〜手)の 長さ */
const ARM_PART = 13.5
/** ぼうを もって ぶらさげる / お日さまを さす / ばんざい のときの、かた から ぼうの さき への むき */
const REST_REL: Pt = [22, 22]
const POINT_REL: Pt = [35, -20]
const CHEER_REL: Pt = [12, -38]

const clampRange = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

/** 体の よこの場所(まだ なめらかにする前) */
function bodyXRaw(t: number): number {
  // あるいてくる → お日さまを見る → まるを ほる ために かべの そばへ
  const before = t < WALK_TO ? mix(t, WALK_FROM, WALK_TO, -14, 13, easeOut) : mix(t, 1.9, 2.4, 13, 22)
  // 四角を ほる間は、ぼうの さき を おって 体も よこに うごく
  const follow = clampRange(0.8 * squareTip(t)[0] - 10, 14, 56)
  const w = span(t, 4.2, 4.7, easeInOut)
  const during = before * (1 - w) + follow * w
  // ほりおわったら、あとずさりして かべから はなれる
  const back = span(t, CHEER + 0.1, BACK_TO, easeInOut)
  return during * (1 - back) + 12 * back
}

/** 体の よこの場所: すこし ならして、かくかく しないように */
function bodyX(t: number): number {
  const offsets = [-0.18, -0.12, -0.06, 0, 0.06, 0.12, 0.18]
  return offsets.reduce((sum, d) => sum + bodyXRaw(t + d), 0) / offsets.length
}

/** 体が うごいている度合い(0〜1)。あしを ふるのに 使う */
function moving(t: number): number {
  return clamp01(Math.abs(bodyX(t + 0.04) - bodyX(t - 0.04)) / 0.08 / 5)
}

/** ぼうの さき の場所(かた S から見て) */
function tipOf(t: number, S: Pt): Pt {
  const rest: Pt = [S[0] + REST_REL[0], S[1] + REST_REL[1]]
  const point: Pt = [S[0] + POINT_REL[0] + wave(t, 0.5) * 1.2, S[1] + POINT_REL[1] + wave(t, 0.5, 0.2) * 1.2]
  if (t < POINT_FROM) return rest
  if (t < POINT_TO) return lerp(rest, point, span(t, POINT_FROM, POINT_FROM + 0.3, easeInOut))
  if (t < CIRCLE_FROM) return lerp(point, circlePoint(0), span(t, POINT_TO, CIRCLE_FROM, easeInOut))
  if (t < CIRCLE_TO) return circlePoint(span(t, CIRCLE_FROM, CIRCLE_TO))
  if (t < 4.3) return lerp(circlePoint(1), rest, span(t, CIRCLE_TO, 4.2, easeInOut))
  if (t < 4.7) return lerp(rest, CARVE_START, span(t, 4.3, 4.7, easeInOut))
  if (t < CHEER) return squareTip(t)
  const cheer: Pt = [S[0] + CHEER_REL[0] + wave(t, 0.5) * 1.5, S[1] + CHEER_REL[1]]
  return lerp(CARVE_END, cheer, span(t, CHEER, CHEER + 0.4, easeOut))
}

type Mood = 'calm' | 'happy' | 'focus' | 'worry' | 'eureka' | 'joy'

function moodAt(t: number): Mood {
  if (t < POINT_FROM) return 'calm'
  if (t < CIRCLE_FROM) return 'happy'
  if (t < 3.0) return 'focus'
  if (t < IDEA_FROM) return 'worry'
  if (t < IDEA_TO) return 'eureka'
  if (t < CHEER) return 'happy'
  return 'joy'
}

/** かた S から 手 H へ、ひじ を まげて つなぐ。ひじ は 下と うしろ へ まがる。 */
function elbowOf(S: Pt, H: Pt): Pt {
  const dx = H[0] - S[0]
  const dy = H[1] - S[1]
  const d = Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01)
  const ux = d > 0.001 ? dx / Math.hypot(dx, dy) : 1
  const uy = d > 0.001 ? dy / Math.hypot(dx, dy) : 0
  const h = Math.sqrt(Math.max(0, ARM_PART ** 2 - (d / 2) ** 2))
  const candidates: readonly Pt[] = [[-uy, ux], [uy, -ux]]
  const side = candidates.reduce((best, c) => (c[1] - c[0] > best[1] - best[0] ? c : best))
  return [S[0] + ux * (d / 2) + side[0] * h, S[1] + uy * (d / 2) + side[1] * h]
}

function Arm({ S, H, color }: { readonly S: Pt; readonly H: Pt; readonly color: string }) {
  const E = elbowOf(S, H)
  return (
    <>
      <path d={`M${S[0]} ${S[1]} L${E[0]} ${E[1]} L${H[0]} ${H[1]}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={H[0]} cy={H[1]} r="3" fill={SKIN} />
    </>
  )
}

function Face({ x, mood }: { readonly x: number; readonly mood: Mood }) {
  const eyeA = x + 2
  const eyeB = x + 6
  const eyeY = 49.8
  const mx = x + 4
  const my = 54.4
  const dots = (r: number) => (
    <>
      <circle cx={eyeA} cy={eyeY} r={r} fill={EYE} />
      <circle cx={eyeB} cy={eyeY} r={r} fill={EYE} />
    </>
  )
  return (
    <>
      <circle cx={x + 0.8} cy="53.6" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {mood === 'joy' ? (
        <>
          <path d={`M${eyeA - 1.3} ${eyeY + 0.6} Q${eyeA} ${eyeY - 1.4} ${eyeA + 1.3} ${eyeY + 0.6} M${eyeB - 1.3} ${eyeY + 0.6} Q${eyeB} ${eyeY - 1.4} ${eyeB + 1.3} ${eyeY + 0.6}`} fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
          <path d={`M${mx - 2.4} ${my - 0.6} Q${mx} ${my + 4} ${mx + 2.4} ${my - 0.6} Z`} fill={MOUTH} />
        </>
      ) : mood === 'eureka' ? (
        <>
          {dots(1.5)}
          <circle cx={eyeA + 0.5} cy={eyeY - 0.5} r="0.5" fill="#ffffff" />
          <circle cx={eyeB + 0.5} cy={eyeY - 0.5} r="0.5" fill="#ffffff" />
          <ellipse cx={mx} cy={my + 0.4} rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      ) : mood === 'worry' ? (
        <>
          {dots(1.1)}
          <path d={`M${eyeA - 1.6} ${eyeY - 2} L${eyeA + 1.4} ${eyeY - 3.2} M${eyeB - 1.4} ${eyeY - 3.2} L${eyeB + 1.6} ${eyeY - 2}`} fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d={`M${mx - 2} ${my + 0.2} Q${mx - 0.8} ${my - 1.3} ${mx} ${my + 0.2} Q${mx + 0.8} ${my + 1.4} ${mx + 2} ${my - 0.2}`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      ) : mood === 'focus' ? (
        <>
          {dots(1.1)}
          <path d={`M${mx - 1.2} ${my} h2.4`} stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      ) : (
        <>
          {dots(1.1)}
          <path d={`M${mx - 1.8} ${my - 0.2} Q${mx} ${my + 2} ${mx + 1.8} ${my - 0.2}`} fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
    </>
  )
}

/** 子ども。かたは どう の 上、くび は みじかく、うで は ひじ で まがる。 */
function Child({ t }: SceneProps) {
  const x = bodyX(t)
  const S: Pt = [x, SHOULDER_Y]
  const T = tipOf(t, S)
  const dist = Math.hypot(T[0] - S[0], T[1] - S[1])
  const u: Pt = dist > 0.5 ? [(T[0] - S[0]) / dist, (T[1] - S[1]) / dist] : [1, 0]
  const hand: Pt = [S[0] + u[0] * Math.min(dist * 0.5, HAND_MAX), S[1] + u[1] * Math.min(dist * 0.5, HAND_MAX)]
  const tail: Pt = [T[0] - u[0] * STICK_LEN, T[1] - u[1] * STICK_LEN]
  const mood = moodAt(t)
  const cheering = t >= CHEER
  // もう ひとつの うで: ふだんは たれて、あるくときは ふり、ばんざいで 上へ
  const walkSwing = Math.sin(x * 0.5) * 5 * moving(t)
  const farRest: Pt = [S[0] - 3 + walkSwing, S[1] + 26]
  const farCheer: Pt = [S[0] - 6, S[1] - 26]
  const farTarget = lerp(farRest, farCheer, span(t, CHEER, CHEER + 0.4, easeOut))
  const stride = Math.sin(x * 0.5) * 22 * moving(t)
  const hop = cheering && t < 9.7 ? -Math.abs(wave(t - CHEER, 1.4)) * 3 * span(t, CHEER + 0.3, CHEER + 0.5) : 0
  const tilt = t >= POINT_FROM && t < CIRCLE_FROM ? -10 * span(t, POINT_FROM, POINT_FROM + 0.3) : mood === 'worry' ? 5 : 0
  const carving = t > CIRCLE_FROM && t < CIRCLE_TO
  return (
    <>
      <ellipse cx={x} cy="97" rx="8" ry="2" fill="#000000" opacity="0.12" />
      <Layer y={hop}>
        <Arm S={S} H={farTarget} color={TUNIC_FAR} />
        {/* ながい ぼう: さき が かべに とどく。うしろ は 体の うしろへ */}
        <path d={`M${tail[0]} ${tail[1]} L${T[0]} ${T[1]}`} stroke={STICK} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={T[0]} cy={T[1]} r="1.3" fill={STICK_TIP} />
        <Layer rotate={stride} origin={[x - 1.5, 76]}>
          <rect x={x - 3.9} y="75" width="4.8" height="20" rx="2.4" fill={PANTS_DARK} />
          <ellipse cx={x - 1.2} cy="95.4" rx="4" ry="2.2" fill={SHOE} />
        </Layer>
        <Layer rotate={-stride} origin={[x + 1.5, 76]}>
          <rect x={x - 0.9} y="75" width="4.8" height="20" rx="2.4" fill={PANTS} />
          <ellipse cx={x + 1.8} cy="95.4" rx="4" ry="2.2" fill={SHOE} />
        </Layer>
        <rect x={x - 5.2} y="57" width="10.4" height="22" rx="5" fill={TUNIC} />
        <path d={`M${x - 3.6} 71 h7.2`} stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
        <Arm S={S} H={hand} color={TUNIC_DARK} />
        {/* くび: みじかく、どう と あたま の間 */}
        <rect x={x - 2} y="54" width="4" height="6" rx="1.8" fill={SKIN_SHADE} />
        <Layer rotate={tilt} origin={[x, 57]}>
          <circle cx={x} cy="49" r="8" fill={SKIN} />
          <path d={`M${x - 8.3} 50.6 A8.3 8.3 0 0 1 ${x + 8.2} 48.6 Q${x + 4} 43.4 ${x - 1} 45.6 Q${x - 5} 46.6 ${x - 8.3} 50.6 Z`} fill={HAIR} />
          <Face x={x} mood={mood} />
        </Layer>
        <Layer opacity={carving ? 1 : 0}>
          <Sweat x={x} t={t} />
        </Layer>
      </Layer>
      {mood === 'worry' ? <Sweat x={x} t={t} /> : null}
      <Bulb x={x} t={t} />
    </>
  )
}

/** こまったときの あせ。あたまの よこ から おちる。 */
function Sweat({ x, t }: { readonly x: number; readonly t: number }) {
  if (t < 3.0 || t >= IDEA_FROM) return null
  return (
    <>
      {[0, 0.5].map((offset) => {
        const p = ((t + offset) % 1) / 1
        return <path key={offset} d="M0 -2.2 Q1.8 0.5 0 1.8 Q-1.8 0.5 0 -2.2 Z" fill={SWEAT} transform={`translate(${x - 9 - p * 2} ${42 + p * 10}) rotate(10)`} opacity={1 - p} />
      })}
    </>
  )
}

/** ひらめき の 電球。あたま の上に ぽん と出る。 */
function Bulb({ x, t }: { readonly x: number; readonly t: number }) {
  const show = during(t, IDEA_FROM, IDEA_TO, 0.15)
  if (show <= 0) return null
  const s = Math.max(0, span(t, IDEA_FROM, IDEA_FROM + 0.25, backOut))
  return (
    <Layer opacity={show} scale={s * 1.4} origin={[x + 2, 33]}>
      <circle cx={x + 2} cy="31" r="4" fill={SUN} />
      <circle cx={x + 0.8} cy="29.6" r="1.3" fill={SUN_LIGHT} />
      <rect x={x + 0.2} y="34.4" width="3.6" height="2.4" rx="0.8" fill="#9aa4b2" />
      {[-60, -30, 0, 30, 60].map((deg) => (
        <rect key={deg} x={x + 1.4} y="22" width="1.2" height="2.4" rx="0.6" fill={SUN} transform={`rotate(${deg} ${x + 2} 31)`} />
      ))}
    </Layer>
  )
}

/** まるを けすときの つちぼこり */
function DustPuffs({ t }: SceneProps) {
  const p = span(t, CIRCLE_TO, ERASE_TO)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4
        const d = 6 + p * 12
        return <circle key={i} cx={CIRCLE_CENTER[0] + Math.cos(a) * d} cy={CIRCLE_CENTER[1] + Math.sin(a) * d - p * 4} r={Math.max(0, 2.2 + p * 2)} fill={DUST} />
      })}
    </g>
  )
}

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.4, easeOut)
  const glint = during(t, POINT_FROM + 0.1, POINT_TO + 0.3, 0.2)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[96, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="95.2" y="2.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 96 14)`} />
        ))}
      </Layer>
      <circle cx="96" cy="14" r={6.2 * sun} fill={SUN} />
      <circle cx="94.4" cy="12.4" r={2 * sun} fill={SUN_LIGHT} />
      {/* ぴかぴか */}
      <Layer opacity={glint}>
        <Star cx={86} cy={5} r={2.6} color="#ffffff" spin={t * 60} />
        <Star cx={104} cy={26} r={2.2} color="#ffffff" spin={-t * 60} />
      </Layer>
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="6" cy="12" rx="7" ry="3.2" />
        <ellipse cx="11" cy="10" rx="5" ry="3.2" />
      </g>
    </>
  )
}

function Ground() {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 地面から たちあがる、つちの かべ */
function Wall({ t }: SceneProps) {
  const grow = span(t, 0, 0.5, backOut)
  return (
    <Layer opacity={grow > 0.03 ? 1 : 0} scaleY={Math.max(0.01, grow)} origin={[56, 96]}>
      <rect x="26" y="15" width="61" height="81" rx="5" fill={CLAY} />
      <path d="M81 15 H82 Q87 15 87 20 V91 Q87 96 82 96 H81 Z" fill={CLAY_SHADE} />
      <circle cx="30" cy="19.5" r="1.1" fill={CLAY_SHADE} />
      <circle cx="83" cy="91" r="1.1" fill={CLAY_SHADE} />
    </Layer>
  )
}

/** かべに ほった 線: がたがたの まる と、まっすぐな 四角 */
function Carvings({ t }: SceneProps) {
  const circleP = span(t, CIRCLE_FROM, CIRCLE_TO)
  const circleOpacity = 1 - span(t, CIRCLE_TO, ERASE_TO)
  const steps = Math.floor(circleP * CIRCLE_STEPS)
  const circlePts = Array.from({ length: steps + 1 }, (_, i) => circlePoint(Math.min(i / CIRCLE_STEPS, circleP)))
  return (
    <>
      {circleP > 0 && circleOpacity > 0 ? (
        <path d={`M${circlePts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' L')}`} fill="none" stroke={CARVE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity={circleOpacity} />
      ) : null}
      {CARVES.map((c) => (
        <Bone key={c.n} char={CHAR} n={c.n} color={CARVE} width={2.6} to={span(t, c.from, c.to)} />
      ))}
    </>
  )
}

/** ほっている とき、ぼうの さき から ちる つちの かけら */
function Flecks({ t }: SceneProps) {
  const carvingSquare = CARVES.some((c) => t > c.from && t < c.to)
  const carvingCircle = t > CIRCLE_FROM && t < CIRCLE_TO
  if (!carvingSquare && !carvingCircle) return null
  const tip = carvingCircle ? circlePoint(span(t, CIRCLE_FROM, CIRCLE_TO)) : squareTip(t)
  return (
    <>
      {[0, 1, 2].map((i) => {
        const p = (t * 3 + i / 3) % 1
        return <circle key={i} cx={tip[0] + (i - 1) * 3 * p} cy={tip[1] - p * 5 + p * p * 7} r={Math.max(0, 0.8 * (1 - p))} fill="#caa072" />
      })}
    </>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Wall t={t} />
        <Carvings t={t} />
        <DustPuffs t={t} />
        <Layer opacity={span(t, WALK_FROM - 0.1, WALK_FROM + 0.1)}>
          <Child t={t} />
        </Layer>
        <Flecks t={t} />
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
    { at: 0, label: 'つちの かべが たち、お日さまが かがやく', sound: 'pop' },
    { at: WALK_FROM, label: '子どもが ぼうを もって あるいてくる' },
    { at: POINT_FROM, label: 'まるい お日さまを ゆびさす' },
    { at: CIRCLE_FROM, label: 'まるを ほろうとするけど、がたがた' },
    { at: IDEA_FROM, label: 'ひらめき! まっすぐなら ほりやすい', sound: 'pop' },
    { at: CARVES[0].from, label: 'まっすぐな線で 四角を ほる' },
    { at: CHEER, label: '四角が できて、ぴょんぴょん' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '日 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
