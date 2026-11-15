import { z } from 'zod'
import { storageKeyFor } from './profiles'
import { isHinted, type AnswerKind } from './review'
import { pathLength, resample, type Point } from './strokeMatch'

/**
 * 子どもが 書いた字の きろく(端末の中だけ。外へは 送らない)。
 * 字ごとに 2つまで: 「はじめて 見ないで書けた日の字」(f)と「いちばん新しく 見ないで書けた字」(l)。
 * 画ごとに 点を まびき、整数にして 短い文字列で のこす(1字 いくつかの画 × 数点)。
 * l が ないときは、いちばん新しい字は f と同じ。
 */

export type Strokes = readonly (readonly Point[])[]
export type HandEntry = { readonly d: string; readonly s: string }
export type Hand = { readonly f: HandEntry; readonly l?: HandEntry }
export type Hands = Readonly<Record<string, Hand>>

/** 1つの字の 文字列の 上限(文字数)。1026字 × 2つ でも 2.1M 文字に おさまる */
export const HAND_MAX_CHARS = 1000
/** 1画に のこす点の 数の 上限(はじめは 道のり 8 ごとに 1点) */
export const HAND_POINTS_MAX = 12
export const HAND_POINTS_MIN = 2
export const HAND_STROKES_MAX = 30
const POINT_SPACING = 8
const SHRINK_STEPS = [HAND_POINTS_MAX, 8, 5, 3] as const

const roundPoint = (p: Point): Point => [Math.round(p[0]), Math.round(p[1])]
const samePoint = (a: Point, b: Point): boolean => a[0] === b[0] && a[1] === b[1]

/** 1画を、点の数 cap 以下に まびく(はじめと おわりは のこす) */
export function thinStroke(points: readonly Point[], cap: number): Point[] {
  if (points.length === 0) return []
  const wanted = Math.min(cap, Math.max(HAND_POINTS_MIN, Math.round(pathLength(points) / POINT_SPACING) + 1))
  const thinned = points.length <= wanted ? [...points] : resample(points, wanted)
  return thinned.map(roundPoint).filter((p, i, all) => i === 0 || !samePoint(p, all[i - 1]))
}

const encodeStroke = (points: readonly Point[]): string => points.map((p) => `${p[0]},${p[1]}`).join(' ')

/** 筆跡を 短い文字列にする。1画 = 点を「x,y」で 空白でつなぎ、画は「;」でつなぐ。大きすぎれば null */
export function encodeStrokes(strokes: Strokes): string | null {
  if (strokes.length === 0 || strokes.length > HAND_STROKES_MAX) return null
  for (const cap of SHRINK_STEPS) {
    const text = strokes.map((stroke) => encodeStroke(thinStroke(stroke, cap))).join(';')
    if (text.length <= HAND_MAX_CHARS) return text
  }
  return null
}

const POINT_PATTERN = /^-?\d{1,4},-?\d{1,4}$/

/** 文字列を 筆跡に もどす。読めない ときは null */
export function decodeStrokes(text: string): Point[][] | null {
  if (text.length === 0 || text.length > HAND_MAX_CHARS) return null
  const strokes = text.split(';').map((part) => part.split(' '))
  if (strokes.length > HAND_STROKES_MAX) return null
  if (!strokes.every((stroke) => stroke.every((p) => POINT_PATTERN.test(p)))) return null
  return strokes.map((stroke) => stroke.map((p): Point => {
    const [x, y] = p.split(',').map(Number)
    return [x, y]
  }))
}

/** 「見ないで(見本なしで)、ヒントなしで 書けた」答えか。書いた字は これだけ のこす */
export function isFreeWrite(answer: { readonly kind: AnswerKind; readonly ok: boolean; readonly hint?: number }): boolean {
  return answer.kind === 'blind' && answer.ok && !isHinted(answer.hint)
}

/** 1字ぶんの 新しい字を 重ねる。はじめての字は f に、2回目からは l を おきかえる */
export function noteHand(hands: Hands, char: string, strokes: Strokes, day: string): Hands {
  const s = encodeStrokes(strokes)
  if (s === null) return hands
  const entry: HandEntry = { d: day, s }
  const before = hands[char]
  return { ...hands, [char]: before ? { f: before.f, l: entry } : { f: entry } }
}

/** 1回の あそび ぶんの 答えから、書けた字を のこす */
export function noteHands(
  hands: Hands,
  answers: readonly { readonly char: string; readonly kind: AnswerKind; readonly ok: boolean; readonly hint?: number; readonly strokes?: Strokes }[],
  day: string,
): Hands {
  return answers.reduce((now, answer) => (answer.strokes && isFreeWrite(answer) ? noteHand(now, answer.char, answer.strokes, day) : now), hands)
}

/** いちばん新しい字(l がなければ f) */
export const latestOf = (hand: Hand): HandEntry => hand.l ?? hand.f

/** 新しく 書けた順(いちばん新しい字の日が 新しい順)に、字を ならべる */
export function recentHands(hands: Hands, limit: number): { readonly char: string; readonly entry: HandEntry }[] {
  return Object.entries(hands)
    .map(([char, hand]) => ({ char, entry: latestOf(hand) }))
    .sort((a, b) => b.entry.d.localeCompare(a.entry.d))
    .slice(0, limit)
}

const entrySchema = z.object({ d: z.string().max(10), s: z.string().max(HAND_MAX_CHARS) })
const handSchema = z.object({ f: entrySchema, l: entrySchema.optional() })

/** 保存してあった 書いた字。こわれた字は すてて、読める字だけ のこす */
export const handsSchema = z
  .record(z.string().max(4), z.unknown())
  .catch({})
  .transform((record): Hands =>
    Object.fromEntries(
      Object.entries(record).flatMap(([char, value]) => {
        const parsed = handSchema.safeParse(value)
        return parsed.success && decodeStrokes(parsed.data.f.s) !== null ? [[char, parsed.data] as const] : []
      }),
    ),
  )

/** 1つの字の 絵(SVG の線)の d。点が 1つだけの画は 小さな点にする */
export function strokePathD(points: readonly Point[]): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  const tail = rest.length === 0 ? [[first[0] + 0.1, first[1]] as const] : rest
  return `M${first[0]} ${first[1]}${tail.map((p) => ` L${p[0]} ${p[1]}`).join('')}`
}

/** その人の 書いた字を、端末から直接読む(あそぶ人を 切りかえずに 見られるように)。読めなければ からっぽ */
export function readHands(id: string, storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Hands {
  try {
    const raw = storage?.getItem(storageKeyFor(id))
    if (!raw) return {}
    const body = z.object({ state: z.object({ hands: z.unknown() }).passthrough() }).safeParse(JSON.parse(raw))
    return body.success ? handsSchema.parse(body.data.state.hands) : {}
  } catch {
    // こわれた保存データ(JSON でない)は、からっぽ として あつかう
    return {}
  }
}
