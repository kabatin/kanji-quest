import { useCallback, useState } from 'react'
import { Burst } from '../../components/Burst'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { MascotSays } from '../../components/MascotSays'
import { MiniIcon } from '../../components/MiniIcon'
import { getKanji } from '../../data/kanji'
import type { BossQuestion } from '../../lib/boss'
import { useFeedback } from '../../lib/useFeedback'
import { buildWeakQuestions, WEAK_SIZE, weakChars, weakOutcome } from '../../lib/weak'
import { useProgress, type Gain } from '../../store/progress'
import { QuestionView } from '../boss/QuestionView'

type Phase =
  | { readonly name: 'intro' }
  | { readonly name: 'play'; readonly questions: readonly BossQuestion[]; readonly mistakes: readonly number[] }
  | { readonly name: 'result'; readonly right: readonly string[]; readonly wrong: readonly string[]; readonly gain: Gain }

type Props = {
  readonly onBack: () => void
  /** 字を もういちど学ぶ */
  readonly onOpen: (char: string) => void
}

const ROUND_LABEL = { model: 'みて かく', blind: 'みないで かく' } as const

/**
 * にがて れんしゅう。ボスや ふくしゅう で まちがえた字を、見て書く → 見ないで書く の順に れんしゅう する。
 * 2回とも まちがえずに書けた字は、苦手の回数が1つ へる。まちがえても、回数は ふえない(何回でも やりなおせる)。
 */
export function WeakScreen({ onBack, onOpen }: Props) {
  const misses = useProgress((s) => s.misses)
  const learned = useProgress((s) => s.learned)
  const finishWeak = useProgress((s) => s.finishWeak)
  const { play } = useFeedback()
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const weak = weakChars(misses, learned)

  const start = () => {
    play('tap')
    setPhase({ name: 'play', questions: buildWeakQuestions(weak.slice(0, WEAK_SIZE).map(getKanji)), mistakes: [] })
  }

  const handleSolved = useCallback(
    (count: number) => {
      if (phase.name !== 'play') return
      const mistakes = [...phase.mistakes, count]
      if (mistakes.length < phase.questions.length) {
        play(count === 0 ? 'hit' : 'miss')
        setPhase({ ...phase, mistakes })
        return
      }
      const outcome = weakOutcome(phase.questions, mistakes)
      const gain = finishWeak(outcome)
      play('fanfare')
      setPhase({ name: 'result', ...outcome, gain })
    },
    [phase, play, finishWeak],
  )

  if (phase.name === 'play') {
    const index = phase.mistakes.length
    const question = phase.questions[index]
    const round = question.type === 'write' && !question.model ? 'blind' : 'model'
    return (
      <div className="screen review-run" data-kanji={question.kanji.char} data-type={question.type} data-round={round}>
        <header className="bar">
          <button type="button" className="btn btn--back" onClick={() => setPhase({ name: 'intro' })}>
            ← やめる
          </button>
          <h1 className="bar__title">にがて れんしゅう</h1>
          <span className="quiz__pips" role="img" aria-label={`${index + 1} / ${phase.questions.length}`}>
            {phase.questions.map((_, i) => (
              <span key={i} className={i < index ? (phase.mistakes[i] === 0 ? 'is-done' : 'is-miss') : i === index ? 'is-now' : ''} />
            ))}
          </span>
          <span className="bar__spacer" />
          <span className="boss-run__round">{ROUND_LABEL[round]}</span>
          <span className="bar__step">
            {index + 1} / {phase.questions.length}
          </span>
        </header>
        <QuestionView key={index} question={question} onSolved={handleSolved} />
      </div>
    )
  }

  if (phase.name === 'result') {
    const perfect = phase.wrong.length === 0
    const rest = weak.length
    return (
      <div className="screen review-result">
        {perfect && <Burst />}
        <div className="review-result__main">
          <MascotSays text={perfect ? 'ぜんぶ {書|か}けたね！ すごい！' : 'がんばったね！ もう いちど やれば きっと {書|か}けるよ'} className="review-result__cheer" />
          <h1 className="review-result__title">{perfect ? 'にがてを やっつけた！' : 'れんしゅう おしまい！'}</h1>
          <ul className="gains">
            <li className="gains__xp">けいけんち ＋{phase.gain.xp}</li>
            {phase.gain.coins > 0 && (
              <li className="gains__coin">
                <span className="coin" aria-hidden="true" /> ＋{phase.gain.coins}
              </li>
            )}
            {phase.gain.levelAfter > phase.gain.levelBefore && <li className="gains__level">レベル {phase.gain.levelAfter} に アップ！</li>}
          </ul>
        </div>
        <div className="review-result__side">
          <ul className="review-list" aria-label="けっか">
            {[...phase.right, ...phase.wrong].map((char) => {
              const ok = phase.right.includes(char)
              return (
                <li key={char} className={`review-item ${ok ? 'is-ok' : 'is-miss'}`}>
                  <button type="button" className="review-item__char" onClick={() => onOpen(char)} aria-label={`${char} を みなおす`}>
                    {char}
                  </button>
                  <span className="review-item__mark" aria-label={ok ? 'できた' : 'もういちど'}>
                    {ok ? '◯' : '△'}
                  </span>
                  <span className="review-item__next">{ok ? ((misses[char] ?? 0) > 0 ? 'あと すこし！' : 'もう にがて じゃない！') : 'また れんしゅう しよう'}</span>
                </li>
              )
            })}
          </ul>
          <div className="review-result__actions">
            {rest > 0 && (
              <button type="button" className="btn btn--primary btn--big" onClick={() => setPhase({ name: 'intro' })}>
                つづけて れんしゅう
              </button>
            )}
            <button type="button" className={rest > 0 ? 'btn' : 'btn btn--primary btn--big'} onClick={onBack}>
              もどる
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen review weak">
      <TopBar onBack={onBack} backLabel="もどる" title="にがて れんしゅう" />
      <div className="review__body">
        <div className="review__hero">
          <MiniIcon name="mato" className="review__icon" />
          {weak.length > 0 ? (
            <>
              <p className="review__count">
                <strong>{weak.length}</strong> <KText text="{字|じ}" />
              </p>
              <p className="review__lead">まちがえた かんじを、ここで れんしゅう しよう。なんかい やっても だいじょうぶ！</p>
              <div className="review__chars weak__chars" aria-label="れんしゅう する かんじ">
                {weak.slice(0, WEAK_SIZE).map((char) => (
                  <span key={char}>{char}</span>
                ))}
              </div>
              <button type="button" className="btn btn--primary btn--big" onClick={start}>
                はじめる（{Math.min(weak.length, WEAK_SIZE)}じ）
              </button>
            </>
          ) : (
            <>
              <p className="review__done">にがてな かんじは ないよ！</p>
              <p className="review__lead">ボスや ふくしゅう で まちがえた かんじが、ここに でてくるよ</p>
            </>
          )}
        </div>
        <ul className="review__how">
          <li>
            <span className="review__how-step">1</span>みほんを みて かく
          </li>
          <li>
            <span className="review__how-step">2</span>みほん なしで かく
          </li>
          <li className="review__how-goal">2かい とも かけたら、にがてが 1つ へるよ</li>
        </ul>
      </div>
    </div>
  )
}
