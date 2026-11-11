import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dayKey, isNextDay } from '../lib/date'
import { levelInfo } from '../lib/level'
import { dailyMissions, EMPTY_COUNTERS, isMissionDone, type Counters } from '../lib/missions'
import type { ChallengeScope } from '../lib/quiz'
import {
  COINS_LEARN_AGAIN,
  COINS_LEARN_NEW,
  COINS_STAGE_FIRST_CLEAR,
  COINS_WRITE_FIRST,
  hasStamp,
  loginBonusFor,
  QUIZ_STAMP_MIN_LEVEL,
  quizCoins,
  stageStarsFor,
  STAMPS,
  XP_LEARN_AGAIN,
  XP_LEARN_NEW,
  XP_WRITE,
  type QuizSummary,
} from '../lib/rewards'
import { DEFAULT_QUESTION_COUNT, isBetter, type Best, type Level } from '../lib/score'
import { canBuy, DEFAULT_EQUIPPED, DEFAULT_OWNED, findItem, type Equipped } from '../lib/shop'

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
  /** ステージの まとめ でとった星(1〜3) */
  readonly stageStars: Readonly<Record<string, number>>
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
  /** ステージの まとめ でとった星。まとめ でなければ 0 */
  readonly stageStars: number
  readonly stageFirstClear: boolean
}

export type QuizContext = { readonly level: Level; readonly bestKey?: string; readonly stageId?: string }

type ProgressActions = {
  /** その日はじめて開いたときに呼ぶ。れんぞく日数と ログインボーナス を用意する。 */
  checkIn: (today?: string) => void
  claimLoginBonus: () => number
  completeKanji: (char: string, today?: string) => LearnGain
  completeWriting: (char: string, today?: string) => WriteGain
  finishQuiz: (summary: QuizSummary, context: QuizContext, today?: string) => QuizGain
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
  stageStars: {},
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

/** 前の形式(ポイント制)の保存データを、今の形式に直す。学んだ漢字とポイントは引き継ぐ。 */
function migrate(persisted: unknown, version: number): ProgressData {
  if (version >= 3) return persisted as ProgressData
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
        const gain = gainOf(before.xp, XP_WRITE, isNew ? COINS_WRITE_FIRST : 0)
        set((state) => ({
          stamps: { ...state.stamps, [char]: (state.stamps[char] ?? 0) | STAMPS.write },
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          daily: dailyFor(state.daily, today),
        }))
        return { ...gain, isNew }
      },

      finishQuiz: (summary, context, today = dayKey()) => {
        const before = get()
        const stars = context.stageId ? stageStarsFor(summary) : 0
        const stageFirstClear = context.stageId !== undefined && (before.stageStars[context.stageId] ?? 0) === 0
        const improved = context.bestKey !== undefined && isBetter(summary, before.bests[context.bestKey])
        // 「とく」の はんこ は、もう学んだ漢字を、ヒントの少ない設定で1回で正解したときにもらえる
        const newStamps =
          context.level >= QUIZ_STAMP_MIN_LEVEL
            ? [...new Set(summary.firstTryChars)].filter((c) => before.learned.includes(c) && !hasStamp(before.stamps[c], 'quiz'))
            : []
        const gain = gainOf(before.xp, summary.score, quizCoins(summary) + (stageFirstClear ? COINS_STAGE_FIRST_CLEAR : 0))
        set((state) => ({
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          stamps: { ...state.stamps, ...Object.fromEntries(newStamps.map((c) => [c, (state.stamps[c] ?? 0) | STAMPS.quiz])) },
          stageStars: context.stageId
            ? { ...state.stageStars, [context.stageId]: Math.max(state.stageStars[context.stageId] ?? 0, stars) }
            : state.stageStars,
          bests:
            improved && context.bestKey
              ? { ...state.bests, [context.bestKey]: { score: summary.score, timeMs: summary.timeMs } }
              : state.bests,
          daily: addCounters(dailyFor(state.daily, today), {
            challenge: context.stageId ? 0 : 1,
            stage: context.stageId ? 1 : 0,
            firstTry: summary.firstTry,
            maxCombo: summary.maxCombo,
          }),
        }))
        return { ...gain, improved, newStamps, stageStars: stars, stageFirstClear }
      },

      claimMission: (id, today = dayKey()) => {
        const daily = dailyFor(get().daily, today)
        const mission = dailyMissions(today).find((m) => m.id === id)
        if (!mission || daily.claimed.includes(id) || !isMissionDone(mission, daily.counters)) return 0
        set((state) => ({ coins: state.coins + mission.reward, daily: { ...daily, claimed: [...daily.claimed, id] } }))
        return mission.reward
      },

      buy: (itemId) => {
        const item = findItem(itemId)
        const { owned, coins } = get()
        if (!item || !canBuy(item, owned, coins)) return false
        set((state) => ({
          coins: state.coins - item.price,
          owned: [...state.owned, item.id],
          equipped: { ...state.equipped, [item.kind]: item.id },
        }))
        return true
      },

      equip: (itemId) => {
        const item = findItem(itemId)
        if (!item || !get().owned.includes(itemId)) return
        set((state) => ({ equipped: { ...state.equipped, [item.kind]: item.id } }))
      },

      setChallengeOptions: (patch) => set((state) => ({ challenge: { ...state.challenge, ...patch } })),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      reset: () => set({ ...INITIAL }),
    }),
    { name: STORAGE_KEY, version: 3, migrate },
  ),
)
