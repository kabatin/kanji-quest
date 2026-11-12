import { act, render, screen, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getKanji, KANJI } from '../../data/kanji'
import { strokeCount } from '../../data/strokes'
import { strokeTones } from '../../lib/strokeTones'
import { canAnimate, useSceneClock } from './sceneClock'
import { backOut, checkScene, clamp01, during, easeIn, easeInOut, easeOut, inkTiming, MAX_DURATION, MIN_DURATION, mix, pose, sheetTimes, span, wave, type SceneModule } from './sceneKit'
import { BoneGlow, Ink, Sparkles } from './sceneParts'
import { SceneCompare, ScenePreview } from './ScenePreview'
import { hasScene, loadScene, sceneChars, sceneFileName } from './sceneRegistry'
import { SceneStage } from './SceneStage'
import { StoryPlayer } from './StoryPlayer'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const dummy = (patch: Partial<SceneModule> = {}): SceneModule => ({
  char: '休',
  duration: 8,
  beats: [
    { at: 0, label: 'はじまり' },
    { at: 3, label: 'おはなし' },
    { at: 6, label: '字になる' },
  ],
  Scene: () => null,
  ...patch,
})

describe('場面の道具', () => {
  it('時間の すすみぐあい を 0〜1 に直す', () => {
    expect(clamp01(-1)).toBe(0)
    expect(clamp01(2)).toBe(1)
    expect([1, 2, 3, 4, 5].map((t) => span(t, 2, 4))).toEqual([0, 0, 0.5, 1, 1])
    expect(span(1, 3, 3)).toBe(0)
    expect(span(3, 3, 3)).toBe(1)
    expect(mix(3, 2, 4, 10, 20, (x) => x)).toBe(15)
    expect(mix(0, 2, 4, 10, 20)).toBe(10)
    expect(mix(9, 2, 4, 10, 20)).toBe(20)
    for (const ease of [easeIn, easeOut, easeInOut, backOut]) {
      expect(ease(0)).toBeCloseTo(0)
      expect(ease(1)).toBeCloseTo(1)
    }
    // ぽん と出る動きは、とちゅうで 少し行きすぎる
    expect(Math.max(...[0.5, 0.6, 0.7, 0.8, 0.9].map(backOut))).toBeGreaterThan(1)
  })

  it('あらわれて きえる・くり返し ゆれる', () => {
    expect(during(0.9, 1, 3)).toBe(0)
    expect(during(2, 1, 3)).toBe(1)
    expect(during(3.1, 1, 3)).toBe(0)
    expect(during(1.125, 1, 3, 0.25)).toBeCloseTo(0.5)
    expect(wave(0, 2)).toBeCloseTo(0)
    expect(wave(0.5, 2)).toBeCloseTo(1)
    expect(wave(1.5, 2)).toBeCloseTo(-1)
  })

  it('じく を決めて 回す・大きさを変える transform を作る', () => {
    expect(pose({})).toBe('translate(0 0) rotate(0) scale(1 1) translate(0 0)')
    expect(pose({ x: 2, rotate: 9, scaleX: -1, origin: [27.5, 94] })).toBe('translate(29.5 94) rotate(9) scale(-1 1) translate(-27.5 -94)')
  })

  it('「字になる」流れ: 絵が うすくなり → 画が書けて → 色が そまり → きらきら', () => {
    expect(inkTiming(5, 6, 9, 6)).toEqual({ picture: 1, progress: 0, tint: 0, sparkle: 0 })
    const middle = inkTiming(7.2, 6, 9, 6)
    expect(middle.picture).toBeLessThan(0.3)
    expect(middle.progress).toBeGreaterThan(0.3)
    expect(middle.tint).toBe(0)
    const end = inkTiming(9, 6, 9, 6)
    expect(end.progress).toBe(1)
    expect(end.tint).toBe(1)
    expect(end.sparkle).toBe(1)
    // 絵は 消しきらず、字の うしろに うすく のこす
    expect(end.picture).toBeGreaterThan(0.1)
  })

  it('場面の きまり: 長さ・くぎり の数と順番を たしかめる', () => {
    expect(checkScene(dummy())).toEqual([])
    const short = dummy({ duration: MIN_DURATION - 1, beats: [{ at: 0, label: 'a' }, { at: 1, label: 'b' }, { at: 2, label: 'c' }] })
    expect(checkScene(short)).toEqual([`duration は ${MIN_DURATION}〜${MAX_DURATION} 秒にする`])
    expect(checkScene(dummy({ duration: MAX_DURATION + 1 }))).toHaveLength(1)
    expect(checkScene(dummy({ char: '休む' }))[0]).toContain('漢字1字')
    expect(checkScene(dummy({ beats: [{ at: 0, label: 'a' }] }))[0]).toContain('3つ以上')
    const wrongStart = dummy({ beats: [{ at: 1, label: 'a' }, { at: 2, label: 'b' }, { at: 3, label: 'c' }] })
    expect(checkScene(wrongStart)[0]).toContain('at: 0')
    const unordered = dummy({ beats: [{ at: 0, label: 'a' }, { at: 4, label: 'b' }, { at: 3, label: 'c' }] })
    expect(checkScene(unordered)[0]).toContain('時間の順')
    const tooLate = dummy({ beats: [{ at: 0, label: 'a' }, { at: 4, label: 'b' }, { at: 8, label: 'c' }] })
    expect(checkScene(tooLate)[0]).toContain('duration より前')
    const unnamed = dummy({ beats: [{ at: 0, label: 'a' }, { at: 4, label: ' ' }, { at: 6, label: 'c' }] })
    expect(checkScene(unnamed)[0]).toContain('label')
  })

  it('コマ送り: くぎり の しゅんかん と その間、さいごの しゅんかん を見る', () => {
    const times = sheetTimes(dummy())
    expect(times[0]).toBe(0)
    expect(times).toContain(3)
    expect(times).toContain(6)
    expect(times[times.length - 1]).toBe(8)
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(times).toHaveLength(10)
  })

  it('画の色は、その画が入っている部位の色。分けない字は 墨色', () => {
    expect(strokeTones(getKanji('休'))).toEqual(['imi', 'imi', 'imi', 'imi', 'imi', 'imi'])
    expect(new Set(strokeTones(getKanji('山')))).toEqual(new Set(['ink']))
    expect(strokeTones(getKanji('線'))).toHaveLength(strokeCount('線'))
  })
})

describe('場面の部品', () => {
  it('字は 書き順どおりに 1本ずつ あらわれ、書けた画に しるし が付く', () => {
    const done = (progress: number) => {
      const { container, unmount } = render(
        <svg>
          <Ink char="休" progress={progress} />
        </svg>,
      )
      const result = [...container.querySelectorAll('[data-done="true"]')].map((el) => el.getAttribute('data-stroke'))
      const shown = container.querySelectorAll('[data-stroke]').length
      unmount()
      return { result, shown }
    }
    expect(done(0)).toEqual({ result: [], shown: 0 })
    expect(done(0.5)).toEqual({ result: ['1', '2', '3'], shown: 3 })
    expect(done(0.6).shown).toBe(4)
    expect(done(1).result).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(done(9).result).toHaveLength(6)
  })

  it('えらんだ画だけを書ける。ほね の ひかり・きらきら は、出番のときだけ出る', () => {
    const { container } = render(
      <svg>
        <Ink char="休" strokes={[3, 4]} progress={1} tint={0.5} />
        <BoneGlow char="休" opacity={0} />
        <Sparkles cx={54} cy={54} progress={0} />
        <Sparkles cx={54} cy={54} progress={1} />
      </svg>,
    )
    expect([...container.querySelectorAll('[data-stroke]')].map((el) => el.getAttribute('data-stroke'))).toEqual(['3', '4'])
    expect(container.querySelectorAll('path')).toHaveLength(4)
    const glow = render(
      <svg>
        <BoneGlow char="休" opacity={0.8} />
        <Sparkles cx={54} cy={54} progress={0.5} />
      </svg>,
    )
    expect(glow.container.querySelectorAll('path')).toHaveLength(6 + 10)
  })
})

describe('場面の時計', () => {
  it('動かせない環境(テストなど)では、できあがりの絵を はじめから見せる', () => {
    expect(canAnimate()).toBe(false)
    const { result } = renderHook(() => useSceneClock(8, 0))
    expect(result.current).toBe(8)
  })

  it('動きを へらす設定の人にも、できあがりの絵を見せる', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(canAnimate()).toBe(false)
  })

  it('画面の書きかえに合わせて 0 から進み、さいごで止まる。「もういちど」で はじめから', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const frames: ((now: number) => void)[] = []
    vi.stubGlobal('requestAnimationFrame', (callback: (now: number) => void) => frames.push(callback))
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    let now = 1000
    const step = (ms: number) =>
      act(() => {
        now += ms
        frames.shift()?.(now)
      })
    const { result, rerender } = renderHook(({ round }) => useSceneClock(1, round), { initialProps: { round: 0 } })
    expect(result.current).toBe(0)
    step(0)
    step(50)
    expect(result.current).toBeCloseTo(0.05)
    // 画面を かくしていた間(長い間)は、時間を 一気に進めない
    step(5000)
    expect(result.current).toBeCloseTo(0.15)
    for (let i = 0; i < 12; i += 1) step(100)
    expect(result.current).toBe(1)
    expect(frames).toHaveLength(0)
    rerender({ round: 1 })
    expect(result.current).toBe(0)
  })
})

describe('手づくりの場面', () => {
  const chars = sceneChars()

  it('場面のファイル名は、k + 漢字の文字コード', () => {
    expect(sceneFileName('休')).toBe('k4f11.tsx')
    expect(chars).toContain('休')
    expect(hasScene('休')).toBe(true)
    expect(hasScene('〇')).toBe(false)
  })

  it('場面は、収録している漢字のもの だけ', () => {
    const known = new Set(KANJI.map((k) => k.char))
    expect(chars.filter((char) => !known.has(char))).toEqual([])
    expect(new Set(chars).size).toBe(chars.length)
  })

  it('場面が ない字は、読みこんでも 何も返さない', async () => {
    expect(await loadScene('〇')).toBeUndefined()
  })

  it.each(chars)('%s: きまり を守り、どの しゅんかん も描けて、さいごに 字の画が ぜんぶ書けている', async (char) => {
    const scene = await loadScene(char)
    if (!scene) throw new Error(`場面を読みこめません: ${char}`)
    expect(scene.char).toBe(char)
    expect(checkScene(scene)).toEqual([])

    // くぎり の しゅんかん・その間・さいご の どこでも、エラーなく描ける
    for (const time of [...sheetTimes(scene), -1, scene.duration + 5]) {
      const { unmount } = render(<SceneStage scene={scene} t={time} label="x" />)
      unmount()
    }

    // さいごの しゅんかん: 字の画が ぜんぶ、書きおわっている
    const { container } = render(<SceneStage scene={scene} t={scene.duration} label={`${char} の ものがたり`} />)
    const done = [...container.querySelectorAll('[data-done="true"]')].map((el) => Number(el.getAttribute('data-stroke')))
    expect([...done].sort((a, b) => a - b)).toEqual(Array.from({ length: strokeCount(char) }, (_, i) => i + 1))
    expect(container.querySelector('svg')).toHaveAttribute('data-finished', 'true')
    // はじめの しゅんかん: まだ 字は 書かれていない(絵から 始まる)
    const first = render(<SceneStage scene={scene} t={0} label="x" />)
    expect(first.container.querySelectorAll('[data-stroke]')).toHaveLength(0)
  })
})

describe('ものがたり の画面', () => {
  it('手づくりの場面が ある字は、それを流す。よみ も出る', async () => {
    const { container } = render(<StoryPlayer kanji={getKanji('休')} onDone={() => undefined} />)
    // 読みこんでいる間も、わく と 文は 出ている
    expect(screen.getByRole('img', { name: '休 の ものがたり' })).toBeInTheDocument()
    expect(screen.getByText('ひとが きに もたれて ひとやすみ。')).toBeInTheDocument()
    expect(await screen.findByText('やすむ')).toBeInTheDocument()
    expect(container.querySelector('.scene[data-scene="休"]')).toBeInTheDocument()
    expect(container.querySelector('.story__actor')).not.toBeInTheDocument()
  })

  it('まだ 場面が ない字は、これまでの かんたんな絵で見せる', () => {
    const missing = KANJI.find((k) => !hasScene(k.char))
    if (!missing) return
    const { container } = render(<StoryPlayer kanji={missing} onDone={() => undefined} />)
    expect(container.querySelector('.story__actor')).toBeInTheDocument()
    expect(container.querySelector('.scene')).not.toBeInTheDocument()
  })

  it('コマ送りの一覧(開発用)で、場面の ながれ を見られる。ない字は、ない と出る', async () => {
    const { container, unmount } = render(<ScenePreview char="休" />)
    expect(await screen.findByRole('heading', { name: /休/ })).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('.scene-sheet')).toHaveAttribute('data-ready', 'true'))
    expect(container.querySelector('.scene-sheet')).toHaveAttribute('data-state', 'ready')
    expect(container.querySelectorAll('.scene-sheet__grid figure').length).toBeGreaterThan(8)
    expect(container.querySelector('.scene-sheet__problems')).not.toBeInTheDocument()
    unmount()
    const none = render(<ScenePreview char="〇" />)
    await waitFor(() => expect(none.container.querySelector('[data-missing]')).toHaveTextContent('まだ ありません'))
    none.unmount()
    // ためしの場面(trials/)は、なまえ を指定して見る。ない なまえ は、ない と出る
    const trial = render(<ScenePreview char="休" variant="nai" />)
    await waitFor(() => expect(trial.container.querySelector('[data-missing]')).toHaveTextContent('(nai)'))
    trial.unmount()
    const compare = render(<SceneCompare chars="休" />)
    expect(compare.container.querySelector('.scene-compare__row')).toHaveAttribute('data-char', '休')
  })
})
