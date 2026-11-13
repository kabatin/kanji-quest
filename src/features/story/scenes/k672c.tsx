/*
 * 本(ほん): 木の ねもとに、しるしを 1本。
 *
 * ほね(画と絵の対応)
 *   1画目(一)  … 木の 大きな よこえだ(葉が しげる)
 *   2画目(丨)  … 木の みき(下の はしが ねもと)
 *   3・4画目   … みき から 左右に たれさがる えだ
 *   5画目(一)  … ねもとに 子どもが むすんだ 赤い リボン(しるし)。みき に まいて、左右に はしが のびる
 *
 * ながれ
 *   木が そだつ → 赤いリボンを もった 子どもが あるいてくる(どこに しるしを つけよう?)
 *   → 木を見上げて「?」 → 下の ねもとを見て「!」(ここだ)
 *   → ねもとに リボンを むすぶ → 一歩 さがって、はしが ぴょんと のびた リボンを見て 大よろこび
 *   → ほね が ひかって、絵が うすくなり、字「本」が のこる
 *
 * 子どもは、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる(ひじ は うしろへ)。くび は みじかく、どう の まんなか の上。
 *   リボンは ねもとの 高さ(こしの あたり)に むすぶので、手を 少し のばして とどく。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '本'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHIRT = '#f4c542'
const SHIRT_DARK = '#dba92c'
const SHIRT_FAR = '#c1912a'
const SHORTS = '#3e5c86'
const SHORTS_DARK = '#34507a'
const SHOE = '#6b4a36'
const BARK = '#8c5b3c'
const BARK_DARK = '#70452b'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const LEAF_LIGHT = '#8bd69a'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'
const RIBBON = '#e8534a'
const RIBBON_DARK = '#c13d36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'

/** くぎり の時間(秒) */
const WALK = 1.0
const STOP = 2.6
/** 「!」と ひらめく */
const IDEA = 3.4
/** ねもとに リボンを むすぶ */
const TIE = 3.9
/** 一歩 さがる */
const BACK = 4.6
const BACK_TIME = 0.9
/** リボンの はしが ぴょんと のびる */
const POP = BACK + 0.6
/** 大よろこび */
const CHEER = 5.5
const INK = 6.9
const DONE = 9.3
const DURATION = 9.9

/** 子どもの 足もとの 高さ(地面) */
const FEET_Y = 95.5
/** 子どもが リボンを むすぶ とき の 立ち位置(みき の すぐ 左) */
const TIE_X = 36
/** 子どもの かた(足もとが 0,0 の ざひょう)と、うで 1本ぶん の長さ */
const SHOULDER: readonly [number, number] = [0, -34]
const ARM_PART = 10.5
/** 5画目の リボンの うち、みき に まかれた 部分(画の長さを 1 としたとき) */
const BAND: readonly [number, number] = [0.37, 0.66]

type Point = readonly [number, number]
const lerp = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[13, 13]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="12.2" y="1.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 13 13)`} />
        ))}
      </Layer>
      <circle cx="13" cy="13" r={6.2 * sun} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="-2" cy="50" rx="7" ry="3.2" />
        <ellipse cx="3" cy="48" rx="5" ry="3.2" />
        <ellipse cx="92" cy="9" rx="6" ry="2.6" />
        <ellipse cx="96.5" cy="7.6" rx="4.4" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 葉の ふさ。大きい円を 3つ かさねて、あかるい 円を 1つ のせる */
function Clump({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={LEAF_DARK} />
      <circle cx={cx - r * 0.18} cy={cy - r * 0.2} r={r * 0.78} fill={LEAF} />
      <circle cx={cx - r * 0.32} cy={cy - r * 0.38} r={r * 0.3} fill={LEAF_LIGHT} />
    </>
  )
}

function Tree({ t }: SceneProps) {
  // みき が下から のびて、えだ が ひろがり、さいごに 葉が ぽん と しげる
  const trunk = span(t, 0, 0.55, backOut)
  const boughs = span(t, 0.3, 0.8, backOut)
  const leaves = span(t, 0.55, 1.05, backOut)
  const sway = wave(t, 3.4) * 1.2
  return (
    <>
      <ellipse cx="54" cy="97.6" rx={18 * trunk} ry="3" fill="#000000" opacity="0.1" />
      <Layer scaleX={0.6 + 0.4 * trunk} scaleY={trunk} origin={[54, 97]}>
        {/* ねもとの ふくらみ(ここが「本」のしるしの 場所) */}
        <path d="M44.5 98 Q50.5 92 49.6 84 L58.6 84 Q58 92 64 98 Z" fill={BARK} />
        <Bone char={CHAR} n={2} color={BARK} width={9.5} />
        <path d="M52.4 46 q1.6 5 0 10 M56 86 q-1.4 4 0.2 8" fill="none" stroke={BARK_DARK} strokeWidth="1.3" strokeLinecap="round" />
      </Layer>
      <Layer scale={boughs} origin={[54, 34]}>
        <Bone char={CHAR} n={1} color={BARK} width={6.2} />
        <Bone char={CHAR} n={3} color={BARK} width={5.4} />
        <Bone char={CHAR} n={4} color={BARK} width={5.4} />
      </Layer>
      {/* えだの先の しげみ(たれた えだ の さき と、よこえだ の はし) */}
      <Layer scale={leaves} origin={[54, 34]} rotate={sway * 0.6}>
        <Clump cx={14.5} cy={73} r={6.4} />
        <Clump cx={96} cy={70.5} r={6.4} />
        <Clump cx={21} cy={31} r={5.6} />
        <Clump cx={88.5} cy={29.5} r={5.8} />
        <Clump cx={32.5} cy={58} r={4} />
        <Clump cx={80} cy={59} r={4} />
      </Layer>
      {/* 上の しげみ: 風で ゆっくり ゆれる */}
      <Layer scale={leaves} rotate={sway} origin={[54, 34]}>
        <Clump cx={39} cy={18} r={11.5} />
        <Clump cx={69} cy={18} r={11.5} />
        <Clump cx={54} cy={13} r={13.5} />
        <circle cx="46" cy="25" r="2.2" fill="#e8534a" />
        <circle cx="64" cy="24.5" r="2.2" fill="#e8534a" />
      </Layer>
    </>
  )
}

type Mood = 'puzzled' | 'idea' | 'happy'

/**
 * かた から ひじ を通って 手 まで。手の ばしょ(target)から、ひじ の位置を 計算する。
 * ひじ は、いつも うしろ・下がわ に まがる(ほんものの 人の ひじ)。
 */
function solveArm(target: Point): { readonly elbow: Point; readonly hand: Point } {
  const [sx, sy] = SHOULDER
  const dx = target[0] - sx
  const dy = target[1] - sy
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const bend = Math.sqrt(ARM_PART ** 2 - (reach / 2) ** 2)
  return {
    elbow: [sx + (ux * reach) / 2 - uy * bend, sy + (uy * reach) / 2 + ux * bend],
    hand: [sx + ux * reach, sy + uy * reach],
  }
}

function Arm({ target, color, ribbon = 0 }: { readonly target: Point; readonly color: string; readonly ribbon?: number }) {
  const { elbow, hand } = solveArm(target)
  return (
    <>
      <path d={`M${SHOULDER[0]} ${SHOULDER[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={color} strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.9" fill={SKIN} />
      {/* もっている リボン: 手から 下へ たれる */}
      {ribbon > 0 ? (
        <path d={`M${hand[0]} ${hand[1]} q${1.6 + ribbon * 2} 4 ${-1 + ribbon} 8 q${-1.6} 2.4 ${0.6} 4.4`} fill="none" stroke={RIBBON} strokeWidth="2.2" strokeLinecap="round" />
      ) : null}
    </>
  )
}

type ChildProps = {
  readonly step: number
  readonly mood: Mood
  readonly nearHand: Point
  readonly farHand: Point
  readonly headTilt: number
  readonly ribbon: number
}

/** 子ども(右むき)。足もとが (0,0)。せい は 56 ほど。 */
function Child({ step, mood, nearHand, farHand, headTilt, ribbon }: ChildProps) {
  return (
    <>
      <Arm target={farHand} color={SHIRT_FAR} />
      {/* うしろの足・まえの足(あるくとき、かわりばんこに ふる) */}
      <Layer rotate={step * 20} origin={[0, -17]}>
        <rect x="-2.3" y="-9" width="4.6" height="8" rx="2.2" fill={SKIN_SHADE} />
        <rect x="-2.5" y="-17.5" width="5" height="10" rx="2.4" fill={SHORTS_DARK} />
        <ellipse cx="1.2" cy="-0.9" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 20} origin={[0, -17]}>
        <rect x="-2.3" y="-9" width="4.6" height="8" rx="2.2" fill={SKIN} />
        <rect x="-2.5" y="-17.5" width="5" height="10" rx="2.4" fill={SHORTS} />
        <ellipse cx="1.2" cy="-0.9" rx="4" ry="2.2" fill={SHOE} />
      </Layer>
      {/* くび: どう と あたま の間を みじかく つなぐ */}
      <rect x="-1.8" y="-41" width="3.6" height="6" rx="1.6" fill={SKIN_SHADE} />
      {/* どう */}
      <rect x="-5.6" y="-38" width="11.2" height="22" rx="5.4" fill={SHIRT} />
      <path d="M-4 -22 h8" stroke={SHIRT_DARK} strokeWidth="1.3" strokeLinecap="round" />
      <Arm target={nearHand} color={SHIRT_DARK} ribbon={ribbon} />
      {/* あたま: くび の上で うなずく・見上げる */}
      <Layer rotate={headTilt} origin={[0, -39]}>
        <circle cx="0.8" cy="-47.5" r="8.2" fill={SKIN} />
        <path d="M-7.8 -46 C-9.5 -58.5 6 -60 9 -51.5 C6 -53.4 1.5 -53.6 -1.6 -52 C-4.6 -50.6 -6.6 -48.6 -7.8 -46 Z" fill={HAIR} />
        <path d="M-1.4 -55.4 Q-2 -59.6 0.8 -57.8 Q2 -60.6 3.6 -56.4" fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="1.4" cy="-43.4" r="1.9" fill="#ff9d9d" opacity="0.55" />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** 顔: 点の目・小さな口。きもち で かえる */
function Face({ mood }: { readonly mood: Mood }) {
  if (mood === 'happy') {
    return (
      <>
        <path d="M2.2 -47 Q3.8 -49.4 5.4 -47" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M2.4 -43.6 Q4.4 -40.4 6.4 -43.8 Z" fill={MOUTH} />
      </>
    )
  }
  if (mood === 'idea') {
    return (
      <>
        <circle cx="4" cy="-47.5" r="1.6" fill={EYE} />
        <circle cx="4.5" cy="-48" r="0.5" fill="#ffffff" />
        <path d="M2.8 -43.6 Q4.2 -41.4 5.8 -43.6 Z" fill={MOUTH} />
      </>
    )
  }
  return (
    <>
      <path d="M2.2 -50.6 l3.8 0.9" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="4" cy="-47.6" r="1.25" fill={EYE} />
      <ellipse cx="4.4" cy="-43.2" rx="0.9" ry="1.1" fill={MOUTH} />
    </>
  )
}

/** あたまの上の ふきだし。「?」(どこに つけよう)と「!」(ここだ) */
function Thought({ t, x, y }: SceneProps & { readonly x: number; readonly y: number }) {
  const ask = during(t, STOP + 0.2, IDEA, 0.2)
  const idea = during(t, IDEA, TIE - 0.05, 0.15)
  const bob = wave(t, 0.9) * 0.8
  return (
    <>
      {ask > 0 ? (
        <Layer x={x + 9} y={y - 68 + bob} scale={0.6 + 0.4 * ask} opacity={ask}>
          <circle r="5.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.8" />
          <path d="M-2.4 -2.4 Q-2.4 -4.6 0 -4.6 Q2.4 -4.6 2.4 -2.6 Q2.4 -1 0 -0.2 L0 1" fill="none" stroke="#5f7fd6" strokeWidth="1.3" strokeLinecap="round" />
          <circle cx="0" cy="3" r="0.9" fill="#5f7fd6" />
        </Layer>
      ) : null}
      {idea > 0 ? (
        <Layer x={x + 9} y={y - 68 + bob} scale={0.6 + 0.4 * idea} opacity={idea}>
          <circle r="5.6" fill="#fff6c8" stroke="#f0c040" strokeWidth="0.9" />
          <path d="M0 -3.6 L0 0.8" stroke="#e8902a" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="0" cy="3" r="1" fill="#e8902a" />
        </Layer>
      ) : null}
    </>
  )
}

/** ねもとに むすばれた リボン: まず みき に まかれ、あとから はしが ぴょんと のびる */
function RibbonMark({ t }: SceneProps) {
  const band = span(t, TIE + 0.1, TIE + 0.35)
  if (band <= 0) return null
  const knot = span(t, TIE + 0.35, TIE + 0.65, backOut)
  const pop = span(t, POP, POP + 0.6, backOut)
  const from = BAND[0] * (1 - pop)
  const to = BAND[1] + (1 - BAND[1]) * pop
  const flutter = wave(t, 1.3) * 2.2 * pop
  return (
    <Layer rotate={flutter} origin={[55, 72.5]} opacity={band}>
      <Bone char={CHAR} n={5} color={RIBBON} width={3.3} from={from} to={to} />
      <Layer scale={knot} origin={[55.2, 72.2]}>
        <ellipse cx="52.4" cy="70.4" rx="2.8" ry="1.6" transform="rotate(-25 52.4 70.4)" fill={RIBBON} />
        <ellipse cx="58" cy="70.2" rx="2.8" ry="1.6" transform="rotate(25 58 70.2)" fill={RIBBON} />
        <circle cx="55.2" cy="72" r="2.1" fill={RIBBON_DARK} />
      </Layer>
    </Layer>
  )
}

/** しるしが ついた ときの きらきら */
function Cheer({ t }: SceneProps) {
  const show = during(t, POP + 0.1, POP + 1.0, 0.25)
  if (show <= 0) return null
  const grow = span(t, POP + 0.1, POP + 0.6, backOut)
  return (
    <g opacity={show}>
      <Star cx={39} cy={67} r={3 * grow} color="#ffd24a" spin={t * 60} />
      <Star cx={70} cy={66.5} r={3.4 * grow} color="#ffffff" spin={-t * 60} />
      <Star cx={55} cy={62} r={2.4 * grow} color="#ffd24a" spin={t * 80} />
    </g>
  )
}

/** 小鳥が とんできて、よこえだ に とまる */
function Bird({ t }: SceneProps) {
  const arrive = span(t, 2.0, 2.9, easeOut)
  if (arrive <= 0) return null
  const x = 118 - arrive * 38
  const y = 6 + arrive * 19.5 - Math.sin(arrive * Math.PI) * 9
  const landed = arrive >= 1
  const hop = landed ? Math.abs(wave(t, 0.8)) * 0.9 : 0
  const flap = landed ? 0 : wave(t, 0.16) * 28
  return (
    <Layer x={x} y={y - hop}>
      <path d="M2.6 0.4 l4.6 -1.6 l-3.4 3.2 Z" fill="#3f7fc4" />
      <ellipse cx="0" cy="0" rx="4" ry="3.1" fill="#6fb3f0" />
      <circle cx="-3" cy="-2.3" r="2.3" fill="#6fb3f0" />
      <path d="M-5 -2.4 l-2.4 0.7 l2.3 0.9 Z" fill="#f2b632" />
      <circle cx="-3.6" cy="-2.8" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.6]}>
        <path d="M-1.2 -0.8 Q1.6 -3.8 4 -0.6 Q1.6 0.8 -1.2 -0.8 Z" fill="#3f7fc4" />
      </Layer>
    </Layer>
  )
}

/** 葉が1まい ひらひら おちてくる(木の 右がわ) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 3.0, INK - 0.1)
  if (p <= 0) return null
  const x = 80 + Math.sin(p * 9) * 5
  const y = 30 + p * 64
  return <path d="M0 -3.4 Q3 0 0 3.4 Q-3 0 0 -3.4 Z" fill={LEAF_LIGHT} stroke={LEAF_DARK} strokeWidth="0.5" transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 50 + 20})`} />
}

/** あるく足の ふり。1.8回/秒。あるいてくる間 と、一歩さがる間 だけ */
function strideAt(t: number): number {
  if (t >= WALK && t < STOP) return Math.sin((t - WALK) * Math.PI * 2 * 1.8) * (1 - span(t, STOP - 0.3, STOP))
  const backEnd = BACK + BACK_TIME
  if (t >= BACK && t < backEnd) return -Math.sin((t - BACK) * Math.PI * 2 * 1.8) * 0.6 * (1 - span(t, backEnd - 0.25, backEnd))
  return 0
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 5)

  const stride = strideAt(t)
  // 左から あるいてきて みき の左に とまり、ぜんぶ むすんだら 一歩 さがる
  const childX = mix(t, WALK, STOP, -24, TIE_X, easeOut) + mix(t, BACK, BACK + BACK_TIME, 0, -13)
  // よろこびの ジャンプ(2回)
  const hop = Math.abs(Math.sin(span(t, CHEER, CHEER + 1.2) * Math.PI * 2)) * 7
  const childY = FEET_Y - Math.abs(stride) * 1.2 - hop

  // きもち: さがしている → ひらめく → よろこぶ
  const mood: Mood = t < IDEA ? 'puzzled' : t < BACK ? 'idea' : 'happy'
  // 木を見上げ、つぎに ねもとを 見おろし、さいごは 少し あおむいて よろこぶ
  const headTilt = mix(t, STOP, STOP + 0.4, 0, -16) + mix(t, IDEA, IDEA + 0.3, 0, 22) + mix(t, CHEER, CHEER + 0.3, 0, -10)

  // うで: あるくときは ふる。リボンを むすぶ とき は ねもとへ。よろこぶ とき は 上へ
  const carry: Point = [4 + stride * 6, -17]
  const wiggle = t >= TIE && t < BACK ? Math.sin((t - TIE) * 28) * 1.1 : 0
  const reach: Point = [13, -22.5 + wiggle]
  const reachAmt = span(t, IDEA + 0.2, TIE, easeInOut) * (1 - span(t, BACK, BACK + 0.3))
  const hang: Point = [1, -15.5]
  const cheerAmt = span(t, CHEER - 0.1, CHEER + 0.2) * (1 - span(t, CHEER + 1.0, CHEER + 1.3))
  const afterAmt = span(t, BACK, BACK + 0.3)
  const nearHand = lerp(lerp(lerp(carry, reach, reachAmt), hang, afterAmt), [17, -47], cheerAmt)
  const farHand = lerp(t < STOP ? [-stride * 7, -16.5] : [-1, -15.5], [14, -41], cheerAmt)
  const holding = t < TIE + 0.1 ? 1 : 0

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Tree t={t} />
        <RibbonMark t={t} />
        <ellipse cx={childX} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
        <Layer x={childX} y={childY}>
          <Child step={stride} mood={mood} nearHand={nearHand} farHand={farHand} headTilt={headTilt} ribbon={holding} />
        </Layer>
        <Thought t={t} x={childX} y={FEET_Y} />
        <Cheer t={t} />
        <Bird t={t} />
        <FallingLeaf t={t} />
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
    { at: 0, label: '木が そだつ', sound: 'pop' },
    { at: WALK, label: 'リボンを もった 子どもが あるいてくる' },
    { at: STOP, label: '木を見上げて「どこに しるしを つけよう?」' },
    { at: IDEA, label: 'ねもとを 見て「ここだ!」', sound: 'pop' },
    { at: TIE, label: 'ねもとに リボンを むすぶ' },
    { at: POP, label: 'しるしが ついて 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '本 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
