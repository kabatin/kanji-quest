import { useMemo, useState } from 'react'
import { ALL_STAGES } from '../../data/areas'
import { homeworkRows, HOMEWORK_MAX, type Homework } from '../../lib/homework'
import { masteryMap } from '../../lib/mastery'
import type { ReportInput } from '../../lib/reportInput'
import { useParent } from '../../store/parent'
import '../../styles/parent-overview.css'
import '../../styles/parent-homework.css'
import { HomeworkList } from './HomeworkList'
import { MasteryMap } from './MasteryMap'

type Props = {
  readonly childId: string
  readonly name: string
  readonly input: ReportInput
  readonly today: string
  readonly canPractice: boolean
  readonly onOpen: (char: string) => void
}

const NO_HOMEWORK: Homework = {}

const HEADING = {
  title: '練習させたい字を選ぶ',
  sub: `学年・ステージ順です。押すと選び、もう一度押すとはずします(${HOMEWORK_MAX}字まで)。`,
}

/** 宿題: 左の表から 字を押して えらぶ(覚えていない字も えらべる)。右に えらんだ字の いまの状態。 */
export function HomeworkView({ childId, name, input, today, canPractice, onOpen }: Props) {
  const homework = useParent((s) => s.homework[childId]) ?? NO_HOMEWORK
  const toggle = useParent((s) => s.toggleHomework)
  const clear = useParent((s) => s.clearHomework)
  const [full, setFull] = useState(false)
  const cells = useMemo(() => masteryMap(ALL_STAGES, input), [input])
  const marked = useMemo(() => new Set(Object.keys(homework)), [homework])
  const rows = useMemo(() => homeworkRows(homework, input), [homework, input])

  const pick = (char: string) => setFull(!toggle(childId, char, today))
  const remove = (char: string) => {
    setFull(false)
    toggle(childId, char, today)
  }
  const removeAll = () => {
    setFull(false)
    clear(childId)
  }

  return (
    <div className="hw">
      <MasteryMap cells={cells} selected={null} marked={marked} onSelect={pick} heading={HEADING} />
      <div className="hw__side">
        {full && (
          <p className="hw__full" role="alert">
            選べるのは{HOMEWORK_MAX}字までです。ほかの字をはずしてから選んでください。
          </p>
        )}
        <HomeworkList rows={rows} name={name} canPractice={canPractice} onPractice={onOpen} onRemove={remove} onClear={removeAll} />
      </div>
    </div>
  )
}
