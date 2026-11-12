import type { GlyphRef, Kanji } from '../data/schema'
import { fullGlyph } from '../data/strokes'
import { BOSS_TRIES_PER_DAY, type BossKind } from './rewards'
import { examId, type Stage } from './stages'
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

/** ステージの ボス: 5字それぞれを、えらぶ・見て書く・見ないで書く */
export const STAGE_BOSS_PLAN: BossPlan = { select: 5, model: 5, blind: 5 }
/** そつぎょうしけん: 学年の漢字から ぬきだして出す */
export const EXAM_PLAN: BossPlan = { select: 10, model: 5, blind: 5 }

/** kanji の中から count 字えらぶ。足りないときは、もう一度まぜて くり返す。 */
function take(kanji: readonly Kanji[], count: number, rng: Rng): Kanji[] {
  const rounds = Math.ceil(count / Math.max(kanji.length, 1))
  return Array.from({ length: rounds }, () => shuffle(kanji, rng))
    .flat()
    .slice(0, count)
}

/**
 * ボスの問題を作る。えらぶ問題 → 見本を見て書く → 見本なしで書く の順に出す。
 * えらぶ問題は、4つの種類(つくり・ぜんぶの部位・なりたち・絵)が まんべんなく出るように回す。
 */
export function buildBoss(kanji: readonly Kanji[], all: readonly Kanji[], plan: BossPlan, rng: Rng = Math.random): BossQuestion[] {
  if (kanji.length === 0) return []
  const types = shuffle(SELECT_TYPES, rng)
  const select = take(kanji, plan.select, rng).map((k, i) => buildSelect(k, types[i % types.length], all, rng))
  // 見て書く問題は、つくり だけ と 字ぜんたい を かわりばんこに
  const model = take(kanji, plan.model, rng).map((k, i) => buildWrite(k, i % 2 === 0 ? 'part' : 'whole', true))
  const blind = take(kanji, plan.blind, rng).map((k) => buildWrite(k, 'whole', false))
  return [...select, ...model, ...blind]
}

/** ボスの名前。筆づかいの ことば(とめ・はね・はらい…)から付けている。 */
const BOSS_NAMES = ['とめきち', 'はねぼう', 'はらいの', 'てんてん', 'まがりん', 'かすれまる', 'にじみん', 'くろずみ'] as const
export const EXAM_BOSS_NAME = 'だいまおう すみおう'

export function bossName(stageNumber: number): string {
  return BOSS_NAMES[(Math.max(stageNumber, 1) - 1) % BOSS_NAMES.length]
}

/** ボス1体ぶんの きまり(ステージの ボス と、学年の そつぎょうしけん) */
export type BossDef = {
  /** ステージの id、または そつぎょうしけん の id */
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

/** ステージの ボスの きまり(おうちの かた が変えられる) */
export type BossRules = { readonly plan: BossPlan; readonly triesPerDay: number }

export const DEFAULT_STAGE_RULES: BossRules = { plan: STAGE_BOSS_PLAN, triesPerDay: BOSS_TRIES_PER_DAY.stage }

export function stageBoss(stage: Stage, rules: BossRules = DEFAULT_STAGE_RULES): BossDef {
  return {
    id: stage.id,
    kind: 'stage',
    title: `ステージ ${stage.number} の ボス`,
    name: bossName(stage.number),
    seed: stage.number,
    kanji: stage.kanji,
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

/** ボスの画面の上に出す、問題の くぎり(えらぶ・みて かく・みないで かく) */
export function roundOf(question: BossQuestion): 'select' | 'model' | 'blind' {
  if (question.type !== 'write') return 'select'
  return question.model ? 'model' : 'blind'
}
