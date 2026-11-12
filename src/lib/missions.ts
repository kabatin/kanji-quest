import { hashString } from './date'

/** その日のうちに数えるもの */
export type Counters = {
  /** 学んだ漢字の数(2回目以降もふくむ) */
  readonly learn: number
  /** はじめて覚えた漢字の数 */
  readonly learnNew: number
  /** 書けた漢字の数 */
  readonly write: number
  /** クリアしたチャレンジの数 */
  readonly challenge: number
  /** 1回で正解した問題の数 */
  readonly firstTry: number
  /** いちばん長く続いた れんぞく正解 */
  readonly maxCombo: number
  /** さいごまで たたかった ボスの数(れんしゅう も ふくむ) */
  readonly stage: number
  /** さいごまで やった ふくしゅう の数 */
  readonly review: number
}

export const EMPTY_COUNTERS: Counters = { learn: 0, learnNew: 0, write: 0, challenge: 0, firstTry: 0, maxCombo: 0, stage: 0, review: 0 }

export type Mission = {
  readonly id: string
  /** 画面に出す文。{漢字|よみ} の印つき */
  readonly label: string
  readonly counter: keyof Counters
  readonly target: number
  /** もらえるコイン */
  readonly reward: number
}

export const MISSION_POOL: readonly Mission[] = [
  { id: 'learn3', label: 'かんじを 3つ {学|まな}ぶ', counter: 'learn', target: 3, reward: 10 },
  { id: 'challenge1', label: 'チャレンジを {1回|1かい} クリア', counter: 'challenge', target: 1, reward: 10 },
  { id: 'new2', label: '{新|あたら}しい かんじを 2つ おぼえる', counter: 'learnNew', target: 2, reward: 15 },
  { id: 'firstTry5', label: '{1回|1かい}で せいかいを 5もん', counter: 'firstTry', target: 5, reward: 10 },
  { id: 'write3', label: 'かんじを 3つ {書|か}く', counter: 'write', target: 3, reward: 10 },
  { id: 'combo3', label: '3れんぞくで せいかい', counter: 'maxCombo', target: 3, reward: 10 },
  { id: 'stage1', label: 'ボスと {1回|1かい} たたかう', counter: 'stage', target: 1, reward: 25 },
  { id: 'review1', label: 'ふくしゅうを {1回|1かい} する', counter: 'review', target: 1, reward: 15 },
]

export const DAILY_MISSION_COUNT = 3

/** その日のミッションを3つえらぶ。同じ日なら、いつ見ても同じ3つになる。 */
export function dailyMissions(day: string): Mission[] {
  const start = hashString(day) % MISSION_POOL.length
  // 2つ飛ばしでえらぶと、にた種類のミッションが並びにくい
  const step = 2
  return Array.from({ length: DAILY_MISSION_COUNT }, (_, i) => MISSION_POOL[(start + i * step) % MISSION_POOL.length])
}

export function missionProgress(mission: Mission, counters: Counters): number {
  return Math.min(counters[mission.counter], mission.target)
}

export function isMissionDone(mission: Mission, counters: Counters): boolean {
  return counters[mission.counter] >= mission.target
}
