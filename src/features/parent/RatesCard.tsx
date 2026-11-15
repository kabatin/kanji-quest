import { RATE_LABEL, RATE_NOTE } from '../../lib/parentTrend'
import type { RateView } from '../../lib/parentView'

type Props = { readonly retention: RateView; readonly hintUse: RateView }

function RateValue({ view }: { readonly view: RateView }) {
  if (view.kind === 'few') {
    return (
      <>
        <p className="prate__few">あと少しで見えます</p>
        <p className="prate__detail">あと{view.needed}問で出ます</p>
      </>
    )
  }
  return (
    <>
      <p className="prate__value">
        {view.percent}
        <small>%</small>
      </p>
      <span className="prate__meter" aria-hidden="true">
        <span style={{ width: `${view.percent}%` }} />
      </span>
      <p className="prate__detail">
        {view.total}問中{view.count}問{view.before === null ? '' : `・その前の4週 ${view.before}%`}
      </p>
    </>
  )
}

function RateTile({ label, view }: { readonly label: string; readonly view: RateView }) {
  return (
    <div className="prate" role="group" aria-label={label}>
      <h3 className="prate__label">{label}</h3>
      <RateValue view={view} />
    </div>
  )
}

/** 書く力の割合(最近4週)。分母が 少ないうちは 値を出さない。 */
export function RatesCard({ retention, hintUse }: Props) {
  return (
    <section className="parent-card rcard" aria-labelledby="rcard-title">
      <header className="parent-card__head parent-card__head--row">
        <h2 id="rcard-title">書く力のようす</h2>
        <p className="parent-card__sub">最近4週</p>
      </header>
      <div className="rcard__tiles">
        <RateTile label={RATE_LABEL.retention} view={retention} />
        <RateTile label={RATE_LABEL.hintUse} view={hintUse} />
      </div>
      <details className="rcard__about">
        <summary>この割合について</summary>
        <p>
          <strong>{RATE_LABEL.retention}</strong>: {RATE_NOTE.retention}
        </p>
        <p>
          <strong>{RATE_LABEL.hintUse}</strong>: {RATE_NOTE.hintUse}
        </p>
      </details>
    </section>
  )
}
