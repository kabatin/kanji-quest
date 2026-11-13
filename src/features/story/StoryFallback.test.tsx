import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getKanji } from '../../data/kanji'

// 場面のファイルを 読みこめない(電波がない・公開しなおして ファイルが なくなった)ことにする
vi.mock('./sceneRegistry', async (original) => {
  const actual = await original<typeof import('./sceneRegistry')>()
  return {
    ...actual,
    hasScene: () => true,
    useScene: (char: string) => {
      const real = actual.useScene('〇')
      return char === '休' ? { scene: undefined, failed: true } : real
    },
  }
})

describe('ものがたり: 場面を 読みこめなかったとき', () => {
  it('何も出ない ままに せず、かんたんな絵で見せる', async () => {
    const { StoryPlayer } = await import('./StoryPlayer')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<StoryPlayer kanji={getKanji('休')} onDone={() => undefined} />)
    await waitFor(() => expect(container.querySelector('.story__actor')).toBeInTheDocument())
    expect(container.querySelector('.story__stage--scene')).not.toBeInTheDocument()
    expect(screen.getByText('ひとが きに もたれて ひとやすみ。')).toBeInTheDocument()
  })
})
