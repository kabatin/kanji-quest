import { PartIcon } from '../../components/PartIcon'
import { KANJI } from '../../data/kanji'
import { PARTS } from '../../data/parts'
import type { Kanji } from '../../data/schema'
import { findRelated } from '../../lib/related'

/** 画面からはみ出さないよう、見せる数をしぼる */
const MAX_GROUPS = 3
const MAX_KANJI_PER_GROUP = 5

type Props = { readonly kanji: Kanji; readonly onOpen: (char: string) => void }

/** 同じ部位を持つ「なかま」の漢字を、部位ごとに並べて見せる。 */
export function Nakama({ kanji, onOpen }: Props) {
  const groups = findRelated(kanji, KANJI, PARTS).slice(0, MAX_GROUPS)
  if (groups.length === 0) return null
  return (
    <section className="nakama" aria-label="なかま">
      <h2 className="nakama__title">なかま</h2>
      {groups.map((group) => (
        <div key={group.part.id} className="nakama__group" data-nakama={group.part.id}>
          <span className={`nakama__part nakama__part--${group.part.kind}`}>
            {group.part.icon && <PartIcon id={group.part.icon} className="nakama__icon" />}
            {group.part.label}
          </span>
          <div className="nakama__list">
            {group.kanji.slice(0, MAX_KANJI_PER_GROUP).map((k) => (
              <button key={k.char} type="button" className="nakama__kanji" onClick={() => onOpen(k.char)} aria-label={`${k.char} ${k.yomi}`}>
                <span className="nakama__char">{k.char}</span>
                <PartIcon id={k.icon} className="nakama__icon" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
