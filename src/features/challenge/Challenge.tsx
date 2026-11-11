import { useCallback, useRef, useState } from 'react'
import { KANJI } from '../../data/kanji'
import { buildQuiz, CHALLENGE_SCOPES, pickChallengeKanji, type ChallengeScope, type Question } from '../../lib/quiz'
import { bestKey, formatTime, LEVELS, QUESTION_COUNTS, questionPoints, type Level } from '../../lib/score'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress } from '../../store/progress'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { ElapsedTime } from './ElapsedTime'

/** レベルが上がるほどヒントが減る: 絵あり → 絵なし → カードの枠もなし */
const LEVEL_CONFIG: Record<Level, { label: string; hint: boolean; plain: boolean }> = {
  1: { label: 'え あり', hint: true, plain: false },
  2: { label: 'え なし', hint: false, plain: false },
  3: { label: 'かたち だけ', hint: false, plain: true },
}

const SCOPE_LABEL: Record<ChallengeScope, string> = {
  mix: 'おすすめ',
  learned: 'おぼえた',
  grade1: '1ねんせい',
  grade2: '2ねんせい',
}

type Phase =
  | { readonly name: 'menu' }
  | {
      readonly name: 'play'
      readonly level: Level
      readonly quiz: readonly Question[]
      readonly index: number
      readonly score: number
      readonly startedAt: number
    }
  | { readonly name: 'result'; readonly level: Level; readonly score: number; readonly timeMs: number; readonly improved: boolean }

type Props = { readonly onHome: () => void }

/** くみあわせ問題を続けて解くミニゲーム兼テスト。問題の数・範囲・ヒントの量をえらべる。 */
export function Challenge({ onHome }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'menu' })
  const bests = useProgress((s) => s.bests)
  const learned = useProgress((s) => s.learned)
  const options = useProgress((s) => s.challenge)
  const setOptions = useProgress((s) => s.setChallengeOptions)
  const showTimer = useProgress((s) => s.settings.timer)
  const finishChallenge = useProgress((s) => s.finishChallenge)
  const { play } = useFeedback()
  // 前の回に出した漢字。次の回はなるべく違う字を出す
  const lastChars = useRef<readonly string[]>([])

  const hasLearned = KANJI.some((k) => k.steps.length > 0 && learned.includes(k.char))
  // 「おぼえた」をえらんでいても、まだ1字も学んでいなければ「おすすめ」で出す
  const scope: ChallengeScope = options.scope === 'learned' && !hasLearned ? 'mix' : options.scope

  const start = (level: Level) => {
    play('tap')
    const picked = pickChallengeKanji(KANJI, learned, options.count, Math.random, lastChars.current, scope)
    lastChars.current = picked.map((k) => k.char)
    const quiz = buildQuiz(picked, options.count, Math.random, KANJI)
    setPhase({ name: 'play', level, quiz, index: 0, score: 0, startedAt: Date.now() })
  }

  const handleSolved = useCallback(
    (mistakes: number) => {
      if (phase.name !== 'play') return
      const score = phase.score + questionPoints(mistakes)
      if (phase.index + 1 < phase.quiz.length) {
        setPhase({ ...phase, index: phase.index + 1, score })
        return
      }
      const timeMs = Date.now() - phase.startedAt
      const improved = finishChallenge(bestKey(phase.level, phase.quiz.length), { score, timeMs })
      play('fanfare')
      setPhase({ name: 'result', level: phase.level, score, timeMs, improved })
    },
    [phase, finishChallenge, play],
  )

  return (
    <div className="screen challenge">
      <header className="bar">
        <button type="button" className="btn" onClick={onHome}>
          ← ずかん
        </button>
        {phase.name === 'play' && (
          <>
            <span className="bar__step">
              {phase.index + 1} / {phase.quiz.length}
            </span>
            <span className="bar__score">{phase.score} てん</span>
            {showTimer && <ElapsedTime startedAt={phase.startedAt} />}
          </>
        )}
      </header>

      {phase.name === 'menu' && (
        <div className="challenge__menu">
          <h1>チャレンジ</h1>
          <div className="challenge__option" role="group" aria-label="もんだいの かず">
            <span className="challenge__option-label">かず</span>
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                className={`btn chip ${options.count === count ? 'is-selected' : ''}`}
                aria-pressed={options.count === count}
                onClick={() => setOptions({ count })}
              >
                {count}もん
              </button>
            ))}
          </div>
          <div className="challenge__option" role="group" aria-label="はんい">
            <span className="challenge__option-label">はんい</span>
            {CHALLENGE_SCOPES.map((value) => (
              <button
                key={value}
                type="button"
                className={`btn chip ${scope === value ? 'is-selected' : ''}`}
                aria-pressed={scope === value}
                disabled={value === 'learned' && !hasLearned}
                onClick={() => setOptions({ scope: value })}
              >
                {SCOPE_LABEL[value]}
              </button>
            ))}
          </div>
          <div className="challenge__levels">
            {LEVELS.map((level) => {
              const best = bests[bestKey(level, options.count)]
              return (
                <button key={level} type="button" className="level-card" onClick={() => start(level)}>
                  <span className="level-card__stars">{'★'.repeat(level)}</span>
                  <span className="level-card__label">{LEVEL_CONFIG[level].label}</span>
                  <span className="level-card__best">
                    {best ? `ベスト ${best.score}てん ${formatTime(best.timeMs)}` : 'まだ やってないよ'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase.name === 'play' && (
        <Kumiawase
          key={phase.index}
          question={phase.quiz[phase.index]}
          showHint={LEVEL_CONFIG[phase.level].hint}
          plain={LEVEL_CONFIG[phase.level].plain}
          onSolved={handleSolved}
        />
      )}

      {phase.name === 'result' && (
        <div className="challenge__result">
          <h1>{phase.improved ? 'じこベスト！' : 'クリア！'}</h1>
          <p className="challenge__score">{phase.score} てん</p>
          <p className="challenge__time">タイム {formatTime(phase.timeMs)}</p>
          <div className="challenge__actions">
            <button type="button" className="btn btn--primary btn--big" onClick={() => start(phase.level)}>
              もういっかい
            </button>
            <button type="button" className="btn btn--big" onClick={() => setPhase({ name: 'menu' })}>
              えらびなおす
            </button>
            <button type="button" className="btn btn--big" onClick={onHome}>
              ずかんへ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
