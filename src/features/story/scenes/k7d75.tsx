/*
 * 絵(え): いろいろな 糸で もようを ぬう。
 *
 * ほね(画と絵の対応)
 *   1〜6画目   … 糸 の 部分。女の子が ぬいとる もようの 糸(赤・だいだい・黄の 3色 ×2本ずつ)
 *   7〜12画目  … 会 の 部分。つづけて ぬいとる もようの 糸(みどり・青・むらさき)
 *   (ぬの の上に ぬった 糸の線が、そのまま 字の画の場所に なる。
 *    さいごに ぬのを 大きく うつすと、ぬい目が 字の画に ぴったり 重なる)
 *
 * ながれ
 *   まっしろな ぬのを もった 女の子が、つまらなそう(ふう)
 *   → 糸の はこを 見つけて「あ!」と ひらめく(ふきだしに いろいろな もよう)
 *   → 針で、あか・だいだい・き・みどり・あお・むらさき の 糸を つぎつぎ ぬっていく
 *   → できた! と ぬのを かかげて よろこぶ
 *   → ぬのが 大きく うつり、ぬい目の ほね が ひかって 絵が うすくなり、字「絵」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は 下むき)。くび は みじかく、どう の まんなか の上。
 *   針を もつ手は、針の先に とどくように 2つの ふし で のばす。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '絵'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const DRESS = '#f08aa4'
const DRESS_DARK = '#e0698b'
const SOCK = '#ffffff'
const SHOE = '#6b4a36'
const WALL = '#fdf1d6'
const WALL_LOW = '#f4e0b4'
const FLOOR = '#e4c49a'
const FLOOR_LINE = '#cfa97a'
const WOOD = '#b98255'
const WOOD_DARK = '#8c5b3c'
const SKY = '#bfe6fb'
const SUN = '#ffd24a'
const CLOTH = '#fffaf0'
const CLOTH_EDGE = '#e6d2ae'
const NEEDLE = '#c9d0da'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** 糸の いろ(2本ずつ かわる)。いろいろな 糸 */
const THREADS = ['#e8534a', '#f2994a', '#f2c94c', '#55b86e', '#4f9be0', '#9b6bd6'] as const

/** くぎり の時間(秒) */
const NOTICE = 1.3
const IDEA = 1.9
const STITCH = 2.6
/** 1本の画を ぬう時間 */
const STEP = 0.3
const STROKES = 12
const END = STITCH + STROKES * STEP
/** ぬのを 大きく うつしはじめる */
const ZOOM = 7.0
const INK = 8.0
const DONE = 10.9
const DURATION = 11.4

type Point = readonly [number, number]

/** 画の通り道の点(scene-info の 点)。針の先を ここに そって うごかす */
const PATHS: readonly (readonly Point[])[] = [
  [[29.9, 14.3], [28.5, 19.5], [25.7, 24.4], [22.6, 29.1], [19.2, 33.5], [17.2, 38.3], [22.3, 40.6], [27.1, 43.5]],
  [[38.5, 28.7], [35.2, 36.3], [29.7, 43.1], [23.9, 49.5], [17.9, 55.8], [19.5, 59.6], [28, 57.7], [36.5, 55.8]],
  [[34.8, 49.3], [36.1, 50.8], [37.3, 52.5], [38.3, 54.2], [39.3, 56], [40.2, 57.9], [40.9, 59.8], [41.5, 61.8]],
  [[26.3, 60.3], [27.6, 65.1], [27.6, 70.3], [27.6, 75.5], [27.6, 80.7], [27.6, 85.9], [27.5, 91.1], [27.5, 96.3]],
  [[18, 70.3], [17.9, 72.8], [16.9, 75.2], [15.8, 77.5], [14.6, 79.8], [13.4, 82.1], [12.1, 84.3], [10.8, 86.5]],
  [[36, 68.8], [37.2, 70.5], [38.2, 72.4], [39.1, 74.3], [39.9, 76.3], [40.6, 78.3], [41.2, 80.4], [41.5, 82.5]],
  [[67.3, 14], [66.1, 20], [63.5, 25.6], [60.7, 31.2], [57.5, 36.5], [54, 41.6], [50.2, 46.5], [46, 51.1]],
  [[68, 19.8], [71.7, 24.6], [75.6, 29.2], [79.6, 33.8], [83.7, 38.2], [87.9, 42.5], [92.4, 46.6], [97.5, 49.8]],
  [[56.6, 52.2], [59.9, 52.4], [63.1, 52], [66.4, 51.5], [69.6, 50.9], [72.9, 50.4], [76.2, 50.1], [79.5, 50.3]],
  [[47.8, 67.4], [54.2, 67.5], [60.5, 66.8], [66.9, 66.1], [73.3, 65.4], [79.7, 64.8], [86.1, 64.4], [92.5, 64.6]],
  [[65.1, 69.6], [62.5, 76.8], [57.5, 83.1], [52.6, 89.4], [59.7, 89.7], [67.5, 87.7], [75.3, 85.7], [83.1, 84]],
  [[78.5, 76.3], [80.4, 78.3], [82.1, 80.5], [83.6, 82.9], [85.1, 85.3], [86.3, 87.8], [87.4, 90.3], [88.3, 93]],
]

/** ぬのの まんなか(字の座標)と、ちいさい ときの 大きさ・おき場所 */
const CLOTH_CENTER: Point = [54.5, 54.5]
const CLOTH_HALF = 50
const SMALL_SCALE = 0.28
/** 女の子が もっているときの ぬのの まんなか(せかいの座標) */
const HELD_AT: Point = [45, 62]
/** 女の子の かた(うで の つけね)・足もと */
const SHOULDER_NEAR: Point = [27.5, 49]
const SHOULDER_FAR: Point = [24, 49]
const ARM_PART = 17

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 画の上の 場所(0〜1)。点と点の間を つなぐ */
function onPath(path: readonly Point[], at: number): Point {
  const x = Math.min(Math.max(at, 0), 1) * (path.length - 1)
  const i = Math.min(Math.floor(x), path.length - 2)
  return lerpPoint(path[i], path[i + 1], x - i)
}

/** ぬのの ようす: 持ち上げ・ぬのの 大きさ(うつす とき ぬのが 大きくなる) */
function clothState(t: number) {
  const lift = 5 * span(t, END, END + 0.5, easeOut)
  const z = span(t, ZOOM, INK, easeInOut)
  return {
    z,
    scale: SMALL_SCALE + (1 - SMALL_SCALE) * z,
    x: (HELD_AT[0] - CLOTH_CENTER[0]) * (1 - z),
    y: (HELD_AT[1] - lift - CLOTH_CENTER[1]) * (1 - z),
    /** ちいさい ぬのの まんなか(せかい) */
    center: [HELD_AT[0], HELD_AT[1] - lift] as Point,
  }
}

/** 字の座標の点 → せかいの座標(ぬのが ちいさい ときだけ) */
function toWorld(p: Point, center: Point): Point {
  return [center[0] + (p[0] - CLOTH_CENTER[0]) * SMALL_SCALE, center[1] + (p[1] - CLOTH_CENTER[1]) * SMALL_SCALE]
}

/* ───────── へや ───────── */

function Room({ t }: SceneProps) {
  const wall = span(t, 0, 0.3, easeOut)
  const drift = (t * 1.2) % 40
  return (
    <Layer opacity={wall}>
      <rect x="-2" y="-2" width="113" height="98" fill={WALL} />
      <rect x="-2" y="88" width="113" height="8" fill={WALL_LOW} />
      <rect x="-2" y="94" width="113" height="17" fill={FLOOR} />
      <path d="M-2 94 H111 M20 94 V111 M62 94 V111 M96 94 V111" stroke={FLOOR_LINE} strokeWidth="0.8" fill="none" />
      {/* まど: そとに お日さま と ゆっくり ながれる 雲 */}
      <rect x="72" y="7" width="31" height="28" rx="2.5" fill={WOOD} />
      <rect x="74.5" y="9.5" width="26" height="23" rx="1.5" fill={SKY} />
      <circle cx="92" cy="17" r="4.6" fill={SUN} />
      <g fill="#ffffff" transform={`translate(${-6 + (drift % 18) * 0.6} 0)`}>
        <ellipse cx="82" cy="26" rx="5" ry="2.4" />
        <ellipse cx="85.4" cy="24.8" rx="3.6" ry="2.4" />
      </g>
      <rect x="74.5" y="9.5" width="26" height="23" rx="1.5" fill="none" stroke={WOOD} strokeWidth="0.4" />
      <path d="M87.5 9.5 V32.5 M74.5 21 H100.5" stroke={WOOD} strokeWidth="1.6" />
    </Layer>
  )
}

/* ───────── 糸の はこ ───────── */

function Spool({ x, color, wiggle }: { readonly x: number; readonly color: string; readonly wiggle: number }) {
  return (
    <Layer rotate={wiggle} origin={[x, 86]}>
      <rect x={x - 2.8} y="73" width="5.6" height="13" rx="1" fill={color} />
      <rect x={x - 3.6} y="72" width="7.2" height="2" rx="1" fill={WOOD_DARK} />
      <rect x={x - 3.6} y="84" width="7.2" height="2" rx="1" fill={WOOD_DARK} />
      <path d={`M${x - 2.8} 77 h5.6 M${x - 2.8} 80.5 h5.6`} stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
    </Layer>
  )
}

/** 糸の はこ。女の子が 気づくと、糸巻きが 少しゆれて きらり と光る */
function ThreadBox({ t }: SceneProps) {
  const pop = span(t, 0.5, 1.0, backOut)
  const shake = during(t, NOTICE, IDEA + 0.5, 0.15)
  const wiggle = wave(t, 0.28) * 4 * shake
  return (
    <Layer scale={pop} origin={[88, 95]}>
      <Spool x={81} color={THREADS[0]} wiggle={wiggle} />
      <Spool x={89} color={THREADS[4]} wiggle={-wiggle} />
      <Spool x={97} color={THREADS[3]} wiggle={wiggle} />
      <circle cx="84.5" cy="80" r="5.2" fill={THREADS[2]} />
      <path d="M80.5 78 Q84.5 76.4 88.4 79.4 M80.3 81.4 Q84.6 79.6 88.6 82.6" fill="none" stroke="#d9a528" strokeWidth="0.7" />
      <rect x="74" y="83.5" width="30" height="12" rx="2.4" fill={WOOD} />
      <rect x="74" y="83.5" width="30" height="3" rx="1.5" fill={WOOD_DARK} />
      <ellipse cx="89" cy="96.4" rx="17" ry="1.8" fill="#000000" opacity="0.1" />
    </Layer>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'bored' | 'curious' | 'busy' | 'joy'

/** 2つの ふしで のびる うで。かた → ひじ(下むき) → 手 */
function Arm({ shoulder, hand, sleeve, skin }: { readonly shoulder: Point; readonly hand: Point; readonly sleeve: string; readonly skin: string }) {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.min(Math.max(Math.hypot(dx, dy), 4), ARM_PART * 2 - 0.4)
  const base = Math.atan2(dy, dx)
  const bend = Math.acos(Math.min(Math.max(d / 2 / ARM_PART, -1), 1))
  const elbow: Point = [shoulder[0] + Math.cos(base + bend) * ARM_PART, shoulder[1] + Math.sin(base + bend) * ARM_PART]
  const tip: Point = [shoulder[0] + Math.cos(base) * d, shoulder[1] + Math.sin(base) * d]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={sleeve} strokeWidth="5.4" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${tip[0]} ${tip[1]}`} fill="none" stroke={skin} strokeWidth="4" strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r="3" fill={SKIN} />
    </>
  )
}

/** 右むきの かお。気持ちで 目と口を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="27.4" cy="34" rx="2.1" ry="1.5" fill={CHEEK} opacity="0.55" />
      {mood === 'bored' && (
        <>
          <path d="M26.2 29.6 l4 0.9" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <path d="M26.8 31.4 h3.4" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M28.6 36.2 q1.6 -1 3 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="28.8" cy="31" r="1.7" fill={EYE} />
          <circle cx="29.3" cy="30.4" r="0.6" fill="#ffffff" />
          <ellipse cx="31" cy="35.6" rx="1.1" ry="1.4" fill={MOUTH} />
        </>
      )}
      {mood === 'busy' && (
        <>
          <circle cx="29.2" cy="31.2" r="1.45" fill={EYE} />
          <circle cx="29.7" cy="30.7" r="0.5" fill="#ffffff" />
          <path d="M28.4 35.4 Q30.2 37.2 32 35.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M26.8 31.6 Q28.6 28.8 30.6 31.6" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M27.6 34.6 Q30 38.6 32.4 34.6 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type GirlProps = {
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly headTilt: number
}

function Girl({ mood, nearHand, farHand, headTilt }: GirlProps) {
  return (
    <>
      {/* あし(スカートの下から) */}
      <rect x="17.6" y="81" width="4" height="11" rx="2" fill={SKIN} />
      <rect x="24.6" y="81" width="4" height="11" rx="2" fill={SKIN} />
      <rect x="17.6" y="88" width="4" height="4.6" fill={SOCK} />
      <rect x="24.6" y="88" width="4" height="4.6" fill={SOCK} />
      <ellipse cx="21.6" cy="93.6" rx="4.6" ry="2.3" fill={SHOE} />
      <ellipse cx="28.8" cy="93.6" rx="4.6" ry="2.3" fill={SHOE} />
      {/* どう と スカート */}
      <rect x="16.4" y="38" width="14" height="30" rx="6.5" fill={DRESS} />
      <path d="M15 63 Q23.4 66 31.8 63 L35 84 Q23.4 87 11.8 84 Z" fill={DRESS_DARK} />
      <path d="M15.6 66 Q23.4 69 31 66" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
      {/* くび(みじかく どう の まんなか の上) */}
      <rect x="21" y="35" width="5" height="6" rx="2" fill={SKIN_SHADE} />
      {/* むこうの うで → てまえの うで */}
      <Arm shoulder={SHOULDER_FAR} hand={farHand} sleeve={DRESS_DARK} skin={SKIN_SHADE} />
      <Arm shoulder={SHOULDER_NEAR} hand={nearHand} sleeve={DRESS} skin={SKIN} />
      {/* あたま */}
      <Layer rotate={headTilt} origin={[23.5, 38]}>
        {/* うしろがみ と ポニーテール(りぼん つき) */}
        <ellipse cx="22" cy="29" rx="9" ry="10" fill={HAIR} />
        <circle cx="13.6" cy="29" r="4.2" fill={HAIR} />
        <path d="M13.6 33 q-1.2 4 0.6 7" fill="none" stroke={HAIR} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M16.6 26.4 l-3 -2.2 l0.4 4.6 Z M16.6 26.4 l-1.2 4.2 l4 -1.2 Z" fill="#e8534a" />
        <circle cx="25.4" cy="30.2" r="8.4" fill={SKIN} />
        <path d="M16.6 28.6 C16.2 20 26.4 17.4 32.4 22.4 C33.8 24.2 34 27 33.6 28.6 C30.4 25.4 24 24.4 16.6 28.6 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/* ───────── ぬの と 針 ───────── */

/** ぬの。ぬい目(糸の線)は 字の画と おなじ線。ぬった ぶんだけ のびていく */
function Cloth({ t }: SceneProps) {
  const { scale, x, y } = clothState(t)
  const appear = span(t, 0.5, 0.9, easeOut)
  return (
    <Layer opacity={appear} x={x} y={y} scale={scale} origin={CLOTH_CENTER}>
      <rect x={CLOTH_CENTER[0] - CLOTH_HALF + 1.6} y={CLOTH_CENTER[1] - CLOTH_HALF + 2.4} width={CLOTH_HALF * 2} height={CLOTH_HALF * 2} rx="6" fill="#000000" opacity="0.1" />
      <rect x={CLOTH_CENTER[0] - CLOTH_HALF} y={CLOTH_CENTER[1] - CLOTH_HALF} width={CLOTH_HALF * 2} height={CLOTH_HALF * 2} rx="6" fill={CLOTH} stroke={CLOTH_EDGE} strokeWidth="2.4" />
      {PATHS.map((_, i) => (
        <Bone key={i} char={CHAR} n={i + 1} color={THREADS[Math.floor(i / 2)]} width={4.4} to={span(t, STITCH + i * STEP, STITCH + i * STEP + STEP * 0.8)} />
      ))}
    </Layer>
  )
}

/** 針の先が いま どこか(字の座標)。ぬう間は 画に そい、つぎの画へは 少し はなれて うつる */
function needleOnCloth(t: number): { readonly at: Point; readonly travel: number; readonly stroke: number; readonly done: number } {
  const u = Math.min(Math.max((t - STITCH) / STEP, 0), STROKES - 1e-6)
  const i = Math.floor(u)
  const f = u - i
  const sewing = Math.min(f / 0.8, 1)
  if (f < 0.8 || i >= STROKES - 1) return { at: onPath(PATHS[i], sewing), travel: 0, stroke: i, done: sewing }
  const k = (f - 0.8) / 0.2
  return { at: lerpPoint(PATHS[i][7], PATHS[i + 1][0], k), travel: Math.sin(k * Math.PI), stroke: i, done: 1 }
}

/** 針と、てもとの 糸(いま ぬっている 色) */
function Needle({ tip, hand, color }: { readonly tip: Point; readonly hand: Point; readonly color: string }) {
  return (
    <>
      <path d={`M${hand[0]} ${hand[1]} L${tip[0]} ${tip[1]}`} stroke={NEEDLE} strokeWidth="0.9" strokeLinecap="round" />
      <path d={`M${hand[0] + 0.4} ${hand[1] - 0.6} q-3 2 -1 6 q1.4 2.4 0 4.4`} fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** つまらなくて「ふう」 */
function Sigh({ t }: SceneProps) {
  const show = during(t, 0.7, 1.5, 0.2)
  if (show <= 0) return null
  const p = span(t, 0.7, 1.5, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={34 + p * 8} cy={36 + p * 1} rx={2 + p * 2.2} ry={1.5 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={37 + p * 4} cy={36.6} rx={1.1 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** ひらめき: ふきだしに、いろいろな いろの もよう が うかぶ */
function Idea({ t }: SceneProps) {
  const show = during(t, IDEA, STITCH + 0.4, 0.25)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.35, backOut)
  return (
    <g opacity={show}>
      <circle cx="37.5" cy="23" r="1.1" fill="#ffffff" stroke="#cfd9e8" strokeWidth="0.5" />
      <circle cx="41.2" cy="18.6" r="1.8" fill="#ffffff" stroke="#cfd9e8" strokeWidth="0.5" />
      <Layer scale={pop} origin={[52, 13]}>
        <ellipse cx="52" cy="13" rx="11.5" ry="8" fill="#ffffff" stroke="#cfd9e8" strokeWidth="0.7" />
        <path d="M44 14 q2 -4 4 0 t4 0 t4 0" fill="none" stroke={THREADS[0]} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M45 10.6 q2 -3 4 0 t4 0 t3.6 0" fill="none" stroke={THREADS[4]} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M45.4 17.6 q2 -3 4 0 t4 0 t3.6 0" fill="none" stroke={THREADS[3]} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
    </g>
  )
}

/** ぬい目が ひとつ ぬえるたびに、ちいさく きらり */
function StitchStar({ t, at }: { readonly t: number; readonly at: Point }) {
  const n = needleOnCloth(t)
  const glow = t >= STITCH && t < END ? Math.max(0, n.done - 0.75) * 4 : 0
  if (glow <= 0) return null
  return <Star cx={at[0] + 2.4} cy={at[1] - 2.4} r={1.9 * glow} color="#ffd24a" spin={t * 200} />
}

/** できた! ときの ほし */
function Cheer({ t }: SceneProps) {
  const show = during(t, END + 0.1, ZOOM + 0.3, 0.2)
  if (show <= 0) return null
  const spots: readonly Point[] = [[14, 20], [58, 36], [8, 52], [62, 74]]
  return (
    <g opacity={show}>
      {spots.map(([cx, cy], i) => (
        <Star key={i} cx={cx} cy={cy + wave(t, 0.5, i * 0.2) * 1.2} r={2.6 + (i % 2)} color={THREADS[(i * 2) % 6]} spin={t * 120 + i * 50} />
      ))}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)
  const cloth = clothState(t)
  const girlIn = span(t, 0.25, 0.75, backOut)

  // きもち: つまらない → ふしぎ(はこを見つける) → むちゅう(ぬう) → やった!
  const mood: Mood = t < NOTICE ? 'bored' : t < STITCH - 0.4 ? 'curious' : t < END ? 'busy' : 'joy'

  // 針を もつ手(ぬっている間だけ)。ぬっていない ときは ぬのの ふちを もつ
  const needle = needleOnCloth(t)
  const sewing = span(t, STITCH - 0.4, STITCH - 0.05, easeOut) * (1 - span(t, END + 0.05, END + 0.35, easeOut))
  const tip = toWorld(needle.at, cloth.center)
  const needleHand: Point = [tip[0] + 2 + Math.max(0, wave(t, STEP / 2)) * 0.6, tip[1] - 4.5 - needle.travel * 2.4]
  const holdNear: Point = [cloth.center[0] - 12, cloth.center[1] + 6]
  const nearHand = lerpPoint(holdNear, needleHand, sewing)
  const farHand: Point = [cloth.center[0] - 12.5, cloth.center[1] - 6]

  // きもち に合わせた あたまの かたむき(つまらない: うつむく / はこを見る: 右を むく / ぬう: ぬのを のぞく)
  const headTilt = t < NOTICE ? mix(t, 0.6, NOTICE, 0, 7) : t < END ? 5 : -4 + wave(t, 0.5) * 2
  // よろこびの はずみ
  const hop = t >= END ? Math.abs(wave(t - END, 0.7)) * 2.2 * (1 - span(t, ZOOM - 0.4, ZOOM)) : 0
  const threadColor = THREADS[Math.floor(needle.stroke / 2)]
  const girlFade = 1 - span(t, ZOOM + 0.1, ZOOM + 0.6)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Room t={t} />
        <ThreadBox t={t} />
        <Cloth t={t} />
        <Layer opacity={girlFade}>
          <Layer scale={girlIn} y={-hop} origin={[23, 94]}>
            <Girl mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} />
            {sewing > 0 && <Needle tip={tip} hand={needleHand} color={threadColor} />}
            {sewing > 0 && <StitchStar t={t} at={tip} />}
          </Layer>
          <Sigh t={t} />
          <Idea t={t} />
          <Cheer t={t} />
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
    { at: 0, label: 'まっしろな ぬのを もって、つまらなそうな 女の子', sound: 'pop' },
    { at: NOTICE, label: '糸の はこを 見つけて「あ!」と ひらめく', sound: 'pop' },
    { at: STITCH, label: 'いろいろな 糸で、もようを ぬっていく' },
    { at: END, label: 'できた! ぬのを かかげて よろこぶ', sound: 'ok' },
    { at: ZOOM, label: 'ぬのが 大きく うつる' },
    { at: INK, label: 'ぬい目の ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '絵 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
