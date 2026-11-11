import { KText } from '../../components/KText'
import { dayKey } from '../../lib/date'
import { dailyMissions, isMissionDone, missionProgress } from '../../lib/missions'
import { useFeedback } from '../../lib/useFeedback'
import { useKanjiText } from '../../lib/useKanjiText'
import { useProgress } from '../../store/progress'

/** きょうのミッション3つ。達成したら、押してコインを受け取る。 */
export function MissionPanel() {
  const today = dayKey()
  const daily = useProgress((s) => s.daily)
  const claimMission = useProgress((s) => s.claimMission)
  const { play } = useFeedback()
  const kt = useKanjiText()
  // 日付が変わった直後(まだ数えなおしていないとき)は、0 から数える
  const counters = daily.day === today ? daily.counters : undefined
  const claimed = daily.day === today ? daily.claimed : []

  return (
    <section className="missions" aria-label="きょうの ミッション">
      <h2 className="missions__title">
        <KText text="{今日|きょう}の ミッション" />
      </h2>
      <ul className="missions__list">
        {dailyMissions(today).map((mission) => {
          const progress = counters ? missionProgress(mission, counters) : 0
          const done = counters ? isMissionDone(mission, counters) : false
          const isClaimed = claimed.includes(mission.id)
          return (
            <li key={mission.id} className={`mission ${isClaimed ? 'is-claimed' : done ? 'is-done' : ''}`}>
              <span className="mission__label">
                <KText text={mission.label} />
              </span>
              <span className="mission__bar" role="progressbar" aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={progress}>
                <span style={{ width: `${(progress / mission.target) * 100}%` }} />
              </span>
              {isClaimed ? (
                <span className="mission__seal" aria-label="うけとった">
                  済
                </span>
              ) : (
                <button
                  type="button"
                  className="mission__claim"
                  disabled={!done}
                  onClick={() => {
                    if (claimMission(mission.id) > 0) play('ok')
                  }}
                  aria-label={`${kt(mission.label)} の ごほうびを うけとる`}
                >
                  <span className="coin" aria-hidden="true" />
                  {mission.reward}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
