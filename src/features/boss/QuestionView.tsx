import type { BossQuestion } from '../../lib/boss'
import type { WriteReport } from '../../lib/strokeHint'
import { Kaku } from '../kaku/Kaku'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { Erabi } from '../quiz/Erabi'
import { PartsPick } from './PartsPick'

type Props = {
  readonly question: BossQuestion
  /** とけたときに、まちがえた回数つきで呼ばれる。書く問題では ヒントの くわしい結果(report)も つく */
  readonly onSolved: (mistakes: number, report?: WriteReport) => void
}

/** ボス・ふくしゅう の問題1つ(つくり・ぜんぶの部位・なりたち/絵・書く)を出す。 */
export function QuestionView({ question, onSolved }: Props) {
  if (question.type === 'kumi') return <Kumiawase question={question} showHint={false} onSolved={onSolved} />
  if (question.type === 'parts') return <PartsPick question={question} onSolved={onSolved} />
  if (question.type === 'erabi') return <Erabi question={question} onSolved={onSolved} />
  return <Kaku kanji={question.kanji} strokes={question.strokes} given={question.given} model={question.model} strict onDone={onSolved} />
}
