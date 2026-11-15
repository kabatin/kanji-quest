import { motion } from 'motion/react'
import type { Stroke } from '../../data/strokes'
import { startArrow, toPolyline } from '../../lib/strokeGuide'
import type { GuideFocus, GuideParts } from '../../lib/strokeHint'

type Props = {
  /** 次に書く画 */
  readonly stroke: Stroke
  readonly parts: GuideParts
  /** 書きはじめの点に書く番号 */
  readonly number: number
  /** まちがえるたびに かわる数(ゆらす うごきを はじめから やりなおす) */
  readonly round: number
}

/**
 * 次に書く画の上に出す しるし(だんかい ヒント と、さっきの まちがいの 直すところ)。
 * うすい お手本 → うごく お手本 → おわりの わっか → むきの やじるし → 書きはじめの点 の順に かさねる。
 */
export function StrokeGuide({ stroke, parts, number, round }: Props) {
  const start = stroke.pts[0]
  const end = stroke.pts[stroke.pts.length - 1]
  const arrow = parts.arrow ? startArrow(stroke.pts) : null
  const focusClass = (name: GuideFocus) => (parts.focus === name ? ' is-focus' : '')
  return (
    <g className="kaku__guide" data-focus={parts.focus ?? undefined}>
      {parts.trace && <path className="kaku__trace" d={stroke.d} />}
      {parts.animate && (
        <motion.path
          key={`hint-${number}`}
          className="kaku__hint"
          d={stroke.d}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}
        />
      )}
      {parts.end && <circle key={`end-${round}`} className={`kaku__end${focusClass('end')}`} cx={end[0]} cy={end[1]} r="4.4" />}
      {arrow && (
        <g key={`arrow-${round}`} className={`kaku__arrow${focusClass('arrow')}`}>
          <line x1={arrow.shaft[0][0]} y1={arrow.shaft[0][1]} x2={arrow.shaft[1][0]} y2={arrow.shaft[1][1]} />
          <polygon points={toPolyline(arrow.head)} />
        </g>
      )}
      {parts.start && (
        <g key={`start-${round}`} className={`kaku__start${focusClass('start')}`}>
          <circle cx={start[0]} cy={start[1]} r="4.5" />
          {parts.number && (
            <text x={start[0]} y={start[1]} dy="2.4" textAnchor="middle">
              {number}
            </text>
          )}
        </g>
      )}
    </g>
  )
}
