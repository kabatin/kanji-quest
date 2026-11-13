/*
 * 科(か): いねを ますで はかって わける。
 *
 * ほね(画と絵の対応)  ← 禾(いね) + 斗(ます)
 *   1画目(ノ)  … いねの ほ。おもたくて 左へ たれる
 *   2画目(一)  … いねの 葉(よこに のびる)
 *   3画目(丨)  … いねの くき
 *   4・5画目   … いねの 左と右の 葉
 *   6・7画目   … ますから ぽんと とびはねる もみ(2つぶ)
 *   8画目(一)  … ますの ふち(いっぱいに はかった ところ)
 *   9画目(丨)  … ますに たてた ながい ひしゃく の え
 *
 * ながれ
 *   いねが そだって、ほが きいろく みのる
 *   → 子どもが かごに もみを いっぱい 入れて あるいてくる。「どれだけ あるのかな」と こまり顔
 *   → かごを かかげて、もみを ますに さらさら あける。ますが いっぱいに なる
 *   → ぴったり はかれて にっこり。かごを おいて ばんざい、もみが ぽーんと とびはねる
 *   → ほね が ひかって、絵が うすくなり、字「科」が のこる
 *
 * 人は ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から出て ひじ で まがる。手は かごの 下がわを ささえる。
 *   くび は みじかく、あたま は どう の まんなか の上。
 *   字の形に そろうのは、ますの ふち と え、いねの ほ・葉 など 本来 その形のもの だけ。
 */
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '科'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#f29b4b'
const TUNIC_DARK = '#d9803a'
const PANTS = '#4f6fa8'
const SHOE = '#6b4a36'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const STALK = '#6fbf5a'
const EAR_GREEN = '#9bd06b'
const GOLD = '#e8b93a'
const GOLD_LIGHT = '#f8dc7a'
const GOLD_DARK = '#c99522'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const SUN = '#ffd24a'
const WOOD = '#c98b4a'
const WOOD_DARK = '#a06a34'
const WOOD_LIGHT = '#e0a965'
const BASKET = '#c8934f'
const BASKET_DARK = '#a9733a'
const DROP = '#7cc4f2'

/** くぎり の時間(秒) */
const RIPE = 1.4
const WALK = 1.0
const ARRIVE = 2.6
const LIFT = 3.3
const POUR = 3.7
const POUR_END = 5.0
const CHEER = 5.2
const INK = 6.4
const DONE = 9.4
const DURATION = 10

/** こどもの 足もと(とちゅうの 立つ場所)と、ますの 場所 */
const STAND_X = 56
/** ますの ふち(8画目の たかさ)と 左右のはし */
const RIM_Y = 62
const BARREL_L = 70
const BARREL_R = 98

type Point = readonly [number, number]

function lerpColor(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  const mixed = pa.map((v, i) => Math.round(v + (pb[i] - v) * k))
  return `#${mixed.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** 点 p を 角度 deg(右まわり)だけ まわして、中心 c へ うつす */
function turn(p: Point, deg: number, c: Point): Point {
  const r = (deg * Math.PI) / 180
  return [c[0] + p[0] * Math.cos(r) - p[1] * Math.sin(r), c[1] + p[0] * Math.sin(r) + p[1] * Math.cos(r)]
}

/* ───────── 背景 ───────── */

function Ground({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[101, 11]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="100.2" y="-0.4" width="1.6" height="3.6" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 101 11)`} />
        ))}
      </Layer>
      <circle cx="101" cy="11" r={5.4 * sun} fill={SUN} />
      <path d="M-4 99 Q18 76 44 91 Q72 70 113 93 V101 H-4 Z" fill={HILL} />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="6" cy="9" rx="7" ry="3.2" />
        <ellipse cx="11" cy="7.4" rx="5" ry="3.2" />
        <ellipse cx="56" cy="6" rx="6" ry="2.6" />
        <ellipse cx="60.5" cy="4.6" rx="4.2" ry="2.8" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[6, 24, 50, 68, 104].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/* ───────── いね ───────── */

/** 1画目の ほ(左へ たれる)の 上に ならべる もみ。通り道の点 */
const EAR_POINTS: readonly Point[] = [
  [39.8, 17.3],
  [36.8, 20.1],
  [33.5, 22.5],
  [30, 24.7],
  [26.3, 26.6],
  [22.6, 28.3],
]

function Rice({ t }: SceneProps) {
  const grow = span(t, 0, 1.0, backOut)
  const ripe = span(t, 0.9, RIPE + 1.0)
  // かぜで ゆっくり ゆれる(字になる まえに とまる)
  const sway = wave(t, 3.2) * 1.1 * (1 - span(t, INK - 0.8, INK - 0.2))
  const ear = lerpColor(EAR_GREEN, GOLD, ripe)
  return (
    <Layer scaleX={0.7 + 0.3 * grow} scaleY={grow} rotate={sway} origin={[36, 96]}>
      {/* ねもとの はっぱ */}
      <path d="M30.5 97 Q32 90 34.4 88 Q34 93 36.4 97 Z M37.6 97 Q39 91 42.6 89.5 Q41 94 43 97 Z" fill={LEAF} />
      <Bone char={CHAR} n={4} color={LEAF} width={2.2} />
      <Bone char={CHAR} n={5} color={LEAF} width={2.2} />
      <Bone char={CHAR} n={2} color={LEAF_DARK} width={2} />
      <Bone char={CHAR} n={3} color={STALK} width={2.2} />
      <Bone char={CHAR} n={1} color={ear} width={4.2} />
      {/* もみ の つぶ(みのると きいろく ふくらむ) */}
      {EAR_POINTS.map(([x, y], i) => (
        <ellipse key={i} cx={x - 0.6} cy={y + 2.4} rx={1.7 + ripe * 0.3} ry={1.1 + ripe * 0.3} fill={lerpColor('#b8de86', GOLD_LIGHT, ripe)} transform={`rotate(${28 + i * 3} ${x - 0.6} ${y + 2.4})`} />
      ))}
    </Layer>
  )
}

/* ───────── ます ───────── */

/** ひしゃくの え は ますの 中に たっている。もみ の山は え の手前に、ますの 前がわ は いちばん手前に 描く */
function Barrel({ t, fill }: SceneProps & { readonly fill: number }) {
  const pop = span(t, 0.4, 1.0, backOut)
  if (pop <= 0) return null
  const peak = RIM_Y - 1 - 5.5 * fill
  const ctrl = 2 * peak - (RIM_Y + 1)
  return (
    <Layer scale={pop} origin={[(BARREL_L + BARREL_R) / 2, 97]}>
      <ellipse cx="84" cy="97.6" rx="17" ry="2.6" fill="#000000" opacity="0.1" />
      <Bone char={CHAR} n={9} color={WOOD_LIGHT} width={3.6} />
      <circle cx="77.9" cy="13.4" r="3" fill={WOOD_DARK} />
      {fill > 0 && <path d={`M${BARREL_L + 1.5} ${RIM_Y + 1} Q84 ${ctrl} ${BARREL_R - 1.5} ${RIM_Y + 1} Z`} fill={GOLD} />}
      {fill > 0 && <path d={`M${BARREL_L + 5} ${RIM_Y + 1} Q80 ${ctrl + 2} 90 ${RIM_Y + 1} Z`} fill={GOLD_LIGHT} opacity="0.7" />}
      <path d={`M${BARREL_L} ${RIM_Y} H${BARREL_R} L${BARREL_R - 1.6} 97 Q84 98.6 ${BARREL_L + 1.6} 97 Z`} fill={WOOD} />
      <rect x={BARREL_L - 1} y={RIM_Y - 0.6} width={BARREL_R - BARREL_L + 2} height="3.6" rx="1.6" fill={WOOD_LIGHT} />
      {[73.5, 91].map((y) => (
        <path key={y} d={`M${BARREL_L + 0.6} ${y} H${BARREL_R - 0.6}`} stroke={WOOD_DARK} strokeWidth="2" strokeLinecap="round" />
      ))}
      {[77, 84, 91].map((x) => (
        <path key={x} d={`M${x} 67 V70.5 M${x} 76.5 V88 M${x} 93.5 V96`} stroke={WOOD_DARK} strokeWidth="0.7" opacity="0.55" />
      ))}
    </Layer>
  )
}

/* ───────── こども ───────── */

type Mood = 'worried' | 'happy'

/** かごの 形。中心が 原点で、ふち は y = -4.6。level = もみ の 量(0〜1) */
function BasketShape({ level }: { readonly level: number }) {
  const m = 3.4 * level
  return (
    <>
      {level > 0.02 && <path d={`M-7.6 -4.4 Q0 ${-4.4 - 2 * m} 7.6 -4.4 Z`} fill={GOLD} />}
      <path d="M-8 -4 L8 -4 L6.2 5 Q0 6.6 -6.2 5 Z" fill={BASKET} />
      <path d="M-7.3 0 H7.3 M-6.7 3 H6.7" stroke={BASKET_DARK} strokeWidth="0.9" strokeLinecap="round" />
      <rect x="-8.6" y="-5.2" width="17.2" height="2" rx="1" fill={BASKET_DARK} />
    </>
  )
}

/** ふたつの ほね の長さが きまった うで: かた → ひじ → 手。手の場所から ひじ を 計算する。 */
function Arm({ shoulder, hand, outward }: { readonly shoulder: Point; readonly hand: Point; readonly outward: number }) {
  const len = 9.2
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const dist = Math.max(Math.hypot(dx, dy), 0.01)
  const k = Math.min(1, (2 * len - 0.1) / dist)
  const hx = shoulder[0] + dx * k
  const hy = shoulder[1] + dy * k
  const d = dist * k
  const mx = (shoulder[0] + hx) / 2
  const my = (shoulder[1] + hy) / 2
  const h = Math.sqrt(Math.max(0, len * len - (d / 2) ** 2))
  const nx = -(hy - shoulder[1]) / d
  const ny = (hx - shoulder[0]) / d
  const a: Point = [mx + nx * h, my + ny * h]
  const b: Point = [mx - nx * h, my - ny * h]
  // ひじ は 下か そとがわ へ まがる
  const score = (p: Point) => p[1] + outward * p[0] * 0.8
  const elbow = score(a) >= score(b) ? a : b
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]}`} stroke={TUNIC_DARK} strokeWidth="4.8" strokeLinecap="round" fill="none" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hx} ${hy}`} stroke={SKIN} strokeWidth="3.8" strokeLinecap="round" fill="none" />
      <circle cx={hx} cy={hy} r="2.5" fill={SKIN} />
    </>
  )
}

function Face({ mood, gaze }: { readonly mood: Mood; readonly gaze: number }) {
  return (
    <>
      <circle cx="-5.4" cy="56.4" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="5.4" cy="56.4" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'worried' ? (
        <>
          <path d="M-5.8 49.8 L-2.4 48.6 M5.8 49.8 L2.4 48.6" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
          <circle cx={-3.2 + gaze} cy="53" r="1.25" fill={EYE} />
          <circle cx={3.2 + gaze} cy="53" r="1.25" fill={EYE} />
          <path d="M-1.8 58.4 Q0 56.8 1.8 58.4" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-4.8 53.6 Q-3.2 51.4 -1.6 53.6 M1.6 53.6 Q3.2 51.4 4.8 53.6" fill="none" stroke={EYE} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-2.6 56.2 Q0 60.6 2.6 56.2 Z" fill={MOUTH} />
        </>
      )}
    </>
  )
}

type ChildProps = {
  readonly mood: Mood
  readonly step: number
  readonly basketAt: Point
  readonly basketTurn: number
  readonly level: number
  readonly basketShown: boolean
  /** 手が かごを ささえる 度合い(0 = ばんざい) */
  readonly hold: number
  readonly gaze: number
  readonly tilt: number
}

function Child({ mood, step, basketAt, basketTurn, level, basketShown, hold, gaze, tilt }: ChildProps) {
  const shoulderL: Point = [-6.4, 65.4]
  const shoulderR: Point = [6.4, 65.4]
  // かごの 下の かど を 手で ささえる
  const gripL = turn([-6.2, 5.2], basketTurn, basketAt)
  const gripR = turn([6.2, 5.2], basketTurn, basketAt)
  const cheerL: Point = [-12.5, 44]
  const cheerR: Point = [12.5, 44]
  const blend = (a: Point, b: Point): Point => [b[0] + (a[0] - b[0]) * hold, b[1] + (a[1] - b[1]) * hold]
  return (
    <>
      {/* 足: あるくとき かわりばんこに ふる */}
      <Layer rotate={step * 18} origin={[-3.4, 80]}>
        <rect x="-5.4" y="79" width="4.2" height="14" rx="2.1" fill={PANTS} />
        <ellipse cx="-3.6" cy="94" rx="3.8" ry="2" fill={SHOE} />
      </Layer>
      <Layer rotate={-step * 18} origin={[3.4, 80]}>
        <rect x="1.2" y="79" width="4.2" height="14" rx="2.1" fill={PANTS} />
        <ellipse cx="3.6" cy="94" rx="3.8" ry="2" fill={SHOE} />
      </Layer>
      {/* くび(みじかく)と どう */}
      <rect x="-2.4" y="59.4" width="4.8" height="6" rx="2" fill={SKIN_SHADE} />
      <rect x="-7.2" y="62.4" width="14.4" height="19.6" rx="5.4" fill={TUNIC} />
      <path d="M-6 75.5 H6" stroke={TUNIC_DARK} strokeWidth="1.3" strokeLinecap="round" />
      {/* あたま: しんぱいのときは 少し かたむく */}
      <Layer rotate={tilt} origin={[0, 61]}>
        <circle cx="-8.4" cy="53.4" r="1.7" fill={SKIN_SHADE} />
        <circle cx="8.4" cy="53.4" r="1.7" fill={SKIN_SHADE} />
        <circle cx="0" cy="52" r="8.6" fill={SKIN} />
        <path d="M-9 51 C-9.8 41.6 -2.4 40 2 40.8 C8.6 40.2 10 46.2 9 51 C6 46.8 -1 45.2 -9 51 Z" fill={HAIR} />
        <path d="M1.6 41 Q2.6 37.8 4.4 39.8 Q5.4 37.4 6.4 40.4" fill="none" stroke={HAIR} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} gaze={gaze} />
      </Layer>
      {basketShown && (
        <Layer x={basketAt[0]} y={basketAt[1]} rotate={basketTurn} scale={1.2}>
          <BasketShape level={level} />
        </Layer>
      )}
      <Arm shoulder={shoulderL} hand={blend(gripL, cheerL)} outward={-1} />
      <Arm shoulder={shoulderR} hand={blend(gripR, cheerR)} outward={1} />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** かごの ふち から ますへ おちる もみ。ふち の場所(ふち 右はし)から 小さな山なり で おちる */
function Stream({ t, rim, amount }: SceneProps & { readonly rim: Point; readonly amount: number }) {
  if (amount <= 0.05) return null
  return (
    <g opacity={Math.min(1, amount)}>
      {Array.from({ length: 9 }, (_, i) => {
        const p = ((t - POUR) * 2.1 + i / 9) % 1
        const tau = p * 0.5
        const x = rim[0] + (4 + (i % 3) * 3) * tau * 2
        const y = rim[1] + 0.5 * 75 * tau * tau
        return <ellipse key={i} cx={x} cy={y} rx="1.2" ry="0.8" fill={GOLD} transform={`rotate(${i * 40} ${x} ${y})`} />
      })}
    </g>
  )
}

/** ますが いっぱいに なって、もみが 2つぶ ぽーんと とびはねる。字の 6・7画目の 点の あたりで とまる。 */
function Hop({ t }: SceneProps) {
  const goals: readonly (readonly [number, number, number])[] = [
    [63.5, 25.5, 0],
    [60.5, 45, 0.15],
  ]
  return (
    <>
      {goals.map(([gx, gy, delay], i) => {
        const p = span(t, CHEER + delay, INK - 0.05, easeOut)
        if (p <= 0) return null
        const x = 84 + (gx - 84) * p + Math.sin(p * 9) * (1 - p) * 2
        const y = RIM_Y - 3 + (gy - RIM_Y + 3) * p
        return <ellipse key={i} cx={x} cy={y} rx="2.3" ry="1.6" fill={GOLD} stroke={GOLD_DARK} strokeWidth="0.5" transform={`rotate(${35 - i * 70 + p * 160} ${x} ${y})`} />
      })}
    </>
  )
}

/** ますに さわった しゅんかんの きらり */
function Glint({ t }: SceneProps) {
  const show = during(t, POUR_END - 0.3, CHEER + 0.8, 0.2)
  if (show <= 0) return null
  const sz = 2.2 + wave(t, 0.5) * 0.4
  const stars: readonly Point[] = [
    [74, 55],
    [93, 54],
  ]
  return (
    <g opacity={show} fill="#ffffff" stroke={GOLD} strokeWidth="0.4">
      {stars.map(([x, y]) => (
        <path key={x} d={`M${x} ${y - sz} L${x + sz * 0.3} ${y - sz * 0.3} L${x + sz} ${y} L${x + sz * 0.3} ${y + sz * 0.3} L${x} ${y + sz} L${x - sz * 0.3} ${y + sz * 0.3} L${x - sz} ${y} L${x - sz * 0.3} ${y - sz * 0.3} Z`} />
      ))}
    </g>
  )
}

/** こまり顔の あせ。あたまの よこから ぽとり */
function Sweat({ t, x }: SceneProps & { readonly x: number }) {
  const show = during(t, ARRIVE - 0.4, LIFT + 0.2, 0.2)
  if (show <= 0) return null
  const p = span(t, ARRIVE - 0.4, LIFT)
  return <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={DROP} opacity={show} transform={`translate(${x + 10.5} ${46 + p * 7})`} />
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 9)

  // あるいてくる → かごを かかげる → かたむけて あける → かごを おいて ばんざい
  const walkX = -14 + (STAND_X + 14) * span(t, WALK, ARRIVE, easeOut)
  const walking = t >= WALK && t < ARRIVE
  const stride = walking ? Math.sin((t - WALK) * Math.PI * 2 * 1.8) * (1 - span(t, ARRIVE - 0.3, ARRIVE)) : 0
  const lift = span(t, LIFT - 0.6, LIFT, easeInOut)
  const turnDeg = 62 * span(t, POUR, POUR + 0.7, easeInOut) * (1 - span(t, POUR_END - 0.3, POUR_END + 0.2))
  const drop = span(t, CHEER + 0.1, CHEER + 0.55, easeIn)
  const carry: Point = [0, 72]
  const pour: Point = [14, 56]
  const hand: Point = [carry[0] + (pour[0] - carry[0]) * lift, carry[1] + (pour[1] - carry[1]) * lift]
  const basketAt: Point = [hand[0] - 17 * drop, hand[1] + (90.5 - hand[1]) * drop]
  const fillFrac = span(t, POUR + 0.3, POUR_END - 0.2)
  const level = t >= POUR_END - 0.1 ? 0 : 1 - 0.95 * fillFrac
  const hold = 1 - span(t, CHEER - 0.1, CHEER + 0.3)
  const mood: Mood = t < POUR_END - 0.5 ? 'worried' : 'happy'
  const hop = t >= CHEER + 0.4 ? Math.abs(Math.sin((t - CHEER - 0.4) * Math.PI * 2.2)) * 2.4 * (1 - span(t, INK - 0.6, INK)) : 0
  const bob = -Math.abs(stride) * 1.2 - hop
  const tilt = mood === 'worried' ? -6 + stride * 2 : 3

  const rimLocal = turn([10, -5.8], turnDeg, basketAt)
  const rim: Point = [walkX + rimLocal[0], bob + rimLocal[1]]
  const barrelFill = span(t, POUR + 0.3, POUR_END, easeOut)
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Rice t={t} />
        <Barrel t={t} fill={barrelFill} />
        <Stream t={t} rim={rim} amount={t >= POUR && t < POUR_END ? (turnDeg - 10) / 20 : 0} />
        <Layer opacity={span(t, WALK - 0.1, WALK + 0.2)}>
          <ellipse cx={walkX} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
          <Layer x={walkX} y={bob}>
            <Child mood={mood} step={stride} basketAt={basketAt} basketTurn={turnDeg} level={level} basketShown hold={hold} gaze={t >= ARRIVE ? 1.2 : 0} tilt={tilt} />
          </Layer>
        </Layer>
        <Sweat t={t} x={walkX} />
        <Glint t={t} />
        <Hop t={t} />
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
    { at: 0, label: 'いねが そだつ', sound: 'pop' },
    { at: WALK, label: '子どもが もみを もって あるいてくる' },
    { at: LIFT, label: 'かごを かかげる', sound: 'pop' },
    { at: POUR, label: 'もみを ますに あける' },
    { at: CHEER, label: 'ぴったり はかれて ばんざい。もみが とびはねる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '科 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
