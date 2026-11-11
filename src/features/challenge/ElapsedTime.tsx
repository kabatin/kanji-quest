import { useEffect, useState } from 'react'
import { formatTime } from '../../lib/score'

const TICK_MS = 1000

type Props = { readonly startedAt: number }

/** はじめてからの時間。設定でタイマー表示をオンにしたときだけ使う。 */
export function ElapsedTime({ startedAt }: Props) {
  const [now, setNow] = useState(startedAt)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(timer)
  }, [startedAt])

  return <span className="bar__time">⏱ {formatTime(Math.max(now - startedAt, 0))}</span>
}
