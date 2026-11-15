import { useProgress } from '../store/progress'
import { osPrefersReducedMotion } from './motion'

/** 動きを へらすか(OS の設定 か アプリの設定)。設定を かえると すぐ かわる。 */
export function useReducedMotion(): boolean {
  const app = useProgress((s) => s.settings.reduceMotion)
  return app || osPrefersReducedMotion()
}
