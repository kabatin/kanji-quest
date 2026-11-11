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

/**
 * チャレンジの出題範囲。
 * mix = おすすめ(学んだ字と新しい字を半分ずつ) / learned = 学んだ字だけ / grade1・grade2 = その学年の字
 */
export const CHALLENGE_SCOPES = ['mix', 'learned', 'grade1', 'grade2'] as const
export type ChallengeScope = (typeof CHALLENGE_SCOPES)[number]

/** 1回のチャレンジのうち、もう学んだ漢字(ふくしゅう)にあてる割合 */
const REVIEW_RATIO = 0.5

/**
 * チャレンジに出す漢字を、多くても count 字えらぶ。
 * - おすすめ(mix): 半分は、もう学んだ漢字(ふくしゅう)。残りは、まだ学んでいない漢字。
 *   まだ学んでいない漢字は、1年生と、1字でも学んだことのある学年から出す。
 * - それ以外の範囲: その範囲の漢字だけから出す(足りなければ、ある分だけ)。
 * - 前の回に出た漢字(avoid)は、ほかに出せる字があるかぎり出さない。毎回同じ問題にならないようにする。
 */
export function pickChallengeKanji(
  allKanji: readonly Kanji[],
  learned: readonly string[],
  count: number,
  rng: Rng = Math.random,
  avoid: readonly string[] = [],
  scope: ChallengeScope = 'mix',
): Kanji[] {
  const openGrades = new Set([1, ...allKanji.filter((k) => learned.includes(k.char)).map((k) => k.grade)])
  // 前の回に出た字は、それぞれの列のいちばん後ろに回す
  const freshFirst = (list: readonly Kanji[]) => {
    const shuffled = shuffle(list, rng)
    return [...shuffled.filter((k) => !avoid.includes(k.char)), ...shuffled.filter((k) => avoid.includes(k.char))]
  }
  if (scope !== 'mix') {
    const inScope = allKanji.filter((k) => (scope === 'learned' ? learned.includes(k.char) : k.grade === (scope === 'grade1' ? 1 : 2)))
    return shuffle(freshFirst(inScope).slice(0, count), rng)
  }
  const known = freshFirst(allKanji.filter((k) => learned.includes(k.char)))
  const fresh = freshFirst(allKanji.filter((k) => !learned.includes(k.char) && openGrades.has(k.grade)))

  const reviewCount = Math.min(known.length, Math.round(count * REVIEW_RATIO))
  const picked = [...known.slice(0, reviewCount), ...fresh.slice(0, count - reviewCount)]
  // 新しい字が足りないとき(ほとんど学び終えたとき)は、学んだ字で埋める
  const filled = [...picked, ...known.slice(reviewCount)].slice(0, count)
  return shuffle(filled, rng)
}
