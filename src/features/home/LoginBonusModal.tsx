import { LOGIN_BONUS } from '../../lib/rewards'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress } from '../../store/progress'

/** その日はじめて開いたときに出る、ログインボーナス。7日でひとまわりする。 */
export function LoginBonusModal() {
  const bonus = useProgress((s) => s.loginBonus)
  const claim = useProgress((s) => s.claimLoginBonus)
  const { play } = useFeedback()
  if (!bonus || bonus.claimed) return null
  const todayIndex = (bonus.streakDay - 1) % LOGIN_BONUS.length

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="ログインボーナス">
      <div className="modal__panel">
        <h2>きょうも きてくれたね！</h2>
        <p className="modal__lead">れんぞく {bonus.streakDay}にちめ</p>
        <ol className="bonus-days">
          {LOGIN_BONUS.map((coins, i) => (
            <li key={i} className={i < todayIndex ? 'is-past' : i === todayIndex ? 'is-today' : ''}>
              <small>{i + 1}にちめ</small>
              <span className="coin" aria-hidden="true" />
              {coins}
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn btn--primary btn--big"
          onClick={() => {
            claim()
            play('fanfare')
          }}
        >
          コインを {bonus.coins}まい うけとる
        </button>
      </div>
    </div>
  )
}
