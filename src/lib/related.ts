import type { Kanji, Part } from '../data/schema'

export type RelatedGroup = {
  readonly part: Part
  /** 同じ部位を持つ漢字 */
  readonly kanji: readonly Kanji[]
}

/** ある漢字の「なかま」を、共通する部位ごとにまとめて返す。仲間がいない部位は省く。 */
export function findRelated(target: Kanji, kanjiList: readonly Kanji[], parts: readonly Part[]): RelatedGroup[] {
  return target.parts
    .map((partId) => {
      const part = parts.find((p) => p.id === partId)
      if (!part) throw new Error(`部位が見つかりません: ${partId}`)
      const kanji = kanjiList.filter((k) => k.char !== target.char && k.parts.includes(partId))
      return { part, kanji }
    })
    .filter((group) => group.kanji.length > 0)
}
