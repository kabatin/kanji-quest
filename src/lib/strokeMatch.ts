export type Point = readonly [number, number]

/** 判定に使う点の数。画データ側(scripts/build-strokes.mjs の STROKE_POINTS)と同じにする。 */
export const MATCH_POINTS = 8

/**
 * 合格の はば。単位は漢字の座標(1字 = 109 x 109)。
 * start / end / average は 書きはじめ・書きおわり・通り道の点の ずれ、
 * minLength / maxLength は お手本の長さに くらべた 長さ の比。
 */
export type Tolerance = {
  readonly start: number
  readonly end: number
  readonly average: number
  /** お手本の長さにくらべて、これより短い線は「書いていない」とみなす */
  readonly minLength: number
  /**
   * お手本の長さにくらべて、これより長い線は「書きなぐり」とみなす
   * (書きはじめ と 書きおわり だけ合わせて、とちゅうで ぐるぐる 書いた線を はじく)。
   * 子どもの線は ふるえて 少し長くなるので、よゆう を持たせている。
   */
  readonly maxLength: number
}

/** 子どもが指で書くので、かなり甘めにしている。 */
export const NORMAL_TOLERANCE: Tolerance = { start: 24, end: 28, average: 17, minLength: 0.4, maxLength: 1.8 }

/**
 * ヒントを見ても まだ合わない画だけに使う、もう少し あまい はば(同じ画で 何回も つまずかないように)。
 * ぎゃく向き や 書く場所の まちがい は、これでも合格にならない。
 */
export const LENIENT_TOLERANCE: Tolerance = { start: 30, end: 34, average: 21, minLength: 0.3, maxLength: 2.2 }

/** 点のような短い画(てん・はね)は、長さでは判定しない */
const SHORT_STROKE = 14
/** 短い画でも、このくらいの よぶん は ゆるす */
const LENGTH_SLACK = 12
/** おわりが ずれた線を「みじかい」「ながい」と言う、お手本の長さとの比 */
const SHORT_RATIO = 0.75
const LONG_RATIO = 1.25

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

/** お手本にくらべて、あからさまに長すぎる線か(ぐるぐる 書きなぐった線)。 */
export function isTooLong(drawn: readonly Point[], target: readonly Point[], tolerance: Tolerance = NORMAL_TOLERANCE): boolean {
  return pathLength(drawn) > pathLength(target) * tolerance.maxLength + LENGTH_SLACK
}

/**
 * 指で書いた線が、お手本の1画と合っているか。
 * 書きはじめ・書きおわりの位置と、途中の通り道がお手本に近ければ合格。向き(書き順の方向)も見る。
 * 長すぎる線(書きなぐり)は、位置が合っていても不合格。
 */
export function matchStroke(drawn: readonly Point[], target: readonly Point[], tolerance: Tolerance = NORMAL_TOLERANCE): boolean {
  return matchPath(drawn, target, tolerance) && !isTooLong(drawn, target, tolerance)
}

const averageGap = (user: readonly Point[], target: readonly Point[]): number => user.reduce((sum, p, i) => sum + distance(p, target[i]), 0) / user.length

/** 長すぎるかどうかは見ずに、位置と通り道だけを お手本と くらべる。 */
function matchPath(drawn: readonly Point[], target: readonly Point[], tolerance: Tolerance): boolean {
  if (drawn.length < 2 || target.length < 2) return false
  const targetLength = pathLength(target)
  if (targetLength > SHORT_STROKE && pathLength(drawn) < targetLength * tolerance.minLength) return false
  const user = resample(drawn, target.length)
  if (distance(user[0], target[0]) > tolerance.start) return false
  if (distance(user[user.length - 1], target[target.length - 1]) > tolerance.end) return false
  return averageGap(user, target) <= tolerance.average
}

/**
 * ok = 合っている / order = 形は合っているが書き順がちがう(あとの画を先に書いた) /
 * long = 場所は合っているが 長すぎる(書きなぐり) / shape = 形がちがう
 */
export type StrokeJudge = 'ok' | 'order' | 'long' | 'shape'

/**
 * 書いた線を、次に書くはずの画と、そのあとの画に てらし合わせる。
 * tolerance は 次の画にだけ使う(あとの画は いつもの はば で見る)。
 */
export function judgeStroke(
  drawn: readonly Point[],
  targets: readonly (readonly Point[])[],
  nextIndex: number,
  tolerance: Tolerance = NORMAL_TOLERANCE,
): StrokeJudge {
  const next = targets[nextIndex]
  if (next && matchStroke(drawn, next, tolerance)) return 'ok'
  if (next && matchPath(drawn, next, tolerance)) return 'long'
  return targets.slice(nextIndex + 1).some((target) => matchStroke(drawn, target)) ? 'order' : 'shape'
}

/**
 * まちがいの わけ。子どもに「どこを直せばよいか」を伝えるのに使う。
 * order = 書き順 / start = 書きはじめの場所 / reverse = 向きが ぎゃく / end = おわりの場所 /
 * short = みじかい(とちゅうで やめた) / long = ながい(すぎた・書きなぐり) / shape = とちゅうの かたち
 */
export type StrokeIssue = 'order' | 'start' | 'reverse' | 'end' | 'short' | 'long' | 'shape'
export type StrokeResult = 'ok' | StrokeIssue

/** 点から折れ線までの いちばん近い きょり */
function distanceToPath(point: Point, path: readonly Point[]): number {
  return path.slice(1).reduce((best, b, i) => {
    const a = path[i]
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    const span = dx * dx + dy * dy
    const t = span === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / span))
    return Math.min(best, distance(point, [a[0] + dx * t, a[1] + dy * t]))
  }, distance(point, path[0]))
}

/** 書きはじめ と 書きおわり が、お手本と入れかわっているか(ぎゃく向きのほうが よく合うときだけ)。 */
function isReversed(user: readonly Point[], target: readonly Point[], tolerance: Tolerance): boolean {
  const [start, end] = [user[0], user[user.length - 1]]
  if (distance(start, target[target.length - 1]) > tolerance.start || distance(end, target[0]) > tolerance.end) return false
  return averageGap([...user].reverse(), target) < averageGap(user, target)
}

/** おわりの場所が ずれた線の わけ: とちゅうで やめた / すぎた / ちがう ほうへ 行った */
function endIssue(drawn: readonly Point[], target: readonly Point[], ratio: number, tolerance: Tolerance): StrokeIssue {
  const end = drawn[drawn.length - 1]
  if (ratio < SHORT_RATIO && distanceToPath(end, target) <= tolerance.average) return 'short'
  const targetEnd = target[target.length - 1]
  if (ratio > LONG_RATIO && resample(drawn, 32).some((p) => distance(p, targetEnd) <= tolerance.end)) return 'long'
  return 'end'
}

/**
 * 合わなかった線と お手本の1画を くらべて、いちばん先に直すところ を返す。
 * 向き → 書きはじめ → 書きおわり(みじかい・ながい)→ とちゅうの かたち の順に見る。
 */
export function diagnoseStroke(drawn: readonly Point[], target: readonly Point[], tolerance: Tolerance = NORMAL_TOLERANCE): StrokeIssue {
  if (drawn.length < 2 || target.length < 2) return 'shape'
  const user = resample(drawn, target.length)
  if (isReversed(user, target, tolerance)) return 'reverse'
  if (distance(user[0], target[0]) > tolerance.start) return 'start'
  const targetLength = pathLength(target)
  const ratio = targetLength > 0 ? pathLength(drawn) / targetLength : 1
  if (distance(user[user.length - 1], target[target.length - 1]) > tolerance.end) return endIssue(drawn, target, ratio, tolerance)
  if (isTooLong(drawn, target, tolerance)) return 'long'
  if (targetLength > SHORT_STROKE && ratio < tolerance.minLength) return 'short'
  return 'shape'
}

/**
 * 書いた線を判定して、合格(ok)か、まちがいの わけ を返す。
 * 合格の きじゅん は judgeStroke と同じ。shape だったときだけ、次の画と くらべて わけ を こまかくする。
 */
export function checkStroke(
  drawn: readonly Point[],
  targets: readonly (readonly Point[])[],
  nextIndex: number,
  tolerance: Tolerance = NORMAL_TOLERANCE,
): StrokeResult {
  const judge = judgeStroke(drawn, targets, nextIndex, tolerance)
  const next = targets[nextIndex]
  if (judge !== 'shape' || !next) return judge
  return diagnoseStroke(drawn, next, tolerance)
}
