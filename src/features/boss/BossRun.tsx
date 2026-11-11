import { useCallback, useEffect, useState } from 'react'
import type { BossDef, BossQuestion } from '../../lib/boss'
import { useFeedback } from '../../lib/useFeedback'
import { Kaku } from '../kaku/Kaku'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { Erabi } from '../quiz/Erabi'
import { BossMonster, type BossMood } from './BossMonster'
import { PartsPick } from './PartsPick'

/** こうげきが当たった・よけられた の顔を見せておく時間 */
const MOOD_MS = 1000

export type BossOutcome = {
  /** まちがえずに できた問題の数 */
  readonly perfect: number
  readonly total: number
  /** まちがえた問題の漢字(かさなりなし) */
  readonly missed: readonly string[]
}

type Tally = { readonly index: number; readonly perfect: number; readonly missed: readonly string[] }

const START: Tally = { index: 0, perfect: 0, missed: [] }

const ROUND_LABEL: Record<string, string> = { select: 'えらぶ', model: 'みて かく', blind: 'みないで かく' }

function roundOf(question: BossQuestion): string {
  if (question.type !== 'write') return 'select'
  return question.model ? 'model' : 'blind'
}

type Props = {
  readonly boss: BossDef
  readonly questions: readonly BossQuestion[]
  readonly onQuit: () => void
  readonly onFinish: (outcome: BossOutcome) => void
}

/**
 * ボスとの たたかい。問題を まちがえずに とくと、ボスの HP が1つ へる。
 * まちがえた問題では HP が へらないので、全部できたときだけ HP が 0 になる(= 100点)。
 */
export function BossRun({ boss, questions, onQuit, onFinish }: Props) {
  const [tally, setTally] = useState<Tally>(START)
  const [mood, setMood] = useState<BossMood>('idle')
  const { play } = useFeedback()
  const question = questions[tally.index]
  const total = questions.length
  const hp = total - tally.perfect

  useEffect(() => {
    if (mood === 'idle') return
    const timer = setTimeout(() => setMood('idle'), MOOD_MS)
    return () => clearTimeout(timer)
  }, [mood, tally.index])

  const handleSolved = useCallback(
    (mistakes: number) => {
      const isPerfect = mistakes === 0
      const char = question.kanji.char
      const next: Tally = {
        index: tally.index + 1,
        perfect: tally.perfect + (isPerfect ? 1 : 0),
        missed: isPerfect || tally.missed.includes(char) ? tally.missed : [...tally.missed, char],
      }
      play(isPerfect ? 'hit' : 'miss')
      if (next.index >= total) {
        onFinish({ perfect: next.perfect, total, missed: next.missed })
        return
      }
      setMood(isPerfect ? 'hit' : 'laugh')
      setTally(next)
    },
    [tally, question, total, play, onFinish],
  )

  return (
    <div className="screen boss-run" data-kanji={question.kanji.char} data-type={question.type} data-round={roundOf(question)}>
      <header className="bar boss-run__bar">
        <button type="button" className="btn btn--back" onClick={onQuit}>
          ← やめる
        </button>
        <BossMonster seed={boss.seed} king={boss.kind === 'exam'} mood={mood} className="boss-run__monster" label={boss.name} />
        <div className="boss-hp" role="progressbar" aria-label="ボスの HP" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hp}>
          <span className="boss-hp__name">{boss.name}</span>
          <span className="boss-hp__bar">
            <span style={{ width: `${(hp / total) * 100}%` }} />
          </span>
          <span className="boss-hp__num">
            HP {hp} / {total}
          </span>
        </div>
        <span className="boss-run__round">{ROUND_LABEL[roundOf(question)]}</span>
        <span className="bar__step">
          {tally.index + 1} / {total}
        </span>
      </header>
      {question.type === 'kumi' && <Kumiawase key={tally.index} question={question} showHint={false} onSolved={handleSolved} />}
      {question.type === 'parts' && <PartsPick key={tally.index} question={question} onSolved={handleSolved} />}
      {question.type === 'erabi' && <Erabi key={tally.index} question={question} onSolved={handleSolved} />}
      {question.type === 'write' && (
        <Kaku key={tally.index} kanji={question.kanji} strokes={question.strokes} given={question.given} model={question.model} strict onDone={handleSolved} />
      )}
    </div>
  )
}
