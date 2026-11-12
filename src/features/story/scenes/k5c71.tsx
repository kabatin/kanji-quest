/*
 * 山(やま): たかい みねが みっつ ならぶ。まんなかが いちばん たかい。
 *
 * ほね(画と絵の対応)
 *   1画目(丨)  … まんなかの 山の りょうせん(てっぺんから ふもとへ おりる、日なた と ひかげ の さかいめ)
 *   2画目(𠃊)  … 左の 山の りょうせん から、ふもと(山すそ と のはら の さかいめ)を 右へ
 *   3画目(丨)  … 右の 山の りょうせん
 *
 * ながれ
 *   のはら に 日が さす → 左・右の 山が ぽこっ ぽこっ と せりあがり、さいごに まんなかの 山が 雲の上まで ぐーんと のびる
 *   → 子どもが あるいてきて、みねを ひとつずつ ゆびさして かぞえる(まんなかは まうえ を ゆびさす)
 *   → ふりむいて ばんざい → ほね が ひかって、絵が うすくなり、字「山」が のこる
 *
 * 山は、ほんものの 山の つくり を守る:
 *   すそ が ひろがった 三角で、日は 左上から さすので、りょうせん の 左が 日なた・右が ひかげ。
 *   いちばん たかい まんなかの 山にだけ 雪が のこり、雲は その 中ほどに かかる。
 * 子どもは 山より ずっと てまえ に いるので 大きめに見えるが、体の つくり は ほんものどおり
 * (うで は かた から出て ひじ で まがる。ゆびさす うで は、ほんとうに その みね の ほうを むく)。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { BoneGlow, Ink, Layer, Sparkles, Star } from '../sceneParts'

const CHAR = '山'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const HAIR = '#5a3b2a'
const HAT = '#ffd24a'
const HAT_DARK = '#eab52c'
const SHIRT = '#4f9be0'
const SHORTS = '#3e5c86'
const SOCK = '#ffffff'
const SHOE = '#6b4a36'
const PACK = '#e8534a'
const PACK_DARK = '#c9433b'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
/** まんなかの 山(とおくて 大きい): すこし 青みの ある みどり */
const FAR_LIT = '#86c79a'
const FAR_SHADE = '#62a67f'
/** 左右の 山(てまえ): こい みどり */
const NEAR_LIT = '#55b86e'
const NEAR_SHADE = '#3f9c59'
const SNOW = '#ffffff'
const SNOW_SHADE = '#d7e6f2'
const GRASS = '#c5e8a9'
const GRASS_NEAR = '#b3df95'
const LEAF = '#55b86e'
const SUN = '#ffd24a'
const DUST = '#f4ecdc'

/** くぎり の時間(秒) */
const RISE_L = 0.25
const RISE_R = 0.75
const RISE_M = 1.3
/** 子どもが あるいてくる・立ちどまる */
const WALK = 2.3
const STOP = 3.3
/** みねを ひとつずつ ゆびさす */
const COUNT_1 = 3.35
/** まんなか(いちばん たかい)を さす 時間は、少し 長く とる */
const COUNT_2 = 3.95
const COUNT_3 = 4.7
/** ふりむいて ばんざい(はねおわってから 字になる) */
const TURN = 5.4
const CHEER = 5.72
const INK = 6.5
const DONE = 9.1
const DURATION = 9.75

type Point = readonly [number, number]
type Side = -1 | 1

const r2 = (n: number) => Math.round(n * 100) / 100
const pt = ([x, y]: Point) => `${r2(x)} ${r2(y)}`

/* ───────── 山の かたち ───────── */

/** 山 1つぶんの形 */
type Peak = {
  /** みねの てっぺん */
  readonly top: Point
  /** ふもと(のはら に かくれる 高さ) */
  readonly foot: number
  /** ふもと での はば の半分 */
  readonly half: number
  /** 山はだ の まっすぐさ(1 = まっすぐな 三角。小さいほど すそ が ひろがる) */
  readonly straight: number
  /** りょうせん: てっぺん から ふもと まで、画の線に そって おりる(SVG の C・L の つづき) */
  readonly ridge: string
}

/** てっぺん を まるくする 長さ(とがりすぎない ように) */
const ROUND = 1.8

/** 1画目の 書きはじめの まがり(まんなかの 山の てっぺん の すぐ下)。雪の かげ にも使う */
const MIDDLE_RIDGE_TOP = 'C53.98 16.5 54.75 19 54.75 21.25'
/** 1画目の たて線の x(雪の ふち が りょうせん と まじわる所) */
const MIDDLE_RIDGE_X = 54.74

/** まんなかの 山: いちばん たかい。てっぺん は 1画目の 書きはじめ */
const MIDDLE: Peak = { top: [52.6, 14.2], foot: 90, half: 44, straight: 0.6, ridge: `${MIDDLE_RIDGE_TOP} L54.5 90` }
/** 左の 山: てっぺん は 2画目の 書きはじめ。りょうせん は 2画目の たての ぶぶん */
const LEFT: Peak = {
  top: [21.5, 53.6],
  foot: 90,
  half: 27,
  straight: 0.6,
  ridge: 'C22.37 55.38 22.88 56.75 22.75 58.25 C22.17 65.24 21.75 74.25 20.25 81.25 L19.9 90',
}
/** 右の 山: てっぺん は 3画目の 書きはじめ */
const RIGHT: Peak = {
  top: [89.24, 48.1],
  foot: 90,
  half: 26,
  straight: 0.6,
  ridge: 'C90.18 49.94 90.88 51.38 90.75 53.25 C90.5 56.93 88.92 73.55 88.2 82.02 L87.6 90',
}

/** 山はだ の上の点。side は 左(-1)・右(1)、d は てっぺん(0)から ふもと(1)まで */
function slopeAt(p: Peak, side: Side, d: number): Point {
  const spread = p.half * (p.straight * d + (1 - p.straight) * d * d)
  return [p.top[0] + side * spread, p.top[1] + (p.foot - p.top[1]) * d]
}

/** 山はだ を d0 から d1 まで なぞる 曲線(2次ベジェ)の 制御点。山はだ は 放物線なので、ぴったり なぞれる */
function slopeControl(p: Peak, side: Side, d0: number, d1: number): Point {
  const [x, y] = slopeAt(p, side, d0)
  const k = (d1 - d0) / 2
  return [x + k * side * p.half * (p.straight + 2 * (1 - p.straight) * d0), y + k * (p.foot - p.top[1])]
}

const tipDepth = (p: Peak) => ROUND / (p.foot - p.top[1])
/** まるめた てっぺん の いちばん上(りょうせん の はじまり) */
const apex = (p: Peak): Point => [p.top[0], p.top[1] + ROUND / 2]

/** 山の りんかく(左の ふもと → てっぺん → 右の ふもと) */
function outlinePath(p: Peak): string {
  const d0 = tipDepth(p)
  return `M${pt(slopeAt(p, -1, 1))} Q${pt(slopeControl(p, -1, d0, 1))} ${pt(slopeAt(p, -1, d0))} Q${pt(p.top)} ${pt(slopeAt(p, 1, d0))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(slopeAt(p, 1, 1))} Z`
}

/** ひかげ の 面: りょうせん より 右がわ(日は 左上から さす) */
function shadePath(p: Peak): string {
  const d0 = tipDepth(p)
  const r0 = slopeAt(p, 1, d0)
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  return `M${pt(apex(p))} ${p.ridge} L${pt(slopeAt(p, 1, 1))} Q${pt(slopeControl(p, 1, d0, 1))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
}

/** 山が せりあがる 度合い(overshoot が 大きいほど、ぽん と 行きすぎてから おちつく) */
function riseOf(t: number, from: number, length: number, overshoot: number): number {
  const x = span(t, from, from + length)
  return easeOut(x) * (1 - overshoot) + backOut(x) * overshoot
}

/** せりあがる 間だけ、ごごご と こきざみに ゆれる */
function shakeOf(t: number, from: number, length: number): number {
  const x = span(t, from, from + length)
  return x > 0 && x < 1 ? wave(t, 0.1) * 0.5 * (1 - x) : 0
}

type MountainProps = {
  readonly peak: Peak
  readonly rise: number
  readonly shake: number
  readonly lit: string
  readonly shade: string
  readonly children?: ReactNode
}

/**
 * 山 1つ。のはら の うしろ から せりあがる(rise = 0 のときは、ぜんぶ のはら に かくれている)。
 * 山はだ に たての すじ(谷すじ など)は 描かない: 字の たて線 と まぎれて、線の数が わからなくなるため。
 */
function Mountain({ peak, rise, shake, lit, shade, children }: MountainProps) {
  if (rise <= 0) return null
  return (
    <Layer x={shake} y={(1 - rise) * (peak.foot - peak.top[1])}>
      <path d={outlinePath(peak)} fill={lit} />
      <path d={shadePath(peak)} fill={shade} />
      {children}
    </Layer>
  )
}

/** 雪の ふち の 高さ */
const SNOW_LINE = 29

/** まんなかの 山の てっぺん の 雪(いちばん たかい ので、雪が のこる)。ふち は とけて たれた ように 下へ ふくらむ */
function Snow({ p }: { readonly p: Peak }) {
  const d0 = tipDepth(p)
  const ds = (SNOW_LINE - p.top[1]) / (p.foot - p.top[1])
  const l = slopeAt(p, -1, ds)
  const r = slopeAt(p, 1, ds)
  const l0 = slopeAt(p, -1, d0)
  const r0 = slopeAt(p, 1, d0)
  const ridge: Point = [MIDDLE_RIDGE_X, SNOW_LINE + 0.8]
  const mid: Point = [(ridge[0] + l[0]) / 2, SNOW_LINE + 1]
  const dripR: Point = [(r[0] + ridge[0]) / 2, SNOW_LINE + 4.6]
  const edge = `Q${pt(dripR)} ${pt(ridge)} Q${pt([(ridge[0] + mid[0]) / 2, SNOW_LINE + 5.6])} ${pt(mid)} Q${pt([(mid[0] + l[0]) / 2, SNOW_LINE + 4.2])} ${pt(l)}`
  const cap = `M${pt(l)} Q${pt(slopeControl(p, -1, d0, ds))} ${pt(l0)} Q${pt(p.top)} ${pt(r0)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r)} ${edge} Z`
  const half: Point = [(p.top[0] + r0[0]) / 2, (p.top[1] + r0[1]) / 2]
  const shade = `M${pt(apex(p))} ${MIDDLE_RIDGE_TOP} L${pt(ridge)} Q${pt(dripR)} ${pt(r)} Q${pt(slopeControl(p, 1, d0, ds))} ${pt(r0)} Q${pt(half)} ${pt(apex(p))} Z`
  return (
    <>
      <path d={cap} fill={SNOW} />
      <path d={shade} fill={SNOW_SHADE} />
    </>
  )
}

/** 山が せりあがる ときの つちけむり。ふもと の 左右へ ひろがって きえる */
function Dust({ t, from, x, y, reach }: { readonly t: number; readonly from: number; readonly x: number; readonly y: number; readonly reach: number }) {
  const p = span(t, from, from + 0.8, easeOut)
  if (p <= 0 || p >= 1) return null
  return (
    <g fill={DUST} opacity={(1 - p) * 0.95}>
      {([-1, 1] as const).flatMap((side) =>
        [0, 1, 2].map((i) => <circle key={`${side}:${i}`} cx={x + side * reach * (0.55 + i * 0.22 + p * 0.35)} cy={y - 0.6 - p * (1.4 + i * 1.2)} r={1.2 + p * (1.6 + i * 0.6)} />),
      )}
    </g>
  )
}

/* ───────── 空と のはら ───────── */

function Sky({ t }: SceneProps) {
  const sun = span(t, 0, 0.6, easeOut)
  return (
    <>
      <Layer opacity={sun} rotate={t * 14} origin={[14, 14]}>
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="13.2" y="2.6" width="1.6" height="4" rx="0.8" fill={SUN} transform={`rotate(${i * 45} 14 14)`} />
        ))}
      </Layer>
      <circle cx="14" cy="14" r={6.2 * sun} fill={SUN} />
    </>
  )
}

/** まんなかの 山の 中ほど に かかる 雲(左右の みね より 上。まんなか だけ 雲の上に 出る) */
function Clouds({ t }: SceneProps) {
  const show = span(t, 0.2, 0.9)
  if (show <= 0) return null
  const drift = t * 0.7
  return (
    <g fill="#ffffff" opacity={0.95 * show}>
      <g transform={`translate(${r2(drift)} 0)`}>
        <ellipse cx="29" cy="39.6" rx="10" ry="3.4" />
        <ellipse cx="34" cy="37" rx="6.4" ry="4" />
        <ellipse cx="25.5" cy="37.8" rx="4.4" ry="3" />
      </g>
      <g transform={`translate(${r2(drift * 0.8)} 0)`}>
        <ellipse cx="67" cy="32.2" rx="9" ry="3.2" />
        <ellipse cx="71" cy="29.8" rx="5.6" ry="3.6" />
        <ellipse cx="63.2" cy="30.6" rx="3.8" ry="2.6" />
      </g>
    </g>
  )
}

/** ふもと の 小さな 木。木が こんなに 小さく 見えるほど、山は 大きい(2画目の よこ線 に かからない 左右の はし だけ) */
const FOOT_TREES: readonly (readonly [number, number, number])[] = [
  [2.6, 85.9, 1],
  [6.8, 85.8, 1.3],
  [11, 85.7, 0.85],
  [97.6, 78.9, 1.1],
  [101.8, 78.9, 1.35],
  [106, 79, 0.9],
]

function FootTrees() {
  return (
    <g fill="#2f8447">
      {FOOT_TREES.map(([x, y, s]) => (
        <path key={x} d={`M${x} ${r2(y - 5.4 * s)} Q${r2(x + 0.5 * s)} ${r2(y - 4.6 * s)} ${r2(x + 2 * s)} ${y} H${r2(x - 2 * s)} Q${r2(x - 0.5 * s)} ${r2(y - 4.6 * s)} ${x} ${r2(y - 5.4 * s)} Z`} />
      ))}
    </g>
  )
}

/** とおくの 空を わたる 鳥(山より ずっと 小さく 見える) */
function FarBirds({ t }: SceneProps) {
  const show = during(t, 2.0, INK, 0.4)
  if (show <= 0) return null
  return (
    <g opacity={show} fill="none" stroke="#5b6b7d" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round">
      {[0, 1].map((i) => {
        const x = 108 - (t - 2) * 5 + i * 6
        const y = 18 + i * 3 + wave(t, 2.4, i) * 1.2
        const flap = wave(t, 0.5, i * 0.2) * 1.1
        return <path key={i} d={`M${r2(x - 2)} ${r2(y - flap)} Q${r2(x - 1)} ${r2(y - 1)} ${r2(x)} ${r2(y)} Q${r2(x + 1)} ${r2(y - 1)} ${r2(x + 2)} ${r2(y - flap)}`} />
      })}
    </g>
  )
}

/** のはら: 上の ふち が 山の ふもと(2画目の よこ線)に そう */
const MEADOW = 'M-2 85.6 Q10 85.5 22.25 85 C39.25 82.75 69.37 79.88 87.75 79 Q99 78.5 111 78.6 V111 H-2 Z'
/** くさ の 生えている 場所(子どもの 立つ所 を よける) */
const TUFTS: readonly Point[] = [
  [4, 92],
  [36, 90.5],
  [84, 89],
  [100, 102],
  [16, 104],
]
/** 小さな 花(場所と 色) */
const FLOWERS: readonly (readonly [number, number, string])[] = [
  [11, 94, '#ffffff'],
  [28, 98, '#ffb3c7'],
  [74, 92.5, '#ffffff'],
  [94, 97, '#ffb3c7'],
  [68, 104, '#ffffff'],
]

function Meadow() {
  return (
    <>
      <path d={MEADOW} fill={GRASS} />
      {/* てまえの くさむら(おくゆき を出す) */}
      <path d="M-2 101 Q28 95 56 99.5 T111 97 V111 H-2 Z" fill={GRASS_NEAR} />
      {TUFTS.map(([x, y]) => (
        <path key={x} d={`M${x} ${y} l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />
      ))}
      {FLOWERS.map(([x, y, color]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="1.1" fill={color} />
          <circle cx={x} cy={y} r="0.45" fill={SUN} />
        </g>
      ))}
    </>
  )
}

/** かぞえた みね が、きらっと ひかる */
function SummitStar({ t, at, peak, big }: { readonly t: number; readonly at: number; readonly peak: Peak; readonly big?: boolean }) {
  const p = span(t, at, at + 0.75)
  if (p <= 0 || p >= 1) return null
  const pop = backOut(Math.min(1, p * 2.4))
  const r = (big ? 4.8 : 3.6) * pop
  const [x, y] = [peak.top[0], peak.top[1] - 3.2]
  return (
    <g opacity={1 - p ** 3}>
      <circle cx={x} cy={y} r={r * 1.5} fill="#fff6c8" opacity="0.7" />
      <Star cx={x} cy={y} r={r} color="#ffc233" spin={p * 90} />
    </g>
  )
}

/* ───────── 子ども ───────── */

/**
 * 子どもの 足もと(立ちどまる 場所)と 大きさ。
 * まんなかの 山の ほぼ ま下に 立つので、まんなかを さすと うで が まうえ を むく(いちばん たかい と わかる)。
 */
const CHILD_AT: Point = [47, 108]
const CHILD_SCALE = 0.95
/**
 * 子どもの体の 座標(足もと を 0,0 に した)。
 * かた は あたま より 外に 出る(ほんものの 子どもも そう。うで を あげても あたま に かくれない)。
 * うで は、たらすと 手が ふともも の 中ほど に とどく 長さ。
 */
const SHOULDER: Point = [4.5, -18.8]
const UPPER_ARM = 4.7
const FOREARM = 4.5

/** うで の かっこう。angle = ま下 から 外がわへ ひらいた 角度 / bend = ひじ の まがり(外がわへ)/ finger = ひとさしゆび を のばす 度合い */
type ArmPose = { readonly angle: number; readonly bend: number; readonly finger: number }

const HANG: ArmPose = { angle: 8, bend: -5, finger: 0 }
const HOORAY: ArmPose = { angle: 146, bend: 18, finger: 0 }

const lerpArm = (a: ArmPose, b: ArmPose, k: number): ArmPose => ({
  angle: a.angle + (b.angle - a.angle) * k,
  bend: a.bend + (b.bend - a.bend) * k,
  finger: a.finger + (b.finger - a.finger) * k,
})

/** かた から target を まっすぐ ゆびさす うで(画面の上の 本当の 向き から 角度を出す) */
function pointAt(side: Side, target: Point): ArmPose {
  const sx = CHILD_AT[0] + side * SHOULDER[0] * CHILD_SCALE
  const sy = CHILD_AT[1] + SHOULDER[1] * CHILD_SCALE
  return { angle: (Math.atan2(side * (target[0] - sx), target[1] - sy) * 180) / Math.PI, bend: 0, finger: 1 }
}

const POINT_LEFT = pointAt(-1, LEFT.top)
const POINT_MIDDLE = pointAt(1, MIDDLE.top)
const POINT_RIGHT = pointAt(1, RIGHT.top)

/** かた から出て、ひじ で まがる うで。side は 画面の 左(-1)・右(1) */
function ChildArm({ side, pose }: { readonly side: Side; readonly pose: ArmPose }) {
  const along = (from: Point, deg: number, length: number): Point => {
    const rad = (deg * Math.PI) / 180
    return [from[0] + side * Math.sin(rad) * length, from[1] + Math.cos(rad) * length]
  }
  const shoulder: Point = [side * SHOULDER[0], SHOULDER[1]]
  const elbow = along(shoulder, pose.angle, UPPER_ARM)
  const hand = along(elbow, pose.angle + pose.bend, FOREARM)
  const sleeve = along(shoulder, pose.angle, UPPER_ARM * 0.55)
  // ゆびさす ときは、ひとさしゆび を うでの むきに のばす
  const fingertip = along(hand, pose.angle + pose.bend, 1.3 + 1.3 * pose.finger)
  return (
    <>
      <path d={`M${pt(shoulder)} L${pt(elbow)} L${pt(hand)}`} fill="none" stroke={SKIN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {pose.finger > 0.05 && <path d={`M${pt(hand)} L${pt(fingertip)}`} stroke={SKIN} strokeWidth="1" strokeLinecap="round" />}
      <circle cx={hand[0]} cy={hand[1]} r="1.45" fill={SKIN} />
      <path d={`M${pt(shoulder)} L${pt(sleeve)}`} stroke={SHIRT} strokeWidth="3.3" strokeLinecap="round" />
    </>
  )
}

/** あし: あるくとき、かわりばんこに かかと が あがる */
function Legs({ step }: { readonly step: number }) {
  return (
    <>
      {([-1, 1] as const).map((side) => (
        <g key={side} transform={`translate(0 ${r2(-Math.max(0, side * step) * 1.6)})`}>
          <rect x={side * 2.5 - 1.4} y="-9.6" width="2.8" height="8.2" rx="1.4" fill={SKIN} />
          <rect x={side * 2.5 - 1.45} y="-4" width="2.9" height="2.6" rx="1" fill={SOCK} />
          <ellipse cx={side * 2.6} cy="-0.9" rx="2.3" ry="1.3" fill={SHOE} />
        </g>
      ))}
    </>
  )
}

/** こし から下 と どう(まえ・うしろ で 同じ) */
function Body({ step }: { readonly step: number }) {
  return (
    <>
      <Legs step={step} />
      <rect x="-5" y="-13" width="10" height="5.2" rx="2" fill={SHORTS} />
      {/* くび: みじかく、どう の まんなか の上 */}
      <rect x="-1.4" y="-21.6" width="2.8" height="2.8" fill={SKIN_SHADE} />
      <rect x="-5.4" y="-20.2" width="10.8" height="8.6" rx="3.4" fill={SHIRT} />
    </>
  )
}

/** きいろい ぼうし(つば が ぐるりと ある) */
function Hat() {
  return (
    <>
      <ellipse cx="0" cy="-24.8" rx="5.9" ry="1.5" fill={HAT_DARK} />
      <path d="M-4.6 -24.8 Q-4.8 -29.9 0 -30 Q4.8 -29.9 4.6 -24.8 Z" fill={HAT} />
    </>
  )
}

function Ears() {
  return (
    <>
      <ellipse cx="-4.2" cy="-23.2" rx="1.1" ry="1.5" fill={SKIN} />
      <ellipse cx="4.2" cy="-23.2" rx="1.1" ry="1.5" fill={SKIN} />
    </>
  )
}

type ChildPose = {
  readonly left: ArmPose
  readonly right: ArmPose
  readonly step: number
  readonly headTilt: number
}

/**
 * うしろすがた: 山の ほうを 見ている。せなか に リュック。
 * うで は あたま より てまえ(うしろ から 見ると、かた は 耳より 少し せなか がわ)、リュック より おく に描く。
 */
function ChildBack({ left, right, step, headTilt }: ChildPose) {
  return (
    <>
      <Body step={step} />
      {/* あたま: うしろ から なので、かみ が ほとんどを おおい、えりあし だけ はだ が見える */}
      <Layer rotate={headTilt} origin={[0, -20]}>
        <Ears />
        <circle cx="0" cy="-23.6" r="4.3" fill={SKIN} />
        <path d="M-4.3 -23.6 A4.3 4.3 0 0 1 4.3 -23.6 Q4.3 -21 2.7 -20.1 Q0 -21.1 -2.7 -20.1 Q-4.3 -21 -4.3 -23.6 Z" fill={HAIR} />
        <Hat />
      </Layer>
      <ChildArm side={-1} pose={left} />
      <ChildArm side={1} pose={right} />
      {/* リュック */}
      <rect x="-4.1" y="-19.9" width="8.2" height="8.6" rx="2.4" fill={PACK} />
      <path d="M-4.1 -17.5 Q-4.1 -19.9 -1.7 -19.9 H1.7 Q4.1 -19.9 4.1 -17.5 V-15.9 Q0 -14.2 -4.1 -15.9 Z" fill={PACK_DARK} />
      <rect x="-2.5" y="-14" width="5" height="2.1" rx="1" fill={PACK_DARK} />
    </>
  )
}

/** まえすがた: ふりむいて、にっこり */
function ChildFront({ left, right, step, happy }: ChildPose & { readonly happy: boolean }) {
  return (
    <>
      <Body step={step} />
      {/* リュック の かたひも */}
      <path d="M-3 -20 L-2.8 -13.6 M3 -20 L2.8 -13.6" stroke={PACK} strokeWidth="1.3" strokeLinecap="round" />
      <Ears />
      <circle cx="0" cy="-23.6" r="4.3" fill={SKIN} />
      {/* ぼうし の 下から のぞく かみ */}
      <path d="M-4.3 -23.4 Q-4.5 -25.8 -2 -25.6 H2 Q4.5 -25.8 4.3 -23.4 Q3.5 -24.6 2.1 -24.2 Q0.8 -25 -0.6 -24.2 Q-2.3 -24.8 -4.3 -23.4 Z" fill={HAIR} />
      <circle cx="-2.9" cy="-21.3" r="0.9" fill="#ff9d9d" opacity="0.6" />
      <circle cx="2.9" cy="-21.3" r="0.9" fill="#ff9d9d" opacity="0.6" />
      {happy ? (
        <path d="M-2.3 -22.4 Q-1.6 -23.4 -0.9 -22.4 M0.9 -22.4 Q1.6 -23.4 2.3 -22.4" fill="none" stroke={EYE} strokeWidth="0.55" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="-1.6" cy="-22.6" r="0.55" fill={EYE} />
          <circle cx="1.6" cy="-22.6" r="0.55" fill={EYE} />
        </>
      )}
      <path d="M-1.3 -21.1 Q0 -18.9 1.3 -21.1 Z" fill={MOUTH} />
      <Hat />
      <ChildArm side={-1} pose={left} />
      <ChildArm side={1} pose={right} />
    </>
  )
}

/** みねを かぞえる うで: ひとつめ は 左うで、ふたつめ・みっつめ は 右うで。さいごに ばんざい */
function childArms(t: number): { readonly left: ArmPose; readonly right: ArmPose; readonly lookLeft: number; readonly lookRight: number } {
  const cheer = span(t, CHEER, CHEER + 0.3, backOut)
  const leftUp = span(t, COUNT_1, COUNT_1 + 0.25, easeOut) - span(t, COUNT_2 - 0.05, COUNT_2 + 0.2, easeInOut)
  // みっつめ を さした うで は、ふりむき ながら おろす
  const rightUp = span(t, COUNT_2, COUNT_2 + 0.28, easeOut) - span(t, TURN - 0.1, TURN + 0.12, easeInOut)
  const toRight = span(t, COUNT_3, COUNT_3 + 0.3, easeInOut)
  const rightAim = lerpArm(POINT_MIDDLE, POINT_RIGHT, toRight)
  return {
    left: lerpArm(lerpArm(HANG, POINT_LEFT, leftUp), HOORAY, cheer),
    right: lerpArm(lerpArm(HANG, rightAim, rightUp), HOORAY, cheer),
    lookLeft: leftUp,
    lookRight: toRight * rightUp,
  }
}

function Child({ t }: SceneProps) {
  if (t < WALK) return null
  // あるく: 画面の 下(てまえ)から 山の ほうへ。とおくへ 行くほど 少し 小さく 見える
  const approach = mix(t, WALK, STOP, 1, 0, easeOut)
  const walking = 1 - span(t, STOP - 0.25, STOP)
  const step = Math.sin((t - WALK) * Math.PI * 2 * 1.8) * walking
  // はじめは 画面の 下に すっかり かくれている
  const ground = CHILD_AT[1] + approach * 40
  const hop = (at: number, height: number) => Math.sin(span(t, at, at + 0.32) * Math.PI) * height
  // かぞえる たびに ぴょん。まんなか(いちばん たかい)では 大きく。ばんざい で 2かい はねる
  const hops = hop(COUNT_1, 1) + hop(COUNT_2, 2.2) + hop(COUNT_3, 1) + hop(TURN, 1.4) + hop(CHEER + 0.05, 3) + hop(CHEER + 0.38, 2.2)
  const scale = CHILD_SCALE * (1 + approach * 0.25)
  // ふりむく: よこに ちぢんで、まえすがた に かわる
  const turn = span(t, TURN, TURN + 0.35, easeInOut)
  const arms = childArms(t)
  const pose: ChildPose = { left: arms.left, right: arms.right, step, headTilt: -9 * arms.lookLeft + 9 * arms.lookRight }
  return (
    <>
      <ellipse cx={CHILD_AT[0]} cy={ground + 0.3} rx={5.4 * scale} ry={1.3 * scale} fill="#000000" opacity={0.12} />
      <Layer x={CHILD_AT[0]} y={ground - Math.abs(step) * 0.7 - hops} scale={scale} rotate={step * 2}>
        <Layer scaleX={Math.abs(Math.cos(turn * Math.PI))} origin={[0, -14]}>
          {turn < 0.5 ? <ChildBack {...pose} /> : <ChildFront {...pose} happy={t >= CHEER} />}
        </Layer>
      </Layer>
    </>
  )
}

/* ───────── 場面 ───────── */

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 3)
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.06
  return (
    <>
      <Layer opacity={ink.picture}>
        <Sky t={t} />
        <FarBirds t={t} />
        <Mountain peak={MIDDLE} rise={riseOf(t, RISE_M, 1.2, 0.4)} shake={shakeOf(t, RISE_M, 1.2)} lit={FAR_LIT} shade={FAR_SHADE}>
          <Snow p={MIDDLE} />
        </Mountain>
        <Clouds t={t} />
        <Mountain peak={LEFT} rise={riseOf(t, RISE_L, 0.7, 1)} shake={shakeOf(t, RISE_L, 0.7)} lit={NEAR_LIT} shade={NEAR_SHADE} />
        <Mountain peak={RIGHT} rise={riseOf(t, RISE_R, 0.7, 1)} shake={shakeOf(t, RISE_R, 0.7)} lit={NEAR_LIT} shade={NEAR_SHADE} />
        <Meadow />
        <FootTrees />
        {/* つちけむり は、それぞれの 山が のはら から 出てくる 所(のはら の ふち)に 立つ */}
        <Dust t={t} from={RISE_L} x={21.5} y={85.2} reach={14} />
        <Dust t={t} from={RISE_R} x={89} y={79.2} reach={13} />
        <Dust t={t} from={RISE_M} x={54.5} y={81.8} reach={17} />
        <SummitStar t={t} at={COUNT_1 + 0.15} peak={LEFT} />
        <SummitStar t={t} at={COUNT_2 + 0.15} peak={MIDDLE} big />
        <SummitStar t={t} at={COUNT_3 + 0.2} peak={RIGHT} />
        <Child t={t} />
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
    { at: 0, label: '山が ひとつ、また ひとつ、せりあがる', sound: 'pop' },
    { at: RISE_M, label: 'まんなかの 山が、雲の上まで いちばん たかく のびる', sound: 'pop' },
    { at: WALK, label: '子どもが やってくる' },
    { at: COUNT_1, label: 'みねを ゆびさして かぞえる。ひとつ', sound: 'tap' },
    { at: COUNT_2, label: 'ふたつ。まんなかは いちばん たかい', sound: 'tap' },
    { at: COUNT_3, label: 'みっつ', sound: 'tap' },
    { at: TURN, label: 'ふりむいて ばんざい', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '山 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
