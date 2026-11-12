import { create } from 'zustand'
import { loadProfiles, MAX_PROFILES, nameSchema, nextProfileId, PROFILES_KEY, storageKeyFor, type Profile, type ProfilesData } from '../lib/profiles'
import { loadProgressFrom } from './progress'

type ProfilesActions = {
  /** あそぶ人を ふやす。作れたら その id、作れなければ(名前が空・人数がいっぱい)null。 */
  add: (name: string) => string | null
  rename: (id: string, name: string) => boolean
  /** その人と、その人の進みぐあいを消す。さいごの1人は消せない。 */
  remove: (id: string) => boolean
  /** あそぶ人を切りかえる。進みぐあいも、その人のものに入れかわる。 */
  select: (id: string) => boolean
  /** 保存してある一覧を読みなおす(テスト用) */
  reload: () => void
}

export type ProfilesState = ProfilesData & ProfilesActions

function save(data: ProfilesData): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify({ profiles: data.profiles, activeId: data.activeId }))
}

export const useProfiles = create<ProfilesState>()((set, get) => {
  const commit = (data: ProfilesData) => {
    save(data)
    set(data)
  }
  return {
    ...loadProfiles(),

    add: (name) => {
      const parsed = nameSchema.safeParse(name)
      const { profiles, activeId } = get()
      if (!parsed.success || profiles.length >= MAX_PROFILES) return null
      const profile: Profile = { id: nextProfileId(profiles), name: parsed.data }
      commit({ profiles: [...profiles, profile], activeId })
      return profile.id
    },

    rename: (id, name) => {
      const parsed = nameSchema.safeParse(name)
      const { profiles, activeId } = get()
      if (!parsed.success || !profiles.some((p) => p.id === id)) return false
      commit({ profiles: profiles.map((p) => (p.id === id ? { ...p, name: parsed.data } : p)), activeId })
      return true
    },

    remove: (id) => {
      const { profiles, activeId } = get()
      const rest = profiles.filter((p) => p.id !== id)
      if (rest.length === 0 || rest.length === profiles.length) return false
      // いま あそんでいる人を消すときは、先に べつの人に切りかえる
      if (activeId === id) get().select(rest[0].id)
      localStorage.removeItem(storageKeyFor(id))
      commit({ profiles: rest, activeId: get().activeId })
      return true
    },

    select: (id) => {
      const { profiles, activeId } = get()
      if (!profiles.some((p) => p.id === id)) return false
      if (id !== activeId) {
        loadProgressFrom(storageKeyFor(id))
        commit({ profiles, activeId: id })
      }
      return true
    },

    reload: () => {
      const data = loadProfiles()
      loadProgressFrom(storageKeyFor(data.activeId))
      set(data)
    },
  }
})
