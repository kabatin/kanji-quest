import type { ReactNode } from 'react'
import { Burst } from '../../components/Burst'
import { Mascot } from '../../components/Mascot'
import { levelInfo, mascotStage } from '../../lib/level'
import { rankOf, type QuizSummary, type Rank } from '../../lib/rewards'
import { formatTime } from '../../lib/score'
import { itemName } from '../../lib/shop'
import { useProgress, type QuizGain } from '../../store/progress'

const RANK_LABEL: Record<Rank, string> = { kanpeki: 'かんぺき', sugoi: 'すごい', dekita: 'できた' }

type Props = {
  readonly summary: QuizSummary
  readonly gain: QuizGain
  /** 下に並べるボタン(もういっかい など) */
  readonly children: ReactNode
}

/** クイズの結果: はんこ のランク、点数、もらえたもの、新しい はんこ、レベルアップ。 */
export function QuizResult({ summary, gain, children }: Props) {
  const rank = rankOf(summary)
  const xp = useProgress((s) => s.xp)
  const hat = useProgress((s) => s.equipped.hat)
  const leveledUp = gain.levelAfter > gain.levelBefore

  return (
    <div className="screen quiz-result" data-rank={rank}>
      {(rank === 'kanpeki' || leveledUp) && <Burst />}
      <div className="quiz-result__main">
        <div className="quiz-result__seal" role="img" aria-label={RANK_LABEL[rank]}>
          {RANK_LABEL[rank]}
        </div>
        <p className="quiz-result__score">{summary.score} てん</p>
        <ul className="quiz-result__facts">
          <li>
            1かいで せいかい {summary.firstTry} / {summary.questionCount}
          </li>
          <li>さいこう {summary.maxCombo} れんぞく</li>
          <li>タイム {formatTime(summary.timeMs)}</li>
          {gain.improved && <li className="quiz-result__best">じこベスト！</li>}
        </ul>
      </div>
      <div className="quiz-result__side">
        <Mascot stage={mascotStage(levelInfo(xp).level)} hat={itemName(hat)} happy className="quiz-result__mascot" />
        <ul className="gains">
          {gain.xp > 0 && <li className="gains__xp">けいけんち ＋{gain.xp}</li>}
          {gain.coins > 0 && (
            <li className="gains__coin">
              <span className="coin" aria-hidden="true" /> ＋{gain.coins}
            </li>
          )}
          {leveledUp && <li className="gains__level">レベル {gain.levelAfter} に アップ！</li>}
          {gain.newStamps.length > 0 && (
            <li className="gains__stamps">
              「とく」の はんこ：<strong>{gain.newStamps.join(' ')}</strong>
            </li>
          )}
        </ul>
        <div className="quiz-result__actions">{children}</div>
      </div>
    </div>
  )
}
