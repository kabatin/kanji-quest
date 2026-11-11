import { Fragment } from 'react'
import { KanjiGlyph, type GlyphLayer } from '../../components/KanjiGlyph'
import { PartIcon } from '../../components/PartIcon'
import { getPart } from '../../data/parts'
import type { Kanji } from '../../data/schema'
import { fullGlyph } from '../../data/strokes'
import { getNarration } from '../../data/narration'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'
import { Nakama } from '../nakama/Nakama'

type Props = {
  readonly kanji: Kanji
  readonly gained: number
  readonly showHint: boolean
  readonly onOpen: (char: string) => void
  readonly onHome: () => void
}

/** できあがった漢字を、部位ごとに色分けして描くための層を作る。 */
function resultLayers(kanji: Kanji): GlyphLayer[] {
  const last = kanji.steps[kanji.steps.length - 1]
  if (!last) return [{ glyph: fullGlyph(kanji.char), tone: 'imi' }]
  return [
    { glyph: last.fixedGlyph, tone: getPart(last.fixed).kind },
    { glyph: last.answerGlyph, tone: getPart(last.answer).kind },
  ]
}

/** 学び終えた画面: 色分けした漢字、「絵 + 絵 = 絵」の式、読み、なかま。 */
export function KanjiResult({ kanji, gained, showHint, onOpen, onHome }: Props) {
  const { say } = useFeedback()
  const last = kanji.steps[kanji.steps.length - 1]
  const equation = last ? [getPart(last.fixed), getPart(last.answer)] : []

  return (
    <div className="result">
      <div className="result__main">
        <button type="button" className="result__kanji" onClick={() => say(voiceId.word(kanji.char), kanji.yomi)} aria-label={`${kanji.yomi} を きく`}>
          <KanjiGlyph layers={resultLayers(kanji)} label={kanji.char} />
          <span className="result__yomi">🔊 {kanji.yomi}</span>
        </button>
        {showHint && (
          <div className="result__equation" data-testid="equation">
            {equation.map((part, i) => (
              <Fragment key={`${part.id}-${i}`}>
                {i > 0 && <span className="result__op">＋</span>}
                <span className={`result__term result__term--${part.kind}`}>
                  {part.icon ? <PartIcon id={part.icon} /> : <span className="result__oto">♪</span>}
                  <small>{part.label}</small>
                </span>
              </Fragment>
            ))}
            {equation.length > 0 && <span className="result__op">＝</span>}
            <span className="result__term result__term--answer">
              <PartIcon id={kanji.icon} />
              <small>{kanji.yomi}</small>
            </span>
          </div>
        )}
        <button
          type="button"
          className="result__explain"
          onClick={() => say(voiceId.explain(kanji.char), kanji.yomi)}
          aria-label="せつめい を きく"
        >
          <span aria-hidden="true">🔊</span>
          {getNarration(kanji.char).caption}
        </button>
        <p className="result__points">＋{gained} ポイント</p>
      </div>
      <div className="result__side">
        <Nakama kanji={kanji} onOpen={onOpen} />
        <button type="button" className="btn btn--primary btn--big" onClick={onHome}>
          ずかんへ
        </button>
      </div>
    </div>
  )
}
