import { KText } from '../../components/KText'
import { MiniIcon } from '../../components/MiniIcon'
import { dayKey } from '../../lib/date'
import { dueChars } from '../../lib/review'
import { useProgress } from '../../store/progress'

type Props = { readonly onOpen: () => void }

/** ホームの まんなかに出る「きょうの ふくしゅう」。ふくしゅう する字が ないときは出さない。 */
export function ReviewCall({ onOpen }: Props) {
  const reviews = useProgress((s) => s.reviews)
  const count = dueChars(reviews, dayKey()).length
  if (count === 0) return null
  return (
    <button type="button" className="review-call" onClick={onOpen} aria-label={`きょうの ふくしゅう ${count}じ`}>
      <MiniIcon name="kurikaeshi" className="review-call__icon" />
      <span className="review-call__text">
        <small>きょうの ふくしゅう</small>
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
