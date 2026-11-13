/*
 * 考(かんがえる): つえを ついた おとしより が、つくえ に むかって じっくり かんがえる。
 *
 * ほね(画と絵の対応)  ※ 人の体は ゆがめないので、字の線と「だいたい 同じ場所・同じ向き」
 *   1画目(一)  … おとしより の ひろい むぎわらぼうし の つば(耂 の いちばん上)
 *   2画目(丨)  … ぼうし の てっぺん から、かお、ながい ひげ まで 通る まんなかの たて線
 *   3画目(一)  … よこに ながい つくえ の てんばん(おとしより は つくえ の むこうに すわる)
 *   4画目(ノ)  … つくえ に たてかけた つえ(右上から 左下へ ななめ)
 *   5・6画目   … つくえ の下で まるまって ねている ねこ(丂 = こう の おとを 出す ほう)
 *
 * ながれ
 *   つくえ が あらわれ、おとしより が ぽん と かおを出す → なやみごと(「?」)で 首を かしげる
 *   → ひげを なでながら じっくり かんがえる(ゆげ が のぼり、かんがえの あわ が ふくらむ。ねこ は ぐっすり)
 *   → ながい 時間 かんがえて、ひらめき(でんきゅう)! 両手を あげて にっこり。ねこ も 目をさます
 *   → ほね が ひかって、絵が うすくなり、字「考」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ の 向きは ふたつの 長さから 計算する)。
 *   くび は みじかく、かお は どう の まんなか の上。字と ぴったり重ならなくても 絵の ただしさを えらぶ。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '考'

const SKIN = '#f8cfa6'
const WHITE = '#f6f3ec'
const WHITE_SHADE = '#d9d4c8'
const BROW = '#b3ab9a'
const ROBE = '#3fa39a'
const ROBE_DARK = '#2f8a82'
const STRAW = '#e8c872'
const STRAW_DARK = '#c9a24d'
const BAND = '#c0573e'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const CANE = '#b27a43'
const CANE_DARK = '#8a5a2c'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const CLOUD = '#ffffff'
const CLOUD_SHADE = '#dbe5f0'
const MOUTH = '#b9483f'
const EYE = '#2b2b2b'
const CHEEK = '#ff9d9d'
const CAT = '#ff9a5c'
const CAT_DARK = '#e2733f'
const CAT_BELLY = '#ffe0c4'
const TEA = '#e8f6ff'
const THINK = '#5f7fd6'

/** くぎり の時間(秒) */
const POP = 0.5
const PUZZLE = 1.4
/** ひげを なでて、じっくり かんがえはじめる */
const THINK_AT = 3.0
/** ひらめき */
const AHA = 5.4
const INK = 6.6
const DONE = 9.3
const DURATION = 9.9

/** 人の かた(うで の つけね)と、うで ひとつ分(かた→ひじ、ひじ→手)の長さ */
const SHOULDER_L: readonly [number, number] = [45, 35]
const SHOULDER_R: readonly [number, number] = [63, 35]
const ARM_PART = 8.5
/** からだ の まんなか(左右) */
const MID_X = 54
/** おとしより を 大きく見せる(つくえ の てんばん を じく に) */
const BIG = 1.25
/** くび の まわりで あたま を かたむける じく */
const NECK: readonly [number, number] = [54, 36]

type Pt = readonly [number, number]
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** 手を おく場所 */
const REST_L: Pt = [43.5, 38.8]
const REST_R: Pt = [64.5, 38.8]
/** ひげ(左手で なでる)・ばんざい(両手) */
const BEARD: Pt = [50.5, 34.8]
const UP_L: Pt = [38, 21.5]
const UP_R: Pt = [70, 21.5]

/** かた と 手 の 2てん から、ひじ の場所を 出す(ふたつの 長さが ARM_PART。ひじは 体の そと・下へ まがる) */
function elbowOf(shoulder: Pt, hand: Pt): Pt {
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(Math.min(Math.hypot(dx, dy), ARM_PART * 2 - 0.01), 0.01)
  const half = Math.sqrt(ARM_PART ** 2 - (dist / 2) ** 2)
  const ux = dx / dist
  const uy = dy / dist
  const mid: Pt = [shoulder[0] + dx / 2, shoulder[1] + dy / 2]
  const a: Pt = [mid[0] - uy * half, mid[1] + ux * half]
  const b: Pt = [mid[0] + uy * half, mid[1] - ux * half]
  // 体の そと(まんなか から はなれる)・下 に ある ほうを えらぶ
  const score = (p: Pt) => p[1] + 0.7 * Math.abs(p[0] - MID_X)
  return score(a) >= score(b) ? a : b
}

/** かた から出て、ひじ で まがる うで。手の先(hand)は ここでは 描かない(つくえ の 上に あとで 描く) */
function Arm({ shoulder, hand }: { readonly shoulder: Pt; readonly hand: Pt }) {
  const elbow = elbowOf(shoulder, hand)
  // 手さきは ひじ から 長さ ARM_PART の ところ(のばしきる と とどかない ときは そのまま 手まで)
  return <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={ROBE_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
}

function Hand({ at }: { readonly at: Pt }) {
  return <circle cx={at[0]} cy={at[1]} r="2.7" fill={SKIN} />
}

/* ───────── まわり ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  // 日が ゆっくり うごく(じかん が たつ ことを みせる)
  const sunX = mix(t, 0, DURATION, 11, 21, (x) => x)
  return (
    <>
      <Layer opacity={sun} rotate={t * 12} origin={[sunX, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={sunX - 0.8} y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} ${sunX} 13)`} />
        ))}
      </Layer>
      <circle cx={sunX} cy="13" r={6.2 * sun} fill={SUN} />
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      <g fill={CLOUD} opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-3" cy="46" rx="7" ry="3.2" />
        <ellipse cx="2" cy="44" rx="5" ry="3.2" />
        <ellipse cx="100" cy="58" rx="6" ry="2.6" />
        <ellipse cx="104" cy="56.4" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 40, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** つくえ。てんばん(3画目)・まえいた・あし。おくから 手前へ のびるように あらわれる */
function Desk({ t }: SceneProps) {
  const grow = span(t, 0, 0.6, backOut)
  return (
    <Layer scaleX={0.5 + 0.5 * grow} scaleY={Math.max(grow, 0)} origin={[54.5, 96]}>
      <ellipse cx="54.5" cy="97.4" rx="42" ry="2.6" fill="#000000" opacity="0.1" />
      <rect x="17" y="46" width="5.4" height="50.4" rx="1.6" fill={BARK_DARK} />
      <rect x="87" y="46" width="5.4" height="50.4" rx="1.6" fill={BARK_DARK} />
      <path d="M14.6 42 L95.6 37.6 L95.6 45.6 L14.6 49.8 Z" fill={BARK_DARK} />
      <Bone char={CHAR} n={3} color={BARK} width={5} />
    </Layer>
  )
}

/** つくえ の 上の ちゃわん と ゆげ(ゆげ は じかん が たつ ことを みせる) */
function Tea({ t }: SceneProps) {
  const show = span(t, 0.7, 1.1, backOut)
  return (
    <Layer scale={show} origin={[79, 38]}>
      <path d="M74.5 32 H83.5 V34 Q83.5 38 79 38 Q74.5 38 74.5 34 Z" fill="#f4ede0" />
      <path d="M75 33 H83" stroke={BAND} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M83.4 33.2 q3 0.4 2.2 2.4 q-0.6 1.4 -2.6 1.4" fill="none" stroke="#f4ede0" strokeWidth="1.2" strokeLinecap="round" />
      {[0, 1].map((i) => {
        const p = ((t * 0.7 + i * 0.5) % 1)
        return <path key={i} d={`M${77.4 + i * 3} ${31 - p * 3} q1.6 -2 0 -4 q-1.6 -2 0 -4`} fill="none" stroke={TEA} strokeWidth="1" strokeLinecap="round" opacity={0.85 * (1 - p)} />
      })}
    </Layer>
  )
}

/** つえ(4画目)。つくえ に たてかけて ある。あたまの ほうが まがった、おとしより の つえ */
function Cane({ t }: SceneProps) {
  const show = span(t, 0.3, 0.8, easeOut)
  return (
    <Layer opacity={show}>
      <path d="M9 96 L23.2 49 Q24.4 42.6 28 41.4 Q31.2 40.6 31 44.6" fill="none" stroke={CANE} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="9" cy="96.4" rx="2.6" ry="1.1" fill={CANE_DARK} />
    </Layer>
  )
}

/* ───────── おとしより ───────── */

type Mood = 'puzzled' | 'think' | 'aha'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <path d="M45 28 q-3 -0.4 -2.4 2.6 q0.6 1.6 2.6 1.2 Z M63 28 q3 -0.4 2.4 2.6 q-0.6 1.6 -2.6 1.2 Z" fill={WHITE} />
      <ellipse cx="54" cy="30.5" rx="9.2" ry="7.4" fill={SKIN} />
      <circle cx="47.6" cy="32" r="1.8" fill={CHEEK} opacity="0.5" />
      <circle cx="60.4" cy="32" r="1.8" fill={CHEEK} opacity="0.5" />
      {/* ながい ひげ(2画目の おわりが ここ) と ひげ の かげ */}
      <path d="M45.4 31.4 C44.6 37 48.6 39.2 54 39.2 C59.4 39.2 63.4 37 62.6 31.4 C60 34.6 48 34.6 45.4 31.4 Z" fill={WHITE} />
      <path d="M47.5 37 Q54 40 60.5 37" fill="none" stroke={WHITE_SHADE} strokeWidth="1" strokeLinecap="round" />
      {mood === 'puzzled' ? (
        <>
          <path d="M47 28.3 l4.2 -0.9" stroke={BROW} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M57 27.1 l4.2 1.2" stroke={BROW} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="49.4" cy="30.4" r="1.15" fill={EYE} />
          <circle cx="58.6" cy="30.4" r="1.15" fill={EYE} />
          <path d="M52.4 36.2 q1.6 -1 3.2 0" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      ) : mood === 'think' ? (
        <>
          <path d="M47 28.3 h4.2 M57 28.3 h4.2" stroke={BROW} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M47.6 30.2 Q49.4 31.8 51.2 30.2 M56.8 30.2 Q58.6 31.8 60.4 30.2" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="54" cy="36.4" rx="1" ry="0.8" fill={MOUTH} />
        </>
      ) : (
        <>
          <path d="M47 28 q2 -1 4.2 0 M57 28 q2 -1 4.2 0" fill="none" stroke={BROW} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M47.6 31 Q49.4 28.8 51.2 31 M56.8 31 Q58.6 28.8 60.4 31" fill="none" stroke={EYE} strokeWidth="1.25" strokeLinecap="round" />
          <path d="M51.4 35.2 Q54 40 56.6 35.2 Z" fill={MOUTH} />
        </>
      )}
      {/* くち ひげ */}
      <ellipse cx="51.6" cy="33.4" rx="3.2" ry="1.4" fill={WHITE} transform="rotate(8 51.6 33.4)" />
      <ellipse cx="56.4" cy="33.4" rx="3.2" ry="1.4" fill={WHITE} transform="rotate(-8 56.4 33.4)" />
    </>
  )
}

/** むぎわらぼうし。つば が 1画目、てっぺん の ちいさな はね が 2画目の はじまり */
function Hat() {
  return (
    <>
      <path d="M43.4 24 C43 14 48 12 53.5 12 C59 12 64 14 64.4 24 Z" fill={STRAW} />
      <path d="M43.2 21.4 H64.6 L64.4 24 H43.4 Z" fill={BAND} />
      <path d="M53.6 12 q-0.4 -1.6 0.8 -2.2" fill="none" stroke={STRAW_DARK} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="52.5" cy="24.2" rx="17.5" ry="2.7" fill={STRAW_DARK} />
      <ellipse cx="52.5" cy="23.7" rx="17.5" ry="2.4" fill={STRAW} />
    </>
  )
}

type ElderProps = {
  readonly mood: Mood
  readonly handL: Pt
  readonly handR: Pt
  readonly tilt: number
  readonly breath: number
}

function Elder({ mood, handL, handR, tilt, breath }: ElderProps) {
  return (
    <>
      {/* どう(かた から ひじ まで の うでは そでの 下) */}
      <Layer scaleY={1 + breath * 0.02} origin={[54, 46]}>
        <rect x="40" y="33" width="28" height="12" rx="6" fill={ROBE} />
        <path d="M54 35 v8" stroke={ROBE_DARK} strokeWidth="1.2" strokeLinecap="round" />
      </Layer>
      <Arm shoulder={SHOULDER_L} hand={handL} />
      <Arm shoulder={SHOULDER_R} hand={handR} />
      {/* くび は みじかく、あたま は どう の まんなか の上 */}
      <Layer rotate={tilt} origin={NECK}>
        <Face mood={mood} />
        <Hat />
      </Layer>
    </>
  )
}

/* ───────── かんがえ の あわ・ひらめき ───────── */

const CLOUD_AT: Pt = [88, 12]

function Thoughts({ t }: SceneProps) {
  const b1 = span(t, THINK_AT, THINK_AT + 0.35, backOut)
  const b2 = span(t, THINK_AT + 0.4, THINK_AT + 0.75, backOut)
  const big = span(t, THINK_AT + 0.9, THINK_AT + 1.5, backOut)
  const bulb = span(t, AHA, AHA + 0.45, backOut)
  const dots = during(t, THINK_AT + 1.4, AHA, 0.2)
  return (
    <Layer x={3}>
      <Layer scale={b1} origin={[77, 21.5]}>
        <circle cx="77" cy="21.5" r="1.5" fill={CLOUD_SHADE} />
        <circle cx="77" cy="21.2" r="1.3" fill={CLOUD} />
      </Layer>
      <Layer scale={b2} origin={[78.8, 18]}>
        <circle cx="78.8" cy="18" r="2.2" fill={CLOUD_SHADE} />
        <circle cx="78.8" cy="17.6" r="1.9" fill={CLOUD} />
      </Layer>
      <Layer scale={big} origin={CLOUD_AT}>
        <g fill={CLOUD_SHADE}>
          <circle cx="82" cy="13.2" r="5.5" />
          <circle cx="94" cy="13.2" r="5.5" />
          <circle cx="88" cy="9.5" r="6.6" />
          <circle cx="88" cy="15" r="6" />
        </g>
        <g fill={CLOUD}>
          <circle cx="82" cy="12.4" r="5.1" />
          <circle cx="94" cy="12.4" r="5.1" />
          <circle cx="88" cy="8.7" r="6.2" />
          <circle cx="88" cy="14.2" r="5.6" />
        </g>
        {/* 「……」ずっと かんがえている */}
        <g opacity={dots} fill={THINK}>
          {[84.4, 88, 91.6].map((x, i) => (
            <circle key={x} cx={x} cy="11.5" r="1.15" opacity={0.3 + 0.7 * Math.max(0, wave(t, 1.2, -i * 0.25))} />
          ))}
        </g>
      </Layer>
      <Layer scale={bulb} origin={[88, 10]}>
        <Layer opacity={span(t, AHA + 0.1, AHA + 0.4)} rotate={t * 30} origin={[88, 10]}>
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M88 2.4 v-1.8" stroke={SUN} strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${i * 45} 88 10)`} />
          ))}
        </Layer>
        <circle cx="88" cy="9.6" r="4.2" fill={SUN} />
        <circle cx="86.6" cy="8.2" r="1.4" fill="#fff6c4" />
        <rect x="86" y="13.2" width="4" height="2.4" rx="0.8" fill="#9aa4b4" />
      </Layer>
    </Layer>
  )
}

/** なやみごとの「?」。かたを かしげる あいだ、ゆらゆら */
function Question({ t }: SceneProps) {
  const show = during(t, PUZZLE + 0.1, THINK_AT + 0.3, 0.3)
  if (show <= 0) return null
  const sway = wave(t, 0.9) * 6
  return (
    <g opacity={show} transform={`translate(33 12) rotate(${sway})`}>
      <path d="M-2.8 -2.6 Q-2.8 -5.8 0 -5.8 Q3 -5.8 3 -3 Q3 -1.2 0.7 -0.2 Q0 0.3 0 1.8" fill="none" stroke={THINK} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="0" cy="4.6" r="1.1" fill={THINK} />
    </g>
  )
}

/* ───────── ねこ(5・6画目のあたり) ───────── */

function Cat({ t }: SceneProps) {
  const show = span(t, 0.6, 1.0, backOut)
  const awake = span(t, AHA + 0.2, AHA + 0.6)
  const breath = Math.sin(0)
  const sleep = wave(t, 1.8)
  const tail = wave(t, 1.4) * (3 + 9 * awake)
  return (
    <Layer scale={show} origin={[66, 95]}>
      {/* しっぽ(うしろ で くるん) */}
      <Layer rotate={tail} origin={[78, 91]}>
        <path d="M77 92.4 Q90 94 88.4 85.4 Q87.6 81.4 83.6 82.6" fill="none" stroke={CAT} strokeWidth="3.6" strokeLinecap="round" />
        <path d="M86.4 87 l1.6 -0.6 M87.2 83.6 l1.6 0.3" stroke={CAT_DARK} strokeWidth="1" strokeLinecap="round" />
      </Layer>
      {/* からだ: ねている あいだ いきに あわせて ふくらむ */}
      <Layer scaleY={1 + (sleep * 0.03 + breath) * (1 - awake)} origin={[66, 95]}>
        <ellipse cx="68" cy="88.6" rx="13.4" ry="7.4" fill={CAT} />
        <path d="M60 84 q3 4 0 8 M66 82.4 q3 5.4 0 11 M72 82.4 q3 5.4 0 11" fill="none" stroke={CAT_DARK} strokeWidth="1.1" strokeLinecap="round" />
        <ellipse cx="62.4" cy="94" rx="3.2" ry="2.1" fill={CAT_BELLY} />
        <ellipse cx="73.4" cy="94.2" rx="3.2" ry="2.1" fill={CAT_BELLY} />
      </Layer>
      {/* あたま: めざめると ぴょこんと もちあがる */}
      <Layer rotate={-8 * awake} y={-1.6 * awake} origin={[54, 94]}>
        <path d="M47.8 85.4 L47.2 79 L52.4 82.6 Z" fill={CAT} />
        <Layer rotate={wave(t, 1.1) * 6 * (1 - awake)} origin={[58, 83]}>
          <path d="M60 83 L61.6 76.8 L56 82 Z" fill={CAT} />
        </Layer>
        <circle cx="54" cy="88.4" r="6.2" fill={CAT} />
        <circle cx="49.6" cy="90.4" r="1.4" fill={CHEEK} opacity="0.5" />
        <circle cx="58.4" cy="90.4" r="1.4" fill={CHEEK} opacity="0.5" />
        {awake < 0.5 ? (
          <path d="M49.8 88 q1.6 1.5 3.2 0 M55 88 q1.6 1.5 3.2 0" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
        ) : (
          <path d="M49.8 88.6 q1.6 -2 3.2 0 M55 88.6 q1.6 -2 3.2 0" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
        )}
        <path d="M53 90 l1.6 0 l-0.8 1 Z" fill="#e8534a" />
        <path d="M54 91 q-1.4 1.6 -2.6 0.4 M54 91 q1.4 1.6 2.6 0.4" fill="none" stroke={MOUTH} strokeWidth="0.7" strokeLinecap="round" />
      </Layer>
    </Layer>
  )
}

/** ねこ の「ぐう」。ねている あいだ だけ */
function Zzz({ t }: SceneProps) {
  const show = during(t, 1.2, AHA + 0.2, 0.3)
  if (show <= 0) return null
  const p = (t % 2.2) / 2.2
  return (
    <g opacity={show * Math.sin(p * Math.PI)} fill="#5f7fd6" fontWeight="700" fontFamily="inherit">
      <text x={48 - p * 5} y={78 - p * 7} fontSize={3.8 + p * 2}>
        z
      </text>
    </g>
  )
}

/* ───────── ぜんたい ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  // おとしより: つくえ の むこうから ぽん と かおを出す
  const pop = span(t, POP, POP + 0.65, backOut)
  const mood: Mood = t < THINK_AT ? 'puzzled' : t < AHA ? 'think' : 'aha'

  // くびの かたむき: なやむ(かしげる)→ かんがえる(ゆっくり ゆれる)→ ひらめき(ぴょん と もどる)
  const puzzleTilt = mix(t, PUZZLE, PUZZLE + 0.6, 0, 6)
  const thinkTilt = mix(t, THINK_AT, THINK_AT + 0.8, 0, -9) + wave(t, 2.4) * 1.2 * span(t, THINK_AT + 0.8, THINK_AT + 1.2)
  const ahaNod = Math.sin(span(t, AHA, AHA + 0.5) * Math.PI) * -4
  const tilt = (t < THINK_AT ? puzzleTilt : puzzleTilt + thinkTilt) * (1 - span(t, AHA, AHA + 0.4)) + ahaNod

  // 手: おく → ひげ を なでる → りょうてを あげる(ひらめき)
  const toBeard = span(t, THINK_AT - 0.3, THINK_AT + 0.3, easeInOut)
  const stroke = wave(t, 1.0) * 1.3 * span(t, THINK_AT + 0.3, THINK_AT + 0.6) * (1 - span(t, AHA - 0.2, AHA))
  const leftBase = lerpPt(REST_L, [BEARD[0], BEARD[1] + stroke], toBeard)
  const up = span(t, AHA, AHA + 0.5, backOut)
  const handL = lerpPt(leftBase, UP_L, up)
  // みぎ手: かんがえる あいだ、ゆびで とんとん
  const tap = t > THINK_AT && t < AHA ? Math.max(0, wave(t, 0.5)) * 0.9 : 0
  const handR = lerpPt([REST_R[0], REST_R[1] - tap], UP_R, up)

  const breath = wave(t, 2.2)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer opacity={span(t, POP, POP + 0.25)} scale={pop * BIG} origin={[54, 40]}>
          <Elder mood={mood} handL={handL} handR={handR} tilt={tilt} breath={breath} />
        </Layer>
        <Desk t={t} />
        <Cane t={t} />
        <Tea t={t} />
        <Layer opacity={span(t, POP, POP + 0.25)} scale={pop * BIG} origin={[54, 40]}>
          <Hand at={handL} />
          <Hand at={handR} />
        </Layer>
        <Cat t={t} />
        <Zzz t={t} />
        <Question t={t} />
        <Thoughts t={t} />
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
    { at: 0, label: 'つくえ が でてくる', sound: 'pop' },
    { at: POP, label: 'つえを ついた おとしより が かおを出す', sound: 'pop' },
    { at: PUZZLE, label: 'なやみごと。「?」で くびを かしげる' },
    { at: THINK_AT, label: 'ひげを なでて、じっくり かんがえる' },
    { at: AHA, label: 'ひらめいた! りょうてを あげて にっこり', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '考 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
