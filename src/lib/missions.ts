import { hashString } from './date'

/** その日のうちに数えるもの */
export type Counters = {
  /** 学んだ漢字の数(2回目以降もふくむ) */
  readonly learn: number
  /** はじめて覚えた漢字の数 */
  readonly learnNew: number
  /** クリアしたチャレンジの数 */
  readonly challenge: number
  /** 1回で正解した問題の数 */
  readonly firstTry: number
  /** いちばん長く続いた れんぞく正解 */
  readonly maxCombo: number
  /** クリアした ステージの まとめ の数 */
  readonly stage: number
}

export const EMPTY_COUNTERS: Counters = { learn: 0, learnNew: 0, challenge: 0, firstTry: 0, maxCombo: 0, stage: 0 }

export type Mission = {
  readonly id: string
  readonly label: string
  readonly counter: keyof Counters
  readonly target: number
  /** もらえるコイン */
  readonly reward: number
}

export const MISSION_POOL: readonly Mission[] = [
  { id: 'learn3', label: 'かんじを 3つ まなぶ', counter: 'learn', target: 3, reward: 30 },
  { id: 'new2', label: 'あたらしい かんじを 2つ おぼえる', counter: 'learnNew', target: 2, reward: 40 },
  { id: 'challenge1', label: 'チャレンジを 1かい クリア', counter: 'challenge', target: 1, reward: 30 },
  { id: 'firstTry5', label: '1かいで せいかいを 5もん', counter: 'firstTry', target: 5, reward: 30 },
  { id: 'combo3', label: '3れんぞくで せいかい', counter: 'maxCombo', target: 3, reward: 30 },
  { id: 'stage1', label: 'ステージの まとめを クリア', counter: 'stage', target: 1, reward: 50 },
]

export const DAILY_MISSION_COUNT = 3

/** その日のミッションを3つえらぶ。同じ日なら、いつ見ても同じ3つになる。 */
export function dailyMissions(day: string): Mission[] {
  const start = hashString(day) % MISSION_POOL.length
  // 1つ飛ばしでえらぶと、にた種類のミッションが並びにくい
  const step = MISSION_POOL.length % 2 === 0 ? MISSION_POOL.length / 2 - 1 || 1 : 2
  return Array.from({ length: DAILY_MISSION_COUNT }, (_, i) => MISSION_POOL[(start + i * step) % MISSION_POOL.length])
}

export function missionProgress(mission: Mission, counters: Counters): number {
  return Math.min(counters[mission.counter], mission.target)
}

export function isMissionDone(mission: Mission, counters: Counters): boolean {
  return counters[mission.counter] >= mission.target
}
