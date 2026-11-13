import type { GlyphRef, Kanji } from '../data/schema'
import { fullGlyph } from '../data/strokes'
import { BOSS_TRIES_PER_DAY, type BossKind } from './rewards'
import { examId, type Area, type AreaBoss } from './stages'
import { buildErabi, buildQuestion, shuffle, type ErabiQuestion, type KumiQuestion, type Rng } from './quiz'

/** ぜんぶの部位: その漢字を作っている部位を、6枚の中から全部えらぶ */
export type PartsQuestion = {
  readonly type: 'parts'
  readonly kanji: Kanji
  /** 正解の部位と、その漢字の中での形 */
  readonly answers: readonly { readonly id: string; readonly glyph: GlyphRef }[]
  /** 選択肢の部位 id(正解を全部ふくむ) */
  readonly choices: readonly string[]
}

/** かく: part = つくり(えらぶほうの部位)だけ書く / whole = 字ぜんたいを書く */
export type WriteQuestion = {
  readonly type: 'write'
  readonly kanji: Kanji
  readonly mode: 'part' | 'whole'
  /** 見本(うすい字)が見えるか */
  readonly model: boolean
  /** 書く画(画番号。1始まり、書く順) */
  readonly strokes: readonly number[]
  /** はじめから書いてある画 */
  readonly given: readonly number[]
}

export type BossQuestion = KumiQuestion | PartsQuestion | ErabiQuestion | WriteQuestion

export const PARTS_CHOICE_COUNT = 6

/** その漢字を作っている、いちばん小さい部位(とちゅうで できる部位は のぞく)。 */
export function leafParts(kanji: Kanji): { id: string; glyph: GlyphRef }[] {
  const made = new Set(kanji.steps.map((s) => s.makes).filter((id): id is string => id !== undefined))
  const all = kanji.steps.flatMap((s) => [
    { id: s.fixed, glyph: s.fixedGlyph },
    { id: s.answer, glyph: s.answerGlyph },
  ])
  return all.filter((part, i) => !made.has(part.id) && all.findIndex((p) => p.id === part.id) === i)
}

export function buildParts(kanji: Kanji, kanjiList: readonly Kanji[], rng: Rng = Math.random): PartsQuestion {
  const answers = leafParts(kanji)
  const skip = new Set([...answers.map((a) => a.id), ...kanji.parts, kanji.char])
  const others = [...new Set(kanjiList.flatMap((k) => k.parts))].filter((id) => !skip.has(id))
  const distractors = shuffle(others, rng).slice(0, Math.max(PARTS_CHOICE_COUNT - answers.length, 0))
  return { type: 'parts', kanji, answers, choices: shuffle([...answers.map((a) => a.id), ...distractors], rng) }
}

export function buildWrite(kanji: Kanji, mode: 'part' | 'whole', model: boolean): WriteQuestion {
  const all = fullGlyph(kanji.char).strokes
  const last = kanji.steps[kanji.steps.length - 1]
  if (mode === 'whole' || !last || last.answerGlyph.source !== kanji.char) {
    return { type: 'write', kanji, mode: 'whole', model, strokes: all, given: [] }
  }
  const strokes = [...last.answerGlyph.strokes].sort((a, b) => a - b)
  return { type: 'write', kanji, mode: 'part', model, strokes, given: all.filter((n) => !strokes.includes(n)) }
}

/** えらぶ問題の種類。kumi と parts は、部位に分けられる漢字にだけ出せる。 */
export const SELECT_TYPES = ['kumi', 'story', 'parts', 'picture'] as const
export type SelectType = (typeof SELECT_TYPES)[number]

export function buildSelect(kanji: Kanji, type: SelectType, all: readonly Kanji[], rng: Rng): BossQuestion {
  const canSplit = kanji.steps.length > 0
  if (type === 'kumi' && canSplit) return buildQuestion(kanji, Math.floor(rng() * kanji.steps.length), all, rng)
  if (type === 'parts' && canSplit) return buildParts(kanji, all, rng)
  return buildErabi(kanji, all, rng, type === 'story' || type === 'kumi' ? 'story' : 'picture')
}

/** 問題の数。select = えらぶ / model = 見本を見て書く / blind = 見本なしで書く */
export type BossPlan = { readonly select: number; readonly model: number; readonly blind: number }

/** エリアの ボス(中ボス・ラスボス): えらぶ・見て書く・見ないで書く を5問ずつ */
export const AREA_BOSS_PLAN: BossPlan = { select: 5, model: 5, blind: 5 }
/** そつぎょうしけん: 学年の漢字から ぬきだして出す */
export const EXAM_PLAN: BossPlan = { select: 10, model: 5, blind: 5 }

/**
 * kanji の中から count 字えらぶ。同じ字が2回出ないように えらび、
 * 字が足りないときだけ、ひとまわりしてから もう一度まぜて くり返す。
 */
export function take(kanji: readonly Kanji[], count: number, rng: Rng): Kanji[] {
  const rounds = Math.ceil(count / Math.max(kanji.length, 1))
  return Array.from({ length: rounds }, () => shuffle(kanji, rng))
    .flat()
    .slice(0, count)
}

/** 漢字ごとの、まちがえた回数(ふくしゅう・ボス)。多いほど 苦手 */
export type Misses = Readonly<Record<string, number>>

/**
 * ボスに出す字を count 字えらぶ。苦手な字(まちがえた回数が多い字)から先に えらび、
 * のこりは まぜて えらぶ。えらんだ字は まぜて返すので、苦手な字が はじめに かたまらない。
 */
export function pickForBoss(kanji: readonly Kanji[], count: number, misses: Misses, rng: Rng): Kanji[] {
  const weak = shuffle(kanji.filter((k) => (misses[k.char] ?? 0) > 0), rng).sort((a, b) => (misses[b.char] ?? 0) - (misses[a.char] ?? 0))
  const rest = kanji.filter((k) => (misses[k.char] ?? 0) <= 0)
  // 字が問題の数より少ないときは、これまでどおり ひとまわりしてから くり返す
  if (kanji.length < count) return take(kanji, count, rng)
  return shuffle([...weak, ...shuffle(rest, rng)].slice(0, count), rng)
}

/**
 * ボスの問題を作る。えらぶ問題 → 見本を見て書く → 見本なしで書く の順に出す。
 * 出す字は、1回の たたかい を通して かさならないように えらぶ(字が問題の数より少ないときだけ くり返す)。
 * 苦手な字(misses)が あれば、それを 優先して出す。
 * えらぶ問題は、4つの種類(つくり・ぜんぶの部位・なりたち・絵)が まんべんなく出るように回す。
 */
export function buildBoss(kanji: readonly Kanji[], all: readonly Kanji[], plan: BossPlan, rng: Rng = Math.random, misses: Misses = {}): BossQuestion[] {
  if (kanji.length === 0) return []
  const types = shuffle(SELECT_TYPES, rng)
  const picked = pickForBoss(kanji, plan.select + plan.model + plan.blind, misses, rng)
  const select = picked.slice(0, plan.select).map((k, i) => buildSelect(k, types[i % types.length], all, rng))
  // 見て書く問題は、つくり だけ と 字ぜんたい を かわりばんこに
  const model = picked.slice(plan.select, plan.select + plan.model).map((k, i) => buildWrite(k, i % 2 === 0 ? 'part' : 'whole', true))
  const blind = picked.slice(plan.select + plan.model).map((k) => buildWrite(k, 'whole', false))
  return [...select, ...model, ...blind]
}

/** ボスの名前。筆づかいの ことば(とめ・はね・はらい…)から付けている。 */
const BOSS_NAMES = ['とめきち', 'はねぼう', 'はらいの', 'てんてん', 'まがりん', 'かすれまる', 'にじみん', 'くろずみ'] as const
export const EXAM_BOSS_NAME = 'だいまおう すみおう'

/** ボスの通し番号(1始まり)から名前を決める。 */
export function bossName(number: number): string {
  return BOSS_NAMES[(Math.max(number, 1) - 1) % BOSS_NAMES.length]
}

export const SPOT_LABEL = { mid: 'ちゅうボス', last: 'ラスボス' } as const

/** ボス1体ぶんの きまり(エリアの 中ボス・ラスボス と、学年の そつぎょうしけん) */
export type BossDef = {
  /** エリアの ボスの id、または そつぎょうしけん の id */
  readonly id: string
  readonly kind: BossKind
  readonly title: string
  readonly name: string
  /** 見た目を決める数 */
  readonly seed: number
  /** 出題する漢字 */
  readonly kanji: readonly string[]
  readonly plan: BossPlan
  /** 1日に ちょうせん できる回数 */
  readonly triesPerDay: number
}

/** エリアの ボスの きまり(おうちの かた が変えられる) */
export type BossRules = { readonly plan: BossPlan; readonly triesPerDay: number }

export const DEFAULT_BOSS_RULES: BossRules = { plan: AREA_BOSS_PLAN, triesPerDay: BOSS_TRIES_PER_DAY.mid }

/** エリアの 中ボス・ラスボス。中ボスは そこまでに出た字、ラスボスは エリアの字ぜんぶ から出題する。 */
export function areaBoss(boss: AreaBoss, area: Area, rules: BossRules = DEFAULT_BOSS_RULES): BossDef {
  return {
    id: boss.id,
    kind: boss.spot,
    title: `${area.name}の ${SPOT_LABEL[boss.spot]}`,
    name: bossName(boss.number),
    seed: boss.number,
    kanji: boss.kanji,
    plan: rules.plan,
    triesPerDay: rules.triesPerDay,
  }
}

export function examBoss(grade: number, kanjiList: readonly Kanji[]): BossDef {
  return {
    id: examId(grade),
    kind: 'exam',
    title: `${grade}ねんせいの そつぎょうしけん`,
    name: EXAM_BOSS_NAME,
    seed: grade,
    kanji: kanjiList.filter((k) => k.grade === grade).map((k) => k.char),
    plan: EXAM_PLAN,
    triesPerDay: BOSS_TRIES_PER_DAY.exam,
  }
}

/** こうげきが当たったときに出す ことば。つづけて当てると、数が出る。 */
export function hitLabel(streak: number): string {
  return streak >= 2 ? `${streak} れんぞく ヒット！` : 'ヒット！'
}

/** たたかい の あとの、すみまるの ひとこと。まけたときは、はげまして 次に やることを 言う。 */
export function cheerLine(result: { readonly cleared: boolean; readonly won: boolean; readonly practice: boolean; readonly missed: number; readonly canRevive?: boolean }): string {
  if (result.cleared) return 'やったー！ たおしたね！ すごい！'
  if (result.canRevive) return 'おしい！ まだ おわりじゃ ないよ。れんしゅう して、ふっかつ しよう！'
  if (result.won) return 'ばっちり！ ほんばんも きっと だいじょうぶ'
  if (result.missed <= 2) return `おしい！ あと ${result.missed}{字|じ}。れんしゅう すれば たおせるよ`
  return result.practice ? 'がんばったね！ にがてを れんしゅう してみよう' : 'だいじょうぶ！ にがてを れんしゅう して、また ちょうせん しよう'
}

/** ふっかつ できるのは、まちがえた問題が この数まで のとき */
export const REVIVE_MAX_MISSES = 3

/**
 * ふっかつ(敗者復活)できるか。ほんばんで 少しだけ まちがえて にげられたとき、1回だけ。
 * まちがえた字を れんしゅう してから、まちがえた問題だけを もう一度とく。ぜんぶ できたら たおせる。
 */
export function canRevive(result: { readonly practice: boolean; readonly revived: boolean; readonly missedQuestions: number }): boolean {
  return !result.practice && !result.revived && result.missedQuestions > 0 && result.missedQuestions <= REVIVE_MAX_MISSES
}

/** ボスの画面の上に出す、問題の くぎり(えらぶ・みて かく・みないで かく) */
export function roundOf(question: BossQuestion): 'select' | 'model' | 'blind' {
  if (question.type !== 'write') return 'select'
  return question.model ? 'model' : 'blind'
}
