import { useCallback, useEffect, useState } from 'react'
import type { BossDef, BossQuestion } from '../../lib/boss'
import { useFeedback } from '../../lib/useFeedback'
import { BossMonster, type BossMood } from './BossMonster'
import { hitLabel, roundOf } from '../../lib/boss'
import { QuestionView } from './QuestionView'

/** こうげきが当たった・よけられた の顔を見せておく時間 */
const MOOD_MS = 1000

export type BossOutcome = {
  /** まちがえずに できた問題の数 */
  readonly perfect: number
  readonly total: number
  /** まちがえた問題の漢字(かさなりなし) */
  readonly missed: readonly string[]
  /** まちがえずに できた漢字(まちがえた字は ふくまない) */
  readonly solved: readonly string[]
}

type Tally = {
  readonly index: number
  readonly perfect: number
  readonly missed: readonly string[]
  /** つづけて まちがえずに できた数(えんしゅつ に使う) */
  readonly streak: number
}

const START: Tally = { index: 0, perfect: 0, missed: [], streak: 0 }

const ROUND_LABEL: Record<string, string> = { select: 'えらぶ', model: 'みて かく', blind: 'みないで かく' }

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
        streak: isPerfect ? tally.streak + 1 : 0,
      }
      play(isPerfect ? 'hit' : 'miss')
      if (next.index >= total) {
        const solved = [...new Set(questions.map((q) => q.kanji.char))].filter((c) => !next.missed.includes(c))
        onFinish({ perfect: next.perfect, total, missed: next.missed, solved })
        return
      }
      setMood(isPerfect ? 'hit' : 'phew')
      setTally(next)
    },
    [tally, question, questions, total, play, onFinish],
  )

  return (
    <div className="screen boss-run" data-kanji={question.kanji.char} data-type={question.type} data-round={roundOf(question)} data-mood={mood}>
      <header className="bar boss-run__bar">
        <button type="button" className="btn btn--back" onClick={onQuit}>
          ← やめる
        </button>
        <span className="boss-run__foe">
          <BossMonster seed={boss.seed} king={boss.kind === 'exam'} mood={mood} className="boss-run__monster" label={boss.name} />
          {/* こうげきが当たったときの、墨の しぶき */}
          {mood === 'hit' && <span key={tally.index} className="boss-splash" aria-hidden="true" />}
          {mood === 'phew' && (
            <span key={tally.index} className="boss-run__phew" aria-hidden="true">
              あぶなかった〜
            </span>
          )}
        </span>
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
      {mood !== 'idle' && (
        <p key={`banner-${tally.index}`} className={`boss-banner boss-banner--${mood}`} aria-hidden="true">
          {mood === 'hit' ? hitLabel(tally.streak) : 'おしい！ よけられた'}
        </p>
      )}
      <QuestionView key={tally.index} question={question} onSolved={handleSolved} />
    </div>
  )
}
