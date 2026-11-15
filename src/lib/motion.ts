/** アプリの せってい「うごきを へらす」(設定を読みこむたびに appearance が入れる)。 */
let appReduce = false

export function setAppReduceMotion(on: boolean): void {
  appReduce = on
}

/** OS の「視差効果を減らす」が オンか。調べられない環境では false。 */
export function osPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** OS の設定 か アプリの設定の どちらかが オンなら、動きを へらす。 */
export function prefersReducedMotion(): boolean {
  return appReduce || osPrefersReducedMotion()
}
