import { useEffect, useState } from 'react'
import { PartCard, type CardState } from '../../components/PartCard'
import { PartIcon } from '../../components/PartIcon'
import { getPart } from '../../data/parts'
import type { PartsQuestion } from '../../lib/boss'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'

/** 全部えらびおわってから次へ進むまでの時間 */
export const PARTS_DONE_MS = 900

type Props = {
  readonly question: PartsQuestion
  /** 全部えらびおわったときに、まちがえた回数つきで呼ばれる */
  readonly onSolved: (mistakes: number) => void
}

/** その漢字を作っている部位を、6枚の中から全部えらぶ。 */
export function PartsPick({ question, onSolved }: Props) {
  const { kanji, answers } = question
  const { play, say } = useFeedback()
  const [picked, setPicked] = useState<readonly string[]>([])
  const [wrong, setWrong] = useState<readonly string[]>([])
  const clip = voiceId.word(kanji.char)
  const solved = picked.length >= answers.length
  const mistakes = wrong.length

  useEffect(() => {
    say(clip, kanji.yomi)
  }, [say, clip, kanji.yomi])

  useEffect(() => {
    if (!solved) return
    const timer = setTimeout(() => onSolved(mistakes), PARTS_DONE_MS)
    return () => clearTimeout(timer)
  }, [solved, mistakes, onSolved])

  const choose = (partId: string) => {
    if (answers.some((a) => a.id === partId)) {
      play(picked.length + 1 >= answers.length ? 'ok' : 'tap')
      setPicked((prev) => [...prev, partId])
      return
    }
    play('retry')
    setWrong((prev) => [...prev, partId])
  }

  const cardState = (partId: string): CardState => (picked.includes(partId) ? 'right' : wrong.includes(partId) ? 'wrong' : 'idle')

  return (
    <div className="parts-pick">
      <button type="button" className="kumi__goal" onClick={() => say(clip, kanji.yomi)} aria-label={`${kanji.yomi} の パーツを ぜんぶ えらぼう`}>
        <PartIcon id={kanji.icon} className="kumi__goal-icon" />
        <span className="kumi__goal-label">{kanji.yomi}</span>
        <span className="kumi__goal-text">の パーツを ぜんぶ えらぼう 🔊</span>
      </button>
      <p className="parts-pick__count" aria-live="polite">
        {picked.length} / {answers.length}
      </p>
      <div className="parts-pick__choices">
        {question.choices.map((partId) => (
          <PartCard
            key={partId}
            part={getPart(partId)}
            glyph={answers.find((a) => a.id === partId)?.glyph}
            showHint={false}
            state={solved && !picked.includes(partId) ? 'wrong' : cardState(partId)}
            onSelect={() => choose(partId)}
          />
        ))}
      </div>
      <p className="kumi__retry" aria-live="polite">
        {mistakes > 0 && !solved ? 'ちがう パーツも あるよ' : ''}
      </p>
    </div>
  )
}
