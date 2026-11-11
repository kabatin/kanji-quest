/**
 * レベルの上がり方。6年生までの 1026字 を全部やりきるころに、レベル 100 の手前になるように決めている。
 * (1字 = まなぶ 20 + かく 10、ボス 1体 = 100、そつぎょうしけん = 500 として、合計 およそ 5万5千)
 */
const FIRST_LEVEL_XP = 50
const XP_STEP = 12

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

/**
 * すみまるの すがた。レベルが上がると変わる。
 * 1年生をおえるころに 4つ目、2年生で 6つ目、最後の すがた は高学年までとっておく。
 */
export const MASCOT_FORMS = [
  { level: 1, name: 'すみの しずく' },
  { level: 4, name: 'ふでの こ' },
  { level: 9, name: 'ふで つかい' },
  { level: 16, name: 'すみの けんし' },
  { level: 26, name: 'すみの ゆうしゃ' },
  { level: 40, name: 'すみの めいじん' },
  { level: 58, name: 'すみの せんにん' },
  { level: 80, name: 'かんじの おう' },
] as const

export const MASCOT_FORM_COUNT = MASCOT_FORMS.length

/** レベルに応じた、すみまるの成長段階(0 始まり)。 */
export function mascotStage(level: number): number {
  return Math.max(MASCOT_FORMS.filter((form) => level >= form.level).length - 1, 0)
}

/** 次に姿が変わるレベル。もう最後の姿なら null。 */
export function nextMascotLevel(level: number): number | null {
  return MASCOT_FORMS.find((form) => form.level > level)?.level ?? null
}

/** いまの すがた になってから、次の すがた までの進みぐあい(0〜1)。最後の すがた なら 1。 */
export function mascotGrowth(level: number): number {
  const next = nextMascotLevel(level)
  if (next === null) return 1
  const from = MASCOT_FORMS[mascotStage(level)].level
  return (level - from) / (next - from)
}
