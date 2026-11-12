import type { Tone } from '../components/KanjiGlyph'
import { getPart } from '../data/parts'
import type { Kanji } from '../data/schema'
import { fullGlyph } from '../data/strokes'

/**
 * 画ごとの色: その画が入っている部位の色にする(分けない字は墨色)。
 * 返す配列は 画番号 - 1 で引く。
 */
export function strokeTones(kanji: Kanji): Tone[] {
  const count = fullGlyph(kanji.char).strokes.length
  const last = kanji.steps[kanji.steps.length - 1]
  return Array.from({ length: count }, (_, i) => {
    if (!last) return 'ink'
    return last.fixedGlyph.strokes.includes(i + 1) ? getPart(last.fixed).kind : getPart(last.answer).kind
  })
}
