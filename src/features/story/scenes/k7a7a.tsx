/*
 * 空(そら・から): がけの あなを のぞくと からっぽ。ふりあおぐと 空も ひろくて からっぽ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)    … がけの うえに はえた わかい 木の みき
 *   2画目(ノ)    … がけの ひだりの かどから たれた つた
 *   3画目(ノ一)  … がけの てっぺん(くさの ぼうし)
 *   4画目(ノ)    … あなの ひだり がわの ななめの いわはだ
 *   5画目(乚)    … あなの みぎ がわの かべ と、その したの でっぱり
 *   6画目(一)    … あなの まえに つくった 木の いた(だい)。子どもは この上に のる
 *   7画目(丨)    … 台を ささえる 木の はしら
 *   8画目(一)    … はしらの 下の どだい の 木
 *
 * ながれ
 *   がけ と 台が できる → ランタンを もった 子どもが あるいてきて、台に ぴょんと のる
 *   → わくわく あなを のぞく(ランタンで 中を てらす) → なんにも ない。ほこりの たまが ころがるだけ
 *   → がっかり ため息 → ふと 見あげる。空も なんにも ない、どこまでも ひろい
 *   → わあ! と 手を あげて よろこぶ → ほね が ひかって、絵が うすくなり、字「空」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく、どう の 上。あし は こし から。
 *   あなを のぞくときも、見あげるときも、体の つくり は かわらず、目と むき だけで 見せる。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '空'

const SKY = '#e4f5fc'
const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const GRASS_DARK = '#a9d48a'
const CAP = '#7cc65f'
const ROCK = '#b9b3a8'
const ROCK_DARK = '#9d968a'
const ROCK_LIGHT = '#d3cdc2'
const CAVE_DARK = '#3b3550'
const CAVE_LIT = '#d9bb82'
const CAVE_BACK = '#bf9f6c'
const WOOD = '#8c5b3c'
const WOOD_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const VINE = '#4c8f52'
const SKIN = '#f8cfa6'
const HAIR = '#5a3b2a'
const TUNIC = '#e8715a'
const TUNIC_DARK = '#c95a46'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const GLOW = '#ffe58a'

/** くぎり の時間(秒) */
const ENTER_FROM = 0.9
const ENTER_TO = 2.2
const HOP_FROM = 2.5
const HOP_TO = 3.2
/** ランタンを あげて、あなを のぞく */
const PEEK = 3.3
const LIGHT = 3.7
/** なんにも ない と わかって がっかり */
const SAD = 4.4
/** ふと 空を 見あげる */
const LOOK_UP = 5.3
/** わあ! と よろこぶ */
const JOY = 6.0
const INK = 6.9
const DONE = 9.8
const DURATION = 10.5

/** 地面(草の うえ)と、台(いた)の うえの 高さ */
const GROUND_Y = 90.5
const DECK_Y = 64.4
/** 台に のぼった 子どもの 場所、あるいてくる はじまりの場所 */
const KID_X = 68
const KID_START_X = 82

/** あなの かたち。左の ふち は 4画目、右の ふち は 5画目の たてせん。 */
const MOUTH_PATH = 'M40.5 27 L60.2 25 L61.3 50 L61.5 66.5 L22 66.5 L25 61.2 L41.5 39 Z'

/** コマの あいだを なめらかに つなぐ。[時間, 値] を じゅんに ならべる */
function keys(t: number, frames: readonly (readonly [number, number])[]): number {
  if (t <= frames[0][0]) return frames[0][1]
  for (let i = 1; i < frames.length; i += 1) {
    const [from, a] = frames[i - 1]
    const [to, b] = frames[i]
    if (t < to) return mix(t, from, to, a, b)
  }
  return frames[frames.length - 1][1]
}

/* ───────── ばしょ(そら・がけ・あな・台) ───────── */

function Sky({ t }: SceneProps) {
  // 大きな 雲が ゆっくり ながれて、見あげるころには 空が からっぽに なる
  const drift = span(t, 3.0, 6.4, easeInOut)
  return (
    <>
      <rect x="0" y="0" width="109" height="109" fill={SKY} />
      <circle cx="98" cy="10" r="5.4" fill={SUN} />
      <g fill="#ffffff" opacity="0.95" transform={`translate(${drift * 110} 0)`}>
        <ellipse cx="22" cy="12" rx="9" ry="3.6" />
        <ellipse cx="28" cy="9.6" rx="6" ry="3.6" />
        <ellipse cx="38" cy="14" rx="5" ry="2.4" />
      </g>
      <g fill="#ffffff" opacity="0.9" transform={`translate(${drift * 90} 0)`}>
        <ellipse cx="82" cy="16" rx="7" ry="2.8" />
        <ellipse cx="86.5" cy="14.4" rx="4.6" ry="2.8" />
      </g>
    </>
  )
}

function Ground() {
  return (
    <>
      <rect x="-2" y="90.5" width="113" height="22" fill={GRASS} />
      <rect x="-2" y="90.5" width="113" height="2" fill={GRASS_DARK} opacity="0.6" />
      {[6, 40, 76, 102].map((x) => (
        <path key={x} d={`M${x} 98 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** がけ。てっぺん(3画目)は くさの ぼうし。あな の ふち が 4・5画目。 */
function Cliff({ lit }: { readonly lit: number }) {
  return (
    <>
      <path d="M12 91 L12 42 Q12 31 27.6 30 L80.6 24.3 Q96 24 96 40 L96 91 Z" fill={ROCK} />
      {/* いわの もよう(すじ は 字の画から はなして おく) */}
      <ellipse cx="86" cy="76" rx="5" ry="2.4" fill={ROCK_DARK} />
      <ellipse cx="18" cy="78" rx="4" ry="2" fill={ROCK_DARK} />
      <ellipse cx="88" cy="40" rx="3" ry="2.2" fill={ROCK_LIGHT} />
      <ellipse cx="16" cy="54" rx="2.6" ry="2" fill={ROCK_LIGHT} />
      {/* あな: ランタンで てらすと、そこ の かべが 見えてくる */}
      <path d={MOUTH_PATH} fill={CAVE_DARK} />
      <g opacity={lit}>
        <path d={MOUTH_PATH} fill={CAVE_LIT} />
        <path d="M30 66 Q31 46 50.5 41 Q58 40 60 48 L60 66 Z" fill={CAVE_BACK} />
        {/* くも の す: だれも いない しるし(上の かど に ちいさく) */}
        <path d="M43 28.6 L52 38 M47.5 27.8 L53 33 M43 28.6 L43.6 38 M44.4 32.6 Q47 33.4 48.6 31.4 M44 36 Q48 36.6 51 34.4" fill="none" stroke="#fff6e0" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
      </g>
      <Bone char={CHAR} n={4} color={ROCK_DARK} width={2.6} />
      <Bone char={CHAR} n={5} color={ROCK_DARK} width={2.6} />
      <Bone char={CHAR} n={3} color={CAP} width={4.6} />
    </>
  )
}

/** がけの うえの わかい 木(1画目)と、たれた つた(2画目) */
function Plants({ t }: SceneProps) {
  const grow = span(t, 0.6, 1.1, backOut)
  const vine = span(t, 0.7, 1.2, easeOut)
  const sway = wave(t, 3.2) * 2
  return (
    <>
      <Layer scaleY={grow} scaleX={0.7 + 0.3 * grow} origin={[53, 26]}>
        <Bone char={CHAR} n={1} color={WOOD} width={2.4} />
        <Layer rotate={sway} origin={[52.5, 14]}>
          <circle cx="52" cy="10.5" r="5.2" fill={LEAF_DARK} />
          <circle cx="50.2" cy="9.2" r="3.8" fill={LEAF} />
          <circle cx="55" cy="12.6" r="3" fill={LEAF} />
        </Layer>
      </Layer>
      <Layer scaleY={vine} origin={[27, 29]} rotate={sway * 0.5}>
        <Bone char={CHAR} n={2} color={VINE} width={1.8} />
        <circle cx="25.6" cy="36.5" r="1.7" fill={LEAF} />
        <circle cx="23.6" cy="41" r="1.9" fill={LEAF} />
      </Layer>
    </>
  )
}

/** 台(6画目の いた・7画目の はしら・8画目の どだい) */
function Deck({ t }: SceneProps) {
  const base = span(t, 0.1, 0.5, backOut)
  const post = span(t, 0.3, 0.65, backOut)
  const plank = span(t, 0.5, 0.9, backOut)
  return (
    <>
      <Layer scaleX={base} origin={[56, 90]}>
        <Bone char={CHAR} n={8} color={WOOD_DARK} width={5.4} />
        <Bone char={CHAR} n={8} color={WOOD} width={3.6} />
      </Layer>
      <Layer scaleY={post} origin={[54, 90]}>
        <Bone char={CHAR} n={7} color={WOOD} width={4.4} />
      </Layer>
      <Layer scaleX={plank} origin={[32, 68]}>
        <Bone char={CHAR} n={6} color={WOOD_DARK} width={5} />
        <Bone char={CHAR} n={6} color={WOOD} width={3.6} />
      </Layer>
    </>
  )
}

/* ───────── 子ども(しゅじんこう) ───────── */

type Mood = 'hope' | 'flat' | 'wow' | 'joy'

/** うで の かっこう。angle = ま下から そとへ ふった角度 / bend = ひじ の まがり(そとへ) */
type ArmPose = { readonly angle: number; readonly bend: number }

const SHOULDER_X = 5.4
const SHOULDER_Y = -23.5
const UPPER = 8
const FORE = 7.4

const rad = (deg: number) => (deg * Math.PI) / 180

/** かた → ひじ → 手 の じゅんに つながる うで。side: -1 = 画面の左 / 1 = 右 */
function armEnd(pose: ArmPose, side: -1 | 1) {
  const sx = side * SHOULDER_X
  const ex = sx + side * Math.sin(rad(pose.angle)) * UPPER
  const ey = SHOULDER_Y + Math.cos(rad(pose.angle)) * UPPER
  const fore = pose.angle + pose.bend
  const hx = ex + side * Math.sin(rad(fore)) * FORE
  const hy = ey + Math.cos(rad(fore)) * FORE
  return { sx, ex, ey, hx, hy }
}

function Arm({ pose, side, color }: { readonly pose: ArmPose; readonly side: -1 | 1; readonly color: string }) {
  const { sx, ex, ey, hx, hy } = armEnd(pose, side)
  return (
    <>
      <path d={`M${sx} ${SHOULDER_Y} L${ex} ${ey} L${hx} ${hy}`} fill="none" stroke={color} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hx} cy={hy} r="2.3" fill={SKIN} />
    </>
  )
}

/** ランタン。手から ぶら下がる(体が かたむいても、まっすぐ下を むく) */
function Lantern({ x, y, glow }: { readonly x: number; readonly y: number; readonly glow: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="4" r={7 + glow * 6} fill={GLOW} opacity={0.14 + glow * 0.1} />
      <circle cx="0" cy="4" r={4.4 + glow * 3} fill={GLOW} opacity={0.22 + glow * 0.12} />
      <path d="M-1.6 0.4 Q0 -1.6 1.6 0.4" fill="none" stroke={WOOD_DARK} strokeWidth="0.8" />
      <rect x="-2.3" y="0.2" width="4.6" height="1.3" rx="0.6" fill={WOOD_DARK} />
      <rect x="-2.1" y="1.3" width="4.2" height="5" rx="1.1" fill="#ffcf5a" />
      <rect x="-2.3" y="6" width="4.6" height="1.1" rx="0.5" fill={WOOD_DARK} />
    </g>
  )
}

type FaceProps = { readonly mood: Mood; readonly lookX: number; readonly lookY: number }

/** かお。目の くろめ と かお ぜんたい を むけたい ほうに ずらして、見ている 向き を出す */
function Face({ mood, lookX, lookY }: FaceProps) {
  const shiftX = lookX * 1.6
  const shiftY = lookY * 1.1
  return (
    <g transform={`translate(${shiftX} ${shiftY})`}>
      <circle cx="-4.4" cy="2.4" r="1.7" fill="#ff9d9d" opacity="0.55" />
      <circle cx="4.4" cy="2.4" r="1.7" fill="#ff9d9d" opacity="0.55" />
      {[-2.6, 2.6].map((x) => (
        <g key={x}>
          <circle cx={x} cy="-0.4" r="2" fill="#ffffff" />
          <circle cx={x + lookX * 0.7} cy={-0.4 + lookY * 0.8} r="1.1" fill={EYE} />
        </g>
      ))}
      {mood === 'hope' && (
        <>
          <path d="M-4.8 -3.4 Q-2.8 -4.6 -1.2 -3.6 M1.2 -3.6 Q2.8 -4.6 4.8 -3.4" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-1.6 3.6 Q0 5.2 1.6 3.6" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'flat' && (
        <>
          <path d="M-4.8 -3.2 L-1.4 -4.4 M1.4 -4.4 L4.8 -3.2" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-1.6 4.6 Q0 3.4 1.6 4.6" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      {mood === 'wow' && (
        <>
          <path d="M-4.8 -3.8 Q-2.8 -5 -1.2 -4 M1.2 -4 Q2.8 -5 4.8 -3.8" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <ellipse cx="0" cy="4.2" rx="1.3" ry="1.7" fill={MOUTH} />
        </>
      )}
      {mood === 'joy' && (
        <>
          <path d="M-4.8 -3.8 Q-2.8 -5 -1.2 -4 M1.2 -4 Q2.8 -5 4.8 -3.8" fill="none" stroke={HAIR} strokeWidth="0.9" strokeLinecap="round" />
          <path d="M-2.8 3 Q0 7.6 2.8 3 Z" fill={MOUTH} />
        </>
      )}
    </g>
  )
}

type KidProps = {
  /** あるく ふり(-1〜1) */
  readonly step: number
  readonly mood: Mood
  readonly lookX: number
  readonly lookY: number
  /** ランタンを もつ 左うで・ あいている 右うで */
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly glow: number
}

/** 足もと が (0,0)。あたまの てっぺん が 約 -40。 */
function Kid({ step, mood, lookX, lookY, leftArm, rightArm, glow }: KidProps) {
  const lantern = armEnd(leftArm, -1)
  return (
    <>
      {/* あし: こし から ふる */}
      <Layer rotate={step * 18} origin={[-2.6, -11]}>
        <rect x="-4.8" y="-11.5" width="4.4" height="11" rx="2.2" fill={PANTS} />
        <ellipse cx="-3.2" cy="0" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 18} origin={[2.6, -11]}>
        <rect x="0.4" y="-11.5" width="4.4" height="11" rx="2.2" fill={PANTS} />
        <ellipse cx="3.2" cy="0" rx="3.4" ry="1.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の あいだ */}
      <rect x="-1.8" y="-27.6" width="3.6" height="4.4" rx="1.6" fill={SKIN} />
      {/* どう */}
      <rect x="-6" y="-26" width="12" height="15.6" rx="4.6" fill={TUNIC} />
      <path d="M-4.8 -13.4 h9.6" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm pose={rightArm} side={1} color={TUNIC_DARK} />
      <Arm pose={leftArm} side={-1} color={TUNIC_DARK} />
      <Lantern x={lantern.hx} y={lantern.hy + 1.2} glow={glow} />
      {/* あたま */}
      <circle cx="0" cy="-33.6" r="7.2" fill={SKIN} />
      <g transform="translate(0 -33.6)">
        <Face mood={mood} lookX={lookX} lookY={lookY} />
        <path d="M-7.2 -1 C-7.6 -9 7.6 -9 7.2 -1 C5 -4.6 -4.6 -5 -7.2 -1 Z" fill={HAIR} />
        <path d="M-1 -7.4 Q-0.4 -10.6 1.4 -8.6 Q2.6 -11 3.2 -7.8" fill="none" stroke={HAIR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** あなの 中から ころがってくる ほこりの たま。台の はしから おちる。 */
function DustBall({ t }: SceneProps) {
  const roll = span(t, 4.0, 5.0)
  const drop = span(t, 5.0, 5.6)
  if (roll <= 0 || drop >= 1) return null
  const x = 54 - 21 * roll - drop * 4
  const y = DECK_Y - 2.7 + drop * drop * 40
  const turn = -roll * 560 - drop * 200
  return (
    <Layer x={x} y={y} rotate={turn} opacity={Math.min(roll * 6, 1)}>
      <circle cx="0" cy="0" r="2.7" fill="#cfc7bb" />
      <circle cx="-0.8" cy="-0.6" r="1.6" fill="#e2dcd2" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path key={a} d="M0 -2.4 l0.5 -1.4 l0.5 1.4" fill="none" stroke="#b5ad9f" strokeWidth="0.6" strokeLinecap="round" transform={`rotate(${a})`} />
      ))}
    </Layer>
  )
}

/** がっかりの ため息(あたまの よこ から 左へ) */
function Sigh({ t }: SceneProps) {
  const show = during(t, SAD, LOOK_UP + 0.1, 0.25)
  if (show <= 0) return null
  const p = span(t, SAD, LOOK_UP + 0.1, easeOut)
  return (
    <g opacity={show}>
      <ellipse cx={61 - p * 9} cy={41 - p * 4} rx={2.4 + p * 2} ry={1.7 + p * 1.2} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <ellipse cx={64 - p * 5} cy={41.6 - p * 1.6} rx={1.2 + p * 0.8} ry={0.9 + p * 0.5} fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.5" />
    </g>
  )
}

/** よろこぶとき、子どもの まわりで はじける ほし(字の画の 上は さける) */
function Cheer({ t }: SceneProps) {
  const p = span(t, JOY, JOY + 0.9, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      {[[-16, -12], [16, -14], [-20, 6], [20, 4]].map(([dx, dy], i) => (
        <path key={i} d="M0 -2 L0.6 -0.6 L2 0 L0.6 0.6 L0 2 L-0.6 0.6 L-2 0 L-0.6 -0.6 Z" fill="#ffc233" transform={`translate(${KID_X + dx * (0.5 + p)} ${DECK_Y - 28 + dy * (0.5 + p)}) scale(${1 + p})`} />
      ))}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)

  // ばしょが できる
  const cliff = span(t, 0, 0.55, backOut)
  const lit = span(t, LIGHT, LIGHT + 0.6, easeOut)

  // あるく → しゃがむ → ぴょん と 台に のる
  const walking = t >= ENTER_FROM && t < ENTER_TO
  const step = walking ? Math.sin((t - ENTER_FROM) * Math.PI * 2 * 2.2) : 0
  const hop = span(t, HOP_FROM, HOP_TO, easeInOut)
  const kidX = t < HOP_FROM ? mix(t, ENTER_FROM, ENTER_TO, 125, KID_START_X, easeOut) : KID_START_X + (KID_X - KID_START_X) * hop
  const arc = Math.sin(hop * Math.PI) * 11
  const rise = span(t, HOP_FROM + 0.05, HOP_TO, easeOut)
  const kidY = GROUND_Y + (DECK_Y - GROUND_Y) * rise - arc - (walking ? Math.abs(step) * 0.9 : 0)
  const squash = span(t, ENTER_TO, HOP_FROM) * (1 - span(t, HOP_FROM, HOP_FROM + 0.1)) * 0.12 + during(t, HOP_TO - 0.05, HOP_TO + 0.3, 0.1) * 0.07
  // よろこぶと、ぴょんぴょん はずむ
  const bounce = t >= JOY ? Math.abs(Math.sin((t - JOY) * Math.PI * 2.2)) * 2.2 * (1 - span(t, JOY + 1.2, INK)) : 0
  // あなを のぞく ときは、からだを 少し あなの ほうへ かたむける
  const lean = keys(t, [[PEEK, 0], [PEEK + 0.5, -5], [SAD, -5], [SAD + 0.6, 0]])

  const mood: Mood = t < SAD ? 'hope' : t < LOOK_UP ? 'flat' : t < JOY ? 'wow' : 'joy'
  const lookX = keys(t, [[0, -1], [PEEK, -1], [PEEK + 0.4, -1], [SAD, -0.8], [SAD + 0.4, -0.2], [LOOK_UP, -0.2], [LOOK_UP + 0.4, 0.2], [JOY, 0]])
  const lookY = keys(t, [[0, 0], [HOP_FROM, 0], [HOP_TO, -0.4], [PEEK, 0.1], [SAD, 0.1], [SAD + 0.4, 0.9], [LOOK_UP, 0.9], [LOOK_UP + 0.5, -1], [JOY, -1]])

  // うで: ランタンの うで は、あるくときは ぶらぶら → あなへ のばす → がっかりで さがる → よろこびで 上へ
  const raise = span(t, PEEK, PEEK + 0.5, easeOut)
  const droop = span(t, SAD, SAD + 0.5)
  const cheer = span(t, JOY, JOY + 0.7, backOut)
  const leftAngle = 8 + (walking ? step * 14 : 0) + 67 * raise - 45 * droop + 120 * cheer
  const leftBend = 5 + 20 * raise * (1 - droop) - 10 * cheer
  const rightAngle = 6 + (walking ? -step * 14 : 0) + 144 * cheer
  const rightBend = 5 + 4 * cheer
  const leftArm: ArmPose = { angle: leftAngle, bend: leftBend }
  const rightArm: ArmPose = { angle: rightAngle, bend: rightBend }
  const glow = keys(t, [[0, 0.3], [PEEK, 0.3], [PEEK + 0.5, 1], [SAD + 0.5, 0.5], [JOY, 0.5], [JOY + 0.7, 1]])

  const kidShow = span(t, ENTER_FROM - 0.1, ENTER_FROM)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <Ground />
        <Layer scaleY={cliff} scaleX={0.85 + 0.15 * cliff} origin={[54, 91]}>
          <Cliff lit={lit} />
        </Layer>
        <Plants t={t} />
        <Deck t={t} />
        <DustBall t={t} />
        {kidShow > 0 && (
          <>
            <ellipse cx={kidX} cy={t < HOP_FROM ? GROUND_Y + 1 : DECK_Y + 1 + (1 - rise) * 26} rx={9 * (1 - arc / 30)} ry="1.6" fill="#000000" opacity={0.14} />
            <Layer x={kidX} y={kidY - bounce} rotate={lean} scaleX={1.12} scaleY={1.12 * (1 - squash)} origin={[0, 0]}>
              <Kid step={step} mood={mood} lookX={lookX} lookY={lookY} leftArm={leftArm} rightArm={rightArm} glow={glow} />
            </Layer>
          </>
        )}
        <Sigh t={t} />
        <Cheer t={t} />
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
    { at: 0, label: 'がけ と 台が できる', sound: 'pop' },
    { at: ENTER_FROM, label: 'ランタンを もった 子どもが あるいてくる' },
    { at: HOP_FROM, label: 'ぴょんと 台に のる', sound: 'pop' },
    { at: PEEK, label: 'わくわく あなを のぞく' },
    { at: SAD, label: 'なんにも ない。がっかり' },
    { at: LOOK_UP, label: 'ふと 見あげる。空も からっぽ' },
    { at: JOY, label: 'わあ! ひろい 空' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '空 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
