import { TopBar } from '../../components/Hud'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { Stamps } from '../../components/Stamps'
import { GRADES, kanjiOfGrade } from '../../data/kanji'
import type { Grade } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { useProgress } from '../../store/progress'

/** 1ページに並べる数(5列 x 4行)。スクロールなしで1画面に収める。 */
export const PAGE_SIZE = 20

export type ZukanView = { readonly grade: Grade; readonly page: number }

type Props = {
  readonly view: ZukanView
  readonly onView: (view: ZukanView) => void
  readonly onOpen: (char: string) => void
  readonly onBack: () => void
}

/** 漢字のずかん。学年ごと・ページごとに見る。覚えた字は色がつき、はんこが並ぶ。 */
export function Zukan({ view, onView, onOpen, onBack }: Props) {
  const learned = useProgress((s) => s.learned)
  const stamps = useProgress((s) => s.stamps)

  const all = kanjiOfGrade(view.grade)
  const pageCount = Math.ceil(all.length / PAGE_SIZE)
  const page = Math.min(view.page, pageCount - 1)
  const shown = all.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const learnedCount = all.filter((k) => learned.includes(k.char)).length

  return (
    <div className="screen zukan">
      <TopBar onBack={onBack} backLabel="ホーム" title="ずかん">
        <div className="zukan__tabs" role="tablist" aria-label="がくねん">
          {GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              role="tab"
              aria-selected={grade === view.grade}
              className={`btn chip ${grade === view.grade ? 'is-selected' : ''}`}
              onClick={() => onView({ grade, page: 0 })}
            >
              {grade}ねんせい
            </button>
          ))}
        </div>
        <span className="zukan__count">
          {learnedCount} / {all.length}
        </span>
      </TopBar>
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
                <Stamps mask={stamps[kanji.char]} className="zukan-card__stamps" />
              </button>
            </li>
          )
        })}
      </ul>
      <nav className="pager" aria-label="ページ">
        <button type="button" className="btn" disabled={page === 0} onClick={() => onView({ grade: view.grade, page: page - 1 })} aria-label="まえの ページ">
          ◀
        </button>
        <span className="pager__page">
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
