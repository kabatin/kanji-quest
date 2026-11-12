import manifest from '../assets/voice-manifest.json'

/** サービスワーカー(public/sw.js)が使う 保存場所の名前の頭 */
export const SHELL_PREFIX = 'kq-shell-'
export const VOICE_PREFIX = 'kq-voice-'
export const SW_URL = './sw.js'

export type OfflineStatus = {
  /** この環境で オフライン保存が使えるか */
  readonly supported: boolean
  /** アプリ本体を保存してあるか */
  readonly shell: boolean
  readonly voiceCached: number
  readonly voiceTotal: number
}

type Env = { readonly prod: boolean; readonly nav?: Navigator; readonly cacheStorage?: CacheStorage }

const defaultEnv = (): Env => ({
  prod: import.meta.env.PROD,
  nav: typeof navigator === 'undefined' ? undefined : navigator,
  cacheStorage: typeof caches === 'undefined' ? undefined : caches,
})

const isSupported = (env: Env): boolean => env.prod && env.nav !== undefined && 'serviceWorker' in env.nav && env.cacheStorage !== undefined

/**
 * サービスワーカーを入れる(公開した版だけ。開発中は入れない)。
 * 入ったら、音声も うらで少しずつ保存させる。入れられたら true。
 */
export async function registerServiceWorker(env: Env = defaultEnv()): Promise<boolean> {
  if (!isSupported(env) || !env.nav) return false
  try {
    await env.nav.serviceWorker.register(SW_URL)
    const ready = await env.nav.serviceWorker.ready
    ready.active?.postMessage({ type: 'cache-voice' })
    return true
  } catch (error) {
    // 入れられなくても、ふつうに あそべる(電波がないと使えないだけ)
    console.warn('オフライン用の準備ができませんでした', error)
    return false
  }
}

/** オフラインで使える準備が どこまで できているか。 */
export async function offlineStatus(env: Env = defaultEnv()): Promise<OfflineStatus> {
  const voiceTotal = manifest.clips.length
  if (!isSupported(env) || !env.cacheStorage) return { supported: false, shell: false, voiceCached: 0, voiceTotal }
  const names = await env.cacheStorage.keys()
  const voiceName = names.find((name) => name.startsWith(VOICE_PREFIX))
  const voiceCached = voiceName ? (await (await env.cacheStorage.open(voiceName)).keys()).length : 0
  return { supported: true, shell: names.some((name) => name.startsWith(SHELL_PREFIX)), voiceCached, voiceTotal }
}
