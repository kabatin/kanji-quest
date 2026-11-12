/*
 * ごほうびの量。6年生まで(1026字・およそ 200ステージ)続けても、
 * コインが あまりすぎず、きせかえ を少しずつ集められるように決めている。
 *   1字: まなぶ 5 + かく 3 / ボス 1体 30 / そつぎょうしけん 300 / まいにち およそ 50
 */
export const XP_LEARN_NEW = 20
export const XP_LEARN_AGAIN = 3
export const COINS_LEARN_NEW = 5
export const COINS_LEARN_AGAIN = 0

export const XP_WRITE_FIRST = 10
export const XP_WRITE_AGAIN = 2
export const COINS_WRITE_FIRST = 3

export const XP_BOSS_CLEAR = 100
export const COINS_BOSS_CLEAR = 30
export const XP_EXAM_CLEAR = 500
export const COINS_EXAM_CLEAR = 300
/** クリアできなかったとき・れんしゅうのときも、がんばった分だけ少しもらえる */
export const XP_BOSS_TRY = 10

export const COINS_PERFECT_BONUS = 3

/** ふくしゅう: 1回で できた字 1つあたり */
export const XP_REVIEW_RIGHT = 4
export const COINS_REVIEW_RIGHT = 1
/** ふくしゅう を さいごまで やったら */
export const COINS_REVIEW_DONE = 5

/** パーツを コンプリートしたときの ごほうび */
export const XP_PART_COMPLETE = 30
export const COINS_PART_COMPLETE = 20

/**
 * 漢字ごとの はんこ。3種類あり、どれを先に取ってもよい。
 * learn = ものがたりを見て覚えた / write = 手で書けた / quiz = ヒントの少ないクイズで1回で正解した
 */
export const STAMPS = { learn: 1, write: 2, quiz: 4 } as const
export type StampKind = keyof typeof STAMPS
export const STAMP_KINDS: readonly StampKind[] = ['learn', 'write', 'quiz']
export const STAMP_LABEL: Record<StampKind, string> = { learn: '{学|まな}ぶ', write: '{書|か}く', quiz: 'とく' }

export function hasStamp(mask: number | undefined, kind: StampKind): boolean {
  return ((mask ?? 0) & STAMPS[kind]) !== 0
}

export function stampCount(mask: number | undefined): number {
  return STAMP_KINDS.filter((kind) => hasStamp(mask, kind)).length
}

/** クイズの はんこ がもらえる、ヒントの量(2 = 絵なし)。これより かんたんな設定では もらえない。 */
export const QUIZ_STAMP_MIN_LEVEL = 2

/** ログインボーナス(コイン)。7日でひとまわりし、7日目がいちばん多い。 */
export const LOGIN_BONUS = [5, 5, 10, 10, 15, 15, 30] as const

export function loginBonusFor(streakCount: number): number {
  return LOGIN_BONUS[(Math.max(streakCount, 1) - 1) % LOGIN_BONUS.length]
}

/** クイズ1回ぶんの結果 */
export type QuizSummary = {
  readonly score: number
  readonly questionCount: number
  /** まちがえて選んだ回数の合計 */
  readonly mistakes: number
  /** 1回で正解した問題の数 */
  readonly firstTry: number
  readonly maxCombo: number
  readonly timeMs: number
  /** 1回で正解した漢字 */
  readonly firstTryChars: readonly string[]
}

const COMBO_BONUS_STEP = 2
const COMBO_BONUS_MAX = 10

/** れんぞく正解のボーナス点。2れんぞく目から少しずつ増える。 */
export function comboBonus(combo: number): number {
  return combo < 2 ? 0 : Math.min((combo - 1) * COMBO_BONUS_STEP, COMBO_BONUS_MAX)
}

export type Rank = 'kanpeki' | 'sugoi' | 'dekita'

const SUGOI_RATIO = 0.8

/** 全問を1回で正解なら「かんぺき」、8割以上で「すごい」、それ以外は「できた」。 */
export function rankOf(summary: QuizSummary): Rank {
  if (summary.questionCount > 0 && summary.firstTry === summary.questionCount) return 'kanpeki'
  if (summary.firstTry >= summary.questionCount * SUGOI_RATIO) return 'sugoi'
  return 'dekita'
}

const SCORE_PER_COIN = 20
const SCORE_PER_XP = 3

/** チャレンジでもらえるコイン。何回でも遊べるので、少なめにしている。 */
export function quizCoins(summary: QuizSummary): number {
  return Math.floor(summary.score / SCORE_PER_COIN) + (rankOf(summary) === 'kanpeki' ? COINS_PERFECT_BONUS : 0)
}

/** チャレンジでもらえる経験値。 */
export function quizXp(summary: QuizSummary): number {
  return Math.floor(summary.score / SCORE_PER_XP)
}

/** ボスの種類ごとの ごほうび(はじめて たおしたとき) */
export type BossKind = 'stage' | 'exam'

export const BOSS_REWARD: Record<BossKind, { readonly xp: number; readonly coins: number }> = {
  stage: { xp: XP_BOSS_CLEAR, coins: COINS_BOSS_CLEAR },
  exam: { xp: XP_EXAM_CLEAR, coins: COINS_EXAM_CLEAR },
}

/** 1日に ちょうせん できる回数 */
export const BOSS_TRIES_PER_DAY: Record<BossKind, number> = { stage: 3, exam: 2 }

export const BOSS_CLEAR_SCORE = 100

/** ボスの点数。全部の問題を まちがえずに できたときだけ 100点になる。 */
export function bossScore(perfect: number, total: number): number {
  if (total <= 0) return 0
  if (perfect >= total) return BOSS_CLEAR_SCORE
  return Math.min(Math.round((perfect / total) * BOSS_CLEAR_SCORE), BOSS_CLEAR_SCORE - 1)
}
