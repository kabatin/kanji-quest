import { legacyBlindDay, legacyLevel, type AnswerLog, type WriteLevel } from './answerLog'
import { hasStamp } from './rewards'
import type { Reviews } from './review'
import type { Stage } from './stages'

/**
 * 字ごとの 習熟度。「読める・分かる」と「書ける」を分け、書ける力は 少なめに 見る。
 * none = まだ / learned = 学んだ / model = 見て書ける / blind = 見ないで書ける(ヒントなし)/ solid = 定着(日をあけても書けた)
 */
export type MasteryState = 'none' | 'learned' | 'model' | 'blind' | 'solid'

export const MASTERY_STATES: readonly MasteryState[] = ['none', 'learned', 'model', 'blind', 'solid']

/** 保護者の画面に出す 名前 */
export const MASTERY_LABEL: Readonly<Record<MasteryState, string>> = {
  none: 'まだ',
  learned: '学んだ',
  model: '見て書ける',
  blind: '見ないで書ける',
  solid: '定着',
}

/** 保護者の画面に出す 説明 */
export const MASTERY_NOTE: Readonly<Record<MasteryState, string>> = {
  none: 'まだ学んでいない字です。',
  learned: '学びましたが、まだ書けた記録がありません。',
  model: '見本を見れば書けます。',
  blind: '見本なしで、ヒントを使わずに書けました。',
  solid: '1週間以上あけても、見本なしで書けました。',
}

/** 習熟度を出すのに使う記録(進みぐあいの保存データの一部) */
export type MasteryInput = {
  readonly learned: readonly string[]
  readonly stamps: Readonly<Record<string, number>>
  readonly reviews: Reviews
  readonly answerLog: AnswerLog
}

const LEVEL_STATE: Readonly<Record<WriteLevel, MasteryState | null>> = { 0: null, 1: 'model', 2: 'blind', 3: 'solid' }

/** 書く力の段。ログがあれば ログ、なければ 今までの記録(はんこ・復習の段)から 見つもる */
export function writeLevelOf(char: string, input: MasteryInput): WriteLevel {
  return input.answerLog[char]?.w ?? legacyLevel(char, input.stamps, input.reviews[char])
}

const isLearned = (char: string, input: MasteryInput, learned: ReadonlySet<string>): boolean => learned.has(char) || hasStamp(input.stamps[char], 'learn')

function stateOf(char: string, input: MasteryInput, learned: ReadonlySet<string>): MasteryState {
  return LEVEL_STATE[writeLevelOf(char, input)] ?? (isLearned(char, input, learned) ? 'learned' : 'none')
}

export function masteryOf(char: string, input: MasteryInput): MasteryState {
  return stateOf(char, input, new Set(input.learned))
}

/** はじめて 見ないで(ヒントなしで)書けた日。ログがない字は 復習の段から 見つもる */
export function firstFreeWriteDay(char: string, input: MasteryInput): string | undefined {
  const log = input.answerLog[char]
  if (log) return log.b
  return legacyLevel(char, input.stamps, input.reviews[char]) >= 2 ? legacyBlindDay(input.reviews[char]) : undefined
}

export type MasteryCell = {
  readonly char: string
  readonly grade: number
  /** ステージの 通し番号(1始まり) */
  readonly stage: number
  readonly areaIndex: number
  readonly state: MasteryState
  /** 苦手(まちがえた回数が のこっている) */
  readonly weak: boolean
  readonly misses: number
}

/** 習熟マップ: ぜんぶの字を、学年・ステージの順に。stages には data/areas の ALL_STAGES を渡す */
export function masteryMap(stages: readonly Stage[], input: MasteryInput & { readonly misses: Readonly<Record<string, number>> }): MasteryCell[] {
  const learned = new Set(input.learned)
  return stages.flatMap((stage) =>
    stage.kanji.map((char) => {
      const misses = input.misses[char] ?? 0
      return { char, grade: stage.grade, stage: stage.number, areaIndex: stage.areaIndex, state: stateOf(char, input, learned), weak: misses > 0, misses }
    }),
  )
}

/** 状態ごとの 字の数 */
export function masteryCounts(cells: readonly { readonly state: MasteryState }[]): Record<MasteryState, number> {
  return Object.fromEntries(MASTERY_STATES.map((state) => [state, cells.filter((cell) => cell.state === state).length])) as Record<MasteryState, number>
}
