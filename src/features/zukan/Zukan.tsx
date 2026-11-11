import { GrowTree } from '../../components/GrowTree'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { GRADES, kanjiOfGrade } from '../../data/kanji'
import type { Grade } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { growthStage } from '../../lib/score'
import { useProgress } from '../../store/progress'

/** 1ページに並べる数(5列 x 4行)。スクロールなしで1画面に収める。 */
export const PAGE_SIZE = 20

export type ZukanView = { readonly grade: Grade; readonly page: number }

type Props = {
  readonly view: ZukanView
  readonly onView: (view: ZukanView) => void
  readonly onOpen: (char: string) => void
  readonly onChallenge: () => void
  readonly onReward: () => void
  readonly onSettings: () => void
}

/** ホーム: 漢字のずかん。学年ごと・ページごとに見る。覚えた字は色がつく。 */
export function Zukan({ view, onView, onOpen, onChallenge, onReward, onSettings }: Props) {
  const learned = useProgress((s) => s.learned)
  const points = useProgress((s) => s.points)

  const all = kanjiOfGrade(view.grade)
  const pageCount = Math.ceil(all.length / PAGE_SIZE)
  const page = Math.min(view.page, pageCount - 1)
  const shown = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const learnedCount = all.filter((k) => learned.includes(k.char)).length

  return (
    <div className="screen zukan">
      <header className="bar">
        <div className="zukan__tabs" role="tablist" aria-label="がくねん">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              role="tab"
              aria-selected={grade === view.grade}
              className={`btn zukan__tab ${grade === view.grade ? 'is-selected' : ''}`}
              onClick={() => onView({ grade, page: 0 })}
            >
              {grade}ねんせい
            </button>
          ))}
        </div>
        <span className="zukan__count">
          {learnedCount} / {all.length}
        </span>
        <button type="button" className="btn zukan__reward" onClick={onReward} aria-label={`ごほうび ${points} ポイント`}>
          <GrowTree stage={growthStage(points)} className="zukan__tree" />
          {points} ポイント
        </button>
        <button type="button" className="btn btn--primary" onClick={onChallenge}>
          チャレンジ
        </button>
        <button type="button" className="btn" onClick={onSettings} aria-label="せってい">
          ⚙
        </button>
      </header>
      <ul className="zukan__grid">
        {shown.map((kanji) => {
          const isLearned = learned.includes(kanji.char)
          return (
            <li key={kanji.char}>
              <button
                type="button"
                className={`zukan-card ${isLearned ? 'is-learned' : ''}`}
                onClick={() => onOpen(kanji.char)}
                aria-label={`${kanji.char} ${kanji.yomi}${isLearned ? ' おぼえた' : ''}`}
              >
                <KanjiGlyph layers={[{ glyph: fullGlyph(kanji.char), tone: isLearned ? 'ink' : 'pale' }]} label={kanji.char} />
                <PartIcon id={kanji.icon} className="zukan-card__icon" />
                {isLearned && <span className="zukan-card__star">★</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <nav className="zukan__pager" aria-label="ページ">
        <button
          type="button"
          className="btn"
          disabled={page === 0}
          onClick={() => onView({ grade: view.grade, page: page - 1 })}
          aria-label="まえの ページ"
        >
          ◀
        </button>
        <span className="zukan__page">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="btn"
          disabled={page >= pageCount - 1}
          onClick={() => onView({ grade: view.grade, page: page + 1 })}
          aria-label="つぎの ページ"
        >
          ▶
        </button>
      </nav>
    </div>
  )
}
