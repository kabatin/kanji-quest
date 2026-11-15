import { KText } from '../../components/KText'
import { MiniIcon } from '../../components/MiniIcon'
import { dayKey } from '../../lib/date'
import { todaysReview } from '../../lib/review'
import { useReviewQueue } from '../../lib/useReviewQueue'
import { useParent } from '../../store/parent'
import { useProgress } from '../../store/progress'

type Props = { readonly onOpen: () => void }

/** ホームの まんなかに出る「きょうの ふくしゅう」。きょうの ぶん(1日の数まで)が おわったら出さない。 */
export function ReviewCall({ onOpen }: Props) {
  const queue = useReviewQueue()
  const done = useProgress((s) => s.reviewDone)
  const limit = useParent((s) => s.reviewPerDay)
  const today = dayKey()
  const count = todaysReview(queue.length, done, today, limit).left
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
