import { useEffect, useState } from 'react'
import { KanjiGlyph, type GlyphLayer } from '../../components/KanjiGlyph'
import { PartCard, type CardState } from '../../components/PartCard'
import { PartIcon } from '../../components/PartIcon'
import { getPart } from '../../data/parts'
import type { Layout } from '../../data/schema'
import { refsViewBox } from '../../data/strokes'
import type { Question } from '../../lib/quiz'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'

/** 合体のアニメーションを見せてから次へ進むまでの時間 */
export const MERGE_MS = 1100

const APART = 34

/** 合体の前に、部位がどちら向きに離れているか */
const MERGE_FROM: Record<Layout, { fixed: { x: number; y: number }; answer: { x: number; y: number } }> = {
  yoko: { fixed: { x: -APART, y: 0 }, answer: { x: APART, y: 0 } },
  tate: { fixed: { x: 0, y: -APART }, answer: { x: 0, y: APART } },
  kakomu: { fixed: { x: 0, y: 0 }, answer: { x: 0, y: APART * 2 } },
}

type Props = {
  readonly question: Question
  /** 絵と名前のヒントを見せるか */
  readonly showHint: boolean
  /** カードの枠をなくすか */
  readonly plain?: boolean
  /** 正解して合体が終わったときに、まちがえた回数つきで呼ばれる */
  readonly onSolved: (mistakes: number) => void
}

/** 固定の部位カード + 4枚の候補カード。正しい1枚を選ぶと合体して漢字になる。 */
export function Kumiawase({ question, showHint, plain = false, onSolved }: Props) {
  const { step, kanji } = question
  const { play, say } = useFeedback()
  const [wrong, setWrong] = useState<readonly string[]>([])
  const [solved, setSolved] = useState(false)

  const fixedPart = getPart(step.fixed)
  const answerPart = getPart(step.answer)
  const frame = refsViewBox([step.fixedGlyph, step.answerGlyph], 14)
  const mistakes = wrong.length
  // 何を作る問題なのか(途中の段階なら、その段階でできる部位)
  const madePart = step.makes ? getPart(step.makes) : undefined
  const goal = { icon: madePart?.icon ?? kanji.icon, label: madePart?.label ?? kanji.yomi }
  const goalLabel = goal.label
  const goalClip = voiceId.goal(kanji.char, question.stepIndex)

  useEffect(() => {
    say(goalClip, goalLabel)
  }, [say, goalClip, goalLabel])

  useEffect(() => {
    if (!solved) return
    const timer = setTimeout(() => onSolved(mistakes), MERGE_MS)
    return () => clearTimeout(timer)
  }, [solved, mistakes, onSolved])

  const choose = (partId: string) => {
    if (partId === step.answer) {
      play('ok')
      setSolved(true)
      return
    }
    play('retry')
    setWrong((prev) => [...prev, partId])
  }

  const cardState = (partId: string): CardState => (wrong.includes(partId) ? 'wrong' : 'idle')

  if (solved) {
    const from = MERGE_FROM[step.layout]
    const layers: GlyphLayer[] = [
      { glyph: step.fixedGlyph, tone: fixedPart.kind, from: from.fixed },
      { glyph: step.answerGlyph, tone: answerPart.kind, from: from.answer },
    ]
    return (
      <div className="kumi kumi--merged" data-testid="merged">
        <KanjiGlyph className="kumi__merged-glyph" layers={layers} viewBox={frame} label="がったい" />
      </div>
    )
  }

  return (
    <div className={`kumi kumi--${step.layout}`}>
      <button type="button" className="kumi__goal" onClick={() => say(goalClip, goalLabel)} aria-label={`${goal.label} を つくろう`}>
        <PartIcon id={goal.icon} className="kumi__goal-icon" />
        <span className="kumi__goal-label">{goal.label}</span>
        <span className="kumi__goal-text">を つくろう 🔊</span>
      </button>
      <div className="kumi__fixed">
        <PartCard part={fixedPart} showHint={showHint} plain={plain}>
          <KanjiGlyph
            layers={[{ glyph: step.fixedGlyph, tone: fixedPart.kind }]}
            viewBox={frame}
            slot={step.answerGlyph}
            label={fixedPart.label}
          />
        </PartCard>
      </div>
      <div className="kumi__plus" aria-hidden="true">
        ＋
      </div>
      <div className="kumi__choices">
        {question.choices.map((partId) => (
          <PartCard
            key={partId}
            part={getPart(partId)}
            // 正解の部位は、この漢字の中での形(へんの細い木など)で見せる
            glyph={partId === step.answer ? step.answerGlyph : undefined}
            showHint={showHint}
            plain={plain}
            state={cardState(partId)}
            onSelect={() => choose(partId)}
          />
        ))}
      </div>
      <p className="kumi__retry" aria-live="polite">
        {mistakes > 0 ? 'もういちど' : ''}
      </p>
    </div>
  )
}
