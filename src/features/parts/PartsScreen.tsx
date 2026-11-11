import { useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import type { Part } from '../../data/schema'
import { refsViewBox } from '../../data/strokes'
import { useProgress } from '../../store/progress'

/** 1ページに並べる数(4列 x 4行) */
export const PARTS_PAGE_SIZE = 16
const KIND_LABEL = { imi: 'いみ', oto: 'おと' } as const

/** その部位を持つ漢字 */
const kanjiWith = (part: Part) => KANJI.filter((k) => k.parts.includes(part.id) && k.char !== part.id)

type Props = { readonly onBack: () => void; readonly onOpen: (char: string) => void }

/**
 * パーツずかん。漢字を覚えると、その中の部位が見つかる。
 * 部位をえらぶと、同じ部位を持つ漢字がならぶ(「さんずい は みずの なかま」が見える)。
 */
export function PartsScreen({ onBack, onOpen }: Props) {
  const learned = useProgress((s) => s.learned)
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isFound = (part: Part) => KANJI.some((k) => learned.includes(k.char) && k.parts.includes(part.id))
  const pageCount = Math.ceil(PARTS.length / PARTS_PAGE_SIZE)
  const shown = PARTS.slice(page * PARTS_PAGE_SIZE, (page + 1) * PARTS_PAGE_SIZE)
  const selected = PARTS.find((p) => p.id === selectedId && isFound(p))
  const foundCount = PARTS.filter(isFound).length

  return (
    <div className="screen parts">
      <TopBar onBack={onBack} backLabel="ホーム" title="パーツずかん">
        <span className="zukan__count">
          {foundCount} / {PARTS.length}
        </span>
      </TopBar>
      <div className="parts__body">
        <div className="parts__left">
          <ul className="parts__grid">
            {shown.map((part) => {
              const found = isFound(part)
              const users = kanjiWith(part)
              const known = users.filter((k) => learned.includes(k.char)).length
              return (
                <li key={part.id}>
                  <button
                    type="button"
                    className={`parts-card parts-card--${part.kind} ${found ? '' : 'is-hidden'} ${selected?.id === part.id ? 'is-selected' : ''}`}
                    disabled={!found}
                    onClick={() => setSelectedId(part.id)}
                    aria-label={found ? `${part.label} の パーツ` : 'まだ みつけていない パーツ'}
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
          <nav className="pager" aria-label="ページ">
            <button type="button" className="btn" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="まえの ページ">
              ◀
            </button>
            <span className="pager__page">
              {page + 1} / {pageCount}
            </span>
            <button type="button" className="btn" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)} aria-label="つぎの ページ">
              ▶
            </button>
          </nav>
        </div>
        <aside className="parts__detail" aria-label="パーツの なかま">
          {selected ? (
            <>
              <div className={`parts__head parts__head--${selected.kind}`}>
                {selected.icon ? <PartIcon id={selected.icon} className="parts__icon" /> : <span className="parts__note">♪</span>}
                <div>
                  <small>{KIND_LABEL[selected.kind]}パーツ</small>
                  <strong>{selected.label}</strong>
                </div>
              </div>
              <p className="parts__lead">この パーツを もつ かんじ</p>
              <ul className="parts__users">
                {kanjiWith(selected).map((k) => (
                  <li key={k.char}>
                    <button
                      type="button"
                      className={`parts-user ${learned.includes(k.char) ? 'is-learned' : ''}`}
                      onClick={() => onOpen(k.char)}
                      aria-label={`${k.char} ${k.yomi}`}
                    >
                      <span className="parts-user__char">{k.char}</span>
                      <small>{k.yomi}</small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="parts__empty">
              {foundCount === 0 ? 'かんじを まなぶと、パーツが みつかるよ' : 'パーツを えらぶと、なかまの かんじが みられるよ'}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
