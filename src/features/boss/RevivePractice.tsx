import { useState } from 'react'
import { getKanji } from '../../data/kanji'
import { answerOf } from '../../lib/answerInput'
import type { AnswerInput } from '../../lib/answerLog'
import { roundOf } from '../../lib/boss'
import type { WriteReport } from '../../lib/strokeHint'
import { useFeedback } from '../../lib/useFeedback'
import { buildWeakQuestions } from '../../lib/weak'
import { QuestionView } from './QuestionView'

const ROUND_LABEL = { select: 'えらぶ', model: 'みて かく', blind: 'みないで かく' } as const

type Props = {
  /** ボスで まちがえた漢字 */
  readonly chars: readonly string[]
  readonly onQuit: () => void
  /** 書きおえたとき。れんしゅうの答え(ふっかつ戦の きろくに 足す)つき */
  readonly onDone: (answers: readonly AnswerInput[]) => void
}

/**
 * ふっかつ の前の れんしゅう。ボスで まちがえた字を、見て書く → 見ないで書く の順に 書く。
 * ここでは まちがえても よい(さいごまで書けば、ふっかつ戦に すすめる)。
 */
export function RevivePractice({ chars, onQuit, onDone }: Props) {
  const [questions] = useState(() => buildWeakQuestions(chars.map(getKanji)))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<readonly AnswerInput[]>([])
  const { play } = useFeedback()
  const question = questions[index]
  const round = roundOf(question)

  const handleSolved = (mistakes: number, report?: WriteReport) => {
    play(mistakes === 0 ? 'hit' : 'miss')
    const next = [...answers, answerOf(question, mistakes, report)]
    if (index + 1 >= questions.length) onDone(next)
    else {
      setAnswers(next)
      setIndex(index + 1)
    }
  }

  return (
    <div className="screen review-run revive-practice" data-kanji={question.kanji.char} data-type={question.type} data-round={round}>
      <header className="bar">
        <button type="button" className="btn btn--back" onClick={onQuit}>
          ← やめる
        </button>
        <h1 className="bar__title">ふっかつ れんしゅう</h1>
        <span className="quiz__pips" role="img" aria-label={`${index + 1} / ${questions.length}`}>
          {questions.map((_, i) => (
            <span key={i} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />
          ))}
        </span>
        <span className="bar__spacer" />
        <span className="boss-run__round">{ROUND_LABEL[round]}</span>
        <span className="bar__step">
          {index + 1} / {questions.length}
        </span>
      </header>
      <QuestionView key={index} question={question} onSolved={handleSolved} />
    </div>
  )
}
