import { recentAnswers, type AnswerEntry, type AnswerWhere } from './answerLog'
import { firstFreeWriteDay, masteryOf, type MasteryState } from './mastery'
import { formatDay } from './parentReport'
import type { ReportInput } from './reportInput'
import { isMastered, type AnswerKind } from './review'

/** 保護者の画面に出す ことば */
export const WHERE_LABEL: Readonly<Record<AnswerWhere, string>> = { learn: '学ぶ', review: '復習', boss: 'ボス', weak: 'にがて練習', challenge: 'チャレンジ' }
export const KIND_LABEL: Readonly<Record<AnswerKind, string>> = { select: 'えらぶ', model: '見て書く', blind: '見ないで書く' }
/** ヒントの段(lib/strokeHint の HintLevel)の ことば */
export const HINT_LABEL: readonly string[] = ['ヒントなし', '書きはじめの点', '向きの矢印', '動きを見た', 'お手本をなぞった']

export type CharHistory = {
  readonly char: string
  readonly state: MasteryState
  /** 苦手(まちがえた回数が のこっている) */
  readonly weak: boolean
  /** いまの まちがいの回数(できると へる) */
  readonly misses: number
  readonly learnedOn: string | null
  /** 答えの きろく が あるか(この しくみ の前の分は ない) */
  readonly logged: boolean
  /** きろく を とりはじめてからの 答えの数・まちがえた数 */
  readonly answered: number
  readonly wrong: number
  /** はじめて 見本なしで書けた日(ログがない字は 見つもり) */
  readonly firstFreeWrite: string | null
  /** さいごに 苦手から ぬけた日 */
  readonly leftWeakOn: string | null
  /** 最近の答え(新しい順) */
  readonly recent: readonly AnswerEntry[]
  readonly nextReview: string | null
  /** 復習の段(0〜。5 から おぼえきった) */
  readonly reviewStep: number | null
  readonly reviewMastered: boolean
}

/** 字を押したときに出す、くわしい履歴 */
export function charHistory(char: string, input: ReportInput): CharHistory {
  const log = input.answerLog[char]
  const card = input.reviews[char]
  const misses = input.misses[char] ?? 0
  return {
    char,
    state: masteryOf(char, input),
    weak: misses > 0,
    misses,
    learnedOn: input.learnedOn[char] ?? null,
    logged: log !== undefined && log.n > 0,
    answered: log?.n ?? 0,
    wrong: log?.x ?? 0,
    firstFreeWrite: firstFreeWriteDay(char, input) ?? null,
    leftWeakOn: log?.o ?? null,
    recent: recentAnswers(log),
    nextReview: card?.due ?? null,
    reviewStep: card?.step ?? null,
    reviewMastered: isMastered(card),
  }
}

/** 11月14日 復習・見ないで書く ×(ヒント: 向きの矢印) */
export function answerText(entry: AnswerEntry): string {
  const hint = entry.hint === null ? '' : entry.hint === 0 ? `(${HINT_LABEL[0]})` : `(ヒント: ${HINT_LABEL[entry.hint] ?? entry.hint})`
  return `${formatDay(entry.day)} ${WHERE_LABEL[entry.where]}・${KIND_LABEL[entry.kind]} ${entry.ok ? '○' : '×'}${hint}`
}
