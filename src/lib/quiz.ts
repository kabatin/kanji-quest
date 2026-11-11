import type { Kanji, Step } from '../data/schema'

export type Rng = () => number

export type Question = {
  readonly kanji: Kanji
  readonly stepIndex: number
  readonly step: Step
  /** 選択肢の部位 id(正解を1つ含む) */
  readonly choices: readonly string[]
}

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

export function buildQuestion(kanji: Kanji, stepIndex: number, kanjiList: readonly Kanji[], rng: Rng = Math.random): Question {
  const step = kanji.steps[stepIndex]
  if (!step) throw new Error(`段階がありません: ${kanji.char} ${stepIndex}`)
  return { kanji, stepIndex, step, choices: buildChoices(step, kanjiList, rng) }
}

/**
 * チャレンジ用に、組み合わせ問題をランダムに count 問えらぶ。
 * 出題は pool から、はずれの選択肢は allKanji 全体から作る。
 */
export function buildQuiz(
  pool: readonly Kanji[],
  count: number,
  rng: Rng = Math.random,
  allKanji: readonly Kanji[] = pool,
): Question[] {
  const all = pool.flatMap((kanji) => kanji.steps.map((_, stepIndex) => ({ kanji, stepIndex })))
  return shuffle(all, rng)
    .slice(0, count)
    .map(({ kanji, stepIndex }) => buildQuestion(kanji, stepIndex, allKanji, rng))
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
 * - おすすめ(mix): 半分は、もう学んだ「くみあわせ」の漢字(ふくしゅう)。残りは、まだ学んでいない漢字。
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
  const compounds = allKanji.filter((k) => k.steps.length > 0)
  const openGrades = new Set([1, ...allKanji.filter((k) => learned.includes(k.char)).map((k) => k.grade)])
  // 前の回に出た字は、それぞれの列のいちばん後ろに回す
  const freshFirst = (list: readonly Kanji[]) => {
    const shuffled = shuffle(list, rng)
    return [...shuffled.filter((k) => !avoid.includes(k.char)), ...shuffled.filter((k) => avoid.includes(k.char))]
  }
  if (scope !== 'mix') {
    const inScope = compounds.filter((k) => (scope === 'learned' ? learned.includes(k.char) : k.grade === (scope === 'grade1' ? 1 : 2)))
    return shuffle(freshFirst(inScope).slice(0, count), rng)
  }
  const known = freshFirst(compounds.filter((k) => learned.includes(k.char)))
  const fresh = freshFirst(compounds.filter((k) => !learned.includes(k.char) && openGrades.has(k.grade)))

  const reviewCount = Math.min(known.length, Math.round(count * REVIEW_RATIO))
  const picked = [...known.slice(0, reviewCount), ...fresh.slice(0, count - reviewCount)]
  // 新しい字が足りないとき(ほとんど学び終えたとき)は、学んだ字で埋める
  const filled = [...picked, ...known.slice(reviewCount)].slice(0, count)
  return shuffle(filled, rng)
}
