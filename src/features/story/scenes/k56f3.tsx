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
 * こどもは Person(共通部品)。ボードの 絵を かく ときは ボードに せなかを むける(うしろすがた)。
 *   かく手は 手の 点({ to })で クレヨンの 先を おう。とどく ほう の 手(左 か 右)を つかう。
 *   ひくい ところ(川の 下・道)を かく ときは しゃがむ(posture の 'squat')。
 *   ボードの 絵が 体で かくれても よい(まえに 立つ ので)。できた ときは ふりむいて とびあがる。
 */
import { backOut, clamp01, during, easeInOut, easeOut, inkTiming, span, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'
import { Backdrop, CLOTHES, LOOKS, mixLimb, mixPose, Person, personRig, posture, turnAround, walk, type Limb } from '../sceneFigures'

const CHAR = '図'

const WOOD = '#8c5b3c'
const PAPER = '#fffaf0'
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
/** こどもが ボードの まえに 立って、ボードの ほうを むく */
const ENTER_B = 1.5
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

/** うで を のばしはじめる 前おき(秒) */
const LEAD = 0.5

/* ───────── こども の 大きさ・立つ 場所 ───────── */

const GROUND_Y = 96
const KID_HEIGHT = 64
/** ボードの まえに 立つ 場所(ここから 左右の うで で とどかせる) */
const KID_X = 60
const OFF_X = 130
/** 手が クレヨンの 先から はなれる ぶん(クレヨンを にぎる ところ) */
const GRIP = 4

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

type Seg = {
  readonly span: readonly [number, number]
  readonly pts: readonly Pt[]
  readonly crayon: string
}

const SEGS: readonly Seg[] = [
  { span: HOUSE1, pts: HOUSE1_PTS, crayon: OUTLINE_RED },
  { span: HOUSE2, pts: HOUSE2_PTS, crayon: OUTLINE_ORANGE },
  { span: RIVER_T, pts: RIVER_PTS, crayon: RIVER },
  { span: ROAD_T, pts: ROAD_PTS, crayon: ROAD },
]

const segStart = (s: Seg): Pt => s.pts[0]
const segEnd = (s: Seg): Pt => s.pts[s.pts.length - 1]

/** クレヨンの先の 場所。かいている間は 線の上、はなれている間は つぎの 場所へ うつる */
function tipAt(t: number): Pt {
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
function Thought({ t, head }: SceneProps & { readonly head: Pt }) {
  const show = during(t, 0.9, 1.9, 0.25)
  if (show <= 0) return null
  const pop = span(t, 0.9, 1.25, backOut)
  return (
    <g transform={`translate(${head[0] - 94.5} ${head[1] - 38})`}>
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
    </g>
  )
}

/* ───────── こども ───────── */

const HANG: Limb = { swing: 3, bend: 8 }
const BANZAI: Limb = { swing: 155, bend: 15 }

/** できた しゅんかん の きらきら(こどもの まわり) */
function Cheer({ t, at }: SceneProps & { readonly at: Pt }) {
  const show = during(t, CHEER_A + 0.2, JUMP[1] + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, CHEER_A + 0.2, JUMP[1] + 0.2)
  return (
    <g opacity={show} fill="none" stroke="#ffc233" strokeWidth="1.3" strokeLinecap="round">
      {[-1, 0, 1].map((k) => {
        const angle = (-90 + k * 38) * (Math.PI / 180)
        const r1 = 14 + p * 3
        const r2 = r1 + 5
        return <path key={k} d={`M${at[0] + Math.cos(angle) * r1} ${at[1] + Math.sin(angle) * r1} L${at[0] + Math.cos(angle) * r2} ${at[1] + Math.sin(angle) * r2}`} />
      })}
    </g>
  )
}

/** こども の 場所と かっこう。あるいてきて ボードに せなかを むけ、かく → ふりむいて とびあがる */
function kidAt(t: number, tip: Pt) {
  const walking = walk(t, { from: OFF_X, to: KID_X, start: ENTER_A, end: ENTER_B, build: 'child', height: KID_HEIGHT, step: KID_HEIGHT * 0.42 })
  const turn = t < CHEER_A ? turnAround(t, ENTER_B, 'left', 'back') : turnAround(t, CHEER_A, 'back', 'front')
  const settled = t >= ENTER_B + 0.3
  // かく 手: クレヨンの先が 体の 左なら 左手(画面の 左)、右なら 右手
  const engaged = span(t, SEGS[0].span[0] - LEAD, SEGS[0].span[0]) * (1 - span(t, CHEER_A - 0.1, CHEER_A + 0.15))
  const leftWeight = 1 - span(tip[0], KID_X - 4, KID_X + 4)
  const hand = (side: 1 | -1): Pt => [tip[0] + side * GRIP, tip[1] - 3]
  const leftArm = mixLimb(HANG, { to: hand(1) }, engaged * leftWeight)
  const rightArm = mixLimb(HANG, { to: hand(-1) }, engaged * (1 - leftWeight))
  // ひくい ところを かく ときは しゃがむ
  const crouch = engaged * span(tip[1], 62, 78)
  const legs = mixPose(posture('stand', 'back'), posture('squat', 'back'), crouch)
  const cheer = span(t, CHEER_A, CHEER_A + 0.3, easeOut)
  const jumpP = span(t, JUMP[0], JUMP[1])
  const jump = Math.abs(Math.sin(jumpP * Math.PI * 2)) * 3.5 * (jumpP > 0 && jumpP < 1 ? 1 : 0)
  const pose = settled ? { ...legs, leftArm: mixLimb(leftArm, BANZAI, cheer), rightArm: mixLimb(rightArm, BANZAI, cheer), head: 0, torso: 0 } : walking.pose
  const side = leftWeight >= 0.5 ? 'left' : 'right'
  const tools = engaged > 0.3 ? { [side]: { kind: 'pencil' as const, tip, ink: crayonColor(t) } } : undefined
  return {
    placement: { ...walking, ...turn, y: GROUND_Y, lift: jump, pose },
    tools,
    face: t >= CHEER_A ? ('joy' as const) : ('normal' as const),
  }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)
  const tip = tipAt(t)
  const kid = kidAt(t, tip)
  const head = personRig(kid.placement).world.head
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Backdrop t={t} sun={[11, 11]} clouds={[[26, 6, 1], [56, 9, 0.85]]} />
        <Board t={t} />
        <MapArt t={t} />
        <Person {...kid.placement} look={{ ...LOOKS.boy, top: CLOTHES.orange.top }} face={kid.face} tools={kid.tools} />
        <Thought t={t} head={head} />
        <Cheer t={t} at={head} />
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
