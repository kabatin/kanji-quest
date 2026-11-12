import type { ReactNode } from 'react'
import iconChallenge from '../../assets/art/icon-challenge.webp'
import iconZukan from '../../assets/art/icon-zukan.webp'
import { KText } from '../../components/KText'
import { MiniIcon } from '../../components/MiniIcon'
import { dayKey } from '../../lib/date'
import { dailyMissions, isMissionDone, missionProgress, type Counters } from '../../lib/missions'
import { useFeedback } from '../../lib/useFeedback'
import { useKanjiText } from '../../lib/useKanjiText'
import { useProgress } from '../../store/progress'
import { BossMonster } from '../boss/BossMonster'

/** ミッションの種類ごとの絵 */
const MISSION_ICON: Record<keyof Counters, ReactNode> = {
  learn: <img src={iconZukan} alt="" draggable={false} />,
  learnNew: <MiniIcon name="me" />,
  write: <MiniIcon name="fude" />,
  challenge: <img src={iconChallenge} alt="" draggable={false} />,
  firstTry: <MiniIcon name="mato" />,
  maxCombo: <MiniIcon name="honoo" />,
  stage: <BossMonster seed={1} label="" />,
  review: <MiniIcon name="kurikaeshi" />,
}

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
  const missions = dailyMissions(today)

  return (
    <section className="missions" aria-label="きょうの ミッション">
      <h2 className="missions__title">
        <KText text="{今日|きょう}の ミッション" />
        <span className="missions__done" aria-label={`${claimed.length} / ${missions.length} おわった`}>
          {missions.map((mission) => (
            <span key={mission.id} className={claimed.includes(mission.id) ? 'is-on' : ''} aria-hidden="true">
              ★
            </span>
          ))}
        </span>
      </h2>
      <ul className="missions__list">
        {missions.map((mission) => {
          const progress = counters ? missionProgress(mission, counters) : 0
          const done = counters ? isMissionDone(mission, counters) : false
          const isClaimed = claimed.includes(mission.id)
          return (
            <li key={mission.id} className={`mission ${isClaimed ? 'is-claimed' : done ? 'is-done' : ''}`}>
              <span className="mission__icon" aria-hidden="true">
                {MISSION_ICON[mission.counter]}
              </span>
              <span className="mission__label">
                <KText text={mission.label} />
              </span>
              <span className="mission__meter">
                <span className="mission__bar" role="progressbar" aria-valuemin={0} aria-valuemax={mission.target} aria-valuenow={progress}>
                  <span style={{ width: `${(progress / mission.target) * 100}%` }} />
                </span>
                <span className="mission__num" aria-hidden="true">
                  {progress} / {mission.target}
                </span>
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
