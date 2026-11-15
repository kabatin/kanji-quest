import { z } from 'zod'
import { addDays, daysBetween } from './date'
import { hasStamp } from './rewards'
import { isHinted, MASTERED_INTERVAL, REVIEW_INTERVALS, type AnswerKind, type CharAnswer, type ReviewCard, type Reviews } from './review'

/**
 * 答えの きろく(端末の中だけ。外へは 送らない)。
 * 字ごとに 新しい方から RECENT_PER_CHAR 件までを みじかい文字列で のこし、古い分は 合計の数(n・x)と 書く力の段(w)に たたむ。
 * 保護者の画面の 割合 は、日ごとの集計(AnswerDays)から出す。
 */

/** どこで答えたか */
export type AnswerWhere = 'learn' | 'review' | 'boss' | 'weak' | 'challenge'

/** 画面から渡す 1問ぶんの答え。hint は 書く問題で出た いちばん上のヒントの段(`<Kaku>` の WriteReport.maxHint) */
export type AnswerInput = CharAnswer & { readonly kind: AnswerKind }

/** 書く力の段。0 = まだ / 1 = 見て書けた / 2 = 見ないで書けた / 3 = 日をあけても 見ないで書けた */
export type WriteLevel = 0 | 1 | 2 | 3

export type CharLog = {
  /** 最近の答え(古い順)。1つ = 日の番号 + どこで + 種類 + 正誤 + ヒントの段 */
  readonly a: readonly string[]
  /** これまでの 答えの数 */
  readonly n: number
  /** これまでに まちがえた数 */
  readonly x: number
  /** いまの 書く力の段 */
  readonly w: WriteLevel
  /** はじめて 見ないで(ヒントなしで)書けた日 */
  readonly b?: string
  /** さいごに 苦手から ぬけた日 */
  readonly o?: string
}

export type AnswerLog = Readonly<Record<string, CharLog>>
/** 日ごとの集計。並びは TALLY の番号 */
export type DayTally = readonly number[]
export type AnswerDays = Readonly<Record<string, DayTally>>
export type AnswerBook = { readonly answerLog: AnswerLog; readonly answerDays: AnswerDays }

export const EMPTY_BOOK: AnswerBook = { answerLog: {}, answerDays: {} }

/** 集計の並び。spaced = 復習で 前に見てから SPACED_DAYS 日以上あいた 見ないで書く問題 / writes = テストで書いた問題(ヒントの段が わかるもの) */
export const TALLY = { answers: 0, ok: 1, spaced: 2, spacedOk: 3, writes: 4, hinted: 5 } as const
const EMPTY_TALLY: DayTally = [0, 0, 0, 0, 0, 0]

export const RECENT_PER_CHAR = 10
/** 日ごとの集計を のこす日数(26週) */
export const ANSWER_DAYS_KEPT = 182
/** 「日をあけた」と みなす日数 */
export const SPACED_DAYS = 7

const EPOCH = '2020-01-01'
const WHERE_CODE: Readonly<Record<AnswerWhere, string>> = { learn: 'l', review: 'r', boss: 'b', weak: 'w', challenge: 'c' }
const KIND_CODE: Readonly<Record<AnswerKind, string>> = { select: 's', model: 'm', blind: 'n' }
const NO_HINT = '_'
const ENTRY_PATTERN = /^(\d+)([lrbwc])([smn])([01])([0-4_])$/
const TEST_PLACES: ReadonlySet<AnswerWhere> = new Set(['review', 'boss', 'weak'])

const invert = <K extends string>(codes: Readonly<Record<K, string>>): Record<string, K> =>
  Object.fromEntries(Object.entries(codes).map(([key, code]) => [code, key])) as Record<string, K>
const WHERE_OF = invert(WHERE_CODE)
const KIND_OF = invert(KIND_CODE)

export type AnswerEntry = {
  readonly day: string
  readonly where: AnswerWhere
  readonly kind: AnswerKind
  readonly ok: boolean
  /** ヒントの段(わからないときは null) */
  readonly hint: number | null
}

export function encodeEntry(entry: AnswerEntry): string {
  const day = Math.max(0, daysBetween(EPOCH, entry.day))
  return `${day}${WHERE_CODE[entry.where]}${KIND_CODE[entry.kind]}${entry.ok ? 1 : 0}${entry.hint ?? NO_HINT}`
}

export function decodeEntry(code: string): AnswerEntry | null {
  const match = ENTRY_PATTERN.exec(code)
  if (!match) return null
  const [, day, where, kind, ok, hint] = match
  return { day: addDays(EPOCH, Number(day)), where: WHERE_OF[where], kind: KIND_OF[kind], ok: ok === '1', hint: hint === NO_HINT ? null : Number(hint) }
}

/** 最近の答え(新しい順)。読めない きろく は とばす。 */
export function recentAnswers(log: CharLog | undefined): AnswerEntry[] {
  return [...(log?.a ?? [])].reverse().flatMap((code) => decodeEntry(code) ?? [])
}

/** 今までの記録(はんこ・ふくしゅう の予定・覚えた日)。ログがない字の 見つもりに使う */
export type SeedSource = {
  readonly stamps: Readonly<Record<string, number>>
  readonly reviews: Reviews
  readonly learnedOn: Readonly<Record<string, string>>
}

const intervalOf = (step: number): number => REVIEW_INTERVALS[step] ?? MASTERED_INTERVAL

/**
 * ログがない字(この しくみ の前の記録)の 書く力を、少なめに 見つもる。
 * 前は えらぶ問題の正解でも 段が進んだので、見ないで書く段を 1つ こえた(段4)で「見ないで書けた」、2つ こえた(段5)で「日をあけても書けた」とする。
 */
export function legacyLevel(char: string, stamps: SeedSource['stamps'], card: ReviewCard | undefined): WriteLevel {
  const step = card?.step ?? -1
  if (step >= 5) return 3
  if (step >= 4) return 2
  return hasStamp(stamps[char], 'write') || step >= 2 ? 1 : 0
}

/** 段4に あがった日の 見つもり(予定日から、そこまでの間隔を もどす)。段4より前なら なし */
export function legacyBlindDay(card: ReviewCard | undefined): string | undefined {
  if (!card || card.step < 4) return undefined
  const back = Array.from({ length: card.step - 3 }, (_, i) => intervalOf(i + 4)).reduce((sum, days) => sum + days, 0)
  return addDays(card.due, -back)
}

function seedLog(char: string, seed: SeedSource): CharLog {
  const w = legacyLevel(char, seed.stamps, seed.reviews[char])
  const b = w >= 2 ? legacyBlindDay(seed.reviews[char]) : undefined
  return { a: [], n: 0, x: 0, w, ...(b ? { b } : {}) }
}

/** 前に その字を見た日。ログ、なければ ふくしゅう の予定(予定日 − 間隔)、なければ 覚えた日 */
function lastSeen(log: CharLog, card: ReviewCard | undefined, learnedOn: string | undefined): string | undefined {
  const last = log.a.length > 0 ? decodeEntry(log.a[log.a.length - 1]) : null
  if (last) return last.day
  return card ? addDays(card.due, -intervalOf(card.step)) : learnedOn
}

function nextLevel(w: WriteLevel, answer: AnswerInput, spaced: boolean): WriteLevel {
  if (answer.kind === 'select') return w
  if (answer.kind === 'model') return answer.ok ? (Math.max(w, 1) as WriteLevel) : w
  if (answer.ok && !isHinted(answer.hint)) return Math.max(w, spaced ? 3 : 2) as WriteLevel
  return Math.min(w, 1) as WriteLevel
}

function noteAnswer(log: CharLog, answer: AnswerInput, where: AnswerWhere, today: string, spaced: boolean): CharLog {
  const code = encodeEntry({ day: today, where, kind: answer.kind, ok: answer.ok, hint: answer.hint ?? null })
  const w = nextLevel(log.w, answer, spaced)
  const freeWrite = answer.kind === 'blind' && answer.ok && !isHinted(answer.hint)
  const b = log.b ?? (freeWrite ? today : undefined)
  return { ...log, a: [...log.a, code].slice(-RECENT_PER_CHAR), n: log.n + 1, x: log.x + (answer.ok ? 0 : 1), w, ...(b ? { b } : {}) }
}

function addTally(tally: DayTally, where: AnswerWhere, answer: AnswerInput, spaced: boolean): DayTally {
  const isSpaced = where === 'review' && answer.kind === 'blind' && spaced
  const isTestWrite = TEST_PLACES.has(where) && answer.kind !== 'select' && answer.hint !== undefined
  const add = [1, answer.ok ? 1 : 0, isSpaced ? 1 : 0, isSpaced && answer.ok && !isHinted(answer.hint) ? 1 : 0, isTestWrite ? 1 : 0, isTestWrite && isHinted(answer.hint) ? 1 : 0]
  return add.map((n, i) => (tally[i] ?? 0) + n)
}

const keepDays = (days: AnswerDays, today: string): AnswerDays =>
  Object.fromEntries(Object.entries(days).filter(([day]) => daysBetween(day, today) < ANSWER_DAYS_KEPT))

/** 1回の あそび ぶんの答えを、順に のこす(同じ字を 続けて といたときは、前の答えも「前に見た」に入る)。 */
export function logAnswers(book: AnswerBook, where: AnswerWhere, answers: readonly AnswerInput[], today: string, seed: SeedSource): AnswerBook {
  if (answers.length === 0) return book
  // 変わった字だけを 集めてから 重ねる(字が ふえても 1回の写しで すむ)
  const start: { changed: Readonly<Record<string, CharLog>>; tally: DayTally } = { changed: {}, tally: book.answerDays[today] ?? EMPTY_TALLY }
  const end = answers.reduce((acc, answer) => {
    const before = acc.changed[answer.char] ?? book.answerLog[answer.char] ?? seedLog(answer.char, seed)
    const seen = lastSeen(before, seed.reviews[answer.char], seed.learnedOn[answer.char])
    const spaced = seen !== undefined && daysBetween(seen, today) >= SPACED_DAYS
    return { changed: { ...acc.changed, [answer.char]: noteAnswer(before, answer, where, today, spaced) }, tally: addTally(acc.tally, where, answer, spaced) }
  }, start)
  return { answerLog: { ...book.answerLog, ...end.changed }, answerDays: keepDays({ ...book.answerDays, [today]: end.tally }, today) }
}

/** まちがいの回数が 0 に なった字(苦手から ぬけた字)に、その日を しるす。 */
export function markWeakExits(
  log: AnswerLog,
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
  today: string,
  seed: SeedSource,
): AnswerLog {
  const exits = Object.keys(before).filter((char) => (before[char] ?? 0) > 0 && (after[char] ?? 0) <= 0)
  if (exits.length === 0) return log
  return { ...log, ...Object.fromEntries(exits.map((char) => [char, { ...(log[char] ?? seedLog(char, seed)), o: today }])) }
}

const charLogSchema = z.object({
  a: z.array(z.string().max(20)).catch([]),
  n: z.number().int().min(0).catch(0),
  x: z.number().int().min(0).catch(0),
  w: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).catch(0),
  b: z.string().optional().catch(undefined),
  o: z.string().optional().catch(undefined),
})

/** 保存してあった 答えの きろく。こわれていたら 読めるところだけ */
export const answerLogSchema = z.record(z.string(), charLogSchema).catch({})
export const answerDaysSchema = z.record(z.string(), z.array(z.number().finite()).max(TALLY.hinted + 1)).catch({})
