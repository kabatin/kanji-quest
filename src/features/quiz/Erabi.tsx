import { useEffect, useState } from 'react'
import { KanjiGlyph } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { getNarration } from '../../data/narration'
import { fullGlyph } from '../../data/strokes'
import { plainText } from '../../lib/kanjiText'
import type { ErabiQuestion } from '../../lib/quiz'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'

/** 正解を見せてから次へ進むまでの時間 */
export const ERABI_DONE_MS = 800

type Props = {
  readonly question: ErabiQuestion
  /** 正解して少したったときに、まちがえた回数つきで呼ばれる */
  readonly onSolved: (mistakes: number) => void
}

/** 絵と読み(または なりたちの話)を見て(聞いて)、合う漢字を4字からえらぶ。 */
export function Erabi({ question, onSolved }: Props) {
  const { kanji } = question
  const { play, say } = useFeedback()
  const [wrong, setWrong] = useState<readonly string[]>([])
  const [solved, setSolved] = useState(false)
  const mistakes = wrong.length
  const isStory = question.clue === 'story'
  const clip = isStory ? voiceId.explain(kanji.char) : voiceId.word(kanji.char)
  // なりたちの話は、答えの漢字が見えてしまわないよう、ひらがなだけで出す
  const story = isStory ? plainText(getNarration(kanji.char).caption) : ''
  const spoken = isStory ? story : kanji.yomi

  useEffect(() => {
    say(clip, spoken)
  }, [say, clip, spoken])

  useEffect(() => {
    if (!solved) return
    const timer = setTimeout(() => onSolved(mistakes), ERABI_DONE_MS)
    return () => clearTimeout(timer)
  }, [solved, mistakes, onSolved])

  const choose = (char: string) => {
    if (char === kanji.char) {
      play('ok')
      setSolved(true)
      return
    }
    play('retry')
    setWrong((prev) => [...prev, char])
  }

  return (
    <div className="erabi" data-clue={question.clue}>
      {isStory ? (
        <button type="button" className="kumi__goal kumi__goal--story" onClick={() => say(clip, spoken)} aria-label="おはなしを きく">
          <span className="kumi__goal-story">{story}</span>
          <span className="kumi__goal-text">この かんじは どれ？ 🔊</span>
        </button>
      ) : (
        <button type="button" className="kumi__goal" onClick={() => say(clip, spoken)} aria-label={`${kanji.yomi} は どれ`}>
          <PartIcon id={kanji.icon} className="kumi__goal-icon" />
          <span className="kumi__goal-label">{kanji.yomi}</span>
          <span className="kumi__goal-text">は どれ？ 🔊</span>
        </button>
      )}
      <div className="erabi__choices">
        {question.choices.map((char) => {
          const state = solved && char === kanji.char ? 'right' : wrong.includes(char) ? 'wrong' : 'idle'
          return (
            <button
              key={char}
              type="button"
              className={`erabi-card is-${state}`}
              data-kanji={char}
              disabled={solved || state === 'wrong'}
              onClick={() => choose(char)}
              aria-label={char}
            >
              <KanjiGlyph layers={[{ glyph: fullGlyph(char), tone: 'ink' }]} label={char} />
            </button>
          )
        })}
      </div>
      <p className="kumi__retry" aria-live="polite">
        {mistakes > 0 && !solved ? 'もういちど' : ''}
      </p>
    </div>
  )
}
