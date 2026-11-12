import { useLayoutEffect, useRef } from 'react'
import { TopBar } from '../../components/Hud'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { Stamps } from '../../components/Stamps'
import { GRADES, kanjiOfGrade } from '../../data/kanji'
import type { Grade } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { useProgress } from '../../store/progress'

/** 見ていた学年と、どこまで スクロール していたか */
export type ZukanView = { readonly grade: Grade; readonly scroll: number }

type Props = {
  readonly view: ZukanView
  readonly onView: (view: ZukanView) => void
  readonly onOpen: (char: string) => void
  readonly onBack: () => void
}

/** 漢字のずかん。学年ごとに、指で スクロール して見る。覚えた字は色がつき、はんこが並ぶ。 */
export function Zukan({ view, onView, onOpen, onBack }: Props) {
  const learned = useProgress((s) => s.learned)
  const stamps = useProgress((s) => s.stamps)
  const gridRef = useRef<HTMLUListElement>(null)

  const all = kanjiOfGrade(view.grade)
  const learnedCount = all.filter((k) => learned.includes(k.char)).length

  // 漢字を開いて もどってきたとき、前に見ていた所から続きを見られるようにする
  useLayoutEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = view.scroll
  }, [view.grade, view.scroll])

  const open = (char: string) => {
    onView({ grade: view.grade, scroll: gridRef.current?.scrollTop ?? 0 })
    onOpen(char)
  }

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
              onClick={() => onView({ grade, scroll: 0 })}
            >
              {grade}ねんせい
            </button>
          ))}
        </div>
        <span className="zukan__count">
          {learnedCount} / {all.length}
        </span>
      </TopBar>
      <ul ref={gridRef} className="zukan__grid scroll-area">
        {all.map((kanji) => {
          const isLearned = learned.includes(kanji.char)
          return (
            <li key={kanji.char}>
              <button
                type="button"
                className={`zukan-card ${isLearned ? 'is-learned' : ''}`}
                onClick={() => open(kanji.char)}
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
    </div>
  )
}
