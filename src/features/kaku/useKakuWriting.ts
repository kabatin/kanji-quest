import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Stroke } from '../../data/strokes'
import { initWrite, isTap, writeReducer, writeReport } from '../../lib/kakuSession'
import { MODEL_HINT, toleranceFor, type WriteReport } from '../../lib/strokeHint'
import { checkStroke, type Point } from '../../lib/strokeMatch'
import { useFeedback } from '../../lib/useFeedback'

/** テストで、書きおわってから次へ進むまでの間 */
export const WRITE_DONE_MS = 900
/** 見て書く で、書きおわってから次へ進むまでの間(この間に「くらべる」を押せる) */
export const LEARN_DONE_MS = 2000

export type OnWriteDone = (misses: number, report: WriteReport) => void

/** onDone を1回だけ、そのときの さいしんの値で 呼ぶ。 */
function useDoneOnce(onDone: OnWriteDone, misses: number, report: WriteReport) {
  const latest = useRef({ onDone, misses, report })
  const called = useRef(false)
  useEffect(() => {
    latest.current = { onDone, misses, report }
  })
  return useCallback(() => {
    if (called.current) return
    called.current = true
    latest.current.onDone(latest.current.misses, latest.current.report)
  }, [])
}

type Options = {
  /** 書く画(書く順) */
  readonly targets: readonly Stroke[]
  readonly strict: boolean
  readonly onDone: OnWriteDone
}

/**
 * 1字を書く あいだの すすみぐあい。線の判定・音・ヒントの段・書きおわったあとの 次へ進む時間 を まとめる。
 * くらべている あいだ は 次へ進まない(「つぎへ」で進む)。
 */
export function useKakuWriting({ targets, strict, onDone }: Options) {
  const { play } = useFeedback()
  const [state, dispatch] = useReducer(writeReducer, strict, initWrite)
  /** くらべている ときの 回数(「もういちど みる」で ふえる)。null = くらべていない */
  const [replay, setReplay] = useState<number | null>(null)
  const finished = state.done >= targets.length
  const finish = useDoneOnce(onDone, state.misses, writeReport(state))

  useEffect(() => {
    if (!finished || replay !== null) return
    const timer = setTimeout(finish, strict ? WRITE_DONE_MS : LEARN_DONE_MS)
    return () => clearTimeout(timer)
  }, [finished, replay, strict, finish])

  const handleStroke = (points: readonly Point[], cancelled: boolean) => {
    if (finished) return
    const result = checkStroke(
      points,
      targets.map((t) => t.pts),
      state.done,
      toleranceFor(state.missesHere),
    )
    // とちゅうで とりけされた線・点をさわっただけ は、まちがいに数えない
    if (result !== 'ok' && (cancelled || isTap(points))) return
    if (result === 'ok') play(state.done + 1 === targets.length ? 'ok' : 'stroke')
    else play('retry')
    dispatch({ type: 'stroke', result, points })
  }

  const giveUp = () => {
    if (state.hint >= MODEL_HINT) return
    play('retry')
    dispatch({ type: 'giveUp' })
  }

  return {
    state,
    finished,
    replay,
    finish,
    handleStroke,
    giveUp,
    showModel: () => dispatch({ type: 'model' }),
    restart: () => dispatch({ type: 'restart' }),
    startCompare: () => setReplay(0),
    replayAgain: () => setReplay((r) => (r ?? 0) + 1),
  }
}
