import { beforeEach, describe, expect, it } from 'vitest'
import { dailyMissions } from '../lib/missions'
import { BOSS_REWARD, BOSS_TRIES_PER_DAY, hasStamp, STAMPS, type QuizSummary } from '../lib/rewards'
import { examId, isCleared, triesLeft } from '../lib/stages'
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

  it('ふくしゅう した字の数を 日ごとに数える。ほかの あそび で できた字は、日が来ていれば ふくしゅう したことに なる', () => {
    useProgress.setState({ learned: ['海', '池', '山'], reviews: { 海: { due: DAY1, step: 0 }, 池: { due: DAY1, step: 0 }, 山: { due: DAY2, step: 0 } } })
    state().finishReview({ right: ['海'], wrong: [] }, DAY1)
    expect(state().reviewDone).toEqual({ day: DAY1, count: 1 })
    // ボスで 池 と 山 を まちがえずに とけた: 日が来ている 池 だけ 次の間隔へ(数には 入れない)
    state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 15, total: 15, practice: true, missed: [], solved: ['池', '山'] }, DAY1)
    expect(state().reviews['池']).toEqual({ due: DAY4, step: 1 })
    expect(state().reviews['山']).toEqual({ due: DAY2, step: 0 })
    expect(state().reviewDone).toEqual({ day: DAY1, count: 1 })
    // 日が変わると、数え直す
    state().finishReview({ right: ['山'], wrong: [] }, DAY2)
    expect(state().reviewDone).toEqual({ day: DAY2, count: 1 })
  })

  it('ボスで まちがえた字も、まちがいの回数に入る', () => {
    state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 13, total: 15, practice: false, missed: ['海', '池'] }, DAY1)
    expect(state().misses).toEqual({ 海: 1, 池: 1 })
  })

  it('ボスで まちがえずに できた字は、まちがいの回数が へる(苦手で なくなる)', () => {
    useProgress.setState({ misses: { 海: 2, 池: 1, 山: 1 } })
    state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 14, total: 15, practice: true, missed: ['山'], solved: ['海', '池', '木'] }, DAY1)
    expect(state().misses).toEqual({ 海: 1, 山: 2 })
  })

  it('にがて れんしゅう: 書けた字は 回数が へり、まちがえても ふえない', () => {
    useProgress.setState({ misses: { 海: 2, 池: 1, 山: 1 }, xp: 0, coins: 0 })
    const gain = state().finishWeak({ right: ['海', '池'], wrong: ['山'] }, DAY1)
    expect(gain).toMatchObject({ xp: 8, coins: 2 })
    expect(state().misses).toEqual({ 海: 1, 山: 1 })
    expect(state().daily.counters.firstTry).toBe(2)
    expect(state().finishWeak({ right: [], wrong: ['山'] }, DAY1)).toMatchObject({ xp: 0, coins: 0 })
    expect(state().misses).toEqual({ 海: 1, 山: 1 })
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
    expect([1, 2].map(() => state().startBoss('a1-mid', 'mid', DAY1, 1))).toEqual([true, false])
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
  const fight = (perfect: number, practice = false) => state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect, total: 15, practice }, DAY1)

  it('ふっかつ戦: ぜんぶ できたら たおせる。コインは半分。にげられても 苦手の回数・たたかった回数は ふえない', () => {
    useProgress.setState({ xp: 0, coins: 0, misses: { 海: 1, 池: 1 } })
    const stage = state().daily.counters.stage
    // ふっかつ ならず(2問のうち 1問を また まちがえた)
    const lost = state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 1, total: 2, practice: false, revive: true, missed: ['海'], solved: ['池'] }, DAY1)
    expect(lost).toMatchObject({ cleared: false, xp: 0, coins: 0 })
    expect(state().misses).toEqual({ 海: 1 })
    // ふっかつ せいこう
    const won = state().finishBoss({ id: 'a1-mid', kind: 'mid', perfect: 2, total: 2, practice: false, revive: true, missed: [], solved: ['海'] }, DAY1)
    expect(won).toMatchObject({ cleared: true, firstClear: true, xp: BOSS_REWARD.mid.xp, coins: Math.floor(BOSS_REWARD.mid.coins / 2) })
    expect(isCleared(state().clears, 'a1-mid')).toBe(true)
    expect(state().misses).toEqual({})
    expect(state().daily.counters.stage).toBe(stage)
  })

  it('ちょうせん は1日3回まで。日付が変わると また ちょうせん できる', () => {
    expect([1, 2, 3, 4].map(() => state().startBoss('a1-mid', 'mid', DAY1))).toEqual([true, true, true, false])
    expect(triesLeft(state().tries, 'a1-mid', BOSS_TRIES_PER_DAY.mid, DAY1)).toBe(0)
    // ほかの ボスの回数は、べつに数える
    expect(state().startBoss('a1-last', 'last', DAY1)).toBe(true)
    expect(state().startBoss('a1-mid', 'mid', DAY2)).toBe(true)
    expect(state().tries).toEqual({ day: DAY2, used: { 'a1-mid': 1 } })
  })

  it('そつぎょうしけん は1日2回まで', () => {
    const id = examId(1)
    expect([1, 2, 3].map(() => state().startBoss(id, 'exam', DAY1))).toEqual([true, true, false])
  })

  it('1問でも まちがえると 100点にならず、たおせない(少しの経験値だけ)', () => {
    expect(fight(14)).toMatchObject({ score: 93, cleared: false, firstClear: false, xp: 10, coins: 0 })
    expect(state().clears).toEqual({})
    // ミッション「ボスと たたかう」は、まけても さいごまで やれば数える
    expect(state().daily.counters.stage).toBe(1)
  })

  it('全部できると 100点で たおせて、はじめての1回だけ ごほうびが多い', () => {
    expect(fight(15)).toMatchObject({ score: 100, cleared: true, firstClear: true, xp: 300, coins: 90 })
    expect(state().clears).toEqual({ 'a1-mid': DAY1 })
    expect(state().daily.counters.stage).toBe(1)
    expect(fight(15)).toMatchObject({ cleared: true, firstClear: false, xp: 10, coins: 0 })
  })

  it('れんしゅう は、100点でも たおしたことに ならない', () => {
    expect(fight(15, true)).toMatchObject({ score: 100, cleared: false, firstClear: false, xp: 10 })
    expect(state().clears).toEqual({})
  })

  it('ラスボスは 中ボスより ごほうびが多い', () => {
    const gain = state().finishBoss({ id: 'a1-last', kind: 'last', perfect: 15, total: 15, practice: false }, DAY1)
    expect(gain).toMatchObject({ cleared: true, xp: 500, coins: 150 })
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

  it('持っている かざり は すきな場所に置けて、置けない場所は 近くに ずれる', () => {
    expect(state().placeDeco('hana', { x: 5, z: -3 })).toBeNull()
    useProgress.setState({ owned: [...state().owned, 'deco:hana', 'deco:bench', 'deco:niji'] })
    expect(state().placeDeco('hana', { x: 5, z: -3 })).toEqual({ x: 5, z: -3 })
    expect(state().decoSpots).toEqual({ hana: { x: 5, z: -3 } })
    // ほかの かざり の上には置けない(少し はなれた所になる)
    const bench = state().placeDeco('bench', { x: 5, z: -3 })
    expect(Math.hypot((bench?.x ?? 0) - 5, (bench?.z ?? 0) + 3)).toBeGreaterThan(1.3)
    // にじ・知らない名前は うごかせない
    expect(state().placeDeco('niji', { x: 1, z: 1 })).toBeNull()
    expect(state().placeDeco('nai', { x: 1, z: 1 })).toBeNull()
    expect(Object.keys(state().decoSpots)).toEqual(['hana', 'bench'])
  })

  it('かざり は 45度ずつ まわせて、8回で ひとまわりする', () => {
    state().turnDeco('hana')
    expect(state().decoTurns).toEqual({})
    useProgress.setState({ owned: [...state().owned, 'deco:hana', 'deco:niji'] })
    state().turnDeco('hana')
    state().turnDeco('hana')
    expect(state().decoTurns).toEqual({ hana: 2 })
    for (let i = 0; i < 6; i += 1) state().turnDeco('hana')
    expect(state().decoTurns).toEqual({ hana: 0 })
    state().turnDeco('niji')
    expect(state().decoTurns).toEqual({ hana: 0 })
  })

  it('かざり は しまえて、また出せる。出すときは ほかの かざり と重ならない場所になる', () => {
    useProgress.setState({ owned: [...state().owned, 'deco:hana', 'deco:bench'] })
    state().placeDeco('hana', { x: 5, z: -3 })
    state().storeDeco('hana', true)
    state().storeDeco('hana', true)
    expect(state().decoStored).toEqual(['hana'])
    // しまっている間は、ほかの かざり を その場所に置ける
    expect(state().placeDeco('bench', { x: 5, z: -3 })).toEqual({ x: 5, z: -3 })
    state().storeDeco('hana', false)
    expect(state().decoStored).toEqual([])
    const hana = state().decoSpots.hana
    expect(Math.hypot(hana.x - 5, hana.z + 3)).toBeGreaterThan(1.3)
    // 持っていない かざり は しまえない
    state().storeDeco('tent', true)
    state().storeDeco('nai', true)
    expect(state().decoStored).toEqual([])
    // にじ は うごかせないが、しまう・だす は できる(場所は 変わらない)
    useProgress.setState({ owned: [...state().owned, 'deco:niji'] })
    state().storeDeco('niji', true)
    expect(state().decoStored).toEqual(['niji'])
    state().storeDeco('niji', false)
    expect(state().decoStored).toEqual([])
    expect(state().decoSpots.niji).toBeUndefined()
  })

  it('ずかん で見た字の数を覚える。この しくみ の前から覚えていた字は、もう見たことにする', async () => {
    state().completeKanji('木', DAY1)
    state().completeKanji('山', DAY1)
    expect(state().zukanSeen).toBe(0)
    state().markZukanSeen()
    expect(state().zukanSeen).toBe(2)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['一', '二', '三'] }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().zukanSeen).toBe(3)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['一', '二', '三'], zukanSeen: 1, decoTurns: { hana: 99 }, decoStored: 'x' }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state()).toMatchObject({ zukanSeen: 1, decoTurns: {}, decoStored: [] })
  })

  it('保存してあった かざり の場所が こわれていたら、はじめの場所にもどす', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['木'], decoSpots: { hana: { x: 'abc', z: 1 } } }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().decoSpots).toEqual({})
    expect(state().learned).toEqual(['木'])
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { decoSpots: { hana: { x: 4, z: 1 } } }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().decoSpots).toEqual({ hana: { x: 4, z: 1 } })
  })

  it('持っている品だけ身につけられる', () => {
    state().equip('skin:kin')
    expect(state().equipped.skin).toBe('skin:kami')
    useProgress.setState({ owned: [...state().owned, 'skin:kin'] })
    state().equip('skin:kin')
    expect(state().equipped.skin).toBe('skin:kin')
  })
})

describe('きょうの チャレンジ', () => {
  const LEARNED = ['一', '二', '三', '四', '五']
  const daily = (patch: Partial<QuizSummary> = {}) => state().finishQuiz(quiz({ score: 60, firstTry: 5, ...patch }), { level: 1, bestKey: bestKey(1, 5), daily: true }, DAY1)

  it('その日の字は、何度ひらいても同じ。日がかわると新しくなる', () => {
    useProgress.setState({ learned: LEARNED })
    const first = state().startChallenge('p1', DAY1)
    expect(first).toHaveLength(5)
    expect(state().startChallenge('p1', DAY1)).toEqual(first)
    expect(state().challengeDay).toMatchObject({ day: DAY1, level: 1, done: false })
  })

  it('1回目だけ ごほうびが出る。2回目からは自己ベストに挑戦するだけ', () => {
    useProgress.setState({ learned: LEARNED })
    state().startChallenge('p1', DAY1)
    expect(daily()).toMatchObject({ xp: 20, coins: 6, improved: true })
    const again = daily({ score: 80 })
    expect(again).toMatchObject({ xp: 0, coins: 0, improved: true })
    expect(state().xp).toBe(20)
    expect(state().bests[bestKey(1, 5)]?.score).toBe(80)
  })

  it('全問1回で正解すると次の日は1つ上。その日のうちは かわらない。2回目の結果では かわらない', () => {
    useProgress.setState({ learned: LEARNED })
    state().startChallenge('p1', DAY1)
    daily()
    daily({ firstTry: 0 })
    expect(state().challengeDay).toMatchObject({ day: DAY1, level: 1, next: 2, done: true })
    state().startChallenge('p1', DAY2)
    expect(state().challengeDay).toMatchObject({ day: DAY2, level: 2, done: false })
  })

  it('チャレンジの回数は、ミッション用に数える(古い きろくのまま 使える)', () => {
    daily()
    expect(state().daily.counters.challenge).toBe(1)
  })
})

describe('保存', () => {
  it('設定を覚えておく。タイマーは最初オフ', () => {
    expect(state().settings.timer).toBe(false)
    state().updateSettings({ sound: false })
    expect(state().settings).toMatchObject({ sound: false, music: true, speech: true, icons: true, timer: false, handed: 'right', reduceMotion: false })
  })

  it('きょうの チャレンジの きろくは、なかった保存データでも はじめの状態から読める', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['一'], bests: { '1x5': { score: 60, timeMs: 1 } }, challenge: { count: 10, scope: 'mix' } }, version: 6 }))
    await useProgress.persist.rehydrate()
    expect(state().challengeDay).toEqual({ day: '', level: 1, next: 1, done: false, chars: [] })
    expect(state().bests).toEqual({ '1x5': { score: 60, timeMs: 1 } })
  })

  it('端末に保存され、リセットで最初にもどる', () => {
    state().completeKanji('木', DAY1)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(saved.version).toBe(6)
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

  it('ステージごとに ボスが いたころ(v5)の記録は、エリアの ボスの記録に直す', async () => {
    const stage = (n: number) => [`s${n}`, DAY1] as const
    // エリア1は ステージ 1〜5 まで、エリア2は 9〜16 を全部クリアしていた
    const clears = Object.fromEntries([...[1, 2, 3, 4, 5].map(stage), ...[9, 10, 11, 12, 13, 14, 15, 16].map(stage), ['exam-g1', DAY2]])
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { learned: ['一'], xp: 300, coins: 55, clears }, version: 5 }))
    await useProgress.persist.rehydrate()
    expect(state().clears).toEqual({ 'a1-mid': DAY1, 'a2-mid': DAY1, 'a2-last': DAY1, 'exam-g1': DAY2 })
    expect(state()).toMatchObject({ learned: ['一'], xp: 300, coins: 55 })
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
    // 星をとっていたのは ステージ 2 まで。中ボス(ステージ 4 の あと)は まだ たおしていない
    expect(state().clears).toEqual({})
    expect(state()).toMatchObject({ learned: ['一', '二'], xp: 300, coins: 55, bests: old.bests, equipped: old.equipped, settings: old.settings })
    expect(state().daily.counters.write).toBe(0)
    // 覚えていた字は、ふくしゅう に入る
    expect(Object.keys(state().reviews)).toEqual(['一', '二'])
    expect(state().tries).toEqual({ day: '', used: {} })
    expect(state().seenLevel).toBeGreaterThan(1)
  })
})
