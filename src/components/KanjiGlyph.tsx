import { motion } from 'motion/react'
import type { GlyphRef } from '../data/schema'
import { getStrokes, GLYPH_SIZE, glyphKey, unionBBox } from '../data/strokes'

/** imi = いみパーツの色 / oto = おとパーツの色 / ink = ふつうの墨色 / pale = まだ覚えていない */
export type Tone = 'imi' | 'oto' | 'ink' | 'pale'

export type GlyphLayer = {
  readonly glyph: GlyphRef
  readonly tone: Tone
  /** この位置から本来の位置へ動いて合体する */
  readonly from?: { readonly x: number; readonly y: number }
}

type Props = {
  readonly layers: readonly GlyphLayer[]
  readonly label: string
  readonly viewBox?: string
  /** まだ埋まっていない部位の場所を、点線の枠で示す */
  readonly slot?: GlyphRef
  readonly className?: string
}

const SLOT_PADDING = 4
const MERGE_SPRING = { type: 'spring', stiffness: 140, damping: 14 } as const

/** KanjiVG の画データで漢字(またはその一部)を描く。部位ごとに色を変えられる。 */
export function KanjiGlyph({ layers, label, viewBox, slot, className }: Props) {
  const slotBox = slot ? unionBBox(getStrokes(slot)) : undefined
  return (
    <svg
      className={['glyph', className].filter(Boolean).join(' ')}
      viewBox={viewBox ?? `0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`}
      role="img"
      aria-label={label}
    >
      {slotBox && (
        <rect
          className="glyph-slot"
          x={slotBox[0] - SLOT_PADDING}
          y={slotBox[1] - SLOT_PADDING}
          width={slotBox[2] - slotBox[0] + SLOT_PADDING * 2}
          height={slotBox[3] - slotBox[1] + SLOT_PADDING * 2}
          rx="6"
        />
      )}
      {layers.map((layer) => {
        const key = glyphKey(layer.glyph)
        const paths = getStrokes(layer.glyph).map((stroke) => <path key={stroke.d} d={stroke.d} />)
        return layer.from ? (
          <motion.g
            key={key}
            className={`glyph-${layer.tone}`}
            initial={{ x: layer.from.x, y: layer.from.y }}
            animate={{ x: 0, y: 0 }}
            transition={MERGE_SPRING}
          >
            {paths}
          </motion.g>
        ) : (
          <g key={key} className={`glyph-${layer.tone}`}>
            {paths}
          </g>
        )
      })}
    </svg>
  )
}
