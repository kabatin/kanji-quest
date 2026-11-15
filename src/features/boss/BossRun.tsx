import { useCallback, useEffect, useState } from 'react'
import type { BossDef, BossQuestion } from '../../lib/boss'
import { useFeedback } from '../../lib/useFeedback'
import { BossMonster, type BossMood } from './BossMonster'
import { hitLabel, missNotice, REVIVE_MAX_MISSES, reviveLeft, roundOf } from '../../lib/boss'
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
  /** まちがえた問題(ふっかつ戦で、これだけを もう一度出す) */
  readonly missedQuestions: readonly BossQuestion[]
}

type Tally = {
  readonly index: number
  readonly perfect: number
  readonly missed: readonly string[]
  /** まちがえた問題の番号 */
  readonly missedAt: readonly number[]
  /** つづけて まちがえずに できた数(えんしゅつ に使う) */
  readonly streak: number
}

const START: Tally = { index: 0, perfect: 0, missed: [], missedAt: [], streak: 0 }

const ROUND_LABEL: Record<string, string> = { select: 'えらぶ', model: 'みて かく', blind: 'みないで かく' }

type Props = {
  readonly boss: BossDef
  readonly questions: readonly BossQuestion[]
  readonly onQuit: () => void
  readonly onFinish: (outcome: BossOutcome) => void
  /** ふっかつ戦(まちがえた問題だけ。ボスの HP は その数だけ のこっている) */
  readonly revive?: boolean
  /** まちがいの わく(ふっかつ できる回数)を 見せる。ほんばんの 通しの たたかい だけ */
  readonly showLives?: boolean
}

/** ひとことを 出しておく時間 */
const NOTICE_MS = 3200

type Notice = { readonly key: number; readonly text: string }

/** まちがいの わく: 3つ(REVIVE_MAX_MISSES)の中に、まちがえた問題の数だけ × が入る */
function MissLives({ missed }: { readonly missed: number }) {
  const over = missed > REVIVE_MAX_MISSES
  const left = reviveLeft(missed)
  return (
    <span
      className="boss-lives"
      data-over={over || undefined}
      role="img"
      aria-label={over ? 'ふっかつは できません' : `まちがい ${missed}もん。あと ${left}もん まで ふっかつ できます`}
    >
      <span className="boss-lives__label">{over ? 'ふっかつ なし' : 'ふっかつ'}</span>
      {Array.from({ length: REVIVE_MAX_MISSES }, (_, i) => (
        <span key={i} className={i < missed ? 'boss-lives__box is-x' : 'boss-lives__box'} aria-hidden="true">
          {i < missed ? '×' : ''}
        </span>
      ))}
    </span>
  )
}

/**
 * ボスとの たたかい。問題を まちがえずに とくと、ボスの HP が1つ へる。
 * まちがえた問題では HP が へらないので、全部できたときだけ HP が 0 になる(= 100点)。
 */
export function BossRun({ boss, questions, onQuit, onFinish, revive = false, showLives = false }: Props) {
  const [tally, setTally] = useState<Tally>(START)
  const [mood, setMood] = useState<BossMood>('idle')
  const [notice, setNotice] = useState<Notice | null>(null)
  const { play } = useFeedback()
  const question = questions[tally.index]
  const total = questions.length
  const hp = total - tally.perfect

  useEffect(() => {
    if (mood === 'idle') return
    const timer = setTimeout(() => setMood('idle'), MOOD_MS)
    return () => clearTimeout(timer)
  }, [mood, tally.index])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const handleSolved = useCallback(
    (mistakes: number) => {
      const isPerfect = mistakes === 0
      const char = question.kanji.char
      const next: Tally = {
        index: tally.index + 1,
        perfect: tally.perfect + (isPerfect ? 1 : 0),
        missed: isPerfect || tally.missed.includes(char) ? tally.missed : [...tally.missed, char],
        missedAt: isPerfect ? tally.missedAt : [...tally.missedAt, tally.index],
        streak: isPerfect ? tally.streak + 1 : 0,
      }
      play(isPerfect ? 'hit' : 'miss')
      if (next.index >= total) {
        const solved = [...new Set(questions.map((q) => q.kanji.char))].filter((c) => !next.missed.includes(c))
        onFinish({ perfect: next.perfect, total, missed: next.missed, solved, missedQuestions: next.missedAt.map((i) => questions[i]) })
        return
      }
      setMood(isPerfect ? 'hit' : 'phew')
      const text = showLives && !isPerfect ? missNotice(next.missedAt.length) : null
      setNotice(text ? { key: next.index, text } : null)
      setTally(next)
    },
    [tally, question, questions, total, play, onFinish, showLives],
  )

  return (
    <div className="screen boss-run" data-revive={revive || undefined} data-kanji={question.kanji.char} data-type={question.type} data-round={roundOf(question)} data-mood={mood}>
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
        {showLives && <MissLives missed={tally.missedAt.length} />}
        <span className="boss-run__round">{revive ? `ふっかつ: ${ROUND_LABEL[roundOf(question)]}` : ROUND_LABEL[roundOf(question)]}</span>
        <span className="bar__step">
          {tally.index + 1} / {total}
        </span>
      </header>
      {mood !== 'idle' && (
        <p key={`banner-${tally.index}`} className={`boss-banner boss-banner--${mood}`} aria-hidden="true">
          {mood === 'hit' ? hitLabel(tally.streak) : 'おしい！ よけられた'}
        </p>
      )}
      {notice && (
        <p key={`notice-${notice.key}`} className="boss-notice" role="status" data-lives-notice>
          {notice.text}
        </p>
      )}
      <QuestionView key={tally.index} question={question} onSolved={handleSolved} />
    </div>
  )
}
