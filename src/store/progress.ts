import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dayKey, isNextDay } from '../lib/date'
import { levelInfo } from '../lib/level'
import { dailyMissions, EMPTY_COUNTERS, isMissionDone, type Counters } from '../lib/missions'
import type { ChallengeScope } from '../lib/quiz'
import {
  BOSS_REWARD,
  BOSS_TRIES_PER_DAY,
  bossScore,
  COINS_LEARN_AGAIN,
  COINS_LEARN_NEW,
  COINS_WRITE_FIRST,
  hasStamp,
  loginBonusFor,
  QUIZ_STAMP_MIN_LEVEL,
  quizCoins,
  quizXp,
  STAMPS,
  XP_BOSS_TRY,
  XP_LEARN_AGAIN,
  XP_LEARN_NEW,
  XP_WRITE_AGAIN,
  XP_WRITE_FIRST,
  type BossKind,
  type QuizSummary,
} from '../lib/rewards'
import { DEFAULT_QUESTION_COUNT, isBetter, type Best, type Level } from '../lib/score'
import { canBuy, DEFAULT_EQUIPPED, DEFAULT_OWNED, findItem, type Equipped } from '../lib/shop'
import { isCleared, triesLeft, type Clears, type Tries } from '../lib/stages'

export type Settings = {
  readonly sound: boolean
  readonly speech: boolean
  readonly icons: boolean
  readonly timer: boolean
}

export type ChallengeOptions = { readonly count: number; readonly scope: ChallengeScope }

export type Daily = { readonly day: string; readonly counters: Counters; readonly claimed: readonly string[] }

export type LoginBonus = { readonly day: string; readonly streakDay: number; readonly coins: number; readonly claimed: boolean }

type ProgressData = {
  /** 「まなぶ」の はんこ を持っている漢字(覚えた順) */
  readonly learned: readonly string[]
  /** 漢字ごとの はんこ(STAMPS のビットの組み合わせ) */
  readonly stamps: Readonly<Record<string, number>>
  /** これまでにためた経験値(レベルのもと。へらない) */
  readonly xp: number
  /** きせかえに使えるコイン */
  readonly coins: number
  /** たおした ボス(ステージ・そつぎょうしけん) */
  readonly clears: Clears
  /** その日に ボスへ ちょうせん した回数 */
  readonly tries: Tries
  /** ホームで「レベルアップ」を見せおわったレベル */
  readonly seenLevel: number
  readonly streak: { readonly count: number; readonly lastDay: string }
  readonly loginBonus: LoginBonus | null
  readonly daily: Daily
  readonly owned: readonly string[]
  readonly equipped: Equipped
  /** 自己ベスト。キーは bestKey(ヒントの量, 問題の数) */
  readonly bests: Readonly<Record<string, Best>>
  readonly challenge: ChallengeOptions
  readonly settings: Settings
}

/** 何かを達成したときに もらえたもの。画面の えんしゅつ に使う。 */
export type Gain = {
  readonly xp: number
  readonly coins: number
  readonly levelBefore: number
  readonly levelAfter: number
}

export type LearnGain = Gain & { readonly isNew: boolean }
export type WriteGain = Gain & { readonly isNew: boolean }
export type QuizGain = Gain & {
  /** 自己ベストを更新したか(チャレンジのときだけ) */
  readonly improved: boolean
  /** 新しく「とく」の はんこ をもらった漢字 */
  readonly newStamps: readonly string[]
}

export type QuizContext = { readonly level: Level; readonly bestKey?: string }

/** ボスとの たたかい1回ぶんの結果 */
export type BossResult = {
  /** ステージの id、または そつぎょうしけん の id */
  readonly id: string
  readonly kind: BossKind
  /** まちがえずに できた問題の数 */
  readonly perfect: number
  readonly total: number
  /** れんしゅう(回数をつかわない。たおしたことにも ならない) */
  readonly practice: boolean
}

export type BossGain = Gain & {
  readonly score: number
  /** 100点で たおせたか */
  readonly cleared: boolean
  /** はじめて たおしたか(ごほうびが多い) */
  readonly firstClear: boolean
}

type ProgressActions = {
  /** その日はじめて開いたときに呼ぶ。れんぞく日数と ログインボーナス を用意する。 */
  checkIn: (today?: string) => void
  claimLoginBonus: () => number
  completeKanji: (char: string, today?: string) => LearnGain
  completeWriting: (char: string, today?: string) => WriteGain
  finishQuiz: (summary: QuizSummary, context: QuizContext, today?: string) => QuizGain
  /** ボスに ちょうせん する(その日の回数を1つ使う)。もう回数がなければ false。 */
  startBoss: (id: string, kind: BossKind, today?: string) => boolean
  finishBoss: (result: BossResult, today?: string) => BossGain
  /** ホームで「レベルアップ」を見せおわったことを覚える */
  markLevelSeen: () => void
  claimMission: (id: string, today?: string) => number
  buy: (itemId: string) => boolean
  equip: (itemId: string) => void
  setChallengeOptions: (patch: Partial<ChallengeOptions>) => void
  updateSettings: (patch: Partial<Settings>) => void
  reset: () => void
}

export type ProgressState = ProgressData & ProgressActions

const INITIAL: ProgressData = {
  learned: [],
  stamps: {},
  xp: 0,
  coins: 0,
  clears: {},
  tries: { day: '', used: {} },
  seenLevel: 1,
  streak: { count: 0, lastDay: '' },
  loginBonus: null,
  daily: { day: '', counters: EMPTY_COUNTERS, claimed: [] },
  owned: DEFAULT_OWNED,
  equipped: DEFAULT_EQUIPPED,
  bests: {},
  challenge: { count: DEFAULT_QUESTION_COUNT, scope: 'mix' },
  // タイマーは焦りのもとになるので、最初は見せない
  settings: { sound: true, speech: true, icons: true, timer: false },
}

export const STORAGE_KEY = 'kanji-zukan-progress'

/** 日付が変わっていたら、その日の数えなおしを始める。 */
const dailyFor = (daily: Daily, today: string): Daily => (daily.day === today ? daily : { day: today, counters: EMPTY_COUNTERS, claimed: [] })

const addCounters = (daily: Daily, patch: Partial<Counters>): Daily => ({
  ...daily,
  counters: {
    learn: daily.counters.learn + (patch.learn ?? 0),
    learnNew: daily.counters.learnNew + (patch.learnNew ?? 0),
    write: daily.counters.write + (patch.write ?? 0),
    challenge: daily.counters.challenge + (patch.challenge ?? 0),
    firstTry: daily.counters.firstTry + (patch.firstTry ?? 0),
    maxCombo: Math.max(daily.counters.maxCombo, patch.maxCombo ?? 0),
    stage: daily.counters.stage + (patch.stage ?? 0),
  },
})

const gainOf = (xpBefore: number, xp: number, coins: number): Gain => ({
  xp,
  coins,
  levelBefore: levelInfo(xpBefore).level,
  levelAfter: levelInfo(xpBefore + xp).level,
})

type OldState = { learned?: string[]; points?: number; skin?: string; settings?: Settings; challenge?: ChallengeOptions }
type V3State = Partial<Omit<ProgressData, 'clears' | 'tries' | 'seenLevel'>> & { stageStars?: Record<string, number> }

export const STORAGE_VERSION = 4

/** 1つ前の形式(まとめ の星)を今の形式に直す。星をとっていたステージは、ボスを たおしたことにする。 */
function fromV3(old: V3State): ProgressData {
  const { stageStars = {}, ...rest } = old
  return {
    ...INITIAL,
    ...rest,
    daily: { ...INITIAL.daily, ...rest.daily, counters: { ...EMPTY_COUNTERS, ...rest.daily?.counters } },
    clears: Object.fromEntries(Object.keys(stageStars).map((id) => [id, rest.streak?.lastDay ?? ''])),
    seenLevel: levelInfo(rest.xp ?? 0).level,
  }
}

/** 前の形式の保存データを、今の形式に直す。学んだ漢字・経験値・コインは引き継ぐ。 */
function migrate(persisted: unknown, version: number): ProgressData {
  if (version >= STORAGE_VERSION) return persisted as ProgressData
  if (version === 3) return fromV3((persisted ?? {}) as V3State)
  const old = (persisted ?? {}) as OldState
  const learned = old.learned ?? []
  const skinId = `skin:${old.skin ?? 'kami'}`
  const hasSkin = findItem(skinId) !== undefined
  return {
    ...INITIAL,
    learned,
    stamps: Object.fromEntries(learned.map((char) => [char, STAMPS.learn])),
    xp: old.points ?? 0,
    coins: old.points ?? 0,
    seenLevel: levelInfo(old.points ?? 0).level,
    owned: hasSkin ? [...new Set([...DEFAULT_OWNED, skinId])] : DEFAULT_OWNED,
    equipped: hasSkin ? { ...DEFAULT_EQUIPPED, skin: skinId } : DEFAULT_EQUIPPED,
    settings: old.settings ?? INITIAL.settings,
    challenge: old.challenge ?? INITIAL.challenge,
  }
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      checkIn: (today = dayKey()) => {
        const { streak } = get()
        if (streak.lastDay === today) return
        const count = streak.lastDay && isNextDay(streak.lastDay, today) ? streak.count + 1 : 1
        set((state) => ({
          streak: { count, lastDay: today },
          loginBonus: { day: today, streakDay: count, coins: loginBonusFor(count), claimed: false },
          daily: dailyFor(state.daily, today),
        }))
      },

      claimLoginBonus: () => {
        const bonus = get().loginBonus
        if (!bonus || bonus.claimed) return 0
        set((state) => ({ coins: state.coins + bonus.coins, loginBonus: { ...bonus, claimed: true } }))
        return bonus.coins
      },

      completeKanji: (char, today = dayKey()) => {
        const before = get()
        const isNew = !before.learned.includes(char)
        const gain = gainOf(before.xp, isNew ? XP_LEARN_NEW : XP_LEARN_AGAIN, isNew ? COINS_LEARN_NEW : COINS_LEARN_AGAIN)
        set((state) => ({
          learned: isNew ? [...state.learned, char] : state.learned,
          stamps: { ...state.stamps, [char]: (state.stamps[char] ?? 0) | STAMPS.learn },
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          daily: addCounters(dailyFor(state.daily, today), { learn: 1, learnNew: isNew ? 1 : 0 }),
        }))
        return { ...gain, isNew }
      },

      completeWriting: (char, today = dayKey()) => {
        const before = get()
        const isNew = !hasStamp(before.stamps[char], 'write')
        const gain = gainOf(before.xp, isNew ? XP_WRITE_FIRST : XP_WRITE_AGAIN, isNew ? COINS_WRITE_FIRST : 0)
        set((state) => ({
          stamps: { ...state.stamps, [char]: (state.stamps[char] ?? 0) | STAMPS.write },
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          daily: addCounters(dailyFor(state.daily, today), { write: 1 }),
        }))
        return { ...gain, isNew }
      },

      finishQuiz: (summary, context, today = dayKey()) => {
        const before = get()
        const improved = context.bestKey !== undefined && isBetter(summary, before.bests[context.bestKey])
        // 「とく」の はんこ は、もう学んだ漢字を、ヒントの少ない設定で1回で正解したときにもらえる
        const newStamps =
          context.level >= QUIZ_STAMP_MIN_LEVEL
            ? [...new Set(summary.firstTryChars)].filter((c) => before.learned.includes(c) && !hasStamp(before.stamps[c], 'quiz'))
            : []
        const gain = gainOf(before.xp, quizXp(summary), quizCoins(summary))
        set((state) => ({
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          stamps: { ...state.stamps, ...Object.fromEntries(newStamps.map((c) => [c, (state.stamps[c] ?? 0) | STAMPS.quiz])) },
          bests:
            improved && context.bestKey
              ? { ...state.bests, [context.bestKey]: { score: summary.score, timeMs: summary.timeMs } }
              : state.bests,
          daily: addCounters(dailyFor(state.daily, today), {
            challenge: 1,
            firstTry: summary.firstTry,
            maxCombo: summary.maxCombo,
          }),
        }))
        return { ...gain, improved, newStamps }
      },

      startBoss: (id, kind, today = dayKey()) => {
        const { tries } = get()
        if (triesLeft(tries, id, BOSS_TRIES_PER_DAY[kind], today) <= 0) return false
        const used = tries.day === today ? tries.used : {}
        set({ tries: { day: today, used: { ...used, [id]: (used[id] ?? 0) + 1 } } })
        return true
      },

      finishBoss: (result, today = dayKey()) => {
        const before = get()
        const score = bossScore(result.perfect, result.total)
        const cleared = !result.practice && result.perfect >= result.total && result.total > 0
        const firstClear = cleared && !isCleared(before.clears, result.id)
        const reward = BOSS_REWARD[result.kind]
        const gain = gainOf(before.xp, firstClear ? reward.xp : XP_BOSS_TRY, firstClear ? reward.coins : 0)
        set((state) => ({
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          clears: firstClear ? { ...state.clears, [result.id]: today } : state.clears,
          daily: addCounters(dailyFor(state.daily, today), { stage: cleared ? 1 : 0 }),
        }))
        return { ...gain, score, cleared, firstClear }
      },

      markLevelSeen: () => set((state) => ({ seenLevel: levelInfo(state.xp).level })),

      claimMission: (id, today = dayKey()) => {
        const daily = dailyFor(get().daily, today)
        const mission = dailyMissions(today).find((m) => m.id === id)
        if (!mission || daily.claimed.includes(id) || !isMissionDone(mission, daily.counters)) return 0
        set((state) => ({ coins: state.coins + mission.reward, daily: { ...daily, claimed: [...daily.claimed, id] } }))
        return mission.reward
      },

      buy: (itemId) => {
        const item = findItem(itemId)
        const { owned, coins, xp } = get()
        if (!item || !canBuy(item, owned, coins, levelInfo(xp).level)) return false
        set((state) => ({
          coins: state.coins - item.price,
          owned: [...state.owned, item.id],
          // かざり は持っているだけで しまに おかれる。ほかは、買ったらすぐ身につける
          equipped: item.kind === 'deco' ? state.equipped : { ...state.equipped, [item.kind]: item.id },
        }))
        return true
      },

      equip: (itemId) => {
        const item = findItem(itemId)
        if (!item || item.kind === 'deco' || !get().owned.includes(itemId)) return
        set((state) => ({ equipped: { ...state.equipped, [item.kind]: item.id } }))
      },

      setChallengeOptions: (patch) => set((state) => ({ challenge: { ...state.challenge, ...patch } })),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      reset: () => set({ ...INITIAL }),
    }),
    { name: STORAGE_KEY, version: STORAGE_VERSION, migrate },
  ),
)
