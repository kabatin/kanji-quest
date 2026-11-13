/*
 * 図(ず): こどもが、木の わくの ボードに「ちず」を かく。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … ボードの 木の わく の 左の はしら
 *   2画目(𠃍)   … わく の 上の よこぼう と 右の はしら
 *   7画目(一)   … わく の 下の よこぼう(これで ぐるっと かこいに なる)
 *   3画目(ヽ)   … 1けんめの いえの やね の 右がわ
 *   4画目(ヽ)   … 2けんめの いえの やね の 右がわ
 *   5画目(ノ)   … 右上の いけ から ながれてくる 川
 *   6画目(㇏)   … いえ から のびる 道(川を わたる ところは はし)
 *
 * ながれ
 *   木の わくの ボードが たつ → こどもが クレヨンを もって やってきて、
 *   むらの ようすを おもいだす(ふきだし)
 *   → いえを 2けん かく → 川を かく(川に そって あるく)
 *   → いえ から のびる 道を かいて、川の ところに はしを かける
 *   → 「できた!」と とびはねる → ほね が ひかって、絵が うすくなり、字「図」が のこる
 *
 * こどもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。かく手は、いつも かた から とどく ところ だけ。
 *   手が とどかなく なる前に、こどもが あるいて 場所を かえる。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '図'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f1a23a'
const TUNIC_DARK = '#d98a22'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const WOOD = '#8c5b3c'
const PAPER = '#fffaf0'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const RIVER = '#5aaee8'
const RIVER_LIGHT = '#bfe3fa'
const ROAD = '#c58b52'
const ROOF_RED = '#e8685a'
const ROOF_ORANGE = '#f2a93b'
const WALL = '#ffe9b0'
const OUTLINE_RED = '#d9534f'
const OUTLINE_ORANGE = '#e08a1e'
const DOOR = '#a8683f'

type Pt = readonly [number, number]

/** くぎり の時間(秒) */
const ENTER_A = 0.2
const ENTER_B = 1.0
/** こどもが 考えている間(ふきだし)。そのあと 手を うごかしはじめる */
const THINK_END = 1.5
/** 絵を かく 時間 */
const HOUSE1: readonly [number, number] = [2.0, 2.65]
const HOUSE2: readonly [number, number] = [2.95, 3.5]
const RIVER_T: readonly [number, number] = [3.9, 4.8]
const ROAD_T: readonly [number, number] = [5.15, 5.7]
/** 道を かきおえて、はしが かかる */
const BRIDGE: readonly [number, number] = [5.7, 5.95]
const CHEER_A = 5.8
const JUMP: readonly [number, number] = [6.0, 6.6]
const INK = 6.7
const DONE = 10.6
const DURATION = 11.1

/** あるきはじめて 手を のばすまでの 前おき(秒)と、かきおえて 立ちなおる あと(秒) */
const LEAD = 0.5
const TAIL = 0.4

/* ───────── こども の 大きさ・かたの 位置 ───────── */

/** こどもを 大きくする倍率(ボードの 絵に 手が とどくように) */
const K = 1.2
/** こども の 足もと の 高さ(地面) */
const GROUND_Y = 96
/** かた の 位置(足もとから): よこ・たて(上が マイナス) */
const SHOULDER_DX = 7.4
const SHOULDER_DY = -35
/** うで の 1ぶし の長さ(かた→ひじ、ひじ→手) */
const ARM = 14 * K
/** クレヨンが 手から つき出る 長さ */
const CRAYON = 5
/** こどもが 立つ いちばん右(わく の外に 出ない ところ)。かきおわった あと も ここ */
const STAND_X = 94.5
const OFF_X = 130
const SHOULDER_Y = GROUND_Y + SHOULDER_DY * K

const shoulder = (x: number, side: -1 | 1): Pt => [x + side * SHOULDER_DX * K, SHOULDER_Y]

/* ───────── 点と線 の こまごま ───────── */

const lerpPt = (a: Pt, b: Pt, p: number): Pt => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]
const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1])
const polyLength = (pts: readonly Pt[]): number => pts.slice(1).reduce((sum, pt, i) => sum + dist(pts[i], pt), 0)

/** 折れ線の、はじめから p(0〜1)の ところの 点 */
function polyAt(pts: readonly Pt[], p: number): Pt {
  let rest = clamp01(p) * polyLength(pts)
  for (let i = 1; i < pts.length; i += 1) {
    const seg = dist(pts[i - 1], pts[i])
    if (rest <= seg || i === pts.length - 1) return lerpPt(pts[i - 1], pts[i], seg === 0 ? 0 : Math.min(1, rest / seg))
    rest -= seg
  }
  return pts[pts.length - 1]
}

/** 折れ線の、はじめから p(0〜1)まで の 線(クレヨンが かいた ぶん) */
function polyPart(pts: readonly Pt[], p: number): string {
  if (p <= 0) return ''
  let rest = clamp01(p) * polyLength(pts)
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i += 1) {
    const seg = dist(pts[i - 1], pts[i])
    if (rest >= seg) {
      d += ` L${pts[i][0]} ${pts[i][1]}`
      rest -= seg
    } else {
      const [x, y] = lerpPt(pts[i - 1], pts[i], seg === 0 ? 0 : rest / seg)
      return `${d} L${x} ${y}`
    }
  }
  return d
}

/* ───────── かく ものの 形 ───────── */

/** 1けんめの いえ: 左の すそ → やね の てっぺん → 3画目(右がわ) → かべ。クレヨンは この順に すすむ */
const HOUSE1_PTS: readonly Pt[] = [[25, 45.7], [33, 37.1], [34.4, 38.1], [35.7, 39.1], [37, 40.3], [38.2, 41.5], [39.3, 42.8], [40.2, 44.2], [41, 45.7], [39.2, 45.7], [39.2, 56], [27.2, 56], [27.2, 45.7]]
/** 2けんめの いえ: 4画目(右がわ)が やねの 右の すそ */
const HOUSE2_PTS: readonly Pt[] = [[40.6, 41], [47.38, 30.4], [48.9, 31.6], [50.3, 32.9], [51.6, 34.4], [52.9, 35.9], [54, 37.5], [55, 39.2], [55.8, 41], [54.6, 41], [54.6, 50.5], [43.4, 50.5], [43.4, 41]]
/** 5画目(川)・6画目(道)の 通り道の 点(scene-info の まま) */
const RIVER_PTS: readonly Pt[] = [[72, 32.2], [70, 40.9], [66, 49.1], [61.1, 56.8], [55.4, 63.9], [49, 70.4], [41.8, 76], [34, 80.8]]
const ROAD_PTS: readonly Pt[] = [[40.3, 54.5], [45.1, 56.7], [49.8, 59.3], [54.3, 62.1], [58.7, 65.2], [62.9, 68.5], [66.9, 72], [70.5, 76]]
/** 川と道が まじわる ところ(はしを かける) */
const CROSSING: Pt = [56, 63.4]

/** かたの たかさ(54)から、手が とどく はんい に 入る よこの きょり。川や道では これで こどもの 立つ場所を 決める */
function standFor(tip: Pt): number {
  const dy = SHOULDER_Y - tip[1]
  const gap = Math.min(24, Math.max(14, Math.sqrt(Math.max(0, 26 * 26 - dy * dy))))
  return Math.min(STAND_X, tip[0] + SHOULDER_DX * K + gap)
}

type Seg = {
  readonly span: readonly [number, number]
  readonly pts: readonly Pt[]
  readonly crayon: string
  /** 手の 先(クレヨンの先)に 合わせた、こどもの 立つ 場所 */
  readonly stand: (tip: Pt) => number
}

const SEGS: readonly Seg[] = [
  // いえは、右がわの 空いている ところに 立って かく(自分の 体で かく所を かくさない)
  { span: HOUSE1, pts: HOUSE1_PTS, crayon: OUTLINE_RED, stand: () => 62 },
  { span: HOUSE2, pts: HOUSE2_PTS, crayon: OUTLINE_ORANGE, stand: () => 74 },
  { span: RIVER_T, pts: RIVER_PTS, crayon: RIVER, stand: standFor },
  { span: ROAD_T, pts: ROAD_PTS, crayon: ROAD, stand: standFor },
]

const segStart = (s: Seg): Pt => s.pts[0]
const segEnd = (s: Seg): Pt => s.pts[s.pts.length - 1]

/** こどもの 立つ場所(よこ)。はじめは 右から あるいてきて、かく ものに 合わせて あるく */
function kidX(t: number): number {
  if (t < ENTER_B) return mix(t, ENTER_A, ENTER_B, OFF_X, STAND_X, easeOut)
  const first = SEGS[0]
  if (t < first.span[0]) return mix(t, first.span[0] - LEAD, first.span[0], STAND_X, first.stand(segStart(first)))
  for (let i = 0; i < SEGS.length; i += 1) {
    const seg = SEGS[i]
    if (t <= seg.span[1]) return seg.stand(polyAt(seg.pts, span(t, seg.span[0], seg.span[1])))
    const next = SEGS[i + 1]
    const gapEnd = next ? next.span[0] : seg.span[1] + TAIL
    if (t < gapEnd) return mix(t, seg.span[1], gapEnd, seg.stand(segEnd(seg)), next ? next.stand(segStart(next)) : STAND_X)
  }
  return STAND_X
}

/** クレヨンの先の 場所。かいている間は 線の上、はなれている間は つぎの 場所へ うつる。かく前は rest(だらんと 下げた手)。 */
function tipAt(t: number, rest: Pt): Pt {
  const first = SEGS[0]
  if (t < first.span[0]) return lerpPt(rest, segStart(first), easeInOut(span(t, first.span[0] - LEAD, first.span[0])))
  for (let i = 0; i < SEGS.length; i += 1) {
    const seg = SEGS[i]
    if (t <= seg.span[1]) return polyAt(seg.pts, span(t, seg.span[0], seg.span[1]))
    const next = SEGS[i + 1]
    if (next && t < next.span[0]) return lerpPt(segEnd(seg), segStart(next), easeInOut(span(t, seg.span[1], next.span[0])))
  }
  return segEnd(SEGS[SEGS.length - 1])
}

/** いま もっている クレヨンの 色(つぎの ものを かく 前から、もちかえている) */
function crayonColor(t: number): string {
  const started = SEGS.filter((seg) => t >= seg.span[0] - 0.3)
  return (started[started.length - 1] ?? SEGS[0]).crayon
}

/* ───────── 景色 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[11, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="10.2" y="0.8" width="1.6" height="3.4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 11 11)`} />
        ))}
      </Layer>
      <circle cx="11" cy="11" r={5.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="30" cy="6" rx="7" ry="3" />
        <ellipse cx="35" cy="4.6" rx="5" ry="3" />
        <ellipse cx="58" cy="9" rx="6" ry="2.6" />
        <ellipse cx="62.4" cy="7.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[5, 12, 99, 105].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 木の わくの ボード。わく は 1・2・7画目の線を そのまま つかう(はしら が 地面まで とどく) */
function Board({ t }: SceneProps) {
  const pop = span(t, 0, 0.6, backOut)
  return (
    <>
      <ellipse cx="55" cy="97.6" rx={38 * Math.min(pop, 1)} ry="2.6" fill="#000000" opacity="0.1" />
      <Layer scale={pop} origin={[54.5, GROUND_Y]}>
        <rect x="21" y="17" width="68" height="74" rx="2" fill={PAPER} />
        <Bone char={CHAR} n={1} color={WOOD} width={6} />
        <Bone char={CHAR} n={2} color={WOOD} width={6} />
        <Bone char={CHAR} n={7} color={WOOD} width={6} />
      </Layer>
    </>
  )
}

/** ボードの 紙の上に、こどもが クレヨンで かいていく もの */
function MapArt({ t }: SceneProps) {
  const p1 = span(t, HOUSE1[0], HOUSE1[1])
  const p2 = span(t, HOUSE2[0], HOUSE2[1])
  const river = span(t, RIVER_T[0], RIVER_T[1])
  const road = span(t, ROAD_T[0], ROAD_T[1])
  const fill1 = span(t, HOUSE1[1] - 0.1, HOUSE1[1] + 0.25)
  const fill2 = span(t, HOUSE2[1] - 0.1, HOUSE2[1] + 0.25)
  const bridge = span(t, BRIDGE[0], BRIDGE[1], backOut)
  return (
    <>
      {/* 1けんめの いえ */}
      <g opacity={fill1}>
        <rect x="27.2" y="45.7" width="12" height="10.3" fill={WALL} />
        <polygon points="25,45.7 33,37.1 41,45.7" fill={ROOF_RED} />
        <rect x="34.2" y="50.4" width="3.6" height="5.6" rx="0.6" fill={DOOR} />
        <rect x="29.4" y="48.4" width="3.2" height="3.2" rx="0.4" fill="#bfe3fa" />
      </g>
      <path d={polyPart(HOUSE1_PTS, p1)} fill="none" stroke={OUTLINE_RED} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {/* 2けんめの いえ */}
      <g opacity={fill2}>
        <rect x="43.4" y="41" width="11.2" height="9.5" fill={WALL} />
        <polygon points="40.6,41 47.4,30.4 55.8,41" fill={ROOF_ORANGE} />
        <rect x="46.2" y="44.4" width="3.2" height="6.1" rx="0.6" fill={DOOR} />
        <rect x="50.6" y="43.6" width="2.6" height="2.6" rx="0.4" fill="#bfe3fa" />
      </g>
      <path d={polyPart(HOUSE2_PTS, p2)} fill="none" stroke={OUTLINE_ORANGE} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {/* 川: 右上の いけ から ながれる(5画目) */}
      <ellipse cx="72.6" cy="31.4" rx={5.4 * Math.min(1, river * 8)} ry={3.8 * Math.min(1, river * 8)} fill={RIVER} />
      <Bone char={CHAR} n={5} color={RIVER} width={5.2} to={river} />
      <Bone char={CHAR} n={5} color={RIVER_LIGHT} width={1.6} to={river} />
      {/* 道: 6画目 */}
      <Bone char={CHAR} n={6} color={ROAD} width={4} to={road} />
      {/* はし: 道が 川を わたる ところ */}
      <Layer scale={bridge} origin={CROSSING}>
        <g transform={`translate(${CROSSING[0]} ${CROSSING[1]}) rotate(34)`}>
          <rect x="-6.8" y="-4" width="13.6" height="8" rx="1" fill="#d9a86c" />
          {[-4.4, -1.5, 1.5, 4.4].map((x) => (
            <path key={x} d={`M${x} -4 v8`} stroke={WOOD} strokeWidth="0.6" />
          ))}
        </g>
      </Layer>
    </>
  )
}

/** こどもが おもいだす 「むらの ようす」(いけ・川・いえ 2けん)。ふきだしの中 */
function Thought({ t }: SceneProps) {
  const show = during(t, 0.9, 1.9, 0.25)
  if (show <= 0) return null
  const pop = span(t, 0.9, 1.25, backOut)
  return (
    <Layer opacity={show} scale={pop} origin={[96, 24]}>
      <circle cx="94" cy="24" r="1.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="91.6" cy="26.4" r="0.9" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
      <ellipse cx="97" cy="11.5" rx="11" ry="9.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
      <path d="M103 4.6 L92.5 18.4" stroke={RIVER} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="91.4" y="10.2" width="5" height="3.4" fill={WALL} />
      <polygon points="90.4,10.2 93.9,6.6 97.4,10.2" fill={ROOF_RED} />
      <rect x="98.4" y="8.8" width="3.8" height="2.6" fill={WALL} />
      <polygon points="97.6,8.8 100.3,6 103,8.8" fill={ROOF_ORANGE} />
    </Layer>
  )
}

/* ───────── こども ───────── */

type Mood = 'puzzled' | 'focus' | 'happy'

type KidProps = {
  readonly x: number
  readonly lift: number
  readonly step: number
}

/** あし と どう(足もと を 原点に、上が マイナス。K 倍して 使う) */
function KidBody({ x, lift, step }: KidProps) {
  return (
    <Layer x={x} y={GROUND_Y - lift} scale={K}>
      <Layer rotate={step * 16} origin={[-3.4, -18]}>
        <rect x="-5.8" y="-18" width="5" height="17.5" rx="2.5" fill={PANTS_DARK} />
        <ellipse cx="-4" cy="-0.8" rx="4.4" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 16} origin={[3.4, -18]}>
        <rect x="0.8" y="-18" width="5" height="17.5" rx="2.5" fill={PANTS} />
        <ellipse cx="4" cy="-0.8" rx="4.4" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="-2.3" y="-42" width="4.6" height="7" rx="2" fill={SKIN_SHADE} />
      <rect x="-8.4" y="-38" width="16.8" height="21.5" rx="6" fill={TUNIC} />
      <path d="M-6.6 -24 h13.2" stroke={TUNIC_DARK} strokeWidth="1.4" strokeLinecap="round" />
    </Layer>
  )
}

function KidHead({ x, lift, mood, tilt, look }: { readonly x: number; readonly lift: number; readonly mood: Mood; readonly tilt: number; readonly look: number }) {
  return (
    <Layer x={x} y={GROUND_Y - lift} scale={K}>
      <Layer rotate={tilt} origin={[0, -39]}>
        <circle cx="-9.4" cy="-47.4" r="1.9" fill={SKIN_SHADE} />
        <circle cx="9.4" cy="-47.4" r="1.9" fill={SKIN_SHADE} />
        <circle cx="0" cy="-48" r="9.5" fill={SKIN} />
        <path d="M-9.7 -47 C-10.8 -59.5 10.8 -59.5 9.7 -47 C7 -52.5 2 -53.8 -2 -52.6 C-5 -52 -8 -50.5 -9.7 -47 Z" fill={HAIR} />
        <path d="M1.4 -57.6 Q2.6 -61.4 4.8 -59.4" fill="none" stroke={HAIR} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="-5.9" cy="-43.4" r="1.8" fill="#ff9d9d" opacity="0.55" />
        <circle cx="5.9" cy="-43.4" r="1.8" fill="#ff9d9d" opacity="0.55" />
        {mood === 'happy' ? (
          <>
            <path d="M-5 -46.2 Q-3.4 -48.8 -1.8 -46.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M1.8 -46.2 Q3.4 -48.8 5 -46.2" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
            <path d="M-3.2 -43.2 Q0 -37.8 3.2 -43.2 Z" fill={MOUTH} />
          </>
        ) : (
          <>
            <circle cx={-3.4 + look} cy="-46.6" r="1.2" fill={EYE} />
            <circle cx={3.4 + look} cy="-46.6" r="1.2" fill={EYE} />
            {mood === 'puzzled' ? (
              <>
                <path d="M-5.4 -49.6 l3.2 0.8" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
                <path d="M2 -50.6 l3.2 -1" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
                <path d="M-2.2 -41.8 q1.1 -1.3 2.2 0 t2.2 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M-5.4 -49.4 l3.2 -0.3" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
                <path d="M2.2 -49.7 l3.2 0.3" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
                <ellipse cx="0.4" cy="-41.8" rx="1.2" ry="1" fill={MOUTH} />
              </>
            )}
          </>
        )}
      </Layer>
    </Layer>
  )
}

/**
 * かた から出て、ひじ で まがる うで。かた → ひじ → 手 の じゅんに つながる。
 * tip は クレヨンの先。手は そこから CRAYON だけ手前。ひじは そとがわ・下に まがる。
 */
function Arm({ from, tip, side, crayon }: { readonly from: Pt; readonly tip: Pt; readonly side: -1 | 1; readonly crayon?: string }) {
  const full = dist(from, tip)
  const u: Pt = full === 0 ? [0, 1] : [(tip[0] - from[0]) / full, (tip[1] - from[1]) / full]
  const reachTo = crayon ? Math.max(0, full - CRAYON) : full
  const dd = Math.min(reachTo, 2 * ARM - 0.02)
  const hand: Pt = [from[0] + u[0] * dd, from[1] + u[1] * dd]
  // ひじは、かた と 手の まんなかから、すこし よこへ。そとがわ・下の ほうを えらぶ
  const half = dd / 2
  const lift = Math.sqrt(Math.max(0, ARM * ARM - half * half))
  const perp: Pt = [-u[1], u[0]]
  const sign = perp[0] * side * 0.35 + perp[1] >= 0 ? 1 : -1
  const elbow: Pt = [from[0] + u[0] * half + perp[0] * sign * lift, from[1] + u[1] * half + perp[1] * sign * lift]
  return (
    <>
      <path d={`M${from[0]} ${from[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="6.4" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.2" strokeLinecap="round" />
      {crayon ? <path d={`M${hand[0]} ${hand[1]} L${hand[0] + u[0] * CRAYON} ${hand[1] + u[1] * CRAYON}`} fill="none" stroke={crayon} strokeWidth="2.6" strokeLinecap="round" /> : null}
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

/** できた しゅんかん の きらきら(こどもの まわり) */
function Cheer({ t }: SceneProps) {
  const show = during(t, CHEER_A + 0.2, JUMP[1] + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, CHEER_A + 0.2, JUMP[1] + 0.2)
  return (
    <g opacity={show} fill="none" stroke="#ffc233" strokeWidth="1.3" strokeLinecap="round">
      {[-1, 0, 1].map((k) => {
        const angle = (-90 + k * 38) * (Math.PI / 180)
        const r1 = 33 + p * 3
        const r2 = r1 + 5
        const cx = STAND_X
        const cy = SHOULDER_Y - 6
        return <path key={k} d={`M${cx + Math.cos(angle) * r1} ${cy + Math.sin(angle) * r1} L${cx + Math.cos(angle) * r2} ${cy + Math.sin(angle) * r2}`} />
      })}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // こどもの 立つ場所 と、あるいているか
  const kx = kidX(t)
  const speed = Math.abs(kidX(t + 0.03) - kidX(t - 0.03)) / 0.06
  const walking = clamp01(speed / 6)
  const step = Math.sin(t * Math.PI * 2 * 2.2) * walking
  const jumpP = span(t, JUMP[0], JUMP[1])
  const jump = Math.abs(Math.sin(jumpP * Math.PI * 2)) * 3.5 * (jumpP > 0 && jumpP < 1 ? 1 : 0)
  const lift = jump + Math.abs(step) * 0.8

  const mood: Mood = t < THINK_END ? 'puzzled' : t < CHEER_A ? 'focus' : 'happy'
  const tilt = mood === 'puzzled' ? 7 + wave(t, 1.2) * 2 : mood === 'focus' ? -4 : wave(t, 0.6) * 2
  const look = mood === 'focus' ? -1.3 : 0

  // うで: かく手は クレヨンの先を おう。もう1本は だらんと 下げる(できたときは 2本とも 上へ)
  const shL = shoulder(kx, -1)
  const shR = shoulder(kx, 1)
  const cheer = span(t, CHEER_A, CHEER_A + 0.3, easeOut)
  const restTip: Pt = [shL[0] - 2.5 - step * 3, shL[1] + 27 + CRAYON]
  const nearTip = lerpPt(tipAt(t, restTip), [shL[0] - 12, shL[1] - 30], cheer)
  const farHang: Pt = [shR[0] + 1.5 + step * 3, shR[1] + 27 + wave(t, 1.6) * 0.6]
  const farTip = lerpPt(farHang, [shR[0] + 12, shR[1] - 28], cheer)

  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Board t={t} />
        <MapArt t={t} />
        <Thought t={t} />
        {kx < OFF_X - 1 ? <ellipse cx={kx} cy="97.4" rx="11" ry="2.4" fill="#000000" opacity="0.12" /> : null}
        <KidBody x={kx} lift={lift} step={step} />
        <Arm from={shR} tip={[farTip[0], farTip[1] - lift]} side={1} />
        <Arm from={[shL[0], shL[1] - lift]} tip={[nearTip[0], nearTip[1]]} side={-1} crayon={crayonColor(t)} />
        <KidHead x={kx} lift={lift} mood={mood} tilt={tilt} look={look} />
        <Cheer t={t} />
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
    { at: 0, label: '木の わくの ボードが たつ', sound: 'pop' },
    { at: ENTER_A, label: 'こどもが クレヨンを もって やってくる' },
    { at: 0.9, label: 'むらの ようすを おもいだす(ふきだし)' },
    { at: HOUSE1[0], label: 'いえを 2けん かく' },
    { at: RIVER_T[0], label: '川を かく(川に そって あるく)' },
    { at: ROAD_T[0], label: '道を かいて、川に はしを かける', sound: 'pop' },
    { at: CHEER_A, label: '「できた!」と とびはねる', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '図 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
