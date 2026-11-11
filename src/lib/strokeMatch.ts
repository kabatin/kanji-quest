export type Point = readonly [number, number]

/** 判定に使う点の数。画データ側(scripts/build-strokes.mjs の STROKE_POINTS)と同じにする。 */
export const MATCH_POINTS = 8

// 子どもが指で書くので、かなり甘めにしている。単位は漢字の座標(1字 = 109 x 109)。
const START_TOLERANCE = 24
const END_TOLERANCE = 28
const AVERAGE_TOLERANCE = 17
/** お手本の長さにくらべて、これより短い線は「書いていない」とみなす */
const MIN_LENGTH_RATIO = 0.4
/** 点のような短い画(てん・はね)は、長さでは判定しない */
const SHORT_STROKE = 14

const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1])

export function pathLength(points: readonly Point[]): number {
  return points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0)
}

/** 折れ線を、道のりで等間隔な count 個の点にとりなおす。 */
export function resample(points: readonly Point[], count: number): Point[] {
  if (points.length === 0) return []
  const lengths = points.slice(1).map((p, i) => distance(points[i], p))
  const total = lengths.reduce((sum, l) => sum + l, 0)
  if (total === 0) return Array.from({ length: count }, () => points[0])
  return Array.from({ length: count }, (_, k) => {
    let rest = (total * k) / (count - 1)
    for (let i = 0; i < lengths.length; i += 1) {
      if (rest <= lengths[i] || i === lengths.length - 1) {
        const t = lengths[i] === 0 ? 0 : Math.min(rest / lengths[i], 1)
        return [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t] as const
      }
      rest -= lengths[i]
    }
    return points[points.length - 1]
  })
}

/**
 * 指で書いた線が、お手本の1画と合っているか。
 * 書きはじめ・書きおわりの位置と、途中の通り道がお手本に近ければ合格。向き(書き順の方向)も見る。
 */
export function matchStroke(drawn: readonly Point[], target: readonly Point[]): boolean {
  if (drawn.length < 2 || target.length < 2) return false
  const targetLength = pathLength(target)
  if (targetLength > SHORT_STROKE && pathLength(drawn) < targetLength * MIN_LENGTH_RATIO) return false
  const user = resample(drawn, target.length)
  if (distance(user[0], target[0]) > START_TOLERANCE) return false
  if (distance(user[user.length - 1], target[target.length - 1]) > END_TOLERANCE) return false
  const average = user.reduce((sum, p, i) => sum + distance(p, target[i]), 0) / user.length
  return average <= AVERAGE_TOLERANCE
}
