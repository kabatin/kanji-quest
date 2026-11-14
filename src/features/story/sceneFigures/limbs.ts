/**
 * うで・あし(2本の ほね)の 計算。body.ts の personRig が 使う。
 *
 * 関節の 角度は「ま下 から 何度」:
 *   横むき … + = まえへ(うで を まえに あげる / ももを まえに あげる)
 *   正面・うしろむき … + = 外へ(体の まんなか から はなれる ほう)
 * ひじ は まえ(横むき)にしか まがらず、ひざ は うしろ にしか まがらない。
 *
 * 正面・うしろむき では、画面の 上下・左右 の ほかに「まえ・うしろ」(おくゆき)の 角度 も つけられる:
 *   fore     … つけね を まえへ(+)・うしろへ(-)。もも を まえに あげて すわる、うで を まえへ のばす など
 *   foreBend … ひじ は まえへ、ひざ は うしろへ まがる
 * まえ・うしろ に むいた ほね は 短く 見え、少し 上から 見ている ので、見る人に 近い ほど 画面の 下に 来る(DEPTH_TILT)。
 */

export type Point = readonly [number, number]

/** 関節の 角度で 決める。swing = つけね(かた・こし)の 角度、bend = ひじ・ひざ の まがり */
export type LimbAngles = {
  readonly swing: number
  readonly bend: number
  /** 正面・うしろむき だけ: つけね を まえへ(+)・うしろへ(-)。横むき では つかわない */
  readonly fore?: number
  /** 正面・うしろむき だけ: ひじ・ひざ の まえうしろ の まがり(0 以上) */
  readonly foreBend?: number
}
/** 手先・足先を、画面の この点に とどかせる(とどかないときは、まっすぐ のばした ところ まで) */
export type LimbTarget = { readonly to: Point }
/** 2つの かっこう の あいだ(k = 0 で a、1 で b)。関節の 角度で まぜるので、うで は 弧を えがいて 動く */
export type LimbMix = { readonly mix: readonly [Limb, Limb]; readonly k: number }
export type Limb = LimbAngles | LimbTarget | LimbMix

export type Kind = 'arm' | 'leg'
/** ほね を うごかす 面: 横むき は 体の まえうしろ の 面、正面・うしろむき は 体の 左右 の 面 */
export type Plane = 'side' | 'front'

/**
 * 少し 上から 見ている ぶん: まえうしろ に 1 すすむと、画面の 上下 に これだけ ずれる。
 * うしろむき の 人が おくへ あるく と 画面の 上へ、正面の 人が てまえへ くると 下へ 進む(walkDepth と 同じ 値)。
 */
export const DEPTH_TILT = 0.3

/** 関節の うごく はんい(これより 先へは まがらない) */
const RANGE: Readonly<Record<Plane, Record<Kind, { readonly swing: Point; readonly bend: Point }>>> = {
  side: {
    arm: { swing: [-60, 200], bend: [0, 160] },
    leg: { swing: [-45, 125], bend: [0, 165] },
  },
  front: {
    arm: { swing: [-50, 185], bend: [-165, 165] },
    leg: { swing: [-15, 90], bend: [-20, 150] },
  },
}

/** まえうしろ の うごく はんい(横むき の swing・bend と 同じ) */
const FORE: Readonly<Record<Kind, { readonly fore: Point; readonly bend: Point }>> = {
  arm: { fore: [-60, 180], bend: [0, 160] },
  leg: { fore: [-45, 125], bend: [0, 165] },
}

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI
export const clamp = (x: number, lo: number, hi: number) => Math.min(Math.max(x, lo), hi)
/** 角度の 差を -180〜180 に */
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180

/** 角度(ま下 から、+ = まえ / 外)の むきの 長さ1 の ベクトル。outward は 正面で 外が +x なら 1、-x なら -1 */
function dir(angle: number, outward: number): Point {
  return [Math.sin(rad(angle)) * outward, Math.cos(rad(angle))]
}

export type LimbJoints = {
  readonly root: Point
  readonly mid: Point
  readonly end: Point
  readonly swing: number
  readonly bend: number
  /** まえうしろ の 角度(正面・うしろむき だけ。横むき は 0) */
  readonly fore: number
  readonly foreBend: number
  /** ひじ・ひざ の まえうしろ の 位置(つけね から。+ = 顔の むく ほう) */
  readonly midDepth: number
  /** 手先・足先 の まえうしろ の 位置(つけね から。+ = 顔の むく ほう) */
  readonly depth: number
}

/**
 * 角度から ひじ・手(ひざ・くるぶし)の 場所を出す。うごく はんい の外は 止める。
 * tilt は 正面 なら +DEPTH_TILT、うしろむき なら -DEPTH_TILT(まえ が 見る人から とおい)、横むき は 0。
 */
export function forward(root: Point, angles: LimbAngles, lengths: Point, kind: Kind, plane: Plane, outward: number, tilt = 0): LimbJoints {
  const range = RANGE[plane][kind]
  const swing = clamp(angles.swing, range.swing[0], range.swing[1])
  const bend = clamp(angles.bend, range.bend[0], range.bend[1])
  // うで は まえ(外)へ、あし は うしろ(内)へ まがる
  const second = kind === 'arm' ? swing + bend : swing - bend
  // まえうしろ: ほね が まえうしろ に むくほど 画面では 短く 見える(正面・うしろむき だけ)
  const deep = plane === 'front'
  const fore = deep ? clamp(angles.fore ?? 0, FORE[kind].fore[0], FORE[kind].fore[1]) : 0
  const foreBend = deep ? clamp(angles.foreBend ?? 0, FORE[kind].bend[0], FORE[kind].bend[1]) : 0
  const fore2 = kind === 'arm' ? fore + foreBend : fore - foreBend
  const near1 = Math.cos(rad(fore))
  const near2 = Math.cos(rad(fore2))
  const z1 = Math.sin(rad(fore)) * lengths[0]
  const z2 = Math.sin(rad(fore2)) * lengths[1]
  const [ax, ay] = dir(swing, outward)
  const mid: Point = [root[0] + ax * lengths[0] * near1, root[1] + ay * lengths[0] * near1 + z1 * tilt]
  const [bx, by] = dir(second, outward)
  const end: Point = [mid[0] + bx * lengths[1] * near2, mid[1] + by * lengths[1] * near2 + z2 * tilt]
  return { root, mid, end, swing, bend, fore, foreBend, midDepth: z1, depth: z1 + z2 }
}

/**
 * 先を target に とどかせる 角度(2本の ほね の 計算)。
 * 横むき: ひじ は うしろ・下へ、ひざ は まえへ 出る。正面: ひじ・ひざ は 外へ 出る。
 */
export function reach(root: Point, target: Point, lengths: Point, kind: Kind, view: Plane, outward = 1): LimbAngles {
  const [l1, l2] = lengths
  const vx = (target[0] - root[0]) * outward
  const vy = target[1] - root[1]
  const d = clamp(Math.hypot(vx, vy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01)
  const toward = deg(Math.atan2(vx, vy))
  const open = deg(Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)))
  const candidates = [toward - open, toward + open]
  const pick = (swing: number) => {
    const mid: Point = [Math.sin(rad(swing)) * l1, Math.cos(rad(swing)) * l1]
    const end: Point = [Math.sin(rad(toward)) * d, Math.cos(rad(toward)) * d]
    const second = deg(Math.atan2(end[0] - mid[0], end[1] - mid[1]))
    const bend = kind === 'arm' ? wrap(second - swing) : wrap(swing - second)
    return { swing, bend, out: mid[0] }
  }
  const [a, b] = candidates.map(pick)
  // 正面: ひじ・ひざ が 外に 出る ほう / 横むき: まがる むき が 正しい ほう(bend ≥ 0)
  const ok = view === 'front' ? (a.out >= b.out ? a : b) : kind === 'arm' ? a : b
  const range = RANGE[view][kind]
  if (ok.swing >= range.swing[0] && ok.swing <= range.swing[1]) return { swing: ok.swing, bend: ok.bend }
  // つけね が まわりきらない 点(体の うしろ の 下 など)は、まわる ところ まで まわして、先を 点の ほうへ むける
  const swing = clamp(ok.swing, range.swing[0], range.swing[1])
  const mid: Point = [Math.sin(rad(swing)) * l1, Math.cos(rad(swing)) * l1]
  const second = deg(Math.atan2(vx - mid[0], vy - mid[1]))
  return { swing, bend: kind === 'arm' ? wrap(second - swing) : wrap(swing - second) }
}

export function isTarget(limb: Limb): limb is LimbTarget {
  return 'to' in limb
}

export function isMix(limb: Limb): limb is LimbMix {
  return 'mix' in limb
}

/** 2つの かっこう を まぜる(関節の 角度で)。k は 0〜1 */
export function mixLimb(a: Limb, b: Limb, k: number): LimbMix {
  return { mix: [a, b], k }
}

/** 角度 どうし を まぜる(まえうしろ の 角度も) */
export function mixAngles(a: LimbAngles, b: LimbAngles, k: number): LimbAngles {
  const lerp = (x: number, y: number) => x + (y - x) * k
  const base = { swing: lerp(a.swing, b.swing), bend: lerp(a.bend, b.bend) }
  if (a.fore === undefined && b.fore === undefined && a.foreBend === undefined && b.foreBend === undefined) return base
  return { ...base, fore: lerp(a.fore ?? 0, b.fore ?? 0), foreBend: lerp(a.foreBend ?? 0, b.foreBend ?? 0) }
}

/** たらした うで・まっすぐ の あし(何も 指定しないときの かっこう) */
export const HANG_ARM: LimbAngles = { swing: 4, bend: 8 }
export const STRAIGHT_LEG: LimbAngles = { swing: 0, bend: 0 }
