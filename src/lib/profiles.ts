import { z } from 'zod'
import { levelInfo } from './level'

/** 進みぐあいを保存するキー(1人目)。2人目からは、うしろに「:id」がつく。 */
export const PROGRESS_KEY = 'kanji-zukan-progress'
export const PROFILES_KEY = 'kanji-zukan-profiles'
export const MAX_PROFILES = 6
export const NAME_MAX = 8
/** 1人目の id。前から使っていた保存データを、そのまま この人のものにする。 */
export const FIRST_PROFILE_ID = 'p1'

export const nameSchema = z.string().trim().min(1).max(NAME_MAX)

const profileSchema = z.object({ id: z.string().regex(/^p\d+$/), name: nameSchema })

const profilesSchema = z
  .object({ profiles: z.array(profileSchema).min(1).max(MAX_PROFILES), activeId: z.string() })
  .refine((data) => data.profiles.some((p) => p.id === data.activeId))

export type Profile = z.infer<typeof profileSchema>
export type ProfilesData = z.infer<typeof profilesSchema>

export const DEFAULT_PROFILES: ProfilesData = { profiles: [{ id: FIRST_PROFILE_ID, name: 'プレイヤー1' }], activeId: FIRST_PROFILE_ID }

type Reader = Pick<Storage, 'getItem'>

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    // こわれた保存データは、ないものとして あつかう
    return undefined
  }
}

/** 保存してある「あそぶ人」の一覧を読む。ない・こわれているときは、1人だけの一覧にする。 */
export function loadProfiles(storage: Reader | undefined = globalThis.localStorage): ProfilesData {
  const parsed = profilesSchema.safeParse(parseJson(storage?.getItem(PROFILES_KEY) ?? null))
  return parsed.success ? parsed.data : DEFAULT_PROFILES
}

/** その人の進みぐあいを保存するキー。 */
export function storageKeyFor(id: string): string {
  return id === FIRST_PROFILE_ID ? PROGRESS_KEY : `${PROGRESS_KEY}:${id}`
}

/** まだ使っていない、いちばん小さい番号の id。 */
export function nextProfileId(profiles: readonly Profile[]): string {
  const used = new Set(profiles.map((p) => p.id))
  let n = 1
  while (used.has(`p${n}`)) n += 1
  return `p${n}`
}

export type ProfileSummary = { readonly level: number; readonly learned: number; readonly hat: string }

const savedSchema = z.object({
  state: z.object({
    xp: z.number().optional(),
    points: z.number().optional(),
    learned: z.array(z.string()).optional(),
    equipped: z.object({ hat: z.string().optional() }).optional(),
  }),
})

/** えらぶ画面に出す、その人のレベル・覚えた字の数・ぼうし。保存データから直接読む。 */
export function readSummary(id: string, storage: Reader | undefined = globalThis.localStorage): ProfileSummary {
  const parsed = savedSchema.safeParse(parseJson(storage?.getItem(storageKeyFor(id)) ?? null))
  if (!parsed.success) return { level: 1, learned: 0, hat: 'hat:none' }
  const { state } = parsed.data
  return {
    level: levelInfo(state.xp ?? state.points ?? 0).level,
    learned: state.learned?.length ?? 0,
    hat: state.equipped?.hat ?? 'hat:none',
  }
}
