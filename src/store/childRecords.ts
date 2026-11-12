import { z } from 'zod'
import { storageKeyFor } from '../lib/profiles'

/** おうちの かた の画面で見る、子ども1人ぶんの きろく。 */
const childSchema = z.object({
  learned: z.array(z.string()).catch([]),
  learnedOn: z.record(z.string(), z.string()).catch({}),
  misses: z.record(z.string(), z.number()).catch({}),
  playMinutes: z.record(z.string(), z.number()).catch({}),
  reviews: z.record(z.string(), z.object({ due: z.string(), step: z.number() })).catch({}),
  clears: z.record(z.string(), z.string()).catch({}),
  xp: z.number().catch(0),
})

export type ChildRecords = z.infer<typeof childSchema>

export const EMPTY_CHILD: ChildRecords = { learned: [], learnedOn: {}, misses: {}, playMinutes: {}, reviews: {}, clears: {}, xp: 0 }

/**
 * その人の保存データを、端末から直接読む(あそぶ人を切りかえずに見られるように)。
 * 足りない・こわれている項目は、からっぽ として あつかう。
 */
export function readChildRecords(id: string, storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): ChildRecords {
  const raw = storage?.getItem(storageKeyFor(id))
  if (!raw) return EMPTY_CHILD
  try {
    const parsed = z.object({ state: z.unknown() }).safeParse(JSON.parse(raw))
    if (!parsed.success) return EMPTY_CHILD
    const result = childSchema.safeParse({ ...EMPTY_CHILD, ...(parsed.data.state as object) })
    return result.success ? result.data : EMPTY_CHILD
  } catch {
    return EMPTY_CHILD
  }
}
