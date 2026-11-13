/*
 * 言(いう): 口 から ことばが つぎつぎ でて くる。
 *
 * ほね(画と絵の対応)
 *   1画目(てん) … ことばの はじまりを つげる、小さな ぴかっ(ことばの 上に のこる)
 *   2画目(一)  … 1つめの ことば(いちばん 上まで とんで、よこに ながく のびる)
 *   3画目(一)  … 2つめの ことば
 *   4画目(一)  … 3つめの ことば(あたまに いちばん ちかい)
 *   5・6・7画目 … 子どもの 大きく あいた 口(左がわ・上と右がわ・した)
 *
 * ながれ
 *   子どもが ひとり、ちょっと たいくつ
 *   → ちょうちょが とんできて、目で おいかける(おどろく)
 *   → ちょうちょが とおくへ いきそうなので、いきを すって 「あっ、ちょうちょ!」と 口を 大きく あける
 *   → ことばが 口から ぽんぽんぽん と つぎつぎ とびだして、よこに のびる
 *   → 口が わらって、ことばが つたわった。ほね が ひかって 絵が うすくなり、字「言」が のこる
 *
 * 子どもは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   あたま は まんなかに 目と口、みみ は 目の高さの よこ、くび は みじかく どう の上。
 *   ことばは、口から よこへ まわりこんで 上へ とび、かおの 上に ならぶ(かおを かくさない)。
 *   ただし 口は、ぜんぶ 子どもが さけぶ ときの 大きな 口。
 */
import { backOut, during, easeInOut, easeIn, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '言'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#7a8fe0'
const TUNIC_DARK = '#6275c8'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH_IN = '#b9483f'
const TONGUE = '#ff8a8a'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const WORD_A = '#f07f9e'
const WORD_A_LIGHT = '#ffc4d4'
const WORD_B = '#ffb12e'
const WORD_B_LIGHT = '#ffe19a'
const WORD_C = '#5aaee8'
const WORD_C_LIGHT = '#bfe3fa'
const SPARK = '#ff7a4d'

/** くぎり の時間(秒) */
const NOTICE = 1.5
const INHALE = 3.0
const OPEN = 3.6
const CLOSE = 6.1
const INK = 6.7
const DONE = 10.0
const DURATION = 10.6

/** かおの まんなか と、目・口の場所(かお は あたまの ま中の たて線に そろえる) */
const FACE_X = 54
const HEAD_Y = 80
const EYE_Y = 72
const EYE_GAP = 9.5
/** 口の 上はし(口は ここを じく に ひらく) */
const MOUTH_TOP: readonly [number, number] = [54, 79]
/** ことばが でてくる 口の 左はし */
const MOUTH_CORNER: readonly [number, number] = [44, 88]

type Point = readonly [number, number]

/** 2・3・4画目の 通り道の点(scene-info より)。ことばの さきっぽ の位置に使う */
const PATH_2: readonly Point[] = [[14.9, 34], [26, 34.4], [37.2, 33.3], [48.4, 32.3], [59.6, 31.3], [70.7, 30.5], [81.9, 29.9], [93.1, 30.3]]
const PATH_3: readonly Point[] = [[38.6, 46.7], [43.1, 46.8], [47.6, 46.4], [52.1, 45.8], [56.6, 45.3], [61, 44.7], [65.5, 44.3], [70, 44.5]]
const PATH_4: readonly Point[] = [[37.9, 61.4], [42.8, 61.6], [47.6, 61.1], [52.5, 60.5], [57.4, 60], [62.3, 59.4], [67.1, 58.7], [72, 59]]

/** 通り道の点の上を、0〜1 で すすんだ ところ */
function along(points: readonly Point[], p: number): Point {
  const x = Math.min(Math.max(p, 0), 1) * (points.length - 1)
  const i = Math.min(Math.floor(x), points.length - 2)
  const f = x - i
  return [points[i][0] + (points[i + 1][0] - points[i][0]) * f, points[i][1] + (points[i + 1][1] - points[i][1]) * f]
}

/** 3つの点を通る、ゆるい カーブ(口の よこから まわりこんで 上へ) */
function curve(a: Point, b: Point, c: Point, p: number): Point {
  const q = 1 - p
  return [q * q * a[0] + 2 * q * p * b[0] + p * p * c[0], q * q * a[1] + 2 * q * p * b[1] + p * p * c[1]]
}

/* ───────── ちょうちょ ───────── */

/** ちょうちょ の いち。左から きて、子どもの 左上で ふわふわ → 右へ とんでいき → 右上で まって、さいごに とびさる */
function butterflyAt(t: number): Point {
  const enter = span(t, 0.8, 1.9, easeOut)
  const go = span(t, 2.9, 3.7, easeInOut)
  const out = span(t, 5.9, 6.9, easeIn)
  const x = -8 + 32 * enter + 62 * go + 32 * out + Math.sin(t * 5) * 1.6
  const y = 20 + 8 * enter - 10 * go - 25 * out + Math.sin(t * 7.3) * 2
  return [x, y]
}

function Butterfly({ t }: SceneProps) {
  if (t < 0.8 || t > 6.9) return null
  const [x, y] = butterflyAt(t)
  // はねを ぱたぱた: よこはば を ちぢめたり のばしたり
  const flap = 0.3 + 0.7 * Math.abs(wave(t, 0.4))
  return (
    <Layer x={x} y={y} rotate={wave(t, 1.3) * 8}>
      <Layer scaleX={flap}>
        <ellipse cx="-3.4" cy="-1.8" rx="3.6" ry="2.7" fill="#ff9a5c" transform="rotate(-20 -3.4 -1.8)" />
        <ellipse cx="3.4" cy="-1.8" rx="3.6" ry="2.7" fill="#ff9a5c" transform="rotate(20 3.4 -1.8)" />
        <ellipse cx="-2.5" cy="2" rx="2.5" ry="2" fill="#ffd24a" />
        <ellipse cx="2.5" cy="2" rx="2.5" ry="2" fill="#ffd24a" />
        <circle cx="-3.8" cy="-2" r="0.9" fill="#ffffff" opacity="0.8" />
        <circle cx="3.8" cy="-2" r="0.9" fill="#ffffff" opacity="0.8" />
      </Layer>
      <ellipse cx="0" cy="0" rx="0.9" ry="3.1" fill="#5a3b2a" />
      <path d="M-0.3 -2.8 Q-1.6 -5 -2.6 -5 M0.3 -2.8 Q1.6 -5 2.6 -5" fill="none" stroke="#5a3b2a" strokeWidth="0.45" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── ことば ───────── */

type WordProps = {
  readonly t: number
  /** 書き順の画番号(その画の上に ことばが のびる) */
  readonly n: number
  readonly path: readonly Point[]
  readonly color: string
  readonly light: string
  /** 口から とびだす・ついて のびはじめる・のびおわる 時間 */
  readonly from: number
  readonly land: number
  readonly end: number
}

/** ことば: 口から ぽんと とびだし、左へ まわりこんで 上へ。ついたら、よこに のびる。 */
function Word({ t, n, path, color, light, from, land, end }: WordProps) {
  if (t < from) return null
  const launch = span(t, from, land, easeInOut)
  const stretch = span(t, land, end, easeOut)
  const start = path[0]
  // 口の左はし → 左へ ふくらんで → ことばの 書きはじめ へ(かおの ほっぺを かすめて とぶ)
  const flying = curve(MOUTH_CORNER, [MOUTH_CORNER[0] - 30, 64], start, launch)
  const tip = stretch > 0 ? along(path, stretch) : flying
  const size = 3.4 * span(t, from, from + 0.15, backOut) * (1 - 0.35 * span(t, end, end + 0.3))
  return (
    <>
      <Bone char={CHAR} n={n} color={color} width={4.6} from={0} to={stretch} />
      <Layer y={-1.1}>
        <Bone char={CHAR} n={n} color={light} width={1.4} from={0} to={stretch} opacity={0.75} />
      </Layer>
      <circle cx={tip[0]} cy={tip[1]} r={Math.max(0, size)} fill={color} />
      <circle cx={tip[0] - 0.9} cy={tip[1] - 1} r={Math.max(0, size * 0.38)} fill={light} />
    </>
  )
}

/** 1画目: ことばの はじまりを つげる、ぴかっ と した みじかい線。 */
function Spark({ t }: SceneProps) {
  const grow = span(t, 5.9, 6.25, backOut)
  if (grow <= 0) return null
  return (
    <>
      <Bone char={CHAR} n={1} color={SPARK} width={4.4} to={Math.min(grow, 1)} />
      <Star cx={53.4} cy={16.8} r={4.4 * Math.max(0, grow)} color="#ffd24a" spin={grow * 60} />
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'bored' | 'surprised' | 'joy'

/** 目: たいくつ(てん)・おどろき(白目と くろ目。ちょうちょを おう)・よろこび(にっこり) */
function Eyes({ mood, look }: { readonly mood: Mood; readonly look: Point }) {
  const left = FACE_X - EYE_GAP
  const right = FACE_X + EYE_GAP
  if (mood === 'joy') {
    return (
      <g fill="none" stroke={EYE} strokeWidth="1.5" strokeLinecap="round">
        <path d={`M${left - 3.4} ${EYE_Y + 1.2} Q${left} ${EYE_Y - 3.6} ${left + 3.4} ${EYE_Y + 1.2}`} />
        <path d={`M${right - 3.4} ${EYE_Y + 1.2} Q${right} ${EYE_Y - 3.6} ${right + 3.4} ${EYE_Y + 1.2}`} />
      </g>
    )
  }
  if (mood === 'bored') {
    return (
      <g>
        <circle cx={left} cy={EYE_Y} r="1.6" fill={EYE} />
        <circle cx={right} cy={EYE_Y} r="1.6" fill={EYE} />
        <path d={`M${left - 3} ${EYE_Y - 3.6} l5.6 -0.5 M${right - 2.6} ${EYE_Y - 4.1} l5.6 0.5`} stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
      </g>
    )
  }
  return (
    <g>
      {[left, right].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={EYE_Y} rx="4.2" ry="4.7" fill="#ffffff" stroke="#d9c3ad" strokeWidth="0.5" />
          <circle cx={x + look[0]} cy={EYE_Y + look[1]} r="2.5" fill={EYE} />
          <circle cx={x + look[0] - 0.7} cy={EYE_Y + look[1] - 0.8} r="0.8" fill="#ffffff" />
        </g>
      ))}
      <path d={`M${left - 3.6} ${EYE_Y - 7.2} Q${left} ${EYE_Y - 9.4} ${left + 3.6} ${EYE_Y - 7.4} M${right - 3.6} ${EYE_Y - 7.4} Q${right} ${EYE_Y - 9.4} ${right + 3.6} ${EYE_Y - 7.2}`} fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

/** 口: open = 0(とじる)〜 1(さけぶ 大きな 口)。上はしを じく に、ひらく。 */
function MouthShape({ open }: { readonly open: number }) {
  if (open <= 0.02) {
    return <path d="M49.5 88 L58.5 88" stroke={MOUTH_IN} strokeWidth="1.3" strokeLinecap="round" fill="none" />
  }
  return (
    <Layer scaleX={0.25 + 0.75 * Math.min(open, 1.1)} scaleY={Math.max(open, 0.05)} origin={MOUTH_TOP}>
      {/* 大きな 口の なか(ほんものの さけぶ 口: 上は ほぼ たいら、下は まるい) */}
      <path d="M41 79 Q54 75.6 67 79 Q68.2 92 60.4 97.4 Q54 99.6 47.6 97.4 Q39.8 92 41 79 Z" fill={MOUTH_IN} />
      <ellipse cx="54" cy="94.4" rx="7.4" ry="3.9" fill={TONGUE} />
      <path d="M42.4 79.5 Q54 76.4 65.6 79.5 L65.2 82.6 Q54 80 42.8 82.6 Z" fill="#ffffff" />
    </Layer>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly look: Point
  readonly open: number
  readonly inhale: number
  readonly tilt: number
  readonly cheek: number
}

function Child({ mood, look, open, inhale, tilt, cheek }: ChildProps) {
  return (
    <>
      {/* どう(かた と うで の はじまり): したの わく の外まで つづく */}
      <path d="M16 112 Q18 101 38 100.5 L70 100.5 Q90 101 92 112 Z" fill={TUNIC} />
      <path d="M44 100.6 Q54 107.4 64 100.6" fill={TUNIC_DARK} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="49.6" y="98" width="8.8" height="6.4" rx="2.4" fill={SKIN_SHADE} />
      <Layer rotate={tilt} scale={1 + inhale * 0.04} origin={[FACE_X, 102]}>
        {/* みみ は 目の高さの よこ */}
        <circle cx="29.8" cy="78" r="4.6" fill={SKIN} />
        <circle cx="78.2" cy="78" r="4.6" fill={SKIN} />
        <circle cx="29.8" cy="78.4" r="2" fill={SKIN_SHADE} />
        <circle cx="78.2" cy="78.4" r="2" fill={SKIN_SHADE} />
        <ellipse cx={FACE_X} cy={HEAD_Y} rx="24.4" ry="25.2" fill={SKIN} />
        {/* かみ: てっぺん から おでこ へ かぶさる */}
        <path d="M28.8 76 C26.4 58 38 49.6 54 49.6 C70 49.6 81.6 58 79.2 76 C77 68 73 64.4 66 64.2 C61 61.6 49 62 44 64.4 C36 64 31.4 68.4 28.8 76 Z" fill={HAIR} />
        <path d="M50 50.4 Q52.4 46.6 55.6 49.6 Q57.4 47.2 59.4 50.2" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="40.4" cy="81" rx="3.4" ry="2.2" fill={CHEEK} opacity={0.45 + cheek * 0.45} />
        <ellipse cx="67.6" cy="81" rx="3.4" ry="2.2" fill={CHEEK} opacity={0.45 + cheek * 0.45} />
        <Eyes mood={mood} look={look} />
        <MouthShape open={open} />
      </Layer>
    </>
  )
}

/* ───────── 地面 ───────── */

function Flower({ x, y, color }: { readonly x: number; readonly y: number; readonly color: string }) {
  return (
    <>
      <path d={`M${x} ${y + 10} Q${x + 0.8} ${y + 5} ${x} ${y}`} fill="none" stroke={LEAF_DARK} strokeWidth="1.2" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 2.3} cy={y + Math.sin((a * Math.PI) / 180) * 2.3} r="1.8" fill={color} />
      ))}
      <circle cx={x} cy={y} r="1.3" fill="#ffd24a" />
    </>
  )
}

function Ground({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, easeOut)
  return (
    <Layer opacity={grow}>
      <path d="M-4 99 Q18 78 44 92 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="72" cy="9" rx="7" ry="3" />
        <ellipse cx="77" cy="7.4" rx="4.6" ry="3" />
      </g>
      <ellipse cx="54.5" cy="100" rx="52" ry="6" fill={GRASS} />
      {[6, 20, 90, 102].map((x) => (
        <path key={x} d={`M${x} 99 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      <Flower x={9} y={88} color="#ff9cb8" />
      <Flower x={99} y={87} color="#fff0a8" />
    </Layer>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 7)

  // 子どもが 下から ぽんと あらわれる
  const rise = span(t, 0.1, 0.8, backOut)
  // 気もち: たいくつ → ちょうちょに おどろく → さけぶ(うれしい)
  const mood: Mood = t < NOTICE ? 'bored' : t < OPEN ? 'surprised' : 'joy'
  const talking = span(t, OPEN + 0.3, OPEN + 0.5) * (1 - span(t, CLOSE - 0.2, CLOSE))
  // 目で ちょうちょを おう
  const [bx, by] = butterflyAt(t)
  const dx = bx - FACE_X
  const dy = by - EYE_Y
  const len = Math.max(Math.hypot(dx, dy), 1)
  const look: Point = [(dx / len) * 1.7, (dy / len) * 1.7]
  // 口: おどろきで 少し ひらき → いきを すって → 大きく あけ → わらって 少し とじる
  const surprise = span(t, NOTICE, NOTICE + 0.2, easeOut) * 0.3
  const shout = span(t, OPEN, OPEN + 0.3, backOut) * 0.7
  const smile = span(t, CLOSE, CLOSE + 0.35, easeInOut) * 0.55
  const open = Math.max(0, (surprise + shout) * (1 - smile / 0.55 * 0.55) + talking * wave(t, 0.28) * 0.07)
  const inhale = span(t, INHALE, OPEN - 0.1, easeOut) * (1 - span(t, OPEN - 0.1, OPEN + 0.1))
  const tilt = talking * wave(t, 0.5) * 1.6

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer y={(1 - rise) * 34}>
          <Child mood={mood} look={look} open={open} inhale={inhale} tilt={tilt} cheek={mix(t, NOTICE, OPEN, 0, 1)} />
        </Layer>
        <Butterfly t={t} />
        <Word t={t} n={2} path={PATH_2} color={WORD_A} light={WORD_A_LIGHT} from={OPEN + 0.1} land={OPEN + 0.9} end={OPEN + 1.6} />
        <Word t={t} n={3} path={PATH_3} color={WORD_B} light={WORD_B_LIGHT} from={OPEN + 0.7} land={OPEN + 1.4} end={OPEN + 1.95} />
        <Word t={t} n={4} path={PATH_4} color={WORD_C} light={WORD_C_LIGHT} from={OPEN + 1.2} land={OPEN + 1.85} end={OPEN + 2.3} />
        <Spark t={t} />
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
    { at: 0, label: '子どもが ひとり、ちょっと たいくつ', sound: 'pop' },
    { at: NOTICE, label: 'ちょうちょが とんできて、おどろく' },
    { at: INHALE, label: 'ちょうちょが とおくへ。いきを すう' },
    { at: OPEN, label: '「あっ ちょうちょ!」口から ことばが とびだす', sound: 'pop' },
    { at: CLOSE, label: 'ことばが つたわって にっこり' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '言 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
