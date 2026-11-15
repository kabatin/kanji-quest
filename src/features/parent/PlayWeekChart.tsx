import type { DayStat } from '../../lib/parentStats'
import { axisTicks, niceMax } from '../../lib/parentView'
// 目もり・数の 文字は 折れ線と 同じ見た目
import '../../styles/parent-charts.css'

/**
 * この7日の 遊んだ時間(1つの量なので 1色・凡例なし)。数は きょう と いちばん多い日 にだけ書く。
 * 上限が 決まっていれば、その高さに 細い線を引く。表も あわせて持つ。
 */

const W = 360
const H = 150
const M = { left: 30, right: 10, top: 16, bottom: 22 } as const
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom
const BAR = 20

type Props = { readonly days: readonly DayStat[]; readonly limit: number }

export function PlayWeekChart({ days, limit }: Props) {
  const values = days.map((day) => day.minutes)
  const max = niceMax(Math.max(...values, limit, 0))
  const peak = values.indexOf(Math.max(...values))
  const slot = PLOT_W / days.length
  const y = (v: number) => M.top + PLOT_H - (v / max) * PLOT_H
  const last = days.length - 1
  return (
    <figure className="pweek">
      <figcaption className="pweek__title">この7日の遊んだ時間(分)</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="pweek__svg" aria-hidden="true">
        {axisTicks(max).map((tick) => (
          <g key={tick}>
            <line className={tick === 0 ? 'gchart__base' : 'gchart__grid'} x1={M.left} x2={W - M.right} y1={y(tick)} y2={y(tick)} />
            <text className="gchart__tick" x={M.left - 6} y={y(tick) + 4} textAnchor="end">
              {tick}
            </text>
          </g>
        ))}
        {days.map((day, i) => {
          const cx = M.left + slot * i + slot / 2
          const v = values[i]
          const h = Math.max(y(0) - y(v), 0)
          return (
            <g key={day.day} className={i === last ? 'pweek__day is-today' : 'pweek__day'}>
              <title>{`${day.day}(${day.weekday}) ${v}分`}</title>
              {h > 0 && <path className="pweek__bar" d={barPath(cx - BAR / 2, y(v), BAR, h)} />}
              {v > 0 && (i === last || i === peak) && (
                <text className="gchart__end" x={cx} y={y(v) - 5} textAnchor="middle">
                  {v}
                </text>
              )}
              <text className="gchart__tick" x={cx} y={H - 6} textAnchor="middle">
                {i === last ? 'きょう' : day.weekday}
              </text>
            </g>
          )
        })}
        {limit > 0 && (
          <g className="pweek__limit">
            <line x1={M.left} x2={W - M.right} y1={y(limit)} y2={y(limit)} />
            <text x={W - M.right} y={y(limit) - 4} textAnchor="end">
              上限 {limit}分
            </text>
          </g>
        )}
      </svg>
      {/* 読み上げ用の表(表は 1px の箱に入らないので、箱で つつむ) */}
      <div className="sr-only">
        <table>
          <caption>この7日の遊んだ時間</caption>
          <tbody>
            {days.map((day, i) => (
              <tr key={day.day}>
                <th scope="row">{day.day}</th>
                <td>{values[i]}分</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

/** 上の角だけ 4px まるい 棒(下は 0 の線に そろえて 四角) */
function barPath(x: number, top: number, width: number, height: number): string {
  const r = Math.min(4, height, width / 2)
  const bottom = top + height
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${bottom}Z`
}
