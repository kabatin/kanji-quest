import { useCallback, useState } from 'react'
import type { Question } from '../../lib/quiz'
import { comboBonus, type QuizSummary } from '../../lib/rewards'
import { questionPoints, type Level } from '../../lib/score'
import { useProgress } from '../../store/progress'
import { ElapsedTime } from '../challenge/ElapsedTime'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { Erabi } from './Erabi'

type Tally = {
  readonly index: number
  readonly score: number
  readonly mistakes: number
  readonly firstTry: number
  readonly combo: number
  readonly maxCombo: number
  readonly firstTryChars: readonly string[]
}

const START: Tally = { index: 0, score: 0, mistakes: 0, firstTry: 0, combo: 0, maxCombo: 0, firstTryChars: [] }

type Props = {
  readonly questions: readonly Question[]
  /** ヒントの量。1 = 絵あり / 2 = 絵なし / 3 = 形だけ */
  readonly level: Level
  readonly onQuit: () => void
  readonly onFinish: (summary: QuizSummary) => void
}

/** 問題を順番に出して、点数・れんぞく正解・タイムを数える。チャレンジと ステージの まとめ で使う。 */
export function QuizRun({ questions, level, onQuit, onFinish }: Props) {
  const [tally, setTally] = useState<Tally>(START)
  const [startedAt] = useState(() => Date.now())
  const showTimer = useProgress((s) => s.settings.timer)
  const question = questions[tally.index]

  const handleSolved = useCallback(
    (mistakes: number) => {
      const isFirstTry = mistakes === 0
      const combo = isFirstTry ? tally.combo + 1 : 0
      const next: Tally = {
        index: tally.index + 1,
        score: tally.score + questionPoints(mistakes) + (isFirstTry ? comboBonus(combo) : 0),
        mistakes: tally.mistakes + mistakes,
        firstTry: tally.firstTry + (isFirstTry ? 1 : 0),
        combo,
        maxCombo: Math.max(tally.maxCombo, combo),
        firstTryChars: isFirstTry ? [...tally.firstTryChars, question.kanji.char] : tally.firstTryChars,
      }
      if (next.index < questions.length) {
        setTally(next)
        return
      }
      onFinish({
        score: next.score,
        questionCount: questions.length,
        mistakes: next.mistakes,
        firstTry: next.firstTry,
        maxCombo: next.maxCombo,
        timeMs: Date.now() - startedAt,
        firstTryChars: next.firstTryChars,
      })
    },
    [tally, question, questions.length, onFinish, startedAt],
  )

  return (
    <div className="screen quiz" data-kanji={question.kanji.char} data-type={question.type}>
      <header className="bar">
        <button type="button" className="btn btn--back" onClick={onQuit}>
          ← やめる
        </button>
        <span className="quiz__pips" role="img" aria-label={`${tally.index + 1} / ${questions.length}`}>
          {questions.map((_, i) => (
            <span key={i} className={i < tally.index ? 'is-done' : i === tally.index ? 'is-now' : ''} />
          ))}
        </span>
        <span className="bar__step">
          {tally.index + 1} / {questions.length}
        </span>
        <span className="bar__spacer" />
        {tally.combo >= 2 && (
          <span key={tally.combo} className="quiz__combo">
            {tally.combo} れんぞく！
          </span>
        )}
        <span className="bar__score">{tally.score} てん</span>
        {showTimer && <ElapsedTime startedAt={startedAt} />}
      </header>
      {question.type === 'kumi' ? (
        <Kumiawase key={tally.index} question={question} showHint={level === 1} plain={level === 3} onSolved={handleSolved} />
      ) : (
        <Erabi key={tally.index} question={question} onSolved={handleSolved} />
      )}
    </div>
  )
}
