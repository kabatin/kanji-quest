import { afterEach, describe, expect, it, vi } from 'vitest'
import { AREAS } from '../data/areas'
import { getKanji, KANJI } from '../data/kanji'
import { fullGlyph } from '../data/strokes'
import {
  DECO_SPOTS,
  decoAngle,
  decoSpot,
  forestPlan,
  groundHeight,
  ISLAND_RADIUS,
  isMovableDeco,
  kanjiPerGrowth,
  MAX_TREES,
  POND,
  settleDeco,
  skyPreset,
  SKY_PRESETS,
  TREE_STAGES,
  treeSpots,
  yieldToDecos,
} from '../features/home/scene/layout'
import { AREA_BOSS_PLAN, areaBoss, bossName, buildBoss, buildParts, buildWrite, canRevive, EXAM_PLAN, cheerLine, REVIVE_MAX_MISSES, examBoss, leafParts, missNotice, PARTS_CHOICE_COUNT, pickForBoss, reviveLeft } from './boss'
import { SHOP_ITEMS, itemName } from './shop'
import { buildWeakQuestions, weakChars, weakOutcome } from './weak'
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

  it('エリアの ボス: えらぶ → 見て書く → 見ないで書く の順に15問。同じ字は2回出ない', () => {
    for (const source of [AREAS[0].bosses[0], AREAS[0].bosses[1], AREAS[5].bosses[1]]) {
      const boss = areaBoss(source, AREAS[source.areaIndex])
      const questions = buildBoss(boss.kanji.map(getKanji), KANJI, boss.plan, seededRng(source.number))
      expect(questions).toHaveLength(15)
      const select = questions.slice(0, 5)
      const model = questions.slice(5, 10)
      const blind = questions.slice(10)
      expect(select.every((q) => q.type !== 'write')).toBe(true)
      expect(model.every((q) => q.type === 'write' && q.model)).toBe(true)
      expect(blind.every((q) => q.type === 'write' && !q.model && q.mode === 'whole')).toBe(true)
      const chars = questions.map((q) => q.kanji.char)
      expect(new Set(chars).size).toBe(15)
      expect(chars.every((c) => source.kanji.includes(c))).toBe(true)
    }
  })

  it('苦手な字(まちがえた回数が のこっている字)は、かならず出る。回数が多い字から先に えらぶ', () => {
    const pool = AREAS[0].bosses[1].kanji.map(getKanji)
    const weak = ['一', '山', '川', '火', '水']
    const misses = Object.fromEntries(weak.map((char, i) => [char, i + 1]))
    for (const seed of [1, 2, 3, 4, 5]) {
      const chars = buildBoss(pool, KANJI, AREA_BOSS_PLAN, seededRng(seed), misses).map((q) => q.kanji.char)
      expect(new Set(chars).size).toBe(15)
      for (const char of weak) expect(chars, `seed ${seed}`).toContain(char)
    }
    // 苦手な字が 問題の数より多いときは、回数が多い字が のこる
    const many = Object.fromEntries(pool.slice(0, 20).map((k, i) => [k.char, i + 1]))
    const picked = pickForBoss(pool, 15, many, seededRng()).map((k) => k.char)
    expect([...picked].sort()).toEqual(pool.slice(5, 20).map((k) => k.char).sort())
    // 苦手な字がなければ、ぜんぶの字から まぜて えらぶ(回によって 出る字が変わる)
    const a = pickForBoss(pool, 15, {}, seededRng(1)).map((k) => k.char)
    const b = pickForBoss(pool, 15, {}, seededRng(2)).map((k) => k.char)
    expect([...a].sort()).not.toEqual([...b].sort())
    // 苦手な字は はじめに かたまらず、まざって出る
    const order = [1, 2, 3, 4, 5, 6].map((seed) => pickForBoss(pool, 15, misses, seededRng(seed)).findIndex((k) => weak.includes(k.char)))
    expect(new Set(order).size).toBeGreaterThan(1)
  })

  it('たたかい の あとの ひとこと: かてば ほめて、まければ はげまして 次に やることを 言う', () => {
    expect(cheerLine({ cleared: true, won: true, practice: false, missed: 0 })).toContain('たおしたね')
    expect(cheerLine({ cleared: false, won: false, practice: false, missed: 2, canRevive: true })).toContain('ふっかつ')
    // ふっかつ できるのは、ほんばんで 3問まで まちがえたとき。1回だけ
    expect(canRevive({ practice: false, revived: false, missedQuestions: REVIVE_MAX_MISSES })).toBe(true)
    expect(canRevive({ practice: false, revived: false, missedQuestions: REVIVE_MAX_MISSES + 1 })).toBe(false)
    expect(canRevive({ practice: false, revived: false, missedQuestions: 0 })).toBe(false)
    expect(canRevive({ practice: true, revived: false, missedQuestions: 1 })).toBe(false)
    expect(canRevive({ practice: false, revived: true, missedQuestions: 1 })).toBe(false)
    expect(cheerLine({ cleared: false, won: true, practice: true, missed: 0 })).toContain('ほんばんも')
    expect(cheerLine({ cleared: false, won: false, practice: false, missed: 1 })).toBe('おしい！ あと 1{字|じ}。れんしゅう すれば たおせるよ')
    expect(cheerLine({ cleared: false, won: false, practice: false, missed: 5 })).toContain('また ちょうせん')
    expect(cheerLine({ cleared: false, won: false, practice: true, missed: 5 })).toContain('れんしゅう してみよう')
  })

  it('まちがいの わく: ふっかつ できる数(REVIVE_MAX_MISSES)に 合わせて、のこりと ひとことを 出す', () => {
    expect(reviveLeft(0)).toBe(REVIVE_MAX_MISSES)
    expect(reviveLeft(1)).toBe(REVIVE_MAX_MISSES - 1)
    expect(reviveLeft(REVIVE_MAX_MISSES)).toBe(0)
    expect(reviveLeft(REVIVE_MAX_MISSES + 2)).toBe(0)
    // 数が わく の中なら、canRevive と おなじ答え
    for (let n = 0; n <= 6; n++) expect(n <= REVIVE_MAX_MISSES).toBe(n === 0 || canRevive({ practice: false, revived: false, missedQuestions: n }))
    expect(missNotice(0)).toBeNull()
    expect(missNotice(1)).toContain('だいじょうぶ')
    expect(missNotice(1)).toContain(`${REVIVE_MAX_MISSES}もん`)
    expect(missNotice(2)).toContain('あと 1もん')
    expect(missNotice(REVIVE_MAX_MISSES)).toContain('ふっかつ できるよ')
    const over = missNotice(REVIVE_MAX_MISSES + 1)
    expect(over).toContain('さいごまで')
    expect(over).not.toMatch(/だめ|ざんねん|しっぱい/)
  })

  it('にがて れんしゅう: 回数の多い字から。見て書く → 見ないで書く の順に出し、2回とも書けた字だけ できた になる', () => {
    expect(weakChars({ 山: 1, 川: 3, 海: 2, 木: 0 }, ['木', '山', '川'])).toEqual(['川', '山'])
    expect(weakChars({}, ['木'])).toEqual([])
    const questions = buildWeakQuestions(['山', '川'].map(getKanji))
    expect(questions.map((q) => `${q.kanji.char}${q.type === 'write' && q.model ? '見' : '無'}`)).toEqual(['山見', '川見', '山無', '川無'])
    expect(questions.every((q) => q.type === 'write' && q.mode === 'whole')).toBe(true)
    expect(weakOutcome(questions, [0, 0, 0, 0])).toEqual({ right: ['山', '川'], wrong: [] })
    expect(weakOutcome(questions, [0, 0, 0, 2])).toEqual({ right: ['山'], wrong: ['川'] })
    expect(weakOutcome(questions, [1, 0, 0, 0])).toEqual({ right: ['川'], wrong: ['山'] })
  })

  it('字が問題の数より少ないときだけ、ひとまわりしてから くり返す', () => {
    const five = AREAS[0].stages[0].kanji.map(getKanji)
    const chars = buildBoss(five, KANJI, AREA_BOSS_PLAN, seededRng()).map((q) => q.kanji.char)
    for (const round of [chars.slice(0, 5), chars.slice(5, 10), chars.slice(10)]) expect(new Set(round).size).toBe(5)
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
    expect(new Set(questions.map((q) => q.kanji.char)).size).toBe(20)
    expect(buildBoss([], KANJI, AREA_BOSS_PLAN)).toEqual([])
  })

  it('ボスの名前は、ボスごとに順番に変わる。中ボスは そこまでの字、ラスボスは エリアの字ぜんぶ', () => {
    expect(bossName(1)).toBe('とめきち')
    expect(bossName(9)).toBe('とめきち')
    expect(bossName(2)).not.toBe(bossName(1))
    const [mid, last] = AREAS[0].bosses
    expect(areaBoss(mid, AREAS[0])).toMatchObject({ id: 'a1-mid', kind: 'mid', title: 'はじまりの もりの ちゅうボス', name: 'とめきち', seed: 1, triesPerDay: 3 })
    expect(areaBoss(mid, AREAS[0]).kanji).toHaveLength(20)
    expect(areaBoss(last, AREAS[0])).toMatchObject({ id: 'a1-last', kind: 'last', title: 'はじまりの もりの ラスボス', name: 'はねぼう', seed: 2 })
    expect(areaBoss(last, AREAS[0]).kanji).toHaveLength(40)
    expect(areaBoss(mid, AREAS[0], { plan: { select: 5, model: 2, blind: 3 }, triesPerDay: 5 })).toMatchObject({ triesPerDay: 5, plan: { select: 5 } })
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

describe('かざり を すきな場所に置く', () => {
  const far = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)

  it('うごかしていない かざり は はじめの場所。にじ は うごかせない', () => {
    expect(decoSpot('hana', {})).toEqual(DECO_SPOTS.hana)
    expect(decoSpot('hana', { hana: { x: 5, z: 1 } })).toEqual({ x: 5, z: 1 })
    expect(isMovableDeco('hana')).toBe(true)
    expect(isMovableDeco('niji')).toBe(false)
    expect(isMovableDeco('nai')).toBe(false)
    expect(decoSpot('niji', { niji: { x: 5, z: 1 } })).toEqual(DECO_SPOTS.niji)
    expect(decoSpot('nai', {})).toBeUndefined()
  })

  it('置ける場所は そのまま。しまの外・広場・池・ほかの かざり の上は、近くの 置ける場所に ずれる', () => {
    expect(settleDeco({ x: 5, z: -3 }, [])).toEqual({ x: 5, z: -3 })
    // しまの外
    expect(Math.hypot(...Object.values(settleDeco({ x: 40, z: 0 }, [])))).toBeLessThan(ISLAND_RADIUS)
    // すみまるの いる まんなか
    expect(Math.hypot(...Object.values(settleDeco({ x: 0.2, z: 0.1 }, [])))).toBeGreaterThan(2.4)
    expect(Math.hypot(...Object.values(settleDeco({ x: 0, z: 0 }, [])))).toBeGreaterThan(2.4)
    // 池の中
    expect(far(settleDeco({ x: POND.x, z: POND.z + 0.2 }, []), POND)).toBeGreaterThan(POND.radius)
    // ほかの かざり の上
    const other = { x: 5, z: -3 }
    expect(far(settleDeco({ x: 5.1, z: -3 }, [other]), other)).toBeGreaterThan(1.3)
    // 数でない値は、まんなか あつかいにして 置ける場所へ
    const fixed = settleDeco({ x: Number.NaN, z: Number.POSITIVE_INFINITY }, [])
    expect(Number.isFinite(fixed.x) && Number.isFinite(fixed.z)).toBe(true)
  })

  it('どこを指しても、しまの中の 置ける場所に おさまる', () => {
    const others = [DECO_SPOTS.bench, DECO_SPOTS.tent, DECO_SPOTS.torii]
    for (let x = -12; x <= 12; x += 1.5) {
      for (let z = -12; z <= 12; z += 1.5) {
        const spot = settleDeco({ x, z }, others)
        expect(Math.hypot(spot.x, spot.z)).toBeLessThanOrEqual(ISLAND_RADIUS - 0.9 + 0.001)
        expect(Math.hypot(spot.x, spot.z)).toBeGreaterThan(2.4)
        expect(far(spot, POND)).toBeGreaterThan(POND.radius)
      }
    }
  })

  it('かざり の向きは 45度きざみ。おかしな値は 0 あつかい', () => {
    expect(decoAngle('hana', {})).toBe(0)
    expect(decoAngle('hana', { hana: 2 })).toBeCloseTo(Math.PI / 2)
    expect(decoAngle('hana', { hana: 8 })).toBe(0)
    expect(decoAngle('hana', { hana: -1 })).toBeCloseTo((Math.PI * 7) / 4)
    expect(decoAngle('hana', { hana: Number.NaN })).toBe(0)
  })

  it('木は かざり と重なると 少し よける。はなれていれば そのまま', () => {
    const tree = { x: 5, z: 0 }
    expect(yieldToDecos(tree, [{ x: -5, z: 0 }])).toEqual(tree)
    expect(far(yieldToDecos(tree, [{ x: 5.2, z: 0 }]), { x: 5.2, z: 0 })).toBeGreaterThan(1.2)
    expect(yieldToDecos(tree, [])).toEqual(tree)
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
