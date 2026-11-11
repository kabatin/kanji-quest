import { useRef, useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { KANJI } from '../../data/kanji'
import { buildQuiz, CHALLENGE_SCOPES, pickChallengeKanji, type ChallengeScope, type Question } from '../../lib/quiz'
import type { QuizSummary } from '../../lib/rewards'
import { bestKey, formatTime, LEVELS, QUESTION_COUNTS, type Level } from '../../lib/score'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress, type QuizGain } from '../../store/progress'
import { QuizResult } from '../quiz/QuizResult'
import { QuizRun } from '../quiz/QuizRun'

/** レベルが上がるほどヒントが減る: 絵あり → 絵なし → カードの枠もなし */
const LEVEL_LABEL: Record<Level, string> = { 1: '{絵|え} あり', 2: '{絵|え} なし', 3: '{形|かたち} だけ' }

const SCOPE_LABEL: Record<ChallengeScope, string> = {
  mix: 'おすすめ',
  learned: 'おぼえた',
  grade1: '{1年生|1ねんせい}',
  grade2: '{2年生|2ねんせい}',
}

type Phase =
  | { readonly name: 'menu' }
  | { readonly name: 'play'; readonly level: Level; readonly quiz: readonly Question[]; readonly run: number }
  | { readonly name: 'result'; readonly level: Level; readonly summary: QuizSummary; readonly gain: QuizGain }

type Props = { readonly onHome: () => void }

/** すきな数・範囲・ヒントの量でクイズに挑戦する。 */
export function Challenge({ onHome }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'menu' })
  const bests = useProgress((s) => s.bests)
  const learned = useProgress((s) => s.learned)
  const options = useProgress((s) => s.challenge)
  const setOptions = useProgress((s) => s.setChallengeOptions)
  const finishQuiz = useProgress((s) => s.finishQuiz)
  const { play } = useFeedback()
  // 前の回に出した漢字。次の回はなるべく違う字を出す
  const lastChars = useRef<readonly string[]>([])
  const runCount = useRef(0)

  const hasLearned = learned.length > 0
  // 「おぼえた」をえらんでいても、まだ1字も学んでいなければ「おすすめ」で出す
  const scope: ChallengeScope = options.scope === 'learned' && !hasLearned ? 'mix' : options.scope

  const start = (level: Level) => {
    play('tap')
    const picked = pickChallengeKanji(KANJI, learned, options.count, Math.random, lastChars.current, scope)
    lastChars.current = picked.map((k) => k.char)
    runCount.current += 1
    setPhase({ name: 'play', level, quiz: buildQuiz(picked, Math.random, KANJI), run: runCount.current })
  }

  if (phase.name === 'play') {
    const { level, quiz } = phase
    return (
      <QuizRun
        key={phase.run}
        questions={quiz}
        level={level}
        onQuit={() => setPhase({ name: 'menu' })}
        onFinish={(summary) => {
          const gain = finishQuiz(summary, { level, bestKey: bestKey(level, quiz.length) })
          play('fanfare')
          setPhase({ name: 'result', level, summary, gain })
        }}
      />
    )
  }

  if (phase.name === 'result') {
    return (
      <QuizResult summary={phase.summary} gain={phase.gain}>
        <button type="button" className="btn btn--primary btn--big" onClick={() => start(phase.level)}>
          <KText text="もう{一回|いっかい}" />
        </button>
        <button type="button" className="btn" onClick={() => setPhase({ name: 'menu' })}>
          えらびなおす
        </button>
        <button type="button" className="btn" onClick={onHome}>
          ホームへ
        </button>
      </QuizResult>
    )
  }

  return (
    <div className="screen challenge">
      <TopBar onBack={onHome} backLabel="ホーム" title="チャレンジ" />
      <div className="challenge__menu">
        <div className="challenge__option" role="group" aria-label="もんだいの かず">
          <span className="challenge__option-label">
            <KText text="{数|かず}" />
          </span>
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
              <KText text={SCOPE_LABEL[value]} />
            </button>
          ))}
        </div>
        <div className="challenge__levels">
          {LEVELS.map((level) => {
            const best = bests[bestKey(level, options.count)]
            return (
              <button key={level} type="button" className="level-card" onClick={() => start(level)}>
                <span className="level-card__stars">{'★'.repeat(level)}</span>
                <span className="level-card__label">
                  <KText text={LEVEL_LABEL[level]} />
                </span>
                <span className="level-card__best">
                  {best ? `ベスト ${best.score}てん ${formatTime(best.timeMs)}` : 'まだ やってないよ'}
                </span>
              </button>
            )
          })}
        </div>
        <p className="challenge__note">★★ からは、1かいで せいかいすると「とく」の はんこ が もらえるよ</p>
      </div>
    </div>
  )
}
