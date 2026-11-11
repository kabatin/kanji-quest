import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom は音声の再生を実装していないので、何もしない再生に置きかえる
HTMLMediaElement.prototype.play = () => Promise.resolve()
HTMLMediaElement.prototype.pause = () => undefined

afterEach(() => {
  cleanup()
  localStorage.clear()
})
