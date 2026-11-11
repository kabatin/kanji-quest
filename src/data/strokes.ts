import raw from '../assets/kanjivg/strokes.json'
import type { GlyphRef } from './schema'

export type BBox = readonly [number, number, number, number]
export type Stroke = {
  readonly d: string
  readonly bbox: BBox
  /** 書く順に並んだ、通り道の点(書き取りの判定に使う) */
  readonly pts: readonly (readonly [number, number])[]
}

/** KanjiVG の座標系は 109 x 109 */
export const GLYPH_SIZE = 109

const STROKES = raw as unknown as Record<string, readonly Stroke[]>

export function strokeCount(char: string): number {
  return STROKES[char]?.length ?? 0
}

/** 漢字1字ぜんぶの画を指す参照を作る。 */
export function fullGlyph(char: string): GlyphRef {
  const count = strokeCount(char)
  if (count === 0) throw new Error(`画データがありません: ${char}`)
  return { source: char, strokes: Array.from({ length: count }, (_, i) => i + 1) }
}

export function getStrokes(ref: GlyphRef): readonly Stroke[] {
  const all = STROKES[ref.source]
  if (!all) throw new Error(`画データがありません: ${ref.source}`)
  return ref.strokes.map((n) => {
    const stroke = all[n - 1]
    if (!stroke) throw new Error(`画の指定が不正です: ${ref.source} ${n}画目`)
    return stroke
  })
}

export function glyphKey(ref: GlyphRef): string {
  return `${ref.source}-${ref.strokes.join('.')}`
}

export function unionBBox(strokes: readonly Stroke[]): BBox {
  return [
    Math.min(...strokes.map((s) => s.bbox[0])),
    Math.min(...strokes.map((s) => s.bbox[1])),
    Math.max(...strokes.map((s) => s.bbox[2])),
    Math.max(...strokes.map((s) => s.bbox[3])),
  ]
}

/** 部位をカードの中央に大きく見せるための、正方形の viewBox を返す。 */
export function fitViewBox(bbox: BBox, padding = 10): string {
  const [x0, y0, x1, y1] = bbox
  const size = Math.max(x1 - x0, y1 - y0) + padding * 2
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  return [cx - size / 2, cy - size / 2, size, size].map((n) => Math.round(n * 100) / 100).join(' ')
}

/** 複数の範囲をまとめて中央に収める viewBox。 */
export function refsViewBox(refs: readonly GlyphRef[], padding = 10): string {
  return fitViewBox(unionBBox(refs.flatMap((ref) => getStrokes(ref))), padding)
}
