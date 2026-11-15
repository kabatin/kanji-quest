import { useMemo } from 'react'
import { MASTERY_LABEL, MASTERY_NOTE, MASTERY_STATES, masteryCounts, type MasteryCell } from '../../lib/mastery'
import { mapGroups, type MapGrade } from '../../lib/parentView'

type Props = {
  readonly cells: readonly MasteryCell[]
  readonly selected: string | null
  readonly onSelect: (char: string) => void
}

const cellLabel = (cell: MasteryCell): string => `${cell.char} ${MASTERY_LABEL[cell.state]}${cell.weak ? `・苦手(${cell.misses}回)` : ''}`

/** 凡例: 段階の順(うすい → こい)に、色の見本・名前・字の数。苦手の しるし も。 */
function MapLegend({ cells }: { readonly cells: readonly MasteryCell[] }) {
  const counts = masteryCounts(cells)
  const weak = cells.filter((cell) => cell.weak).length
  return (
    <ul className="mmap__legend" aria-label="凡例">
      {MASTERY_STATES.map((state) => (
        <li key={state} title={MASTERY_NOTE[state]}>
          <span className="mmap__swatch" data-state={state} aria-hidden="true" />
          <span className="mmap__legend-name">{MASTERY_LABEL[state]}</span>
          <span className="mmap__legend-count">{counts[state]}</span>
        </li>
      ))}
      <li className="mmap__legend-weak" title="まちがえた回数が残っている字です。">
        <span className="mmap__weak-dot" aria-hidden="true" />
        <span className="mmap__legend-name">苦手</span>
        <span className="mmap__legend-count">{weak}</span>
      </li>
    </ul>
  )
}

function Cell({ cell, selected, onSelect }: { readonly cell: MasteryCell; readonly selected: boolean; readonly onSelect: (char: string) => void }) {
  return (
    <button
      type="button"
      className="mcell"
      data-state={cell.state}
      data-weak={cell.weak ? 'true' : undefined}
      data-kanji={cell.char}
      aria-pressed={selected}
      aria-label={cellLabel(cell)}
      title={cellLabel(cell)}
      onClick={() => onSelect(cell.char)}
    >
      <span>{cell.char}</span>
    </button>
  )
}

/** 習熟マップ: 全240字を 学年・ステージの順に、いまの段階で ぬり分ける。字を押すと くわしい記録。 */
export function MasteryMap({ cells, selected, onSelect }: Props) {
  const groups = useMemo(() => mapGroups(cells), [cells])
  const anyLearned = cells.some((cell) => cell.state !== 'none')
  return (
    <section className="parent-card mmap" aria-labelledby="mmap-title">
      <header className="parent-card__head parent-card__head--row">
        <h2 id="mmap-title">習熟マップ</h2>
        <p className="parent-card__sub">{anyLearned ? '240字を学年・ステージ順に。字を押すと、くわしい記録が出ます。' : 'まだ学んだ字がありません。学ぶと、字ごとに段階の色がつきます。'}</p>
      </header>
      <MapLegend cells={cells} />
      <div className="mmap__scroll">
        <div className="mmap__grid">
          {groups.map((group) => (
            <GradeBlock key={group.grade} group={group} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  )
}

function GradeBlock({ group, selected, onSelect }: { readonly group: MapGrade } & Omit<Props, 'cells'>) {
  return (
    <div className="mmap__grade" role="group" aria-label={`${group.grade}年生の漢字`}>
      <h3 className="mmap__grade-title">
        {group.grade}年生
        <span>
          学んだ字 {group.total - group.counts.none} / {group.total}
        </span>
      </h3>
      {group.areas.map((area) => (
        <div key={area.areaIndex} className="mmap__area">
          {area.stages.map((stage) => (
            <div key={stage[0]?.stage} className="mmap__stage">
              {stage.map((cell) => (
                <Cell key={cell.char} cell={cell} selected={cell.char === selected} onSelect={onSelect} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
