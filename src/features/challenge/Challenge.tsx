import { useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { getKanji, KANJI } from '../../data/kanji'
import { dayKey } from '../../lib/date'
import { challengeLevel, dailyCount, dailyQuiz, isChallengeDone, MIN_LEARNED_FOR_CHALLENGE } from '../../lib/dailyChallenge'
import type { Question } from '../../lib/quiz'
import type { QuizSummary } from '../../lib/rewards'
import { bestKey, formatTime, type Level } from '../../lib/score'
import { useFeedback } from '../../lib/useFeedback'
import { useProfiles } from '../../store/profiles'
import { useProgress, type QuizGain } from '../../store/progress'
import { QuizResult } from '../quiz/QuizResult'
import { QuizRun } from '../quiz/QuizRun'

/** むずかしさが上がるほどヒントが減る: 絵あり → 絵なし → カードの枠もなし */
const LEVEL_LABEL: Record<Level, string> = { 1: '{絵|え} あり', 2: '{絵|え} なし', 3: '{形|かたち} だけ' }

type Phase =
  | { readonly name: 'intro' }
  | { readonly name: 'play'; readonly quiz: readonly Question[]; readonly run: number }
  | { readonly name: 'result'; readonly summary: QuizSummary; readonly gain: QuizGain; readonly firstOfDay: boolean }

type Props = { readonly onHome: () => void }

/** きょうの チャレンジ。出る字と むずかしさは アプリが決める。1日1回、おわったあとは ベストに挑戦できる。 */
export function Challenge({ onHome }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })
  const [runCount, setRunCount] = useState(0)
  const today = dayKey()
  const profileId = useProfiles((s) => s.activeId)
  const challengeDay = useProgress((s) => s.challengeDay)
  const learnedCount = useProgress((s) => s.learned.length)
  const bests = useProgress((s) => s.bests)
  const startChallenge = useProgress((s) => s.startChallenge)
  const finishQuiz = useProgress((s) => s.finishQuiz)
  const { play } = useFeedback()

  const level = challengeLevel(challengeDay, today)
  const done = isChallengeDone(challengeDay, today)

  const start = () => {
    play('tap')
    const chars = startChallenge(profileId, today)
    // 同じ日は、何度ひらいても(もう一回あそんでも)同じ問題
    const quiz = dailyQuiz(chars.map(getKanji), KANJI, `${profileId}:${today}`)
    setRunCount(runCount + 1)
    setPhase({ name: 'play', quiz, run: runCount + 1 })
  }

  if (phase.name === 'play') {
    const { quiz } = phase
    return (
      <QuizRun
        key={phase.run}
        questions={quiz}
        level={level}
        onQuit={() => setPhase({ name: 'intro' })}
        onFinish={(summary) => {
          const firstOfDay = !done
          const gain = finishQuiz(summary, { level, bestKey: bestKey(level, quiz.length), daily: true }, today)
          play('fanfare')
          setPhase({ name: 'result', summary, gain, firstOfDay })
        }}
      />
    )
  }

  if (phase.name === 'result') {
    return (
      <QuizResult summary={phase.summary} gain={phase.gain}>
        {!phase.firstOfDay && <p className="daily__tomorrow">2かいめからは ごほうびは ないよ。ベストに ちょうせんしよう！</p>}
        <p className="daily__tomorrow">あしたも あたらしい チャレンジが あるよ</p>
        <button type="button" className="btn btn--primary btn--big" onClick={onHome}>
          ホームへ
        </button>
        <button type="button" className="btn" onClick={start}>
          <KText text="もう{一回|いっかい}" />
        </button>
      </QuizResult>
    )
  }

  const count = challengeDay.day === today && challengeDay.chars.length > 0 ? challengeDay.chars.length : dailyCount(learnedCount)
  const best = bests[bestKey(level, count)]

  return (
    <div className="screen challenge">
      <TopBar onBack={onHome} backLabel="ホーム" title="きょうの チャレンジ" />
      <div className="daily">
        {learnedCount < MIN_LEARNED_FOR_CHALLENGE ? (
          <p className="daily__note">
            <KText text="まず かんじを 1つ おぼえると、チャレンジが できるよ" />
          </p>
        ) : (
          <>
            <div className="daily__card">
              <span className="daily__stars" aria-label={`むずかしさ ${level}`}>
                {'★'.repeat(level)}
              </span>
              <span className="daily__label">
                <KText text={LEVEL_LABEL[level]} />
              </span>
              <span className="daily__count">{count}もん</span>
              <span className="daily__best">{best ? `ベスト ${best.score}てん ${formatTime(best.timeMs)}` : 'まだ やってないよ'}</span>
              {done && <span className="daily__done">きょうは できたよ！</span>}
            </div>
            <button type="button" className="btn btn--primary btn--big" onClick={start}>
              {done ? 'もういちど ベストに ちょうせん' : 'はじめる'}
            </button>
            <p className="daily__note">
              <KText text={level >= 2 ? '1かいで せいかいすると「とく」の はんこ が もらえるよ' : '★★ に なると、1かいで せいかいして「とく」の はんこ が もらえるよ'} />
            </p>
          </>
        )}
      </div>
    </div>
  )
}
