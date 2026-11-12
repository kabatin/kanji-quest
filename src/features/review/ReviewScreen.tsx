import { useCallback, useState } from 'react'
import { Burst } from '../../components/Burst'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { Mascot } from '../../components/Mascot'
import { MiniIcon } from '../../components/MiniIcon'
import { getKanji, KANJI } from '../../data/kanji'
import type { BossQuestion } from '../../lib/boss'
import { dayKey } from '../../lib/date'
import { levelInfo, mascotStage } from '../../lib/level'
import { buildReviewQuestion, dueChars, isMastered, nextReviewLabel, REVIEW_INTERVALS, REVIEW_SIZE } from '../../lib/review'
import { itemName } from '../../lib/shop'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress, type Gain } from '../../store/progress'
import { QuestionView } from '../boss/QuestionView'

type Outcome = { readonly char: string; readonly ok: boolean }

type Phase =
  | { readonly name: 'intro' }
  | { readonly name: 'play'; readonly questions: readonly BossQuestion[]; readonly index: number; readonly outcomes: readonly Outcome[] }
  | { readonly name: 'result'; readonly outcomes: readonly Outcome[]; readonly gain: Gain }

type Props = { readonly onHome: () => void; readonly onOpen: (char: string) => void }

/** ふくしゅう の すすみぐあい(1回目〜おぼえきった)を 点で見せる。 */
function StepDots({ step }: { readonly step: number }) {
  return (
    <span className="review-dots" role="img" aria-label={`${Math.min(step, REVIEW_INTERVALS.length)} / ${REVIEW_INTERVALS.length}`}>
      {REVIEW_INTERVALS.map((_, i) => (
        <span key={i} className={i < step ? 'is-on' : ''} />
      ))}
    </span>
  )
}

/**
 * きょうの ふくしゅう。覚えた字を、間をあけて もう一度とく。
 * 1回で できた字は 次は もっと先に、まちがえた字は あしたに また出る。
 */
export function ReviewScreen({ onHome, onOpen }: Props) {
  const reviews = useProgress((s) => s.reviews)
  const misses = useProgress((s) => s.misses)
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  const finishReview = useProgress((s) => s.finishReview)
  const { play } = useFeedback()
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const today = dayKey()
  const due = dueChars(reviews, today, misses)
  const mastered = Object.values(reviews).filter(isMastered).length

  const start = () => {
    play('tap')
    const chars = due.slice(0, REVIEW_SIZE)
    setPhase({ name: 'play', questions: chars.map((char) => buildReviewQuestion(getKanji(char), reviews[char], KANJI)), index: 0, outcomes: [] })
  }

  const handleSolved = useCallback(
    (mistakes: number) => {
      if (phase.name !== 'play') return
      const outcomes = [...phase.outcomes, { char: phase.questions[phase.index].kanji.char, ok: mistakes === 0 }]
      if (phase.index + 1 < phase.questions.length) {
        play(mistakes === 0 ? 'hit' : 'miss')
        setPhase({ ...phase, index: phase.index + 1, outcomes })
        return
      }
      const gain = finishReview({ right: outcomes.filter((o) => o.ok).map((o) => o.char), wrong: outcomes.filter((o) => !o.ok).map((o) => o.char) })
      play('fanfare')
      setPhase({ name: 'result', outcomes, gain })
    },
    [phase, play, finishReview],
  )

  if (phase.name === 'play') {
    const question = phase.questions[phase.index]
    return (
      <div className="screen review-run" data-kanji={question.kanji.char} data-type={question.type}>
        <header className="bar">
          <button type="button" className="btn btn--back" onClick={() => setPhase({ name: 'intro' })}>
            ← やめる
          </button>
          <h1 className="bar__title">ふくしゅう</h1>
          <span className="quiz__pips" role="img" aria-label={`${phase.index + 1} / ${phase.questions.length}`}>
            {phase.questions.map((q, i) => (
              <span key={q.kanji.char} className={i < phase.index ? (phase.outcomes[i]?.ok ? 'is-done' : 'is-miss') : i === phase.index ? 'is-now' : ''} />
            ))}
          </span>
          <span className="bar__spacer" />
          <span className="bar__step">
            {phase.index + 1} / {phase.questions.length}
          </span>
        </header>
        <QuestionView key={phase.index} question={question} onSolved={handleSolved} />
      </div>
    )
  }

  if (phase.name === 'result') {
    const reviewsNow = useProgress.getState().reviews
    const perfect = phase.outcomes.every((o) => o.ok)
    return (
      <div className="screen review-result">
        {perfect && <Burst />}
        <div className="review-result__main">
          <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} happy className="review-result__mascot" />
          <h1 className="review-result__title">{perfect ? 'ぜんぶ おぼえてた！' : 'ふくしゅう おしまい！'}</h1>
          <ul className="gains">
            <li className="gains__xp">けいけんち ＋{phase.gain.xp}</li>
            <li className="gains__coin">
              <span className="coin" aria-hidden="true" /> ＋{phase.gain.coins}
            </li>
            {phase.gain.levelAfter > phase.gain.levelBefore && <li className="gains__level">レベル {phase.gain.levelAfter} に アップ！</li>}
          </ul>
        </div>
        <div className="review-result__side">
          <ul className="review-list" aria-label="けっか">
            {phase.outcomes.map((outcome) => {
              const card = reviewsNow[outcome.char]
              return (
                <li key={outcome.char} className={`review-item ${outcome.ok ? 'is-ok' : 'is-miss'}`}>
                  <button type="button" className="review-item__char" onClick={() => onOpen(outcome.char)} aria-label={`${outcome.char} を みなおす`}>
                    {outcome.char}
                  </button>
                  <span className="review-item__mark" aria-label={outcome.ok ? 'できた' : 'もういちど'}>
                    {outcome.ok ? '◯' : '△'}
                  </span>
                  {card && <StepDots step={card.step} />}
                  <span className="review-item__next">{card ? `つぎは ${nextReviewLabel(card, today)}` : ''}</span>
                </li>
              )
            })}
          </ul>
          <div className="review-result__actions">
            {dueChars(reviewsNow, today).length > 0 && (
              <button type="button" className="btn btn--primary btn--big" onClick={() => setPhase({ name: 'intro' })}>
                つづけて ふくしゅう
              </button>
            )}
            <button type="button" className={dueChars(reviewsNow, today).length > 0 ? 'btn' : 'btn btn--primary btn--big'} onClick={onHome}>
              ホームへ
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen review">
      <TopBar onBack={onHome} backLabel="ホーム" title="きょうの ふくしゅう" />
      <div className="review__body">
        <div className="review__hero">
          <MiniIcon name="kurikaeshi" className="review__icon" />
          {due.length > 0 ? (
            <>
              <p className="review__count">
                <strong>{due.length}</strong> <KText text="{字|じ}" />
              </p>
              <p className="review__lead">まえに おぼえた かんじを、わすれないうちに もういちど！</p>
              <div className="review__chars" aria-label="ふくしゅう する かんじ">
                {due.slice(0, REVIEW_SIZE).map((char) => (
                  <span key={char}>？</span>
                ))}
              </div>
              <button type="button" className="btn btn--primary btn--big" onClick={start}>
                はじめる（{Math.min(due.length, REVIEW_SIZE)}もん）
              </button>
            </>
          ) : (
            <>
              <p className="review__done">きょうの ふくしゅう は おわり！</p>
              <p className="review__lead">あたらしい かんじを おぼえると、あしたから ここに でてくるよ</p>
            </>
          )}
        </div>
        <ul className="review__how">
          <li>
            <span className="review__how-step">1</span>おぼえた つぎの ひ
          </li>
          <li>
            <span className="review__how-step">2</span>3にち ご
          </li>
          <li>
            <span className="review__how-step">3</span>7にち ご
          </li>
          <li>
            <span className="review__how-step">4</span>14にち ご
          </li>
          <li>
            <span className="review__how-step">5</span>30にち ご
          </li>
          <li className="review__how-goal">
            おぼえきった かんじ <strong>{mastered}</strong>
          </li>
        </ul>
      </div>
    </div>
  )
}
