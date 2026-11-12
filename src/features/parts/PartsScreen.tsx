import { useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import { refsViewBox } from '../../data/strokes'
import { currentQuest, partProgress } from '../../lib/partQuest'
import { useFeedback } from '../../lib/useFeedback'
import { useLearnedSet } from '../../lib/useKanjiText'
import { useProgress } from '../../store/progress'
import { PartDetail } from './PartDetail'

type Props = { readonly onBack: () => void; readonly onOpen: (char: string) => void }

/**
 * パーツずかん。漢字を覚えると、その中の部位が見つかる。
 * 部位をえらぶと、同じ部位を持つ漢字がならぶ(「さんずい は みずの なかま」が見える)。
 * なかまを全部 覚えると コンプリートで、ごほうびがもらえる。上には、次に ねらう パーツ(クエスト)が出る。
 */
export function PartsScreen({ onBack, onOpen }: Props) {
  const learned = useLearnedSet()
  const partClaims = useProgress((s) => s.partClaims)
  const claimPart = useProgress((s) => s.claimPart)
  const { play } = useFeedback()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const all = PARTS.map((part) => partProgress(part, KANJI, learned))
  const selected = all.find((p) => p.part.id === selectedId && p.found)
  const foundCount = all.filter((p) => p.found).length
  const completeCount = all.filter((p) => p.complete).length
  const quest = currentQuest(PARTS, KANJI, learned)

  const claim = (partId: string) => {
    if (claimPart(partId)) play('fanfare')
  }

  return (
    <div className="screen parts">
      <TopBar onBack={onBack} backLabel="ホーム" title="パーツずかん">
        <span className="zukan__count">
          {foundCount} / {PARTS.length}
        </span>
        <span className="parts__complete-count">コンプリート {completeCount}</span>
      </TopBar>
      {quest && (
        <section className="part-quest" aria-label="パーツ クエスト">
          <span className="part-quest__glyph">
            <KanjiGlyph layers={[{ glyph: quest.part.glyph, tone: quest.part.kind }]} viewBox={refsViewBox([quest.part.glyph])} label={quest.part.label} />
          </span>
          <p className="part-quest__text">
            <small>パーツ クエスト</small>「{quest.part.label}」の かんじを あと <strong>{quest.remaining}</strong>つ みつけよう
          </p>
          <button type="button" className="btn btn--primary" onClick={() => onOpen(quest.nextChar)}>
            さがしに いく ▶
          </button>
        </section>
      )}
      <div className="parts__body">
        <div className="parts__left">
          <ul className="parts__grid scroll-area">
            {all.map(({ part, users, known, found, complete }) => {
              const claimable = complete && !partClaims.includes(part.id)
              return (
                <li key={part.id}>
                  <button
                    type="button"
                    className={`parts-card parts-card--${part.kind} ${found ? '' : 'is-hidden'} ${complete ? 'is-complete' : ''} ${selected?.part.id === part.id ? 'is-selected' : ''}`}
                    disabled={!found}
                    onClick={() => setSelectedId(part.id)}
                    aria-label={found ? `${part.label} の パーツ${complete ? ' コンプリート' : ''}` : 'まだ みつけていない パーツ'}
                  >
                    {found ? (
                      <>
                        <span className="parts-card__glyph">
                          <KanjiGlyph layers={[{ glyph: part.glyph, tone: part.kind }]} viewBox={refsViewBox([part.glyph])} label={part.label} />
                        </span>
                        <span className="parts-card__label">{part.label}</span>
                        <span className="parts-card__count">
                          {known} / {users.length}
                        </span>
                        {complete && (
                          <span className="parts-card__crown" aria-hidden="true">
                            👑
                          </span>
                        )}
                        {claimable && <span className="parts-card__dot" aria-hidden="true" />}
                      </>
                    ) : (
                      <span className="parts-card__unknown" aria-hidden="true">
                        ？
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <aside className="parts__detail" aria-label="パーツの なかま">
          {selected ? (
            <PartDetail progress={selected} learned={learned} claimed={partClaims.includes(selected.part.id)} onClaim={() => claim(selected.part.id)} onOpen={onOpen} />
          ) : (
            <p className="parts__empty">{foundCount === 0 ? 'かんじを まなぶと、パーツが みつかるよ' : 'パーツを えらぶと、なかまの かんじが みられるよ'}</p>
          )}
        </aside>
      </div>
    </div>
  )
}
