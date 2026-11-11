import { useCallback, useMemo, useState } from 'react'
import { KANJI } from '../../data/kanji'
import type { Kanji } from '../../data/schema'
import { buildQuestion } from '../../lib/quiz'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'
import { useProgress } from '../../store/progress'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { Naritachi } from '../naritachi/Naritachi'
import { KanjiResult } from './KanjiResult'

type Props = {
  readonly kanji: Kanji
  readonly onOpen: (char: string) => void
  readonly onHome: () => void
}

/** 漢字1字の学習: 単体は「なりたち」、組み合わせは「くみあわせ」を段階ごとに進め、最後に結果を見せる。 */
export function Learn({ kanji, onOpen, onHome }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [gained, setGained] = useState<number | null>(null)
  const showHint = useProgress((s) => s.settings.icons)
  const completeKanji = useProgress((s) => s.completeKanji)
  const { play, say } = useFeedback()

  const questions = useMemo(() => kanji.steps.map((_, i) => buildQuestion(kanji, i, KANJI)), [kanji])

  const finish = useCallback(() => {
    setGained(completeKanji(kanji.char))
    play('fanfare')
    // できあがったら、成り立ちの説明を声で聞かせる
    say(voiceId.explain(kanji.char), kanji.yomi)
  }, [completeKanji, kanji, play, say])

  const handleSolved = useCallback(() => {
    if (stepIndex + 1 < kanji.steps.length) {
      setStepIndex(stepIndex + 1)
      return
    }
    finish()
  }, [stepIndex, kanji, finish])

  return (
    <div className="screen learn">
      <header className="bar">
        <button type="button" className="btn" onClick={onHome}>
          ← ずかん
        </button>
        {kanji.steps.length > 1 && gained === null && (
          <span className="bar__step">
            {stepIndex + 1} / {kanji.steps.length}
          </span>
        )}
      </header>
      {gained !== null ? (
        <KanjiResult kanji={kanji} gained={gained} showHint={showHint} onOpen={onOpen} onHome={onHome} />
      ) : kanji.steps.length === 0 ? (
        <Naritachi kanji={kanji} onDone={finish} />
      ) : (
        <Kumiawase key={stepIndex} question={questions[stepIndex]} showHint={showHint} onSolved={handleSolved} />
      )}
    </div>
  )
}
