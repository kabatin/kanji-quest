import { motion } from 'motion/react'
import { KText } from '../../components/KText'
import type { Stroke } from '../../data/strokes'
import type { StrokeTrace } from '../../lib/kakuSession'
import { prefersReducedMotion } from '../../lib/motion'
import { endArrowHead, toPathD, toPolyline } from '../../lib/strokeGuide'

/** 自分の線を 1画 書いて見せる時間と、次の画まで の間(秒) */
const DRAW_S = 0.5
const STEP_S = 0.65

/** 動きを へらす設定の人・動かせない環境では、さいごの すがた を すぐ見せる。 */
function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return !prefersReducedMotion()
}

type LayerProps = {
  /** 字の ぜんぶの画(お手本) */
  readonly strokes: readonly Stroke[]
  /** 書いた画の番号(traces と同じ順) */
  readonly numbers: readonly number[]
  readonly traces: readonly (StrokeTrace | undefined)[]
  /** 「もういちど みる」で かわる数 */
  readonly round: number
}

/** お手本の上に、自分の線を 画の順に 書いて見せる。まちがえた画は 赤い線、その画の お手本は 黄色。 */
export function CompareLayer({ strokes, numbers, traces, round }: LayerProps) {
  const animate = canAnimate()
  const missed = new Set(numbers.filter((_, i) => traces[i]?.missed))
  return (
    <g className="kaku__compare">
      {strokes.map((stroke, i) => (
        <path key={stroke.d} className={missed.has(i + 1) ? 'kaku__model kaku__model--miss' : 'kaku__model'} d={stroke.d} />
      ))}
      {numbers.map((n, i) => {
        const trace = traces[i]
        if (!trace) return null
        const head = trace.missed ? endArrowHead(trace.points) : null
        return (
          <g key={`${round}-${n}`}>
            <motion.path
              className={trace.missed ? 'kaku__replay kaku__replay--miss' : 'kaku__replay'}
              data-stroke={n}
              data-missed={trace.missed}
              d={toPathD(trace.points)}
              initial={animate ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: i * STEP_S, duration: DRAW_S, ease: 'easeInOut' }}
            />
            {/* まちがえた線は、どちら向きに書いたか を 三角で のこす */}
            {head && (
              <motion.polygon
                className="kaku__replay-head"
                points={toPolyline(head)}
                initial={animate ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ delay: i * STEP_S + DRAW_S, duration: 0.15 }}
              />
            )}
          </g>
        )
      })}
    </g>
  )
}

type PanelProps = {
  /** まちがえた画の数 */
  readonly missed: number
  readonly onReplay: () => void
  readonly onNext: () => void
}

/** くらべている あいだの よこの 見出しと ボタン */
export function ComparePanel({ missed, onReplay, onNext }: PanelProps) {
  return (
    <>
      <p className="kaku__lead">
        <KText text="お{手本|てほん}と くらべよう" />
      </p>
      <ul className="kaku__legend">
        <li>
          <span className="kaku__swatch" aria-hidden="true" />
          じぶんの せん
        </li>
        {missed > 0 && (
          <li>
            <span className="kaku__swatch kaku__swatch--miss" aria-hidden="true" />
            まちがえた せん
          </li>
        )}
      </ul>
      <p className="kaku__compare-note">
        <KText text={missed > 0 ? 'あかい せんを お{手本|てほん}と よく {見|み}くらべてね' : 'ぜんぶ 1かいで {書|か}けたね！'} />
      </p>
      <div className="kaku__actions">
        <button type="button" className="btn" onClick={onReplay}>
          もういちど みる
        </button>
        <button type="button" className="btn btn--primary" onClick={onNext}>
          つぎへ
        </button>
      </div>
    </>
  )
}
