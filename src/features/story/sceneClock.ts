import { useEffect, useState } from 'react'

/** 動きを へらす設定の人・動かせない環境では、できあがりの絵を はじめから見せる。 */
export function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || typeof requestAnimationFrame !== 'function') return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 場面の時計。0 から duration まで、画面の書きかえに合わせて進む。
 * round が変わると、はじめから やりなおす(「もういちど」)。
 * 画面を かくしている間は止まり、もどると つづきから進む。
 */
export function useSceneClock(duration: number, round: number): number {
  const start = () => ({ t: canAnimate() ? 0 : duration, round, duration })
  const [state, setState] = useState(start)
  // 「もういちど」で round が変わったら・場面が あとから とどいて 長さが決まったら、はじめから
  // (レンダーの中で なおすので、古い絵が1コマ出ない)
  const stale = state.round !== round || state.duration !== duration
  if (stale) setState(start())

  useEffect(() => {
    if (!canAnimate()) return
    let frame = 0
    let last: number | undefined
    let elapsed = 0
    const tick = (now: number) => {
      // タブを かくしていた間は、時間を進めない(もどったときに 一気に とばないように)
      const delta = last === undefined ? 0 : Math.min(now - last, 100)
      last = now
      elapsed += delta / 1000
      setState({ t: Math.min(elapsed, duration), round, duration })
      if (elapsed < duration) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, round])

  return stale ? start().t : state.t
}
