export const XP_LEARN_NEW = 20
export const XP_LEARN_AGAIN = 5
export const COINS_LEARN_NEW = 10
export const COINS_LEARN_AGAIN = 2
export const COINS_STAGE_FIRST_CLEAR = 50
export const COINS_PERFECT_BONUS = 10

export const XP_WRITE = 10
export const COINS_WRITE_FIRST = 5

/**
 * 漢字ごとの はんこ。3種類あり、どれを先に取ってもよい。
 * learn = ものがたりを見て覚えた / write = 手で書けた / quiz = ヒントの少ないクイズで1回で正解した
 */
export const STAMPS = { learn: 1, write: 2, quiz: 4 } as const
export type StampKind = keyof typeof STAMPS
export const STAMP_KINDS: readonly StampKind[] = ['learn', 'write', 'quiz']
export const STAMP_LABEL: Record<StampKind, string> = { learn: 'まなぶ', write: 'かく', quiz: 'とく' }

export function hasStamp(mask: number | undefined, kind: StampKind): boolean {
  return ((mask ?? 0) & STAMPS[kind]) !== 0
}

export function stampCount(mask: number | undefined): number {
  return STAMP_KINDS.filter((kind) => hasStamp(mask, kind)).length
}

/** クイズの はんこ がもらえる、ヒントの量(2 = 絵なし)。これより かんたんな設定では もらえない。 */
export const QUIZ_STAMP_MIN_LEVEL = 2

/** ログインボーナス(コイン)。7日でひとまわりし、7日目がいちばん多い。 */
export const LOGIN_BONUS = [20, 20, 30, 30, 40, 40, 100] as const

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

const STARS_BY_RANK: Record<Rank, number> = { kanpeki: 3, sugoi: 2, dekita: 1 }

/** ステージの まとめ でもらえる星(1〜3)。クリアすれば必ず1つはもらえる。 */
export function stageStarsFor(summary: QuizSummary): number {
  return STARS_BY_RANK[rankOf(summary)]
}

const SCORE_PER_COIN = 5

export function quizCoins(summary: QuizSummary): number {
  return Math.floor(summary.score / SCORE_PER_COIN) + (rankOf(summary) === 'kanpeki' ? COINS_PERFECT_BONUS : 0)
}
