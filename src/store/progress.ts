import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dayKey, isNextDay } from '../lib/date'
import {
  beginChallengeDay,
  completeChallengeDay,
  INITIAL_CHALLENGE_DAY,
  isChallengeDone,
  pickDailyChars,
  type ChallengeDay,
} from '../lib/dailyChallenge'
import { answerDaysSchema, answerLogSchema, type AnswerInput } from '../lib/answerLog'
import { backfillReviews, creditReviews, reviewAnswersOf, scheduleNew, type ReviewDone } from '../lib/review'
import type { WriteReport } from '../lib/strokeHint'
import { levelInfo } from '../lib/level'
import { dailyMissions, EMPTY_COUNTERS, isMissionDone, type Counters } from '../lib/missions'
import { loadProfiles, PROGRESS_KEY, storageKeyFor } from '../lib/profiles'
import {
  BOSS_REWARD,
  BOSS_TRIES_PER_DAY,
  bossScore,
  COINS_LEARN_AGAIN,
  COINS_LEARN_NEW,
  COINS_PART_COMPLETE,
  COINS_REVIEW_DONE,
  COINS_REVIEW_RIGHT,
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
  XP_PART_COMPLETE,
  XP_REVIEW_RIGHT,
  XP_WRITE_AGAIN,
  XP_WRITE_FIRST,
  type BossKind,
  type QuizSummary,
} from '../lib/rewards'
import { bindAppearance } from '../lib/appearance'
import { sanitizeHanded, type Handed } from '../lib/handed'
import { INITIAL_INTRO, markSeen, sanitizeIntro, skipIntro, type IntroState, type IntroTip } from '../lib/intro'
import { sanitizeVolume, type Volume } from '../lib/volume'
import { isBetter, type Best, type Level } from '../lib/score'
import { canBuy, DEFAULT_EQUIPPED, DEFAULT_OWNED, findItem, ownedDecos, type Equipped } from '../lib/shop'
import { AREAS } from '../data/areas'
import { KANJI } from '../data/kanji'
import { decoSpot, isDeco, isMovableDeco, settleDeco, TURN_STEPS, type DecoSpots, type DecoTurns, type Spot } from '../features/home/scene/layout'
import { isCleared, migrateClears, triesLeft, type Clears, type Tries } from '../lib/stages'
import { homeworkChars } from '../lib/homework'
import { handsSchema } from '../lib/handwriting'
import { addPlayMinutes, applyReview, EMPTY_RECORDS, updateMisses, withAnswers, withHands, type Records } from './records'
import { useParent } from './parent'

export type Settings = {
  readonly sound: boolean
  /** うしろで流れる音楽 */
  readonly music: boolean
  readonly speech: boolean
  /** おと・おんがく・よみあげ の大きさ(ON のとき。OFF は「なし」) */
  readonly soundVol: Volume
  readonly musicVol: Volume
  readonly speechVol: Volume
  readonly icons: boolean
  readonly timer: boolean
  /** ききて。書く画面の 左右の並びが かわる */
  readonly handed: Handed
  /** 「うごきを へらす」(OS の設定が オンのときも へらす) */
  readonly reduceMotion: boolean
}

export type Daily = { readonly day: string; readonly counters: Counters; readonly claimed: readonly string[] }

export type LoginBonus = { readonly day: string; readonly streakDay: number; readonly coins: number; readonly claimed: boolean }

type ProgressData = Records & {
  /** 「まなぶ」の はんこ を持っている漢字(覚えた順) */
  readonly learned: readonly string[]
  /** 漢字ごとの はんこ(STAMPS のビットの組み合わせ) */
  readonly stamps: Readonly<Record<string, number>>
  /** これまでにためた経験値(レベルのもと。へらない) */
  readonly xp: number
  /** きせかえに使えるコイン */
  readonly coins: number
  /** たおした ボス(エリアの 中ボス・ラスボス、そつぎょうしけん) */
  readonly clears: Clears
  /** その日に ボスへ ちょうせん した回数 */
  readonly tries: Tries
  /** その日に「きょうの ふくしゅう」で やった字の数(1日の数を こえたら、のこりは 次の日) */
  readonly reviewDone: ReviewDone
  /** ホームで「レベルアップ」を見せおわったレベル */
  readonly seenLevel: number
  readonly streak: { readonly count: number; readonly lastDay: string }
  readonly loginBonus: LoginBonus | null
  readonly daily: Daily
  readonly owned: readonly string[]
  readonly equipped: Equipped
  /** 自分で うごかした かざり の場所(うごかしていない かざり は、はじめの場所のまま) */
  readonly decoSpots: DecoSpots
  /** まわした かざり の向き(45度きざみ の回数) */
  readonly decoTurns: DecoTurns
  /** しまってある かざり の名前(持っているが、しまには出していない) */
  readonly decoStored: readonly string[]
  /** ずかん で もう見た字の数(learned の先頭から)。それより あとの字は「あたらしい」と出す */
  readonly zukanSeen: number
  /** 自己ベスト。キーは bestKey(ヒントの量, 問題の数) */
  readonly bests: Readonly<Record<string, Best>>
  /** きょうの チャレンジ(その日の字・むずかしさ・やりおえたか) */
  readonly challengeDay: ChallengeDay
  readonly settings: Settings
  /** はじめての あんない の 見おえた所(プロフィールごと) */
  readonly intro: IntroState
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

/**
 * daily = きょうの チャレンジ。その日の1回目だけ ごほうびが 満額で、2回目からは自己ベストに挑戦するだけ。
 * answers = 問題ごとの正誤(えらぶ問題)。渡すと まちがえた字も きろく に のこる(省くと 1回で正解した字だけ)
 */
export type QuizContext = {
  readonly level: Level
  readonly bestKey?: string
  readonly daily?: boolean
  readonly answers?: readonly { readonly char: string; readonly ok: boolean }[]
}

/** 学ぶ(くみあわせ)の くわしい結果。mistakes = まちがえて えらんだ回数 */
export type LearnDetail = { readonly mistakes: number }
/** 学ぶ(見て書く)の くわしい結果。`<Kaku>` の onDone の 2つの引数 */
export type WriteDetail = { readonly misses: number; readonly report?: WriteReport }

/** ボスとの たたかい1回ぶんの結果 */
export type BossResult = {
  /** エリアの ボスの id、または そつぎょうしけん の id */
  readonly id: string
  readonly kind: BossKind
  /** まちがえずに できた問題の数 */
  readonly perfect: number
  readonly total: number
  /** れんしゅう(回数をつかわない。たおしたことにも ならない) */
  readonly practice: boolean
  /** ふっかつ戦(まちがえた問題だけを もう一度といた)。たおせたら コインは半分。たたかった回数には 数えない */
  readonly revive?: boolean
  /** まちがえた問題の漢字 */
  readonly missed?: readonly string[]
  /** まちがえずに できた漢字。苦手の回数が へる */
  readonly solved?: readonly string[]
  /** 問題ごとの答え(種類・正誤・ヒントの段)。渡すと きろく に のこり、復習も 種類を見て進める */
  readonly answers?: readonly AnswerInput[]
}

/** ふくしゅう・にがて れんしゅう 1回ぶんの結果 */
export type ReviewResult = {
  /** 1回で できた字 */
  readonly right: readonly string[]
  /** まちがえた字 */
  readonly wrong: readonly string[]
  /** 問題ごとの答え(種類・正誤・ヒントの段)。渡すと、見ないで書く段で ヒントを使った正解は 進まない */
  readonly answers?: readonly AnswerInput[]
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
  completeKanji: (char: string, today?: string, detail?: LearnDetail) => LearnGain
  completeWriting: (char: string, today?: string, detail?: WriteDetail) => WriteGain
  finishQuiz: (summary: QuizSummary, context: QuizContext, today?: string) => QuizGain
  /** きょうの チャレンジを はじめる。その日の字が まだなら決めて、覚えておく(何度ひらいても同じ字)。字の一覧を返す */
  startChallenge: (profileId: string, today?: string) => readonly string[]
  /** ボスに ちょうせん する(その日の回数を1つ使う)。もう回数がなければ false。limit で1日の回数を変えられる */
  startBoss: (id: string, kind: BossKind, today?: string, limit?: number) => boolean
  finishBoss: (result: BossResult, today?: string) => BossGain
  /** ホームで「レベルアップ」を見せおわったことを覚える */
  markLevelSeen: () => void
  /** ずかん で、いま覚えている字を ぜんぶ見たことにする */
  markZukanSeen: () => void
  finishReview: (result: ReviewResult, today?: string) => Gain
  /** にがて れんしゅう の結果。書けた字は 苦手の回数が へる。まちがえても 回数は ふえない */
  finishWeak: (result: ReviewResult, today?: string) => Gain
  /** コンプリートした パーツの ごほうびを受け取る(コンプリートかどうかは、よぶ側で たしかめる) */
  claimPart: (partId: string) => Gain | null
  /** あそんだ時間を ふやす(画面が見えている間、1分ごとに よぶ) */
  addPlayMinute: (today?: string) => void
  claimMission: (id: string, today?: string) => number
  buy: (itemId: string) => boolean
  equip: (itemId: string) => void
  /** 持っている かざり を、しまの すきな場所に置く。置けない場所なら、いちばん近い 置ける場所になる。置いた場所を返す */
  placeDeco: (name: string, spot: Spot) => Spot | null
  /** 持っている かざり を 45度 まわす */
  turnDeco: (name: string) => void
  /** 持っている かざり を しまう(stored = true)・しまに出す(false)。出すときは、ほかと重ならない場所に直す */
  storeDeco: (name: string, stored: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  /** あんないの 吹き出しを 見おえた印をつける */
  markIntroSeen: (tip: IntroTip) => void
  /** あんないを とばす(もう出さない) */
  skipIntro: () => void
  reset: () => void
}

export type ProgressState = ProgressData & ProgressActions

const INITIAL: ProgressData = {
  ...EMPTY_RECORDS,
  learned: [],
  stamps: {},
  xp: 0,
  coins: 0,
  clears: {},
  tries: { day: '', used: {} },
  reviewDone: { day: '', count: 0 },
  seenLevel: 1,
  streak: { count: 0, lastDay: '' },
  loginBonus: null,
  daily: { day: '', counters: EMPTY_COUNTERS, claimed: [] },
  owned: DEFAULT_OWNED,
  equipped: DEFAULT_EQUIPPED,
  decoSpots: {},
  decoTurns: {},
  decoStored: [],
  zukanSeen: 0,
  bests: {},
  challengeDay: INITIAL_CHALLENGE_DAY,
  intro: INITIAL_INTRO,
  // タイマーは焦りのもとになるので、最初は見せない
  settings: { sound: true, music: true, speech: true, soundVol: 'normal', musicVol: 'normal', speechVol: 'normal', icons: true, timer: false, handed: 'right', reduceMotion: false },
}

/** 保存してあった かざり の場所。こわれた値(数でない など)は すてる */
const decoSpotsSchema = z.record(z.string(), z.object({ x: z.number().finite(), z: z.number().finite() })).catch({})

const decoTurnsSchema = z.record(z.string(), z.number().int().min(0).max(TURN_STEPS - 1)).catch({})
const decoStoredSchema = z.array(z.string()).catch([])

const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
/** 保存してあった きょうの チャレンジ。なかった・こわれていたら、はじめの状態 */
const challengeDaySchema = z
  .object({ day: z.string(), level: levelSchema, next: levelSchema, done: z.boolean(), chars: z.array(z.string()) })
  .catch(() => ({ ...INITIAL_CHALLENGE_DAY, chars: [] }))

/** しまに出ている、ほかの かざり(name を のぞく)の場所。置く場所が重ならないように使う */
function otherDecoSpots(name: string, owned: readonly string[], decoSpots: DecoSpots, decoStored: readonly string[]): Spot[] {
  return ownedDecos(owned)
    .filter((other) => other !== name && isMovableDeco(other) && !decoStored.includes(other))
    .flatMap((other) => decoSpot(other, decoSpots) ?? [])
}

/** 1人目の進みぐあいを保存するキー(2人目からは lib/profiles の storageKeyFor で決まる) */
export const STORAGE_KEY = PROGRESS_KEY

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
    review: daily.counters.review + (patch.review ?? 0),
  },
})

const gainOf = (xpBefore: number, xp: number, coins: number): Gain => ({
  xp,
  coins,
  levelBefore: levelInfo(xpBefore).level,
  levelAfter: levelInfo(xpBefore + xp).level,
})

type OldState = { learned?: string[]; points?: number; skin?: string; settings?: Settings }
type V3State = Partial<Omit<ProgressData, 'clears' | 'tries' | 'seenLevel'>> & { stageStars?: Record<string, number> }

/** 保存してあった設定の、あとから ふえた項目(大きさ・ききて・うごき)が こわれていても つかえる形にする。 */
function normalizeSettings(settings: Settings): Settings {
  return {
    ...settings,
    soundVol: sanitizeVolume(settings.soundVol),
    musicVol: sanitizeVolume(settings.musicVol),
    speechVol: sanitizeVolume(settings.speechVol),
    handed: sanitizeHanded(settings.handed),
    reduceMotion: settings.reduceMotion === true,
  }
}

export const STORAGE_VERSION = 6

/** 4つ前までの形式に、ふくしゅう などの きろく を足す。覚えていた字は、少しずつ ふくしゅう に回す。 */
function withRecords(data: ProgressData, today: string): ProgressData {
  return {
    ...data,
    ...EMPTY_RECORDS,
    reviews: backfillReviews(data.learned, today),
    daily: { ...data.daily, counters: { ...EMPTY_COUNTERS, ...data.daily.counters } },
  }
}

/** 1つ前の形式(まとめ の星)を今の形式に直す。星をとっていたステージは、ボスを たおしたことにする。 */
function fromV3(old: V3State): ProgressData {
  const { stageStars = {}, ...rest } = old
  return withRecords({
    ...INITIAL,
    ...rest,
    daily: { ...INITIAL.daily, ...rest.daily, counters: { ...EMPTY_COUNTERS, ...rest.daily?.counters } },
    clears: Object.fromEntries(Object.keys(stageStars).map((id) => [id, rest.streak?.lastDay ?? ''])),
    seenLevel: levelInfo(rest.xp ?? 0).level,
  }, dayKey())
}

/**
 * 前の形式の保存データを、今の形式に直す。学んだ漢字・経験値・コインは引き継ぐ。
 * 5 までは ステージごとに ボスが いたので、たおした記録を エリアの ボスの記録に直す。
 */
function migrate(persisted: unknown, version: number): ProgressData {
  if (version >= STORAGE_VERSION) return persisted as ProgressData
  const data = toV5(persisted, version)
  return { ...data, clears: migrateClears(data.clears, AREAS) }
}

function toV5(persisted: unknown, version: number): ProgressData {
  if (version === 5) return { ...INITIAL, ...(persisted as ProgressData) }
  if (version === 4) return withRecords({ ...INITIAL, ...(persisted as ProgressData) }, dayKey())
  if (version === 3) return fromV3((persisted ?? {}) as V3State)
  const old = (persisted ?? {}) as OldState
  const learned = old.learned ?? []
  const skinId = `skin:${old.skin ?? 'kami'}`
  const hasSkin = findItem(skinId) !== undefined
  return withRecords({
    ...INITIAL,
    learned,
    stamps: Object.fromEntries(learned.map((char) => [char, STAMPS.learn])),
    xp: old.points ?? 0,
    coins: old.points ?? 0,
    seenLevel: levelInfo(old.points ?? 0).level,
    owned: hasSkin ? [...new Set([...DEFAULT_OWNED, skinId])] : DEFAULT_OWNED,
    equipped: hasSkin ? { ...DEFAULT_EQUIPPED, skin: skinId } : DEFAULT_EQUIPPED,
    settings: old.settings ?? INITIAL.settings,
  }, dayKey())
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

      completeKanji: (char, today = dayKey(), detail) => {
        const before = get()
        const isNew = !before.learned.includes(char)
        const gain = gainOf(before.xp, isNew ? XP_LEARN_NEW : XP_LEARN_AGAIN, isNew ? COINS_LEARN_NEW : COINS_LEARN_AGAIN)
        set((state) => ({
          // くみあわせ を さいごまで といた(まちがいの数が わかれば、1回も まちがえなかったか)
          ...withAnswers(state, 'learn', [{ char, kind: 'select', ok: (detail?.mistakes ?? 0) === 0 }], today),
          learned: isNew ? [...state.learned, char] : state.learned,
          stamps: { ...state.stamps, [char]: (state.stamps[char] ?? 0) | STAMPS.learn },
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          daily: addCounters(dailyFor(state.daily, today), { learn: 1, learnNew: isNew ? 1 : 0 }),
          // はじめて覚えた字は、あしたから ふくしゅう に出る
          reviews: isNew ? { ...state.reviews, [char]: scheduleNew(today) } : state.reviews,
          learnedOn: isNew ? { ...state.learnedOn, [char]: today } : state.learnedOn,
        }))
        return { ...gain, isNew }
      },

      completeWriting: (char, today = dayKey(), detail) => {
        const before = get()
        const isNew = !hasStamp(before.stamps[char], 'write')
        const gain = gainOf(before.xp, isNew ? XP_WRITE_FIRST : XP_WRITE_AGAIN, isNew ? COINS_WRITE_FIRST : 0)
        const hint = detail?.report?.maxHint
        const written: AnswerInput = { char, kind: 'model', ok: (detail?.misses ?? 0) === 0, ...(hint === undefined ? {} : { hint }) }
        set((state) => ({
          ...withAnswers(state, 'learn', [written], today),
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
        // きょうの チャレンジは、その日の1回目だけ ごほうびが出る(何度でも あそべるので、かせぎ放題にならないように)
        const rewarded = !context.daily || !isChallengeDone(before.challengeDay, today)
        const gain = rewarded ? gainOf(before.xp, quizXp(summary), quizCoins(summary)) : gainOf(before.xp, 0, 0)
        // チャレンジは えらぶ問題だけ。書く段の字は、ここで 正解しても 復習が進まない
        const answers = (context.answers ?? summary.firstTryChars.map((char) => ({ char, ok: true }))).map((a): AnswerInput => ({ char: a.char, ok: a.ok, kind: 'select' }))
        const credited = summary.firstTryChars.map((char): AnswerInput => ({ char, ok: true, kind: 'select' }))
        set((state) => ({
          ...withAnswers(state, 'challenge', answers, today),
          xp: state.xp + gain.xp,
          coins: state.coins + gain.coins,
          stamps: { ...state.stamps, ...Object.fromEntries(newStamps.map((c) => [c, (state.stamps[c] ?? 0) | STAMPS.quiz])) },
          reviews: creditReviews(state.reviews, summary.firstTryChars, today, credited),
          bests:
            improved && context.bestKey
              ? { ...state.bests, [context.bestKey]: { score: summary.score, timeMs: summary.timeMs } }
              : state.bests,
          challengeDay: context.daily ? completeChallengeDay(state.challengeDay, context.level, summary, today) : state.challengeDay,
          daily: addCounters(dailyFor(state.daily, today), {
            challenge: 1,
            firstTry: summary.firstTry,
            maxCombo: summary.maxCombo,
          }),
        }))
        return { ...gain, improved, newStamps }
      },

      startChallenge: (profileId, today = dayKey()) => {
        const { challengeDay, learned, stamps, misses, reviews } = get()
        if (challengeDay.day === today && challengeDay.chars.length > 0) return challengeDay.chars
        // 保護者が えらんだ字は、先に 出す
        const homework = homeworkChars(useParent.getState().homework[profileId])
        const chars = pickDailyChars({ kanji: KANJI, learned, stamps, misses, reviews, today, seed: `${profileId}:${today}`, homework })
        const next = beginChallengeDay(challengeDay, chars, today)
        set({ challengeDay: next })
        return next.chars
      },

      startBoss: (id, kind, today = dayKey(), limit = BOSS_TRIES_PER_DAY[kind]) => {
        const { tries } = get()
        if (triesLeft(tries, id, limit, today) <= 0) return false
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
        const revive = result.revive === true
        // ふっかつ で たおしたときは、コインが半分(いっぱつで たおす わけ を のこす)。にげられても、がんばり賞は 2回は出さない
        const gain = gainOf(before.xp, firstClear ? reward.xp : revive ? 0 : XP_BOSS_TRY, firstClear ? (revive ? Math.floor(reward.coins / 2) : reward.coins) : 0)
        set((state) => {
          // ふっかつ戦で また まちがえても、苦手の回数は ふやさない(さっき 数えたので)
          const misses = updateMisses(state.misses, revive ? [] : (result.missed ?? []), result.solved ?? [])
          return {
            // 問題の種類が わからない 古い呼び方では、答えは のこさない(苦手から ぬけた日 だけ)
            ...withAnswers(state, 'boss', result.answers ?? [], today, misses),
            hands: withHands(state.hands, result.answers ?? [], today),
            xp: state.xp + gain.xp,
            coins: state.coins + gain.coins,
            clears: firstClear ? { ...state.clears, [result.id]: today } : state.clears,
            // ミッション「ボスと たたかう」は、さいごまで たたかえば(れんしゅうでも)数える
            daily: revive ? state.daily : addCounters(dailyFor(state.daily, today), { stage: 1 }),
            misses,
            reviews: creditReviews(state.reviews, result.solved ?? [], today, result.answers),
          }
        })
        return { ...gain, score, cleared, firstClear }
      },

      finishReview: (result, today = dayKey()) => {
        const before = get()
        const gain = gainOf(before.xp, result.right.length * XP_REVIEW_RIGHT, result.right.length * COINS_REVIEW_RIGHT + COINS_REVIEW_DONE)
        set((state) => {
          const misses = updateMisses(state.misses, result.wrong, result.right)
          // 種類を渡さないときは、問題を決めた 復習の段から 種類が分かる
          const answers = result.answers ?? reviewAnswersOf(state.reviews, result.right, result.wrong)
          return {
            ...withAnswers(state, 'review', answers, today, misses),
            hands: withHands(state.hands, answers, today),
            xp: state.xp + gain.xp,
            coins: state.coins + gain.coins,
            reviews: applyReview(state.reviews, result.right, result.wrong, today, result.answers),
            reviewDone: { day: today, count: (state.reviewDone.day === today ? state.reviewDone.count : 0) + result.right.length + result.wrong.length },
            misses,
            daily: addCounters(dailyFor(state.daily, today), { review: 1, firstTry: result.right.length }),
          }
        })
        return gain
      },

      finishWeak: (result, today = dayKey()) => {
        const before = get()
        const gain = gainOf(before.xp, result.right.length * XP_REVIEW_RIGHT, result.right.length * COINS_REVIEW_RIGHT)
        // 古い呼び方: 書けた字は 見て書く・見ないで書く の両方で まちがえなかった(どちらで まちがえたかは わからない)
        const answers = result.answers ?? result.right.flatMap((char): AnswerInput[] => [{ char, kind: 'model', ok: true }, { char, kind: 'blind', ok: true }])
        set((state) => {
          const misses = updateMisses(state.misses, [], result.right)
          return {
            ...withAnswers(state, 'weak', answers, today, misses),
            hands: withHands(state.hands, answers, today),
            xp: state.xp + gain.xp,
            coins: state.coins + gain.coins,
            misses,
            reviews: creditReviews(state.reviews, result.right, today, result.answers),
            daily: addCounters(dailyFor(state.daily, today), { firstTry: result.right.length }),
          }
        })
        return gain
      },

      claimPart: (partId) => {
        const before = get()
        if (before.partClaims.includes(partId)) return null
        const gain = gainOf(before.xp, XP_PART_COMPLETE, COINS_PART_COMPLETE)
        set((state) => ({ xp: state.xp + gain.xp, coins: state.coins + gain.coins, partClaims: [...state.partClaims, partId] }))
        return gain
      },

      addPlayMinute: (today = dayKey()) => set((state) => ({ playMinutes: addPlayMinutes(state.playMinutes, today, 1) })),

      markLevelSeen: () => set((state) => ({ seenLevel: levelInfo(state.xp).level })),

      markZukanSeen: () => set((state) => (state.zukanSeen === state.learned.length ? state : { zukanSeen: state.learned.length })),

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

      placeDeco: (name, spot) => {
        const { owned, decoSpots, decoStored } = get()
        if (!isMovableDeco(name) || !owned.includes(`deco:${name}`)) return null
        const settled = settleDeco(spot, otherDecoSpots(name, owned, decoSpots, decoStored))
        set({ decoSpots: { ...decoSpots, [name]: settled } })
        return settled
      },

      turnDeco: (name) => {
        const { owned, decoTurns } = get()
        if (!isMovableDeco(name) || !owned.includes(`deco:${name}`)) return
        set({ decoTurns: { ...decoTurns, [name]: ((decoTurns[name] ?? 0) + 1) % TURN_STEPS } })
      },

      storeDeco: (name, stored) => {
        const { owned, decoSpots, decoStored } = get()
        // にじ は うごかせないが、しまう・だす は できる
        if (!isDeco(name) || !owned.includes(`deco:${name}`) || decoStored.includes(name) === stored) return
        if (stored) {
          set({ decoStored: [...decoStored, name] })
          return
        }
        // しまっている間に、ほかの かざり が そこに置かれているかもしれない
        const back = isMovableDeco(name) ? decoSpot(name, decoSpots) : undefined
        const settled = back ? settleDeco(back, otherDecoSpots(name, owned, decoSpots, decoStored)) : undefined
        set({
          decoStored: decoStored.filter((other) => other !== name),
          decoSpots: settled ? { ...decoSpots, [name]: settled } : decoSpots,
        })
      },

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      markIntroSeen: (tip) => set((state) => ({ intro: markSeen(state.intro, tip) })),
      skipIntro: () => set((state) => ({ intro: skipIntro(state.intro) })),
      reset: () => set({ ...INITIAL }),
    }),
    {
      // いま えらばれている人の保存データを読む
      name: storageKeyFor(loadProfiles().activeId),
      version: STORAGE_VERSION,
      migrate,
      // 人を切りかえたとき、前の人のデータが残らないよう、いちど最初の状態にしてから重ねる
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ProgressData>
        return {
          ...current,
          ...INITIAL,
          ...saved,
          // あとから ふえた項目が、前の保存データに なくても こわれないようにする
          settings: normalizeSettings({ ...INITIAL.settings, ...saved.settings }),
          challengeDay: challengeDaySchema.parse(saved.challengeDay),
          // あんないは あとから ふえた。なかった・こわれていたら はじめの状態(遊んでいる子には出ない)
          intro: sanitizeIntro(saved.intro),
          decoSpots: decoSpotsSchema.parse(saved.decoSpots),
          decoTurns: decoTurnsSchema.parse(saved.decoTurns),
          decoStored: decoStoredSchema.parse(saved.decoStored),
          // 答えの きろく は あとから ふえた。こわれていたら 読めるところだけ
          answerLog: answerLogSchema.parse(saved.answerLog),
          answerDays: answerDaysSchema.parse(saved.answerDays),
          // 書いた字も あとから ふえた。こわれた字は すてる
          hands: handsSchema.parse(saved.hands),
          // この しくみ が できる前から覚えていた字は、もう見たことにする
          zukanSeen: typeof saved.zukanSeen === 'number' ? saved.zukanSeen : (saved.learned?.length ?? 0),
          daily: saved.daily ? { ...saved.daily, counters: { ...EMPTY_COUNTERS, ...saved.daily.counters } } : INITIAL.daily,
        }
      },
    },
  ),
)

/**
 * 進みぐあいを、べつの保存先(べつの人)のものに入れかえる。
 * 保存データがまだない人は、最初の状態から始まる。
 */
export function loadProgressFrom(key: string): void {
  useProgress.persist.setOptions({ name: key })
  if (localStorage.getItem(key) !== null) void useProgress.persist.rehydrate()
  else useProgress.setState({ ...INITIAL })
}

// 設定の「うごきを へらす」「おんがくの大きさ」を、アプリぜんたいに ききめがあるようにする
bindAppearance(useProgress)
