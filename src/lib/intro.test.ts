import { describe, expect, it } from 'vitest'
import { homeTip, INITIAL_INTRO, introActive, learnTip, markSeen, needsWelcome, sanitizeIntro, skipIntro, type IntroState } from './intro'

const started: IntroState = { done: false, seen: ['handed'] }

describe('あんないの 流れ', () => {
  it('はじめての子(覚えた字が0)には出る。すでに遊んでいる子には出ない', () => {
    expect(introActive(0, INITIAL_INTRO)).toBe(true)
    expect(needsWelcome(0, INITIAL_INTRO)).toBe(true)
    expect(introActive(3, INITIAL_INTRO)).toBe(false)
    expect(needsWelcome(3, INITIAL_INTRO)).toBe(false)
  })

  it('とばした子には、もう出ない', () => {
    const skipped = skipIntro(INITIAL_INTRO)
    expect(introActive(0, skipped)).toBe(false)
    expect(needsWelcome(0, skipped)).toBe(false)
  })

  it('ききてを えらんだあとは あいさつを くりかえさない(とちゅうで閉じても やりなおしにならない)', () => {
    expect(needsWelcome(0, started)).toBe(false)
    expect(introActive(1, started)).toBe(true)
  })

  it('学ぶ画面では、ステップごとに 見ていない吹き出しだけ出る', () => {
    expect(learnTip('story', 0, started)).toBe('story')
    expect(learnTip('kumi', 0, started)).toBe('kumi')
    expect(learnTip('kaku', 1, started)).toBe('kaku')
    expect(learnTip('result', 1, started)).toBeNull()
    expect(learnTip('story', 0, markSeen(started, 'story'))).toBeNull()
    // あいさつの前や、あんない対象でない子には出ない
    expect(learnTip('story', 0, INITIAL_INTRO)).toBeNull()
    expect(learnTip('story', 5, { done: false, seen: [] })).toBeNull()
  })

  it('ホームでは 1字おぼえたあとで、forest → kanji → next の順に1つずつ', () => {
    expect(homeTip(0, started)).toBeNull()
    expect(homeTip(1, started)).toBe('forest')
    const a = markSeen(started, 'forest')
    expect(homeTip(1, a)).toBe('kanji')
    const b = markSeen(a, 'kanji')
    expect(homeTip(1, b)).toBe('next')
    const c = markSeen(b, 'next')
    expect(c.done).toBe(true)
    expect(homeTip(1, c)).toBeNull()
  })

  it('markSeen は元の値を変えず、同じ印を二重に足さない', () => {
    const next = markSeen(started, 'story')
    expect(started.seen).toEqual(['handed'])
    expect(next.seen).toEqual(['handed', 'story'])
    expect(markSeen(next, 'story')).toBe(next)
  })

  it('こわれた保存データは はじめの状態か、読める所だけにする', () => {
    expect(sanitizeIntro(undefined)).toEqual(INITIAL_INTRO)
    expect(sanitizeIntro('x')).toEqual(INITIAL_INTRO)
    expect(sanitizeIntro({ done: 1, seen: 'no' })).toEqual(INITIAL_INTRO)
    expect(sanitizeIntro({ done: true, seen: ['story', 'zzz'] })).toEqual({ done: true, seen: ['story'] })
  })
})
