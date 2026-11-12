/*
 * 森(もり): 木が 3本 あつまって、こんもり した 森になる。
 *
 * ほね(画と絵の対応)
 *   上の木(おかの てっぺんに 立つ、とおくの木。1〜4画目)
 *     1画目(一)   … よこに のびた えだ
 *     2画目(丨)   … みき
 *     3・4画目     … 左右に ひろがって たれた えだ
 *   左下の木(てまえ。5〜8画目)
 *     5画目(一)   … よこに のびた えだ
 *     6画目(丨)   … みき
 *     7画目(ノ)   … 左へ たれた えだ
 *     8画目(丶)   … 右の みじかい えだ(となりの木に つかえて、のびられない)
 *   右下の木(てまえ。9〜12画目)
 *     9画目(一)   … よこに のびた えだ
 *     10画目(丨)  … みき
 *     11・12画目   … 左右に たれた えだ
 *
 * ながれ
 *   おかが せりあがり、てっぺんに 木が 1本 そだつ(りすが すんでいる)
 *   → どんぐりが 2つ おちて、おかを ころころ。りすが おいかけて、てまえの 土に 1つずつ うめる
 *   → めが出て、2本の木が ならんで そだつ(林が くわわる)
 *   → 木が 3本 あつまって、しげみが こんもり ふくらむ。小鳥も やってきて、りすは おおよろこび
 *   → ほね が ひかって、絵が うすくなり、字「森」が のこる
 *
 * 上の木は おかの上に あって とおいので、てまえの 2本より 上に 小さく見える(字の 上の「木」が 小さめなのと 同じ)。
 * 木は、ほんものの木の つくり を守る: えだ は みき から出て、えだ先 と みきの てっぺん は 葉に うもれる。
 *   しげみ は えだ の うしろ に置く(葉の あいだ から えだ が 見える)。こうすると 木が こんもり しても、画の形が 見えたまま になる。
 *   8画目は みき から はなれているので、つけね を足して みき に つなぐ。
 * りすも、ほんものの つくり(うしろあし の もも・まえあし・せなかに そって 立つ しっぽ・あたまの上の 耳)で描く。
 * りす と どんぐり は、おかの上(とおく)から てまえへ くるほど 大きくする。
 */
import type { ReactNode } from 'react'
import { backOut, clamp01, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '森'

const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const HILL = '#d5edbf'
const SUN = '#ffd24a'
const SOIL = '#a8774e'
const SOIL_DARK = '#7d5435'
const SPROUT_GREEN = '#7cc96b'
const SPROUT_STEM = '#5aa94f'
const FUR = '#c9773f'
const FUR_DARK = '#9e5a2c'
const FUR_SHADE = '#b9692f'
const FUR_SHINE = '#e09a5e'
const FUR_LIGHT = '#f6e2c2'
const ACORN = '#c08345'
const ACORN_CAP = '#7a5230'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const APPEAR = 1.05
/** りすが おかの上に 出きる */
const PEEK = 1.35
/** どんぐりが おちる */
const DROP = 1.35
/** りすが おかを かけおりる */
const RUN = 1.85
/** 左・右の どんぐり を うめる */
const DIG_L = 2.4
const DIG_R = 3.3
/** ほりおわって、まんなかへ さがり おわる */
const SETTLE = 3.98
/** めが出る → 2本の木が そだつ */
const SPROUT = 4.0
const GROW = 4.25
/** 右の め・木は、左より 少し おくれる(ならんで いっしょに そだつ けど、少し ずらすと いきいき 見える) */
const LAG = 0.12
/** 3本 そろって こんもり */
const LUSH = 5.45
const INK = 6.7
const DONE = 10.4
const DURATION = 11.2

/** ほる のに かける時間 */
const DIG_TIME = 0.45

type Point = readonly [number, number]
type Circle = readonly [cx: number, cy: number, r: number]

const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** どんぐりを うめる ところ = てまえの 2本の みき の ねもと */
const SPOT_L: Point = [34, 97.6]
const SPOT_R: Point = [69.4, 98.4]

/** りすの 足もと: おかの てっぺん(上の木の 右)→ 左の あなの よこ → 右の あなの よこ → まんなかで 見まもる */
const NEST: Point = [65, 49.7]
const DIG_POS_L: Point = [40.2, 97.6]
const DIG_POS_R: Point = [63.3, 98]
const WATCH: Point = [57.8, 97.8]
/** おかの上では とおいので 小さく、てまえに くるほど 大きく見える */
const FAR_SIZE = 0.8
const NEAR_SIZE = 1.15

/** おか: てっぺん(54, 48.5)に 上の木の ねもとが くる */
const HILL_PATH = 'M-6 96 C4 82 22 56 40 50.5 Q54 46.5 68 50.5 C86 56 104 80 115 94 V112 H-6 Z'

type TreeSpec = {
  /** みき・よこの えだ・左の えだ・右の えだ の 画番号 */
  readonly trunk: number
  readonly bough: number
  readonly left: number
  readonly right: number
  readonly trunkWidth: number
  readonly branchWidth: number
  /** みきの ねもと(みきが のびる じく) */
  readonly base: Point
  /** ねもとの かげ の はば(おかの てっぺん では、まるい 地面から はみ出さないよう 小さく) */
  readonly shadow: number
  /** ねもとの ひろがり と、みきの もよう */
  readonly roots: string
  readonly grain: string
  /** えだが わかれる ところ(えだが ひろがる じく) */
  readonly fork: Point
  /**
   * しげみ(えだ の うしろ に ある 葉の かたまり)。えだ は その上に 見える。
   * at = ふくらむ じく / dark = こい葉 / light = 日の あたる 葉 / shine = ひかり
   */
  readonly canopyAt: Point
  readonly dark: readonly Circle[]
  readonly light: readonly Circle[]
  readonly shine: readonly Circle[]
  /** みきの てっぺんを つつむ 葉(みきが 葉の中へ 入っていくように見せる) */
  readonly cap: Circle
  /** えだ先の 小さな しげみ */
  readonly tips: readonly Circle[]
  /** こんもり したとき、しげみ の外に 出ている えだ にも ふえる 葉 */
  readonly tufts: readonly Circle[]
  /** みき から はなれた 画を、みき に つなぐ つけね */
  readonly joint?: string
}

/** 上の木(とおい ので、みき・えだ を 少し ほそく) */
const BACK_TREE: TreeSpec = {
  trunk: 2,
  bough: 1,
  left: 3,
  right: 4,
  trunkWidth: 5.2,
  branchWidth: 3.3,
  base: [53.8, 49],
  shadow: 4.2,
  roots: 'M49.4 49.6 Q52 47.2 51.4 43 L56.4 43 Q56 47.2 58.4 49.6 Z',
  grain: 'M52.8 36 q1 3 0 6',
  fork: [53.6, 23],
  canopyAt: [53.5, 22],
  dark: [
    [53.5, 13, 10],
    [41, 19, 8.5],
    [66, 18.5, 8.5],
    [31, 27, 6.5],
    [77, 26, 6.5],
    [45, 29, 7.5],
    [62, 29, 7.5],
    [53.5, 27, 6],
  ],
  light: [
    [50.5, 10.5, 6.8],
    [39, 16.5, 5.5],
    [63.5, 14.5, 5.5],
    [29.5, 25, 3.4],
    [75, 23.2, 3.4],
  ],
  shine: [
    [48, 7.6, 2.4],
    [37.5, 14.2, 1.6],
    [62, 11.6, 1.8],
  ],
  cap: [53, 9.6, 4.4],
  tips: [
    [30.1, 23.7, 3.2],
    [77.2, 20.8, 3.2],
    [20.5, 45.5, 3.6],
    [89.8, 43.5, 3.6],
  ],
  tufts: [[31.6, 40.4, 2.4]],
}

/** 左下の木 */
const LEFT_TREE: TreeSpec = {
  trunk: 6,
  bough: 5,
  left: 7,
  right: 8,
  trunkWidth: 6,
  branchWidth: 3.6,
  base: [33.9, 98.2],
  shadow: 7,
  roots: 'M28.6 98.8 Q31.6 95.8 30.9 90.5 L36.9 90.5 Q36.2 95.8 39.2 98.8 Z',
  grain: 'M33 79 q1.4 4 0 8',
  fork: [33.8, 60.5],
  canopyAt: [31, 60],
  dark: [
    [33.5, 52.5, 9],
    [22, 58.5, 7.5],
    [44, 56.5, 7.5],
    [14.5, 64, 5.5],
    [27, 66, 8],
    [40, 66, 6.5],
    [19, 70.5, 5.5],
  ],
  light: [
    [30.5, 50, 6],
    [19.5, 56.5, 4.5],
    [41.5, 53.5, 4.5],
    [12.8, 62.4, 2.8],
  ],
  shine: [
    [28.5, 47.5, 2],
    [40, 51.5, 1.4],
  ],
  cap: [32.8, 46.6, 4.2],
  tips: [
    [12.5, 61.1, 3.4],
    [45.9, 58.6, 3],
    [13.5, 88, 3.8],
    [44.1, 73.5, 3],
  ],
  tufts: [[18.6, 82.8, 2.4]],
  // 8画目(丶)の 書きはじめ は みき から はなれているので、みき から そこまで えだ を のばす
  joint: 'M34 63.4 C35.4 64.5 36.5 66.3 37.61 67.19',
}

/** 右下の木 */
const RIGHT_TREE: TreeSpec = {
  trunk: 10,
  bough: 9,
  left: 11,
  right: 12,
  trunkWidth: 6,
  branchWidth: 3.6,
  base: [69.3, 99],
  shadow: 7,
  roots: 'M64 99.4 Q67.2 96.4 66.4 91 L72.3 91 Q71.6 96.4 74.8 99.4 Z',
  grain: 'M68.6 80 q1.4 4 0 8',
  fork: [69.4, 59],
  canopyAt: [70, 58],
  dark: [
    [69, 49.5, 10],
    [57.5, 55.5, 7],
    [80.5, 54.5, 8],
    [89, 62, 5.5],
    [63, 66, 7.5],
    [77, 67, 8],
    [89.5, 70, 5],
  ],
  light: [
    [66, 46, 6.5],
    [55.5, 53, 4.2],
    [78, 51.5, 5],
    [88, 60, 3],
  ],
  shine: [
    [64, 43.5, 2],
    [77, 49, 1.4],
  ],
  cap: [68.4, 43, 4.2],
  tips: [
    [52.3, 60, 3],
    [88.3, 57.5, 3.4],
    [45.3, 88.8, 3.8],
    [97.8, 89.5, 3.8],
  ],
  tufts: [
    [55.6, 79.4, 2.2],
    [89.4, 82.4, 2.4],
  ],
}

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
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="2" cy="36" rx="6.4" ry="3" />
        <ellipse cx="6.4" cy="34.4" rx="4.4" ry="3" />
        <ellipse cx="94" cy="28" rx="6" ry="2.8" />
        <ellipse cx="98.4" cy="26.4" rx="4.2" ry="2.8" />
      </g>
    </>
  )
}

/** おかの 草と 花(ひろい おかが さびしく ならないように) */
const HILL_GRASS: readonly Point[] = [
  [13, 82],
  [31, 64],
  [79, 62],
  [93, 78],
]
const HILL_FLOWERS: readonly (readonly [number, number, string])[] = [
  [22, 74, '#ff9db5'],
  [86, 70, '#ffe066'],
  [44, 58, '#ffffff'],
]

/**
 * おか。下から せりあがって、てっぺんに 上の木を のせる。
 * behind は おかの うしろ(おかの むこうがわ から ひょっこり 出てくる もの)。
 */
function Hill({ t, behind, children }: SceneProps & { readonly behind?: ReactNode; readonly children: ReactNode }) {
  const rise = span(t, 0, 0.65, easeOut)
  return (
    <Layer y={(1 - rise) * 56}>
      {behind}
      <path d={HILL_PATH} fill={HILL} />
      {HILL_GRASS.map(([x, y]) => (
        <path key={x} d={`M${x} ${y} l1 -2.6 l0.8 2.3 l1.2 -3 l0.6 3.3 Z`} fill="#a9d98d" />
      ))}
      {HILL_FLOWERS.map(([x, y, color]) => (
        <g key={x}>
          {[0, 72, 144, 216, 288].map((deg) => (
            <circle key={deg} cx={x} cy={y - 0.9} r="0.75" fill={color} transform={`rotate(${deg} ${x} ${y})`} />
          ))}
          <circle cx={x} cy={y} r="0.55" fill="#f2a93b" />
        </g>
      ))}
      {children}
    </Layer>
  )
}

/** てまえの 地面 */
function Field() {
  return (
    <>
      <ellipse cx="54.5" cy="98.8" rx="53" ry="5.2" fill={GRASS} />
      {[5, 47, 80, 101].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 葉の かたまり(こい色 + うすい色)。じぶんの まんなか から ぽん と ふくらむ。 */
function Tuft({ circle, scale }: { readonly circle: Circle; readonly scale: number }) {
  const [cx, cy, r] = circle
  if (scale <= 0) return null
  return (
    <Layer scale={scale} origin={[cx, cy]}>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.64} fill={LEAF} />
    </Layer>
  )
}

function Circles({ circles, color }: { readonly circles: readonly Circle[]; readonly color: string }) {
  return (
    <>
      {circles.map(([cx, cy, r]) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </>
  )
}

/** 木の そだち ぐあい(みき・えだ・葉)と、こんもり ふくらむ 度合い */
type Growth = { readonly trunk: number; readonly boughs: number; readonly leaves: number; readonly lush: number }

/** めが出てから そだつ、てまえの木。みき → えだ → 葉 の じゅんに のびる。 */
function youngTree(t: number, start: number, lush: number): Growth {
  return {
    trunk: span(t, start, start + 0.5, backOut),
    boughs: span(t, start + 0.3, start + 0.7, backOut),
    leaves: span(t, start + 0.5, start + 0.95, backOut),
    lush,
  }
}

function Tree({ spec, grow, sway }: { readonly spec: TreeSpec; readonly grow: Growth; readonly sway: number }) {
  if (grow.trunk <= 0) return null
  // そだった ばかり の しげみ は 小さめ。3本 そろうと こんもり ふくらむ
  const canopy = grow.leaves * (0.78 + 0.22 * grow.lush)
  const tuft = grow.leaves * (0.85 + 0.15 * grow.lush)
  return (
    <>
      <ellipse cx={spec.base[0]} cy={spec.base[1] + 0.3} rx={spec.shadow * grow.trunk} ry="1.3" fill="#000000" opacity="0.1" />
      {canopy > 0 && (
        <Layer scale={canopy} rotate={sway} origin={spec.canopyAt}>
          <Circles circles={spec.dark} color={LEAF_DARK} />
          <Circles circles={spec.light} color={LEAF} />
          <Circles circles={spec.shine} color={LEAF_LIGHT} />
        </Layer>
      )}
      <Layer scaleX={0.6 + 0.4 * grow.trunk} scaleY={grow.trunk} origin={spec.base}>
        <path d={spec.roots} fill={BARK} />
        <Bone char={CHAR} n={spec.trunk} color={BARK} width={spec.trunkWidth} />
        <path d={spec.grain} fill="none" stroke={BARK_DARK} strokeWidth="1.1" strokeLinecap="round" />
      </Layer>
      <Layer scale={grow.boughs} origin={spec.fork}>
        <Bone char={CHAR} n={spec.bough} color={BARK} width={spec.branchWidth} />
        <Bone char={CHAR} n={spec.left} color={BARK} width={spec.branchWidth} />
        {spec.joint && <path d={spec.joint} fill="none" stroke={BARK} strokeWidth={spec.branchWidth} strokeLinecap="round" />}
        <Bone char={CHAR} n={spec.right} color={BARK} width={spec.branchWidth} />
      </Layer>
      {/* みきの てっぺん は 葉に うもれる */}
      {tuft > 0 && (
        <Layer scale={tuft} origin={[spec.cap[0], spec.cap[1]]}>
          <circle cx={spec.cap[0]} cy={spec.cap[1]} r={spec.cap[2]} fill={LEAF} />
          <circle cx={spec.cap[0] - 1.2} cy={spec.cap[1] - 1.4} r={spec.cap[2] * 0.42} fill={LEAF_LIGHT} />
        </Layer>
      )}
      {spec.tips.map((circle) => (
        <Tuft key={circle.join()} circle={circle} scale={tuft} />
      ))}
      {spec.tufts.map((circle) => (
        <Tuft key={circle.join()} circle={circle} scale={grow.lush} />
      ))}
    </>
  )
}

/** どんぐり(まんなか が 0,0。下の はし まで 1.6) */
function Acorn({ x, y, spin, size }: { readonly x: number; readonly y: number; readonly spin: number; readonly size: number }) {
  return (
    <Layer x={x} y={y} rotate={spin} scale={size}>
      <ellipse cx="0" cy="0.35" rx="1.05" ry="1.25" fill={ACORN} />
      <ellipse cx="0" cy="-0.75" rx="1.2" ry="0.6" fill={ACORN_CAP} />
      <path d="M0 -1.3 v-0.5" stroke={ACORN_CAP} strokeWidth="0.45" strokeLinecap="round" />
    </Layer>
  )
}

type AcornPath = { readonly start: number; readonly from: Point; readonly land: Point; readonly stop: Point; readonly buried: number }

/** 上の木から おちて、おかに あたって はね、てまえへ ころがって とまる。りすが うめたら きえる。 */
function FallingAcorn({ t, path }: { readonly t: number; readonly path: AcornPath }) {
  const { start, from, land, stop, buried } = path
  if (t < start || t >= buried) return null
  const fall = span(t, start, start + 0.3, easeIn)
  const bounce = span(t, start + 0.3, start + 0.5)
  const roll = span(t, start + 0.5, start + 1.1, easeOut)
  const dir = Math.sign(stop[0] - land[0])
  // りすと 同じく、てまえへ ころがって くるほど 大きく見える
  const size = lerp(0.95, 1.3, roll)
  const lift = 1.6 * size
  const x = roll > 0 ? lerp(land[0], stop[0], roll) : from[0]
  const y = roll > 0 ? lerp(land[1], stop[1], roll) - lift : lerp(from[1], land[1] - lift, fall) - Math.sin(bounce * Math.PI) * 2.4
  return <Acorn x={x} y={y} spin={roll * 900 * dir} size={size} />
}

const ACORN_L: AcornPath = { start: DROP, from: [46, 31], land: [46, 49.1], stop: [34.6, 97.6], buried: DIG_L + 0.22 }
const ACORN_R: AcornPath = { start: DROP + 0.1, from: [61, 31], land: [61, 49], stop: [69.2, 98.2], buried: DIG_R + 0.22 }

/** うめた ところ: ほっている間は あな、うめおわると 土が もりあがる。 */
function Spot({ t, at, dig }: { readonly t: number; readonly at: Point; readonly dig: number }) {
  const hole = during(t, dig + 0.05, dig + 0.34, 0.08)
  const mound = span(t, dig + 0.26, dig + DIG_TIME, backOut)
  const [x, y] = at
  return (
    <>
      {hole > 0 && <ellipse cx={x} cy={y} rx={2.4 * hole} ry={0.9 * hole} fill={SOIL_DARK} />}
      {mound > 0 && (
        <Layer scale={mound} origin={at}>
          <path d={`M${x - 3.2} ${y + 0.4} Q${x} ${y - 2.8} ${x + 3.2} ${y + 0.4} Z`} fill={SOIL} />
          <path d={`M${x - 1.4} ${y - 0.8} q1.4 -0.9 2.6 -0.2`} fill="none" stroke="#c29266" strokeWidth="0.6" strokeLinecap="round" />
        </Layer>
      )}
    </>
  )
}

/** 土から ぴょこっと 出る め(ふたばの 葉)。start で 出て、tree で みきが のびてくると きえる。 */
function Sprout({ t, at, start, tree }: { readonly t: number; readonly at: Point; readonly start: number; readonly tree: number }) {
  const grow = span(t, start, start + 0.25, backOut)
  const gone = span(t, tree + 0.05, tree + 0.25)
  if (grow <= 0 || gone >= 1) return null
  const [x, ground] = at
  const y = ground - 1.4
  return (
    <Layer scale={grow} origin={[x, y]} opacity={1 - gone}>
      <path d={`M${x} ${y} q-0.4 -2 0.1 -4`} fill="none" stroke={SPROUT_STEM} strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx={x - 1.6} cy={y - 4.4} rx="1.8" ry="0.95" fill={SPROUT_GREEN} transform={`rotate(-28 ${x - 1.6} ${y - 4.4})`} />
      <ellipse cx={x + 1.8} cy={y - 4.6} rx="1.8" ry="0.95" fill={SPROUT_GREEN} transform={`rotate(28 ${x + 1.8} ${y - 4.6})`} />
    </Layer>
  )
}

type Mood = 'calm' | 'wow' | 'happy'

type SquirrelPose = {
  readonly x: number
  readonly y: number
  /** 1 = 右むき / -1 = 左むき */
  readonly facing: number
  readonly size: number
  /** 体を まえに たおす角度(0 = すわって 立つ / 50〜60 = 4本足で かける・ほる) */
  readonly lean: number
  /** しっぽ の角度(マイナス = うしろへ なびく) */
  readonly tail: number
  /** あたま の角度(マイナス = 上を見る) */
  readonly look: number
  /** はねて 体が うく 高さ */
  readonly hop: number
  /** かけるときの 足の ふり(-1〜1) */
  readonly stride: number
  /** 土を かく まえあし の うごき(-1〜1) */
  readonly scratch: number
  /** 土を ほりはじめてからの 時間(ほっていないときは マイナス) */
  readonly digging: number
  readonly mood: Mood
}

/** りすの 体の じく(右むき・足もと が 0,0 の 座標): こし・しっぽ の つけね・くび・かた・むねの まえ */
const HIP: Point = [-0.4, -2.4]
const RUMP: Point = [-1.6, -1.8]
const NECK: Point = [1.8, -7]
const SHOULDER: Point = [1.6, -6.2]
const CHEST: Point = [3.2, -5.4]

/** せなかに そって 立ち、上で くるんと まるまる しっぽ */
const TAIL = 'M-1.4 -0.8 C-5.2 -0.6 -8 -3.6 -8.1 -7.4 C-8.2 -11 -5.6 -13.6 -2.8 -13.4 C-1.6 -13.3 -0.7 -12.8 -0.5 -12.1 C-1.6 -11.6 -3.2 -11.4 -4.2 -10 C-5 -8.6 -4.9 -6.4 -3.8 -4.6 C-3.2 -3.6 -2.4 -2.9 -1.8 -2.5 Z'

/** 体の 点を、じく の まわりに 回した 場所 */
function turn([x, y]: Point, [ox, oy]: Point, deg: number): Point {
  const r = (deg * Math.PI) / 180
  const dx = x - ox
  const dy = y - oy
  return [ox + dx * Math.cos(r) - dy * Math.sin(r), oy + dx * Math.sin(r) + dy * Math.cos(r)]
}

function SquirrelHead({ mood }: { readonly mood: Mood }) {
  return (
    <>
      {/* 耳: あたまの上の うしろより。とがった 耳の 内がわ は こい色 */}
      <path d="M0.4 -10.2 C0.2 -11.8 0.6 -13.2 1.2 -13.7 C1.9 -12.9 2.6 -11.8 2.7 -10.8 Z" fill={FUR} />
      <path d="M0.95 -10.9 C0.85 -11.8 1.05 -12.6 1.3 -12.9 C1.7 -12.3 2.05 -11.6 2.1 -11 Z" fill={FUR_DARK} />
      <circle cx="2.2" cy="-8.7" r="2.5" fill={FUR} />
      <ellipse cx="4.1" cy="-8.2" rx="1.6" ry="1.3" fill={FUR} />
      <ellipse cx="3.6" cy="-7.3" rx="1.5" ry="0.85" fill={FUR_LIGHT} />
      <circle cx="5.6" cy="-8.4" r="0.45" fill={EYE} />
      {mood === 'happy' ? (
        <>
          <path d="M2.5 -9.1 Q3.1 -9.9 3.7 -9.1" fill="none" stroke={EYE} strokeWidth="0.55" strokeLinecap="round" />
          <path d="M4.2 -7.2 q0.6 0.5 1.2 0" fill="none" stroke={EYE} strokeWidth="0.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="3.1" cy="-9.2" r={mood === 'wow' ? 0.72 : 0.55} fill={EYE} />
          <circle cx="3.3" cy="-9.45" r="0.2" fill="#ffffff" />
          {mood === 'wow' && <ellipse cx="4.9" cy="-7.1" rx="0.4" ry="0.5" fill="#8a3b2a" />}
        </>
      )}
      {mood === 'wow' && <path d="M1.2 -14.4 l-0.5 -1.3 M3.4 -14.1 l0.4 -1.4 M5.4 -12.8 l1.1 -0.9" stroke={EYE} strokeWidth="0.5" strokeLinecap="round" />}
    </>
  )
}

/** ほっている あな から、土が ぽんぽん はねる(あたま の下を通って、まえへ おちる)。 */
function Dirt({ time }: { readonly time: number }) {
  return (
    <g fill={SOIL}>
      {[0, 0.33, 0.66].map((offset, i) => {
        const p = (time * 3 + offset) % 1
        return <circle key={offset} cx={5.4 + p * (2.6 + i * 1.6)} cy={-0.2 - Math.sin(p * Math.PI) * (1.6 + i * 0.5)} r="0.55" opacity={Math.sin(p * Math.PI)} />
      })}
    </g>
  )
}

function Squirrel({ pose }: { readonly pose: SquirrelPose }) {
  const { x, y, facing, size, lean, tail, look, hop, stride, scratch, digging, mood } = pose
  // 体を たおすほど、まえあし は 地面へ(すわっている ときは むねの まえで そろえる)
  const shoulder = turn(SHOULDER, HIP, lean)
  const chest = turn(CHEST, HIP, lean)
  const down = clamp01(lean / 45)
  const paw: Point = [lerp(chest[0], shoulder[0] + 1.4 + stride * 1.3 + scratch * 0.9, down), lerp(chest[1], -0.5 - Math.max(scratch, 0) * 0.7, down)]
  return (
    <Layer x={x} y={y} scaleX={facing * size} scaleY={size}>
      <ellipse cx="0.6" cy="0.1" rx={4.6 - hop * 0.4} ry="0.9" fill="#000000" opacity="0.12" />
      <Layer y={-hop}>
        <Layer rotate={tail} origin={RUMP}>
          <path d={TAIL} fill={FUR} />
          <path d="M-6.6 -5.2 C-7 -8.2 -5.6 -11 -3.2 -11.9" fill="none" stroke={FUR_SHINE} strokeWidth="1" strokeLinecap="round" />
        </Layer>
        <Layer rotate={lean} origin={HIP}>
          <ellipse cx="0.5" cy="-4.7" rx="2.6" ry="3.4" fill={FUR} transform="rotate(14 0.5 -4.7)" />
          <ellipse cx="1.6" cy="-4.4" rx="1.2" ry="2.4" fill={FUR_LIGHT} transform="rotate(14 1.6 -4.4)" />
        </Layer>
        {/* うしろあし: 大きな もも(体より 少し こい色)と、ながい 足 */}
        <ellipse cx="-0.6" cy="-2.3" rx="2.5" ry="2.2" fill={FUR_SHADE} />
        <ellipse cx={1 - stride * 0.8} cy="-0.55" rx="2.2" ry="0.7" fill={FUR_DARK} />
        {/* まえあし: かた から 出る */}
        <path d={`M${shoulder[0]} ${shoulder[1]} L${paw[0]} ${paw[1]}`} stroke={FUR} strokeWidth="1.3" strokeLinecap="round" />
        <circle cx={paw[0]} cy={paw[1]} r="0.7" fill={FUR_DARK} />
        <Layer rotate={lean} origin={HIP}>
          {/* かけるときも、あたま は まえを むく */}
          <Layer rotate={look - lean * 0.55} origin={NECK}>
            <SquirrelHead mood={mood} />
          </Layer>
        </Layer>
        {digging >= 0 && <Dirt time={digging} />}
      </Layer>
    </Layer>
  )
}

const SIT: Omit<SquirrelPose, 'x' | 'y' | 'facing' | 'size'> = { lean: 0, tail: 0, look: 0, hop: 0, stride: 0, scratch: 0, digging: -1, mood: 'calm' }

/** はねながら かける(りすは 4本足で ぴょんぴょん とぶ) */
function bounding(p: number, hops: number) {
  const phase = p * hops * Math.PI
  return { lean: 48 + Math.sin(phase * 2) * 8, tail: -28 + Math.sin(phase * 2) * 8, hop: Math.abs(Math.sin(phase)) * 2.6, stride: Math.cos(phase * 2) }
}

/** 土を ほる: 体を まえに たおして、まえあし で かく */
function digging(t: number, start: number) {
  return { lean: 60 + Math.sin(t * 30) * 4, tail: -6 + Math.sin(t * 15) * 6, scratch: Math.sin(t * 34), digging: t - start }
}

/** りすの その しゅんかん の かっこう */
function squirrelAt(t: number): SquirrelPose | null {
  if (t < APPEAR) return null
  // おかの むこうがわ から ひょっこり 出てくる → どんぐりが おちて びっくり
  if (t < RUN) {
    const rise = span(t, APPEAR, PEEK, backOut)
    const wow = t > DROP + 0.2
    return { ...SIT, x: NEST[0], y: NEST[1] + (1 - rise) * 9, facing: -1, size: FAR_SIZE, mood: wow ? 'wow' : 'calm', look: wow ? 12 : 0, tail: wave(t, 0.9) * 5 }
  }
  // おかを かけおりて、左の どんぐり へ(てまえに くるほど 大きく見える)
  if (t < DIG_L) {
    const p = span(t, RUN, DIG_L, easeInOut)
    return { ...SIT, ...bounding(p, 4), x: lerp(NEST[0], DIG_POS_L[0], p), y: lerp(NEST[1], DIG_POS_L[1], p), facing: -1, size: lerp(FAR_SIZE, NEAR_SIZE, p) }
  }
  // 1つめを うめる
  if (t < DIG_L + DIG_TIME) return { ...SIT, ...digging(t, DIG_L), x: DIG_POS_L[0], y: DIG_POS_L[1], facing: -1, size: NEAR_SIZE }
  // くるっと 右を むいて(とびはねる しゅんかんに むきを変える)、右の どんぐり へ
  if (t < DIG_R) {
    const p = span(t, DIG_L + DIG_TIME, DIG_R, easeInOut)
    return { ...SIT, ...bounding(p, 3), x: lerp(DIG_POS_L[0], DIG_POS_R[0], p), y: lerp(DIG_POS_L[1], DIG_POS_R[1], p), facing: 1, size: NEAR_SIZE }
  }
  // 2つめを うめる
  if (t < DIG_R + DIG_TIME) return { ...SIT, ...digging(t, DIG_R), x: DIG_POS_R[0], y: DIG_POS_R[1], facing: 1, size: NEAR_SIZE }
  // ぴょんと うしろへ さがって、すわる
  if (t < SETTLE) {
    const p = span(t, DIG_R + DIG_TIME, SETTLE, easeInOut)
    return { ...SIT, x: lerp(DIG_POS_R[0], WATCH[0], p), y: lerp(DIG_POS_R[1], WATCH[1], p), facing: 1, size: NEAR_SIZE, lean: lerp(55, 0, p), hop: Math.sin(p * Math.PI) * 2.6 }
  }
  // めが出て びっくり → 木が のびるのを 見上げる
  if (t < LUSH) {
    const up = span(t, GROW, GROW + 0.8, easeInOut)
    return { ...SIT, x: WATCH[0], y: WATCH[1], facing: 1, size: NEAR_SIZE, mood: t > SPROUT + 0.1 ? 'wow' : 'calm', look: lerp(t > SPROUT ? 8 : 0, -24, up), tail: wave(t, 1.2) * 4 }
  }
  // 3本 そろって こんもり: うれしくて ぴょんぴょん はねる
  const jump = span(t, LUSH + 0.1, LUSH + 1.1)
  return { ...SIT, x: WATCH[0], y: WATCH[1], facing: 1, size: NEAR_SIZE, mood: 'happy', look: -14, hop: jump > 0 && jump < 1 ? Math.abs(Math.sin(jump * Math.PI * 2)) * 2.6 : 0, tail: wave(t, 0.6) * 8 }
}

/** 小鳥が とまる ところ(上の木の 4画目の えだ。しげみ から 出ている ところ)。体の まんなか */
const BIRD_PERCH: Point = [82, 36.4]

/** 3本 そろうと、小鳥が とんできて 上の木の えだ(4画目)に とまる。ちゅんちゅん と うたう。 */
function Bird({ t }: SceneProps) {
  const arrive = span(t, LUSH, LUSH + 0.9, easeOut)
  if (arrive <= 0) return null
  // 左から 森の上を とんで、ゆるい山なり で おりてくる(太陽の 下を通る。右むき なので、うた は ひらけた 空へ)
  const x = lerp(-8, BIRD_PERCH[0], arrive)
  const y = lerp(30, BIRD_PERCH[1], arrive) - Math.sin(arrive * Math.PI) * 9
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.7)) * 0.8 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  const note = during(t, LUSH + 1, INK + 0.2, 0.25)
  const rise = (t * 5) % 6
  const sway = wave(t, 1.2) * 1.2
  return (
    <>
      <Layer x={x} y={y - hop} scaleX={-1}>
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#3c7fc0" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#5aa9e6" />
        <ellipse cx="-0.6" cy="1" rx="2.4" ry="1.7" fill="#d8ecfb" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#5aa9e6" />
        <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
        <Layer rotate={flap} origin={[0.4, -0.6]}>
          <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#3c7fc0" />
        </Layer>
      </Layer>
      <g opacity={note} fill="#f07f9e">
        <path d={`M${91 + sway} ${33 - rise} v-4.4 l2.6 -0.8 v4.2`} fill="none" stroke="#f07f9e" strokeWidth="0.8" />
        <ellipse cx={90.2 + sway} cy={33 - rise} rx="1.1" ry="0.8" />
        <ellipse cx={92.8 + sway} cy={32.2 - rise} rx="1.1" ry="0.8" />
      </g>
    </>
  )
}

/** 木の ねもとの くさむら。3本 そろうと ぽん と しげる。 */
function Bush({ x, y, grow }: { readonly x: number; readonly y: number; readonly grow: number }) {
  if (grow <= 0) return null
  return (
    <Layer scale={grow} origin={[x, y]}>
      <circle cx={x - 2.6} cy={y - 1.8} r="2.8" fill={LEAF_DARK} />
      <circle cx={x + 2.4} cy={y - 1.6} r="3" fill={LEAF_DARK} />
      <circle cx={x} cy={y - 3} r="3.2" fill={LEAF} />
      <circle cx={x - 0.8} cy={y - 4} r="1.2" fill={LEAF_LIGHT} />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)
  const sway = wave(t, 3.6) * 1.1
  const lush = span(t, LUSH, LUSH + 0.5, backOut)
  // 上の木: おかが せりあがると すぐ そだつ
  const back: Growth = { trunk: span(t, 0.35, 0.85, backOut), boughs: span(t, 0.6, 1.0, backOut), leaves: span(t, 0.8, 1.2, backOut), lush }
  // てまえの 2本: めが出てから、ならんで そだつ(林)
  const left = youngTree(t, GROW, lush)
  const right = youngTree(t, GROW + LAG, lush)
  const squirrel = squirrelAt(t)
  // 出てくる とちゅう は、おかの うしろ に 描く(下半分が おかに かくれる)
  const peeking = t < PEEK
  const bushes = span(t, LUSH + 0.1, LUSH + 0.45, backOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Hill t={t} behind={squirrel && peeking && <Squirrel pose={squirrel} />}>
          <Tree spec={BACK_TREE} grow={back} sway={sway} />
        </Hill>
        <Field />
        <Spot t={t} at={SPOT_L} dig={DIG_L} />
        <Spot t={t} at={SPOT_R} dig={DIG_R} />
        <Sprout t={t} at={SPOT_L} start={SPROUT} tree={GROW} />
        <Sprout t={t} at={SPOT_R} start={SPROUT + LAG} tree={GROW + LAG} />
        <Tree spec={LEFT_TREE} grow={left} sway={sway * 0.8} />
        <Tree spec={RIGHT_TREE} grow={right} sway={sway * 0.8} />
        <Bush x={21.5} y={97.8} grow={bushes} />
        <Bush x={87} y={98} grow={bushes} />
        <FallingAcorn t={t} path={ACORN_L} />
        <FallingAcorn t={t} path={ACORN_R} />
        {squirrel && !peeking && <Squirrel pose={squirrel} />}
        <Bird t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={54} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'おかが できて、てっぺんに 木が 1本 そだつ', sound: 'pop' },
    { at: DROP, label: 'どんぐりが おちて ころころ。りすが おいかける', sound: 'tap' },
    { at: DIG_L, label: 'りすが どんぐりを 土に うめる' },
    { at: SPROUT, label: 'めが出て、2本の木が ならんで そだつ(林)', sound: 'pop' },
    { at: LUSH, label: '木が 3本 あつまって こんもり。小鳥も やってくる', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '森 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
