/*
 * 答(こたえ): 竹の ふだに かいた へんじが、ぴったり あう。
 *
 * ほね(画と絵の対応)
 *   1〜6画目(竹) … 竹の 枝から たれた 葉(左に 3まい・右に 3まい)
 *   7・8画目(人) … さいごに ばんざいする 子どもの りょううで(ひらいた うで)
 *   9・10〜12画目(口) … つくえの うえで ぴったり つながった 竹の ふだ(はこ のような 四角)
 *   (どれも、ほね が ひかるときに「だいたい この あたり」に そろえば よい。
 *    人の体は ゆがめず、うで は かた から出て ひじ で まがる)
 *
 * ながれ
 *   竹が そだち、子どもが つくえに ついている
 *   → 小鳥が 竹の ふだ(「?」の もんだい)を はこんできて、つくえに おく
 *   → 子どもは「?」と くびを かしげる(こまった)→ あっ と ひらめく
 *   → もう1まいの ふだに ふでで「まる」の へんじを かく
 *   → 2まいを よせると、でっぱりと へこみが ぴたっ と あう!(うれしい・ばんざい)
 *   → ほね が ひかって、絵が うすくなり、字「答」が のこる
 *
 * 人・鳥・ふだ は、ほんものの つくり を守る(字の形に合わせるために ゆがめない):
 *   うで は かた から ひじ で まがって 手に とどく(つくえの上の ふだに 手が とどく ところだけ うごかす)。
 *   ふだ は つくえの上に のっている。うしろから 出てくる ふだ は、つくえに かくれて 見えない。
 */
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '答'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const TUNIC = '#e8704f'
const TUNIC_DARK = '#cc5a3b'
const DESK_TOP = '#dfae78'
const DESK_FRONT = '#c9935f'
const DESK_LINE = '#b07c49'
const BAMBOO_TABLET = '#ecd27f'
const BAMBOO_TABLET_SHADE = '#d6b65a'
const CORD = '#a8794a'
const STALK = '#8fd16a'
const STALK_DARK = '#5ea044'
const STALK_LIGHT = '#b6e496'
const LEAF = '#55b86e'
const LEAF_DARK = '#3f9c59'
const GRASS = '#c5e8a9'
const HILL = '#e2f2d2'
const INK_BROWN = '#5a3b2a'
const INK_RED = '#d8473f'
const BIRD = '#6aa9e8'
const BIRD_DARK = '#4a88cf'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const CHEEK = '#ff9d9d'
const SWEAT = '#7cc4f2'
const THINK = '#5f7fd6'

/** くぎり の時間(秒) */
const ARRIVE = 1.2 // 小鳥が とんでくる
const LOWER = 2.3 // ふだを つくえの上に おろしはじめる
const DROPPED = 3.0 // ふだを おいて、小鳥が とびさる / 子どもが「?」
const IDEA = 3.7 // ひらめく。もう1まいの ふだを つくえの うしろから あげる
const WRITE_FROM = 4.7
const WRITE_TO = 5.6
const JOIN_FROM = 5.9
const JOIN_TO = 6.5
const CHEER = 6.6
const INK = 7.2
const DONE = 10.6
const DURATION = 11.2

type Pt = readonly [number, number]

/* ───────── 場所の きまり ───────── */

/** つくえの てんばん の 上の面(ふだ は ここに のる) */
const DESK_SURFACE = 71
/** ふだ の 大きさと 高さ */
const TABLET_W = 22
const TABLET_H = 17
const TABLET_CY = DESK_SURFACE - TABLET_H / 2
/** ふだの でっぱり / へこみ の 半径 */
const KNOB = 3.2
/** ふだ の まんなか の x: 左(もんだい)・右(へんじ)の はじめ と、くっついた あと */
const A_X: readonly [number, number] = [36, 43]
const B_X: readonly [number, number] = [75, 65]
/** 右の ふだの 「まる」 */
const RING_R = 5.2

/** 子ども: かた の場所(うで は ここから 出る)。あたまの まんなか */
const SHOULDER_L: Pt = [46.5, 57]
const SHOULDER_R: Pt = [62.5, 57]
const HEAD: Pt = [54, 43]
const NECK: Pt = [54, 52]
/** うで の 1ほん ぶんの 長さ(かた→ひじ、ひじ→手 は おなじ長さ) */
const ARM = 9.6

/* ───────── うで ───────── */

/** かた から とどく はんい に 手を おさめる(うで が のびきって ゆがまないように) */
function reachable(shoulder: Pt, target: Pt): Pt {
  const dx = target[0] - shoulder[0]
  const dy = target[1] - shoulder[1]
  const d = Math.hypot(dx, dy)
  const max = ARM * 2 - 0.4
  const k = d > max ? max / d : 1
  return [shoulder[0] + dx * k, shoulder[1] + dy * k]
}

/** かた と 手 が きまれば、ひじ は 2つの うでの 長さ から きまる。外がわ・下がわ に まげる。 */
function elbowFor(shoulder: Pt, hand: Pt, outward: number): Pt {
  const mx = (shoulder[0] + hand[0]) / 2
  const my = (shoulder[1] + hand[1]) / 2
  const dx = hand[0] - shoulder[0]
  const dy = hand[1] - shoulder[1]
  const d = Math.max(Math.hypot(dx, dy), 0.001)
  const h = Math.sqrt(Math.max(ARM * ARM - (d / 2) * (d / 2), 0))
  const a: Pt = [mx + (-dy / d) * h, my + (dx / d) * h]
  const b: Pt = [mx - (-dy / d) * h, my - (dx / d) * h]
  const score = (p: Pt) => outward * (p[0] - shoulder[0]) * 0.3 + (p[1] - shoulder[1])
  return score(a) >= score(b) ? a : b
}

/** かた → ひじ → 手 の じゅんに つながる うで。outward は 体から 外がわ(左うで -1、右うで +1) */
function Arm({ shoulder, target, outward }: { readonly shoulder: Pt; readonly target: Pt; readonly outward: number }) {
  const hand = reachable(shoulder, target)
  const elbow = elbowFor(shoulder, hand, outward)
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={TUNIC_DARK} strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={hand[0]} cy={hand[1]} r="3.2" fill={SKIN} />
    </>
  )
}

const mixPt = (t: number, from: number, to: number, a: Pt, b: Pt, ease = easeInOut): Pt => [mix(t, from, to, a[0], b[0], ease), mix(t, from, to, a[1], b[1], ease)]

/* ───────── じかん から きまる 場所 ───────── */

/** 左の ふだ(もんだい)と 右の ふだ(へんじ)の まんなか x */
const tabletAX = (t: number) => mix(t, JOIN_FROM, JOIN_TO, A_X[0], A_X[1])
const tabletBX = (t: number) => mix(t, JOIN_FROM, JOIN_TO, B_X[0], B_X[1])
/** 右の ふだが つくえの うしろから あがってくる(下へ ずれている ぶん) */
const tabletBDrop = (t: number) => (1 - span(t, IDEA, IDEA + 0.6, easeOut)) * 14
/** 「まる」を かく 進み(0〜1) */
const ringProgress = (t: number) => span(t, WRITE_FROM, WRITE_TO, easeInOut)
/** ふでの さき(まる の上を ぐるっと すすむ) */
function brushTip(t: number): Pt {
  const angle = ringProgress(t) * Math.PI * 2
  return [B_X[0] + RING_R * Math.sin(angle), TABLET_CY - RING_R * Math.cos(angle)]
}
/** ふでを にぎる 手は、さきの 右上 */
const BRUSH_GRIP: Pt = [3.5, -6]
const brushHand = (t: number): Pt => [brushTip(t)[0] + BRUSH_GRIP[0], brushTip(t)[1] + BRUSH_GRIP[1]]

const REST_L: Pt = [41, 69.5]
const REST_R: Pt = [67, 69.5]
const CHEER_L: Pt = [38, 42]
const CHEER_R: Pt = [71, 42]

/** 左手: つくえに おく → ふだに さわる → 2まいを よせる → ばんざい */
function leftHand(t: number): Pt {
  if (t < DROPPED) return REST_L
  if (t < DROPPED + 0.4) return mixPt(t, DROPPED, DROPPED + 0.4, REST_L, [30, 65])
  if (t < JOIN_FROM - 0.2) return [30, 65]
  if (t < JOIN_FROM) return mixPt(t, JOIN_FROM - 0.2, JOIN_FROM, [30, 65], [A_X[0] - 2, 56])
  if (t < CHEER) return [tabletAX(t) - 2, 56]
  return mixPt(t, CHEER, CHEER + 0.5, [A_X[1] - 2, 56], CHEER_L, backOut)
}

/** 右手: ふだを あげる → ふで で かく → 2まいを よせる → ばんざい */
function rightHand(t: number): Pt {
  if (t < IDEA - 0.1) return REST_R
  if (t < IDEA + 0.1) return mixPt(t, IDEA - 0.1, IDEA + 0.1, REST_R, [B_X[0] + 1, 56 + 14])
  if (t < IDEA + 0.6) return [B_X[0] + 1, 56 + tabletBDrop(t)]
  if (t < WRITE_FROM) return mixPt(t, IDEA + 0.6, WRITE_FROM, [B_X[0] + 1, 56], brushHand(WRITE_FROM))
  if (t < WRITE_TO) return brushHand(t)
  if (t < JOIN_FROM) return mixPt(t, WRITE_TO, JOIN_FROM, brushHand(WRITE_TO), [B_X[0] + 2, 56])
  if (t < CHEER) return [tabletBX(t) + 2, 56]
  return mixPt(t, CHEER, CHEER + 0.5, [B_X[1] + 2, 56], CHEER_R, backOut)
}

/* ───────── ばしょ(竹・じめん) ───────── */

function Ground({ t }: SceneProps) {
  return (
    <>
      <path d="M-4 99 Q18 78 44 91 Q72 72 113 93 V101 H-4 Z" fill={HILL} />
      {/* ゆっくり ながれる 雲(おくゆき を出す) */}
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.2} 0)`}>
        <ellipse cx="-2" cy="52" rx="7" ry="3.2" />
        <ellipse cx="3" cy="50" rx="5" ry="3.2" />
        <ellipse cx="92" cy="56" rx="6" ry="2.8" />
        <ellipse cx="96.5" cy="54.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 46, 82, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** 竹の みき。ふしが あり、下から のびる。 */
function Stalk({ x, grow }: { readonly x: number; readonly grow: number }) {
  return (
    <Layer scaleY={grow} origin={[x, 98]}>
      <rect x={x - 2.4} y="8" width="4.8" height="90" rx="2.4" fill={STALK} />
      <rect x={x - 1.4} y="10" width="1.2" height="86" rx="0.6" fill={STALK_LIGHT} />
      {[30, 52, 74].map((y) => (
        <rect key={y} x={x - 2.8} y={y} width="5.6" height="1.8" rx="0.9" fill={STALK_DARK} />
      ))}
    </Layer>
  )
}

/** 竹の えだ と 葉。葉は 画の線(1〜6画目)に そろえる。竹の葉は ほそ長く たれる。 */
function BambooLeaves({ t }: SceneProps) {
  const leaves = span(t, 0.35, 0.95, backOut)
  const sway = wave(t, 3.2) * 1.6
  return (
    <>
      <path d="M12 16 Q20 8 29 12" fill="none" stroke={STALK_DARK} strokeWidth="2" strokeLinecap="round" opacity={leaves} />
      <path d="M97 18 Q84 8 65.6 11.3" fill="none" stroke={STALK_DARK} strokeWidth="2" strokeLinecap="round" opacity={leaves} />
      <Layer scale={leaves} rotate={sway} origin={[29, 12]}>
        {[1, 2, 3].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={n === 2 ? LEAF_DARK : LEAF} width={3.6} />
        ))}
      </Layer>
      <Layer scale={leaves} rotate={-sway} origin={[65.6, 11.3]}>
        {[4, 5, 6].map((n) => (
          <Bone key={n} char={CHAR} n={n} color={n === 5 ? LEAF_DARK : LEAF} width={3.6} />
        ))}
      </Layer>
    </>
  )
}

/** ふわっと おちてくる 竹の葉(にぎやかし) */
function FallingLeaf({ t }: SceneProps) {
  const p = span(t, 4.4, INK - 0.1)
  if (p <= 0) return null
  const x = 22 + p * 6 + Math.sin(p * 9) * 6
  const y = 36 + p * 56
  return <path d="M0 -4 Q1.8 0 0 4 Q-1.8 0 0 -4 Z" fill={LEAF} transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9) * 55 + 20})`} />
}

/* ───────── ふだ ───────── */

const TABLET_CLIP = 'k7b54-above-desk'

type TabletProps = {
  readonly cx: number
  readonly dy?: number
  /** left = でっぱり が ある(もんだい)、right = へこみ が ある(へんじ) */
  readonly side: 'left' | 'right'
  readonly children?: React.ReactNode
}

/** 竹の ふだ(ほそい 竹ひごを ならべて ひもで むすんだ もの)。つくえに たてて おく。 */
function Tablet({ cx, dy = 0, side, children }: TabletProps) {
  const x0 = cx - TABLET_W / 2
  const x1 = cx + TABLET_W / 2
  const y0 = DESK_SURFACE - TABLET_H
  const y1 = DESK_SURFACE
  const my = TABLET_CY
  // へこみ の ある ほう は、ふち を 半円で えぐる
  const body =
    side === 'left'
      ? `M${x0 + 2} ${y0} H${x1 - 2} Q${x1} ${y0} ${x1} ${y0 + 2} V${y1 - 2} Q${x1} ${y1} ${x1 - 2} ${y1} H${x0 + 2} Q${x0} ${y1} ${x0} ${y1 - 2} V${y0 + 2} Q${x0} ${y0} ${x0 + 2} ${y0} Z`
      : `M${x0} ${y0 + 2} Q${x0} ${y0} ${x0 + 2} ${y0} H${x1 - 2} Q${x1} ${y0} ${x1} ${y0 + 2} V${y1 - 2} Q${x1} ${y1} ${x1 - 2} ${y1} H${x0 + 2} Q${x0} ${y1} ${x0} ${y1 - 2} V${my + KNOB} A${KNOB} ${KNOB} 0 0 0 ${x0} ${my - KNOB} Z`
  return (
    <g transform={`translate(0 ${dy})`}>
      <ellipse cx={cx} cy={y1 + 0.6} rx={TABLET_W / 2 + 1} ry="1.4" fill="#000000" opacity="0.14" />
      {side === 'left' && <circle cx={x1} cy={my} r={KNOB} fill={BAMBOO_TABLET} />}
      <path d={body} fill={BAMBOO_TABLET} />
      <rect x={x0 + 1} y={y1 - 2.6} width={TABLET_W - 2} height="2.6" rx="1.2" fill={BAMBOO_TABLET_SHADE} />
      {/* 竹ひご の すきま と、むすぶ ひも */}
      <path d={`M${x0 + 7.3} ${y0 + 1.5} V${y1 - 1.5} M${x0 + 14.7} ${y0 + 1.5} V${y1 - 1.5}`} stroke={BAMBOO_TABLET_SHADE} strokeWidth="0.8" />
      <path d={`M${x0 + 0.6} ${y0 + 4} H${x1 - 0.6} M${x0 + 0.6} ${y1 - 4.6} H${x1 - 0.6}`} stroke={CORD} strokeWidth="1" strokeLinecap="round" />
      {children}
    </g>
  )
}

/** 左の ふだに かいてある「?」(もんだい) */
function QuestionMark({ cx }: { readonly cx: number }) {
  return (
    <g transform={`translate(${cx} ${TABLET_CY - 0.5})`} fill="none" stroke={INK_BROWN} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-3 -3.6 Q-3 -6.6 0 -6.6 Q3 -6.6 3 -3.8 Q3 -1.8 0 -0.6 V1" />
      <circle cx="0" cy="4.2" r="0.4" fill={INK_BROWN} />
    </g>
  )
}

/** 右の ふだに ふで で かく「まる」(へんじ)。p の ぶんだけ。 */
function Ring({ cx, p }: { readonly cx: number; readonly p: number }) {
  if (p <= 0.01) return null
  const d = `M${cx} ${TABLET_CY - RING_R} A${RING_R} ${RING_R} 0 0 1 ${cx} ${TABLET_CY + RING_R} A${RING_R} ${RING_R} 0 0 1 ${cx} ${TABLET_CY - RING_R}`
  return <path d={d} fill="none" stroke={INK_RED} strokeWidth="1.9" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
}

/** ふで。さき が 「まる」の 上、もつ 手が みぎうえ。 */
function Brush({ tip, hand }: { readonly tip: Pt; readonly hand: Pt }) {
  const [hx, hy] = reachable(SHOULDER_R, hand)
  return (
    <>
      <line x1={tip[0]} y1={tip[1]} x2={hx} y2={hy} stroke="#7a5a3a" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r="1.3" fill={INK_RED} />
    </>
  )
}

/* ───────── 子ども ───────── */

type Mood = 'calm' | 'puzzled' | 'idea' | 'focus' | 'joy'

function Face({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="47.2" cy="47.4" r="2" fill={CHEEK} opacity="0.55" />
      <circle cx="60.8" cy="47.4" r="2" fill={CHEEK} opacity="0.55" />
      {mood === 'joy' ? (
        <>
          <path d="M47.6 44.4 Q50 41.4 52.4 44.4 M55.6 44.4 Q58 41.4 60.4 44.4" fill="none" stroke={EYE} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M49.6 47 Q54 54.4 58.4 47 Z" fill={MOUTH} />
          <path d="M51.8 50.6 Q54 49.4 56.2 50.6 Q54 52.4 51.8 50.6 Z" fill="#ff8a8a" />
        </>
      ) : (
        <>
          <circle cx={mood === 'focus' ? 50.5 : 50} cy={mood === 'focus' ? 44.4 : 43.6} r={mood === 'idea' ? 1.7 : 1.3} fill={EYE} />
          <circle cx={mood === 'focus' ? 58.5 : 58} cy={mood === 'focus' ? 44.4 : 43.6} r={mood === 'idea' ? 1.7 : 1.3} fill={EYE} />
          {mood === 'puzzled' && (
            <>
              <path d="M47 40.4 L51.8 38.8 M60.2 38.8 L65 40.4" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <path d="M50.8 49 q1.6 -1.6 3.2 0 t3.2 0" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />
            </>
          )}
          {mood === 'idea' && (
            <>
              <path d="M47.6 39.6 Q50 37.8 52.4 39.6 M55.6 39.6 Q58 37.8 60.4 39.6" fill="none" stroke={HAIR} strokeWidth="1.1" strokeLinecap="round" />
              <ellipse cx="54" cy="48.6" rx="1.6" ry="1.9" fill={MOUTH} />
            </>
          )}
          {mood === 'focus' && <path d="M51.8 48 Q54 49.8 56.2 48" fill="none" stroke={MOUTH} strokeWidth="1.2" strokeLinecap="round" />}
          {mood === 'calm' && <path d="M51.6 48 Q54 49.2 56.4 48" fill="none" stroke={MOUTH} strokeWidth="1.1" strokeLinecap="round" />}
        </>
      )}
    </>
  )
}

/** どう と あたま(うで は べつに、つくえの うえに かさねる)。つくえの うしろに すわっている。 */
function Child({ mood, tilt }: { readonly mood: Mood; readonly tilt: number }) {
  return (
    <>
      <rect x="45" y="53" width="18" height="30" rx="7" fill={TUNIC} />
      <path d="M50 53.4 Q54 58 58 53.4" fill="none" stroke={TUNIC_DARK} strokeWidth="1.6" strokeLinecap="round" />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="51.4" y="50" width="5.2" height="6" rx="2.4" fill={SKIN_SHADE} />
      <Layer rotate={tilt} origin={NECK}>
        <circle cx={HEAD[0]} cy={HEAD[1]} r="9.5" fill={SKIN} />
        <path d="M44 41.6 C43 31.4 50 29.6 55 29.8 C61 29.6 66 34 64 41.6 C62 37 58.5 35.2 54 35.4 C49.5 35.2 46 37 44 41.6 Z" fill={HAIR} />
        <Face mood={mood} />
      </Layer>
    </>
  )
}

/** つくえ。てんばん と、まえの いた。 */
function Desk() {
  return (
    <>
      <rect x="33" y="74" width="44" height="22" rx="3" fill={DESK_FRONT} />
      <path d="M33 85 H77" stroke={DESK_LINE} strokeWidth="1.2" />
      <rect x="26" y={DESK_SURFACE} width="58" height="5" rx="2.5" fill={DESK_TOP} />
    </>
  )
}

/* ───────── にぎやかし ───────── */

/** 竹の ふだを はこんでくる 小鳥。ふだを ひもで ぶらさげる。 */
function Bird({ x, y, t }: { readonly x: number; readonly y: number; readonly t: number }) {
  const flap = wave(t, 0.14) * 28
  return (
    <Layer x={x} y={y}>
      <path d="M2.8 0.4 l4.8 -1.6 l-3.6 3.2 Z" fill={BIRD_DARK} />
      <ellipse cx="0" cy="0" rx="4.2" ry="3.2" fill={BIRD} />
      <circle cx="-3.2" cy="-2.4" r="2.4" fill={BIRD} />
      <path d="M-5.2 -2.5 l-2.6 0.8 l2.4 1 Z" fill="#f2b632" />
      <circle cx="-3.8" cy="-2.9" r="0.55" fill={EYE} />
      <Layer rotate={flap} origin={[0.4, -0.8]}>
        <path d="M-1.4 -0.8 Q1.8 -4 4.4 -0.6 Q1.8 0.8 -1.4 -0.8 Z" fill={BIRD_DARK} />
      </Layer>
    </Layer>
  )
}

/** 「?」: こまって くびを かしげる あいだ、あたまの よこに ふわふわ。 */
function Puzzled({ t }: SceneProps) {
  const show = during(t, DROPPED + 0.2, IDEA, 0.2)
  if (show <= 0) return null
  const bob = wave(t, 0.9) * 1
  const p = span(t, DROPPED + 0.5, IDEA, easeOut)
  return (
    <g opacity={show}>
      <g transform={`translate(82 ${42 + bob})`} fill="none" stroke={THINK} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-3 -4 Q-3 -8 0 -8 Q3.5 -8 3.5 -4.8 Q3.5 -2.5 0 -1.2 V0.6" />
        <circle cx="0" cy="3.6" r="0.4" fill={THINK} />
      </g>
      <path d="M0 -2.4 Q2 0.6 0 2 Q-2 0.6 0 -2.4 Z" fill={SWEAT} transform={`translate(${66.4} ${37 + p * 5})`} opacity={1 - p * 0.5} />
    </g>
  )
}

/** ひらめき: あたまの上に ぴかっと でんきゅう。 */
function Bulb({ t }: SceneProps) {
  const show = during(t, IDEA - 0.1, IDEA + 0.8, 0.15)
  if (show <= 0) return null
  const s = span(t, IDEA - 0.1, IDEA + 0.2, backOut)
  return (
    <Layer opacity={show} scale={s} origin={[54, 25]}>
      <circle cx="54" cy="21" r="3.6" fill="#ffd24a" />
      <rect x="52.4" y="24.4" width="3.2" height="2.6" rx="0.8" fill="#9aa4b2" />
      <path d="M47.4 17 l-2.4 -1.4 M60.6 17 l2.4 -1.4 M54 14.2 v-2.8" stroke="#ffb31f" strokeWidth="1.1" strokeLinecap="round" />
    </Layer>
  )
}

/** ふだが ぴたっ と くっついた しゅんかんの ひかり。 */
function Click({ t }: SceneProps) {
  const p = span(t, JOIN_TO - 0.05, JOIN_TO + 0.6, easeOut)
  if (p <= 0 || p >= 1) return null
  const cx = (A_X[1] + B_X[1]) / 2 + TABLET_W / 2
  return (
    <g opacity={1 - p} stroke="#ffc233" strokeWidth="1.6" strokeLinecap="round">
      {Array.from({ length: 6 }, (_, i) => {
        const a = -Math.PI / 2 + (i / 5) * Math.PI - Math.PI / 2 + Math.PI / 2
        const r1 = 5 + p * 4
        const r2 = 8 + p * 7
        return <line key={i} x1={cx + Math.cos(a) * r1} y1={TABLET_CY + Math.sin(a) * r1} x2={cx + Math.cos(a) * r2} y2={TABLET_CY + Math.sin(a) * r2} />
      })}
    </g>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 12)

  const stalk = span(t, 0, 0.7, backOut)
  // 子どもは つくえの うしろから ひょっこり あらわれる
  const deskIn = span(t, 0.2, 0.6)
  const pop = span(t, 0.6, 1.2, easeOut)
  const cheer = span(t, CHEER, CHEER + 0.3)
  const bob = -Math.abs(wave(t, 0.8)) * 1.3 * cheer
  const mood: Mood = t < DROPPED ? 'calm' : t < IDEA ? 'puzzled' : t < IDEA + 0.6 ? 'idea' : t < JOIN_TO ? 'focus' : 'joy'
  const tilt = t >= DROPPED && t < IDEA ? 7 * span(t, DROPPED, DROPPED + 0.4, easeOut) : 0

  // 小鳥: とんできて、おろして、とびさる
  const p1 = span(t, ARRIVE, LOWER, easeInOut)
  const p2 = span(t, LOWER, DROPPED, easeInOut)
  const BIRD_END_X = A_X[0] - 3
  const p3 = span(t, DROPPED, DROPPED + 0.9, (x) => x * x)
  const birdX = t < DROPPED ? 123 - (123 - BIRD_END_X) * p1 : BIRD_END_X - 60 * p3
  const birdY = t < DROPPED ? 6 + 14 * p1 - Math.sin(p1 * Math.PI) * 5 + 25.5 * p2 : 45.5 - 40 * p3
  const carrying = t >= ARRIVE && t < DROPPED
  // 左の ふだ: 小鳥が ぶらさげて はこぶ → つくえに ストン
  const settle = -Math.sin(span(t, DROPPED, DROPPED + 0.3) * Math.PI) * 1.2
  const aX = carrying ? birdX + 3 : tabletAX(t)
  const aY = carrying ? birdY + 17 - TABLET_CY : settle
  // ふだが くっついた あと、ぽん と はずむ
  const joinBump = 1 + Math.sin(span(t, JOIN_TO, JOIN_TO + 0.3) * Math.PI) * 0.05

  const bDrop = tabletBDrop(t)
  const ring = ringProgress(t)
  const brushing = during(t, IDEA + 0.5, WRITE_TO + 0.3, 0.2)

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Stalk x={12} grow={stalk} />
        <Stalk x={97} grow={stalk} />
        <BambooLeaves t={t} />
        <FallingLeaf t={t} />

        <Layer opacity={pop > 0 ? 1 : 0} y={(1 - pop) * 40 + bob} origin={[54, 80]}>
          <Child mood={mood} tilt={tilt} />
        </Layer>
        <Layer opacity={deskIn}>
          <Desk />
        </Layer>

        <defs>
          <clipPath id={TABLET_CLIP}>
            <rect x="0" y="0" width="109" height={DESK_SURFACE} />
          </clipPath>
        </defs>
        <Layer opacity={deskIn} scale={joinBump} origin={[55, DESK_SURFACE]}>
          {/* もんだい(左): でっぱり と「?」 */}
          {t >= ARRIVE && (
            <g transform={`translate(${aX - tabletAX(0)} 0)`}>
              <Tablet cx={A_X[0]} dy={aY} side="left">
                <QuestionMark cx={A_X[0]} />
              </Tablet>
            </g>
          )}
          {/* へんじ(右): へこみ と「まる」。つくえの うしろから あがってくる */}
          {t >= IDEA - 0.1 && (
            <g clipPath={`url(#${TABLET_CLIP})`}>
              <g transform={`translate(${tabletBX(t) - B_X[0]} 0)`}>
                <Tablet cx={B_X[0]} dy={bDrop} side="right">
                  <Ring cx={B_X[0]} p={ring} />
                </Tablet>
              </g>
            </g>
          )}
        </Layer>
        {/* ぶらさげる ひも */}
        {carrying && <path d={`M${birdX} ${birdY + 3} L${aX} ${DESK_SURFACE - TABLET_H + aY}`} stroke="#6b4a36" strokeWidth="0.8" strokeLinecap="round" />}
        {t >= ARRIVE && t < DROPPED + 0.95 && <Bird x={birdX} y={birdY} t={t} />}

        {/* ふで(うで の うしろ)、そして りょううで */}
        {brushing > 0 && (
          <g opacity={brushing}>
            <Brush tip={brushTip(t)} hand={brushHand(t)} />
          </g>
        )}
        <Layer opacity={span(t, 0.9, 1.2)} y={bob}>
          <Arm shoulder={SHOULDER_L} target={leftHand(t)} outward={-1} />
          <Arm shoulder={SHOULDER_R} target={rightHand(t)} outward={1} />
        </Layer>

        <Puzzled t={t} />
        <Bulb t={t} />
        <Click t={t} />
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
    { at: 0, label: '竹が そだつ。子どもが つくえに つく', sound: 'pop' },
    { at: ARRIVE, label: '小鳥が 竹の ふだ(「?」の もんだい)を はこんでくる' },
    { at: DROPPED, label: 'ふだが つくえに ついて、子どもは「?」と こまる', sound: 'pop' },
    { at: IDEA, label: 'あっ と ひらめく。もう1まいの ふだを だす' },
    { at: WRITE_FROM, label: 'ふでで「まる」の へんじを かく' },
    { at: JOIN_FROM, label: '2まいを よせると ぴったり あう!', sound: 'ok' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '答 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
