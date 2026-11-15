import { useMemo, useState } from 'react'
import { ALL_STAGES } from '../../data/areas'
import { KANJI } from '../../data/kanji'
import type { Hands } from '../../lib/handwriting'
import { charHistory } from '../../lib/charHistory'
import { masteryMap } from '../../lib/mastery'
import { weekReport, weekSentences } from '../../lib/parentReport'
import { growthTrend } from '../../lib/parentTrend'
import { recentRates, trendStatus, trendWeeks, undatedCount } from '../../lib/parentView'
import type { ReportInput } from '../../lib/reportInput'
import '../../styles/parent-overview.css'
import '../../styles/parent-charts.css'
import { CharDetail } from './CharDetail'
import { GrowthCard } from './GrowthCard'
import { MasteryMap } from './MasteryMap'
import { RatesCard } from './RatesCard'
import { RecentHands } from './RecentHands'
import { SummaryBand } from './SummaryBand'

type Props = {
  readonly input: ReportInput
  /** 子どもが書いた字 */
  readonly hands: Hands
  readonly name: string
  readonly today: string
  readonly canPractice: boolean
  readonly onOpen: (char: string) => void
}

/** 学習のようす: 文の まとめ → 習熟マップ と 伸び・割合(字を押すと、右が その字の記録になる) */
export function OverviewView({ input, hands, name, today, canPractice, onOpen }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const cells = useMemo(() => masteryMap(ALL_STAGES, input), [input])
  const trend = useMemo(() => growthTrend(input, today, trendWeeks(input, today)), [input, today])
  const report = weekReport(input, today)
  const rates = recentRates(input.answerDays, today)
  const last = trend[trend.length - 1]

  return (
    <div className="pv">
      <SummaryBand name={name} sentences={weekSentences(report)} learned={last?.learned ?? 0} freeWritten={last?.freeWritten ?? 0} total={KANJI.length} />
      <div className="pv__main">
        <div className="pv__left">
          <MasteryMap cells={cells} selected={selected} onSelect={(char) => setSelected((now) => (now === char ? null : char))} />
          <RecentHands hands={hands} name={name} onOpen={setSelected} />
        </div>
        <div className="pv__side">
          {/* 字の記録は 上に かさねて出す(下の グラフは そのまま のこし、閉じても 描きなおさない) */}
          <div className={`pv__cards ${selected ? 'is-covered' : ''}`} aria-hidden={selected ? true : undefined}>
            <GrowthCard points={trend} status={trendStatus(input, today)} undated={undatedCount(input)} />
            <RatesCard retention={rates.retention} hintUse={rates.hintUse} />
          </div>
          {selected && <CharDetail history={charHistory(selected, input)} today={today} hand={hands[selected]} name={name} canPractice={canPractice} onPractice={onOpen} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  )
}
