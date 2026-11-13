/*
 * 文(ぶん): 人の むねに もようが かいて ある。もようから 字に なった。
 *
 * ほね(画と絵の対応)
 *   1〜4画     … 人の むねに ふでで かいた もよう(1画目 てん・2画目 よこ・3画目 4画目 ななめの ばつ)
 *                 むねの もようが 大きく ふくらんで、字の形に なる
 *   2画目(一)  … さいごに こどもが りょううでを よこに ひろげたとき、うで が この線に だいたい 重なる
 *
 * ながれ
 *   むねに もようが ない こどもが しょんぼり(ふきだしに ほしい もよう)
 *   → もようを かく おじいさんが ふで を もって あるいてくる
 *   → てん・よこ・ななめ ふたつ の じゅんに、ふで で むねに かいていく(こどもは くすぐったくて にこにこ)
 *   → こどもは うれしくて りょううでを ひろげて「ほら!」と みせる
 *   → むねの もようが ぐんぐん 大きくなり、ほね が ひかって、絵が うすくなって 字「文」に なる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。くび は みじかく どう の まんなか の上。
 *   ふでを もつ うで は、かた・ひじ・手 を つないで 手が ふでの さきに とどくように 曲がる(おじいさんは からだを かたむけて とどかせる)。
 *   字の形に そろうのは、こどもが うでを ひろげて、もようが 大きくなった さいごの しゅんかん だけ。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeIn, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '文'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const SHORTS = '#4f9be0'
const SHORTS_DARK = '#3c82c4'
const SHOE = '#6b4a36'
const PAINT = '#d9463f'
const ELDER_TUNIC = '#5aa36a'
const ELDER_TUNIC_DARK = '#488a58'
const ELDER_PANTS = '#7a6040'
const ELDER_HAIR = '#d7d7de'
const BELT = '#8c5b3c'
const POT = '#c75a3a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SUN = '#ffd24a'

/** くぎり の時間(秒) */
const ELDER_IN = 0.9
const ELDER_HERE = 1.7
const PAINT_AT = 2.1
const PAINT_END = 5.5
const BRUSH_AWAY = 5.8
const CHEER = 5.8
/** おじいさんが かえって から、りょううでを ひろげて「ほら!」と みせる */
const ARMS = 6.6
const GROW = 6.7
const INK = 7.5
const DONE = 10.4
const DURATION = 11

/* ───────── もよう(むねに かく 文) ───────── */

/** 字の まんなか と、むねの もようの まんなか */
const GLYPH_CENTER: readonly [number, number] = [54.5, 53.5]
const CHEST_CENTER: readonly [number, number] = [53, 47.5]
/** むねに かいた ときの 大きさ(字の 0.26 ばい) */
const CHEST_SCALE = 0.26
/** もようの 線の ふとさ(字の 大きさで) */
const PAINT_WIDTH = 6.2

type Point = readonly [number, number]

/** 画の とおり道(scene-info の 点)。ふでの さきを うごかすのに つかう */
const STROKE_POINTS: readonly (readonly Point[])[] = [
  [[51.6, 12.8], [52.9, 14.7], [53.3, 17], [53.3, 19.4], [53.3, 21.8], [53.3, 24.2], [53.2, 26.5], [53.2, 28.9]],
  [[16.9, 32.7], [27.4, 33], [38, 31.8], [48.5, 30.5], [59.1, 29.3], [69.6, 28.2], [80.2, 27.3], [90.8, 27.8]],
  [[69.9, 32.5], [66.8, 43.6], [61.1, 53.9], [54.3, 63.4], [46.6, 72.3], [38, 80.4], [28.7, 87.6], [18.8, 93.8]],
  [[31, 43.8], [40.1, 50], [48.2, 57.7], [56.2, 65.4], [64.4, 73], [72.9, 80.2], [81.8, 86.9], [91.7, 91.9]],
]

/** それぞれの画を かく時間(画と画の あいだに、ふでを うかせる 0.15 秒) */
const STROKE_TIMES: readonly (readonly [number, number])[] = [
  [2.1, 2.5],
  [2.65, 3.4],
  [3.55, 4.5],
  [4.65, 5.5],
]

/** 字の 点 → むねの 上の 点 */
const toChest = ([x, y]: Point): Point => [CHEST_CENTER[0] + (x - GLYPH_CENTER[0]) * CHEST_SCALE, CHEST_CENTER[1] + (y - GLYPH_CENTER[1]) * CHEST_SCALE]

/** 画の とちゅう(0〜1)の 点 */
function pointOn(points: readonly Point[], u: number): Point {
  const f = Math.min(Math.max(u, 0), 1) * (points.length - 1)
  const i = Math.min(Math.floor(f), points.length - 2)
  const k = f - i
  return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i + 1][1] + (points[i + 1][1] - points[i][1]) * k]
}

const lerpPoint = (a: Point, b: Point, k: number): Point => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]

/** ふでを もつ手の いちばん らくな ところ(うでを おろして もつ) */
const BRUSH_REST_HAND: Point = [76, 59]
/** 手から ふでの さきまで(ふでは 手の 右下から 左上へ のびる) */
const BRUSH_OFFSET: Point = [4, 1.5]

/** ふでの さき の いちばん 今の いち。かく前は 下がっていて、かいたあとは また おろす */
function brushTip(t: number): Point {
  const rest: Point = [BRUSH_REST_HAND[0] - BRUSH_OFFSET[0], BRUSH_REST_HAND[1] - BRUSH_OFFSET[1]]
  const first = toChest(STROKE_POINTS[0][0])
  const last = toChest(STROKE_POINTS[3][7])
  if (t < STROKE_TIMES[0][0]) return lerpPoint(rest, first, span(t, STROKE_TIMES[0][0] - 0.35, STROKE_TIMES[0][0], easeInOut))
  for (let i = 0; i < STROKE_TIMES.length; i += 1) {
    const [from, to] = STROKE_TIMES[i]
    if (t <= to) return toChest(pointOn(STROKE_POINTS[i], span(t, from, to)))
    const next = STROKE_TIMES[i + 1]
    if (next && t < next[0]) {
      return lerpPoint(toChest(STROKE_POINTS[i][7]), toChest(STROKE_POINTS[i + 1][0]), span(t, to, next[0], easeInOut))
    }
  }
  return lerpPoint(last, rest, span(t, PAINT_END, BRUSH_AWAY, easeInOut))
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
      {/* とおくの おか と、ゆっくり ながれる 雲(おくゆき を出す) */}
      <path d="M-4 99 Q18 74 44 90 Q72 68 113 93 V101 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity="0.9" transform={`translate(${t * 1.6} 0)`}>
        <ellipse cx="22" cy="40" rx="6" ry="2.8" />
        <ellipse cx="26.5" cy="38.4" rx="4.2" ry="2.8" />
        <ellipse cx="88" cy="48" rx="6" ry="2.8" />
        <ellipse cx="92.5" cy="46.4" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="98" rx="51" ry="5.6" fill={GRASS} />
      {[8, 30, 76, 100].map((x) => (
        <path key={x} d={`M${x} 97.5 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
    </>
  )
}

/** ひらひら とぶ ちょうちょ(にぎやかし) */
function Butterfly({ t }: SceneProps) {
  const show = during(t, 2.4, 7.0, 0.3)
  if (show <= 0) return null
  const x = 18 + wave(t, 3.1) * 6
  const y = 74 + wave(t, 1.7) * 4
  const flap = 0.35 + 0.65 * Math.abs(wave(t, 0.4))
  return (
    <g opacity={show}>
      <Layer x={x} y={y} scaleX={flap}>
        <ellipse cx="-2.2" cy="-0.8" rx="2.6" ry="2" fill="#f07f9e" />
        <ellipse cx="2.2" cy="-0.8" rx="2.6" ry="2" fill="#f07f9e" />
        <ellipse cx="-1.6" cy="1.4" rx="1.8" ry="1.4" fill="#f5a9bd" />
        <ellipse cx="1.6" cy="1.4" rx="1.8" ry="1.4" fill="#f5a9bd" />
      </Layer>
      <rect x={x - 0.4} y={y - 2} width="0.8" height="4.4" rx="0.4" fill="#5a3b2a" />
    </g>
  )
}

/* ───────── こども(主役) ───────── */

type Mood = 'worried' | 'curious' | 'ticklish' | 'proud'
type ArmPose = { readonly swing: number; readonly bend: number }

/** こどもの かた・うでの ながさ(かた から ひじ、ひじ から 手) */
const L_SHOULDER: Point = [43.2, 32.5]
const R_SHOULDER: Point = [62.8, 32.5]
const KID_ARM_PART = 12.5

/**
 * かた から出て、ひじ で まがる うで。side は 左(-1)・右(1)。
 * swing は ま下から 外へ ふった角度、bend は ひじ の まがり(外むき)。
 */
function KidArm({ shoulder, side, pose }: { readonly shoulder: Point; readonly side: -1 | 1; readonly pose: ArmPose }) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const elbow: Point = [shoulder[0] + side * Math.sin(rad(pose.swing)) * KID_ARM_PART, shoulder[1] + Math.cos(rad(pose.swing)) * KID_ARM_PART]
  const fore = pose.swing + pose.bend
  const hand: Point = [elbow[0] + side * Math.sin(rad(fore)) * KID_ARM_PART, elbow[1] + Math.cos(rad(fore)) * KID_ARM_PART]
  return (
    <>
      <path d={`M${shoulder[0]} ${shoulder[1]} L${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shoulder[0]} cy={shoulder[1] + 0.6} r="3.2" fill={SKIN} />
      <circle cx={hand[0]} cy={hand[1]} r="3.1" fill={SKIN} />
    </>
  )
}

function KidFace({ mood }: { readonly mood: Mood }) {
  return (
    <>
      <circle cx="53" cy="16.5" r="8.8" fill={SKIN} />
      <path d="M44.4 16 C43.6 6.4 62.4 6.4 61.6 16 C59 12.6 56 11.6 53 11.8 C50 11.6 47 12.6 44.4 16 Z" fill={HAIR} />
      <circle cx="53" cy="6.8" r="2.6" fill={HAIR} />
      <circle cx="46.8" cy="21" r="2" fill="#ff9d9d" opacity="0.55" />
      <circle cx="59.2" cy="21" r="2" fill="#ff9d9d" opacity="0.55" />
      {mood === 'worried' && (
        <>
          <path d="M47.4 15.8 l3.2 -1 M58.6 15.8 l-3.2 -1" stroke={HAIR} strokeWidth="1" strokeLinecap="round" />
          <circle cx="49.6" cy="18.6" r="1.2" fill="#2b2b2b" />
          <circle cx="56.4" cy="18.6" r="1.2" fill="#2b2b2b" />
          <path d="M51.4 23.4 Q53 21.8 54.6 23.4" fill="none" stroke="#b9483f" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}
      {mood === 'curious' && (
        <>
          <circle cx="50.4" cy="17.6" r="1.25" fill="#2b2b2b" />
          <circle cx="57.2" cy="17.6" r="1.25" fill="#2b2b2b" />
          <path d="M50.8 21.8 Q53.4 24.4 56 21.8" fill="none" stroke="#b9483f" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
      {mood === 'ticklish' && (
        <>
          <path d="M48.4 18 Q49.8 16.2 51.2 18 M54.8 18 Q56.2 16.2 57.6 18" fill="none" stroke="#2b2b2b" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M50 21.2 Q53 26 56 21.2 Z" fill="#b9483f" />
        </>
      )}
      {mood === 'proud' && (
        <>
          <circle cx="49.6" cy="17.6" r="1.3" fill="#2b2b2b" />
          <circle cx="56.4" cy="17.6" r="1.3" fill="#2b2b2b" />
          <circle cx="49.2" cy="17.1" r="0.45" fill="#ffffff" />
          <circle cx="56" cy="17.1" r="0.45" fill="#ffffff" />
          <path d="M49.4 21 Q53 27.2 56.6 21 Z" fill="#b9483f" />
          <path d="M51.2 24.4 Q53 23.4 54.8 24.4 Q53 26 51.2 24.4 Z" fill="#ff8a8a" />
        </>
      )}
    </>
  )
}

type KidProps = {
  readonly mood: Mood
  readonly leftArm: ArmPose
  readonly rightArm: ArmPose
  readonly headTilt: number
  readonly puff: number
}

/** むねに もようが ある こども。 children は むねの もよう(どうの 上に かさねる) */
function Kid({ mood, leftArm, rightArm, headTilt, puff, children }: KidProps & { readonly children: ReactNode }) {
  return (
    <>
      {/* あし(すこし ひらいて 立つ) */}
      <rect x="44.4" y="64" width="6.6" height="29" rx="3.3" fill={SKIN} />
      <rect x="55" y="64" width="6.6" height="29" rx="3.3" fill={SKIN} />
      <ellipse cx="46.2" cy="93.6" rx="5.4" ry="2.8" fill={SHOE} />
      <ellipse cx="59.8" cy="93.6" rx="5.4" ry="2.8" fill={SHOE} />
      {/* くび: みじかく、どう と あたま の間 */}
      <rect x="50.4" y="23" width="5.2" height="10" rx="2.4" fill={SKIN_SHADE} />
      {/* どう(はだか。むねを ふくらませると 少し 大きくなる) */}
      <Layer scaleX={1 + puff * 0.04} scaleY={1 + puff * 0.02} origin={[53, 60]}>
        <rect x="42" y="30.5" width="22" height="31" rx="7" fill={SKIN} />
        <path d="M42 56.5 H64 V63 Q64 69 58 69 H48 Q42 69 42 63 Z" fill={SHORTS} />
        <path d="M43 59.4 H63" stroke={SHORTS_DARK} strokeWidth="1.4" strokeLinecap="round" />
        {children}
      </Layer>
      <KidArm shoulder={L_SHOULDER} side={-1} pose={leftArm} />
      <KidArm shoulder={R_SHOULDER} side={1} pose={rightArm} />
      <Layer rotate={headTilt} origin={[53, 26]}>
        <KidFace mood={mood} />
      </Layer>
    </>
  )
}

/** むねの もよう。strokes は 各画を どこまで かいたか(0〜1) */
function ChestPattern({ progress, opacity = 1 }: { readonly progress: readonly number[]; readonly opacity?: number }) {
  return (
    <>
      {progress.map((to, i) => (
        <Bone key={i} char={CHAR} n={i + 1} color={PAINT} width={PAINT_WIDTH} to={to} opacity={opacity} />
      ))}
    </>
  )
}

/* ───────── おじいさん(もようを かく人) ───────── */

/** おじいさんの 足もと と かた(ほんとうの 立ち姿の とき) */
const ELDER_X = 80
const ELDER_FEET: Point = [ELDER_X, 94]
const ELDER_SHOULDER: Point = [79, 38]
const ELDER_ARM_PART = 17

/** てまえの うで: かた → ひじ → 手 の じゅんに つなぐ。手が とどかなければ のばしきる */
function elderElbow(hand: Point): Point {
  const dx = hand[0] - ELDER_SHOULDER[0]
  const dy = hand[1] - ELDER_SHOULDER[1]
  const dist = Math.min(Math.hypot(dx, dy), ELDER_ARM_PART * 2 - 0.05)
  const ux = dx / (Math.hypot(dx, dy) || 1)
  const uy = dy / (Math.hypot(dx, dy) || 1)
  const h = Math.sqrt(ELDER_ARM_PART ** 2 - (dist / 2) ** 2)
  // ひじは かならず 下むき(うでの おもさで 下がる)
  const px = -uy
  const py = ux
  const sign = py >= 0 ? 1 : -1
  return [ELDER_SHOULDER[0] + ux * (dist / 2) + px * sign * h, ELDER_SHOULDER[1] + uy * (dist / 2) + py * sign * h]
}

type ElderProps = { readonly step: number; readonly hand: Point; readonly painting: boolean }

function Elder({ step, hand, painting }: ElderProps) {
  const elbow = elderElbow(hand)
  const tip: Point = [hand[0] - BRUSH_OFFSET[0], hand[1] - BRUSH_OFFSET[1]]
  return (
    <>
      {/* むこうの うで: だらんと さがる */}
      <path d="M80.5 40 L84 56" fill="none" stroke={ELDER_TUNIC_DARK} strokeWidth="5" strokeLinecap="round" />
      <circle cx="84" cy="57" r="2.6" fill={SKIN_SHADE} />
      {/* あし(あるくとき かわりばんこに ふる) */}
      <Layer rotate={-step * 18} origin={[82, 70]}>
        <rect x="79" y="70" width="5.6" height="22.6" rx="2.8" fill={ELDER_PANTS} />
        <ellipse cx="80.6" cy="93.6" rx="5" ry="2.7" fill={SHOE} />
      </Layer>
      <Layer rotate={step * 18} origin={[77, 70]}>
        <rect x="74.6" y="70" width="5.6" height="22.6" rx="2.8" fill="#6a5238" />
        <ellipse cx="73.4" cy="93.6" rx="5" ry="2.7" fill={SHOE} />
      </Layer>
      {/* どう と、こしの ぬりもの いれ */}
      <rect x="74" y="37" width="12" height="35" rx="6" fill={ELDER_TUNIC} />
      <rect x="74" y="62" width="12" height="3" fill={BELT} />
      <circle cx="87.4" cy="66.4" r="3.4" fill={POT} />
      <ellipse cx="87.4" cy="63.6" rx="2.2" ry="0.9" fill={PAINT} />
      {/* くび と あたま(左むき) */}
      <rect x="75.4" y="31" width="5.4" height="8" rx="2.4" fill={SKIN_SHADE} />
      <circle cx="77.6" cy="27.4" r="8" fill={SKIN} />
      <path d="M69.6 25.4 C69.4 17 82 17 85.6 25 C84.4 22.6 81 21 77.6 21 C74 21 71 22.8 69.6 25.4 Z" fill={ELDER_HAIR} />
      <circle cx="84.2" cy="19.2" r="3.2" fill={ELDER_HAIR} />
      <path d="M70 23 Q77.6 19.6 85.4 23" fill="none" stroke={PAINT} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="73.6" cy="27.6" r="1.1" fill="#2b2b2b" />
      <circle cx="69.8" cy="29.4" r="1.5" fill={SKIN_SHADE} />
      <path d="M72 31.6 Q73.4 37.8 78.4 37.6 Q84 36.8 85 30.4 Q79 34 72 31.6 Z" fill={ELDER_HAIR} />
      <path d="M72.4 30.8 q1.8 1 3.2 0" fill="none" stroke="#b9483f" strokeWidth="1" strokeLinecap="round" />
      {/* てまえの うで と ふで */}
      <path d={`M${ELDER_SHOULDER[0]} ${ELDER_SHOULDER[1] + 1} L${elbow[0]} ${elbow[1]}`} fill="none" stroke={ELDER_TUNIC} strokeWidth="5.4" strokeLinecap="round" />
      <path d={`M${elbow[0]} ${elbow[1]} L${hand[0]} ${hand[1]}`} fill="none" stroke={SKIN} strokeWidth="4.2" strokeLinecap="round" />
      <path d={`M${hand[0]} ${hand[1]} L${tip[0]} ${tip[1]}`} fill="none" stroke="#8c5b3c" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx={tip[0]} cy={tip[1]} r="1.5" fill={PAINT} />
      <circle cx={hand[0]} cy={hand[1]} r="2.5" fill={SKIN} />
      {painting && <circle cx={tip[0]} cy={tip[1]} r="0.7" fill="#ffffff" opacity="0.5" />}
    </>
  )
}

/** ふきだし: むねに もようが ほしい */
function Wish({ t }: SceneProps) {
  const show = during(t, 0.3, 1.45, 0.2)
  if (show <= 0) return null
  const pop = backOut(span(t, 0.3, 0.6))
  return (
    <g opacity={show}>
      <circle cx="62" cy="19.4" r="1.6" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <circle cx="66" cy="15.4" r="2.4" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.6" />
      <Layer x={75} y={11} scale={Math.max(0, pop)} origin={[0, 0]}>
        <ellipse cx="0" cy="0" rx="10" ry="8" fill="#ffffff" stroke="#c9d6e6" strokeWidth="0.7" />
        <Layer x={-GLYPH_CENTER[0] * 0.16} y={-GLYPH_CENTER[1] * 0.16} scale={0.16}>
          {[1, 2, 3, 4].map((n) => (
            <Bone key={n} char={CHAR} n={n} color={PAINT} width={8} />
          ))}
        </Layer>
      </Layer>
    </g>
  )
}

/** うれしくて とびはねる しゅんかん の「ぱっ」という 線 */
function Cheer({ t }: SceneProps) {
  const show = during(t, CHEER + 0.1, CHEER + 1.3, 0.2)
  if (show <= 0) return null
  const k = span(t, CHEER + 0.1, CHEER + 0.6, easeOut)
  return (
    <g opacity={show} stroke="#ffb02e" strokeWidth="1.3" strokeLinecap="round">
      {[-1, 1].map((side) =>
        [-24, 0, 24].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180
          const near = 12 + k * 2
          const far = 16 + k * 3
          return <path key={`${side}${deg}`} d={`M${53 + side * Math.cos(rad) * near + side * 4} ${16.5 + Math.sin(rad) * near} L${53 + side * Math.cos(rad) * far + side * 4} ${16.5 + Math.sin(rad) * far}`} />
        }),
      )}
    </g>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 4)

  // こども: しょんぼり → おじいさんに きづく → くすぐったい → うれしい
  const mood: Mood = t < 1.3 ? 'worried' : t < PAINT_AT ? 'curious' : t < CHEER ? 'ticklish' : 'proud'
  const tickle = during(t, PAINT_AT, PAINT_END, 0.2)
  const arm = span(t, ARMS, ARMS + 0.6, backOut)
  const hangL = 6 + wave(t, 0.3) * 2.5 * tickle
  const hangR = 6 - wave(t, 0.3) * 2.5 * tickle
  const leftArm: ArmPose = { swing: hangL + (88 - hangL) * arm, bend: 4 * (1 - arm) }
  const rightArm: ArmPose = { swing: hangR + (102 - hangR) * arm, bend: 4 * (1 - arm) }
  const headTilt = t < 1.3 ? 3 : tickle > 0 ? wave(t, 0.3) * 3 * tickle : mix(t, CHEER, CHEER + 0.4, 0, -2)
  const puff = span(t, CHEER, CHEER + 0.5) * (1 - span(t, GROW + 0.8, GROW + 1.2))
  const hop = Math.sin(span(t, CHEER + 0.15, CHEER + 0.6) * Math.PI) * 3
  const worry = t < 1.3 ? wave(t, 1.6) : 0

  // もよう: 画ごとに かけた度合い。そのあと むねの もよう は のこし、大きな もよう が ふくらむ
  const progress = STROKE_TIMES.map(([from, to]) => span(t, from, to))
  const grow = span(t, GROW, INK - 0.1, easeInOut)
  const bigScale = mix(t, GROW, INK - 0.1, CHEST_SCALE, 1, easeInOut)
  const bigX = (1 - grow) * (CHEST_CENTER[0] - GLYPH_CENTER[0])
  const bigY = (1 - grow) * (CHEST_CENTER[1] - GLYPH_CENTER[1])
  const bigOpacity = span(t, GROW, GROW + 0.25) * 0.9

  // おじいさん: みぎ から あるいてきて、かく。かきおわったら むきを かえて かえる
  const walkingIn = t >= ELDER_IN && t < ELDER_HERE
  const walkingOut = t >= BRUSH_AWAY + 0.15
  const stride = walkingIn || walkingOut ? Math.sin(t * Math.PI * 2 * 1.8) * (walkingIn ? 1 - span(t, ELDER_HERE - 0.25, ELDER_HERE) : 1) : 0
  const elderX = t < BRUSH_AWAY ? mix(t, ELDER_IN, ELDER_HERE, 40, 0, easeOut) : mix(t, BRUSH_AWAY + 0.15, BRUSH_AWAY + 1.1, 0, 40, easeIn)
  const facing = mix(t, BRUSH_AWAY, BRUSH_AWAY + 0.15, 1, -1)
  const bob = -Math.abs(stride) * 1.3
  const brushing = t >= ELDER_HERE + 0.05 && t < BRUSH_AWAY
  const tip = brushTip(t)
  const target: Point = brushing ? [tip[0] + BRUSH_OFFSET[0], tip[1] + BRUSH_OFFSET[1]] : [BRUSH_REST_HAND[0] + stride * 5, BRUSH_REST_HAND[1]]
  // ほんとうに 遠い所に 手を のばすとき、おじいさんは あしを じくに からだを かたむける
  const wantShoulder = Math.min(Math.max(target[0] + 25, 66), ELDER_SHOULDER[0])
  const lean = brushing ? (Math.asin(Math.max(-1, Math.min(1, (wantShoulder - ELDER_X + 1) / 56))) * 180) / Math.PI : 0
  // かたむけた からだの 中で 手が ある ばしょ(かたむきを もとにもどした いち)
  const leanRad = (-lean * Math.PI) / 180
  const dx = target[0] - ELDER_FEET[0]
  const dy = target[1] - ELDER_FEET[1]
  const localHand: Point = brushing ? [ELDER_FEET[0] + dx * Math.cos(-leanRad) - dy * Math.sin(-leanRad), ELDER_FEET[1] + dx * Math.sin(-leanRad) + dy * Math.cos(-leanRad)] : target
  const painting = brushing && t >= STROKE_TIMES[0][0] && t <= PAINT_END

  return (
    <>
      <Layer opacity={ink.picture}>
        <Ground t={t} />
        <Butterfly t={t} />
        <ellipse cx="53" cy="97.4" rx="12" ry="2.4" fill="#000000" opacity="0.12" />
        <Layer y={-hop} x={worry * 0.2}>
          <Kid mood={mood} leftArm={leftArm} rightArm={rightArm} headTilt={headTilt} puff={puff}>
            <Layer x={CHEST_CENTER[0] - GLYPH_CENTER[0]} y={CHEST_CENTER[1] - GLYPH_CENTER[1]} scale={CHEST_SCALE} origin={GLYPH_CENTER}>
              <ChestPattern progress={progress} />
            </Layer>
            <Layer x={bigX} y={bigY} scale={bigScale} origin={GLYPH_CENTER} opacity={bigOpacity}>
              <ChestPattern progress={[1, 1, 1, 1]} />
            </Layer>
          </Kid>
        </Layer>
        <Wish t={t} />
        <Cheer t={t} />
        <ellipse cx={ELDER_X + elderX} cy="97.4" rx="9" ry="2.2" fill="#000000" opacity="0.12" />
        <Layer x={elderX} y={bob} scaleX={facing} origin={[ELDER_X, 60]}>
          <Layer rotate={-lean} origin={ELDER_FEET}>
            <Elder step={stride} hand={localHand} painting={painting} />
          </Layer>
        </Layer>
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
    { at: 0, label: 'むねに もようが ない こどもが しょんぼり', sound: 'pop' },
    { at: ELDER_IN, label: 'ふでを もった おじいさんが あるいてくる' },
    { at: PAINT_AT, label: 'むねに もようを かく(てん・よこ・ななめ)', sound: 'stroke' },
    { at: CHEER, label: 'うれしくて とびはねる', sound: 'pop' },
    { at: ARMS, label: 'うでを ひろげて「ほら!」', sound: 'pop' },
    { at: GROW, label: 'むねの もようが 大きく なる' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '文 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
