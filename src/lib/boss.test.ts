import { afterEach, describe, expect, it, vi } from 'vitest'
import { ALL_STAGES } from '../data/areas'
import { getKanji, KANJI } from '../data/kanji'
import { fullGlyph } from '../data/strokes'
import { forestPlan, groundHeight, ISLAND_RADIUS, kanjiPerGrowth, MAX_TREES, POND, skyPreset, SKY_PRESETS, TREE_STAGES, treeSpots, DECO_SPOTS } from '../features/home/scene/layout'
import { bossName, buildBoss, buildParts, buildWrite, EXAM_PLAN, examBoss, leafParts, PARTS_CHOICE_COUNT, STAGE_BOSS_PLAN, stageBoss } from './boss'
import { SHOP_ITEMS, itemName } from './shop'
import { playVoice, stopVoice, VOICE_FADE_MS, voiceId } from './voice'

/** いつも同じ並びになる乱数 */
function seededRng(seed = 1): () => number {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

describe('ボスの問題', () => {
  it('部位: とちゅうで できる部位は のぞいて、いちばん小さい部位を出す', () => {
    expect(leafParts(getKanji('休')).map((p) => p.id)).toEqual(['亻', '木'])
    expect(leafParts(getKanji('線')).map((p) => p.id)).toEqual(['白', '水', '糸'])
    expect(leafParts(getKanji('林')).map((p) => p.id)).toEqual(['木'])
    expect(leafParts(getKanji('山'))).toEqual([])
  })

  it('ぜんぶの部位: 正解を全部ふくむ6枚で、同じ部位は重ならない', () => {
    const question = buildParts(getKanji('休'), KANJI, seededRng())
    expect(question.choices).toHaveLength(PARTS_CHOICE_COUNT)
    expect(new Set(question.choices).size).toBe(PARTS_CHOICE_COUNT)
    expect(question.choices).toEqual(expect.arrayContaining(['亻', '木']))
    expect(question.choices).not.toContain('休')
  })

  it('かく: つくり だけ書く問題は、のこりの画が はじめから書いてある', () => {
    const part = buildWrite(getKanji('休'), 'part', true)
    expect(part).toMatchObject({ mode: 'part', model: true, given: [1, 2], strokes: [3, 4, 5, 6] })
    const whole = buildWrite(getKanji('休'), 'whole', false)
    expect(whole).toMatchObject({ mode: 'whole', model: false, given: [], strokes: fullGlyph('休').strokes })
    // 分けられない字は、つくり だけ とは言えないので、字ぜんたいを書く
    expect(buildWrite(getKanji('山'), 'part', true).mode).toBe('whole')
  })

  it('ステージの ボス: 5字それぞれを、えらぶ → 見て書く → 見ないで書く の順に15問', () => {
    for (const stage of [ALL_STAGES[0], ALL_STAGES[15], ALL_STAGES[40]]) {
      const boss = stageBoss(stage)
      const questions = buildBoss(boss.kanji.map(getKanji), KANJI, boss.plan, seededRng(stage.number))
      expect(questions).toHaveLength(15)
      const select = questions.slice(0, 5)
      const model = questions.slice(5, 10)
      const blind = questions.slice(10)
      expect(select.every((q) => q.type !== 'write')).toBe(true)
      expect(model.every((q) => q.type === 'write' && q.model)).toBe(true)
      expect(blind.every((q) => q.type === 'write' && !q.model && q.mode === 'whole')).toBe(true)
      for (const round of [select, model, blind]) expect(round.map((q) => q.kanji.char).sort()).toEqual([...stage.kanji].sort())
    }
  })

  it('えらぶ問題は4種類(つくり・ぜんぶの部位・なりたち・絵)が まんべんなく出る', () => {
    const compound = KANJI.filter((k) => k.steps.length > 0).slice(0, 8)
    const kinds = buildBoss(compound, KANJI, { select: 8, model: 0, blind: 0 }, seededRng()).map((q) => (q.type === 'erabi' ? q.clue : q.type))
    expect(new Set(kinds)).toEqual(new Set(['kumi', 'parts', 'story', 'picture']))
    // 分けられない字には、つくり・部位 の問題は出さない
    const single = KANJI.filter((k) => k.steps.length === 0).slice(0, 8)
    expect(buildBoss(single, KANJI, { select: 8, model: 0, blind: 0 }, seededRng()).every((q) => q.type === 'erabi')).toBe(true)
  })

  it('そつぎょうしけん: 学年の字から 20問。字がなければ問題もない', () => {
    const exam = examBoss(1, KANJI)
    expect(exam).toMatchObject({ id: 'exam-g1', kind: 'exam', plan: EXAM_PLAN })
    expect(exam.kanji).toHaveLength(80)
    const questions = buildBoss(exam.kanji.map(getKanji), KANJI, exam.plan, seededRng())
    expect(questions).toHaveLength(20)
    expect(new Set(questions.slice(0, 10).map((q) => q.kanji.char)).size).toBe(10)
    expect(buildBoss([], KANJI, STAGE_BOSS_PLAN)).toEqual([])
  })

  it('ボスの名前は、ステージごとに順番に変わる', () => {
    expect(bossName(1)).toBe('とめきち')
    expect(bossName(9)).toBe('とめきち')
    expect(bossName(2)).not.toBe(bossName(1))
    expect(stageBoss(ALL_STAGES[1])).toMatchObject({ id: 's2', kind: 'stage', title: 'ステージ 2 の ボス', seed: 2 })
  })
})

describe('ホームの しま', () => {
  it('木を植える場所は 60か所。広場・池・かざり・手前のまんなか をよける', () => {
    const spots = treeSpots()
    expect(spots).toHaveLength(MAX_TREES)
    expect(treeSpots()).toEqual(spots)
    for (const spot of spots) {
      expect(Math.hypot(spot.x, spot.z)).toBeGreaterThan(3)
      expect(Math.hypot(spot.x, spot.z)).toBeLessThan(ISLAND_RADIUS)
      expect(Math.hypot(spot.x - POND.x, spot.z - POND.z)).toBeGreaterThan(POND.radius)
      expect(spot.z > 0.8 && Math.abs(spot.x) < 3.6).toBe(false)
    }
  })

  it('1字おぼえるたびに森が1段階 育ち、全部おぼえると育ちきる', () => {
    expect(kanjiPerGrowth(240)).toBe(1)
    expect(kanjiPerGrowth(1026)).toBe(5)
    expect(forestPlan(0, 240)).toEqual([])
    expect(forestPlan(1, 240)).toMatchObject([{ stage: 1 }])
    const growth = (count: number) => forestPlan(count, 240).reduce((sum, tree) => sum + tree.stage, 0)
    expect([1, 2, 10, 100, 240].map(growth)).toEqual([1, 2, 10, 100, 240])
    const full = forestPlan(240, 240)
    expect(full).toHaveLength(MAX_TREES)
    expect(full.every((tree) => tree.stage === TREE_STAGES)).toBe(true)
    // 6年生ぶん(1026字)でも、育ちきるのは全部おぼえたとき
    expect(forestPlan(1000, 1026).some((tree) => tree.stage < TREE_STAGES)).toBe(true)
    expect(forestPlan(9999, 240)).toHaveLength(MAX_TREES)
  })

  it('はじめのうちから、新しい木が植わるのと 前の木が育つのが まざる', () => {
    const plan = forestPlan(12, 240)
    expect(plan.length).toBeGreaterThan(3)
    expect(Math.max(...plan.map((tree) => tree.stage))).toBeGreaterThan(1)
  })

  it('しまは まんなかが少し高い', () => {
    expect(groundHeight(0, 0)).toBeGreaterThan(groundHeight(5, 0))
    expect(groundHeight(ISLAND_RADIUS, 0)).toBe(0)
    expect(groundHeight(99, 0)).toBe(0)
  })

  it('きせかえ の そら と かざり は、ぜんぶ しま に用意がある', () => {
    for (const item of SHOP_ITEMS) {
      if (item.kind === 'bg') expect(SKY_PRESETS[itemName(item.id)]).toBeDefined()
      if (item.kind === 'deco') expect(DECO_SPOTS[itemName(item.id)]).toBeDefined()
    }
    expect(skyPreset('nai')).toBe(SKY_PRESETS.asa)
  })
})

describe('stopVoice', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('流れている音声は、少しずつ小さくしてから止める', () => {
    vi.useFakeTimers()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
    const volume = vi.spyOn(HTMLMediaElement.prototype, 'volume', 'set')
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false)
    playVoice(voiceId.word('海'), 'うみ', true)
    volume.mockClear()

    stopVoice()
    expect(pause).not.toHaveBeenCalled()
    vi.advanceTimersByTime(VOICE_FADE_MS / 2)
    const levels = volume.mock.calls.map(([v]) => v)
    expect(levels.length).toBeGreaterThan(2)
    expect(levels).toEqual([...levels].sort((a, b) => b - a))
    expect(pause).not.toHaveBeenCalled()

    vi.advanceTimersByTime(VOICE_FADE_MS)
    expect(pause).toHaveBeenCalledOnce()
    // 止めたあとは、次の音声のために音量を もとにもどす
    expect(volume).toHaveBeenLastCalledWith(1)
  })

  it('消えていく とちゅうで次の音声が始まったら、止めずに音量を もどす', () => {
    vi.useFakeTimers()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
    const volume = vi.spyOn(HTMLMediaElement.prototype, 'volume', 'set')
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false)
    playVoice(voiceId.word('海'), 'うみ', true)
    stopVoice()
    vi.advanceTimersByTime(VOICE_FADE_MS / 2)
    playVoice(voiceId.word('木'), 'き', true)
    expect(volume).toHaveBeenLastCalledWith(1)
    vi.advanceTimersByTime(VOICE_FADE_MS * 2)
    expect(pause).not.toHaveBeenCalled()
  })

  it('何も流れていないときは、何もしない', () => {
    vi.useFakeTimers()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true)
    stopVoice()
    vi.advanceTimersByTime(VOICE_FADE_MS * 2)
    expect(pause).not.toHaveBeenCalled()
  })
})
