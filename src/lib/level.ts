const FIRST_LEVEL_XP = 40
const XP_STEP = 20

/** そのレベルから次のレベルに上がるのに必要な経験値。レベルが上がるほど少しずつ増える。 */
export function xpToNext(level: number): number {
  return FIRST_LEVEL_XP + XP_STEP * (level - 1)
}

export type LevelInfo = {
  readonly level: number
  /** いまのレベルに入ってからためた経験値 */
  readonly into: number
  /** 次のレベルまでに必要な経験値 */
  readonly need: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level += 1
  }
  return { level, into: rest, need: xpToNext(level) }
}

/** すみまるが姿を変えるレベル */
const MASCOT_LEVELS = [1, 3, 7, 15] as const

/** レベルに応じた、すみまるの成長段階(0〜3)。 */
export function mascotStage(level: number): number {
  return MASCOT_LEVELS.filter((need) => level >= need).length - 1
}

/** 次に姿が変わるレベル。もう最後の姿なら null。 */
export function nextMascotLevel(level: number): number | null {
  return MASCOT_LEVELS.find((need) => need > level) ?? null
}
