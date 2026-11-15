import { renderHook } from '@testing-library/react'
import { MotionGlobalConfig } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, useProgress } from '../store/progress'
import { prefersReducedMotion } from './motion'
import { useReducedMotion } from './useReducedMotion'

const state = () => useProgress.getState()

beforeEach(() => {
  state().reset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('うごきを へらす', () => {
  it('アプリの設定が オンなら へらす。ルートの data-motion と motion の動きも とまる', () => {
    expect(prefersReducedMotion()).toBe(false)
    state().updateSettings({ reduceMotion: true })
    expect(prefersReducedMotion()).toBe(true)
    expect(document.documentElement.dataset.motion).toBe('reduce')
    expect(MotionGlobalConfig.skipAnimations).toBe(true)
    state().updateSettings({ reduceMotion: false })
    expect(document.documentElement.dataset.motion).toBeUndefined()
    expect(MotionGlobalConfig.skipAnimations).toBe(false)
  })

  it('OS の設定だけが オンでも へらす', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('hook は 設定を かえると すぐ かわる', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    state().updateSettings({ reduceMotion: true })
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })
})

describe('設定の古い記録', () => {
  it('大きさ・ききて・うごき が ない記録は ふつう・みぎ・オフ で読み、ON/OFF は そのまま', async () => {
    const old = { settings: { sound: false, music: true, speech: true, icons: true, timer: false } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: old, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().settings).toEqual({ sound: false, music: true, speech: true, soundVol: 'normal', musicVol: 'normal', speechVol: 'normal', icons: true, timer: false, handed: 'right', reduceMotion: false })
  })

  it('こわれた値は 初期値に もどす', async () => {
    const bad = { settings: { soundVol: 'loud', handed: 'up', reduceMotion: 'yes' } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: bad, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().settings).toMatchObject({ soundVol: 'normal', handed: 'right', reduceMotion: false })
  })
})
