import { useRef, useState, type PointerEvent, type RefObject } from 'react'
import { GLYPH_SIZE } from '../../data/strokes'
import { gatePointer, OPEN_GATE, type GateEvent, type GateState } from '../../lib/pointerGate'
import type { Point } from '../../lib/strokeMatch'

type Options = {
  /** 書いてよいか(書きおわったあとは 新しい線を はじめない) */
  readonly enabled: boolean
  /** 1本の線を書きおえたとき。cancelled = とちゅうで とりけされた(pointercancel など) */
  readonly onStroke: (points: readonly Point[], cancelled: boolean) => void
}

type BoardEvent = PointerEvent<SVGSVGElement>

/** 画面上の位置を、漢字の座標(109 x 109)に直す。 */
function toGlyph(svg: SVGSVGElement | null, clientX: number, clientY: number): Point {
  const rect = svg?.getBoundingClientRect()
  if (!rect || rect.width === 0) return [clientX, clientY]
  return [((clientX - rect.left) / rect.width) * GLYPH_SIZE, ((clientY - rect.top) / rect.height) * GLYPH_SIZE]
}

/** ペンなどで 1回の move に まとめられた こまかい点も 使う(線が なめらかになる)。 */
function samplesOf(event: BoardEvent): readonly { readonly clientX: number; readonly clientY: number }[] {
  const coalesced = event.nativeEvent.getCoalescedEvents?.() ?? []
  return coalesced.length > 0 ? coalesced : [event]
}

/**
 * 書き取りの ばん の 指・ペン の入力。1本の指(ペン)の動きだけを 線にする。
 * 2本目の指・手のひら・ペンを使ったあとの touch は pointerGate が はじく。
 */
export function useStrokeInput(svgRef: RefObject<SVGSVGElement | null>, { enabled, onStroke }: Options) {
  const gate = useRef<GateState>(OPEN_GATE)
  const points = useRef<readonly Point[]>([])
  const [drawing, setDrawing] = useState<readonly Point[]>([])

  const show = (next: readonly Point[]) => {
    points.current = next
    setDrawing(next)
  }

  const handle = (phase: GateEvent['phase']) => (event: BoardEvent) => {
    if (phase === 'down' && !enabled) return
    const { state, decision } = gatePointer(gate.current, { phase, id: event.pointerId, kind: event.pointerType ?? '' })
    gate.current = state
    if (decision === 'start') {
      event.currentTarget.setPointerCapture?.(event.pointerId)
      show([toGlyph(svgRef.current, event.clientX, event.clientY)])
    } else if (decision === 'add') {
      show([...points.current, ...samplesOf(event).map((s) => toGlyph(svgRef.current, s.clientX, s.clientY))])
    } else if (decision === 'end' || decision === 'abort') {
      const stroke = points.current
      show([])
      onStroke(stroke, decision === 'abort')
    }
  }

  return {
    /** いま書いている線 */
    drawing,
    handlers: {
      onPointerDown: handle('down'),
      onPointerMove: handle('move'),
      onPointerUp: handle('up'),
      onPointerCancel: handle('cancel'),
      // up が とどかずに つかみが はずれたときも、とちゅうで とりけされた線として あつかう
      onLostPointerCapture: handle('cancel'),
    },
  }
}
