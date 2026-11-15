import { useMemo } from 'react'
import { recentHands, type Hands } from '../../lib/handwriting'
import { formatDay } from '../../lib/parentReport'
import { HandGlyph } from './HandGlyph'

type Props = { readonly hands: Hands; readonly name: string; readonly onOpen: (char: string) => void }

const SHOWN = 8

/** 11/15 */
const shortDay = (day: string): string => {
  const [, month, date] = day.split('-').map(Number)
  return `${month}/${date}`
}

/** 概要に出す「さいきん書けた字」。字を押すと、その字の くわしい記録(はじめて書けた日の字との くらべ)が開く */
export function RecentHands({ hands, name, onOpen }: Props) {
  const items = useMemo(() => recentHands(hands, SHOWN), [hands])
  return (
    <section className="parent-card rhands" aria-labelledby="rhands-title">
      <header className="parent-card__head">
        <h2 id="rhands-title">最近書けた字</h2>
        <p className="parent-card__sub">{name}さんが見本なしで書いた字。押すと くらべられます。</p>
      </header>
      {items.length === 0 ? (
        <p className="parent-card__empty">まだ記録がありません。復習やテストで、見本なしで書けた字が ここに残ります。</p>
      ) : (
        <ul className="rhands__list">
          {items.map(({ char, entry }) => (
            <li key={char}>
              <button type="button" className="rhands__item" onClick={() => onOpen(char)} aria-label={`${char}の記録を開く(${formatDay(entry.d)})`}>
                <HandGlyph strokes={entry.s} label={`${char}を書いた字`} className="hand hand--small" />
                <span className="rhands__day">{shortDay(entry.d)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
