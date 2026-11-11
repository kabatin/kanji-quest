import type { ReactNode } from 'react'
import type { GlyphRef, Part } from '../data/schema'
import { refsViewBox } from '../data/strokes'
import { KanjiGlyph } from './KanjiGlyph'
import { PartIcon } from './PartIcon'

export type CardState = 'idle' | 'wrong' | 'right'

type Props = {
  readonly part: Part
  /** 部位の見本の形のかわりに使う形(その漢字の中での形を見せたいとき) */
  readonly glyph?: GlyphRef
  /** 絵と名前を見せるか(チャレンジの難しい段階では隠す) */
  readonly showHint: boolean
  /** カードの枠をなくして、部位の形だけにする */
  readonly plain?: boolean
  readonly state?: CardState
  readonly onSelect?: () => void
  /** 部位の形のかわりに描くもの(固定カードで「空きの場所」を見せるときに使う) */
  readonly children?: ReactNode
}

const KIND_LABEL = { imi: 'いみ', oto: 'おと' } as const

/** 部位1つを表すカード。絵(いみ)+ 形 + 名前。onSelect があれば押せる。 */
export function PartCard({ part, glyph = part.glyph, showHint, plain = false, state = 'idle', onSelect, children }: Props) {
  const className = ['part-card', `part-card--${part.kind}`, `is-${state}`, plain ? 'part-card--plain' : '']
    .filter(Boolean)
    .join(' ')
  const body = (
    <>
      {showHint && (
        <span className="part-card__hint">
          {part.icon ? <PartIcon id={part.icon} className="part-card__icon" /> : <span className="part-card__oto">♪</span>}
        </span>
      )}
      <span className="part-card__glyph">
        {children ?? (
          <KanjiGlyph
            layers={[{ glyph, tone: part.kind }]}
            viewBox={refsViewBox([glyph])}
            label={part.label}
          />
        )}
      </span>
      {showHint && (
        <span className="part-card__label">
          <small>{KIND_LABEL[part.kind]}</small>
          {part.label}
        </span>
      )}
    </>
  )
  if (!onSelect) {
    return (
      <div className={className} data-part={part.id}>
        {body}
      </div>
    )
  }
  return (
    <button type="button" className={className} data-part={part.id} disabled={state !== 'idle'} onClick={onSelect}>
      {body}
    </button>
  )
}
