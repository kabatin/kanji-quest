import { useProgress } from '../store/progress'
import type { Handed } from './handed'

/** あそんでいる人の ききて。書く画面の 左右の並びを かえるのに使う(中の絵は 反転しない)。 */
export function useHanded(): Handed {
  return useProgress((s) => s.settings.handed)
}
