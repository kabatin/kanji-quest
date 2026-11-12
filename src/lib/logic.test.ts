import { describe, expect, it } from 'vitest'
import { AREAS, ALL_STAGES } from '../data/areas'
import { KANJI } from '../data/kanji'
import { fullGlyph, getStrokes } from '../data/strokes'
import { dayKey, hashString, isNextDay } from './date'
import { plainText, resolvePieces, resolveText } from './kanjiText'
import { levelInfo, MASCOT_FORMS, mascotGrowth, mascotStage, nextMascotLevel, xpToNext } from './level'
import { dailyMissions, EMPTY_COUNTERS, isMissionDone, MISSION_POOL, missionProgress } from './missions'
import { bossScore, comboBonus, hasStamp, loginBonusFor, quizCoins, quizXp, rankOf, stampCount, STAMPS, type QuizSummary } from './rewards'
import { bestKey, formatTime, isBetter, questionPoints } from './score'
import { buyState, canBuy, COLLECTIBLE_TOTAL, collectedCount, DEFAULT_OWNED, findItem, itemName, ownedDecos, SHOP_ITEMS } from './shop'
import {
  bossAfter,
  bossesOfGrade,
  examId,
  findBoss,
  findStage,
  isBossUnlocked,
  isExamUnlocked,
  isStageUnlocked,
  migrateClears,
  nextStep,
  STAGE_SIZE,
  stagesOfGrade,
  triesLeft,
} from './stages'
import { isTooLong, judgeStroke, matchStroke, pathLength, resample, type Point } from './strokeMatch'

const summary = (patch: Partial<QuizSummary>): QuizSummary => ({
  score: 50,
  questionCount: 5,
  mistakes: 0,
  firstTry: 5,
  maxCombo: 5,
  timeMs: 10_000,
  firstTryChars: [],
  ...patch,
})

describe('date', () => {
  it('きょうの日付を YYYY-MM-DD にする', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('次の日かどうかが分かる(月をまたいでも)', () => {
    expect(isNextDay('2026-01-31', '2026-02-01')).toBe(true)
    expect(isNextDay('2026-02-01', '2026-02-01')).toBe(false)
    expect(isNextDay('2026-02-01', '2026-02-03')).toBe(false)
  })

  it('同じ文字列からは、いつも同じ数ができる', () => {
    expect(hashString('2026-11-11')).toBe(hashString('2026-11-11'))
    expect(hashString('2026-11-11')).not.toBe(hashString('2026-11-12'))
  })
})

describe('level', () => {
  it('経験値がたまるとレベルが上がり、必要な量は少しずつ増える', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 50 })
    expect(levelInfo(49).level).toBe(1)
    expect(levelInfo(50)).toEqual({ level: 2, into: 0, need: 62 })
    expect(levelInfo(117)).toEqual({ level: 3, into: 5, need: 74 })
    expect(xpToNext(3)).toBeGreaterThan(xpToNext(2))
    expect(levelInfo(-5).level).toBe(1)
  })

  it('すみまるは 8つの すがた があり、決まったレベルで変わる', () => {
    expect(MASCOT_FORMS).toHaveLength(8)
    expect([1, 3, 4, 8, 9, 16, 26, 40, 58, 80, 200].map(mascotStage)).toEqual([0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 7])
    expect(nextMascotLevel(1)).toBe(4)
    expect(nextMascotLevel(9)).toBe(16)
    expect(nextMascotLevel(80)).toBeNull()
  })

  it('次の すがた までの進みぐあいが分かる', () => {
    expect(mascotGrowth(4)).toBe(0)
    expect(mascotGrowth(6.5)).toBeCloseTo(0.5)
    expect(mascotGrowth(99)).toBe(1)
  })

  it('6年生まで(およそ 5万5千の経験値)やりきると、レベル 100 の手前になる', () => {
    const { level } = levelInfo(55_000)
    expect(level).toBeGreaterThan(85)
    expect(level).toBeLessThan(100)
  })
})

describe('stages', () => {
  it('240字を5字ずつ48ステージ、8ステージずつ6エリアに分ける', () => {
    expect(AREAS).toHaveLength(6)
    expect(ALL_STAGES).toHaveLength(48)
    for (const stage of ALL_STAGES) expect(stage.kanji).toHaveLength(STAGE_SIZE)
    expect(new Set(ALL_STAGES.flatMap((s) => s.kanji)).size).toBe(KANJI.length)
  })

  it('1年生の字が先で、学年の中では画数の少ない字から出てくる', () => {
    const grade = (char: string) => KANJI.find((k) => k.char === char)?.grade
    expect(ALL_STAGES.slice(0, 16).every((s) => s.kanji.every((c) => grade(c) === 1))).toBe(true)
    expect(ALL_STAGES.slice(16).every((s) => s.kanji.every((c) => grade(c) === 2))).toBe(true)
    expect(ALL_STAGES[0].kanji).toContain('一')
    const strokesOf = (char: string) => fullGlyph(char).strokes.length
    const first = ALL_STAGES.slice(0, 16).flatMap((s) => s.kanji).map(strokesOf)
    expect(first).toEqual([...first].sort((a, b) => a - b))
  })

  it('エリアの最初はいつでも遊べて、あとは前のステージの字を全部覚えると開く', () => {
    const [s1, s2] = AREAS[0].stages
    expect(isStageUnlocked(s1, AREAS, [], {})).toBe(true)
    expect(isStageUnlocked(s2, AREAS, s1.kanji.slice(1), {})).toBe(false)
    expect(isStageUnlocked(s2, AREAS, s1.kanji, {})).toBe(true)
    expect(isStageUnlocked(AREAS[3].stages[0], AREAS, [], {})).toBe(true)
  })

  it('エリアには まんなかに 中ボス、さいごに ラスボスが いる', () => {
    const [area] = AREAS
    expect(AREAS.every((a) => a.bosses.length === 2)).toBe(true)
    const [mid, last] = area.bosses
    expect(mid).toMatchObject({ id: 'a1-mid', spot: 'mid', number: 1, afterStage: 4, areaIndex: 0, grade: 1 })
    expect(last).toMatchObject({ id: 'a1-last', spot: 'last', number: 2, afterStage: 8 })
    // 中ボスは そこまでに出た 20字、ラスボスは エリアの 40字ぜんぶ から出る
    expect(mid.kanji).toEqual(area.stages.slice(0, 4).flatMap((s) => s.kanji))
    expect(last.kanji).toEqual(area.stages.flatMap((s) => s.kanji))
    expect(AREAS[1].bosses.map((b) => b.number)).toEqual([3, 4])
    expect(bossAfter(area.stages[3], AREAS)).toBe(mid)
    expect(bossAfter(area.stages[7], AREAS)).toBe(last)
    expect(bossAfter(area.stages[0], AREAS)).toBeUndefined()
    expect(findBoss(AREAS, 'a2-last').areaIndex).toBe(1)
    expect(() => findBoss(AREAS, 'nai')).toThrow('ボスが見つかりません')
  })

  it('ボスは 出る字を全部覚えると たたかえて、中ボスを たおすと 次のステージが開く', () => {
    const [area] = AREAS
    const [mid, last] = area.bosses
    expect(isBossUnlocked(mid, mid.kanji.slice(1))).toBe(false)
    expect(isBossUnlocked(mid, mid.kanji)).toBe(true)
    expect(isBossUnlocked(last, mid.kanji)).toBe(false)
    const s5 = area.stages[4]
    expect(isStageUnlocked(s5, AREAS, mid.kanji, {})).toBe(false)
    expect(isStageUnlocked(s5, AREAS, mid.kanji, { [mid.id]: 'd' })).toBe(true)
  })

  it('ステージごとの ボスの記録は、そこまで全部クリアしていた ボスだけ たおしたことにする', () => {
    const stage = (n: number) => [`s${n}`, `d${n}`] as const
    const old = Object.fromEntries([...[1, 2, 3, 4, 5, 6].map(stage), ...[9, 10, 12].map(stage), ['exam-g1', 'e']])
    expect(migrateClears(old, AREAS)).toEqual({ 'a1-mid': 'd4', 'exam-g1': 'e' })
    expect(migrateClears({}, AREAS)).toEqual({})
    // もう新しい形の記録は、そのまま
    expect(migrateClears({ 'a1-mid': 'x', 'a1-last': 'y' }, AREAS)).toEqual({ 'a1-mid': 'x', 'a1-last': 'y' })
  })

  it('ステージもエリアも学年ごとに分かれている', () => {
    expect(AREAS.map((a) => a.grade)).toEqual([1, 1, 2, 2, 2, 2])
    expect(stagesOfGrade(AREAS, 1)).toHaveLength(16)
    expect(stagesOfGrade(AREAS, 2).every((s) => s.grade === 2)).toBe(true)
  })

  it('そつぎょうしけん は、学年の字を全部学び、ボスを全部たおすと開く', () => {
    const stages = stagesOfGrade(AREAS, 1)
    const learned = stages.flatMap((s) => s.kanji)
    const clears = Object.fromEntries(bossesOfGrade(AREAS, 1).map((b) => [b.id, 'd']))
    expect(Object.keys(clears)).toEqual(['a1-mid', 'a1-last', 'a2-mid', 'a2-last'])
    expect(isExamUnlocked(AREAS, 1, learned, clears)).toBe(true)
    expect(isExamUnlocked(AREAS, 1, learned.slice(1), clears)).toBe(false)
    expect(isExamUnlocked(AREAS, 1, learned, { ...clears, 'a2-mid': undefined as unknown as string })).toBe(false)
    expect(isExamUnlocked(AREAS, 2, learned, clears)).toBe(false)
    expect(isExamUnlocked(AREAS, 9, learned, clears)).toBe(false)
  })

  it('ちょうせん できる回数は、日付が変わると もとにもどる', () => {
    const tries = { day: '2026-11-11', used: { s1: 2 } }
    expect(triesLeft(tries, 's1', 3, '2026-11-11')).toBe(1)
    expect(triesLeft(tries, 's2', 3, '2026-11-11')).toBe(3)
    expect(triesLeft(tries, 's1', 3, '2026-11-12')).toBe(3)
    expect(triesLeft({ day: '2026-11-11', used: { s1: 5 } }, 's1', 3, '2026-11-11')).toBe(0)
  })

  it('「つづきから」は、まだの字 → 次のステージ → 中ボス → ラスボス → そつぎょうしけん と進む', () => {
    const s1 = ALL_STAGES[0]
    const [mid, last] = AREAS[0].bosses
    expect(nextStep(AREAS, [], {})).toEqual({ kind: 'learn', stage: s1, char: s1.kanji[0] })
    expect(nextStep(AREAS, s1.kanji.slice(0, 2), {})).toEqual({ kind: 'learn', stage: s1, char: s1.kanji[2] })
    // ステージ1の あとには ボスが いないので、そのまま ステージ2へ
    expect(nextStep(AREAS, s1.kanji, {})).toMatchObject({ kind: 'learn', stage: ALL_STAGES[1] })
    expect(nextStep(AREAS, mid.kanji, {})).toEqual({ kind: 'boss', boss: mid })
    expect(nextStep(AREAS, mid.kanji, { [mid.id]: 'd' })).toMatchObject({ kind: 'learn', stage: ALL_STAGES[4] })
    expect(nextStep(AREAS, last.kanji, { [mid.id]: 'd' })).toEqual({ kind: 'boss', boss: last })
    const grade1Kanji = stagesOfGrade(AREAS, 1).flatMap((s) => s.kanji)
    const grade1 = Object.fromEntries(bossesOfGrade(AREAS, 1).map((b) => [b.id, 'd']))
    expect(nextStep(AREAS, grade1Kanji, grade1)).toEqual({ kind: 'exam', grade: 1, areaIndex: 1 })
    expect(nextStep(AREAS, grade1Kanji, { ...grade1, [examId(1)]: 'd' })).toMatchObject({ kind: 'learn', stage: ALL_STAGES[16] })
    const everything = ALL_STAGES.flatMap((s) => s.kanji)
    const allCleared = Object.fromEntries([...AREAS.flatMap((a) => a.bosses.map((b) => b.id)), examId(1), examId(2)].map((id) => [id, 'd']))
    expect(nextStep(AREAS, everything, allCleared)).toEqual({ kind: 'done' })
  })

  it('存在しないステージはエラーになる', () => {
    expect(findStage(AREAS, 's1').number).toBe(1)
    expect(() => findStage(AREAS, 'nai')).toThrow('ステージが見つかりません')
  })
})

describe('missions', () => {
  it('その日のミッションは3つで、同じ日なら同じ、重複しない', () => {
    const today = dailyMissions('2026-11-11')
    expect(today).toHaveLength(3)
    expect(new Set(today.map((m) => m.id)).size).toBe(3)
    expect(dailyMissions('2026-11-11')).toEqual(today)
    const week = Array.from({ length: 7 }, (_, i) => dailyMissions(`2026-11-1${i}`).map((m) => m.id).join())
    expect(new Set(week).size).toBeGreaterThan(1)
  })

  it('数えた数が目標にとどくと達成になる', () => {
    const mission = MISSION_POOL.find((m) => m.id === 'learn3')
    if (!mission) throw new Error('ミッションがありません')
    expect(isMissionDone(mission, EMPTY_COUNTERS)).toBe(false)
    expect(missionProgress(mission, { ...EMPTY_COUNTERS, learn: 2 })).toBe(2)
    expect(isMissionDone(mission, { ...EMPTY_COUNTERS, learn: 3 })).toBe(true)
    expect(missionProgress(mission, { ...EMPTY_COUNTERS, learn: 9 })).toBe(3)
  })
})

describe('rewards', () => {
  it('ランク: 全問1回で かんぺき、8割で すごい、あとは できた', () => {
    expect(rankOf(summary({ firstTry: 5 }))).toBe('kanpeki')
    expect(rankOf(summary({ firstTry: 4 }))).toBe('sugoi')
    expect(rankOf(summary({ firstTry: 3 }))).toBe('dekita')
    expect(rankOf(summary({ firstTry: 0, questionCount: 0 }))).toBe('sugoi')
  })

  it('ボスの点数は、全部できたときだけ 100点になる', () => {
    expect(bossScore(15, 15)).toBe(100)
    expect(bossScore(14, 15)).toBe(93)
    expect(bossScore(199, 200)).toBe(99)
    expect(bossScore(0, 15)).toBe(0)
    expect(bossScore(0, 0)).toBe(0)
  })

  it('チャレンジのコインと経験値は点数に応じて少しずつ。かんぺきならボーナスがつく', () => {
    expect(quizCoins(summary({ score: 60, firstTry: 5 }))).toBe(6)
    expect(quizCoins(summary({ score: 60, firstTry: 3 }))).toBe(3)
    expect(quizXp(summary({ score: 60 }))).toBe(20)
  })

  it('れんぞく正解のボーナスは2回目から増え、上限がある', () => {
    expect([0, 1, 2, 3, 6, 20].map(comboBonus)).toEqual([0, 0, 2, 4, 10, 10])
  })

  it('ログインボーナスは7日でひとまわりする', () => {
    expect(loginBonusFor(1)).toBe(5)
    expect(loginBonusFor(7)).toBe(30)
    expect(loginBonusFor(8)).toBe(5)
    expect(loginBonusFor(0)).toBe(5)
  })

  it('はんこ は3種類を別々に持てる', () => {
    const mask = STAMPS.learn | STAMPS.quiz
    expect(hasStamp(mask, 'learn')).toBe(true)
    expect(hasStamp(mask, 'write')).toBe(false)
    expect(stampCount(mask)).toBe(2)
    expect(stampCount(undefined)).toBe(0)
  })
})

describe('score', () => {
  it('1回で正解なら10点、まちがえた後でも5点もらえる', () => {
    expect([0, 1, 5].map(questionPoints)).toEqual([10, 5, 5])
  })

  it('自己ベストは点数優先、同点ならタイムで決まる', () => {
    expect(isBetter({ score: 50, timeMs: 9000 }, undefined)).toBe(true)
    expect(isBetter({ score: 60, timeMs: 9000 }, { score: 50, timeMs: 1000 })).toBe(true)
    expect(isBetter({ score: 40, timeMs: 1000 }, { score: 50, timeMs: 9000 })).toBe(false)
    expect(isBetter({ score: 50, timeMs: 8000 }, { score: 50, timeMs: 9000 })).toBe(true)
    expect(isBetter({ score: 50, timeMs: 9000 }, { score: 50, timeMs: 9000 })).toBe(false)
  })

  it('自己ベストのキーと、タイムの表示', () => {
    expect(bestKey(2, 10)).toBe('2x10')
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65_400)).toBe('1:05')
  })
})

describe('shop', () => {
  it('ただの品は最初から持っていて、種類ごとに1つずつある', () => {
    expect([...DEFAULT_OWNED].sort()).toEqual(['bg:asa', 'hat:none', 'skin:kami'])
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length)
  })

  it('コインが足りて、まだ持っていない品だけ買える', () => {
    const hat = findItem('hat:mugiwara')
    if (!hat) throw new Error('品がありません')
    expect(canBuy(hat, DEFAULT_OWNED, hat.price - 1, hat.minLevel)).toBe(false)
    expect(canBuy(hat, DEFAULT_OWNED, hat.price, hat.minLevel)).toBe(true)
    expect(canBuy(hat, [...DEFAULT_OWNED, hat.id], 9999, 99)).toBe(false)
    // レベルが足りないうちは、コインがあっても買えない
    expect(buyState(hat, DEFAULT_OWNED, 9999, hat.minLevel - 1)).toBe('locked')
    expect(buyState(hat, DEFAULT_OWNED, 0, hat.minLevel)).toBe('poor')
    expect(buyState(hat, [hat.id], 0, 1)).toBe('owned')
    expect(findItem('nai')).toBeUndefined()
    expect(itemName('skin:sora')).toBe('sora')
  })

  it('品ぞろえ: 4種類あり、高いものほど高いレベルが必要。合計は 2万コインより多い', () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.kind))).toEqual(new Set(['skin', 'hat', 'bg', 'deco']))
    expect(COLLECTIBLE_TOTAL).toBeGreaterThanOrEqual(30)
    expect(SHOP_ITEMS.reduce((sum, i) => sum + i.price, 0)).toBeGreaterThan(20_000)
    for (const kind of ['skin', 'hat', 'bg', 'deco']) {
      const items = SHOP_ITEMS.filter((i) => i.kind === kind && i.price > 0)
      expect(items.map((i) => i.price)).toEqual([...items.map((i) => i.price)].sort((a, b) => a - b))
      expect(items.map((i) => i.minLevel)).toEqual([...items.map((i) => i.minLevel)].sort((a, b) => a - b))
    }
  })

  it('持っている かざり と、あつめた数が分かる', () => {
    const owned = [...DEFAULT_OWNED, 'deco:hana', 'hat:ribbon', 'deco:torii']
    expect(ownedDecos(owned)).toEqual(['hana', 'torii'])
    expect(collectedCount(owned)).toBe(3)
    expect(collectedCount(DEFAULT_OWNED)).toBe(0)
  })
})

describe('strokeMatch', () => {
  const stroke = (char: string, index: number) => getStrokes(fullGlyph(char))[index].pts as readonly Point[]

  it('お手本どおりに書けば合格、少しずれても合格', () => {
    const target = stroke('木', 0)
    expect(matchStroke(target, target)).toBe(true)
    expect(matchStroke(target.map(([x, y]) => [x + 6, y - 5] as const), target)).toBe(true)
  })

  it('逆向き・別の場所・短すぎる線は不合格', () => {
    const target = stroke('木', 0)
    expect(matchStroke([...target].reverse(), target)).toBe(false)
    expect(matchStroke(stroke('木', 1), target)).toBe(false)
    expect(matchStroke(target.slice(0, 2), target)).toBe(false)
    expect(matchStroke([target[0]], target)).toBe(false)
  })

  it('書きはじめ と 書きおわり だけ合わせて、とちゅうで ぐるぐる 書きなぐった線は不合格', () => {
    const target = stroke('木', 0)
    const [start, end] = [target[0], target[target.length - 1]]
    // お手本の通り道を 3回 行ったり来たりしてから、書きおわり で はなす
    const back = [...target].reverse()
    const scribble = [...target, ...back, ...target, ...back, ...target]
    expect(scribble[0]).toEqual(start)
    expect(scribble[scribble.length - 1]).toEqual(end)
    expect(isTooLong(scribble, target)).toBe(true)
    expect(matchStroke(scribble, target)).toBe(false)
    const targets = getStrokes(fullGlyph('木')).map((s) => s.pts as readonly Point[])
    expect(judgeStroke(scribble, targets, 0)).not.toBe('ok')
    // 通り道の上を 小さく ぐるぐる しながら進むと、場所は合っているが 長すぎる
    const loops = target.flatMap(([x, y]) => [[x, y], [x + 4, y - 6], [x - 4, y - 6], [x - 4, y + 6], [x + 4, y + 6], [x, y]] as Point[])
    expect(matchStroke(loops, target)).toBe(false)
    expect(judgeStroke(loops, targets, 0)).toBe('long')
    // 手が ふるえて 少し長くなった線は、合格のまま
    const shaky = target.flatMap(([x, y], i) => [[x, y + (i % 2 === 0 ? 2 : -2)], [x + 2, y + (i % 2 === 0 ? -2 : 2)]] as Point[])
    expect(isTooLong(shaky, target)).toBe(false)
    expect(matchStroke(shaky, target)).toBe(true)
  })

  it('どの漢字の画も、お手本どおりに なぞれば 長すぎ にならない', () => {
    for (const kanji of KANJI) {
      for (const s of getStrokes(fullGlyph(kanji.char))) expect(matchStroke(s.pts, s.pts), kanji.char).toBe(true)
    }
  })

  it('書き順: 次の画なら ok、あとの画を先に書くと order、どれでもなければ shape', () => {
    const targets = getStrokes(fullGlyph('木')).map((s) => s.pts as readonly Point[])
    expect(judgeStroke(targets[0], targets, 0)).toBe('ok')
    expect(judgeStroke(targets[1], targets, 0)).toBe('order')
    expect(judgeStroke(targets[0], targets, 1)).toBe('shape')
    expect(judgeStroke([[1, 1], [2, 2], [3, 3]], targets, 0)).toBe('shape')
    expect(judgeStroke(targets[0], targets, 9)).toBe('shape')
  })

  it('点の少ない線も、等間隔にとりなおして比べる', () => {
    const line: Point[] = [[0, 0], [10, 0]]
    expect(resample(line, 3)).toEqual([[0, 0], [5, 0], [10, 0]])
    expect(resample([[3, 3], [3, 3]], 2)).toEqual([[3, 3], [3, 3]])
    expect(resample([], 3)).toEqual([])
    expect(pathLength(line)).toBe(10)
  })

  it('どの漢字の画も、通り道の点を8つ持っている', () => {
    for (const kanji of KANJI) {
      for (const s of getStrokes(fullGlyph(kanji.char))) expect(s.pts).toHaveLength(8)
    }
  })
})

describe('kanjiText', () => {
  const markup = '{人|ひと}が {木|き}に もたれて ひと{休|やす}み。'

  it('覚えていない漢字は ひらがなのまま', () => {
    expect(resolveText(markup, new Set())).toBe('ひとが きに もたれて ひとやすみ。')
    expect(plainText(markup)).toBe('ひとが きに もたれて ひとやすみ。')
  })

  it('覚えた漢字だけが漢字になる', () => {
    expect(resolveText(markup, new Set(['木']))).toBe('ひとが 木に もたれて ひとやすみ。')
    expect(resolveText(markup, new Set(['人', '木', '休']))).toBe('人が 木に もたれて ひと休み。')
  })

  it('熟語は、全部の漢字を覚えてから漢字になる', () => {
    expect(resolveText('{今日|きょう}は {1本|1ぽん}', new Set(['今']))).toBe('きょうは 1ぽん')
    expect(resolveText('{今日|きょう}は {1本|1ぽん}', new Set(['今', '日', '本']))).toBe('今日は 1本')
  })

  it('漢字になった部分に印がつく', () => {
    expect(resolvePieces('あ{木|き}い', new Set(['木']))).toEqual([
      { text: 'あ', isKanji: false },
      { text: '木', isKanji: true },
      { text: 'い', isKanji: false },
    ])
    expect(resolvePieces('しるしなし', new Set())).toEqual([{ text: 'しるしなし', isKanji: false }])
  })
})
