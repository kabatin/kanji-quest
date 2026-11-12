import type { Kanji, Part } from '../data/schema'

/** パーツ1つの あつまりぐあい */
export type PartProgress = {
  readonly part: Part
  /** この パーツを持つ漢字(その パーツ そのものの字は のぞく) */
  readonly users: readonly Kanji[]
  /** そのうち 覚えた字の数 */
  readonly known: number
  /** 1字でも覚えて、見つけた パーツか */
  readonly found: boolean
  /** この パーツを持つ字を、全部 覚えたか */
  readonly complete: boolean
}

export function partProgress(part: Part, kanjiList: readonly Kanji[], learned: ReadonlySet<string>): PartProgress {
  const users = kanjiList.filter((k) => k.parts.includes(part.id) && k.char !== part.id)
  const known = users.filter((k) => learned.has(k.char)).length
  const found = kanjiList.some((k) => learned.has(k.char) && k.parts.includes(part.id))
  return { part, users, known, found, complete: users.length > 0 && known === users.length }
}

/** コンプリートしたのに、まだ ごほうびを受け取っていない パーツ。 */
export function claimableParts(parts: readonly Part[], kanjiList: readonly Kanji[], learned: ReadonlySet<string>, claimed: readonly string[]): Part[] {
  return parts.filter((part) => !claimed.includes(part.id) && partProgress(part, kanjiList, learned).complete)
}

export type PartQuest = {
  readonly part: Part
  /** コンプリートまで あと何字 */
  readonly remaining: number
  /** 次に学ぶと よい字 */
  readonly nextChar: string
}

/**
 * 今の「パーツ クエスト」。見つけた パーツのうち、コンプリートに いちばん近いもの。
 * 同じなら、なかまの多い(だいじな)パーツを えらぶ。全部コンプリートしたら null。
 */
export function currentQuest(parts: readonly Part[], kanjiList: readonly Kanji[], learned: ReadonlySet<string>): PartQuest | null {
  const candidates = parts
    .map((part) => partProgress(part, kanjiList, learned))
    .filter((p) => p.found && !p.complete && p.users.length >= 2)
    .sort((a, b) => a.users.length - a.known - (b.users.length - b.known) || b.users.length - a.users.length)
  const best = candidates[0]
  if (!best) return null
  const next = best.users.find((k) => !learned.has(k.char))
  if (!next) return null
  return { part: best.part, remaining: best.users.length - best.known, nextChar: next.char }
}

/** char を覚えたことで、新しく コンプリートした パーツ。 */
export function newlyCompleted(char: string, parts: readonly Part[], kanjiList: readonly Kanji[], learned: ReadonlySet<string>): Part[] {
  const before = new Set([...learned].filter((c) => c !== char))
  const kanji = kanjiList.find((k) => k.char === char)
  if (!kanji) return []
  return parts.filter((part) => kanji.parts.includes(part.id) && partProgress(part, kanjiList, learned).complete && !partProgress(part, kanjiList, before).complete)
}
