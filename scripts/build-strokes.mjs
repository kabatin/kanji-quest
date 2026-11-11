// SVG のパスを折れ線にして、外接矩形と「通り道の点」を計算する(scripts/build-data.mjs が使う)。
const ARG_COUNT = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0 }
const TOKEN = /([MmLlHhVvCcSsQqTtZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g
const CURVE_STEPS = 12

const round = (n, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits

const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t
  return [0, 1].map((i) => u ** 3 * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t ** 3 * p3[i])
}

const quadratic = (p0, p1, p2, t) => {
  const u = 1 - t
  return [0, 1].map((i) => u * u * p0[i] + 2 * u * t * p1[i] + t * t * p2[i])
}

const curvePoints = (at) => Array.from({ length: CURVE_STEPS }, (_, i) => at((i + 1) / CURVE_STEPS))

/** パスを、書く順に並んだ点の列(折れ線)にする。 */
export function flattenPath(d) {
  const tokens = [...d.matchAll(TOKEN)].map((m) => m[1] ?? Number(m[2]))
  const points = []
  let cur = [0, 0]
  let start = [0, 0]
  let lastControl = null
  let cmd = null
  let i = 0
  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') {
      cmd = tokens[i]
      i += 1
      if (cmd.toUpperCase() === 'Z') {
        points.push(start)
        cur = start
        continue
      }
    }
    if (cmd === null) throw new Error(`パスがコマンドで始まっていません: ${d}`)
    const upper = cmd.toUpperCase()
    const relative = cmd !== upper
    const count = ARG_COUNT[upper]
    const args = tokens.slice(i, i + count)
    if (args.length < count || args.some((a) => typeof a !== 'number')) throw new Error(`パスを読めません: ${d}`)
    i += count
    const abs = (x, y) => (relative ? [cur[0] + x, cur[1] + y] : [x, y])
    // 直前が曲線でないとき、なめらか曲線(S, T)の最初の制御点は現在地になる
    const reflected = lastControl ? [2 * cur[0] - lastControl[0], 2 * cur[1] - lastControl[1]] : cur
    let control = null
    if (upper === 'M') {
      cur = abs(args[0], args[1])
      start = cur
      points.push(cur)
      cmd = relative ? 'l' : 'L'
    } else if (upper === 'L') {
      cur = abs(args[0], args[1])
      points.push(cur)
    } else if (upper === 'H') {
      cur = [relative ? cur[0] + args[0] : args[0], cur[1]]
      points.push(cur)
    } else if (upper === 'V') {
      cur = [cur[0], relative ? cur[1] + args[0] : args[0]]
      points.push(cur)
    } else if (upper === 'C' || upper === 'S') {
      const c1 = upper === 'C' ? abs(args[0], args[1]) : reflected
      const offset = upper === 'C' ? 2 : 0
      const c2 = abs(args[offset], args[offset + 1])
      const end = abs(args[offset + 2], args[offset + 3])
      const from = cur
      points.push(...curvePoints((t) => cubic(from, c1, c2, end, t)))
      control = c2
      cur = end
    } else {
      const c1 = upper === 'Q' ? abs(args[0], args[1]) : reflected
      const end = upper === 'Q' ? abs(args[2], args[3]) : abs(args[0], args[1])
      const from = cur
      points.push(...curvePoints((t) => quadratic(from, c1, end, t)))
      control = c1
      cur = end
    }
    lastControl = control
  }
  return points
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** 折れ線を、道のりで等間隔な count 個の点にとりなおす。 */
export function resample(points, count) {
  const lengths = points.slice(1).map((p, i) => distance(points[i], p))
  const total = lengths.reduce((sum, l) => sum + l, 0)
  if (total === 0) return Array.from({ length: count }, () => points[0])
  return Array.from({ length: count }, (_, k) => {
    let rest = (total * k) / (count - 1)
    for (let i = 0; i < lengths.length; i += 1) {
      if (rest <= lengths[i] || i === lengths.length - 1) {
        const t = lengths[i] === 0 ? 0 : Math.min(rest / lengths[i], 1)
        return [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t]
      }
      rest -= lengths[i]
    }
    return points[points.length - 1]
  })
}

/** 書き取りの判定に使う、1画あたりの点の数 */
export const STROKE_POINTS = 8

/** 1画ぶんのデータ: パス、外接矩形、通り道の点。 */
export function strokeData(d) {
  const points = flattenPath(d)
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  return {
    d,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((n) => round(n)),
    pts: resample(points, STROKE_POINTS).map((p) => [round(p[0], 1), round(p[1], 1)]),
  }
}
