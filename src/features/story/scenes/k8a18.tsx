/*
 * 記(しるす): きいた ことばを、わすれないように 紙に かいて のこす。
 *
 * ほね(画と絵の対応)
 *   1画目(丶)   … 紙を とめている 画びょう(あたま と はり)
 *   2・3・4画目  … 子どもが 紙に かいていく 3ぎょうの ことば(よこの線)
 *   5・6・7画目  … 紙の したに 印刷された 四角い わく(のこったら 星の しるしが つく)
 *   8・9画目    … ことりの ことばが 入った ふきだし(上の はこ)
 *   10画目(乙)  … 子どもの からだ と、足もとに のびる 地面(ほんの だいたいの 場所)
 *
 * ながれ
 *   ことりが 木のぼうに とまり、子どもが やってくる
 *   → ことりが うたうと、ことばが ふきだしに 出る。子どもは にこにこ ききいる
 *   → ふきだしが うすれはじめ、子どもは「わすれちゃう!」と こまる(あせ)
 *   → 「そうだ!」と ひらめいて、紙に むかい、クレヨンで ことばを 3ぎょう かく
 *      (かくたびに、ふきだしの ことばが 1ぎょう きえて、紙に のこる)
 *   → のこった! 子どもは 大よろこび、わくに 星の しるし
 *   → ほね が ひかって、絵が うすくなり、字「記」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(手が とどくところは、うで の ながさ から きめる)。
 *   くび は みじかく、どう の まんなか の上。かく手は、紙に 手を のばして、えんぴつの さき が 線を ひく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '記'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#4f9be0'
const TUNIC_DARK = '#3c82c4'
const TUNIC_FAR = '#33709f'
const PANTS = '#3e5c86'
const PANTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const PAPER = '#fffdf4'
const PAPER_SHADE = '#e6dfc8'
const CRAYON = '#e8772e'
const CRAYON_DARK = '#c25a1a'
const BOX = '#9bb7d4'
const BUBBLE_EDGE = '#c9d6e6'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'

/** くぎり の時間(秒) */
const CHILD_IN = 0.2
const SING = 0.8
const BUBBLE_AT = 1.2
/** ふきだしが うすれ、子どもが こまりはじめる */
const WORRY = 2.6
/** 「そうだ!」とひらめく(このあと 紙のほうを むく) */
const IDEA = 3.5
const TURNED = 4.15
/** かきはじめ。1ぎょうに 0.8秒(かく 0.65 + つぎの ぎょうへ うつる 0.15) */
const WRITE = 4.2
const LINE_TIME = 0.65
const LINE_STEP = 0.8
const WRITE_END = WRITE + LINE_STEP * 3 - (LINE_STEP - LINE_TIME)
const CHEER = 6.5
const INK = 7.3
const DONE = 10.3
const DURATION = 10.9

type Pt = readonly [number, number]

/* ───────── 子どもの からだ ───────── */

/** 子どもの 足もとの まんなか(x)。ここから 左むき に えがく */
const CX = 53
const HEAD: Pt = [CX - 1, 28]
const NECK: Pt = [CX - 1, 38]
/** かた(てまえ・むこう) */
const S_NEAR: Pt = [CX - 0.5, 46]
const S_FAR: Pt = [CX + 0.5, 46]
/** にのうで・うでさき それぞれの長さ(のばすと かた から 33 とどく) */
const ARM = 16.5
/** えんぴつの さきは、手から これだけ はなれる(かくときは 左上の むき) */
const PEN_REACH = 8
const PEN_OFFSET = PEN_REACH * Math.SQRT1_2

type Key = { readonly at: number; readonly hand: Pt; readonly angle: number }
type HandGoal = { readonly hand: Pt; readonly angle: number }

const lerpPt = (a: Pt, b: Pt, p: number): Pt => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p]

/** 時間じゅんの きめポーズ の間を、なめらかに つなぐ */
function keyed(t: number, keys: readonly Key[]): HandGoal {
  const last = keys[keys.length - 1]
  if (t >= last.at) return last
  if (t <= keys[0].at) return keys[0]
  const i = keys.findIndex((_, idx) => idx < keys.length - 1 && t < keys[idx + 1].at)
  const a = keys[i]
  const b = keys[i + 1]
  const p = span(t, a.at, b.at, easeInOut)
  return { hand: lerpPt(a.hand, b.hand, p), angle: a.angle + (b.angle - a.angle) * p }
}

type ArmShape = { readonly elbow: Pt; readonly hand: Pt }

/**
 * かた から 手 へ。うで は 2本の ほね(かた→ひじ→手)で つながる。
 * 手が とおすぎるときは、うで が のびきった ところで 止まる。side は ひじ が まがる むき。
 */
function reach(shoulder: Pt, target: Pt, side: 1 | -1): ArmShape {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const d = Math.min(dist, ARM * 2 * 0.999)
  const ux = dx / dist
  const uy = dy / dist
  const h = Math.sqrt(Math.max(ARM * ARM - (d / 2) ** 2, 0))
  const mx = shoulder[0] + (ux * d) / 2
  const my = shoulder[1] + (uy * d) / 2
  return { elbow: [mx + uy * side * h, my - ux * side * h], hand: [shoulder[0] + ux * d, shoulder[1] + uy * d] }
}

/* ───────── かく ぎょう(2・3・4画目) ───────── */

type Line = { readonly n: number; readonly a: Pt; readonly b: Pt; readonly from: number }
/** 2画目だけは、手が とどく 少し右から かきはじめる */
const LINES: readonly Line[] = [
  { n: 2, a: [16.6, 33.4], b: [45.6, 30.8], from: 0.1 },
  { n: 3, a: [21.2, 47], b: [41.6, 45.3], from: 0 },
  { n: 4, a: [21.7, 59.6], b: [42.5, 57.4], from: 0 },
]
const lineStart = (i: number) => WRITE + i * LINE_STEP

/** えんぴつの さきの いち。ぎょうを かいている間は 線の上、ぎょうの間は つぎの ぎょうへ うつる */
function penTip(t: number): Pt {
  for (let i = 0; i < LINES.length; i += 1) {
    const s = lineStart(i)
    if (t < s + LINE_TIME) return lerpPt(LINES[i].a, LINES[i].b, span(t, s, s + LINE_TIME))
    if (i < LINES.length - 1 && t < s + LINE_STEP) return lerpPt(LINES[i].b, LINES[i + 1].a, span(t, s + LINE_TIME, s + LINE_STEP, easeInOut))
  }
  return LINES[LINES.length - 1].b
}

const penHand = (tip: Pt): Pt => [tip[0] + PEN_OFFSET, tip[1] + PEN_OFFSET]

/** 手の きめポーズ(かたの 位置から の 相対で えらんだ) */
const HANG: Pt = [S_NEAR[0] - 2, S_NEAR[1] + 31.5]
const SCRATCH: Pt = [CX - 3, 20]
const RAISE: Pt = [S_NEAR[0] - 16.5, S_NEAR[1] - 18]
const CHEER_HAND: Pt = [S_NEAR[0] - 6, S_NEAR[1] - 28]
const WRITE_FIRST = penHand(LINES[0].a)
const WRITE_LAST = penHand(LINES[LINES.length - 1].b)

const NEAR_BEFORE: readonly Key[] = [
  { at: 0, hand: HANG, angle: 15 },
  { at: WORRY, hand: HANG, angle: 15 },
  { at: WORRY + 0.35, hand: SCRATCH, angle: 150 },
  { at: IDEA - 0.1, hand: SCRATCH, angle: 150 },
  { at: IDEA + 0.3, hand: RAISE, angle: 150 },
  { at: IDEA + 0.7, hand: RAISE, angle: 150 },
  { at: WRITE, hand: WRITE_FIRST, angle: 135 },
]
const NEAR_AFTER: readonly Key[] = [
  { at: WRITE_END, hand: WRITE_LAST, angle: 135 },
  // ひじを たたんだまま 体に ぶつからないよう、いちど 前へ はなしてから あげる
  { at: WRITE_END + 0.2, hand: [S_NEAR[0] - 15, S_NEAR[1] + 4], angle: 150 },
  { at: CHEER, hand: CHEER_HAND, angle: 170 },
]
const FAR_KEYS: readonly Key[] = [
  { at: 0, hand: [S_FAR[0] + 1, S_FAR[1] + 31.5], angle: 0 },
  { at: CHEER - 0.1, hand: [S_FAR[0] + 1, S_FAR[1] + 31.5], angle: 0 },
  { at: CHEER + 0.35, hand: [S_FAR[0] + 9, S_FAR[1] - 27], angle: 0 },
]

function nearGoal(t: number): HandGoal {
  if (t < WRITE) return keyed(t, NEAR_BEFORE)
  if (t < WRITE_END) return { hand: penHand(penTip(t)), angle: 135 }
  return keyed(t, NEAR_AFTER)
}

type Mood = 'listen' | 'worry' | 'idea' | 'focus' | 'joy'

function moodAt(t: number): Mood {
  if (t < WORRY) return 'listen'
  if (t < IDEA) return 'worry'
  if (t < WRITE) return 'idea'
  if (t < WRITE_END) return 'focus'
  return 'joy'
}

/** 顔(あたま の まんなかを 0,0 とした 相対の場所)。気持ちで 目・まゆ・口 を かえる */
function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <ellipse cx="-3.7" cy="4.2" rx="2.1" ry="1.9" fill="#ff9d9d" opacity="0.55" />
      {mood === 'joy' ? (
        <>
          <path d="M-6.4 1.6 Q-4.8 -0.8 -3.2 1.6" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M-7.4 5.2 Q-5.4 9.8 -3 5.4 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="-4.8" cy={mood === 'idea' ? 0.8 : 1.1} r={mood === 'idea' ? 1.6 : 1.2} fill={EYE} />
          {mood === 'worry' && (
            <>
              <path d="M-8 -2 L-3.4 -4" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <path d="M-7 6.6 Q-5.4 4.6 -3.6 6.3" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
          {mood === 'idea' && (
            <>
              <path d="M-7.6 -3.4 L-3.2 -3.6" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <ellipse cx="-5.4" cy="6" rx="1.5" ry="2" fill={MOUTH} />
            </>
          )}
          {mood === 'focus' && (
            <>
              <path d="M-7.4 -2.2 L-3.4 -2.7" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <ellipse cx="-5.6" cy="6" rx="1.1" ry="1.1" fill={MOUTH} />
              <ellipse cx="-5.2" cy="7.5" rx="1.2" ry="0.9" fill="#ff8a8a" />
            </>
          )}
          {mood === 'listen' && <path d="M-7.2 5.6 Q-5.4 8.4 -3.4 5.8 Z" fill={MOUTH} />}
        </>
      )}
    </>
  )
}

/** うで と クレヨン。クレヨンは てまえの 手に もつ */
function Arm({ shoulder, shape, color }: { readonly shoulder: Pt; readonly shape: ArmShape; readonly color: string }) {
  return <path d={`M${shoulder[0]} ${shoulder[1]} L${shape.elbow[0]} ${shape.elbow[1]} L${shape.hand[0]} ${shape.hand[1]}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
}

function Crayon({ hand, angle }: { readonly hand: Pt; readonly angle: number }) {
  const rad = (angle * Math.PI) / 180
  const dir: Pt = [-Math.sin(rad), Math.cos(rad)]
  const at = (k: number): Pt => [hand[0] + dir[0] * k, hand[1] + dir[1] * k]
  const tail = at(-4)
  const base = at(PEN_REACH - 2.6)
  const tip = at(PEN_REACH)
  return (
    <>
      <path d={`M${tail[0]} ${tail[1]} L${base[0]} ${base[1]}`} stroke={CRAYON} strokeWidth="3.2" strokeLinecap="round" />
      <path d={`M${base[0]} ${base[1]} L${tip[0]} ${tip[1]}`} stroke={CRAYON_DARK} strokeWidth="2.1" strokeLinecap="round" />
    </>
  )
}

type PersonProps = {
  readonly mood: Mood
  readonly near: ArmShape
  readonly nearAngle: number
  readonly far: ArmShape
  readonly headTilt: number
  readonly breath: number
  readonly sweat: number
}

function Person({ mood, near, nearAngle, far, headTilt, breath, sweat }: PersonProps) {
  return (
    <>
      {/* むこうの うで: どう の うしろ */}
      <Arm shoulder={S_FAR} shape={far} color={TUNIC_FAR} />
      <circle cx={far.hand[0]} cy={far.hand[1]} r="3.4" fill={SKIN_SHADE} />
      {/* あし(さきは 見ている ほうへ) */}
      <rect x={CX + 0.4} y="70" width="5.8" height="22.5" rx="2.9" fill={PANTS_DARK} />
      <ellipse cx={CX + 1.4} cy="93.4" rx="5" ry="2.7" fill={SHOE} />
      <rect x={CX - 5.8} y="70" width="5.8" height="22.5" rx="2.9" fill={PANTS} />
      <ellipse cx={CX - 4.6} cy="93.4" rx="5.4" ry="2.8" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x={CX - 3.6} y="35" width="5.2" height="8" rx="2.4" fill={SKIN_SHADE} />
      {/* どう: 息に合わせて 少しだけ ふくらむ */}
      <Layer scaleX={1 + breath * 0.04} scaleY={1 + breath * 0.015} origin={[CX, 72]}>
        <rect x={CX - 6.6} y="40" width="13.2" height="33" rx="6.4" fill={TUNIC} />
        <path d={`M${CX - 4.6} 64 h9.2`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
      </Layer>
      {/* てまえの うで と クレヨン */}
      <Arm shoulder={S_NEAR} shape={near} color={TUNIC_DARK} />
      <Crayon hand={near.hand} angle={nearAngle} />
      <circle cx={near.hand[0]} cy={near.hand[1]} r="3.5" fill={SKIN} />
      {/* あたま: くび を じく に うなずく */}
      <Layer rotate={headTilt} origin={NECK}>
        <g transform={`translate(${HEAD[0]} ${HEAD[1]})`}>
          <circle cx="0" cy="0" r="9.2" fill={SKIN} />
          <path d="M-8.7 -1.6 C-8.8 -10.8 1.6 -13.4 7.6 -7.6 C10 -4.4 10 1.4 8 5.6 C7.4 -0.2 3.2 -4.4 -3.6 -4 C-5.8 -3.8 -7.6 -2.8 -8.7 -1.6 Z" fill={HAIR} />
          <path d="M2.2 -7 Q3 -10.2 4.8 -8.1 Q6 -10.8 6.8 -7.7" fill="none" stroke={HAIR} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <Face mood={mood} />
          {sweat > 0 && <path d="M0 -2.6 Q2.2 0.8 0 2.4 Q-2.2 0.8 0 -2.6 Z" fill="#7cc4f2" transform={`translate(${7 + sweat * 1.4} ${-6 + sweat * 8})`} opacity={1 - sweat * 0.4} />}
        </g>
      </Layer>
    </>
  )
}

/* ───────── まわり ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <circle cx="100" cy="8" r={4.6 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill="#e2f2d2" />
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 62, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 紙を はった 立て板。画びょう(1画目)と、紙の わく(5・6・7画目)と、かいた ぎょう(2・3・4画目) */
function Board({ t }: SceneProps) {
  const grow = span(t, 0, 0.55, backOut)
  const stamp = span(t, CHEER + 0.1, CHEER + 0.6, backOut)
  return (
    <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} origin={[30, 96]}>
      <path d="M16 90 L9 99 M43 90 L50 99" fill="none" stroke={BARK} strokeWidth="3.2" strokeLinecap="round" />
      <rect x="13" y="10" width="37" height="86" rx="3" fill={PAPER_SHADE} />
      <rect x="11" y="8" width="37" height="86" rx="3" fill={PAPER} stroke="#cfc6a6" strokeWidth="1" />
      <Bone char={CHAR} n={5} color={BOX} width={1.8} />
      <Bone char={CHAR} n={6} color={BOX} width={1.8} />
      <Bone char={CHAR} n={7} color={BOX} width={1.8} />
      <Layer scale={stamp} origin={[32, 81]}>
        <Star cx={32} cy={81} r={6.4} color="#ffc233" />
      </Layer>
      {/* 画びょう: あたま(赤)と はり(はい色) */}
      <Bone char={CHAR} n={1} color="#b7bfc9" width={1.8} />
      <circle cx="25.5" cy="14.3" r="3.3" fill="#e8534a" />
      <circle cx="24.6" cy="13.4" r="1.1" fill="#f5887f" />
      {LINES.map((line, i) => {
        const f = span(t, lineStart(i), lineStart(i) + LINE_TIME)
        return <Bone key={line.n} char={CHAR} n={line.n} color={CRAYON} width={2.4} from={line.from} to={line.from + (1 - line.from) * f} />
      })}
    </Layer>
  )
}

/** ことばの ぎょう。ゆるく ゆれる 線(ことば の かわり) */
function wavy(x1: number, x2: number, y: number): string {
  const count = Math.floor((x2 - x1) / 3)
  return `M${x1} ${y}${Array.from({ length: count }, (_, i) => ` q1.5 ${i % 2 === 0 ? -1.8 : 1.8} 3 0`).join('')}`
}
const WORDS: readonly (readonly [number, number, number])[] = [
  [71, 92, 22],
  [71, 87, 29],
  [71, 90, 36],
]

/** ことりの ことば の ふきだし。うすれて ただよい、かくたびに 1ぎょうずつ きえる */
function Bubble({ t }: SceneProps) {
  const appear = span(t, BUBBLE_AT, BUBBLE_AT + 0.45, backOut)
  const gone = 1 - span(t, WRITE_END, CHEER + 0.2)
  if (appear <= 0 || gone <= 0) return null
  const fade = mix(t, WORRY, IDEA + 0.4, 1, 0.4)
  const drift = span(t, WORRY, WRITE_END)
  const sway = t > WORRY ? wave(t, 1.6) * 0.8 * drift : 0
  return (
    <Layer x={sway} y={-drift * 4} scale={appear * (1 - 0.1 * drift)} origin={[83, 43]} opacity={fade * gone}>
      <path d="M76 15 H87 Q97 15 97 25 V33 Q97 43 87 43 H86 L83 63 L79 43 H76 Q66 43 66 33 V25 Q66 15 76 15 Z" fill="#ffffff" stroke={BUBBLE_EDGE} strokeWidth="0.9" strokeLinejoin="round" />
      {WORDS.map(([x1, x2, y], i) => {
        const shown = span(t, BUBBLE_AT + 0.3 + i * 0.25, BUBBLE_AT + 0.6 + i * 0.25) * (1 - span(t, lineStart(i), lineStart(i) + 0.5))
        return <path key={y} d={wavy(x1, x2, y)} fill="none" stroke={CRAYON} strokeWidth="2" strokeLinecap="round" opacity={shown} />
      })}
    </Layer>
  )
}

/** うたう ことり。木のぼうに とまって、くち を あけ・とじ する。 */
function Bird({ t }: SceneProps) {
  const chirp = (t >= SING && t < WORRY) || (t >= CHEER && t < INK + 0.8)
  const open = chirp && wave(t, 0.34) > 0
  const hop = chirp ? Math.abs(wave(t, 0.34)) * 0.8 : 0
  const notes = during(t, SING, WORRY - 0.2, 0.25)
  return (
    <>
      <rect x="82" y="79.5" width="12" height="17.5" rx="1.6" fill={BARK} />
      <path d="M82.6 86 h10.8 M82.6 92 h10.8" stroke={BARK_DARK} strokeWidth="1" />
      <Layer x={88} y={72 - hop} scale={1.7}>
        <path d="M-1.2 3 v2.2 M1.4 3 v2.2" stroke="#e2733f" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#e2733f" />
        <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#ff9a5c" />
        <circle cx="-3" cy="-2.3" r="2.3" fill="#ff9a5c" />
        {open ? (
          <>
            <path d="M-5 -2.7 l-2.6 -0.3 l2.5 1.3 Z" fill="#f2b632" />
            <path d="M-4.9 -1.5 l-2.4 1.1 l2.4 0.4 Z" fill="#f2b632" />
          </>
        ) : (
          <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
        )}
        <circle cx="-3.6" cy="-2.9" r="0.55" fill={EYE} />
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#e2733f" />
      </Layer>
      {notes > 0 &&
        [0, 0.5].map((offset) => {
          const p = ((t + offset) % 1) / 1
          return (
            <g key={offset} opacity={notes * Math.sin(p * Math.PI)} fill="#f07f9e" transform={`translate(${76 - p * 8} ${68 - p * 14})`}>
              <path d="M2.2 0 v-4.4 l2.6 -0.8 v4.2" fill="none" stroke="#f07f9e" strokeWidth="0.8" />
              <ellipse cx="1.2" cy="0.2" rx="1.2" ry="0.85" />
            </g>
          )
        })}
    </>
  )
}

/** 「そうだ!」の しるし。あたまの上で ぽん と出る */
function Aha({ t }: SceneProps) {
  const show = during(t, IDEA, IDEA + 0.8, 0.15)
  if (show <= 0) return null
  const pop = span(t, IDEA, IDEA + 0.25, backOut)
  return (
    <Layer x={CX - 1} y={7} scale={pop} opacity={show} origin={[0, 0]}>
      <path d="M0 -4.4 V2" stroke="#e8534a" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="0" cy="5.6" r="1.5" fill="#e8534a" />
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 10)

  const nearTarget = nearGoal(t)
  const near = reach(S_NEAR, nearTarget.hand, 1)
  const farTarget = keyed(t, FAR_KEYS)
  const far = reach(S_FAR, farTarget.hand, -1)

  const mood = moodAt(t)
  // 子どもの むき: はじめは ことり(右)を むき、ひらめいたら 紙(左)へ むきを変える
  const facing = mix(t, IDEA + 0.05, TURNED, -1, 1)
  const listening = t >= BUBBLE_AT && t < WORRY
  const breath = wave(t, 1.8)
  const hop = t >= CHEER ? Math.abs(Math.sin(((t - CHEER) * Math.PI) / 0.45)) * 1.8 * (1 - span(t, CHEER + 1.1, CHEER + 1.4)) : 0
  const bob = listening ? -Math.abs(wave(t, 0.9)) * 0.6 : 0
  const headTilt =
    t < WORRY
      ? 3
      : t < IDEA
        ? mix(t, WORRY, WORRY + 0.4, 3, -7)
        : t < WRITE
          ? mix(t, IDEA, IDEA + 0.3, -7, 3)
          : t < WRITE_END
            ? mix(t, WRITE - 0.1, WRITE + 0.3, 3, -9)
            : mix(t, WRITE_END, CHEER + 0.3, -9, 6)
  const sweat = during(t, WORRY + 0.2, IDEA, 0.15) > 0 ? span(t, WORRY + 0.2, IDEA) : 0
  const childIn = span(t, CHILD_IN, CHILD_IN + 0.5, backOut)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Board t={t} />
        <Bird t={t} />
        <Bubble t={t} />
        <Layer opacity={span(t, CHILD_IN, CHILD_IN + 0.2)}>
          <ellipse cx={CX} cy="97.4" rx="10" ry="2.4" fill="#000000" opacity="0.12" />
          <Layer scale={childIn} origin={[CX, 94]}>
            <Layer y={-hop + bob}>
              <Layer scaleX={facing} origin={[CX, 60]}>
                <Person mood={mood} near={near} nearAngle={nearTarget.angle} far={far} headTilt={headTilt} breath={breath} sweat={sweat} />
              </Layer>
            </Layer>
          </Layer>
        </Layer>
        <Aha t={t} />
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
    { at: 0, label: 'ことりと 子どもが あらわれる', sound: 'pop' },
    { at: BUBBLE_AT, label: 'ことりが うたい、ことばが ふきだしに 出る', sound: 'pop' },
    { at: WORRY, label: 'ことばが うすれて、子どもは こまる' },
    { at: IDEA, label: 'そうだ! かいておこう', sound: 'pop' },
    { at: WRITE, label: 'ことばを 紙に かいていく', sound: 'stroke' },
    { at: CHEER, label: 'のこった! 子どもは うれしい', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '記 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
