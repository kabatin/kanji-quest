import { KText } from '../../components/KText'
import { MiniIcon } from '../../components/MiniIcon'
import { weakChars } from '../../lib/weak'
import { useProgress } from '../../store/progress'

type Props = { readonly onOpen: () => void }

/** ホームの まんなかに出る「にがて れんしゅう」。苦手な字が ないときは出さない。 */
export function WeakCall({ onOpen }: Props) {
  const misses = useProgress((s) => s.misses)
  const learned = useProgress((s) => s.learned)
  const count = weakChars(misses, learned).length
  if (count === 0) return null
  return (
    <button type="button" className="review-call review-call--weak" onClick={onOpen} aria-label={`にがて れんしゅう ${count}じ`}>
      <MiniIcon name="mato" className="review-call__icon" />
      <span className="review-call__text">
        <small>にがて れんしゅう</small>
        <span>
          <strong>{count}</strong>
          <KText text="{字|じ}" />
        </span>
      </span>
      <span className="review-call__go" aria-hidden="true">
        ▶
      </span>
    </button>
  )
}
