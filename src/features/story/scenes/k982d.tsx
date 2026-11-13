/*
 * 頭(あたま): あたまの おおきな 子に、まめが ぽーん と あたる。
 *
 * ほね(画と絵の対応)
 *   左がわ「豆」(音の パーツ)… 高坏(たかつき)という 足の ついた まめ入れ
 *     1画目(一)    … ふた(まめが ふくらんで、ふたを もちあげている)
 *     2・3・4画目  … まめ入れの うつわ(2=左の ふち / 3=ふち と 右がわ / 4=そこ)
 *     5・6画目     … うつわの 下の 足(すぼまった 台)
 *     7画目        … まめ入れの うしろに ある 丘の すじ
 *   右がわ「頁」(あたま)… 頭の おおきな 子(あたまが からだより ずっと 大きい)
 *     8画目(一)    … おかっぱの かみの てっぺん
 *     9画目(丿)    … かみの ひとふさ(つやの すじ)
 *     10・11画目   … あたまの 左と右の ふち(11は かみの つやも)
 *     12画目       … まえがみの すそ(おでこの した)
 *     13画目       … 目の 高さ
 *     14画目       … ほっぺ から あご
 *     15・16画目   … ばんざい で ひらいた 左右の あし
 *
 * ながれ
 *   丘の上に まめ入れが ぽん と 立ち、あたまの 大きな 子が ぴょんぴょん やってくる
 *   → まめ入れが ほかほか。まめが ふくらんで、ふたが もちあがり、ぽん ぽん とびだす。子は ふしぎそうに 見る
 *   → 1つの まめが 大きな 山なりに とんできて、子の あたまに こつん! 「いたっ」(たんこぶ・ほしが くるくる)
 *   → 足もとに ころがった まめを 見て「なんだ まめか」→ にっこり。うれしくて ぴょーんと とびあがり、
 *     手と足を ひろげて ばんざい → ほね が ひかって、絵が うすくなり、字「頭」が のこる
 *
 * 子は、ほんものの人の つくり を守る(あたまが 大きい 子ども の 体つき。ゆがめない):
 *   うで は かた から出て ひじ で まがる(手の ばしょ から 2つの ほね で 求める)。
 *   くび は あたまの かげ。あし は こし から。あたまが 大きいので 立つと からだは ちいさい。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '頭'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAIR_LIGHT = '#8a6650'
const SHIRT = '#f2695d'
const SHIRT_DARK = '#d94f45'
const PANTS = '#3e5c86'
const SHOE = '#6b4a36'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const TONGUE = '#ff8a8a'
const POT = '#d9644a'
const POT_DARK = '#b84e39'
const POT_LIGHT = '#ef8a6c'
const POT_STEM = '#9c4132'
const LID = '#e8b04a'
const LID_DARK = '#c8912f'
const BEAN = '#e9c46a'
const BEAN_DARK = '#c99a45'
const BEAN_LIGHT = '#fbe7ac'
const HILL = '#a9dc8a'
const HILL_RIDGE = '#82c76f'
const GRASS = '#c5e8a9'
const LEAF = '#55b86e'
const STONE = '#b7bfc7'
const STONE_DARK = '#9aa3ad'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const POT_UP = 0.1
const HOP_IN = 0.7
const LOOK = 1.8
const STEAM = 1.9
const SWELL_AT = 2.3
const POP_A = 2.7
const POP_B = 3.1
const POP_C = 3.35
/** 大きな まめが とびだす → あたまに あたる */
const LAUNCH = 3.65
const HIT = 4.4
const OUCH_END = 5.45
const SMILE = 6.0
const CROUCH = 5.95
const RISE = 6.2
const FALL = 6.55
const LAND = 6.88
const INK = 7.0
const DONE = 10.2
const DURATION = 10.8

/* ───────── ばしょ ───────── */

/** 子の かたち(あたま・かた・こし の ばしょ) */
const CENTER_X = 75
const NECK: readonly [number, number] = [75, 74]
const SHOULDER_L: readonly [number, number] = [66.5, 77]
const HIP_L: readonly [number, number] = [67, 79.5]
const HIP_R: readonly [number, number] = [83, 79.5]
/** うでの ほね(かた→ひじ、ひじ→手)と、あしの ながさ */
const UPPER_ARM = 9.5
const FORE_ARM = 8.5
const LEG = 20
/** 立っている ときの 体の 高さ(ばんざいの ときより 2 たかい) */
const STAND_Y = -2
/** 地面の 高さ(足の うらが つく ところ) */
const FLOOR_Y = 97.5
/** 立つ ときと、ばんざいで ひらく ときの あしの 角度 */
const LEG_STAND = 5
const LEG_SPREAD = 43

/** 豆の ふた の ばしょ(1画目) と、うつわの ふち */
const LID_CENTER_X = 30.5
const LID_Y = 22
const RIM_Y = 33.5

/** 1つの 点 を まっすぐ ならべた 2つの 点の あいだ の ねだん */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
type Point = readonly [number, number]
const lerpPoint = (a: Point, b: Point, k: number): Point => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const clampTo = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)

/** from から to へ ほうぶつせん。h は 山なりに もちあがる 高さ */
function arc(p: number, from: Point, to: Point, h: number): Point {
  return [lerp(from[0], to[0], p), lerp(from[1], to[1], p) - h * 4 * p * (1 - p)]
}

/* ───────── 地面・丘 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[101, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="100.2" y="-0.4" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 101 11)`} />
        ))}
      </Layer>
      <circle cx="101" cy="11" r={Math.max(0, 5.2 * sun)} fill={SUN} />
      {/* とおくの おか と、ゆっくり ながれる 小さな 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 78 40 90 Q70 70 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 0.9} 0)`}>
        <ellipse cx="99" cy="32" rx="6" ry="2.8" />
        <ellipse cx="102.5" cy="30.4" rx="4.2" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 52, 98, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** まめ入れの うしろに ある 小さな 丘。ふち の すじ が 7画目 */
function Hill({ t }: SceneProps) {
  const rise = span(t, 0, 0.55, backOut)
  return (
    <Layer scaleY={rise} origin={[30, 98]}>
      <path d="M0 98 C5 92 9 87 14.5 85.2 C19.5 86 23.6 83 28.2 80.7 L46.3 71 Q51.5 69.4 52.6 76 L56 98 Z" fill={HILL} />
      <Bone char={CHAR} n={7} color={HILL_RIDGE} width={3.2} />
    </Layer>
  )
}

/* ───────── まめ ───────── */

type BeanProps = { readonly x: number; readonly y: number; readonly rotate?: number; readonly scale?: number }

function BeanShape({ x, y, rotate = 0, scale = 1 }: BeanProps) {
  return (
    <Layer x={x} y={y} rotate={rotate} scale={scale}>
      <ellipse cx="0" cy="0" rx="2.7" ry="1.95" fill={BEAN} />
      <ellipse cx="0.5" cy="0.8" rx="2" ry="0.9" fill={BEAN_DARK} opacity="0.55" />
      <ellipse cx="-0.9" cy="-0.7" rx="0.9" ry="0.5" fill={BEAN_LIGHT} />
    </Layer>
  )
}

/** うつわの 口に つまった まめの 山(ふたを した から おしあげる) */
const HEAP: readonly (readonly [number, number, number])[] = [
  [20.5, 31, 8],
  [25.5, 31, -12],
  [30.5, 31, 10],
  [35.5, 31, -6],
  [40.5, 31, 14],
  [23, 28.2, -10],
  [28, 28.2, 6],
  [33, 28.2, -14],
  [38, 28.2, 9],
  [26, 25.6, 12],
  [31, 25.6, -8],
  [36, 25.6, 5],
]

function Heap({ swell }: { readonly swell: number }) {
  return (
    <Layer scaleY={swell} origin={[31, RIM_Y]}>
      {HEAP.map(([x, y, r]) => (
        <BeanShape key={`${x}-${y}`} x={x} y={y} rotate={r} />
      ))}
    </Layer>
  )
}

/** まめ入れの 外へ とびだす 小さな まめ(あたま に あたる まめは、べつに あつかう) */
type Pop = { readonly at: number; readonly dur: number; readonly from: Point; readonly to: Point; readonly h: number; readonly stays: boolean }
const POPS: readonly Pop[] = [
  { at: POP_A, dur: 0.7, from: [26, 29], to: [24.5, 29.5], h: 13, stays: false },
  { at: POP_B, dur: 0.75, from: [37, 29], to: [39.5, 29.5], h: 15, stays: false },
  // 左へ とんで、丘の ふもとに おちる まめ
  { at: POP_C, dur: 0.85, from: [20, 29], to: [7.5, 96], h: 22, stays: true },
]

function PoppingBeans({ t }: SceneProps) {
  return (
    <>
      {POPS.map((pop) => {
        const p = span(t, pop.at, pop.at + pop.dur)
        if (p <= 0 || (p >= 1 && !pop.stays)) return null
        const [x, y] = arc(p, pop.from, pop.to, pop.h)
        return <BeanShape key={pop.at} x={x} y={y} rotate={p * 420} />
      })}
    </>
  )
}

/** 大きな まめ: まめ入れから 山なりに とんで、子の あたまに あたり、はねかえって 地面に ころがる */
const HEAD_TOP: Point = [75, 15.5]
const BEAN_REST: Point = [106, 97]
const BOUNCE_END = HIT + 0.95
function BigBean({ t }: SceneProps) {
  const fly = span(t, LAUNCH, HIT)
  if (fly <= 0) return null
  if (t < HIT) {
    const [x, y] = arc(fly, [38, 28], HEAD_TOP, 18)
    return <BeanShape x={x} y={y} rotate={fly * 540} scale={1.5} />
  }
  const bounce = span(t, HIT, BOUNCE_END)
  if (bounce < 1) {
    // あたまに あたって、右へ はねかえる
    const [x, y] = arc(bounce, HEAD_TOP, [BEAN_REST[0] - 3, BEAN_REST[1]], -44)
    return <BeanShape x={x} y={y} rotate={bounce * 500} scale={1.5} />
  }
  // ちいさく ひとはね して、とまる
  const roll = span(t, BOUNCE_END, BOUNCE_END + 0.35)
  const [x, y] = arc(roll, [BEAN_REST[0] - 3, BEAN_REST[1]], BEAN_REST, 3)
  return <BeanShape x={x} y={y} rotate={roll * 120} scale={1.5} />
}

/* ───────── まめ入れ(高坏) ───────── */

function Steam({ t }: SceneProps) {
  const amount = during(t, STEAM, POP_C + 1.2, 0.4)
  if (amount <= 0) return null
  return (
    <g opacity={amount}>
      {[0, 0.5, 1].map((offset, i) => {
        const side = i % 2 === 0 ? -1 : 1
        const p = ((t * 0.9 + offset) % 1.5) / 1.5
        const x = 31 + side * (17.5 + p * 3) + Math.sin(p * 7 + i) * 1.1
        const y = 29 - p * 17
        return <ellipse key={offset} cx={x} cy={y} rx={2.4 + p * 2.4} ry={1.7 + p * 1.5} fill="#ffffff" stroke="#d6e0ea" strokeWidth="0.6" opacity={Math.sin(p * Math.PI) * 0.9} />
      })}
    </g>
  )
}

function Pot({ t }: SceneProps) {
  const grow = span(t, POT_UP, POT_UP + 0.7, backOut)
  if (grow <= 0) return null
  const swell = span(t, SWELL_AT, SWELL_AT + 1.1, easeOut)
  // ふたは、ふくらむ まめに おされて 上へ。カタカタ ゆれながら もちあがる
  const rattle = during(t, STEAM + 0.3, POP_C + 0.9, 0.3)
  const bob = t > POP_C + 0.8 ? wave(t, 1.1) * 0.35 : 0
  const lift = (RIM_Y - 2 - LID_Y) * swell + wave(t, 0.16) * 0.7 * rattle + bob
  const tilt = -3 * swell + wave(t, 0.13) * 2.2 * rattle
  return (
    <Layer scale={grow} origin={[32, 79]}>
      {/* 足の 台(うつわの 下) */}
      <path d="M24.6 52 L40.4 52 L37.4 74 L27.6 74 Z" fill={POT_STEM} />
      <path d="M26.2 54 L28.6 54 L30.4 73 L28.4 73 Z" fill={POT_DARK} opacity="0.7" />
      <rect x="23" y="50.2" width="18" height="3.6" rx="1.8" fill={LID_DARK} />
      <rect x="21" y="74" width="22" height="4.6" rx="2.2" fill={POT_STEM} />
      <ellipse cx="24" cy="81.6" rx="5.6" ry="3.4" fill={STONE} />
      <ellipse cx="25" cy="83" rx="4" ry="1.6" fill={STONE_DARK} opacity="0.6" />
      <Heap swell={swell} />
      {/* うつわ */}
      <path d="M16.4 35.5 Q16.4 33 19 33 H43.7 Q46.3 33 46.3 35.8 L44 47.5 Q43.6 51.4 38 51.4 H26.5 Q21.4 51.4 20.9 48.5 Z" fill={POT} />
      <path d="M16.4 35.5 Q16.4 33 19 33 H43.7 Q46.3 33 46.3 35.8 L46.1 37.2 H16.6 Z" fill={POT_LIGHT} />
      <path d="M20 43 H44.6 L44 47.5 Q43.6 51.4 38 51.4 H26.5 Q21.4 51.4 20.9 48.5 Z" fill={POT_DARK} />
      <circle cx="31" cy="40.4" r="1.7" fill={POT_LIGHT} />
      {/* ふた(1画目) */}
      <Layer y={-lift} rotate={tilt} origin={[LID_CENTER_X, LID_Y + 9.5]}>
        <g transform={`translate(0 ${9.5})`}>
          <rect x="15.2" y="20" width="31" height="4.2" rx="2.1" fill={LID} />
          <rect x="15.2" y="22.4" width="31" height="1.8" rx="0.9" fill={LID_DARK} />
          <ellipse cx={LID_CENTER_X} cy="18.8" rx="3.4" ry="2.4" fill={LID} />
        </g>
      </Layer>
    </Layer>
  )
}

/* ───────── 子 ───────── */

type Mood = 'calm' | 'curious' | 'surprised' | 'ouch' | 'happy'

function Face({ mood, look, closed }: { readonly mood: Mood; readonly look: Point; readonly closed: boolean }) {
  const [lx, ly] = look
  const eyeY = 57
  const dots = (r: number) => (
    <>
      {[68, 82].map((x) => (
        <g key={x}>
          <circle cx={x + lx * 1.4} cy={eyeY + ly * 1.2} r={r} fill={EYE} />
          <circle cx={x + lx * 1.4 + 0.8} cy={eyeY + ly * 1.2 - 0.8} r={r * 0.32} fill="#ffffff" />
        </g>
      ))}
    </>
  )
  const arcs = (
    <>
      <path d="M65.4 58.4 Q68 53.8 70.6 58.4" fill="none" stroke={EYE} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M79.4 58.4 Q82 53.8 84.6 58.4" fill="none" stroke={EYE} strokeWidth="1.6" strokeLinecap="round" />
    </>
  )
  return (
    <>
      <circle cx="64.2" cy="63.4" r="3" fill={CHEEK} opacity={mood === 'happy' ? 0.75 : 0.5} />
      <circle cx="85.8" cy="63.4" r="3" fill={CHEEK} opacity={mood === 'happy' ? 0.75 : 0.5} />
      {mood === 'ouch' && (
        <>
          <path d="M65.6 54.4 L70.6 57 L65.6 59.6" fill="none" stroke={EYE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M84.4 54.4 L79.4 57 L84.4 59.6" fill="none" stroke={EYE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="75" cy="67.6" rx="3.2" ry="2.8" fill={MOUTH} />
          <ellipse cx="75" cy="69" rx="1.9" ry="1.1" fill={TONGUE} />
        </>
      )}
      {mood === 'happy' && (
        <>
          {arcs}
          <path d="M69.6 64.4 Q75 74 80.4 64.4 Z" fill={MOUTH} strokeLinejoin="round" stroke={MOUTH} strokeWidth="1" />
          <path d="M72.6 68.6 Q75 66.8 77.4 68.6 Q75 71 72.6 68.6 Z" fill={TONGUE} />
        </>
      )}
      {(mood === 'calm' || mood === 'curious' || mood === 'surprised') && (
        <>
          {closed ? arcs : dots(mood === 'surprised' ? 3 : mood === 'curious' ? 2.5 : 2.2)}
          {/* まゆ: ふしぎ・びっくりの ときは 上がる */}
          {mood !== 'calm' && (
            <>
              <path d={`M65.4 ${mood === 'surprised' ? 49.6 : 51.4} Q68 ${mood === 'surprised' ? 48 : 49.8} 70.6 ${mood === 'surprised' ? 49.6 : 51}`} fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
              <path d={`M79.4 ${mood === 'surprised' ? 49.6 : 51} Q82 ${mood === 'surprised' ? 48 : 49.8} 84.6 ${mood === 'surprised' ? 49.6 : 51.4}`} fill="none" stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />
            </>
          )}
          {mood === 'calm' && <path d="M72.4 66.4 Q75 68.6 77.6 66.4" fill="none" stroke={MOUTH} strokeWidth="1.3" strokeLinecap="round" />}
          {mood === 'curious' && <ellipse cx="75" cy="67" rx="1.4" ry="1.8" fill={MOUTH} />}
          {mood === 'surprised' && <ellipse cx="75" cy="67.4" rx="2" ry="2.7" fill={MOUTH} />}
        </>
      )}
    </>
  )
}

/** おかっぱの かみ。おでこの うえ から ぜんぶ おおって、すそ(まえがみ)が 12画目の 高さ */
function Hair() {
  return (
    <>
      <path
        d="M54 45.5 L54 30 Q54 17 67 17 L83 17 Q96 17 96 30 L96 45.5 Q96 47.5 93.5 47.2 Q91 47 90 45.5 C87 49.5 83.5 44.5 80 47.5 C76.5 50 73 45 69.5 47.5 C66 49.5 63 47 60 45.5 Q58.5 47.2 56.5 47.2 Q54 47.5 54 45.5 Z"
        fill={HAIR}
      />
      {/* かみの つや(11画目の うえ) と、ひとふさ(9画目) */}
      <Bone char={CHAR} n={9} color={HAIR_LIGHT} width={2.4} />
      <path d="M83 24.5 Q88 25 90.6 29" fill="none" stroke={HAIR_LIGHT} strokeWidth="2" strokeLinecap="round" />
    </>
  )
}

type Limb = { readonly hand: Point; readonly side: number }
/** かた と 手の ばしょ から、ひじの ばしょを もとめる(うでの ほねは 2つ。のびきらない) */
function elbowOf(shoulder: Point, limb: Limb): { readonly elbow: Point; readonly hand: Point } {
  const dx = limb.hand[0] - shoulder[0]
  const dy = limb.hand[1] - shoulder[1]
  const dist = Math.hypot(dx, dy) || 0.001
  const reach = Math.min(dist, UPPER_ARM + FORE_ARM - 0.05)
  const ux = dx / dist
  const uy = dy / dist
  const along = (reach * reach + UPPER_ARM * UPPER_ARM - FORE_ARM * FORE_ARM) / (2 * reach)
  const out = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - along * along)) * limb.side
  return {
    elbow: [shoulder[0] + ux * along - uy * out, shoulder[1] + uy * along + ux * out],
    hand: [shoulder[0] + ux * reach, shoulder[1] + uy * reach],
  }
}

/** 左うで。右うでは、まんなかの線で うら返して 使う */
function Arm({ limb }: { readonly limb: Limb }) {
  const { elbow, hand } = elbowOf(SHOULDER_L, limb)
  return (
    <>
      <path d={`M${SHOULDER_L[0]} ${SHOULDER_L[1]} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={SHIRT_DARK} strokeWidth="5.6" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function Leg({ hip, angle, dir }: { readonly hip: Point; readonly angle: number; readonly dir: -1 | 1 }) {
  const rad = (angle * Math.PI) / 180
  const foot: Point = [hip[0] + dir * Math.sin(rad) * LEG, hip[1] + Math.cos(rad) * LEG]
  return (
    <>
      <path d={`M${hip[0]} ${hip[1]} L${foot[0]} ${foot[1]}`} fill="none" stroke={PANTS} strokeWidth="6.6" strokeLinecap="round" />
      <ellipse cx={foot[0] + dir * 1.6} cy={foot[1] + 0.8} rx="4.3" ry="2.3" fill={SHOE} />
    </>
  )
}

type KidPose = {
  readonly mood: Mood
  readonly look: Point
  readonly closed: boolean
  readonly legAngle: number
  readonly tilt: number
  readonly squash: number
  readonly nearArm: Limb
}

function Kid({ pose, t }: { readonly pose: KidPose; readonly t: number }) {
  const bumpGrow = span(t, HIT + 0.05, HIT + 0.3, backOut)
  const bumpGone = 1 - span(t, OUCH_END, SMILE - 0.1)
  const bump = Math.max(0, bumpGrow * bumpGone)
  return (
    <>
      <Leg hip={HIP_L} angle={pose.legAngle} dir={-1} />
      <Leg hip={HIP_R} angle={pose.legAngle} dir={1} />
      {/* どう(あたまに かくれて ちいさい) */}
      <rect x="66" y="70" width="18" height="15" rx="6" fill={SHIRT} />
      <path d="M67.4 80.4 H82.6" stroke={SHIRT_DARK} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="66" y="82.2" width="18" height="4" rx="2" fill={PANTS} />
      {/* あたま(おおきい): くび の ところを じくに かたむく */}
      <Layer rotate={pose.tilt} scaleY={pose.squash} origin={NECK}>
        <circle cx="59.6" cy="58.4" r="3.4" fill={SKIN_SHADE} />
        <circle cx="90.4" cy="58.4" r="3.4" fill={SKIN_SHADE} />
        <rect x="60" y="38" width="30" height="37" rx="14" fill={SKIN} />
        <Face mood={pose.mood} look={pose.look} closed={pose.closed} />
        <Hair />
        {/* たんこぶ: まめが あたった ところ */}
        <Layer scale={bump} origin={[80, 18]}>
          <circle cx="80" cy="16.6" r="4.3" fill="#ffb8a8" />
          <circle cx="78.6" cy="15.2" r="1.4" fill="#ffe1d8" />
        </Layer>
      </Layer>
      <Arm limb={pose.nearArm} />
      <Layer scaleX={-1} x={2 * CENTER_X} origin={[0, 0]}>
        <Arm limb={pose.nearArm} />
      </Layer>
    </>
  )
}

/** あたまの うえを まわる ほし(いたい!) と、あたった しゅんかんの はしる すじ */
function Dizzy({ t }: SceneProps) {
  const show = during(t, HIT + 0.05, OUCH_END + 0.1, 0.2)
  if (show <= 0) return null
  const spin = (t - HIT) * 7
  const burst = span(t, HIT, HIT + 0.3, easeOut)
  return (
    <g opacity={show}>
      {[0, 1, 2].map((i) => {
        const a = spin + (i * Math.PI * 2) / 3
        return <Star key={i} cx={CENTER_X + Math.cos(a) * 17} cy={9 + Math.sin(a) * 3.2} r={2.5} color={SUN} spin={spin * 40 + i * 30} />
      })}
      <g opacity={1 - burst} stroke="#ff8a4d" strokeWidth="1.3" strokeLinecap="round">
        {[-60, -30, 0, 30, 60].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180
          const r0 = 4 + burst * 3
          const r1 = r0 + 3.2
          return <line key={deg} x1={HEAD_TOP[0] + Math.cos(rad) * r0} y1={HEAD_TOP[1] + Math.sin(rad) * r0} x2={HEAD_TOP[0] + Math.cos(rad) * r1} y2={HEAD_TOP[1] + Math.sin(rad) * r1} />
        })}
      </g>
    </g>
  )
}

/** まめが とびだしたとき、子の あたまの よこに 出る「!」 */
function Alert({ t }: SceneProps) {
  const show = during(t, LAUNCH + 0.05, HIT - 0.05, 0.12)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="#e8534a" transform={`translate(0 ${-Math.abs(wave(t, 0.3)) * 0.8})`}>
      <rect x="99.6" y="38" width="3.2" height="8" rx="1.6" />
      <circle cx="101.2" cy="49.6" r="1.7" />
    </g>
  )
}

/* ───────── 場面 ───────── */

function kidPose(t: number): { readonly pose: KidPose; readonly x: number; readonly y: number; readonly feetY: number } {
  // 1.8秒まで: ぴょんぴょん はねながら きて、ならぶ
  const hop = span(t, HOP_IN, HOP_IN + 0.95)
  const hopHeight = Math.abs(Math.sin(hop * Math.PI * 3)) * 4.5 * (1 - hop * 0.6) * (hop < 1 ? 1 : 0)
  const x = 42 * (1 - easeOut(hop))
  // ばんざい: しゃがむ → とびあがる → ひらいて おりる
  const crouch = Math.sin(span(t, CROUCH, RISE) * Math.PI) * 3.2
  const rise = span(t, RISE, FALL, easeOut)
  const fall = span(t, FALL, LAND, easeIn)
  const jumpY = -13 * rise * (1 - fall)
  // 立っている 高さ(STAND_Y)から、ばんざいの 高さ(0 = 字の位置)へ うつる
  const baseY = mix(t, RISE - 0.3, LAND, STAND_Y, 0, easeInOut)
  const finalY = baseY - hopHeight + crouch + jumpY
  const spread = clampTo(span(t, RISE, RISE + 0.25, easeOut) + hopHeight / 4.5 * 0.12, 0, 1)
  const legAngle = lerp(LEG_STAND, LEG_SPREAD, spread)
  const rad = (legAngle * Math.PI) / 180
  const feetY = HIP_L[1] + Math.cos(rad) * LEG + finalY

  const mood: Mood = t < LOOK ? 'calm' : t < LAUNCH ? 'curious' : t < HIT ? 'surprised' : t < OUCH_END ? 'ouch' : t < SMILE ? 'curious' : 'happy'

  // 目の むき: まめ入れ → とんでくる まめ → じめんの まめ → まえ
  const flight = span(t, LAUNCH, HIT)
  const look: Point =
    t < LOOK ? [0, 0]
    : t < LAUNCH ? [-1, -0.3 - 0.4 * during(t, POP_A, POP_C + 0.8, 0.2)]
    : t < HIT ? [-1 + flight, -0.6 - 0.4 * flight]
    : t < OUCH_END ? [0, 0]
    : t < SMILE ? [1, 0.9]
    : [0, 0]
  // まばたき(おだやかな ときだけ)
  const closed = (mood === 'calm' || mood === 'curious') && t % 3.1 < 0.12

  const dip = Math.sin(span(t, HIT, HIT + 0.32) * Math.PI)
  const squash = 1 - 0.07 * dip
  const tilt = -4 * span(t, LOOK, LOOK + 0.4) * (1 - span(t, HIT - 0.3, HIT)) + 3 * span(t, HIT, HIT + 0.1) * (1 - span(t, OUCH_END - 0.1, OUCH_END + 0.2)) + (t >= SMILE ? wave(t, 0.6) * 2 * (1 - span(t, RISE, RISE + 0.1)) : 0)

  // うで: ふだんは 下げる → あたった ときは ほっぺを おさえる → ばんざい
  const hold = span(t, HIT, HIT + 0.12, easeOut) * (1 - span(t, OUCH_END, OUCH_END + 0.3))
  const cheer = span(t, RISE - 0.25, RISE + 0.15, easeOut)
  const idle: Limb = { hand: [61.5 + wave(t, 2.4) * 0.6, 92], side: 0.8 }
  const cheek: Limb = { hand: [60.8, 66.5], side: -1 }
  const up: Limb = { hand: [51.5, 68], side: -1 }
  const base = { hand: lerpPoint(idle.hand, cheek.hand, hold), side: lerp(idle.side, cheek.side, hold) }
  const nearArm: Limb = { hand: lerpPoint(base.hand, up.hand, cheer), side: lerp(base.side, up.side, cheer) }

  return { pose: { mood, look, closed, legAngle, tilt, squash, nearArm }, x, y: finalY, feetY }
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 16)
  const kid = kidPose(t)
  const kidShow = span(t, HOP_IN - 0.1, HOP_IN + 0.1)
  const air = Math.max(0, FLOOR_Y - kid.feetY + 2)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Hill t={t} />
        <Pot t={t} />
        <Steam t={t} />
        <PoppingBeans t={t} />
        <Layer opacity={kidShow}>
          <ellipse cx={75 + kid.x} cy="98.4" rx={Math.max(6, 16 - air * 0.5)} ry="2.4" fill="#000000" opacity="0.12" />
          <Layer x={kid.x} y={kid.y}>
            <Kid pose={kid.pose} t={t} />
          </Layer>
          <Dizzy t={t} />
          <Alert t={t} />
        </Layer>
        <BigBean t={t} />
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
    { at: 0, label: '丘の上に まめ入れが ぽん と立つ', sound: 'pop' },
    { at: HOP_IN, label: 'あたまの 大きな 子が ぴょんぴょん やってくる' },
    { at: SWELL_AT, label: 'まめが ふくらんで、ふたが もちあがる' },
    { at: LAUNCH, label: '大きな まめが とんでくる', sound: 'tap' },
    { at: HIT, label: 'あたまに こつん!', sound: 'stamp' },
    { at: SMILE, label: '「なんだ まめか」にっこり。ぴょーんと ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '頭 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
