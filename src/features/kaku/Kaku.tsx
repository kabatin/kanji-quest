import { useEffect, useRef } from 'react'
import type { Kanji } from '../../data/schema'
import { fullGlyph, getStrokes, GLYPH_SIZE } from '../../data/strokes'
import { toPolyline } from '../../lib/strokeGuide'
import { guideParts } from '../../lib/strokeHint'
import { strokeTones } from '../../lib/strokeTones'
import { useFeedback } from '../../lib/useFeedback'
import { useHanded } from '../../lib/useHanded'
import { voiceId } from '../../lib/voice'
import { CompareLayer, ComparePanel } from './KakuCompare'
import { StrokeGuide } from './StrokeGuide'
import { useKakuWriting, type OnWriteDone } from './useKakuWriting'
import { useStrokeInput } from './useStrokeInput'
import { WritingPanel } from './WritingPanel'

export { LEARN_DONE_MS, WRITE_DONE_MS } from './useKakuWriting'

type Props = {
  readonly kanji: Kanji
  /** 書く画(画番号。省くと全部) */
  readonly strokes?: readonly number[]
  /** はじめから書いてある画 */
  readonly given?: readonly number[]
  /** 見本(うすい字)を見せるか */
  readonly model?: boolean
  /**
   * テスト(ボス)の書き方。書き順の番号は出さず、やりなおし・あとで・くらべる もない。
   * まちがえた画は ヒントが出るが、まちがいとして数える。
   */
  readonly strict?: boolean
  /**
   * 書きおわったときに、まちがえた回数と ヒントの きろく(WriteReport)つきで呼ばれる。
   * 2つめの引数は 使わなくてもよい。
   */
  readonly onDone: OnWriteDone
  readonly onSkip?: () => void
}

const GRID = `M${GLYPH_SIZE / 2} 4 V${GLYPH_SIZE - 4} M4 ${GLYPH_SIZE / 2} H${GLYPH_SIZE - 4}`

/**
 * 指・ペン(またはマウス)で、筆順どおりに1画ずつ書く。
 * 合っていれば、その画がお手本の形で部位の色になって確定する。
 * まちがえると わけ を ことばと しるし で見せ、同じ画で まちがえるたびに ヒントを1段ずつ強くする。
 * 見て書く では、書きおわったあと「くらべる」で 自分の線を お手本と かさねて見られる。
 */
export function Kaku({ kanji, strokes: strokeNumbers, given = [], model = true, strict = false, onDone, onSkip }: Props) {
  const allStrokes = getStrokes(fullGlyph(kanji.char))
  const numbers = strokeNumbers ?? allStrokes.map((_, i) => i + 1)
  const targets = numbers.map((n) => allStrokes[n - 1])
  const tones = strokeTones(kanji)
  const { say } = useFeedback()
  const handed = useHanded()
  const svgRef = useRef<SVGSVGElement>(null)
  const writing = useKakuWriting({ targets, strict, onDone })
  const { state, finished, replay } = writing
  const input = useStrokeInput(svgRef, { enabled: !finished, onStroke: writing.handleStroke })
  const next = targets[state.done]
  const sayWord = () => say(voiceId.word(kanji.char), kanji.yomi)

  useEffect(() => {
    if (strict) say(voiceId.word(kanji.char), kanji.yomi)
  }, [strict, say, kanji.char, kanji.yomi])

  const strokeClass = (n: number): string | null => {
    const doneIndex = numbers.indexOf(n)
    if (given.includes(n) || (doneIndex >= 0 && doneIndex < state.done)) return `kaku__stroke kaku__stroke--${tones[n - 1]}`
    return model ? 'kaku__ghost' : null
  }
  // さっき まちがえた線は、次の線を書きはじめるまで うすく のこす
  const missLine = !finished && input.drawing.length === 0 ? state.missLine : null

  return (
    <div className="kaku" data-handed={handed} data-strict={strict} data-model={model} data-finished={finished} data-hint={strict ? state.hint : Math.max(state.hint, 1)} data-compare={replay !== null || undefined}>
      <div className="kaku__board">
        <svg ref={svgRef} className="kaku__svg" viewBox={`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`} role="img" aria-label={`${kanji.yomi} を かく ところ`} data-strokes={numbers.join(',')} {...input.handlers}>
          <path className="kaku__grid" d={GRID} />
          {replay !== null ? (
            <CompareLayer strokes={allStrokes} numbers={numbers} traces={state.traces} round={replay} />
          ) : (
            <>
              {allStrokes.map((stroke, i) => {
                const className = strokeClass(i + 1)
                return className ? <path key={stroke.d} className={className} d={stroke.d} /> : null
              })}
              {missLine && <polyline key={`miss-${state.misses}`} className="kaku__miss" points={toPolyline(missLine)} />}
              {next && <StrokeGuide stroke={next} parts={guideParts(state.hint, state.issue, strict)} number={state.done + 1} round={state.misses} />}
            </>
          )}
          {input.drawing.length > 1 && <polyline className="kaku__drawing" points={toPolyline(input.drawing)} />}
        </svg>
      </div>
      <div className="kaku__side">
        {replay !== null ? (
          <ComparePanel missed={state.traces.filter((t) => t?.missed).length} onReplay={writing.replayAgain} onNext={writing.finish} />
        ) : (
          <WritingPanel
            kanji={kanji}
            strict={strict}
            model={model}
            state={state}
            total={targets.length}
            finished={finished}
            onSay={sayWord}
            onGiveUp={writing.giveUp}
            onModel={writing.showModel}
            onRestart={writing.restart}
            onCompare={writing.startCompare}
            onSkip={onSkip}
          />
        )}
      </div>
    </div>
  )
}
