import { latestOf, type Hand } from '../../lib/handwriting'
import { formatDay } from '../../lib/parentReport'
import { HandGlyph } from './HandGlyph'

type Props = { readonly char: string; readonly hand: Hand | undefined }

/** 字の くわしい記録に出す、子どもが書いた字: はじめて見ないで書けた日の字と、いちばん新しい字(日づけつき) */
export function HandPair({ char, hand }: Props) {
  if (!hand) {
    return (
      <div className="hand-pair">
        <h3>書いた字</h3>
        <p className="parent-card__note">見ないで書けた字が、まだ残っていません。復習やテストで、見本なしで書けると、ここに出ます。</p>
      </div>
    )
  }
  const latest = latestOf(hand)
  const same = hand.l === undefined
  return (
    <div className="hand-pair">
      <h3>書いた字</h3>
      <div className="hand-pair__row">
        <figure>
          <HandGlyph strokes={hand.f.s} label={`${char}を はじめて見ないで書けた日の字`} />
          <figcaption>
            <strong>はじめて書けた日</strong>
            <span>{formatDay(hand.f.d)}</span>
          </figcaption>
        </figure>
        {same ? (
          <p className="parent-card__note hand-pair__wait">この字は、もう一度見ないで書けると、いちばん新しい字がここに並びます。</p>
        ) : (
          <figure>
            <HandGlyph strokes={latest.s} label={`${char}を いちばん新しく見ないで書けた字`} />
            <figcaption>
              <strong>いちばん新しい字</strong>
              <span>{formatDay(latest.d)}</span>
            </figcaption>
          </figure>
        )}
      </div>
    </div>
  )
}
