import { motion } from 'motion/react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Tone } from '../../components/KanjiGlyph'
import { KText } from '../../components/KText'
import { PartIcon } from '../../components/PartIcon'
import { getPart } from '../../data/parts'
import type { Kanji } from '../../data/schema'
import { fullGlyph, getStrokes, GLYPH_SIZE } from '../../data/strokes'
import { judgeStroke, type Point, type StrokeJudge } from '../../lib/strokeMatch'
import { useFeedback } from '../../lib/useFeedback'
import { voiceId } from '../../lib/voice'

/** れんしゅうで、同じ画を何回まちがえたら、お手本を動かして見せるか */
const HINT_AFTER_MISSES = 2
/** 書きおわってから次へ進むまでの間 */
export const WRITE_DONE_MS = 900
/** 線になっていない(点をさわっただけ)とみなす点の数 */
const MIN_POINTS = 3

const NOTE_TEXT: Record<Exclude<StrokeJudge, 'ok'>, string> = {
  order: '{書|か}きじゅんが ちがうよ',
  long: 'せんが ながすぎるよ',
  shape: 'かたちが ちがうよ',
}

/** 画ごとの色: その画が入っている部位の色にする(分けない字は墨色)。 */
function tonesOf(kanji: Kanji): Tone[] {
  const count = fullGlyph(kanji.char).strokes.length
  const last = kanji.steps[kanji.steps.length - 1]
  return Array.from({ length: count }, (_, i) => {
    if (!last) return 'ink'
    return last.fixedGlyph.strokes.includes(i + 1) ? getPart(last.fixed).kind : getPart(last.answer).kind
  })
}

type Props = {
  readonly kanji: Kanji
  /** 書く画(画番号。省くと全部) */
  readonly strokes?: readonly number[]
  /** はじめから書いてある画 */
  readonly given?: readonly number[]
  /** 見本(うすい字)を見せるか */
  readonly model?: boolean
  /**
   * テスト(ボス)の書き方。書き順の番号は出さず、やりなおし・あとで もない。
   * まちがえた画は すぐお手本が出るが、まちがいとして数える。
   */
  readonly strict?: boolean
  /** 書きおわったときに、まちがえた回数つきで呼ばれる */
  readonly onDone: (misses: number) => void
  readonly onSkip?: () => void
}

/**
 * 指(またはマウス)で、筆順どおりに1画ずつ書く。
 * 合っていれば、その画がお手本の形で部位の色になって確定する。
 */
export function Kaku({ kanji, strokes: strokeNumbers, given = [], model = true, strict = false, onDone, onSkip }: Props) {
  const allStrokes = getStrokes(fullGlyph(kanji.char))
  const numbers = strokeNumbers ?? allStrokes.map((_, i) => i + 1)
  const targets = numbers.map((n) => allStrokes[n - 1])
  const tones = tonesOf(kanji)
  const { play, say } = useFeedback()
  const svgRef = useRef<SVGSVGElement>(null)
  const [doneCount, setDoneCount] = useState(0)
  const [misses, setMisses] = useState(0)
  const [missesHere, setMissesHere] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [note, setNote] = useState<Exclude<StrokeJudge, 'ok'> | null>(null)
  const [drawing, setDrawing] = useState<readonly Point[]>([])
  const isDrawing = useRef(false)

  const finished = doneCount >= targets.length
  const next = targets[doneCount]
  const wordClip = voiceId.word(kanji.char)

  useEffect(() => {
    if (strict) say(wordClip, kanji.yomi)
  }, [strict, say, wordClip, kanji.yomi])

  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(() => onDone(misses), WRITE_DONE_MS)
    return () => clearTimeout(timer)
  }, [finished, misses, onDone])

  /** 画面上の位置を、漢字の座標(109 x 109)に直す。 */
  const toPoint = (event: PointerEvent<SVGSVGElement>): Point => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return [event.clientX, event.clientY]
    return [((event.clientX - rect.left) / rect.width) * GLYPH_SIZE, ((event.clientY - rect.top) / rect.height) * GLYPH_SIZE]
  }

  const handleDown = (event: PointerEvent<SVGSVGElement>) => {
    if (finished) return
    isDrawing.current = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDrawing([toPoint(event)])
  }

  const handleMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!isDrawing.current) return
    const point = toPoint(event)
    setDrawing((prev) => [...prev, point])
  }

  const countMiss = (kind: Exclude<StrokeJudge, 'ok'>) => {
    play('retry')
    setMisses(misses + 1)
    setMissesHere(missesHere + 1)
    setNote(kind)
    // テストでは すぐお手本を出す(その問題は もう まちがい になっている)
    if (strict || missesHere + 1 >= HINT_AFTER_MISSES) setShowHint(true)
  }

  const handleUp = () => {
    if (!isDrawing.current || !next) return
    isDrawing.current = false
    const points = drawing
    setDrawing([])
    const judge = judgeStroke(
      points,
      targets.map((t) => t.pts),
      doneCount,
    )
    if (judge === 'ok') {
      play(doneCount + 1 === targets.length ? 'ok' : 'stroke')
      setDoneCount(doneCount + 1)
      setMissesHere(0)
      setShowHint(false)
      setNote(null)
      return
    }
    // 点をさわっただけ(線になっていない)のときは、まちがいに数えない
    if (points.length < MIN_POINTS) return
    countMiss(judge)
  }

  const restart = () => {
    setDoneCount(0)
    setMissesHere(0)
    setShowHint(false)
    setNote(null)
  }

  const giveUp = () => {
    if (showHint) return
    countMiss('shape')
    setNote(null)
  }

  const strokeClass = (n: number): string | null => {
    const doneIndex = numbers.indexOf(n)
    if (given.includes(n) || (doneIndex >= 0 && doneIndex < doneCount)) return `kaku__stroke kaku__stroke--${tones[n - 1]}`
    return model ? 'kaku__ghost' : null
  }

  return (
    <div className="kaku" data-strict={strict} data-model={model} data-finished={finished}>
      <div className="kaku__board">
        <svg
          ref={svgRef}
          className="kaku__svg"
          viewBox={`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`}
          role="img"
          aria-label={`${kanji.yomi} を かく ところ`}
          data-strokes={numbers.join(',')}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          <path className="kaku__grid" d={`M${GLYPH_SIZE / 2} 4 V${GLYPH_SIZE - 4} M4 ${GLYPH_SIZE / 2} H${GLYPH_SIZE - 4}`} />
          {allStrokes.map((stroke, i) => {
            const className = strokeClass(i + 1)
            return className ? <path key={stroke.d} className={className} d={stroke.d} /> : null
          })}
          {next && showHint && (
            <motion.path
              key={`hint-${doneCount}`}
              className="kaku__hint"
              d={next.d}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
            />
          )}
          {next && !strict && (
            <g className="kaku__start">
              <circle cx={next.pts[0][0]} cy={next.pts[0][1]} r="4.5" />
              <text x={next.pts[0][0]} y={next.pts[0][1]} dy="2.4" textAnchor="middle">
                {doneCount + 1}
              </text>
            </g>
          )}
          {drawing.length > 1 && <polyline className="kaku__drawing" points={drawing.map((p) => p.join(',')).join(' ')} />}
        </svg>
      </div>
      <div className="kaku__side">
        {strict && (
          <button type="button" className="kaku__goal" onClick={() => say(wordClip, kanji.yomi)} aria-label={`${kanji.yomi} を きく`}>
            <PartIcon id={kanji.icon} className="kaku__goal-icon" />
            <span className="kaku__goal-label">{kanji.yomi} 🔊</span>
          </button>
        )}
        <p className="kaku__lead">
          <KText text={finished ? '{書|か}けた！' : strict ? (model ? 'じゅんばんどおりに {書|か}こう' : '{見本|みほん} なしで {書|か}こう') : 'ゆびで なぞって {書|か}こう'} />
        </p>
        <p className="kaku__count" aria-live="polite">
          {Math.min(doneCount, targets.length)} / {targets.length} かく
        </p>
        <p className="kaku__note" aria-live="polite">
          {note && !finished ? <KText text={NOTE_TEXT[note]} /> : ''}
        </p>
        <div className="kaku__actions">
          {strict ? (
            <button type="button" className="btn" onClick={giveUp} disabled={finished || showHint}>
              わからない
            </button>
          ) : (
            <>
              <button type="button" className="btn" onClick={() => setShowHint(true)} disabled={finished}>
                おてほん
              </button>
              <button type="button" className="btn" onClick={restart} disabled={finished || doneCount === 0}>
                はじめから
              </button>
              {onSkip && (
                <button type="button" className="btn" onClick={onSkip} disabled={finished}>
                  <KText text="{後|あと}で" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
