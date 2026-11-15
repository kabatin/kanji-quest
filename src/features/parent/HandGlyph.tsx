import { useMemo } from 'react'
import { decodeStrokes, strokePathD } from '../../lib/handwriting'
import '../../styles/parent-hand.css'

type Props = {
  /** 保存してある 筆跡の文字列(lib/handwriting) */
  readonly strokes: string
  /** 読み上げ用の 説明 */
  readonly label: string
  readonly className?: string
}

const SIZE = 109
const MID = SIZE / 2

/** 子どもが 書いた字を 絵で出す。書き取り帳のような 十字の 補助線つき。読めない 保存データは 何も出さない。 */
export function HandGlyph({ strokes, label, className }: Props) {
  const lines = useMemo(() => decodeStrokes(strokes), [strokes])
  if (!lines) return null
  return (
    <svg className={className ?? 'hand'} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={label}>
      <rect className="hand__box" x="1" y="1" width={SIZE - 2} height={SIZE - 2} />
      <path className="hand__guide" d={`M${MID} 1V${SIZE - 1}M1 ${MID}H${SIZE - 1}`} />
      {lines.map((points, i) => (
        <path key={i} className="hand__line" d={strokePathD(points)} />
      ))}
    </svg>
  )
}
