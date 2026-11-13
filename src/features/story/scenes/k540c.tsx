/*
 * 同(おなじ): ふとさが ぴったり おなじ つつ に、カバーが ぴたっと かさなる。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)   … カバー(上から かぶせる つつ)の 左の かべ
 *   2画目(𠃍)   … カバーの てっぺん と 右の かべ
 *   3画目(一)   … ぴったり の つつ の もちて(ひもの よこぼう)
 *   4〜6画目(口) … ぴったり の つつ の「のぞき まど」(まわりの わく)
 *
 * ながれ
 *   女の子が ひもを もって やってくる(ひもを ひくと カバーが あがり、はなすと おりる)
 *   → ほそい つつ に カバーを おろす → すかすか(がたがた)。女の子は「あれ?」
 *   → ふとい つつ に かえる → カバーが つつの上に ごつん と のって おりない。女の子は びっくり、しょんぼり
 *   → ちょうど いい ふとさの つつ に かえて おろす → ぴたっ! 女の子は 大よろこび(ばんざい)
 *   → ほね が ひかって、絵が うすくなり、字「同」が のこる
 *
 * 人・つつ・カバーは、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   女の子の うで は かた から出て ひじ で まがる(ひもを にぎる・ばんざい は ひじ の まがりで作る)。
 *   くび は みじかく、どう の まんなか の上。カバーは そこ が ひらいていて、上から すとんと かぶさる。
 *   カバーは すきとおった オレンジ色にして、中の つつ が見えるようにした(すきま が わかるように)。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '同'

const SUN = '#ffd24a'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const HILL = '#e2f2d2'
const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#ec6b86'
const TUNIC_DARK = '#d4506c'
const PANTS = '#4a5f8a'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const MOUTH = '#b9483f'
const TEAR = '#7cc4f2'
const SLEEVE = '#ef8a4c'
const SLEEVE_DARK = '#d36d34'
const SLEEVE_LIGHT = '#ffb98a'
const SLEEVE_GLASS = '#ffc9a0'
const ROPE = '#a9825a'
const BARK = '#8c5b3c'
const WINDOW_RIM = '#f6f0dc'
const WINDOW_DARK = '#34506b'
const ALERT = '#ff6b6b'

/** くぎり の時間(秒) */
const LAND_THIN = 2.0
const LAND_FAT = 4.35
const LAND_FIT = 7.3
const CHEER = 7.4
const INK = 8.0
const DONE = 10.8
const DURATION = 11.4

/** カバーの かたち(1・2画目の位置)。かべ の まんなか の線 */
const WALL_L = 22.4
const WALL_R = 88.4
const TOP_Y = 16.6
const FLOOR = 95.4
const WALL_W = 6
/** カバーの まんなか(つつは ここに ならぶ) */
const MID_X = (WALL_L + WALL_R) / 2
/** カバーの 中の よこはば(かべの うちがわ どうし) */
const INNER_L = WALL_L + WALL_W / 2
const INNER_R = WALL_R - WALL_W / 2
/** カバーを 上げきった ときの もちあげ(わく の外へ きえる) */
const UP = 100
/** ふとい つつ の上に カバーが のって とまる もちあげ(つつの たかさ) */
const FAT_STOP = 43.2

type Vec = readonly [number, number]

/** カバーの うごき: おろす・あげる の くり返し。[はじまり, おわり, はじめの高さ, おわりの高さ, かんきゅう] */
type Move = readonly [from: number, to: number, a: number, b: number, ease: (x: number) => number]
const SLEEVE_MOVES: readonly Move[] = [
  [1.1, 2.0, UP, 0, easeIn],
  [2.5, 3.1, 0, UP, easeInOut],
  [3.75, LAND_FAT, UP, FAT_STOP, easeIn],
  [5.2, 5.8, FAT_STOP, UP, easeInOut],
  [6.5, LAND_FIT, UP, 0, easeInOut],
]

/** おちて ぶつかった ときの はねかえり(うえへ ぽん と はねて おさまる) */
function bounce(t: number, landAt: number, height: number): number {
  const u = t - landAt
  if (u <= 0 || u >= 0.4) return 0
  return Math.abs(Math.sin((u * Math.PI) / 0.2)) * height * (1 - u / 0.4)
}

function sleeveLift(t: number): number {
  const base = SLEEVE_MOVES.reduce((value, [from, to, a, b, ease]) => (t >= from ? mix(t, from, to, a, b, ease) : value), UP)
  return Math.min(UP, base + bounce(t, LAND_THIN, 4) + bounce(t, LAND_FAT, 5))
}

/* ───────── ばしょ ───────── */

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
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 94 V101 H-4 Z" fill={HILL} />
      {/* ゆっくり ながれる 雲 */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="-2" cy="9" rx="7" ry="3" />
        <ellipse cx="3" cy="7.4" rx="5" ry="3" />
        <ellipse cx="96" cy="8" rx="6" ry="2.6" />
        <ellipse cx="100.5" cy="6.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 14, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── つつ ───────── */

type PipeSpec = {
  readonly x0: number
  readonly x1: number
  readonly top: number
  readonly body: string
  readonly light: string
}

/** ほそい つつ(すかすか)・ふとい つつ(はいらない)・ちょうど いい つつ(ぴったり) */
const THIN: PipeSpec = { x0: 41.2, x1: 69.2, top: 36, body: '#ffd24a', light: '#ffe58a' }
const FAT: PipeSpec = { x0: 20.4, x1: 90.4, top: 52, body: '#a58be8', light: '#c6b5f5' }
const FIT: PipeSpec = { x0: INNER_L + 1, x1: INNER_R - 1, top: 21, body: '#7ed08a', light: '#a8e6b0' }

const PIPE_BOTTOM = 95.2

/** つつ 1本。もちて(一)と のぞき まど(口)が ついている。 */
function Pipe({ spec }: { readonly spec: PipeSpec }) {
  const { x0, x1, top, body, light } = spec
  const w = x1 - x0
  const cx = (x0 + x1) / 2
  const handleHalf = w * 0.31
  const winHalf = w * 0.27
  // ひくい つつ(ふとい つつ)は、もちて・まど を 上に よせる
  const squat = PIPE_BOTTOM - top < 60
  const winTop = top + (squat ? 12 : 26)
  const handleY = top + (squat ? 4 : 10.4)
  return (
    <>
      <rect x={x0} y={top} width={w} height={PIPE_BOTTOM - top} rx="4" fill={body} />
      <rect x={x0 + 2.6} y={top + 3} width="3.2" height={PIPE_BOTTOM - top - 9} rx="1.6" fill={light} />
      {/* もちて(3画目): ひもを とおす よこぼう */}
      <rect x={cx - handleHalf} y={handleY} width={handleHalf * 2} height="3.2" rx="1.6" fill={BARK} />
      {/* のぞき まど(4〜6画目): わく と くらい 中 */}
      <rect x={cx - winHalf} y={winTop} width={winHalf * 2} height="23" rx="2.2" fill={WINDOW_RIM} />
      <rect x={cx - winHalf + 2.2} y={winTop + 2.2} width={Math.max(winHalf * 2 - 4.4, 1)} height="18.6" rx="1.2" fill={WINDOW_DARK} />
      <path d={`M${cx - winHalf + 3.8} ${winTop + 5.2} l${Math.min(winHalf, 4)} 0`} stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

/** つつ が ぽん と でて、ぽん と きえる(あしもとを じく に) */
function PipeSlot({ t, spec, from, until }: { readonly t: number; readonly spec: PipeSpec; readonly from: number; readonly until: number }) {
  const pop = span(t, from, from + 0.5, backOut) * (1 - span(t, until, until + 0.3, easeIn))
  if (pop <= 0) return null
  return (
    <Layer scale={pop} origin={[MID_X, PIPE_BOTTOM]}>
      <ellipse cx={MID_X} cy="97.4" rx={(spec.x1 - spec.x0) / 2 + 3} ry="2.4" fill="#000000" opacity="0.1" />
      <Pipe spec={spec} />
    </Layer>
  )
}

/* ───────── カバー ───────── */

/** すきとおった カバー。上は ふさがり、したは ひらいている。ひもを むすぶ わっか つき。 */
function Sleeve({ lift, squash }: { readonly lift: number; readonly squash: number }) {
  const r = 6
  const outline = `M${WALL_L} ${FLOOR} V${TOP_Y + r} Q${WALL_L} ${TOP_Y} ${WALL_L + r} ${TOP_Y} H${WALL_R - r} Q${WALL_R} ${TOP_Y} ${WALL_R} ${TOP_Y + r} V${FLOOR}`
  return (
    <Layer y={-lift}>
      <Layer scaleY={squash} origin={[MID_X, FLOOR]}>
        <path d={`${outline} Z`} fill={SLEEVE_GLASS} fillOpacity="0.28" />
        <path d={outline} fill="none" stroke={SLEEVE} strokeWidth={WALL_W} strokeLinejoin="round" />
        <path d={`M${WALL_L + 1.6} ${FLOOR - 6} V${TOP_Y + r + 1} Q${WALL_L + 1.6} ${TOP_Y + 1.6} ${WALL_L + r + 1} ${TOP_Y + 1.6} H${WALL_R - r - 2}`} fill="none" stroke={SLEEVE_LIGHT} strokeWidth="1.4" strokeLinecap="round" />
        <rect x={WALL_L - 3.6} y={FLOOR - 3} width="7.2" height="3" rx="1.2" fill={SLEEVE_DARK} />
        <rect x={WALL_R - 3.6} y={FLOOR - 3} width="7.2" height="3" rx="1.2" fill={SLEEVE_DARK} />
        <ellipse cx={MID_X} cy={TOP_Y - 3.2} rx="3.4" ry="2.4" fill={SLEEVE_DARK} />
        {/* ひも: カバーの わっか から 上へ(わく の外の かっしゃ を とおって 女の子の手へ) */}
        <path d={`M${MID_X} ${TOP_Y - 5} V-140`} stroke={ROPE} strokeWidth="1.2" fill="none" />
      </Layer>
    </Layer>
  )
}

/* ───────── 女の子 ───────── */

type Mood = 'smile' | 'puzzled' | 'shock' | 'sad' | 'joy'

/** 女の子の まんなか(よこ) と、かた(うで の つけね)。くびは みじかく どう の まんなか の上 */
const KID_X = 99
const SHOULDER_L: Vec = [94.6, 69]
const SHOULDER_R: Vec = [103.4, 69]
/** うで の 1ほんの ながさ(かた→ひじ、ひじ→手) */
const ARM_PART = 7.6

const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const lerpVec = (a: Vec, b: Vec, k: number): Vec => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]

/** かた から 手の ばしょ まで、ひじ で まがる うで。ひじ は 体の そと がわ に ふくらむ。 */
function Arm({ shoulder, target, side }: { readonly shoulder: Vec; readonly target: Vec; readonly side: -1 | 1 }) {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.001)
  // とどかない ときは、のばせる ところまで
  const reach = Math.min(dist, ARM_PART * 2 - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const hand: Vec = [shoulder[0] + ux * reach, shoulder[1] + uy * reach]
  const half = Math.sqrt(ARM_PART ** 2 - (reach / 2) ** 2)
  const mid: Vec = [shoulder[0] + (ux * reach) / 2, shoulder[1] + (uy * reach) / 2]
  const a: Vec = [mid[0] - uy * half, mid[1] + ux * half]
  const b: Vec = [mid[0] + uy * half, mid[1] - ux * half]
  const elbow = side * (a[0] - KID_X) > side * (b[0] - KID_X) ? a : b
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="2.2" fill={SKIN} />
    </>
  )
}

function Face({ mood, t }: { readonly mood: Mood; readonly t: number }) {
  const eye = '#2b2b2b'
  const brow = { fill: 'none', stroke: HAIR, strokeWidth: 0.9, strokeLinecap: 'round' } as const
  return (
    <>
      <circle cx="94.8" cy="60.8" r="1.4" fill={CHEEK} opacity="0.55" />
      <circle cx="103.2" cy="60.8" r="1.4" fill={CHEEK} opacity="0.55" />
      {mood === 'joy' ? (
        <>
          <path d="M95.2 58.9 Q96.4 56.7 97.6 58.9 M100.4 58.9 Q101.6 56.7 102.8 58.9" {...brow} stroke={eye} strokeWidth="1.1" />
          <path d="M96.8 60.5 Q99 65 101.2 60.5 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx="96.4" cy="58.4" r={mood === 'shock' ? 1.35 : 0.95} fill={eye} />
          <circle cx="101.6" cy="58.4" r={mood === 'shock' ? 1.35 : 0.95} fill={eye} />
          {mood === 'smile' && <path d="M97.6 61.2 Q99 62.8 100.4 61.2" {...brow} stroke={MOUTH} strokeWidth="1" />}
          {mood === 'puzzled' && (
            <>
              <path d="M95 55.8 L97.6 55 M100.4 55.4 L103 56.3" {...brow} />
              <path d="M97.6 61.8 q0.8 -0.9 1.4 0 t1.4 0" {...brow} stroke={MOUTH} strokeWidth="1" />
              {/* ひたいの あせ */}
              <path d="M0 -2 Q1.6 0.4 0 1.6 Q-1.6 0.4 0 -2 Z" fill={TEAR} transform="translate(105 54.6)" />
            </>
          )}
          {mood === 'shock' && (
            <>
              <path d="M95 55 h2.6 M100.4 55 h2.6" {...brow} />
              <ellipse cx="99" cy="62" rx="1.2" ry="1.6" fill={MOUTH} />
            </>
          )}
          {mood === 'sad' && (
            <>
              <path d="M94.9 56.5 L97.5 55 M101.5 55 L104.1 56.5" {...brow} />
              <path d="M97.7 62.4 Q99 60.9 100.3 62.4" {...brow} stroke={MOUTH} strokeWidth="1" />
              {[0, 0.5].map((offset) => {
                const p = ((t * 1.6 + offset) % 1)
                return <ellipse key={offset} cx={offset === 0 ? 95.6 : 102.4} cy={60 + p * 5} rx="0.8" ry="1.1" fill={TEAR} opacity={1 - p} />
              })}
            </>
          )}
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly t: number
  readonly mood: Mood
  readonly handL: Vec
  readonly handR: Vec
  readonly step: number
  readonly tilt: number
}

function Kid({ t, mood, handL, handR, step, tilt }: KidProps) {
  return (
    <>
      {/* あし: あるくときは かわりばんこに ふる */}
      <Layer rotate={step * 14} origin={[96.8, 83]}>
        <rect x="95.1" y="82" width="3.4" height="13.2" rx="1.7" fill={PANTS} />
        <ellipse cx="96.6" cy="95.6" rx="3.2" ry="1.8" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 14} origin={[102.2, 83]}>
        <rect x="100.5" y="82" width="3.4" height="13.2" rx="1.7" fill={PANTS} />
        <ellipse cx="102.4" cy="95.6" rx="3.2" ry="1.8" fill={SHOE} />
      </Layer>
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="97.5" y="61.4" width="3" height="6" rx="1.2" fill={SKIN_SHADE} />
      <rect x="93.4" y="65.5" width="11.2" height="19" rx="5" fill={TUNIC} />
      <path d="M94.6 78.6 h8.8" stroke={TUNIC_DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Arm shoulder={SHOULDER_L} target={handL} side={-1} />
      <Arm shoulder={SHOULDER_R} target={handR} side={1} />
      {/* あたま: くびを じく に かたむく */}
      <Layer rotate={tilt} origin={[99, 63]}>
        <circle cx="92.8" cy="52.4" r="2.5" fill={HAIR} />
        <circle cx="105.2" cy="52.4" r="2.5" fill={HAIR} />
        <circle cx="99" cy="57.2" r="6.6" fill={SKIN} />
        <path d="M92.3 56.4 C92 49.4 106 49.4 105.7 56.4 C104 54 101.5 53 99 53.6 C96.5 53 94 54 92.3 56.4 Z" fill={HAIR} />
        <Face mood={mood} t={t} />
      </Layer>
    </>
  )
}

/* ───────── こまかい にぎやかし ───────── */

/** ほそい つつ の すきま を しらせる あかい おび と、がたがた の ゆれ */
function Gaps({ t }: SceneProps) {
  const show = during(t, LAND_THIN + 0.1, 3.0, 0.15) * (0.65 + 0.35 * wave(t, 0.4))
  if (show <= 0) return null
  return (
    <g fill={ALERT} opacity={show * 0.4}>
      <rect x={INNER_L} y={TOP_Y + 3} width={THIN.x0 - INNER_L} height={FLOOR - TOP_Y - 3} />
      <rect x={THIN.x1} y={TOP_Y + 3} width={INNER_R - THIN.x1} height={FLOOR - TOP_Y - 3} />
    </g>
  )
}

/** ごつん: カバーの かべ が ふとい つつ の上に あたって、ほしが とぶ。 */
function Bonk({ t }: SceneProps) {
  const p = span(t, LAND_FAT, LAND_FAT + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g opacity={1 - p}>
      <Star cx={WALL_L - 4 - p * 7} cy={FAT.top - 4 - p * 4} r={3.4} color="#ffc233" spin={p * 160} />
      <Star cx={WALL_R + 4 + p * 4} cy={FAT.top - 4 - p * 5} r={3} color="#ffd95a" spin={-p * 160} />
      <Star cx={MID_X} cy={FAT.top - 3 - p * 6} r={2.4} color="#ffffff" spin={p * 120} />
    </g>
  )
}

/** ぴたっ: ちょうど いい つつ に かぶさった しゅんかん の ひかり。 */
function Snug({ t }: SceneProps) {
  const show = during(t, LAND_FIT, LAND_FIT + 0.9, 0.12)
  if (show <= 0) return null
  const p = span(t, LAND_FIT, LAND_FIT + 0.9, easeOut)
  return (
    <g opacity={show}>
      <rect x={FIT.x0 - 0.8} y={FIT.top - 0.8} width={FIT.x1 - FIT.x0 + 1.6} height={PIPE_BOTTOM - FIT.top + 0.8} rx="4.4" fill="none" stroke="#fff6a8" strokeWidth="1.6" />
      <Star cx={INNER_L - 1 - p * 3} cy={36 - p * 6} r={3.2 * (1 - p * 0.3)} color="#ffc233" spin={p * 140} />
      <Star cx={INNER_R + 1 + p * 3} cy={36 - p * 6} r={3.2 * (1 - p * 0.3)} color="#ffd95a" spin={-p * 140} />
      <Star cx={MID_X} cy={TOP_Y - 3 - p * 6} r={2.6} color="#ffffff" spin={p * 100} />
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 6)

  const lift = sleeveLift(t)
  // おちて ぶつかる しゅんかん、少し ちぢむ
  const squash = 1 - Math.sin(span(t, LAND_FIT, LAND_FIT + 0.3) * Math.PI) * 0.012
  const rattle = wave(t, 0.16) * 3 * during(t, LAND_THIN + 0.05, 2.9, 0.1)
  const bonkShake = wave(t, 0.08) * 0.8 * during(t, LAND_FAT, LAND_FAT + 0.5, 0.05)

  // 女の子: 右から あるいてきて、ひもを にぎる
  const enter = mix(t, 0.15, 0.95, 22, 0, easeOut)
  const walking = 1 - span(t, 0.8, 0.95)
  const step = t < 0.15 ? 0 : Math.sin((t - 0.15) * Math.PI * 2 * 2.2) * walking
  const bob = -Math.abs(step) * 1.1

  const mood: Mood = t >= CHEER ? 'joy' : t >= 6.3 ? 'smile' : t >= 4.8 ? 'sad' : t >= LAND_FAT ? 'shock' : t >= 3.3 ? 'smile' : t >= LAND_THIN ? 'puzzled' : 'smile'

  // ひもを にぎる 高さ: カバーが あがるほど 手は 下がる
  const holdY = 64 + 8 * (lift / UP)
  const grip = span(t, 0.7, 1.1)
  const cheer = span(t, CHEER, CHEER + 0.45, backOut)
  const hangL: Vec = [SHOULDER_L[0] - 1, SHOULDER_L[1] + 14.8]
  const hangR: Vec = [SHOULDER_R[0] + 1, SHOULDER_R[1] + 14.8]
  const handL = lerpVec(lerpVec(hangL, [KID_X - 0.9, holdY], grip), [90.4, 55.6], cheer)
  const handR = lerpVec(lerpVec(hangR, [KID_X + 0.9, holdY], grip), [107.6, 55.6], cheer)
  const hop = t >= CHEER ? -Math.abs(wave(t - CHEER, 0.7)) * 1.8 : 0
  const droop = mood === 'sad' ? 1 : 0
  const tilt = mood === 'puzzled' ? 8 : mood === 'sad' ? -7 : mood === 'joy' ? 3 * wave(t, 0.7) : 0
  const ropeEnd = holdY + cheer * 20

  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Layer rotate={rattle} origin={[MID_X, PIPE_BOTTOM]}>
          <PipeSlot t={t} spec={THIN} from={0.5} until={3.05} />
        </Layer>
        <PipeSlot t={t} spec={FAT} from={3.35} until={5.75} />
        <PipeSlot t={t} spec={FIT} from={6.05} until={99} />
        <Gaps t={t} />
        <Layer x={bonkShake}>
          <Sleeve lift={lift} squash={squash} />
        </Layer>
        <Snug t={t} />
        <Bonk t={t} />
        {/* 女の子の ひも(わく の外の かっしゃ から おりてくる) */}
        <path d={`M${KID_X} -140 V${ropeEnd}`} stroke={ROPE} strokeWidth="1.2" fill="none" />
        <ellipse cx={KID_X + enter} cy="97.4" rx="8" ry="2.2" fill="#000000" opacity="0.12" />
        <Layer x={enter} y={bob + hop + droop * 0.8} origin={[KID_X, 95]}>
          <Kid t={t} mood={mood} handL={handL} handR={handR} step={step} tilt={tilt} />
        </Layer>
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
    { at: 0, label: '女の子が ひもを もちに くる', sound: 'pop' },
    { at: 1.1, label: 'ほそい つつ に カバーを おろす' },
    { at: LAND_THIN, label: 'すかすか。ぴったり じゃなくて「あれ?」' },
    { at: 3.75, label: 'ふとい つつ に かえて おろす', sound: 'pop' },
    { at: LAND_FAT, label: 'ごつん! はいらなくて しょんぼり' },
    { at: 6.5, label: 'ちょうど いい ふとさの つつ に おろす' },
    { at: LAND_FIT, label: 'ぴたっ! 大よろこび', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '同 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
