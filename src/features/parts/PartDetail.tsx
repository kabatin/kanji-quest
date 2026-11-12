import { PartIcon } from '../../components/PartIcon'
import type { PartProgress } from '../../lib/partQuest'
import { COINS_PART_COMPLETE } from '../../lib/rewards'

const KIND_LABEL = { imi: 'いみ', oto: 'おと' } as const

type Props = {
  readonly progress: PartProgress
  readonly learned: ReadonlySet<string>
  /** ごほうびを もう受け取ったか */
  readonly claimed: boolean
  readonly onClaim: () => void
  readonly onOpen: (char: string) => void
}

/** えらんだ パーツの なかまの漢字と、コンプリートまでの すすみぐあい。 */
export function PartDetail({ progress, learned, claimed, onClaim, onOpen }: Props) {
  const { part, users, known, complete } = progress
  return (
    <>
      <div className={`parts__head parts__head--${part.kind} ${complete ? 'is-complete' : ''}`}>
        {part.icon ? <PartIcon id={part.icon} className="parts__icon" /> : <span className="parts__note">♪</span>}
        <div>
          <small>{KIND_LABEL[part.kind]}パーツ</small>
          <strong>{part.label}</strong>
        </div>
        {claimed && (
          <span className="parts__seal" aria-label="コンプリート">
            済
          </span>
        )}
      </div>
      <div className="parts__progress">
        <span className="parts__meter" role="progressbar" aria-label="コンプリートまで" aria-valuemin={0} aria-valuemax={users.length} aria-valuenow={known}>
          <span style={{ width: `${users.length === 0 ? 0 : (known / users.length) * 100}%` }} />
        </span>
        <span className="parts__progress-num">
          {known} / {users.length}
        </span>
      </div>
      {complete && !claimed && (
        <button type="button" className="btn btn--primary parts__claim" onClick={onClaim}>
          コンプリート！ ごほうびを うけとる <span className="coin" aria-hidden="true" /> {COINS_PART_COMPLETE}
        </button>
      )}
      {!complete && (
        <p className="parts__lead">
          あと <strong>{users.length - known}</strong> じ で コンプリート
        </p>
      )}
      <ul className="parts__users">
        {users.map((k) => {
          const isLearned = learned.has(k.char)
          return (
            <li key={k.char}>
              <button type="button" className={`parts-user ${isLearned ? 'is-learned' : ''}`} onClick={() => onOpen(k.char)} aria-label={`${k.char} ${k.yomi}${isLearned ? ' おぼえた' : ''}`}>
                <span className="parts-user__char">{k.char}</span>
                <small>{k.yomi}</small>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
