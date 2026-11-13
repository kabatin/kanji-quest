import { describe, expect, it, vi } from 'vitest'
import manifest from '../assets/voice-manifest.json'
import { offlineStatus, registerServiceWorker, reloadIfUpdated, SHELL_PREFIX, SW_URL, VOICE_PREFIX } from './pwa'

function fakeCaches(entries: Record<string, number>): CacheStorage {
  return {
    keys: async () => Object.keys(entries),
    open: async (name: string) => ({ keys: async () => Array.from({ length: entries[name] ?? 0 }) }),
  } as unknown as CacheStorage
}

function fakeNavigator(register: () => Promise<unknown>, postMessage = vi.fn()): Navigator {
  return { serviceWorker: { register, ready: Promise.resolve({ active: { postMessage } }) } } as unknown as Navigator
}

describe('オフライン(サービスワーカー)', () => {
  it('新しい版が入ったら、ホームに もどったときに 読みこみなおす。もどるたびに 新しい版を さがす', async () => {
    const listeners: Record<string, () => void> = {}
    const update = vi.fn(async () => undefined)
    const serviceWorker = {
      controller: {},
      register: async () => ({ update }),
      ready: Promise.resolve({ active: { postMessage: vi.fn() } }),
      addEventListener: (name: string, fn: () => void) => {
        listeners[name] = fn
      },
    }
    const doc = {
      visibilityState: 'visible',
      addEventListener: (name: string, fn: () => void) => {
        listeners[name] = fn
      },
    }
    const reload = vi.fn()
    await registerServiceWorker({ prod: true, nav: { serviceWorker } as unknown as Navigator, cacheStorage: fakeCaches({}), doc: doc as unknown as Document })
    expect(reloadIfUpdated(reload)).toBe(false)
    listeners.visibilitychange()
    expect(update).toHaveBeenCalledTimes(1)
    listeners.controllerchange()
    expect(reloadIfUpdated(reload)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    // 1回 読みこみなおしたら、もう しない
    expect(reloadIfUpdated(reload)).toBe(false)
  })

  it('はじめて入れたときは、読みこみなおさない', async () => {
    const listeners: Record<string, () => void> = {}
    const serviceWorker = {
      controller: null,
      register: async () => ({}),
      ready: Promise.resolve({ active: { postMessage: vi.fn() } }),
      addEventListener: (name: string, fn: () => void) => {
        listeners[name] = fn
      },
    }
    await registerServiceWorker({ prod: true, nav: { serviceWorker } as unknown as Navigator, cacheStorage: fakeCaches({}) })
    listeners.controllerchange()
    expect(reloadIfUpdated(vi.fn())).toBe(false)
  })

  it('開発中は入れない', async () => {
    const register = vi.fn(async () => ({}))
    expect(await registerServiceWorker({ prod: false, nav: fakeNavigator(register), cacheStorage: fakeCaches({}) })).toBe(false)
    expect(register).not.toHaveBeenCalled()
  })

  it('公開した版では入れて、音声の保存を たのむ', async () => {
    const register = vi.fn(async () => ({}))
    const postMessage = vi.fn()
    expect(await registerServiceWorker({ prod: true, nav: fakeNavigator(register, postMessage), cacheStorage: fakeCaches({}) })).toBe(true)
    expect(register).toHaveBeenCalledWith(SW_URL)
    expect(postMessage).toHaveBeenCalledWith({ type: 'cache-voice' })
  })

  it('入れられなくても、エラーで止まらない', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const register = vi.fn(async () => Promise.reject(new Error('だめ')))
    expect(await registerServiceWorker({ prod: true, nav: fakeNavigator(register), cacheStorage: fakeCaches({}) })).toBe(false)
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    expect(await registerServiceWorker({ prod: true, nav: {} as Navigator, cacheStorage: fakeCaches({}) })).toBe(false)
  })

  it('どこまで保存できたかが分かる', async () => {
    const env = { prod: true, nav: fakeNavigator(async () => ({})) }
    const total = manifest.clips.length
    expect(await offlineStatus({ ...env, cacheStorage: fakeCaches({}) })).toEqual({ supported: true, shell: false, voiceCached: 0, voiceTotal: total })
    expect(await offlineStatus({ ...env, cacheStorage: fakeCaches({ [`${SHELL_PREFIX}abc`]: 20, [`${VOICE_PREFIX}def`]: 120 }) })).toEqual({
      supported: true,
      shell: true,
      voiceCached: 120,
      voiceTotal: total,
    })
    expect((await offlineStatus({ prod: false })).supported).toBe(false)
  })
})
