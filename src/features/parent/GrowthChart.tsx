import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { GrowthPoint } from '../../lib/parentTrend'
import { axisTicks, niceMax } from '../../lib/parentView'
import { GROWTH_SERIES, type GrowthKey } from './growthSeries'

/**
 * 週ごとの 累計の 折れ線(覚えた字・自力で書けた字)。同じ単位なので 軸は1つ。
 * 名前は 凡例と 線の はしの数 で読める。指を置く(キーボードなら ← →)と、その週の数が出る。表も あわせて持つ。
 */

const W = 400
const H = 176
const M = { left: 30, right: 40, top: 12, bottom: 26 } as const
const PLOT_W = W - M.left - M.right
const PLOT_H = H - M.top - M.bottom
const LABEL_GAP = 13

type Key = GrowthKey

const shortDay = (day: string): string => {
  const [, month, date] = day.split('-').map(Number)
  return `${month}/${date}`
}

type Geometry = { readonly x: (i: number) => number; readonly y: (v: number) => number; readonly max: number }

function geometryOf(points: readonly GrowthPoint[]): Geometry {
  const max = niceMax(Math.max(...points.map((p) => p.learned), 0))
  const step = points.length > 1 ? PLOT_W / (points.length - 1) : 0
  return { x: (i) => M.left + i * step, y: (v) => M.top + PLOT_H - (v / max) * PLOT_H, max }
}

const linePath = (pts: readonly (readonly [number, number])[]): string => pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join('')

function seriesPaths(points: readonly GrowthPoint[], key: Key, g: Geometry): { readonly line: string; readonly area: string } {
  const pts = points.map((p, i) => [g.x(i), g.y(p[key])] as const)
  const base = g.y(0).toFixed(1)
  const line = linePath(pts)
  return { line, area: `${line}L${pts[pts.length - 1][0].toFixed(1)},${base}L${pts[0][0].toFixed(1)},${base}Z` }
}

/** 線の はしの数の 高さ。近すぎたら 少しだけ 上下に はなす */
function endLabelY(a: number, b: number): readonly [number, number] {
  const gap = Math.abs(a - b)
  if (gap >= LABEL_GAP) return [a, b]
  const push = (LABEL_GAP - gap) / 2
  return a <= b ? [a - push, b + push] : [a + push, b - push]
}

/** x のめもり: はじめ・まんなか・今週 */
const xTicks = (count: number): number[] => [...new Set([0, Math.floor((count - 1) / 2), count - 1])]

function Axes({ points, g }: { readonly points: readonly GrowthPoint[]; readonly g: Geometry }) {
  return (
    <g className="gchart__axes">
      {axisTicks(g.max).map((tick) => (
        <g key={tick}>
          <line className={tick === 0 ? 'gchart__base' : 'gchart__grid'} x1={M.left} x2={W - M.right} y1={g.y(tick)} y2={g.y(tick)} />
          <text className="gchart__tick" x={M.left - 6} y={g.y(tick) + 4} textAnchor="end">
            {tick}
          </text>
        </g>
      ))}
      {xTicks(points.length).map((i) => (
        <text key={i} className="gchart__tick" x={g.x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
          {i === points.length - 1 ? '今週' : shortDay(points[i].range.to)}
        </text>
      ))}
    </g>
  )
}

function Series({ points, g }: { readonly points: readonly GrowthPoint[]; readonly g: Geometry }) {
  const last = points.length - 1
  const ends = endLabelY(g.y(points[last].learned), g.y(points[last].freeWritten))
  return (
    <g>
      {GROWTH_SERIES.map((series, s) => {
        const paths = seriesPaths(points, series.key, g)
        return (
          <g key={series.key} className={`gchart__series gchart__series--${series.key}`}>
            <path className="gchart__area" d={paths.area} />
            <path className="gchart__line" d={paths.line} pathLength={1} />
            <circle className="gchart__dot" cx={g.x(last)} cy={g.y(points[last][series.key])} r={4} />
            <text className="gchart__end" x={g.x(last) + 8} y={ends[s] + 4}>
              {points[last][series.key]}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function Readout({ point, left }: { readonly point: GrowthPoint; readonly left: number }) {
  const align = left < 25 ? 'start' : left > 75 ? 'end' : 'middle'
  return (
    <div className={`gchart__tip is-${align}`} style={{ left: `${left}%` }} aria-hidden="true">
      <p className="gchart__tip-day">
        {shortDay(point.range.from)}〜{shortDay(point.range.to)}
      </p>
      {GROWTH_SERIES.map((series) => (
        <p key={series.key} className={`gchart__tip-row gchart__tip-row--${series.key}`}>
          <strong>{point[series.key]}字</strong> {series.label}
        </p>
      ))}
    </div>
  )
}

/** 指・マウス・キーボードで えらんでいる週 */
function usePick(count: number) {
  const [active, setActive] = useState<number | null>(null)
  const clamp = (i: number) => Math.min(Math.max(i, 0), count - 1)
  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (!box || box.width === 0 || count < 2) return
    const vx = ((event.clientX - box.left) / box.width) * W
    setActive(clamp(Math.round(((vx - M.left) / PLOT_W) * (count - 1))))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    if (move === 0) return
    event.preventDefault()
    setActive((now) => clamp((now ?? count - 1) + move))
  }
  return { active, setActive, onPointerMove, onKeyDown }
}

export function GrowthChart({ points }: { readonly points: readonly GrowthPoint[] }) {
  const g = geometryOf(points)
  const pick = usePick(points.length)
  const active = pick.active === null ? null : points[pick.active]
  return (
    <figure className="gchart">
      <div
        className="gchart__plot"
        tabIndex={0}
        aria-label="週ごとの伸び(← → で週を選べます)"
        onKeyDown={pick.onKeyDown}
        onFocus={() => pick.setActive(points.length - 1)}
        onBlur={() => pick.setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="gchart__svg" aria-hidden="true">
          <Axes points={points} g={g} />
          {pick.active !== null && <line className="gchart__cross" x1={g.x(pick.active)} x2={g.x(pick.active)} y1={M.top} y2={M.top + PLOT_H} />}
          <Series points={points} g={g} />
          {active &&
            pick.active !== null &&
            GROWTH_SERIES.map((series) => <circle key={series.key} className={`gchart__pick gchart__pick--${series.key}`} cx={g.x(pick.active ?? 0)} cy={g.y(active[series.key])} r={4} />)}
          <rect className="gchart__hit" x={M.left - 10} y={0} width={PLOT_W + 20} height={H} onPointerMove={pick.onPointerMove} onPointerDown={pick.onPointerMove} onPointerLeave={() => pick.setActive(null)} />
        </svg>
        {active && pick.active !== null && <Readout point={active} left={(g.x(pick.active) / W) * 100} />}
      </div>
      <GrowthTable points={points} />
    </figure>
  )
}

/** 同じ数を 表でも(読み上げ用。表は 1px の箱に入らないので、箱で つつむ) */
function GrowthTable({ points }: { readonly points: readonly GrowthPoint[] }) {
  return (
    <div className="sr-only">
      <table>
        <caption>週ごとの伸び(累計)</caption>
        <thead>
          <tr>
            <th scope="col">週</th>
            {GROWTH_SERIES.map((series) => (
              <th key={series.key} scope="col">
                {series.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.range.to}>
              <th scope="row">
                {shortDay(point.range.from)}〜{shortDay(point.range.to)}
              </th>
              <td>{point.learned}字</td>
              <td>{point.freeWritten}字</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
