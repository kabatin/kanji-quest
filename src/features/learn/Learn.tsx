import { useCallback, useMemo, useState } from 'react'
import { TopBar } from '../../components/Hud'
import { KText } from '../../components/KText'
import { KANJI } from '../../data/kanji'
import type { Kanji } from '../../data/schema'
import { buildQuestion } from '../../lib/quiz'
import { useFeedback } from '../../lib/useFeedback'
import { useProgress, type LearnGain, type WriteGain } from '../../store/progress'
import { Kaku } from '../kaku/Kaku'
import { Kumiawase } from '../kumiawase/Kumiawase'
import { StoryPlayer } from '../story/StoryPlayer'
import { KanjiResult } from './KanjiResult'

/** 学習の流れ: ものがたり(見る)→ くみあわせ(えらぶ)→ かく(書く)→ けっか */
type Step = { readonly name: 'story' } | { readonly name: 'kumi'; readonly index: number } | { readonly name: 'kaku' } | { readonly name: 'result' }

const STEP_LABELS = [
  { name: 'story', label: 'ものがたり' },
  { name: 'kumi', label: '{組|く}み{合|あ}わせ' },
  { name: 'kaku', label: '{書|か}く' },
] as const

export type NextAction = { readonly label: string; readonly onNext: () => void }

type Props = {
  readonly kanji: Kanji
  readonly onBack: () => void
  readonly backLabel: string
  /** なかまの漢字を開く */
  readonly onOpen: (char: string) => void
  /** おわったあとに いちばん すすめたい行き先(つぎの かんじ、まとめ など) */
  readonly next: NextAction
}

/** 漢字1字の学習。分けられない字は「くみあわせ」をとばす。 */
export function Learn({ kanji, onBack, backLabel, onOpen, next }: Props) {
  const [step, setStep] = useState<Step>({ name: 'story' })
  const [learnGain, setLearnGain] = useState<LearnGain | null>(null)
  const [writeGain, setWriteGain] = useState<WriteGain | null>(null)
  const showHint = useProgress((s) => s.settings.icons)
  const completeKanji = useProgress((s) => s.completeKanji)
  const completeWriting = useProgress((s) => s.completeWriting)
  const { play } = useFeedback()

  const questions = useMemo(() => kanji.steps.map((_, i) => buildQuestion(kanji, i, KANJI)), [kanji])
  const hasKumi = kanji.steps.length > 0
  const labels = STEP_LABELS.filter((s) => hasKumi || s.name !== 'kumi')

  /** 「まなぶ」の はんこ を押して、書く練習へ進む。 */
  const finishLearning = useCallback(() => {
    // ものがたりを見なおして もう一度ここに来たときは、二重に数えない
    if (!learnGain) setLearnGain(completeKanji(kanji.char))
    setStep({ name: 'kaku' })
  }, [learnGain, completeKanji, kanji.char])

  const handleStoryDone = useCallback(() => {
    if (hasKumi) setStep({ name: 'kumi', index: 0 })
    else finishLearning()
  }, [hasKumi, finishLearning])

  const kumiIndex = step.name === 'kumi' ? step.index : 0
  const handleKumiSolved = useCallback(() => {
    if (kumiIndex + 1 < kanji.steps.length) setStep({ name: 'kumi', index: kumiIndex + 1 })
    else finishLearning()
  }, [kumiIndex, kanji.steps.length, finishLearning])

  const showResult = useCallback(() => {
    play('fanfare')
    setStep({ name: 'result' })
  }, [play])

  const handleWritten = useCallback(() => {
    setWriteGain(completeWriting(kanji.char))
    showResult()
  }, [completeWriting, kanji.char, showResult])

  return (
    <div className="screen learn">
      <TopBar onBack={onBack} backLabel={backLabel}>
        {step.name !== 'result' && (
          <ol className="steps" aria-label="すすみぐあい">
            {labels.map((s) => (
              <li key={s.name} className={s.name === step.name ? 'is-now' : ''} aria-current={s.name === step.name ? 'step' : undefined}>
                <KText text={s.label} />
              </li>
            ))}
          </ol>
        )}
      </TopBar>
      {step.name === 'story' && <StoryPlayer kanji={kanji} onDone={handleStoryDone} />}
      {step.name === 'kumi' && (
        <Kumiawase key={step.index} question={questions[step.index]} showHint={showHint} onSolved={handleKumiSolved} />
      )}
      {step.name === 'kaku' && <Kaku kanji={kanji} onDone={handleWritten} onSkip={showResult} />}
      {step.name === 'result' && learnGain && (
        <KanjiResult
          kanji={kanji}
          learnGain={learnGain}
          writeGain={writeGain}
          onOpen={onOpen}
          onWrite={() => setStep({ name: 'kaku' })}
          onStory={() => setStep({ name: 'story' })}
          next={next}
        />
      )}
    </div>
  )
}
