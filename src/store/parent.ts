import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AREA_BOSS_PLAN, type BossPlan } from '../lib/boss'
import { REVIEW_DAILY_DEFAULT } from '../lib/review'

/**
 * おうちの かた が決める設定。この端末で あそぶ人 全員に かかる。
 * (子どもが自分で ゆるくできないよう、ふつうの「せってい」とは分けている)
 */
export const BOSS_SIZES = ['short', 'normal'] as const
export type BossSize = (typeof BOSS_SIZES)[number]

export const BOSS_PLANS: Record<BossSize, BossPlan> = {
  // みじかめ: えらぶ5 + 見て書く2 + 見ないで書く3 = 10問
  short: { select: 5, model: 2, blind: 3 },
  normal: AREA_BOSS_PLAN,
}

export const BOSS_TRY_CHOICES = [1, 3, 5] as const
export type BossTries = (typeof BOSS_TRY_CHOICES)[number]

const parentSchema = z.object({
  bossSize: z.enum(BOSS_SIZES),
  bossTries: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  // 1日に ふくしゅう する字の数(前の版の保存データには ないので、ないときは はじめの値)
  reviewPerDay: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(REVIEW_DAILY_DEFAULT),
})

export type ParentSettings = z.infer<typeof parentSchema>

export const DEFAULT_PARENT: ParentSettings = { bossSize: 'normal', bossTries: 3, reviewPerDay: REVIEW_DAILY_DEFAULT }
export const PARENT_KEY = 'kanji-zukan-parent'

type ParentState = ParentSettings & {
  readonly update: (patch: Partial<ParentSettings>) => void
  readonly reset: () => void
}

export const useParent = create<ParentState>()(
  persist(
    (set) => ({
      ...DEFAULT_PARENT,
      update: (patch) => {
        // 決まった値だけを うけつける
        set((state) => parentSchema.parse({ bossSize: state.bossSize, bossTries: state.bossTries, reviewPerDay: state.reviewPerDay, ...patch }))
      },
      reset: () => set(DEFAULT_PARENT),
    }),
    {
      name: PARENT_KEY,
      version: 1,
      // こわれた保存データは使わず、はじめの設定にもどす
      merge: (persisted, current) => {
        const parsed = parentSchema.safeParse(persisted)
        return { ...current, ...(parsed.success ? parsed.data : DEFAULT_PARENT) }
      },
    },
  ),
)

/** エリアの ボスの きまり(問題の数と、1日の回数)。 */
export function useBossRules(): { readonly plan: BossPlan; readonly triesPerDay: number } {
  const bossSize = useParent((s) => s.bossSize)
  const bossTries = useParent((s) => s.bossTries)
  return { plan: BOSS_PLANS[bossSize], triesPerDay: bossTries }
}
