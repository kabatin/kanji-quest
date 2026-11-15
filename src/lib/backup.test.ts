import { beforeEach, describe, expect, it } from 'vitest'
import { PARENT_KEY } from '../store/parent'
import { STORAGE_VERSION, useProgress } from '../store/progress'
import { applyRestore, backupFileName, BACKUP_FORMAT, createBackup, MAX_BACKUP_CHARS, PARENT_STORAGE_KEY, parseBackup, planRestore, readBackupInput, serializeBackup, type BackupInput } from './backup'
import { PROFILES_KEY, storageKeyFor } from './profiles'

const NOW = new Date('2026-11-15T03:00:00.000Z')

const state = (learned: readonly string[]) => ({
  learned,
  xp: 120,
  coins: 40,
  streak: { count: 2, lastDay: '2026-11-14' },
  loginBonus: null,
  daily: { day: '2026-11-14', counters: { learn: 1 }, claimed: [] },
  decoSpots: { tree: { x: 1, z: -2 } },
  settings: { sound: true, music: false },
  reviews: { 日: { due: '2026-11-16', step: 0 } },
})

const stored = (learned: readonly string[], version = STORAGE_VERSION) => JSON.stringify({ state: state(learned), version })

const INPUT: BackupInput = {
  profiles: {
    profiles: [
      { id: 'p1', name: 'たろう' },
      { id: 'p2', name: 'はな' },
    ],
    activeId: 'p2',
  },
  progress: { p1: stored(['日', '月', '火']), p2: stored(['山']) },
  parent: JSON.stringify({ state: { bossSize: 'short', bossTries: 5, reviewPerDay: 15 }, version: 1 }),
}

const text = () => serializeBackup(createBackup(INPUT, NOW, ENV).file)
const ENV = { progressVersion: STORAGE_VERSION, stateKeys: Object.entries(useProgress.getState()).filter(([, v]) => typeof v !== 'function').map(([k]) => k) }
const check = (raw: string) => parseBackup(raw, ENV)
const mutate = (change: (body: Record<string, any>) => void) => {
  const body = JSON.parse(text()) as Record<string, any>
  change(body)
  return JSON.stringify(body)
}

describe('backup: 作る', () => {
  it('版・書き出した日・全員ぶんの記録・保護者設定が入る', () => {
    const { file, skipped } = createBackup(INPUT, NOW, ENV)
    expect(skipped).toEqual([])
    expect(file.format).toBe(BACKUP_FORMAT)
    expect(file.exportedAt).toBe('2026-11-15T03:00:00.000Z')
    expect(Object.keys(file.records)).toEqual(['p1', 'p2'])
    expect(file.parent).toEqual({ bossSize: 'short', bossTries: 5, reviewPerDay: 15 })
  })

  it('記録がまだない人・保護者設定がないときは、入れずに進む', () => {
    const { file, skipped } = createBackup({ ...INPUT, progress: { p1: stored(['日']), p2: null }, parent: null }, NOW, ENV)
    expect(Object.keys(file.records)).toEqual(['p1'])
    expect(file.parent).toBeNull()
    expect(skipped).toEqual([])
  })

  it('読めない記録は skipped に入れる', () => {
    expect(createBackup({ ...INPUT, progress: { p1: '{こわれた', p2: stored([]) } }, NOW, ENV).skipped).toEqual(['p1'])
  })

  it('ファイル名に日付が入る', () => {
    expect(backupFileName(new Date(2026, 10, 5))).toBe('kanji-quest-kiroku-2026-11-05.json')
  })

  it('保護者設定の保存キーは store と同じ', () => {
    expect(PARENT_STORAGE_KEY).toBe(PARENT_KEY)
  })
})

describe('backup: 読みこみの検証', () => {
  it('正しいファイルは通り、だれの記録か・覚えた字の数・書き出した日が分かる', () => {
    const result = check(text())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.children).toEqual([
      { id: 'p1', name: 'たろう', learned: 3 },
      { id: 'p2', name: 'はな', learned: 1 },
    ])
    expect(result.summary.hasParent).toBe(true)
    expect(result.summary.exportedOn).toMatch(/^2026-11-1[45]$/)
  })

  it('壊れた JSON は ことわる', () => {
    const result = check('{"app": ')
    expect(result).toMatchObject({ ok: false, reason: 'not-json' })
  })

  it('別のファイル(JSON だが このアプリのものでない)は ことわる', () => {
    expect(check('[1,2]')).toMatchObject({ ok: false, reason: 'not-backup' })
    expect(check('{"hello":1}')).toMatchObject({ ok: false, reason: 'not-backup' })
  })

  it('大きすぎるファイルは ことわる', () => {
    expect(check(' '.repeat(MAX_BACKUP_CHARS + 1))).toMatchObject({ ok: false, reason: 'too-big' })
  })

  it('新しすぎる版(ファイルの版・保存データの版)は、分かる文で ことわる', () => {
    const newerFile = check(mutate((b) => (b.format = BACKUP_FORMAT + 1)))
    const newerData = check(mutate((b) => (b.records.p1.version = STORAGE_VERSION + 1)))
    for (const result of [newerFile, newerData]) {
      expect(result).toMatchObject({ ok: false, reason: 'too-new' })
      if (!result.ok) expect(result.message).toContain('新しい版')
    }
  })

  it.each([
    ['知らない項目(上の階)', (b: Record<string, any>) => (b.extra = 1)],
    ['知らない項目(記録の中)', (b: Record<string, any>) => (b.records.p1.state.hack = 1)],
    ['値の型ちがい', (b: Record<string, any>) => (b.records.p1.state.xp = 'たくさん')],
    ['数でない値', (b: Record<string, any>) => (b.records.p1.state.learned = [1, 2])],
    ['id がちがう記録', (b: Record<string, any>) => (b.records.p9 = b.records.p1)],
    ['名前が空', (b: Record<string, any>) => (b.profiles.profiles[0].name = '')],
    ['選んでいる人がいない', (b: Record<string, any>) => (b.profiles.activeId = 'p7')],
    ['人が7人', (b: Record<string, any>) => (b.profiles.profiles = Array.from({ length: 7 }, (_, i) => ({ id: `p${i + 1}`, name: 'あ' })))],
    ['保護者設定が決まった値でない', (b: Record<string, any>) => (b.parent.bossTries = 99)],
    ['日付でない書き出し日', (b: Record<string, any>) => (b.exportedAt = 'きのう')],
    ['版が負の数', (b: Record<string, any>) => (b.records.p1.version = -1)],
  ])('形ちがい: %s', (_label, change) => {
    expect(check(mutate(change))).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('あぶない名前の項目(__proto__)は ことわる', () => {
    const raw = text().replace('"settings":{', '"settings":{"__proto__":true,')
    expect(raw).toContain('__proto__')
    expect(check(raw)).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('入れ子が深すぎるものは ことわる', () => {
    const deep = '{"a":'.repeat(30) + '1' + '}'.repeat(30)
    const raw = mutate((b) => (b.records.p1.state.stamps = JSON.parse(deep)))
    expect(check(raw)).toMatchObject({ ok: false, reason: 'invalid' })
  })

  it('古い版(3)の保存データも 通る(読みこみなおすときに 既存の移行を通る)', () => {
    const legacy = { version: 3, state: { learned: ['日'], xp: 5, stageStars: { s1: 3 } } }
    const result = check(mutate((b) => (b.records.p1 = legacy)))
    expect(result.ok).toBe(true)
  })
})

describe('backup: 置きかえる', () => {
  let storage: Storage

  beforeEach(() => {
    storage = localStorage
    storage.clear()
  })

  const parsed = () => {
    const result = check(text())
    if (!result.ok) throw new Error('fixture')
    return result.file
  }

  it('書き出して 読みこむと、保存データがもとと同じになる(往復)', () => {
    storage.setItem(PROFILES_KEY, JSON.stringify(INPUT.profiles))
    storage.setItem(storageKeyFor('p1'), INPUT.progress.p1 as string)
    storage.setItem(storageKeyFor('p2'), INPUT.progress.p2 as string)
    storage.setItem(PARENT_KEY, INPUT.parent as string)
    const before = Object.fromEntries(Object.entries({ ...storage }))

    const exported = serializeBackup(createBackup(readBackupInput(INPUT.profiles, storage), NOW, ENV).file)
    storage.clear()
    const result = check(exported)
    if (!result.ok) throw new Error(result.message)
    expect(applyRestore(storage, planRestore(result.file, []))).toEqual({ ok: true })

    const after = Object.fromEntries(Object.entries({ ...storage }))
    const norm = (map: Record<string, string>) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, JSON.parse(v)]))
    expect(norm(after)).toEqual(norm(before))
  })

  it('ファイルにいない人の記録は 消える', () => {
    storage.setItem(storageKeyFor('p3'), stored(['木']))
    storage.setItem(storageKeyFor('p2'), stored(['古い']))
    const file = { ...parsed(), records: {}, profiles: { profiles: [{ id: 'p1', name: 'たろう' }], activeId: 'p1' } }
    expect(applyRestore(storage, planRestore(file, ['p1', 'p2', 'p3']))).toEqual({ ok: true })
    expect(storage.getItem(storageKeyFor('p3'))).toBeNull()
    expect(storage.getItem(storageKeyFor('p2'))).toBeNull()
  })

  it('保護者設定がファイルになければ、いまの設定は そのまま', () => {
    storage.setItem(PARENT_KEY, 'いまの設定')
    const file = { ...parsed(), parent: null }
    applyRestore(storage, planRestore(file, ['p1']))
    expect(storage.getItem(PARENT_KEY)).toBe('いまの設定')
  })

  it('途中で容量オーバーになっても、いまの記録は 1つも変わらない', () => {
    storage.setItem(PROFILES_KEY, '古い一覧')
    storage.setItem(storageKeyFor('p1'), '古い記録1')
    storage.setItem(storageKeyFor('p3'), '古い記録3')
    let writes = 0
    const flaky = {
      getItem: (key: string) => storage.getItem(key),
      removeItem: (key: string) => storage.removeItem(key),
      setItem: (key: string, value: string) => {
        writes += 1
        if (writes === 2) throw new DOMException('full', 'QuotaExceededError')
        storage.setItem(key, value)
      },
    }
    const result = applyRestore(flaky, planRestore(parsed(), ['p1', 'p3']))
    expect(result).toMatchObject({ ok: false })
    if (!result.ok) expect(result.message).toContain('いっぱい')
    expect(storage.getItem(PROFILES_KEY)).toBe('古い一覧')
    expect(storage.getItem(storageKeyFor('p1'))).toBe('古い記録1')
    expect(storage.getItem(storageKeyFor('p3'))).toBe('古い記録3')
    expect(storage.getItem(storageKeyFor('p2'))).toBeNull()
    expect(storage.getItem(PARENT_KEY)).toBeNull()
  })

  it('人の一覧は さいごに書く', () => {
    const order: string[] = []
    const spy = { getItem: () => null, removeItem: () => undefined, setItem: (key: string) => void order.push(key) }
    applyRestore(spy, planRestore(parsed(), []))
    expect(order.at(-1)).toBe(PROFILES_KEY)
  })
})
