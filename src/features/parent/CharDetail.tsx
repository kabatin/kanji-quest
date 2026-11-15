import { getKanji } from '../../data/kanji'
import { answerText, type CharHistory } from '../../lib/charHistory'
import { MASTERY_LABEL, MASTERY_NOTE } from '../../lib/mastery'
import { learnedOnText, missText, reviewText, weakText } from '../../lib/parentDetail'
import type { Hand } from '../../lib/handwriting'
import { formatDay } from '../../lib/parentReport'
import { HandPair } from './HandPair'

type Props = {
  readonly history: CharHistory
  readonly today: string
  /** 子どもが書いた字(見ないで書けた字。なければ なし) */
  readonly hand?: Hand
  /** その子の名前(あそんでいる人と ちがう子を 見ているときの 案内に使う) */
  readonly name: string
  /** いま あそんでいる子を 見ているか(練習は あそんでいる人で 開く) */
  readonly canPractice: boolean
  readonly onPractice: (char: string) => void
  readonly onClose: () => void
}

function Facts({ history, today }: { readonly history: CharHistory; readonly today: string }) {
  return (
    <dl className="cdetail__facts">
      <div>
        <dt>覚えた日</dt>
        <dd>{learnedOnText(history)}</dd>
      </div>
      <div>
        <dt>はじめて自力で書けた日</dt>
        <dd>{history.firstFreeWrite ? formatDay(history.firstFreeWrite) : 'まだありません'}</dd>
      </div>
      <div>
        <dt>次の復習</dt>
        <dd>{reviewText(history, today)}</dd>
      </div>
      <div>
        <dt>答えた数</dt>
        <dd>{missText(history)}</dd>
      </div>
    </dl>
  )
}

function Recent({ history }: { readonly history: CharHistory }) {
  if (history.recent.length === 0) return null
  return (
    <div className="cdetail__recent">
      <h3>最近の答え(新しい順)</h3>
      <ol>
        {history.recent.map((entry, i) => (
          <li key={`${entry.day}-${i}`} data-ok={entry.ok}>
            {answerText(entry)}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** 字を押したときの、くわしい記録。練習する導線も ここ。 */
export function CharDetail({ history, today, hand, name, canPractice, onPractice, onClose }: Props) {
  const weak = weakText(history)
  return (
    <section className="parent-card cdetail" aria-labelledby="cdetail-title">
      <header className="cdetail__head">
        <p className="cdetail__char" lang="ja" aria-hidden="true">
          {history.char}
        </p>
        <div className="cdetail__title">
          <h2 id="cdetail-title">
            {history.char}
            <small>(よみ: {getKanji(history.char).yomi})</small>
          </h2>
          <p className="cdetail__state">
            <span className="mmap__swatch" data-state={history.state} aria-hidden="true" />
            {MASTERY_LABEL[history.state]}
          </p>
          <p className="parent-card__sub">{MASTERY_NOTE[history.state]}</p>
        </div>
        <button type="button" className="parent__ghost cdetail__close" onClick={onClose} aria-label="くわしい記録を閉じる">
          閉じる
        </button>
      </header>
      {weak && <p className="cdetail__weak">{weak}</p>}
      <div className="cdetail__body">
        <HandPair char={history.char} hand={hand} />
        <Facts history={history} today={today} />
        <Recent history={history} />
      </div>
      <footer className="cdetail__foot">
        {canPractice ? (
          <button type="button" className="parent__primary" onClick={() => onPractice(history.char)}>
            この字を練習する
          </button>
        ) : (
          <p className="parent-card__note">この字を練習するときは、あそぶ人を{name}さんに切りかえてから開いてください。</p>
        )}
      </footer>
    </section>
  )
}
