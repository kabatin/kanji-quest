import { useCallback, useEffect, useRef, useState } from 'react'
import { dayKey } from '../../lib/date'
import { gateAction, statusOf } from '../../lib/playGate'
import type { Screen } from '../../nav'
import { useParent } from '../../store/parent'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'

/** 「きょうは ここまで」の画面が 日がかわったか を 見なおす間かく */
export const LIMIT_RECHECK_MS = 20_000

const LIMIT: Screen = { name: 'limit' }

/**
 * 1日の時間の上限。画面を うつった時に 見て、上限に来ていたら「きょうは ここまで」に する(あそびの とちゅうでは 切らない)。
 * 残り5分は、ホームに もどった時に 1回だけ しらせる。
 */
export function useLimitGate(stack: readonly Screen[], setStack: (next: readonly Screen[]) => void) {
  const [soon, setSoon] = useState<number | null>(null)
  const warned = useRef<ReadonlySet<string>>(new Set())
  const screen = stack[stack.length - 1].name

  const check = useCallback(
    (name: Screen['name']) => {
      const today = dayKey()
      const id = useProfiles.getState().activeId
      const status = statusOf(useParent.getState(), id, useProgress.getState().playMinutes, today)
      const key = `${id}:${today}`
      const action = gateAction({ status, screen: name, warned: warned.current.has(key) })
      if (action === 'end') setStack([LIMIT])
      else if (action === 'free') setStack([{ name: 'home' }])
      else if (action === 'warn') {
        warned.current = new Set([...warned.current, key])
        setSoon(status.left)
      }
      return action
    },
    [setStack],
  )

  // 画面を うつったとき(= いまの問題・ボス・復習が おわって もどったとき)だけ 見る
  useEffect(() => {
    setSoon(null)
    check(screen)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stack が かわった時だけ
  }, [stack])

  // 「きょうは ここまで」の まま 日がかわった・延長された時は、あそべるように もどす
  useEffect(() => {
    if (screen !== 'limit') return
    const recheck = () => {
      if (document.visibilityState === 'visible') check('limit')
    }
    const timer = setInterval(recheck, LIMIT_RECHECK_MS)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [screen, check])

  const dismissSoon = useCallback(() => setSoon(null), [])
  return { soon, dismissSoon }
}
