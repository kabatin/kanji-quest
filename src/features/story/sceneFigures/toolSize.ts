import type { Point } from './limbs'

/** 手に もつ 細い 道具 の 種類 と 大きさ(絵 は tools.tsx) */
export type ToolKind = 'brush' | 'pencil' | 'stick'

export type ToolSpec = {
  readonly kind: ToolKind
  /** 先 の 場所(画面の 座標) */
  readonly tip?: Point
  /** tip が ない ときの むき(画面の 角度。0 = 右、90 = 下) */
  readonly angle?: number
  /** 道具 の 長さ(画面の 単位)。省くと 道具 ごとの 長さ(体の 大きさ に 合わせる) */
  readonly length?: number
  /** ふで の 毛 の 色(すみ・しゅ) */
  readonly ink?: string
}

/** 道具 ごとの 長さ・太さ(背の高さ 100 の 単位)と、手 より うしろ に 出る ぶん の わりあい */
export const TOOL_SIZE: Readonly<Record<ToolKind, { readonly length: number; readonly back: number; readonly width: number }>> = {
  brush: { length: 19, back: 0.4, width: 2.4 },
  pencil: { length: 15, back: 0.42, width: 2.2 },
  stick: { length: 40, back: 0.12, width: 2.6 },
}

/** 手 に もった 道具 の 先 と おしり(画面の 座標)。hand は 手 の まんなか、scale は 体の 倍率 */
export function toolEnds(spec: ToolSpec, hand: Point, scale: number): { readonly tip: Point; readonly end: Point } {
  const size = TOOL_SIZE[spec.kind]
  const length = spec.length ?? size.length * scale
  if (spec.tip) {
    const dx = spec.tip[0] - hand[0]
    const dy = spec.tip[1] - hand[1]
    const d = Math.hypot(dx, dy) || 1
    const back = length * size.back
    return { tip: spec.tip, end: [hand[0] - (dx / d) * back, hand[1] - (dy / d) * back] }
  }
  const a = ((spec.angle ?? 90) * Math.PI) / 180
  const dir: Point = [Math.cos(a), Math.sin(a)]
  return { tip: [hand[0] + dir[0] * length * (1 - size.back), hand[1] + dir[1] * length * (1 - size.back)], end: [hand[0] - dir[0] * length * size.back, hand[1] - dir[1] * length * size.back] }
}
