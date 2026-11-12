import type { ReactNode } from 'react'
import type { SoundName } from '../../lib/sound'

/**
 * 漢字1字ぶんの「なりたちの場面」。
 *
 * 場面は「時間 t(秒)を わたすと、その しゅんかんの絵(SVG)を返す」だけの関数にしている。
 * 同じ t なら いつも同じ絵になるので、止めて見る・コマ送りで たしかめる・もう一度流す が かんたんにできる。
 *
 * 絵は 漢字と同じ 109 x 109 の座標で描く。画の線(ほね)を そのまま絵の しん にして、
 * 絵が うすくなると 漢字が のこる、という流れにする(絵と字の形が ずれないようにするため)。
 */
export type SceneProps = {
  /** 場面が始まってからの時間(秒)。0 〜 duration */
  readonly t: number
}

/** 場面の くぎり。コマ送りの確認と、効果音のきっかけに使う */
export type Beat = {
  /** この くぎり が始まる時間(秒) */
  readonly at: number
  /** 何が起きるか(確認用の みじかい説明) */
  readonly label: string
  /** この しゅんかんに鳴らす効果音 */
  readonly sound?: SoundName
}

export type SceneModule = {
  /** この場面の漢字 */
  readonly char: string
  /** 場面の長さ(秒) */
  readonly duration: number
  readonly beats: readonly Beat[]
  readonly Scene: (props: SceneProps) => ReactNode
}

/** 場面の長さの きまり(短すぎると話が伝わらず、長すぎると あきる) */
export const MIN_DURATION = 6
export const MAX_DURATION = 12

export type Ease = (x: number) => number

export const clamp01 = (x: number): number => Math.min(Math.max(x, 0), 1)

export const linear: Ease = (x) => x
export const easeOut: Ease = (x) => 1 - (1 - x) ** 3
export const easeIn: Ease = (x) => x ** 3
export const easeInOut: Ease = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)
/** いきおいよく出て、少し行きすぎてから もどる(ぽん と出る動き) */
export const backOut: Ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2)

/** t が from 〜 to の間を どこまで進んだか(0〜1)。from より前は 0、to より後は 1。 */
export function span(t: number, from: number, to: number, ease: Ease = linear): number {
  if (to <= from) return t >= to ? 1 : 0
  return ease(clamp01((t - from) / (to - from)))
}

/** t が from 〜 to の間に、a から b へ変わる値。 */
export function mix(t: number, from: number, to: number, a: number, b: number, ease: Ease = easeInOut): number {
  return a + (b - a) * span(t, from, to, ease)
}

/** from で あらわれ、to で きえる(0 → 1 → 0)。fade は あらわれる・きえる のに かける時間。 */
export function during(t: number, from: number, to: number, fade = 0.25): number {
  return Math.min(span(t, from, from + fade), 1 - span(t, to - fade, to))
}

/** くり返す ゆれ(-1〜1)。period 秒で ひとまわり。 */
export function wave(t: number, period: number, phase = 0): number {
  return Math.sin(((t + phase) / period) * Math.PI * 2)
}

/** SVG の transform を作る。origin を じく にして、回す・大きさを変える。 */
export function pose(options: { x?: number; y?: number; rotate?: number; scale?: number; scaleX?: number; scaleY?: number; origin?: readonly [number, number] }): string {
  const { x = 0, y = 0, rotate = 0, scale = 1, scaleX = scale, scaleY = scale, origin = [0, 0] } = options
  const [ox, oy] = origin
  const round = (n: number) => Math.round(n * 1000) / 1000
  return `translate(${round(x + ox)} ${round(y + oy)}) rotate(${round(rotate)}) scale(${round(scaleX)} ${round(scaleY)}) translate(${-ox} ${-oy})`
}

/** 「字になる」ところの きまった流れ: 絵が うすくなる度合い と、字が書けた度合い を返す。 */
export function inkTiming(t: number, from: number, to: number, strokeCount: number): { readonly picture: number; readonly progress: number; readonly tint: number; readonly sparkle: number } {
  // 画が多い字ほど、書くのに時間を かける(さいごの 0.9 秒は、色が そまって きらきら する時間)
  const writeEnd = to - 0.9
  return {
    picture: 1 - 0.84 * span(t, from, Math.min(from + 0.9, writeEnd)),
    progress: span(t, from + 0.15, writeEnd) * (strokeCount > 0 ? 1 : 0),
    tint: span(t, writeEnd, writeEnd + 0.35),
    sparkle: span(t, writeEnd, to),
  }
}

/** 場面の きまり を たしかめる。まずい所を 文で返す(なければ 空)。 */
export function checkScene(scene: SceneModule): string[] {
  const problems: string[] = []
  if ([...scene.char].length !== 1) problems.push('char は 漢字1字にする')
  if (scene.duration < MIN_DURATION || scene.duration > MAX_DURATION) problems.push(`duration は ${MIN_DURATION}〜${MAX_DURATION} 秒にする`)
  if (scene.beats.length < 3) problems.push('beats は 3つ以上(はじまり・おはなし・字になる)')
  if (scene.beats[0]?.at !== 0) problems.push('さいしょの beat は at: 0')
  const times = scene.beats.map((beat) => beat.at)
  if (times.some((at, i) => i > 0 && at <= times[i - 1])) problems.push('beats は 時間の順に ならべる')
  if (times.some((at) => at < 0 || at >= scene.duration)) problems.push('beats の at は 0 以上、duration より前')
  if (scene.beats.some((beat) => beat.label.trim() === '')) problems.push('beats の label は 空にしない')
  return problems
}

/** くぎり と くぎり の間にも、コマを はさむ(動きの とちゅう を見るため) */
const SHEET_BETWEEN = 2

/** コマ送りで見る時間。くぎり の しゅんかん・くぎり の間・さいご。 */
export function sheetTimes(scene: SceneModule): number[] {
  const marks = [...scene.beats.map((beat) => beat.at), scene.duration]
  const times = marks.slice(0, -1).flatMap((at, i) => {
    const next = marks[i + 1]
    return Array.from({ length: SHEET_BETWEEN + 1 }, (_, k) => at + ((next - at) * k) / (SHEET_BETWEEN + 1))
  })
  return [...times, scene.duration].map((time) => Math.round(time * 100) / 100)
}
