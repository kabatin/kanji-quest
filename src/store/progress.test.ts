import { beforeEach, describe, expect, it } from 'vitest'
import { dailyMissions } from '../lib/missions'
import { BOSS_TRIES_PER_DAY, hasStamp, STAMPS, type QuizSummary } from '../lib/rewards'
import { examId, triesLeft } from '../lib/stages'
import { bestKey } from '../lib/score'
import { STORAGE_KEY, useProgress } from './progress'

const DAY1 = '2026-11-10'
const DAY2 = '2026-11-11'
const DAY4 = '2026-11-13'

const state = () => useProgress.getState()

const quiz = (patch: Partial<QuizSummary> = {}): QuizSummary => ({
  score: 50,
  questionCount: 5,
  mistakes: 0,
  firstTry: 5,
  maxCombo: 5,
  timeMs: 9000,
  firstTryChars: [],
  ...patch,
})

beforeEach(() => {
  state().reset()
})

describe('まなぶ・かく', () => {
  it('はじめて学ぶと 経験値20・コイン5 と「まなぶ」の はんこ、2回目は少なめ', () => {
    expect(state().completeKanji('海', DAY1)).toMatchObject({ xp: 20, coins: 5, isNew: true, levelBefore: 1, levelAfter: 1 })
    expect(state().completeKanji('海', DAY1)).toMatchObject({ xp: 3, coins: 0, isNew: false })
    expect(state().learned).toEqual(['海'])
    expect(state().stamps['海']).toBe(STAMPS.learn)
    expect(state().xp).toBe(23)
    expect(state().coins).toBe(5)
  })

  it('経験値がたまるとレベルが上がったことが分かる。見せおわったレベルは覚えておく', () => {
    state().completeKanji('海', DAY1)
    state().completeKanji('木', DAY1)
    expect(state().completeKanji('池', DAY1)).toMatchObject({ levelBefore: 1, levelAfter: 2 })
    expect(state().seenLevel).toBe(1)
    state().markLevelSeen()
    expect(state().seenLevel).toBe(2)
  })

  it('書けると「かく」の はんこ。コインは はじめての1回だけ', () => {
    expect(state().completeWriting('海', DAY1)).toMatchObject({ xp: 10, coins: 3, isNew: true })
    expect(state().completeWriting('海', DAY1)).toMatchObject({ xp: 2, coins: 0, isNew: false })
    expect(hasStamp(state().stamps['海'], 'write')).toBe(true)
    expect(hasStamp(state().stamps['海'], 'learn')).toBe(false)
  })
})

describe('ふくしゅう・パーツ・あそんだ時間', () => {
  it('はじめて覚えた字は、覚えた日を記録して、次の日の ふくしゅう に入る', () => {
    state().completeKanji('海', DAY1)
    state().completeKanji('海', DAY2)
    expect(state().learnedOn).toEqual({ 海: DAY1 })
    expect(state().reviews).toEqual({ 海: { due: DAY2, step: 0 } })
  })

  it('ふくしゅう: できた字は先へ、まちがえた字は あしたに。ごほうびと まちがいの回数も', () => {
    state().completeKanji('海', DAY1)
    state().completeKanji('池', DAY1)
    const xp = state().xp
    const coins = state().coins
    const gain = state().finishReview({ right: ['海'], wrong: ['池'] }, DAY2)
    expect(gain).toMatchObject({ xp: 4, coins: 6 })
    expect(state().xp).toBe(xp + 4)
    expect(state().coins).toBe(coins + 6)
    expect(state().reviews).toEqual({ 海: { due: '2026-11-14', step: 1 }, 池: { due: '2026-11-12', step: 0 } })
    expect(state().misses).toEqual({ 池: 1 })
    expect(state().daily.counters).toMatchObject({ review: 1, firstTry: 1 })
  })

  it('ボスで まちがえた字も、まちがいの回数に入る', () => {
    state().finishBoss({ id: 's1', kind: 'stage', perfect: 13, total: 15, practice: false, missed: ['海', '池'] }, DAY1)
    expect(state().misses).toEqual({ 海: 1, 池: 1 })
  })

  it('コンプリートした パーツの ごほうびは 1回だけ', () => {
    expect(state().claimPart('ナ')).toMatchObject({ xp: 30, coins: 20 })
    expect(state().claimPart('ナ')).toBeNull()
    expect(state().partClaims).toEqual(['ナ'])
    expect(state().coins).toBe(20)
  })

  it('あそんだ時間を 日ごとに数える', () => {
    state().addPlayMinute(DAY1)
    state().addPlayMinute(DAY1)
    state().addPlayMinute(DAY2)
    expect(state().playMinutes).toEqual({ [DAY1]: 2, [DAY2]: 1 })
  })

  it('ボスの1日の回数は、おうちの かた の設定で変えられる', () => {
    expect([1, 2].map(() => state().startBoss('s1', 'stage', DAY1, 1))).toEqual([true, false])
  })
})

describe('クイズ', () => {
  it('チャレンジ: 点数が経験値になり、よい記録だけ自己ベストになる', () => {
    const key = bestKey(1, 5)
    expect(state().finishQuiz(quiz({ score: 40, firstTry: 3 }), { level: 1, bestKey: key }, DAY1)).toMatchObject({ xp: 13, coins: 2, improved: true })
    expect(state().finishQuiz(quiz({ score: 30, firstTry: 3 }), { level: 1, bestKey: key }, DAY1).improved).toBe(false)
    expect(state().bests[key]).toEqual({ score: 40, timeMs: 9000 })
    expect(state().xp).toBe(23)
  })

  it('「とく」の はんこ は、学んだ字を ★★以上で1回で正解したときだけ', () => {
    state().completeKanji('海', DAY1)
    const summary = quiz({ firstTryChars: ['海', '池', '海'] })
    expect(state().finishQuiz(summary, { level: 1 }, DAY1).newStamps).toEqual([])
    expect(state().finishQuiz(summary, { level: 2 }, DAY1).newStamps).toEqual(['海'])
    expect(hasStamp(state().stamps['海'], 'quiz')).toBe(true)
    expect(state().stamps['池']).toBeUndefined()
    expect(state().finishQuiz(summary, { level: 3 }, DAY1).newStamps).toEqual([])
  })

})

describe('ボス', () => {
  const fight = (perfect: number, practice = false) => state().finishBoss({ id: 's1', kind: 'stage', perfect, total: 15, practice }, DAY1)

  it('ちょうせん は1日3回まで。日付が変わると また ちょうせん できる', () => {
    expect([1, 2, 3, 4].map(() => state().startBoss('s1', 'stage', DAY1))).toEqual([true, true, true, false])
    expect(triesLeft(state().tries, 's1', BOSS_TRIES_PER_DAY.stage, DAY1)).toBe(0)
    // ほかのステージの回数は、べつに数える
    expect(state().startBoss('s2', 'stage', DAY1)).toBe(true)
    expect(state().startBoss('s1', 'stage', DAY2)).toBe(true)
    expect(state().tries).toEqual({ day: DAY2, used: { s1: 1 } })
  })

  it('そつぎょうしけん は1日2回まで', () => {
    const id = examId(1)
    expect([1, 2, 3].map(() => state().startBoss(id, 'exam', DAY1))).toEqual([true, true, false])
  })

  it('1問でも まちがえると 100点にならず、たおせない(少しの経験値だけ)', () => {
    expect(fight(14)).toMatchObject({ score: 93, cleared: false, firstClear: false, xp: 10, coins: 0 })
    expect(state().clears).toEqual({})
    expect(state().daily.counters.stage).toBe(0)
  })

  it('全部できると 100点で たおせて、はじめての1回だけ ごほうびが多い', () => {
    expect(fight(15)).toMatchObject({ score: 100, cleared: true, firstClear: true, xp: 100, coins: 30 })
    expect(state().clears).toEqual({ s1: DAY1 })
    expect(state().daily.counters.stage).toBe(1)
    expect(fight(15)).toMatchObject({ cleared: true, firstClear: false, xp: 10, coins: 0 })
  })

  it('れんしゅう は、100点でも たおしたことに ならない', () => {
    expect(fight(15, true)).toMatchObject({ score: 100, cleared: false, firstClear: false, xp: 10 })
    expect(state().clears).toEqual({})
  })

  it('そつぎょうしけん に ごうかく すると、ごほうびが とても多い', () => {
    const gain = state().finishBoss({ id: examId(1), kind: 'exam', perfect: 20, total: 20, practice: false }, DAY1)
    expect(gain).toMatchObject({ cleared: true, xp: 500, coins: 300 })
    expect(gain.levelAfter).toBeGreaterThan(gain.levelBefore)
  })
})

describe('まいにちの しくみ', () => {
  it('はじめて開いた日は れんぞく1日、ログインボーナスは1回だけ受け取れる', () => {
    state().checkIn(DAY1)
    expect(state().streak).toEqual({ count: 1, lastDay: DAY1 })
    expect(state().loginBonus).toEqual({ day: DAY1, streakDay: 1, coins: 5, claimed: false })
    expect(state().claimLoginBonus()).toBe(5)
    expect(state().claimLoginBonus()).toBe(0)
    expect(state().coins).toBe(5)
    state().checkIn(DAY1)
    expect(state().loginBonus?.claimed).toBe(true)
  })

  it('次の日も開くと れんぞくが のびて、1日あくと 1にもどる', () => {
    state().checkIn(DAY1)
    state().checkIn(DAY2)
    expect(state().streak.count).toBe(2)
    state().checkIn(DAY4)
    expect(state().streak.count).toBe(1)
  })

  it('ミッションは達成してから受け取れて、2回は受け取れない', () => {
    const mission = dailyMissions(DAY1)[0]
    expect(state().claimMission(mission.id, DAY1)).toBe(0)
    useProgress.setState({
      daily: { day: DAY1, counters: { learn: 9, learnNew: 9, write: 9, challenge: 9, firstTry: 9, maxCombo: 9, stage: 9, review: 9 }, claimed: [] },
    })
    expect(state().claimMission(mission.id, DAY1)).toBe(mission.reward)
    expect(state().claimMission(mission.id, DAY1)).toBe(0)
    expect(state().claimMission('nai', DAY1)).toBe(0)
    expect(state().coins).toBe(mission.reward)
  })

  it('その日の数は、日付が変わると数えなおす', () => {
    state().completeKanji('海', DAY1)
    state().completeWriting('海', DAY1)
    state().finishQuiz(quiz({ maxCombo: 3 }), { level: 1 }, DAY1)
    expect(state().daily).toMatchObject({ day: DAY1, counters: { learn: 1, learnNew: 1, write: 1, challenge: 1, firstTry: 5, maxCombo: 3, stage: 0 } })
    state().completeKanji('海', DAY2)
    expect(state().daily).toMatchObject({ day: DAY2, counters: { learn: 1, learnNew: 0, challenge: 0 } })
  })
})

describe('きせかえ', () => {
  it('コインが足りれば買えて、買うとすぐ身につける', () => {
    expect(state().buy('hat:hachimaki')).toBe(false)
    useProgress.setState({ coins: 100 })
    expect(state().buy('hat:hachimaki')).toBe(true)
    expect(state().coins).toBe(20)
    expect(state().equipped.hat).toBe('hat:hachimaki')
    expect(state().buy('hat:hachimaki')).toBe(false)
    expect(state().buy('nai')).toBe(false)
  })

  it('レベルが足りない品は、コインがあっても買えない', () => {
    useProgress.setState({ coins: 9999 })
    expect(state().buy('hat:kanmuri')).toBe(false)
    useProgress.setState({ xp: 60_000 })
    expect(state().buy('hat:kanmuri')).toBe(true)
  })

  it('かざり は買うと しまに おかれる(ぼうし などは そのまま)', () => {
    useProgress.setState({ coins: 100 })
    expect(state().buy('deco:hana')).toBe(true)
    expect(state().owned).toContain('deco:hana')
    expect(state().equipped).toEqual({ skin: 'skin:kami', hat: 'hat:none', bg: 'bg:asa' })
    state().equip('deco:hana')
    expect(state().equipped).toEqual({ skin: 'skin:kami', hat: 'hat:none', bg: 'bg:asa' })
  })

  it('持っている品だけ身につけられる', () => {
    state().equip('skin:kin')
    expect(state().equipped.skin).toBe('skin:kami')
    useProgress.setState({ owned: [...state().owned, 'skin:kin'] })
    state().equip('skin:kin')
    expect(state().equipped.skin).toBe('skin:kin')
  })
})

describe('保存', () => {
  it('設定とチャレンジの選び方を覚えておく。タイマーは最初オフ', () => {
    expect(state().settings.timer).toBe(false)
    state().updateSettings({ sound: false })
    state().setChallengeOptions({ count: 10 })
    expect(state().settings).toEqual({ sound: false, speech: true, icons: true, timer: false })
    expect(state().challenge).toEqual({ count: 10, scope: 'mix' })
  })

  it('端末に保存され、リセットで最初にもどる', () => {
    state().completeKanji('木', DAY1)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.version).toBe(5)
    expect(saved.state.learned).toEqual(['木'])
    state().reset()
    expect(state().learned).toEqual([])
    expect(state().xp).toBe(0)
  })

  it('前の形式(ポイント制)のデータは、学んだ字・ポイント・カードの見た目を引き継ぐ', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { learned: ['海', '木'], points: 70, bests: { '1x5': { score: 60, timeMs: 1 } }, skin: 'sora' }, version: 2 }),
    )
    await useProgress.persist.rehydrate()
    expect(state().learned).toEqual(['海', '木'])
    expect(state().stamps).toEqual({ 海: STAMPS.learn, 木: STAMPS.learn })
    expect(state().xp).toBe(70)
    expect(state().coins).toBe(70)
    expect(state().equipped.skin).toBe('skin:sora')
    expect(state().owned).toContain('skin:sora')
    expect(state().bests).toEqual({})
    expect(state().seenLevel).toBe(2)
  })

  it('1つ前の形式(v4)のデータは、覚えていた字を ふくしゅう に入れ、足りない数を 0 にする', async () => {
    const old = {
      learned: ['一', '二', '三', '四', '五', '六'],
      xp: 300,
      coins: 55,
      daily: { day: DAY1, counters: { learn: 1, learnNew: 1, write: 0, challenge: 0, firstTry: 0, maxCombo: 0, stage: 0 }, claimed: [] },
      settings: { sound: false, speech: true, icons: true, timer: false },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: old, version: 4 }))
    await useProgress.persist.rehydrate()
    expect(Object.keys(state().reviews)).toHaveLength(6)
    expect(state().daily.counters.review).toBe(0)
    expect(state()).toMatchObject({ xp: 300, coins: 55, misses: {}, playMinutes: {}, partClaims: [], learnedOn: {} })
    expect(state().settings.sound).toBe(false)
  })

  it('1つ前の形式(まとめ の星)のデータは、星をとったステージを ボスを たおしたことにして引き継ぐ', async () => {
    const old = {
      learned: ['一', '二'],
      stamps: { 一: 3 },
      xp: 300,
      coins: 55,
      stageStars: { s1: 3, s2: 1 },
      streak: { count: 2, lastDay: DAY1 },
      loginBonus: null,
      daily: { day: DAY1, counters: { learn: 1, learnNew: 1, challenge: 0, firstTry: 0, maxCombo: 0, stage: 0 }, claimed: [] },
      owned: ['skin:kami', 'hat:none', 'bg:asa', 'hat:ribbon'],
      equipped: { skin: 'skin:kami', hat: 'hat:ribbon', bg: 'bg:asa' },
      bests: { '1x5': { score: 60, timeMs: 1 } },
      challenge: { count: 10, scope: 'mix' },
      settings: { sound: false, speech: true, icons: true, timer: false },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: old, version: 3 }))
    await useProgress.persist.rehydrate()
    expect(state().clears).toEqual({ s1: DAY1, s2: DAY1 })
    expect(state()).toMatchObject({ learned: ['一', '二'], xp: 300, coins: 55, bests: old.bests, equipped: old.equipped, settings: old.settings })
    expect(state().daily.counters.write).toBe(0)
    // 覚えていた字は、ふくしゅう に入る
    expect(Object.keys(state().reviews)).toEqual(['一', '二'])
    expect(state().tries).toEqual({ day: '', used: {} })
    expect(state().seenLevel).toBeGreaterThan(1)
  })
})
