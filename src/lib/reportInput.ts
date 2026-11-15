import { z } from 'zod'
import { answerDaysSchema, answerLogSchema, type AnswerDays } from './answerLog'
import type { MasteryInput } from './mastery'
import { storageKeyFor } from './profiles'

/**
 * 保護者の レポートに使う、子ども1人ぶんの記録。
 * 進みぐあいのストア(useProgress の状態)は そのまま この形として 渡せる。
 * ほかの子の記録は readReportInput で 端末から直接読む(あそぶ人を 切りかえずに見られるように)。
 */
export type ReportInput = MasteryInput & {
  readonly learnedOn: Readonly<Record<string, string>>
  readonly misses: Readonly<Record<string, number>>
  readonly playMinutes: Readonly<Record<string, number>>
  readonly answerDays: AnswerDays
}

export const EMPTY_REPORT_INPUT: ReportInput = {
  learned: [],
  stamps: {},
  reviews: {},
  answerLog: {},
  learnedOn: {},
  misses: {},
  playMinutes: {},
  answerDays: {},
}

const reportSchema = z.object({
  learned: z.array(z.string()).catch([]),
  stamps: z.record(z.string(), z.number()).catch({}),
  reviews: z.record(z.string(), z.object({ due: z.string(), step: z.number() })).catch({}),
  answerLog: answerLogSchema,
  learnedOn: z.record(z.string(), z.string()).catch({}),
  misses: z.record(z.string(), z.number()).catch({}),
  playMinutes: z.record(z.string(), z.number()).catch({}),
  answerDays: answerDaysSchema,
})

/** その人の保存データを 端末から読む。足りない・こわれている項目は からっぽ として あつかう。 */
export function readReportInput(id: string, storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): ReportInput {
  const raw = storage?.getItem(storageKeyFor(id))
  if (!raw) return EMPTY_REPORT_INPUT
  try {
    const body = z.object({ state: z.record(z.string(), z.unknown()) }).safeParse(JSON.parse(raw))
    if (!body.success) return EMPTY_REPORT_INPUT
    const result = reportSchema.safeParse(body.data.state)
    return result.success ? result.data : EMPTY_REPORT_INPUT
  } catch {
    // こわれた保存データ(JSON でない)は、からっぽ として あつかう
    return EMPTY_REPORT_INPUT
  }
}
