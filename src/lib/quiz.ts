import type { Kanji, Step } from '../data/schema'
import { strokeCount } from '../data/strokes'

export type Rng = () => number

/** くみあわせ: 固定の部位に合う部位を4枚からえらぶ */
export type KumiQuestion = {
  readonly type: 'kumi'
  readonly kanji: Kanji
  readonly stepIndex: number
  readonly step: Step
  /** 選択肢の部位 id(正解を1つ含む) */
  readonly choices: readonly string[]
}

/** picture = 絵と読みから / story = なりたちの おはなし から */
export type ErabiClue = 'picture' | 'story'

/** えらび: 絵と読み(または なりたちの話)に合う漢字を4字からえらぶ */
export type ErabiQuestion = {
  readonly type: 'erabi'
  readonly kanji: Kanji
  readonly clue: ErabiClue
  /** 選択肢の漢字(正解を1つ含む) */
  readonly choices: readonly string[]
}

export type Question = KumiQuestion | ErabiQuestion

export const CHOICE_COUNT = 4

/** 元の配列を変えずに、並べ替えた新しい配列を返す。 */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  return items
    .map((item) => ({ item, key: rng() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item)
}

/**
 * 正解 + はずれ3つを作る。はずれは「同じ配置(左右・上下など)の答えになる部位」を優先し、
 * 形の置き場所だけで正解がばれないようにする。
 */
export function buildChoices(step: Step, kanjiList: readonly Kanji[], rng: Rng = Math.random): string[] {
  const allSteps = kanjiList.flatMap((k) => k.steps)
  const isCandidate = (id: string) => id !== step.answer
  const unique = (ids: string[]) => [...new Set(ids)].filter(isCandidate)

  const sameLayout = unique(allSteps.filter((s) => s.layout === step.layout).map((s) => s.answer))
  const otherAnswers = unique(allSteps.map((s) => s.answer)).filter((id) => !sameLayout.includes(id))
  const rest = unique(kanjiList.flatMap((k) => k.parts)).filter(
    (id) => !sameLayout.includes(id) && !otherAnswers.includes(id),
  )

  const distractors = [...shuffle(sameLayout, rng), ...shuffle(otherAnswers, rng), ...shuffle(rest, rng)].slice(
    0,
    CHOICE_COUNT - 1,
  )
  return shuffle([step.answer, ...distractors], rng)
}

export function buildQuestion(kanji: Kanji, stepIndex: number, kanjiList: readonly Kanji[], rng: Rng = Math.random): KumiQuestion {
  const step = kanji.steps[stepIndex]
  if (!step) throw new Error(`段階がありません: ${kanji.char} ${stepIndex}`)
  return { type: 'kumi', kanji, stepIndex, step, choices: buildChoices(step, kanjiList, rng) }
}

/** はずれの候補にする、画数の近い漢字の数 */
const ERABI_NEIGHBORS = 9

/** 絵と読みから漢字をえらぶ問題。はずれは画数の近い漢字にして、見た目で すぐ分からないようにする。 */
export function buildErabi(kanji: Kanji, kanjiList: readonly Kanji[], rng: Rng = Math.random, clue: ErabiClue = 'picture'): ErabiQuestion {
  const strokes = strokeCount(kanji.char)
  const neighbors = kanjiList
    .filter((k) => k.char !== kanji.char)
    .map((k) => ({ char: k.char, gap: Math.abs(strokeCount(k.char) - strokes) }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, ERABI_NEIGHBORS)
    .map((k) => k.char)
  return { type: 'erabi', kanji, clue, choices: shuffle([kanji.char, ...shuffle(neighbors, rng).slice(0, CHOICE_COUNT - 1)], rng) }
}

/** くみあわせの漢字でも、ときどき「えらび」で出す割合 */
const ERABI_RATIO = 0.25

/** 漢字1字ぶんの問題を作る。分けられない字は「えらび」、分けられる字は主に「くみあわせ」。 */
export function questionFor(kanji: Kanji, kanjiList: readonly Kanji[], rng: Rng = Math.random): Question {
  if (kanji.steps.length === 0 || rng() < ERABI_RATIO) return buildErabi(kanji, kanjiList, rng)
  return buildQuestion(kanji, Math.floor(rng() * kanji.steps.length), kanjiList, rng)
}

/** えらんだ漢字から、1字1問のクイズを作る。はずれの選択肢は allKanji 全体から作る。 */
export function buildQuiz(picked: readonly Kanji[], rng: Rng = Math.random, allKanji: readonly Kanji[] = picked): Question[] {
  return picked.map((kanji) => questionFor(kanji, allKanji, rng))
}
