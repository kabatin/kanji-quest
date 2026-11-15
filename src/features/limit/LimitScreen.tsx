import { MascotSays } from '../../components/MascotSays'
import { restLine, todayDone } from '../../lib/playGate'
import { useProgress } from '../../store/progress'
import { dayKey } from '../../lib/date'
import './limit.css'

type Props = {
  /** おうちの かた向けの入り口(かけ算)へ */
  readonly onParent: () => void
  /** あそぶ人を かえる(2人以上いるときだけ) */
  readonly onSwitch?: () => void
}

/** 1日の時間に 来たときの「きょうは ここまで」。すみまるが ねぎらい、あしたも あそべると つたえる。 */
export function LimitScreen({ onParent, onSwitch }: Props) {
  const learnedOn = useProgress((s) => s.learnedOn)
  const answerDays = useProgress((s) => s.answerDays)
  const done = todayDone(learnedOn, answerDays, dayKey())

  return (
    <div className="screen limit" data-limit>
      <div className="limit__card">
        <h1 className="limit__title">きょうは ここまで</h1>
        <MascotSays text={restLine(done)} className="limit__says" />
        <p className="limit__tomorrow">あしたも また あそべるよ。ゆっくり やすんでね。</p>
        <div className="limit__actions">
          {onSwitch && (
            <button type="button" className="btn" onClick={onSwitch}>
              ほかの ひとに かわる
            </button>
          )}
          <button type="button" className="btn limit__parent" onClick={onParent}>
            おうちの かたへ
          </button>
        </div>
      </div>
    </div>
  )
}
