import { weekStats } from '../../lib/parentStats'
import { formatMinutes } from '../../lib/parentReport'
import { playTimeText } from '../../lib/parentDetail'
import { PLAY_EXTRA_CHOICES, PLAY_EXTRA_MAX, PLAY_LIMIT_CHOICES, playStatus, type PlayLimit } from '../../lib/playLimit'
import type { ReportInput } from '../../lib/reportInput'
import { playRuleOf, useParent } from '../../store/parent'
import { PlayWeekChart } from './PlayWeekChart'
import { Segmented } from './Segmented'

type Props = { readonly childId: string; readonly name: string; readonly input: ReportInput; readonly today: string }

const LIMIT_OPTIONS = PLAY_LIMIT_CHOICES.map((minutes) => ({ value: minutes, label: minutes === 0 ? 'なし' : `${minutes}分` }))

/** その子の 1日の時間の上限と、きょうだけの延長 */
export function PlayTimeCard({ childId, name, input, today }: Props) {
  const playLimits = useParent((s) => s.playLimits)
  const playExtra = useParent((s) => s.playExtra)
  const setPlayLimit = useParent((s) => s.setPlayLimit)
  const extendPlay = useParent((s) => s.extendPlay)
  const cancelExtra = useParent((s) => s.cancelExtra)
  const rule = playRuleOf({ playLimits, playExtra }, childId, today)
  const status = playStatus({ limit: rule.limit, extra: rule.extra, playMinutes: input.playMinutes, today })
  const full = status.extra >= PLAY_EXTRA_MAX

  return (
    <section className="parent-card ptime" aria-label={`${name}さんの 1日の時間`}>
      <header className="parent-card__head">
        <h2>{name}さんの 1日の時間</h2>
        <p className="parent-card__sub">1日に遊べる時間を、子どもごとに決められます。</p>
      </header>
      <Segmented<PlayLimit> label="1日の上限" options={LIMIT_OPTIONS} value={rule.limit} onChange={(limit) => setPlayLimit(childId, limit)} />
      <div className="ptime__today">
        <p className="ptime__status" aria-live="polite">
          {playTimeText(status)}
        </p>
        {status.limit !== null && (
          <span className="ptime__meter" role="progressbar" aria-label="きょう遊んだ時間" aria-valuemin={0} aria-valuemax={status.limit} aria-valuenow={Math.min(status.used, status.limit)}>
            <span style={{ width: `${Math.min(status.used / Math.max(status.limit, 1), 1) * 100}%` }} />
          </span>
        )}
      </div>
      <div className="parent__option" role="group" aria-label="きょうだけ延長">
        <span className="parent__option-label">きょうだけ延長</span>
        <div className="ptime__extend">
          {PLAY_EXTRA_CHOICES.map((minutes) => (
            <button key={minutes} type="button" className="parent__ghost" disabled={!status.limited || full} onClick={() => extendPlay(childId, minutes, today)}>
              +{minutes}分
            </button>
          ))}
          {status.extra > 0 && (
            <button type="button" className="parent__ghost parent__ghost--quiet" onClick={() => cancelExtra(childId)}>
              延長をやめる({formatMinutes(status.extra)})
            </button>
          )}
        </div>
      </div>
      <p className="parent-card__note">
        {status.limited ? `延長はきょうだけで、明日は元の${formatMinutes(status.base)}にもどります(1日に合計${formatMinutes(PLAY_EXTRA_MAX)}まで)。` : '延長は、上限を決めると使えます。'}
      </p>
      <PlayWeekChart days={weekStats(today, input.learnedOn, input.playMinutes)} limit={status.base} />
    </section>
  )
}
