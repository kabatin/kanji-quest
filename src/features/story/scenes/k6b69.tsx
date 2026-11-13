/*
 * 歩(あるく): 子どもが 砂はまを あるいて、あしあとが ふたつ ならぶ。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … 子どもの あたまから どう(まんなかの たて線)
 *   2画目(一)   … 空に うかぶ 細長い 雲
 *   3画目(丨)   … 水平線に 立つ とうだい
 *   4画目(一)   … 海と 空の さかいめ(水平線)
 *   5画目       … どう の したのほう(こし)
 *   6画目(ノ)   … うしろへ ふった うで
 *   7画目(丶)   … まえへ ふった うで
 *   8画目(ノ)   … うしろへ のばした あし(うしろの あし)
 *   ※ 子どもの 体は 本物の つくり にして、字には「だいたい」重なる くらいに している。
 *
 * ながれ
 *   砂はまに 子どもが ぽん と 立つ。とおくに キラキラ ひかる 貝がら。「ほしいな」と 見つめる
 *   → 右あし(てまえ)を ひとあし ふみだす。あしあとが ぺた。にこっと うれしくなる
 *   → 左あし、また 右あし と あるく。あしあとが ふたつ みっつ と ならぶ(貝がらに ちかづく)
 *   → 大きく ふみだした しゅんかん、ほね が ひかって 絵が うすくなり、字「歩」が のこる
 *
 * 人は ほんものの つくり を守る(字に合わせて 体を ゆがめない):
 *   足は こし から、ひざ で まがる。うでは かた から、ひじ で まがる。
 *   あるくときは、足と ぎゃくの うでを ふる。あし の うらは、うしろの あし だけ かかとが うく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '歩'

const SKY = '#d5f0fb'
const SUN = '#ffd24a'
const SEA = '#7cc4f2'
const SEA_DARK = '#56aae6'
const FOAM = '#ffffff'
const SAND = '#f6e3b0'
const SAND_DARK = '#ecd397'
const PRINT = '#d9b878'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f2766b'
const TUNIC_DARK = '#d9594f'
const SHORTS = '#4f9be0'
const SHORTS_DARK = '#3c82c4'
const SHELL = '#ff9fb2'
const SHELL_DARK = '#ee7f98'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'

/** くぎり の時間(秒) */
const SHELL_AT = 0.9
/** ひとあし め(右あし): 3.2 に つく */
const STEP1 = 2.3
/** ふたあし め(左あし): 4.3 に つく */
const STEP2 = 3.2
/** みあし め(右あし): 5.6 に つく。ここで 大きく ふみだした まま とまる */
const STEP3 = 4.3
const STEP1_END = 3.2
const STEP2_END = 4.3
const STEP3_END = 5.6
const INK = 6.1
const DONE = 8.9
const DURATION = 9.6

/** 地面(あしの うら の たかさ)。あしの 上の ほうが わかりやすい よう、字の画の 下はし(97)より 少し 上 */
const GROUND = 95.5
/** あし の ながさ(もも と すね を あわせた ながさ) */
const LEG = 30.4
const HALF_LEG = LEG / 2
const UPPER_ARM = 12.5
const FORE_ARM = 11.5
/** あるきはじめの 立ち位置。ここから 足を そろえて ふみだす */
const START_X = 16
/** 右あし(てまえ)が 着く 場所と、左あし(むこう)が 着く 場所 */
const A_FIRST = START_X + 10
const B_LAND = START_X + 30
const A_LAST = START_X + 51

type Pt = readonly [number, number]

/** 2つの ほね(もも・すね、うえうで・したうで)を つなぐ ひざ・ひじ の 位置。まえへ まがる */
function joint(from: Pt, to: Pt, first: number, second: number): Pt {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, first + second - 0.01)
  const along = (first * first - second * second + reach * reach) / (2 * reach)
  const height = Math.sqrt(Math.max(first * first - along * along, 0))
  const ux = dx / dist
  const uy = dy / dist
  // まえ(+x)のほうへ まがる
  const sign = -uy >= 0 ? 1 : -1
  return [from[0] + ux * along + -uy * sign * height, from[1] + uy * along + ux * sign * height]
}

type Gait = {
  readonly ax: number
  readonly bx: number
  readonly aLift: number
  readonly bLift: number
  readonly aHeel: number
  readonly bHeel: number
}

/** あるき: 右あし(A)・左あし(B) が 着く場所は 地面に ついたら うごかない(すべらない) */
function gait(t: number): Gait {
  const a1 = span(t, STEP1, STEP1_END, easeInOut)
  const b2 = span(t, STEP2, STEP2_END, easeInOut)
  const a3 = span(t, STEP3, STEP3_END, easeInOut)
  return {
    ax: START_X + (A_FIRST - START_X) * a1 + (A_LAST - A_FIRST) * a3,
    bx: START_X + (B_LAND - START_X) * b2,
    aLift: 6 * Math.sin(Math.PI * a1) + 7 * Math.sin(Math.PI * a3),
    bLift: 7 * Math.sin(Math.PI * b2),
    // うしろに のこった あし は、かかとが うく
    aHeel: span(b2, 0.3, 1) * (1 - span(a3, 0.3, 0.8)),
    bHeel: span(a1, 0.3, 1) * (1 - span(b2, 0.3, 0.8)) + span(a3, 0.3, 1),
  }
}

/* ───────── けしき ───────── */

function Scenery({ t }: SceneProps) {
  const open = span(t, 0, 0.7, easeOut)
  const drift = wave(t, 2.6) * 2
  return (
    <Layer opacity={open}>
      <rect x="-2" y="-2" width="113" height="43" fill={SKY} />
      {/* お日さま */}
      <Layer rotate={t * 14} origin={[97, 12]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="96.2" y="2.2" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 97 12)`} />
        ))}
      </Layer>
      <circle cx="97" cy="12" r="5.8" fill={SUN} />
      {/* 2画目: 細長い 雲 */}
      <g fill="#ffffff" opacity="0.92" transform={`translate(${wave(t, 6) * 1.2} 0)`}>
        <rect x="62" y="21" width="22" height="3.8" rx="1.9" />
        <ellipse cx="68" cy="20.6" rx="4.2" ry="2.4" />
        <ellipse cx="77" cy="20" rx="3.4" ry="2.2" />
      </g>
      {/* 海: 4画目の 水平線 から 下 */}
      <rect x="-2" y="40" width="113" height="20" fill={SEA} />
      <rect x="-2" y="40" width="113" height="2.4" fill={SEA_DARK} />
      <g stroke={FOAM} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.8" transform={`translate(${drift} 0)`}>
        <path d="M8 47 q3 -1.6 6 0 M70 45 q3 -1.6 6 0 M92 51 q3 -1.6 6 0 M22 53 q3 -1.6 6 0" />
      </g>
      {/* 3画目: とうだい */}
      <path d="M31.6 40 L32.8 28 H35.2 L36.4 40 Z" fill="#ffffff" />
      <path d="M32.2 33.2 H35.8 L36.1 36.4 H31.9 Z" fill="#e8534a" />
      <rect x="32.4" y="25" width="3.2" height="3.4" rx="0.6" fill="#ffe17a" />
      <path d="M31.6 25 L34 21.8 L36.4 25 Z" fill="#e8534a" />
      {/* 砂はま と、うちよせる なみ */}
      <rect x="-2" y="58" width="113" height="53" fill={SAND} />
      <path d={`M-2 59 Q12 ${54.5 + drift * 0.4} 26 58.5 Q42 ${63 - drift * 0.4} 58 58.5 Q76 ${54.5 + drift * 0.4} 92 58.5 Q102 61 111 58 V50 H-2 Z`} fill={SEA} />
      <path d={`M-2 59 Q12 ${54.5 + drift * 0.4} 26 58.5 Q42 ${63 - drift * 0.4} 58 58.5 Q76 ${54.5 + drift * 0.4} 92 58.5 Q102 61 111 58`} fill="none" stroke={FOAM} strokeWidth="1.6" strokeLinecap="round" />
      <g fill={SAND_DARK}>
        <ellipse cx="46" cy="104" rx="8" ry="1.4" />
        <ellipse cx="8" cy="101" rx="5" ry="1.1" />
        <ellipse cx="86" cy="76" rx="6" ry="1.2" />
        <ellipse cx="14" cy="72" rx="5" ry="1.1" />
      </g>
    </Layer>
  )
}

/** とおくで はばたく かもめ */
function Gull({ t }: SceneProps) {
  const flap = wave(t, 0.7)
  const x = 72 + wave(t, 7) * 4
  const y = 9 + wave(t, 3.5) * 1.6
  return (
    <Layer x={x} y={y} opacity={span(t, 0.4, 0.9)}>
      <path d={`M-4 ${1.2 + flap * 1.2} Q-2 ${-2.4 - flap * 1.6} 0 0 Q2 ${-2.4 - flap * 1.6} 4 ${1.2 + flap * 1.2}`} fill="none" stroke="#7a8aa3" strokeWidth="1" strokeLinecap="round" />
    </Layer>
  )
}

/* ───────── 貝がら(子どもが ほしくなる もの) ───────── */

function Shell({ t }: SceneProps) {
  const pop = span(t, SHELL_AT, SHELL_AT + 0.5, backOut)
  const bounce = Math.max(0, wave(t, 1.3)) * 0.8
  const glint = Math.max(0, wave(t, 1.4))
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[98, 95]}>
      <ellipse cx="98" cy="96.4" rx="8" ry="1.8" fill="#000000" opacity="0.1" />
      <Layer y={-bounce}>
        <path d="M98 95 L88.5 87.4 Q88.5 79.4 98 78.6 Q107.5 79.4 107.5 87.4 Z" fill={SHELL} />
        <path d="M98 95 L92.5 82.6 M98 95 L98 79 M98 95 L103.5 82.6" stroke={SHELL_DARK} strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M95.2 95.6 Q98 93.6 100.8 95.6 Q98 97 95.2 95.6 Z" fill={SHELL_DARK} />
        <Star cx={105} cy={77} r={3.6 * glint} color="#ffffff" spin={t * 60} />
      </Layer>
    </Layer>
  )
}

/* ───────── あしあと ───────── */

/** あしが ついたとき ぺた と 砂に のこる。つま先は まえ(右) */
function Footprint({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  const pop = span(t, at, at + 0.25, backOut)
  if (pop <= 0) return null
  const puff = span(t, at, at + 0.5, easeOut)
  const cx = x + 2.6
  return (
    <>
      <Layer scale={pop} origin={[cx, 96.6]}>
        <ellipse cx={cx} cy="96.6" rx="6" ry="2.5" fill={PRINT} />
        {[[8.4, 95.4], [9.2, 96.7], [8.2, 98]].map(([dx, y]) => (
          <circle key={y} cx={x + dx} cy={y} r="0.95" fill={PRINT} />
        ))}
      </Layer>
      {puff < 1 ? (
        <g opacity={1 - puff} fill="#fff6dc">
          <circle cx={x - 2 - puff * 5} cy={94 - puff * 2} r={1.2 + puff * 1.4} />
          <circle cx={x + 8 + puff * 4} cy={94.4 - puff * 2.4} r={1 + puff * 1.2} />
        </g>
      ) : null}
    </>
  )
}

/** あしあとが つくたび、ちいさな ほし が ぽん と はじける */
function PrintStar({ t, x, at }: { readonly t: number; readonly x: number; readonly at: number }) {
  const p = span(t, at + 0.05, at + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return <Star cx={x + 3} cy={91 - p * 6} r={3 * (1 - p * 0.5)} color="#ffc233" spin={p * 120} />
}

/* ───────── 子ども ───────── */

type Mood = 'wish' | 'happy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="3" cy="4" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'wish' ? (
        <>
          <path d="M2.4 -2.6 l4 -1.2" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="4.8" cy="0.4" r="1.45" fill={EYE} />
          <circle cx="5.3" cy="-0.1" r="0.5" fill="#ffffff" />
          <ellipse cx="6.2" cy="5.2" rx="1" ry="1.3" fill={MOUTH} />
        </>
      ) : (
        <>
          <path d="M3 0.8 Q4.8 -1.2 6.6 0.8" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M3.6 4 Q6 7.6 8.4 4 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

/** かた から ひじ で まがる うで。swing = ま下から まえへ ふった角度 */
function Arm({ shoulder, swing, color, sleeve }: { readonly shoulder: Pt; readonly swing: number; readonly color: string; readonly sleeve: string }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const bend = 14 + Math.abs(swing) * 0.55
  const elbow: Pt = [shoulder[0] + Math.sin(rad(swing)) * UPPER_ARM, shoulder[1] + Math.cos(rad(swing)) * UPPER_ARM]
  const hand: Pt = [elbow[0] + Math.sin(rad(swing + bend)) * FORE_ARM, elbow[1] + Math.cos(rad(swing + bend)) * FORE_ARM]
  const sleeveEnd: Pt = [shoulder[0] + (elbow[0] - shoulder[0]) * 0.55, shoulder[1] + (elbow[1] - shoulder[1]) * 0.55]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${shoulder[0]} ${shoulder[1]} L${sleeveEnd[0]} ${sleeveEnd[1]}`} fill="none" stroke={sleeve} strokeWidth="6.6" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.6" fill={SKIN} />
    </>
  )
}

/** こし から ひざ で まがる あし。あし の うら は つま先が まえ。かかとが うくと つま先で 立つ */
function Leg({ hip, foot, lift, heel, color, shorts }: { readonly hip: Pt; readonly foot: number; readonly lift: number; readonly heel: number; readonly color: string; readonly shorts: string }) {
  const ankle: Pt = [foot + 0.4 + heel * 1.2, GROUND - 2.6 - lift - heel * 3.2]
  const knee = joint(hip, ankle, HALF_LEG, HALF_LEG)
  const thighEnd: Pt = [hip[0] + (knee[0] - hip[0]) * 0.5, hip[1] + (knee[1] - hip[1]) * 0.5]
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`} fill="none" stroke={color} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${hip[0]} ${hip[1]} L${thighEnd[0]} ${thighEnd[1]}`} fill="none" stroke={shorts} strokeWidth="7.8" strokeLinecap="round" />
      <Layer rotate={-38 * heel} origin={[foot + 7.2, GROUND - lift]}>
        <ellipse cx={foot + 2.6} cy={GROUND - lift - 2} rx="5.2" ry="2.1" fill={color} />
      </Layer>
    </>
  )
}

function Kid({ t }: SceneProps) {
  const g = gait(t)
  const hx = (g.ax + g.bx) / 2
  const sep = Math.abs(g.ax - g.bx)
  // こし の たかさ: あし を ひらくほど ひくくなる
  const hy = GROUND - 2 - Math.sqrt(LEG * LEG - (sep * sep) / 4)
  const hip: Pt = [hx, hy]
  const shoulder: Pt = [hx + 0.5, hy - 26]
  // ぎゃくの うで を ふる(右あし が まえなら、てまえの うで は うしろ)
  const swingNear = -(g.ax - g.bx) * 1.5
  const mood: Mood = t < STEP1_END ? 'wish' : 'happy'
  // うごいている間は 少し まえのめり。立っている間は 息に合わせて ゆれる
  const moving = span(t, STEP1, STEP1 + 0.5) * (1 - span(t, STEP3_END, STEP3_END + 0.3))
  const lean = 4 * moving
  const breath = t < STEP1 ? wave(t, 1.8) : 0
  const pop = span(t, 0.5, 1.0, backOut)
  const headTilt = t < STEP1_END ? -4 : 2
  const headC: Pt = [hx + 0.8, hy - 42.5]
  return (
    <Layer scale={pop} origin={[hx, GROUND]}>
      <ellipse cx={hx + 3} cy="97.2" rx="13" ry="2.4" fill="#000000" opacity="0.12" />
      <Layer rotate={lean} origin={hip} y={breath * 0.25}>
        {/* むこうの うで・あし */}
        <Arm shoulder={shoulder} swing={-swingNear} color={SKIN_SHADE} sleeve={TUNIC_DARK} />
        <Leg hip={hip} foot={g.bx} lift={g.bLift} heel={g.bHeel} color={SKIN_SHADE} shorts={SHORTS_DARK} />
        {/* くび と どう */}
        <rect x={hx - 2} y={hy - 34} width="4.6" height="8" rx="2.2" fill={SKIN_SHADE} />
        <rect x={hx - 8} y={hy - 29} width="16" height="31" rx="7" fill={TUNIC} />
        <path d={`M${hx - 5} ${hy - 12} h10`} stroke={TUNIC_DARK} strokeWidth="1.5" strokeLinecap="round" />
        <rect x={hx - 8.4} y={hy - 6} width="16.8" height="8.4" rx="3" fill={SHORTS} />
        {/* てまえの あし・うで */}
        <Leg hip={hip} foot={g.ax} lift={g.aLift} heel={g.aHeel} color={SKIN} shorts={SHORTS} />
        <Arm shoulder={shoulder} swing={swingNear} color={SKIN} sleeve={TUNIC} />
        {/* あたま: かお は まえ(右) */}
        <Layer rotate={headTilt} origin={[hx + 0.5, hy - 33]}>
          <g transform={`translate(${headC[0]} ${headC[1]})`}>
            <circle cx="0" cy="0" r="9.4" fill={SKIN} />
            <circle cx="-4.4" cy="2.4" r="1.9" fill={SKIN_SHADE} />
            <path d="M-9.4 0.6 C-10.2 -9.2 -1 -11.4 5 -9.2 C8.6 -7.6 9.8 -3 9.2 -0.8 C6.4 -4.4 2 -6 -3 -5.6 C-6 -5.4 -8 -3.6 -9.4 0.6 Z" fill={HAIR} />
            {/* 1画目の あたまの はね: ぴょこんと はねた かみ */}
            <path d={`M-1 -9.6 Q${0.2 + wave(t, 1.6) * 0.5} -14 2 -10.4`} fill="none" stroke={HAIR} strokeWidth="1.8" strokeLinecap="round" />
            <Face mood={mood} />
          </g>
        </Layer>
      </Layer>
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  return (
    <>
      <Layer opacity={ink.picture}>
        <Scenery t={t} />
        <Gull t={t} />
        <Shell t={t} />
        <Footprint t={t} x={A_FIRST} at={STEP1_END} />
        <Footprint t={t} x={B_LAND} at={STEP2_END} />
        <Footprint t={t} x={A_LAST} at={STEP3_END} />
        <Kid t={t} />
        <PrintStar t={t} x={A_FIRST} at={STEP1_END} />
        <PrintStar t={t} x={B_LAND} at={STEP2_END} />
        <PrintStar t={t} x={A_LAST} at={STEP3_END} />
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
    { at: 0, label: '砂はまに 子どもが 立つ', sound: 'pop' },
    { at: SHELL_AT, label: 'とおくに ひかる 貝がら。ほしいな' },
    { at: STEP1, label: '右あしを ふみだす', sound: 'pop' },
    { at: STEP1_END, label: 'あしあとが ぺた。うれしい。つぎは 左あし' },
    { at: STEP3_END, label: 'あしあとが ふたつ ならぶ' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '歩 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
