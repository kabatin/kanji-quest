import type { DayStat } from '../../lib/parentStats'

type Props = {
  readonly title: string
  readonly unit: string
  readonly days: readonly DayStat[]
  readonly value: (day: DayStat) => number
  /** 棒の色(1系列だけなので、色は種類を表すだけ) */
  readonly tone: 'learn' | 'time'
}

/**
 * 7日ぶんの棒グラフ(1つの量だけ)。数は きょう と いちばん多い日 にだけ書き、
 * ほかは棒に指を置くと出る。同じ数を表でも読めるようにしている。
 */
export function WeekChart({ title, unit, days, value, tone }: Props) {
  const values = days.map(value)
  const max = Math.max(...values, 1)
  const peak = values.indexOf(Math.max(...values))
  const total = values.reduce((sum, v) => sum + v, 0)
  return (
    <figure className={`week-chart week-chart--${tone}`}>
      <figcaption className="week-chart__title">
        {title}
        <span className="week-chart__total">
          7日で {total}
          {unit}
        </span>
      </figcaption>
      <div className="week-chart__plot" aria-hidden="true">
        {days.map((day, i) => {
          const v = values[i]
          const isToday = i === days.length - 1
          return (
            <div key={day.day} className={`week-chart__col ${isToday ? 'is-today' : ''}`} title={`${day.day}（${day.weekday}） ${v}${unit}`}>
              <span className="week-chart__value">{v > 0 && (isToday || i === peak) ? v : ''}</span>
              <span className="week-chart__bar" style={{ height: `${(v / max) * 100}%` }} />
              <span className="week-chart__day">{isToday ? '今日' : day.weekday}</span>
            </div>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {days.map((day, i) => (
            <tr key={day.day}>
              <th scope="row">{day.day}</th>
              <td>
                {values[i]}
                {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
