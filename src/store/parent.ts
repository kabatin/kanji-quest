import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AREA_BOSS_PLAN, type BossPlan } from '../lib/boss'
import { dayKey } from '../lib/date'
import { addExtra, PLAY_EXTRA_MAX, PLAY_LIMIT_CHOICES, PLAY_LIMIT_DEFAULT, type PlayExtra, type PlayLimit } from '../lib/playLimit'
import { REVIEW_DAILY_DEFAULT } from '../lib/review'

/**
 * おうちの かた が決める設定。この端末で あそぶ人 全員に かかる。
 * (子どもが自分で ゆるくできないよう、ふつうの「せってい」とは分けている)
 * 1日の時間 と きょうの延長 だけは、子どもごと(あそぶ人の id ごと)に持つ。
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

const profileId = z.string().regex(/^p\d+$/)
const playLimitSchema = z.literal([...PLAY_LIMIT_CHOICES])

const parentSchema = z.object({
  bossSize: z.enum(BOSS_SIZES),
  bossTries: z.union([z.literal(1), z.literal(3), z.literal(5)]),
  // 1日に ふくしゅう する字の数(前の版の保存データには ないので、ないときは はじめの値)
  reviewPerDay: z.union([z.literal(5), z.literal(10), z.literal(15)]).default(REVIEW_DAILY_DEFAULT),
  // 子どもごとの 1日の時間(ない子は なし)
  playLimits: z.record(profileId, playLimitSchema).default({}),
  // 子どもごとの きょうだけの延長
  playExtra: z.record(profileId, z.object({ day: z.string().max(10), minutes: z.number().int().min(0).max(PLAY_EXTRA_MAX) })).default({}),
})

export type ParentSettings = z.infer<typeof parentSchema>

export const DEFAULT_PARENT: ParentSettings = { bossSize: 'normal', bossTries: 3, reviewPerDay: REVIEW_DAILY_DEFAULT, playLimits: {}, playExtra: {} }
export const PARENT_KEY = 'kanji-zukan-parent'

type ParentState = ParentSettings & {
  readonly update: (patch: Partial<ParentSettings>) => void
  /** その子の 1日の時間を決める(0 = なし) */
  readonly setPlayLimit: (profileId: string, limit: PlayLimit) => void
  /** その子の きょうの延長に minutes 分 足す。ほかの日の延長は 消える */
  readonly extendPlay: (profileId: string, minutes: number, today?: string) => void
  /** その子の 延長を とりけす */
  readonly cancelExtra: (profileId: string) => void
  /** あそぶ人を けしたとき、その子の 時間の設定を わすれる(id は あとで ほかの子に また使われるため) */
  readonly forgetChild: (profileId: string) => void
  readonly reset: () => void
}

const settingsOf = (state: ParentSettings): ParentSettings => ({
  bossSize: state.bossSize,
  bossTries: state.bossTries,
  reviewPerDay: state.reviewPerDay,
  playLimits: state.playLimits,
  playExtra: state.playExtra,
})

const without = <T>(map: Readonly<Record<string, T>>, id: string): Record<string, T> => Object.fromEntries(Object.entries(map).filter(([key]) => key !== id))

/** きょうの延長だけを のこす */
const todaysExtra = (extra: ParentSettings['playExtra'], today: string): ParentSettings['playExtra'] =>
  Object.fromEntries(Object.entries(extra).filter(([, value]) => value.day === today))

export const useParent = create<ParentState>()(
  persist(
    (set) => ({
      ...DEFAULT_PARENT,
      update: (patch) => {
        // 決まった値だけを うけつける
        set((state) => parentSchema.parse({ ...settingsOf(state), ...patch }))
      },
      setPlayLimit: (id, limit) => {
        set((state) => parentSchema.parse({ ...settingsOf(state), playLimits: { ...state.playLimits, [profileId.parse(id)]: limit } }))
      },
      extendPlay: (id, minutes, today = dayKey()) => {
        set((state) => {
          const extra = addExtra(state.playExtra[id], minutes, today)
          return parentSchema.parse({ ...settingsOf(state), playExtra: { ...todaysExtra(state.playExtra, today), [profileId.parse(id)]: extra } })
        })
      },
      cancelExtra: (id) => {
        set((state) => ({ playExtra: without(state.playExtra, id) }))
      },
      forgetChild: (id) => {
        set((state) => ({ playLimits: without(state.playLimits, id), playExtra: without(state.playExtra, id) }))
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

/** その子の 1日の時間と、きょうの延長(lib/playLimit の playStatus に渡す)。 */
export function playRuleOf(settings: Pick<ParentSettings, 'playLimits' | 'playExtra'>, id: string, today: string = dayKey()): { readonly limit: PlayLimit; readonly extra: PlayExtra | undefined } {
  const extra = settings.playExtra[id]
  return { limit: settings.playLimits[id] ?? PLAY_LIMIT_DEFAULT, extra: extra && extra.day === today ? extra : undefined }
}
