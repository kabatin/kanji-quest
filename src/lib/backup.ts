import { z } from 'zod'
import { dayKey } from './date'
import { HAND_MAX_CHARS } from './handwriting'
import { HOMEWORK_MAX } from './homework'
import { MAX_PROFILES, nameSchema, PROFILES_KEY, storageKeyFor } from './profiles'

/**
 * 記録の バックアップ(書き出し・読みこみ)。
 * どの関数も 画面や端末の保存先には さわらない(保存先は引数で受けとる)。
 * 外から来たファイルは、ここで 形・版・大きさを たしかめてから、はじめて 保存の形に直す。
 */

export const BACKUP_APP = 'kanji-quest-backup'
/** バックアップファイル自体の版。形を変えるときに上げる。 */
export const BACKUP_FORMAT = 1
/** 読みこむファイルの大きさの上限(文字数)。書いた字(1字 2つまで・各1000字まで)が 全部そろった子が 数人 いても おさまる。 */
export const MAX_BACKUP_CHARS = 8_000_000
/** store/parent.ts の PARENT_KEY と同じ(テストで 同じことを たしかめる)。 */
export const PARENT_STORAGE_KEY = 'kanji-zukan-parent'
const PARENT_STORAGE_VERSION = 1
const MAX_NODES = 300_000
const MAX_DEPTH = 12
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const str = z.string().max(100)
const num = z.number().finite()
const strList = z.array(str).max(5000)
const numMap = z.record(str, num)
const handEntry = z.object({ d: str.max(10), s: z.string().max(HAND_MAX_CHARS) }).strict()

/**
 * 進みぐあい1人ぶんの 中身。ここに書いた項目は、型まで たしかめる(前の版の項目もふくむ)。
 * ここにない項目は、いまのアプリが持っている項目(BackupEnv.stateKeys)だけ 通す。知らない項目は うけつけない。
 */
const stateSchema = z
  .object({
    learned: strList,
    stamps: numMap,
    xp: num,
    coins: num,
    clears: z.record(str, str),
    tries: z.object({ day: str, used: numMap }),
    reviewDone: z.object({ day: str, count: num }),
    seenLevel: num,
    streak: z.object({ count: num, lastDay: str }),
    loginBonus: z.object({ day: str, streakDay: num, coins: num, claimed: z.boolean() }).nullable(),
    daily: z.object({ day: str.optional(), counters: numMap.optional(), claimed: strList.optional() }),
    owned: strList,
    equipped: z.record(str, str),
    decoSpots: z.record(str, z.object({ x: num, z: num })),
    decoTurns: numMap,
    decoStored: strList,
    zukanSeen: num,
    bests: z.record(str, z.object({ score: num, timeMs: num })),
    settings: z.record(str, z.union([z.boolean(), z.string().max(40), num])),
    reviews: z.record(str, z.object({ due: str, step: num })),
    learnedOn: z.record(str, str),
    misses: numMap,
    playMinutes: numMap,
    partClaims: strList,
    // 答えの きろく(字ごと)と 日ごとの集計
    answerLog: z.record(str, z.record(str, z.union([num, str, z.array(z.string().max(20)).max(50)]))),
    answerDays: z.record(str, z.array(num).max(10)),
    // 書いた字(字ごとに 2つまで。lib/handwriting)
    hands: z.record(z.string().max(4), z.object({ f: handEntry, l: handEntry.optional() }).strict()),
    // 古い版(3 以前)の項目
    points: num,
    skin: str,
    stageStars: numMap,
    challenge: z.record(str, z.union([str, num, z.boolean()])),
  })
  .partial()
  .loose()

/** 保存データ1人ぶん。version は、そのとき保存した版(読みこみなおすときの移行に使う)。 */
const storedSchema = z.object({ version: z.number().int().min(0), state: stateSchema }).strict()

const childId = z.string().regex(/^p\d+$/)

const parentSchema = z
  .object({
    bossSize: z.enum(['short', 'normal']),
    bossTries: z.union([z.literal(1), z.literal(3), z.literal(5)]),
    reviewPerDay: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    // 子どもごとの 1日の時間と きょうの延長(前の版の ファイルには ない)
    playLimits: z.record(childId, z.literal([0, 15, 30, 45, 60])).optional(),
    playExtra: z.record(childId, z.object({ day: str, minutes: num }).strict()).optional(),
    // 子どもごとの しゅくだい の字(字 → えらんだ日)
    homework: z.record(childId, z.record(z.string().min(1).max(4), str.max(10)).refine((map) => Object.keys(map).length <= HOMEWORK_MAX)).optional(),
  })
  .strict()

const profileSchema = z.object({ id: z.string().regex(/^p\d+$/), name: nameSchema }).strict()

const backupSchema = z
  .object({
    app: z.literal(BACKUP_APP),
    format: z.literal(BACKUP_FORMAT),
    exportedAt: z.string().max(40).refine((text) => !Number.isNaN(Date.parse(text))),
    profiles: z.object({ profiles: z.array(profileSchema).min(1).max(MAX_PROFILES), activeId: z.string() }).strict(),
    records: z.record(z.string().regex(/^p\d+$/), storedSchema),
    parent: parentSchema.nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = data.profiles.profiles.map((p) => p.id)
    const ok = new Set(ids).size === ids.length && ids.includes(data.profiles.activeId) && Object.keys(data.records).every((id) => ids.includes(id))
    if (!ok) ctx.addIssue({ code: 'custom', message: 'profiles do not match' })
  })

export type BackupFile = z.infer<typeof backupSchema>
type StoredProgress = z.infer<typeof storedSchema>

/** 端末に入っている 生の保存データ(createBackup の材料)。 */
export type BackupInput = {
  readonly profiles: { readonly profiles: readonly { readonly id: string; readonly name: string }[]; readonly activeId: string }
  /** 人ごとの、localStorage の文字列(なければ null) */
  readonly progress: Readonly<Record<string, string | null>>
  readonly parent: string | null
}

/** このアプリの 今の保存データについて、呼ぶ側が 教える材料。lib が store を読まないための引数。 */
export type BackupEnv = {
  /** 保存データの版(store/progress.ts の STORAGE_VERSION)。これより新しい版は ことわる。 */
  readonly progressVersion: number
  /** いまの保存データの項目名(関数をのぞいた、ストアの項目) */
  readonly stateKeys: readonly string[]
}

const LEGACY_STATE_KEYS = ['points', 'skin', 'stageStars', 'challenge']

const hasKnownKeys = (stored: StoredProgress, env: BackupEnv): boolean => {
  const known = new Set([...env.stateKeys, ...LEGACY_STATE_KEYS])
  return Object.keys(stored.state).every((key) => known.has(key))
}

type Reader = Pick<Storage, 'getItem'>
type Writer = Reader & Pick<Storage, 'setItem' | 'removeItem'>

/** 端末から 書き出しの材料を集める。 */
export function readBackupInput(profiles: BackupInput['profiles'], storage: Reader): BackupInput {
  return {
    profiles,
    progress: Object.fromEntries(profiles.profiles.map((p) => [p.id, storage.getItem(storageKeyFor(p.id))])),
    parent: storage.getItem(PARENT_STORAGE_KEY),
  }
}

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const parsedProgress = (raw: string | null, env: BackupEnv): StoredProgress | undefined => {
  const result = storedSchema.safeParse(parseJson(raw))
  return result.success && hasKnownKeys(result.data, env) ? result.data : undefined
}

const parsedParent = (raw: string | null) => {
  const body = parseJson(raw)
  const state = body && typeof body === 'object' ? (body as { state?: unknown }).state : undefined
  const result = parentSchema.safeParse(state)
  return result.success ? result.data : null
}

export type CreatedBackup = {
  readonly file: BackupFile
  /** 読めなくて 入れられなかった人の id(ふつうは 空) */
  readonly skipped: readonly string[]
}

/** 書き出すファイルの中身を作る。記録がまだない人は、名前だけ入れる。 */
export function createBackup(input: BackupInput, now: Date, env: BackupEnv): CreatedBackup {
  const records: Record<string, StoredProgress> = {}
  const skipped: string[] = []
  for (const { id } of input.profiles.profiles) {
    const raw = input.progress[id] ?? null
    const stored = parsedProgress(raw, env)
    if (stored) records[id] = stored
    else if (raw !== null) skipped.push(id)
  }
  const file: BackupFile = {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: now.toISOString(),
    profiles: { profiles: input.profiles.profiles.map((p) => ({ id: p.id, name: p.name })), activeId: input.profiles.activeId },
    records,
    parent: parsedParent(input.parent),
  }
  return { file, skipped }
}

export const serializeBackup = (file: BackupFile): string => JSON.stringify(file)

/** 例: kanji-quest-kiroku-2026-11-15.json */
export const backupFileName = (now: Date): string => `kanji-quest-kiroku-${dayKey(now)}.json`

export type BackupSummary = {
  readonly exportedOn: string
  readonly children: readonly { readonly id: string; readonly name: string; readonly learned: number }[]
  readonly hasParent: boolean
}

export type BackupFailure = 'too-big' | 'not-json' | 'not-backup' | 'too-new' | 'invalid'

export type ParseResult =
  | { readonly ok: true; readonly file: BackupFile; readonly summary: BackupSummary }
  | { readonly ok: false; readonly reason: BackupFailure; readonly message: string }

const FAILURE_MESSAGE: Readonly<Record<BackupFailure, string>> = {
  'too-big': 'ファイルが大きすぎます。このアプリで書き出したファイルではないようです。',
  'not-json': 'ファイルを読めませんでした。壊れているか、別のファイルかもしれません。',
  'not-backup': 'このアプリで書き出した記録ファイルではないようです。',
  'too-new': 'このファイルは、より新しい版のアプリで書き出されたものです。アプリを最新にしてから、もう一度お試しください。',
  invalid: 'ファイルの中身が正しくありません。壊れているか、書きかえられた可能性があります。いまの記録は変えていません。',
}

const fail = (reason: BackupFailure): ParseResult => ({ ok: false, reason, message: FAILURE_MESSAGE[reason] })

/** 入れ子が深すぎない・項目が多すぎない・あぶない名前の項目がない、を たしかめる。 */
function isSafeShape(root: unknown): boolean {
  const stack: { value: unknown; depth: number }[] = [{ value: root, depth: 0 }]
  let nodes = 0
  for (let item = stack.pop(); item; item = stack.pop()) {
    const { value, depth } = item
    if (value === null || typeof value !== 'object') continue
    nodes += 1
    if (nodes > MAX_NODES || depth > MAX_DEPTH) return false
    const keys = Array.isArray(value) ? [] : Object.keys(value)
    if (keys.some((key) => UNSAFE_KEYS.has(key))) return false
    const children: unknown[] = Array.isArray(value) ? value : Object.values(value)
    nodes += children.length
    for (const child of children) stack.push({ value: child, depth: depth + 1 })
  }
  return true
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)

/** 新しすぎる版か。ファイルの版、または 中の保存データの版が、このアプリより大きい。 */
function isTooNew(body: Record<string, unknown>, progressVersion: number): boolean {
  if (typeof body.format === 'number' && body.format > BACKUP_FORMAT) return true
  if (!isRecord(body.records)) return false
  return Object.values(body.records).some((stored) => isRecord(stored) && typeof stored.version === 'number' && stored.version > progressVersion)
}

function summarize(file: BackupFile): BackupSummary {
  return {
    exportedOn: dayKey(new Date(file.exportedAt)),
    children: file.profiles.profiles.map((p) => ({ id: p.id, name: p.name, learned: file.records[p.id]?.state.learned?.length ?? 0 })),
    hasParent: file.parent !== null,
  }
}

/**
 * 読みこんだ文字列を たしかめる。env は、このアプリの保存データの版と項目(新しすぎる版・知らない項目を ことわる)。
 * 通ったものだけが ok: true で返る。
 */
export function parseBackup(text: string, env: BackupEnv): ParseResult {
  if (text.length > MAX_BACKUP_CHARS) return fail('too-big')
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return fail('not-json')
  }
  if (!isRecord(body) || body.app !== BACKUP_APP) return fail('not-backup')
  if (isTooNew(body, env.progressVersion)) return fail('too-new')
  if (!isSafeShape(body)) return fail('invalid')
  const parsed = backupSchema.safeParse(body)
  if (!parsed.success || !Object.values(parsed.data.records).every((stored) => hasKnownKeys(stored, env))) return fail('invalid')
  return { ok: true, file: parsed.data, summary: summarize(parsed.data) }
}

/** 端末に書く内容。set は 書く(キー → 文字列)、remove は 消すキー。 */
export type RestorePlan = { readonly set: Readonly<Record<string, string>>; readonly remove: readonly string[] }

/** いまの人たちの id(currentIds)を ファイルの内容に おきかえる計画。ファイルにない人の記録は 消す。 */
export function planRestore(file: BackupFile, currentIds: readonly string[]): RestorePlan {
  const set: Record<string, string> = {}
  for (const [id, stored] of Object.entries(file.records)) set[storageKeyFor(id)] = JSON.stringify(stored)
  set[PROFILES_KEY] = JSON.stringify(file.profiles)
  if (file.parent) set[PARENT_STORAGE_KEY] = JSON.stringify({ state: file.parent, version: PARENT_STORAGE_VERSION })
  const remove = [...new Set([...currentIds, ...file.profiles.profiles.map((p) => p.id)])].map(storageKeyFor).filter((key) => !(key in set))
  return { set, remove }
}

export type ApplyResult = { readonly ok: true } | { readonly ok: false; readonly message: string }

const isQuotaError = (error: unknown): boolean => error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)

/**
 * 計画どおりに 書く。途中で失敗したら、書きかけを すべて もとにもどす(半端な状態を のこさない)。
 * 「人の一覧」は さいごに書くので、途中で止まっても 一覧だけ 新しい、にはならない。
 */
export function applyRestore(storage: Writer, plan: RestorePlan): ApplyResult {
  const keys = [...Object.keys(plan.set), ...plan.remove]
  const before = new Map(keys.map((key) => [key, storage.getItem(key)] as const))
  const writeOrder = [...Object.keys(plan.set).filter((key) => key !== PROFILES_KEY), ...(PROFILES_KEY in plan.set ? [PROFILES_KEY] : [])]
  try {
    for (const key of writeOrder) storage.setItem(key, plan.set[key])
    for (const key of plan.remove) storage.removeItem(key)
    return { ok: true }
  } catch (error) {
    rollback(storage, before)
    const reason = isQuotaError(error) ? 'この端末の保存できる量がいっぱいです。' : '記録を書きこめませんでした。'
    return { ok: false, message: `${reason}いまの記録は変えていません。` }
  }
}

function rollback(storage: Writer, before: ReadonlyMap<string, string | null>): void {
  for (const [key, value] of before) {
    try {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    } catch {
      // もどせなかった分は、つぎの キー の もどしを 続ける
    }
  }
}
