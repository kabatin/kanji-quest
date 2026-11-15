/** がめんを 大きく する方法。端末によって できることが ちがう。 */
export type BigScreenWay =
  /** もう 大きい(ホーム画面から ひらいている・全画面に している) */
  | 'already'
  /** ボタンで 全画面に できる(Android・パソコン) */
  | 'button'
  /** 「ホーム画面に追加」を あんない する(iPhone・iPad は ボタンでは 全画面に できない) */
  | 'add-to-home'
  /** できない */
  | 'none'

export type ScreenEnv = {
  readonly standalone: boolean
  readonly fullscreen: boolean
  readonly canRequest: boolean
  readonly ios: boolean
}

/** いまの端末で、がめんを 大きく する方法を決める。 */
export function bigScreenWay(env: ScreenEnv): BigScreenWay {
  if (env.standalone || env.fullscreen) return 'already'
  if (env.ios) return 'add-to-home'
  return env.canRequest ? 'button' : 'none'
}

/** iPhone・iPad か(iPad は Mac と名のるので、タッチの本数でも見る)。 */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
}

/** ブラウザから 今の ようす を読む。 */
export function readScreenEnv(): ScreenEnv {
  if (typeof window === 'undefined' || typeof document === 'undefined') return { standalone: false, fullscreen: false, canRequest: false, ios: false }
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const standalone = nav.standalone === true || window.matchMedia?.('(display-mode: standalone), (display-mode: fullscreen)').matches === true
  return {
    standalone,
    fullscreen: document.fullscreenElement !== null && document.fullscreenElement !== undefined,
    canRequest: document.fullscreenEnabled === true && typeof document.documentElement.requestFullscreen === 'function',
    ios: isIos(nav.userAgent, nav.maxTouchPoints ?? 0),
  }
}

/** 全画面に する。できなかったら false(おした人に 知らせるのは よぶ側)。 */
export async function enterFullscreen(): Promise<boolean> {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    return true
  } catch {
    return false
  }
}

/** 全画面を やめる。 */
export async function leaveFullscreen(): Promise<void> {
  if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined)
}

const HINT_KEY = 'kanji-quest-bigscreen-hint'

/** がめんが ひくい(スマホの よこ向き)ときだけ、1回 あんない を出す。 */
export function shouldHint(way: BigScreenWay, viewportHeight: number, seen: boolean): boolean {
  return !seen && viewportHeight <= 500 && (way === 'button' || way === 'add-to-home')
}

export function hintSeen(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return storage.getItem(HINT_KEY) === '1'
  } catch {
    return true
  }
}

export function markHintSeen(storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(HINT_KEY, '1')
  } catch {
    // 保存できない端末では、毎回 出るだけ(あそびは つづけられる)
  }
}
