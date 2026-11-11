import { z } from 'zod'
import raw from './generated/parts.json'
import { partSchema, type Part } from './schema'

// 中身は scripts/build-data.mjs が scripts/kanji-source.mjs から作る
export const PARTS: readonly Part[] = z.array(partSchema).parse(raw)

const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]))

export function getPart(id: string): Part {
  const part = PART_BY_ID.get(id)
  if (!part) throw new Error(`部位が見つかりません: ${id}`)
  return part
}
