import type { Point } from './limbs'

/** 山 の 形(絵 は mountain.tsx)。山はだ の 上 の 点 は mountainPoint で もとめる(山小屋・木 を 山はだ に おく ときに使う) */
export type MountainShape = {
  /** みね の てっぺん */
  readonly top: Point
  /** ふもと の y(のはら に かくれる 高さ) */
  readonly foot: number
  /** ふもと での はば の 半分 */
  readonly half: number
  /** 山はだ の まっすぐさ(1 = まっすぐ な 三角。省くと 0.6) */
  readonly straight?: number
  /** りょうせん を じぶん で きめる とき: てっぺん から ふもと まで の SVG の つづき(C・L など)。省くと ほぼ まっすぐ 下 */
  readonly ridge?: string
}

/** 山はだ の 上 の 点。side は 左(-1)・右(1)、d は てっぺん(0)から ふもと(1)まで */
export function mountainPoint(p: MountainShape, side: -1 | 1, d: number): Point {
  const straight = p.straight ?? 0.6
  const spread = p.half * (straight * d + (1 - straight) * d * d)
  return [p.top[0] + side * spread, p.top[1] + (p.foot - p.top[1]) * d]
}

/** 山はだ を d0 から d1 まで なぞる 2次ベジェ の 制御点(山はだ は 放物線 なので ぴったり なぞれる) */
export function slopeControl(p: MountainShape, side: -1 | 1, d0: number, d1: number): Point {
  const straight = p.straight ?? 0.6
  const [x, y] = mountainPoint(p, side, d0)
  const k = (d1 - d0) / 2
  return [x + k * side * p.half * (straight + 2 * (1 - straight) * d0), y + k * (p.foot - p.top[1])]
}
