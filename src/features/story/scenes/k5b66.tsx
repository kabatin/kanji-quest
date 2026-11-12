/*
 * 学(まなぶ): やねの 下で、子どもが せんせいに おそわる。
 *
 * ほね(画と絵の対応)
 *   1・2・3画目(ツ) … やねの むこうから のぼる 朝日の ひかり 3本
 *                       (子どもが「できた!」と よろこんだ しゅんかんに、さっと さす)
 *   4画目           … やねの 左はし と、それを ささえる はしら の上
 *   5画目           … やねの てっぺん(むね)の 線と、右はし
 *   6画目           … 子どもの あたま(かみの 上の線 と ポニーテール、かおの 右がわ)
 *   7画目           … 子どもの どう と あし。おわりの はね は、外を むいた 足さき
 *   8画目           … 「やったあ」と 左右に ひろげた 子どもの うで
 *
 * ながれ
 *   朝。やねの ある きょうしつ が できる(お日さまは まだ やねの うしろ)
 *   → 女の子が あるいてきて、やねの 下の せんせいの となりに すわる
 *   → せんせいが うしろから 手を とって、いっしょに 紙に まる を かく
 *   → とちゅうで せんせいの 手が はなれ、のこりは ひとりで かきあげる
 *   → せんせいが 赤い ふで で、まる の まわりに 花びら を かく(はなまる)
 *   → 女の子は とびあがって、りょううで を ひろげる。やねの むこうから 朝日が さす
 *   → ほね が ひかって、絵が うすくなり、字「学」が のこる
 *
 * 人は、ほんものの人の つくり を守る(字の形に合わせるために、体を ゆがめない):
 *   うで は かた から出て ひじ で まがる。とどかない所へは 手を のばさない
 *   (せんせいは 手が とどくよう、体を よせて ひざ立ち に なる)。
 *   やねが ひくいので、おとなの せんせいは ずっと すわっている。
 *   字の形になるのは、とびあがって 手を ひろげた さいごの しゅんかん だけ。
 */
import type { ReactNode } from 'react'
import { backOut, during, easeInOut, easeOut, inkTiming, mix, span, wave, type SceneModule, type SceneProps } from '../sceneKit'
import { Bone, BoneGlow, Ink, Layer, Sparkles } from '../sceneParts'

const CHAR = '学'

const SKIN = '#f8cfa6'
const SKIN_SHADE = '#eeb98a'
const CHEEK = '#ff9d9d'
const EYE = '#2b2b2b'
const MOUTH = '#b9483f'
const HAIR = '#5a3b2a'
const HAIR_TIE = '#ff5a6e'
const SHIRT = '#ff8f5a'
const SHIRT_DARK = '#e8753f'
const SKIRT = '#3e5c86'
const SKIRT_DARK = '#34507a'
const SOCK = '#ffffff'
const SOCK_SHADE = '#dfe6ef'
const TEACHER_HAIR = '#3e2c22'
const CARDIGAN = '#8a6cc7'
const CARDIGAN_DARK = '#7457b3'
const BLOUSE = '#ffffff'
const TEACHER_SKIRT = '#3b4a73'
const GLASSES = '#6b4a36'
const ROOF = '#5f6f92'
const ROOF_DARK = '#4c5a7a'
const ROOF_LIGHT = '#7f8fb2'
const WOOD = '#c99766'
const WOOD_DARK = '#a5764b'
const WALL = '#fbf0d8'
const WALL_SHADE = '#efe0bf'
const TATAMI = '#e4e7a9'
const TATAMI_LINE = '#cbd187'
const SUN = '#ffd24a'
const SUN_GLOW = '#fff1b8'
const SUMI = '#2b2b2b'
const SHU = '#e5463b'
const PAPER = '#fffdf6'
const FELT = '#56607a'
const STONE = '#3d3f4c'
const STONE_LIGHT = '#50536a'
const BAMBOO = '#d9b77a'
const LEAF = '#55b86e'
const GRASS = '#c5e8a9'
const SAKURA = '#f7b6c8'
const BARK = '#8c5b3c'
const SPARROW = '#a8743f'
const SPARROW_DARK = '#7d5230'

/** くぎり の時間(秒) */
const ARRIVE = 1.0
const SIT = 2.3
const LESSON = 3.0
/** せんせいの 手が はなれて、ひとりで かく */
const ALONE = 4.0
const HANAMARU = 4.6
const CHEER = 5.6
const INK = 6.6
const DONE = 10.0
const DURATION = 10.8

/** いっしょに まる を かきはじめる(手を とって、ふでを 紙に おろしてから) */
const GUIDE_FROM = LESSON + 0.42
/** 花びら を かく あいだ */
const PETAL_FROM = HANAMARU + 0.2
const PETAL_TO = HANAMARU + 0.82
/** はくしゅ を はじめる */
const CLAP_FROM = CHEER + 0.2

type Pt = readonly [number, number]
type ArmJoints = { readonly elbow: Pt; readonly hand: Pt }

/* ───── 子ども(左右は 見る人から見た向き。子どもの みぎ手 は 見る人の 左) ───── */
/** 立ったときの こし。上体を かたむける じく で、7画目(どう)の 線の上 */
const HIP: Pt = [54.5, 78]
const SHOULDER_Y = 62.6
const SHOULDER_HALF = 5.5
/** せいざ で すわると、こし から上が これだけ 下がる(子どもの あしの ながさ ぶん) */
const KNEEL_DROP = 19
/** にのうで・うでさき の ながさ(手を のばすと、かた から 手 まで 19) */
const CHILD_ARM = 9.5
/** すわったときの、ひざの上の 手(うでさき は まえ に むくので、みじかく 見える) */
const LAP_LEFT: Pt = [50.6, 92.4]
const LAP_RIGHT: Pt = [58.4, 92.4]
/** ふでを もって かく うで(うでさき が 少し まえに むくので、みじかめ) */
const WRITE_UPPER = 9.5
const WRITE_FORE = 9
/** よろこんで ひろげた うで の むき(にのうで・うでさき。0 = 右 / 90 = 下 / 180 = 左)。手先が 8画目の 線に のる */
const SPREAD_LEFT = { upper: 167, fore: 171 } as const
const SPREAD_RIGHT = { upper: 5, fore: 1 } as const

/* ───── 紙と ふで ───── */
const CIRCLE: Pt = [48.5, 100.5]
const CIRCLE_RX = 4.5
const CIRCLE_RY = 1.95
/** はなまる の 花びら(まる の 何ばい の ところに かくか) */
const PETAL_IN = 1.22
const PETAL_OUT = 1.68
/** ふでを たてに もったとき、手 から ふでの 先まで */
const BRUSH_DOWN: Pt = [0.5, 6.2]
/** すずり の上に ねかせた ふで(先 と おしり)と、それを つまむ ところ */
const BRUSH_TIP_REST: Pt = [32, 99.8]
const BRUSH_END_REST: Pt = [41.6, 97.3]
const BRUSH_GRIP: Pt = [40.2, 97.6]

/* ───── せんせい ───── */
const TEACHER_UPPER = 14.5
const TEACHER_FORE = 14
/** せんせいが すわる ところ(ゆか)と、体を かたむける じく の 高さ */
const TEACHER_FLOOR = 94.4
const TEACHER_WAIST = 87
/** はくしゅ する 手の 高さ(せすじを のばす まえ の 高さ で。子どもが ひろげた うで より 下) */
const CLAP_Y = 77

/* ───── お日さま(やねの うしろ。ひかりの 3本が この まんなか から のびて 見える) ───── */
const SUN_C: Pt = [59, 47]
const SUN_R = 21

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]]
const xy = (p: Pt): string => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`
const rad = (deg: number): number => (deg * Math.PI) / 180

/** origin を じく に、deg 度 まわす(SVG の rotate と同じ むき) */
function rotateAround(p: Pt, origin: Pt, deg: number): Pt {
  const [dx, dy] = sub(p, origin)
  return [origin[0] + dx * Math.cos(rad(deg)) - dy * Math.sin(rad(deg)), origin[1] + dx * Math.sin(rad(deg)) + dy * Math.cos(rad(deg))]
}

/**
 * かた から 手 を、にのうで・うでさき の 2本で つなぐ(ひじ の 場所を 計算する)。
 * とどかない所は、うで を まっすぐ のばした ところで 止める(うで は のびない)。
 * bend は ひじ が どちらがわ に 出るか。
 */
function ik(shoulder: Pt, target: Pt, upper: number, fore: number, bend: 1 | -1): ArmJoints {
  const [dx, dy] = sub(target, shoulder)
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), upper + fore - 0.01))
  const base = Math.atan2(dy, dx)
  const open = Math.acos(Math.min(1, Math.max(-1, (upper * upper + d * d - fore * fore) / (2 * upper * d)))) * bend
  return { elbow: [shoulder[0] + Math.cos(base + open) * upper, shoulder[1] + Math.sin(base + open) * upper], hand: [shoulder[0] + Math.cos(base) * d, shoulder[1] + Math.sin(base) * d] }
}

/** にのうで・うでさき の むき(度)から、ひじ と 手 を きめる */
function fk(shoulder: Pt, upperDeg: number, foreDeg: number, length: number): ArmJoints {
  const elbow: Pt = [shoulder[0] + Math.cos(rad(upperDeg)) * length, shoulder[1] + Math.sin(rad(upperDeg)) * length]
  return { elbow, hand: [elbow[0] + Math.cos(rad(foreDeg)) * length, elbow[1] + Math.sin(rad(foreDeg)) * length] }
}

const blendArm = (a: ArmJoints, b: ArmJoints, k: number): ArmJoints => ({ elbow: lerpPt(a.elbow, b.elbow, k), hand: lerpPt(a.hand, b.hand, k) })

/** きまった時間に きまった かっこう を通り、あいだ を なめらかに つなぐ */
function keyed<T>(t: number, keys: readonly (readonly [number, T])[], blend: (a: T, b: T, k: number) => T): T {
  const [first] = keys
  if (t <= first[0]) return first[1]
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, a] = keys[i - 1]
    const [t1, b] = keys[i]
    if (t <= t1) return blend(a, b, span(t, t0, t1, easeInOut))
  }
  return keys[keys.length - 1][1]
}

/* ───── 紙に かく もの ───── */

/** まる の 上の点(p = 0 で てっぺん。左まわりに 1しゅう) */
function circlePoint(p: number): Pt {
  return [CIRCLE[0] - CIRCLE_RX * Math.sin(p * Math.PI * 2), CIRCLE[1] - CIRCLE_RY * Math.cos(p * Math.PI * 2)]
}

/** はなまる の 花びら の 上の点(まる の まわりを、7まい の 花びら で ひとまわり) */
function petalPoint(q: number): Pt {
  const a = q * Math.PI * 2
  const k = PETAL_IN + (PETAL_OUT - PETAL_IN) * Math.abs(Math.sin(a * 3.5))
  return [CIRCLE[0] - CIRCLE_RX * k * Math.sin(a), CIRCLE[1] - CIRCLE_RY * k * Math.cos(a)]
}

/** 線を q まで かいた ところ を、こまかい点で つなぐ(ふでの 先 と 線の はし が ぴったり そろう) */
function partialPath(point: (q: number) => Pt, q: number, steps: number): string {
  if (q <= 0) return ''
  const n = Math.max(2, Math.ceil(steps * q))
  return Array.from({ length: n + 1 }, (_, i) => `${i === 0 ? 'M' : 'L'}${xy(point((q * i) / n))}`).join(' ')
}

/** まる を どこまで かいたか。はんぶん までは せんせいと いっしょ、のこりは ひとりで */
const circleDrawn = (t: number): number => 0.5 * span(t, GUIDE_FROM, ALONE) + 0.5 * span(t, ALONE + 0.05, ALONE + 0.5)
const petalsDrawn = (t: number): number => span(t, PETAL_FROM, PETAL_TO)

/** せんせいの 赤い ふで: 手 から 先 まで。先が 外へ いくほど ふでを ねかせる(手を のばしすぎない) */
const redBrushReach = (tip: Pt): Pt => [(tip[0] - 46) * 0.45, 6.4]
const redBrushHand = (tip: Pt): Pt => sub(tip, redBrushReach(tip))
/** 花びら を かいていない ときの、手 から 先 まで */
const RED_BRUSH_IDLE = redBrushReach(petalPoint(0))

/* ───── 子どもの うごき ───── */

type ChildMood = 'happy' | 'focus' | 'wow' | 'joy'
type ChildState = ReturnType<typeof childState>

function childState(t: number) {
  // あるく: 右から 左へ。とまる ちょっと前から 足を ゆるめる
  const walking = 1 - span(t, SIT - 0.35, SIT - 0.05)
  const stride = t < ARRIVE ? 0 : Math.sin((t - ARRIVE) * Math.PI * 2 * 1.7) * walking
  const walkX = mix(t, ARRIVE, SIT - 0.05, 72, 0, easeOut)
  // くるっと こちらを むく(横むき の 絵 を ほそくして、まえむき の 絵 に かえる)→ せいざ で すわる → とびあがって 立つ
  const sideScale = 1 - span(t, SIT, SIT + 0.14)
  const frontScale = span(t, SIT + 0.14, SIT + 0.3)
  const kneel = span(t, SIT + 0.32, SIT + 0.66, easeInOut) * (1 - span(t, CHEER, CHEER + 0.22, easeOut))
  const lift = Math.sin(span(t, CHEER + 0.12, CHEER + 0.5) * Math.PI) * 2.4
  // ひとりで かきはじめると、ふでの すすむ 右へ 体が よる(せんせいが 花びら を かく ばしょ も あく)。
  // よろこぶと、上体が 少し かたむく(7画目の 線のように、上が 左へ)
  const lean = mix(t, ALONE, ALONE + 0.35, 0, 5) * (1 - span(t, CHEER, CHEER + 0.15)) - 8 * span(t, CHEER + 0.1, CHEER + 0.45, easeOut)
  const dy = kneel * KNEEL_DROP - lift
  const hip: Pt = [HIP[0], HIP[1] + dy]
  const shoulderLeft = rotateAround([HIP[0] - SHOULDER_HALF, SHOULDER_Y + dy], hip, lean)
  const shoulderRight = rotateAround([HIP[0] + SHOULDER_HALF, SHOULDER_Y + dy], hip, lean)

  // うで: 立っているときは だらんと下げ、すわると ひじ を 体の よこに おろして 手は ひざの上。
  // かくときは ふでの 先が まる を なぞる(ふでを もつ うで は、ひじ が 少し 外に はる)
  const restLeft = blendArm({ elbow: add(shoulderLeft, [-1.2, 9.4]), hand: add(shoulderLeft, [-1.6, 18.6]) }, { elbow: add(shoulderLeft, [-2.4, 8]), hand: LAP_LEFT }, kneel)
  const restRight = blendArm({ elbow: add(shoulderRight, [1.2, 9.4]), hand: add(shoulderRight, [1.6, 18.6]) }, { elbow: add(shoulderRight, [2.4, 8]), hand: LAP_RIGHT }, kneel)
  const reachTo = (target: Pt) => ik(shoulderLeft, target, WRITE_UPPER, WRITE_FORE, 1)
  const writing = reachTo(sub(circlePoint(circleDrawn(t)), BRUSH_DOWN))
  const grip = reachTo(BRUSH_GRIP)
  // ふでを とる → まる を かく → ふでを もどす → 手を ひざへ
  const bentLeft = keyed(t, [[SIT + 0.66, restLeft], [LESSON + 0.16, grip], [GUIDE_FROM - 0.03, writing], [ALONE + 0.5, writing], [ALONE + 0.7, grip], [ALONE + 0.9, restLeft]], blendArm)
  // とびあがる とき: ひざの上の うで の むき から、ひろげた むき へ(ひじ を のばしながら 外へ ふりあげる)。
  // ひろげ おわるのは 足が つく ころ(いちばん 高く とんだ とき は まだ 下むき なので、手が せんせいの かお に かからない)
  const spread = span(t, CHEER + 0.18, CHEER + 0.55, easeInOut)
  const armLeft = t < CHEER ? bentLeft : spreadArm(shoulderLeft, bentLeft, SPREAD_LEFT, spread)
  const armRight = t < CHEER ? restRight : spreadArm(shoulderRight, restRight, SPREAD_RIGHT, spread)

  /** ふでを 手に もっている 度合い(0 = すずり の上に ねている) */
  const holding = span(t, LESSON + 0.16, LESSON + 0.32) * (1 - span(t, ALONE + 0.55, ALONE + 0.7))
  const mood: ChildMood = t >= HANAMARU + 0.75 ? 'joy' : t >= HANAMARU + 0.15 ? 'wow' : t >= GUIDE_FROM - 0.1 && t < ALONE + 0.55 ? 'focus' : 'happy'
  const look = during(t, LESSON + 0.05, CHEER, 0.2)
  const headTilt = mix(t, LESSON, LESSON + 0.3, 0, 2) - mix(t, CHEER + 0.05, CHEER + 0.4, 0, 6)
  // ポニーテール: あるくと ゆれ、とびあがると ぴょん と はねる
  const tail = stride * 6 - Math.sin(span(t, CHEER + 0.1, CHEER + 0.75) * Math.PI) * 22 + wave(t, 2.2) * 2
  return { sideScale, frontScale, walkX, stride, kneel, lift, lean, headTilt, look, mood, tail, shoulderLeft, shoulderRight, armLeft, armRight, holding }
}

/** ひざの上の うで(start)から、ひろげた うで へ。にのうで・うでさき の むき を それぞれ まわす */
function spreadArm(shoulder: Pt, start: ArmJoints, goal: { readonly upper: number; readonly fore: number }, k: number): ArmJoints {
  const angle = (from: Pt, to: Pt) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI
  const upper0 = angle(shoulder, start.elbow)
  const fore0 = angle(start.elbow, start.hand)
  // 右の うで は 角度が へる むき、左の うで は ふえる むき に まわす(体の まえを 通らない)
  const unwrap = (from: number, to: number) => (goal.upper > 90 ? (to < from - 180 ? to + 360 : to) : to > from + 180 ? to - 360 : to)
  return fk(shoulder, lerp(upper0, unwrap(upper0, goal.upper), k), lerp(fore0, unwrap(fore0, goal.fore), k), CHILD_ARM)
}

/* ───── せんせいの うごき ───── */

type TeacherMood = 'smile' | 'joy'
type TeacherState = ReturnType<typeof teacherState>

function teacherState(t: number, child: ChildState) {
  // 子どもが すわると、そばに よる。かがむと かお が 子どもの あたま に かくれるので、
  // ひざ立ち で 少し 体を おこして(up)、うしろ から のぞきこむ。
  // よろこぶ まえに 左へ はなれて、せすじ を のばす(子どもが ひろげる うで が、かお に かからない)
  const cx = keyed(t, [[LESSON, 37], [LESSON + 0.3, 42.5], [PETAL_TO + 0.05, 42.5], [CHEER + 0.12, 34.5]], lerp)
  const lean = keyed(t, [[LESSON, 0], [LESSON + 0.3, 5], [PETAL_FROM, 7], [PETAL_TO, 7], [CHEER + 0.12, -2]], lerp)
  const up = keyed(t, [[LESSON, 0], [LESSON + 0.3, 2.5], [PETAL_TO + 0.05, 2.5], [CHEER + 0.15, 4.5]], lerp)
  const headTilt = keyed(t, [[LESSON, 3], [LESSON + 0.3, 6], [PETAL_TO, 6], [CHEER + 0.15, -4]], lerp)
  const waist: Pt = [cx, TEACHER_WAIST]
  const shoulderLeft = rotateAround([cx - 7.4, 71.6 - up], waist, lean)
  const shoulderRight = rotateAround([cx + 7.4, 71.6 - up], waist, lean)

  // ひざの上 / 手を ふる / 子どもの 手に かさねる / 手を はなして 見まもる / 花びら を かく / はくしゅ
  const lapLeft: ArmJoints = { elbow: add(shoulderLeft, [-2.2, 10.8]), hand: [cx - 3.4, 85.8] }
  const lapRight: ArmJoints = { elbow: add(shoulderRight, [2.2, 10.8]), hand: [cx + 3.4, 85.8] }
  const hello: ArmJoints = { elbow: add(shoulderLeft, [-8.4, 2.4]), hand: add(shoulderLeft, [-6.6 + wave(t, 0.5) * 1.6, -10.6]) }
  const guide = ik(shoulderLeft, add(child.armLeft.hand, [-0.5, -1.3]), TEACHER_UPPER, TEACHER_FORE, 1)
  const aside: ArmJoints = { elbow: add(shoulderLeft, [-3, 10.4]), hand: [cx - 6.4, 85.4] }
  const petal = ik(shoulderLeft, redBrushHand(petalPoint(petalsDrawn(t))), TEACHER_UPPER, TEACHER_FORE, 1)
  /** はくしゅ の まわり(手が あうたびに 1 ふえる) */
  const clapPhase = t >= CLAP_FROM ? (t - CLAP_FROM) * 3 : -1
  const open = 1.5 + 2.1 * Math.abs(Math.sin(Math.max(0, clapPhase) * Math.PI))
  const clapLeft: ArmJoints = { elbow: [cx - 9.4, CLAP_Y + 5 - up], hand: [cx - open, CLAP_Y - up] }
  const clapRight: ArmJoints = { elbow: [cx + 9.4, CLAP_Y + 5 - up], hand: [cx + open, CLAP_Y - up] }

  const armLeft = keyed(
    t,
    [
      [ARRIVE + 0.25, lapLeft], [ARRIVE + 0.5, hello], [SIT + 0.15, hello], [SIT + 0.45, lapLeft],
      [LESSON + 0.18, lapLeft], [GUIDE_FROM - 0.04, guide], [ALONE, guide], [ALONE + 0.25, aside], [HANAMARU + 0.02, aside],
      [PETAL_FROM, petal], [PETAL_TO, petal], [PETAL_TO + 0.12, lapLeft], [CLAP_FROM, clapLeft],
    ],
    blendArm,
  )
  const armRight = keyed(t, [[CHEER, lapRight], [CLAP_FROM, clapRight]], blendArm)
  const redBrush = during(t, HANAMARU + 0.06, PETAL_TO + 0.12, 0.06)
  // 目線: 子どもが 入ってくると そちらを 見て(gaze)、いっしょに かくときは 紙を 見る(look)
  const gaze = mix(t, ARRIVE, ARRIVE + 0.4, 0, 0.7) * (1 - span(t, LESSON, LESSON + 0.2))
  const look = during(t, LESSON + 0.15, PETAL_TO + 0.1, 0.15)
  const mood: TeacherMood = t >= CHEER + 0.1 ? 'joy' : 'smile'
  return { cx, lean, up, headTilt, gaze, look, mood, shoulderLeft, shoulderRight, armLeft, armRight, redBrush, clapPhase }
}

/* ───── けしき ───── */

function Ground({ t }: SceneProps) {
  return (
    <>
      {/* とおくの おか と、ゆっくり ながれる 雲 */}
      <path d="M-4 101 Q16 78 40 92 Q70 74 113 95 V109 H-4 Z" fill="#e2f2d2" />
      <g fill="#ffffff" opacity={0.9 * span(t, 0, 0.4)} transform={`translate(${t * 1.4} 0)`}>
        <ellipse cx="92" cy="15" rx="6.4" ry="2.8" />
        <ellipse cx="96.5" cy="13.2" rx="4.4" ry="3" />
      </g>
      <ellipse cx="54.5" cy="107" rx="62" ry="9" fill={GRASS} />
      {[6, 100].map((x) => <path key={x} d={`M${x} 103 l1.4 -3.6 l1 3.2 l1.6 -4.2 l0.8 4.6 Z`} fill={LEAF} />)}
    </>
  )
}

/** やねの うしろの お日さま。おか の むこう から ゆっくり のぼって、さいごに ひかり が 3本 さす */
function Sun({ t }: SceneProps) {
  const cy = lerp(86, SUN_C[1], span(t, 0, CHEER + 0.1, easeOut))
  // ひかり は、まんなか(お日さま がわ)から 外へ のびる。画の かきおわり が お日さま がわ
  const beam = span(t, CHEER + 0.15, CHEER + 0.55, easeOut)
  const shimmer = 1 + wave(t, 0.7) * 0.1
  return (
    <>
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R + 11} fill={SUN_GLOW} opacity={0.45} />
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R + 5} fill={SUN_GLOW} opacity={0.7} />
      <circle cx={SUN_C[0]} cy={cy} r={SUN_R} fill={SUN} />
      {beam > 0 &&
        [1, 2, 3].map((n) => (
          <g key={n}>
            <Bone char={CHAR} n={n} color={SUN_GLOW} width={6.4 * shimmer} opacity={0.7} from={1 - beam} to={1} />
            <Bone char={CHAR} n={n} color={SUN} width={2.6} from={1 - beam} to={1} />
          </g>
        ))}
    </>
  )
}

/** はるかぜ に のって、さくら の 花びら が ひらひら とんでくる(学校が はじまる きせつ) */
function FallingPetals({ t }: SceneProps) {
  return (
    <>
      {[0.9, 3.0, 5.0].map((start, i) => {
        const p = span(t, start, start + 3.6)
        if (p <= 0 || p >= 1) return null
        const x = 4 + i * 3 + p * (34 + i * 10) + Math.sin(p * 8 + i) * 4
        const y = -2 + p * 72
        return <ellipse key={start} cx="0" cy="0" rx="1.5" ry="0.9" fill={SAKURA} opacity={1 - p * 0.3} transform={`translate(${x} ${y}) rotate(${Math.sin(p * 9 + i) * 60 + 30})`} />
      })}
    </>
  )
}

/** やね の ある きょうしつ(まえは あいていて、中が 見える) */
function House({ t }: SceneProps) {
  // ゆか・かべ・はしら が 下から たちあがり、さいごに やね が 上から おりてきて、とん と のる
  const posts = span(t, 0, 0.45, backOut)
  const roofDrop = mix(t, 0.3, 0.75, -24, 0, backOut)
  return (
    <>
      <Layer scaleY={posts} origin={[54.5, 107.6]}>
        {/* おく の かべ・なげし・たたみ */}
        <rect x="21.8" y="42" width="64.4" height="47.8" fill={WALL} />
        <rect x="21.8" y="42" width="64.4" height="2.2" fill={WALL_SHADE} />
        <rect x="21.8" y="47.4" width="64.4" height="2.2" fill={WOOD} />
        <rect x="21.8" y="88.6" width="64.4" height="1.4" fill={WOOD_DARK} />
        <rect x="19" y="89.8" width="70" height="15.4" fill={TATAMI} />
        <path d="M19 97.2 H89 M54 89.8 V97.2 M36 97.2 V105.2 M72 97.2 V105.2" stroke={TATAMI_LINE} strokeWidth="0.8" />
        {/* ゆか の ふち と、まえの はしら(4画目の 下の ほう が 左の はしら に のる) */}
        <rect x="13.6" y="105" width="80.8" height="2.6" rx="0.6" fill={WOOD_DARK} />
        <rect x="16.8" y="41" width="5" height="64.6" fill={WOOD} />
        <rect x="86.2" y="41" width="5" height="64.6" fill={WOOD} />
        <path d="M18.2 44 V103 M87.6 44 V103" stroke="#ddb184" strokeWidth="0.9" />
      </Layer>
      {/* やね: かわら の すじ、のき の まるい かわら、てっぺん の むね */}
      <Layer y={roofDrop} opacity={span(t, 0.3, 0.45)}>
        <path d="M21.6 31.6 L86.8 31.6 L92 42.2 L16.2 42.2 Z" fill={ROOF} />
        {Array.from({ length: 16 }, (_, i) => 25 + i * 4).map((x) => <path key={x} d={`M${x} 33 V40.2`} stroke={ROOF_DARK} strokeWidth="0.8" strokeLinecap="round" />)}
        <rect x="15.2" y="40" width="77.6" height="2.8" rx="1.2" fill={ROOF_LIGHT} />
        {Array.from({ length: 21 }, (_, i) => 17.4 + i * 3.65).map((x) => <circle key={x} cx={x} cy="41.4" r="0.75" fill={ROOF_DARK} />)}
        <rect x="20.2" y="29.6" width="67.8" height="3.2" rx="1.6" fill={ROOF_DARK} />
      </Layer>
    </>
  )
}

/** かべぎわ の いけばな(さくら の えだ) */
function Vase({ t }: SceneProps) {
  const blossoms: readonly Pt[] = [[72.6, 68.6], [82.2, 70.4], [76.8, 67.6], [74.2, 72.4], [80.6, 74.4]]
  return (
    <Layer scale={span(t, 0.75, 1.05, backOut)} origin={[77.5, 89.6]}>
      <rect x="71.6" y="87.4" width="11.8" height="2.4" rx="0.8" fill={WOOD_DARK} />
      <path d="M77.5 80 Q74 74 72.6 68.6 M77.5 80 Q80.6 75 82.2 70.4 M77.5 80 Q77.8 74 76.8 67.6" fill="none" stroke={BARK} strokeWidth="0.9" strokeLinecap="round" />
      {blossoms.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill={SAKURA} />)}
      <path d="M74.8 87.6 Q73.6 83 75.6 79.4 L79.4 79.4 Q81.4 83 80.2 87.6 Z" fill="#6f9fd8" />
      <path d="M75.4 82.6 H79.6" stroke="#ffffff" strokeWidth="0.7" opacity="0.7" />
    </Layer>
  )
}

/* ───── 人 ───── */

/** 子どもの あたま(こちら むき)。まんなか が (0, 0) */
function ChildHeadFront({ mood, look, tail }: { readonly mood: ChildMood; readonly look: number; readonly tail: number }) {
  const eyeY = 0.9 + look * 1.1
  const eyeR = mood === 'wow' ? 1.3 : 1.05
  return (
    <>
      {/* ポニーテール(左上で むすぶ)。とびあがると はねる */}
      <Layer rotate={tail} origin={[-5.4, -5.4]}>
        <path d="M-4.6 -7.6 C-8.8 -9.4 -13.4 -7.6 -14.6 -3.4 C-14.8 -2.2 -14 -1.6 -13.3 -2.5 C-11.8 -4.4 -9.4 -4.8 -6.8 -3.4 Z" fill={HAIR} />
      </Layer>
      <circle r="7.6" fill={SKIN} />
      {/* かみ: まえがみ が おでこ に かかる */}
      <path d="M-7.9 1.6 C-8.8 -6.4 -4 -9.6 0.4 -9.4 C5.2 -9.2 8.9 -6 7.9 1.6 C7.2 -1.4 6.2 -2.8 4.6 -3.2 C3 -2.2 0.8 -2.2 -0.6 -3.4 C-2.2 -2.4 -4.6 -2.4 -6.2 -3 C-7 -1.6 -7.6 0 -7.9 1.6 Z" fill={HAIR} />
      <circle cx="-5.5" cy="-5.6" r="1.5" fill={HAIR_TIE} />
      <circle cx="-4.7" cy="3.3" r="1.7" fill={CHEEK} opacity="0.55" />
      <circle cx="4.7" cy="3.3" r="1.7" fill={CHEEK} opacity="0.55" />
      {/* 目と口: うれしい(joy)は にっこり目 と 大きな口。びっくり(wow)は まるい口。かくとき(focus)は 下を 見て 口を むすぶ */}
      {mood === 'joy' ? (
        <path d="M-3.9 1.5 Q-2.7 -0.3 -1.5 1.5 M1.5 1.5 Q2.7 -0.3 3.9 1.5" fill="none" stroke={EYE} strokeWidth="1.1" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="-2.7" cy={eyeY} r={eyeR} fill={EYE} />
          <circle cx="2.7" cy={eyeY} r={eyeR} fill={EYE} />
        </>
      )}
      {mood === 'joy' && <path d="M-2 3.5 Q0 3.2 2 3.5 Q1.7 6.6 0 6.6 Q-1.7 6.6 -2 3.5 Z" fill={MOUTH} />}
      {mood === 'wow' && <ellipse cx="0" cy="4.7" rx="0.9" ry="1.15" fill={MOUTH} />}
      {mood === 'focus' && <path d="M-0.9 4.8 Q0 5.1 0.9 4.8" fill="none" stroke={MOUTH} strokeWidth="0.9" strokeLinecap="round" />}
      {mood === 'happy' && <path d="M-1.5 3.9 Q0 5.3 1.5 3.9" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />}
    </>
  )
}

/** 子ども(こちら むき)の 体。うで は あとで(紙や ふで より まえ に)描く */
function ChildFrontBody({ c }: { readonly c: ChildState }) {
  const dy = c.kneel * KNEEL_DROP - c.lift
  const legTop = 81.4 + dy
  const ankle = 93 - c.lift
  return (
    <>
      {/* 立っているときの あし と スカート(すわると、ひざの うしろ に かくれる) */}
      <Layer opacity={1 - span(c.kneel, 0.55, 0.8)}>
        {ankle - legTop > 0.4 &&
          ([-1, 1] as const).map((side) => {
            const x = HIP[0] + side * 2.6
            const toe = `rotate(${side * 12} ${x + side * 1.3} ${ankle + 1.3})`
            return (
              <g key={side}>
                <rect x={x - 2.1} y={legTop} width="4.2" height={ankle - legTop + 0.4} rx="2" fill={SKIN} />
                <rect x={x - 2.2} y={Math.max(legTop, ankle - 3.4)} width="4.4" height={Math.min(3.4, ankle - legTop) + 0.6} rx="1.4" fill={SOCK} />
                <ellipse cx={x + side * 1.3} cy={ankle + 1.3} rx="3.3" ry="1.7" fill={SOCK} transform={toe} />
                <ellipse cx={x + side * 1.3} cy={ankle + 2} rx="2.6" ry="0.7" fill={SOCK_SHADE} transform={toe} />
              </g>
            )
          })}
        <path d={`M47.6 ${74 + dy} L61.4 ${74 + dy} L63.6 ${83.2 + dy} Q54.5 ${85.2 + dy} 45.4 ${83.2 + dy} Z`} fill={SKIRT} />
        <path d={`M51 ${76 + dy} L50.2 ${83.6 + dy} M58 ${76 + dy} L58.8 ${83.6 + dy}`} stroke={SKIRT_DARK} strokeWidth="0.8" strokeLinecap="round" />
      </Layer>
      {/* どう・くび・あたま: こし を じく に かたむく */}
      <Layer rotate={c.lean} origin={[HIP[0], HIP[1] + dy]}>
        <rect x={HIP[0] - 2.2} y={55.5 + dy} width="4.4" height="5.6" rx="2" fill={SKIN_SHADE} />
        <rect x={HIP[0] - 7} y={59.2 + dy} width="14" height="19.4" rx="5.6" fill={SHIRT} />
        <path d={`M${HIP[0] - 3} ${59.6 + dy} Q${HIP[0]} ${62.4 + dy} ${HIP[0] + 3} ${59.6 + dy}`} fill="none" stroke={SHIRT_DARK} strokeWidth="1.2" strokeLinecap="round" />
        <Layer x={HIP[0]} y={50 + dy + c.look * 1.2} rotate={c.headTilt} origin={[0, 7.4]}>
          <ChildHeadFront mood={c.mood} look={c.look} tail={c.tail} />
        </Layer>
      </Layer>
      {/* せいざ の ひざ(スカートが ひざに かかる) */}
      <Layer opacity={span(c.kneel, 0.45, 0.75)}>
        <path d="M42.4 97.2 C41.8 90.6 44.4 86.6 48.6 86.2 L60.4 86.2 C64.6 86.6 67.2 90.6 66.6 97.2 C59 98.8 50 98.8 42.4 97.2 Z" fill={SKIRT} />
        <path d="M54.5 88.6 V97.6" stroke={SKIRT_DARK} strokeWidth="0.8" strokeLinecap="round" />
      </Layer>
    </>
  )
}

/** 子どもの うで(半そで)。かた → ひじ → 手。color・skin を かえると、むこうがわ の うで にも 使える */
function ChildArm({ shoulder, joints, color = SHIRT, skin = SKIN }: { readonly shoulder: Pt; readonly joints: ArmJoints; readonly color?: string; readonly skin?: string }) {
  return (
    <>
      <path d={`M${xy(shoulder)} L${xy(joints.elbow)} L${xy(joints.hand)}`} fill="none" stroke={skin} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${xy(shoulder)} L${xy(lerpPt(shoulder, joints.elbow, 0.6))}`} stroke={color} strokeWidth="5.6" strokeLinecap="round" />
      <circle cx={joints.hand[0]} cy={joints.hand[1]} r="2.6" fill={skin} />
    </>
  )
}

/** 子ども(横むき。左へ あるく)。体の まんなか が HIP の x */
function ChildSide({ stride, tail }: { readonly stride: number; readonly tail: number }) {
  const x = HIP[0]
  const shoulder: Pt = [x, SHOULDER_Y]
  const swing = stride * 26
  const leg = (deg: number, skin: string, sock: string) => (
    <Layer rotate={deg} origin={[x, 80]}>
      <rect x={x - 2.1} y="80" width="4.2" height="13.2" rx="2" fill={skin} />
      <rect x={x - 2.2} y="89.6" width="4.4" height="4" rx="1.4" fill={sock} />
      <ellipse cx={x - 1.4} cy="94.3" rx="3.3" ry="1.6" fill={sock} />
    </Layer>
  )
  return (
    <>
      {/* むこうの うで・あし(体の うしろ。少し こい色) */}
      <ChildArm shoulder={shoulder} joints={fk(shoulder, 90 - swing, 104 - swing, CHILD_ARM)} color={SHIRT_DARK} skin={SKIN_SHADE} />
      {leg(-stride * 18, SKIN_SHADE, SOCK_SHADE)}
      {leg(stride * 18, SKIN, SOCK)}
      <path d={`M${x - 5.6} 74 L${x + 5.6} 74 L${x + 7.6} 83 Q${x} 84.8 ${x - 7.6} 83 Z`} fill={SKIRT} />
      <rect x={x - 2.2} y="55.5" width="4.4" height="5.6" rx="2" fill={SKIN_SHADE} />
      <rect x={x - 5.5} y="59.2" width="11" height="19.4" rx="5" fill={SHIRT} />
      {/* あたま: かお は 左(すすむ ほう)。ポニーテール は むこうがわ で むすんで いるので、うしろ に 少し 見える */}
      <Layer rotate={tail * 0.6} origin={[x + 4.6, 44.4]}>
        <path d={`M${x + 3.6} 42.6 C${x + 8.4} 41.4 ${x + 12.6} 44 ${x + 12.8} 48.6 C${x + 12.8} 49.6 ${x + 12} 50 ${x + 11.4} 49.2 C${x + 10.4} 47.2 ${x + 8} 46.2 ${x + 5.2} 46.8 Z`} fill={HAIR} />
      </Layer>
      <circle cx={x - 1} cy="50" r="7.6" fill={SKIN} />
      <path d={`M${x - 8.4} 48.6 C${x - 8.6} 41.6 ${x - 2} 39.4 ${x + 3.4} 41.4 C${x + 8} 43.2 ${x + 8.2} 50 ${x + 5.8} 55.4 C${x + 4.2} 51.6 ${x + 2.6} 49.6 ${x + 0.8} 48.8 C${x - 1.6} 46.8 ${x - 5.2} 46.4 ${x - 8.4} 48.6 Z`} fill={HAIR} />
      <circle cx={x + 3.6} cy="43" r="1.4" fill={HAIR_TIE} />
      <circle cx={x - 5.4} cy="49.8" r="1.05" fill={EYE} />
      <circle cx={x - 4.8} cy="53.2" r="1.6" fill={CHEEK} opacity="0.55" />
      <path d={`M${x - 8.3} 53.2 Q${x - 7.4} 54.4 ${x - 6.4} 53.8`} fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
      {/* てまえの うで: 足と ぎゃくに ふる */}
      <ChildArm shoulder={shoulder} joints={fk(shoulder, 90 + swing, 104 + swing, CHILD_ARM)} />
    </>
  )
}

/** せんせいの あたま(こちら むき。ボブ と めがね)。まんなか が (0, 0) */
function TeacherHead({ mood, gaze, look }: { readonly mood: TeacherMood; readonly gaze: number; readonly look: number }) {
  const eyeX = gaze + look * 0.4
  const eyeY = 0.9 + look * 0.8
  return (
    <>
      <path d="M-9.4 5.4 C-10.4 -4 -6.2 -9.8 0 -9.8 C6.2 -9.8 10.4 -4 9.4 5.4 C7.8 6.4 6.6 6 6.2 4.8 L-6.2 4.8 C-6.6 6 -7.8 6.4 -9.4 5.4 Z" fill={TEACHER_HAIR} />
      <circle r="8.3" fill={SKIN} />
      {/* まえがみ: 左で わけて、右へ ながす */}
      <path d="M-8.6 0.6 C-9.2 -6.4 -4.4 -9.6 0.4 -9.4 C5.8 -9.2 9.2 -5.8 8.6 0.6 C7.6 -2.8 5.4 -4.6 2.4 -5 C-0.4 -4.6 -2.6 -3.2 -4.2 -1.2 C-5.4 -3 -7.4 -2.2 -8.6 0.6 Z" fill={TEACHER_HAIR} />
      <circle cx="-5.3" cy="3.8" r="1.8" fill={CHEEK} opacity="0.45" />
      <circle cx="5.3" cy="3.8" r="1.8" fill={CHEEK} opacity="0.45" />
      {mood === 'joy' ? (
        <>
          <path d="M-4.3 1.3 Q-3.1 -0.4 -1.9 1.3 M1.9 1.3 Q3.1 -0.4 4.3 1.3" fill="none" stroke={EYE} strokeWidth="1" strokeLinecap="round" />
          <path d="M-2 4.2 Q0 3.9 2 4.2 Q1.7 7 0 7 Q-1.7 7 -2 4.2 Z" fill={MOUTH} />
        </>
      ) : (
        <>
          <circle cx={-3.1 + eyeX} cy={eyeY} r="0.95" fill={EYE} />
          <circle cx={3.1 + eyeX} cy={eyeY} r="0.95" fill={EYE} />
          <path d="M-1.7 4.4 Q0 5.9 1.7 4.4" fill="none" stroke={MOUTH} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      <g fill="#ffffff" fillOpacity="0.25" stroke={GLASSES} strokeWidth="0.6">
        <circle cx="-3.1" cy="0.8" r="2.4" />
        <circle cx="3.1" cy="0.8" r="2.4" />
        <path d="M-0.7 0.4 Q0 -0.1 0.7 0.4" fill="none" />
      </g>
    </>
  )
}

/** せんせい(こちら むき。せいざ)の 体。うで は べつに描く */
function TeacherBody({ s }: { readonly s: TeacherState }) {
  const { cx, up } = s
  const f = TEACHER_FLOOR
  return (
    <>
      <path d={`M${cx - 12.8} ${f} C${cx - 13.4} 88 ${cx - 10.4} 84.2 ${cx - 6} 84 L${cx + 6} 84 C${cx + 10.4} 84.2 ${cx + 13.4} 88 ${cx + 12.8} ${f} C${cx + 5} ${f + 1.6} ${cx - 5} ${f + 1.6} ${cx - 12.8} ${f} Z`} fill={TEACHER_SKIRT} />
      <Layer rotate={s.lean} origin={[cx, TEACHER_WAIST]}>
        <rect x={cx - 2.4} y={63.4 - up} width="4.8" height="6" rx="2" fill={SKIN_SHADE} />
        <rect x={cx - 9} y={68.6 - up} width="18" height="19" rx="6.5" fill={CARDIGAN} />
        <path d={`M${cx - 3.8} ${68.8 - up} L${cx} ${74.6 - up} L${cx + 3.8} ${68.8 - up} Z`} fill={BLOUSE} />
        <path d={`M${cx} ${74.6 - up} V${86.6 - up}`} stroke={CARDIGAN_DARK} strokeWidth="0.9" />
        <circle cx={cx + 1.3} cy={78 - up} r="0.65" fill={CARDIGAN_DARK} />
        <circle cx={cx + 1.3} cy={82 - up} r="0.65" fill={CARDIGAN_DARK} />
        <Layer x={cx} y={57.4 - up} rotate={s.headTilt} origin={[0, 7.6]}>
          <TeacherHead mood={s.mood} gaze={s.gaze} look={s.look} />
        </Layer>
      </Layer>
    </>
  )
}

/** せんせいの うで(長そで)。かた → ひじ → 手 */
function TeacherArm({ shoulder, joints }: { readonly shoulder: Pt; readonly joints: ArmJoints }) {
  const cuff = lerpPt(joints.elbow, joints.hand, 0.74)
  return (
    <>
      <path d={`M${xy(cuff)} L${xy(joints.hand)}`} stroke={SKIN} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M${xy(shoulder)} L${xy(joints.elbow)} L${xy(cuff)}`} fill="none" stroke={CARDIGAN_DARK} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={joints.hand[0]} cy={joints.hand[1]} r="2.9" fill={SKIN} />
    </>
  )
}

/* ───── 紙・すずり・ふで ───── */

/** したじき・半紙・ぶんちん・すずり と、紙に かいた まる と はなまる */
function Desk({ t }: SceneProps) {
  const circle = partialPath(circlePoint, circleDrawn(t), 48)
  const petals = partialPath(petalPoint, petalsDrawn(t), 120)
  return (
    <>
      <path d="M37.6 96.6 L59.4 96.6 L61.8 104.6 L35.2 104.6 Z" fill={FELT} />
      <path d="M39.8 97.2 L57.2 97.2 L59 103.9 L38 103.9 Z" fill={PAPER} />
      <rect x="41.6" y="96.6" width="13.8" height="1.3" rx="0.5" fill="#4a4f60" />
      {circle && <path d={circle} fill="none" stroke={SUMI} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />}
      {petals && <path d={petals} fill="none" stroke={SHU} strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" />}
      <path d="M28.4 97.4 L35 97.4 L35.8 103 L27.6 103 Z" fill={STONE} />
      <path d="M29.3 98.2 L34.1 98.2 L34.7 102.2 L28.7 102.2 Z" fill={STONE_LIGHT} />
      <ellipse cx="31.7" cy="101.1" rx="2" ry="0.75" fill="#15151c" />
    </>
  )
}

/** ふで 1本(おしり → 先)。先の 毛 は すみ(または しゅ)の 色 */
function Brush({ end, tip, ink }: { readonly end: Pt; readonly tip: Pt; readonly ink: string }) {
  const neck = lerpPt(end, tip, 0.68)
  return (
    <>
      <path d={`M${xy(end)} L${xy(neck)}`} stroke={BAMBOO} strokeWidth="1.3" strokeLinecap="round" />
      <path d={`M${xy(neck)} L${xy(tip)}`} stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
    </>
  )
}

/** 子どもの ふで: すずり の上に ねている → 手に もつ → また もどす */
function ChildBrush({ c }: { readonly c: ChildState }) {
  const hand = c.armLeft.hand
  return <Brush end={lerpPt(BRUSH_END_REST, add(hand, [-0.4, -3.6]), c.holding)} tip={lerpPt(BRUSH_TIP_REST, add(hand, BRUSH_DOWN), c.holding)} ink={SUMI} />
}

/** せんせいの 赤い ふで。花びら を かく あいだは、手 と 線の はし を むすぶ(先が 線に ぴったり つく) */
function RedBrush({ t, hand, opacity }: { readonly t: number; readonly hand: Pt; readonly opacity: number }) {
  const tip = t >= PETAL_FROM && t <= PETAL_TO ? petalPoint(petalsDrawn(t)) : add(hand, RED_BRUSH_IDLE)
  const back = sub(hand, tip)
  return (
    <g opacity={opacity}>
      <Brush end={add(hand, [back[0] * 0.5, back[1] * 0.5])} tip={tip} ink={SHU} />
    </g>
  )
}

/** はくしゅ の「ぱちぱち」。手が あうたびに、よこへ 小さな線が とぶ(上へ とばすと 子どもの うで に かさなる) */
function ClapMarks({ s }: { readonly s: TeacherState }) {
  const hit = s.clapPhase < 0.5 ? 0 : 1 - Math.min(1, Math.abs(Math.sin(s.clapPhase * Math.PI)) / 0.5)
  if (hit <= 0) return null
  const at = (a: number, r: number): Pt => [s.cx + Math.cos(rad(a)) * r, CLAP_Y - s.up + Math.sin(rad(a)) * r]
  return (
    <g opacity={hit} stroke="#f2a93b" strokeWidth="0.9" strokeLinecap="round">
      {[-160, 160, -20, 20].map((a) => <path key={a} d={`M${xy(at(a, 4.6))} L${xy(at(a, 7))}`} />)}
    </g>
  )
}

/** すずめ: やねの むね に とまって、子どもが とびあがると おどろいて とんでいく */
function Sparrow({ t }: SceneProps) {
  const arrive = span(t, ARRIVE + 0.5, ARRIVE + 1.1, easeOut)
  const leave = span(t, CHEER + 0.02, CHEER + 0.7, easeInOut)
  if (arrive <= 0 || leave >= 1) return null
  const perch: Pt = [80.4, 27.4]
  const x = arrive < 1 ? lerp(118, perch[0], arrive) : lerp(perch[0], 122, leave)
  const y = arrive < 1 ? lerp(4, perch[1], arrive) - Math.sin(arrive * Math.PI) * 4 : lerp(perch[1], -6, leave)
  const flying = arrive < 1 || leave > 0
  const hop = flying ? 0 : Math.max(0, wave(t, 1.1))
  return (
    <Layer x={x} y={y - hop} scaleX={leave > 0 ? -1 : 1}>
      <path d="M2.6 -0.6 L6.4 -2.2 L5.6 0.4 Z" fill={SPARROW_DARK} />
      <ellipse cx="0" cy="0" rx="3.4" ry="2.5" fill={SPARROW} />
      <ellipse cx="-0.6" cy="0.9" rx="2.2" ry="1.4" fill="#efe2cc" />
      <circle cx="-2.6" cy="-1.9" r="2" fill={SPARROW_DARK} />
      <circle cx="-3" cy="-1.3" r="1" fill="#ffffff" />
      <circle cx="-3.2" cy="-2.2" r="0.45" fill={EYE} />
      <path d="M-4.4 -1.9 L-5.8 -1.4 L-4.4 -1 Z" fill="#3a3a3a" />
      <Layer rotate={flying ? wave(t, 0.14) * 30 : 0} origin={[0.2, -0.8]}>
        <path d="M-1 -1 Q1.8 -3.6 3.8 -0.6 Q1.6 0.6 -1 -1 Z" fill={SPARROW_DARK} />
      </Layer>
      {!flying && <path d="M-0.8 2.3 V3.4 M0.8 2.3 V3.4" stroke="#7a5a3a" strokeWidth="0.5" />}
    </Layer>
  )
}

function Scene({ t }: SceneProps) {
  const ink = inkTiming(t, INK, DONE, 8)
  const child = childState(t)
  const teacher = teacherState(t, child)
  // せんせい と 紙・すずり は、きょうしつ が できたあと ぽん と出る
  const teacherPop = span(t, 0.6, 0.95, backOut)
  const deskPop = span(t, 0.7, 1.0, backOut)
  const cheering = t >= CHEER
  // できあがりで、字が ぽん と はずむ
  const bump = Math.sin(span(t, DONE - 0.9, DONE - 0.45) * Math.PI) * 0.05
  const teacherLayer = (node: ReactNode) => (
    <Layer scale={teacherPop} opacity={span(t, 0.6, 0.7)} origin={[teacher.cx, TEACHER_FLOOR]}>
      {node}
    </Layer>
  )

  return (
    <>
      <Layer opacity={ink.picture}>
        <Sun t={t} />
        <Ground t={t} />
        <House t={t} />
        <Vase t={t} />
        <Sparrow t={t} />
        {/* せんせい(子ども より おく)。はくしゅ の ときは 右手 も ここ(子どもが ひろげた うで が まえ を 通る) */}
        {teacherLayer(
          <>
            <TeacherBody s={teacher} />
            <TeacherArm shoulder={teacher.shoulderRight} joints={teacher.armRight} />
            {cheering && <TeacherArm shoulder={teacher.shoulderLeft} joints={teacher.armLeft} />}
          </>,
        )}
        {/* 子ども: 横むき で あるいてきて、くるっと こちらを むく */}
        <Layer opacity={span(t, ARRIVE - 0.05, ARRIVE + 0.1)}>
          <Layer x={child.walkX} y={-Math.abs(child.stride) * 1.3} scaleX={child.sideScale} origin={[HIP[0], 75]}>
            <ChildSide stride={child.stride} tail={child.tail} />
          </Layer>
          <Layer scaleX={child.frontScale} origin={[HIP[0], 75]}>
            <ChildFrontBody c={child} />
          </Layer>
        </Layer>
        {/* 紙 は ひざ の まえ(子どもの 体 より てまえ、うで より おく) */}
        <Layer scale={deskPop} origin={[48, 100]}>
          <Desk t={t} />
        </Layer>
        <Layer scaleX={child.frontScale} origin={[HIP[0], 75]}>
          <ChildArm shoulder={child.shoulderLeft} joints={child.armLeft} />
          <ChildArm shoulder={child.shoulderRight} joints={child.armRight} />
        </Layer>
        {/* せんせいの 右手(見る人の 左): 子どもの 手に かさねる ので、子ども より まえ に描く */}
        {!cheering && teacherLayer(<TeacherArm shoulder={teacher.shoulderLeft} joints={teacher.armLeft} />)}
        <Layer scale={deskPop} origin={[48, 100]}>
          <ChildBrush c={child} />
        </Layer>
        {teacher.redBrush > 0 && <RedBrush t={t} hand={teacher.armLeft.hand} opacity={teacher.redBrush} />}
        <ClapMarks s={teacher} />
        <FallingPetals t={t} />
      </Layer>
      <BoneGlow char={CHAR} opacity={during(t, INK - 0.2, INK + 0.45, 0.2) * 0.85} />
      <Layer scale={1 + bump} origin={[54.5, 54.5]}>
        <Ink char={CHAR} progress={ink.progress} tint={ink.tint} />
      </Layer>
      <Sparkles cx={54.5} cy={56} progress={ink.sparkle} />
    </>
  )
}

const scene: SceneModule = {
  char: CHAR,
  duration: DURATION,
  beats: [
    { at: 0, label: 'あさ。やねの ある きょうしつ が できる', sound: 'pop' },
    { at: ARRIVE, label: '女の子が やねの 下に やってくる' },
    { at: SIT, label: 'せんせいの となりに すわる', sound: 'pop' },
    { at: LESSON, label: 'せんせいが 手を とって、いっしょに かく' },
    { at: ALONE, label: 'こんどは ひとりで かく' },
    { at: HANAMARU, label: 'せんせいが はなまる を くれる' },
    { at: CHEER, label: 'できた! とびあがって 手を ひろげる。朝日が さす', sound: 'pop' },
    { at: INK, label: 'ほね が ひかり、絵が うすくなって 字になる', sound: 'stroke' },
    { at: DONE - 0.9, label: '学 の できあがり', sound: 'ok' },
  ],
  Scene,
}

export default scene
