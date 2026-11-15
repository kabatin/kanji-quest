import type { GrowthPoint } from '../../lib/parentTrend'
import type { TrendStatus } from '../../lib/parentView'
import { GrowthChart } from './GrowthChart'
import { GROWTH_SERIES } from './growthSeries'

type Props = {
  readonly points: readonly GrowthPoint[]
  readonly status: TrendStatus
  /** 覚えた日が わからない字(古い記録)の数 */
  readonly undated: number
}

function Legend() {
  return (
    <ul className="gchart__legend" aria-label="凡例">
      {GROWTH_SERIES.map((series) => (
        <li key={series.key}>
          <span className={`gchart__key gchart__key--${series.key}`} aria-hidden="true" />
          {series.label}
        </li>
      ))}
    </ul>
  )
}

/** まだ線に できないときの 表示(いまの数と、いつ見えるか) */
function Waiting({ status, last }: { readonly status: TrendStatus; readonly last: GrowthPoint | undefined }) {
  if (status.status === 'empty') {
    return <p className="parent-card__empty">まだ覚えた字がありません。漢字を学ぶと、週ごとの伸びがここに線で出ます。</p>
  }
  return (
    <div className="parent-card__empty">
      <p className="gcard__now">
        いま 覚えた字 <strong>{last?.learned ?? 0}</strong>字・自力で書けた字 <strong>{last?.freeWritten ?? 0}</strong>字
      </p>
      <p>記録が1週間ぶん たまると、週ごとの伸びが線で見えます(あと{status.daysLeft}日)。</p>
    </div>
  )
}

/** 週ごとの伸び(覚えた字と、自力で書けた字の 累計) */
export function GrowthCard({ points, status, undated }: Props) {
  return (
    <section className="parent-card gcard" aria-labelledby="gcard-title">
      <header className="parent-card__head parent-card__head--row">
        <h2 id="gcard-title">週ごとの伸び</h2>
        <p className="parent-card__sub">累計。自力 = 見本もヒントも使わずに</p>
      </header>
      {status.status === 'ok' ? (
        <>
          <Legend />
          <GrowthChart points={points} />
          {undated > 0 && <p className="parent-card__note">記録をとりはじめる前に覚えた{undated}字は、はじめの週から数えています。</p>}
        </>
      ) : (
        <Waiting status={status} last={points[points.length - 1]} />
      )}
    </section>
  )
}
