import { pathLength, type Point } from './strokeMatch'

/** 折れ線の上で、書きはじめから 道のりで reach の ところの点(長さが足りなければ おわりの点)。 */
export function pointAlong(points: readonly Point[], reach: number): Point {
  if (points.length < 2) return points[0] ?? [0, 0]
  let rest = Math.max(reach, 0)
  for (let i = 1; i < points.length; i += 1) {
    const [a, b] = [points[i - 1], points[i]]
    const span = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (span > 0 && rest <= span) return [a[0] + ((b[0] - a[0]) * rest) / span, a[1] + ((b[1] - a[1]) * rest) / span]
    rest -= span
  }
  return points[points.length - 1]
}

export type Arrow = {
  /** やじるし の 棒(書きはじめの点の すぐ外から、三角の 根もと まで) */
  readonly shaft: readonly [Point, Point]
  /** 先の 三角(先っぽ, 根もと の かたがわ, もう かたがわ) */
  readonly head: readonly [Point, Point, Point]
}

type ArrowSize = {
  /** 書きはじめの点から あける はば(点に かさならないように) */
  readonly gap: number
  /** 棒と三角を あわせた長さ */
  readonly length: number
  /** 三角の 長さ */
  readonly head: number
}

const ARROW_SIZE: ArrowSize = { gap: 6.5, length: 14, head: 4.6 }
/** 書きはじめの むき を見る長さ(はね や まがり の先は 見ない) */
const DIRECTION_REACH = 12

/**
 * 書きはじめの点から、書きはじめの むき に のびる やじるし。
 * どちらへ書きだすか だけを見せる(画ぜんたいの かたち は 見せない)。
 */
export function startArrow(points: readonly Point[], size: ArrowSize = ARROW_SIZE): Arrow | null {
  const total = pathLength(points)
  if (points.length < 2 || total === 0) return null
  const origin = points[0]
  const toward = pointAlong(points, Math.min(DIRECTION_REACH, total * 0.6))
  const span = Math.hypot(toward[0] - origin[0], toward[1] - origin[1])
  if (span === 0) return null
  const [ux, uy] = [(toward[0] - origin[0]) / span, (toward[1] - origin[1]) / span]
  const at = (reach: number): Point => [origin[0] + ux * reach, origin[1] + uy * reach]
  const tip = at(size.gap + size.length)
  const base = at(size.gap + size.length - size.head)
  const half = size.head * 0.62
  return {
    shaft: [at(size.gap), base],
    head: [tip, [base[0] - uy * half, base[1] + ux * half], [base[0] + uy * half, base[1] - ux * half]],
  }
}

/** 書きおわりの むき を見る長さ */
const END_REACH = 6

/**
 * 線の おわりに つける 三角(先っぽ, 根もと の かたがわ, もう かたがわ)。
 * くらべる ときに、自分が どちら向きに書いたか を 見せる。長さのない線には つけない。
 */
export function endArrowHead(points: readonly Point[], head = 6): Arrow['head'] | null {
  const total = pathLength(points)
  if (points.length < 2 || total === 0) return null
  const back = [...points].reverse()
  const end = back[0]
  const from = pointAlong(back, Math.min(END_REACH, total * 0.5))
  const span = Math.hypot(end[0] - from[0], end[1] - from[1])
  if (span === 0) return null
  const [ux, uy] = [(end[0] - from[0]) / span, (end[1] - from[1]) / span]
  const tip: Point = [end[0] + ux * head * 0.45, end[1] + uy * head * 0.45]
  const base: Point = [tip[0] - ux * head, tip[1] - uy * head]
  const half = head * 0.62
  return [tip, [base[0] - uy * half, base[1] + ux * half], [base[0] + uy * half, base[1] - ux * half]]
}

const round = (n: number): number => Math.round(n * 100) / 100

/** 折れ線を SVG の d にする(点が1つなら、その場の点として描く)。 */
export function toPathD(points: readonly Point[]): string {
  if (points.length === 0) return ''
  const list = points.length === 1 ? [points[0], points[0]] : points
  return list.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join('')
}

/** 点の ならびを SVG の points 属性にする。 */
export function toPolyline(points: readonly Point[]): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
}
