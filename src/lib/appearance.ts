import { MotionGlobalConfig } from 'motion/react'
import { setMusicVolume } from './music'
import { prefersReducedMotion, setAppReduceMotion } from './motion'
import { scaleOf, type Volume } from './volume'

type Prefs = {
  readonly music: boolean
  readonly musicVol: Volume
  readonly reduceMotion: boolean
}

type Source = {
  readonly getState: () => { readonly settings: Prefs }
  readonly subscribe: (listener: () => void) => () => void
}

/** 設定を、アプリぜんたいに ききめがある所へ ひろげる(ルートの data-motion、motion の動き、音楽の大きさ)。 */
export function applyAppearance(prefs: Prefs): void {
  setAppReduceMotion(prefs.reduceMotion)
  const reduce = prefersReducedMotion()
  MotionGlobalConfig.skipAnimations = reduce
  if (typeof document !== 'undefined') {
    if (reduce) document.documentElement.dataset.motion = 'reduce'
    else delete document.documentElement.dataset.motion
  }
  setMusicVolume(scaleOf('music', true, prefs.musicVol))
}

/** 設定の store を見はって、かわるたびに applyAppearance する。人を切りかえたときも ついてくる。 */
export function bindAppearance(source: Source): void {
  let last: Prefs | undefined
  const sync = () => {
    const { music, musicVol, reduceMotion } = source.getState().settings
    if (last && last.music === music && last.musicVol === musicVol && last.reduceMotion === reduceMotion) return
    last = { music, musicVol, reduceMotion }
    applyAppearance(last)
  }
  sync()
  source.subscribe(sync)
}
