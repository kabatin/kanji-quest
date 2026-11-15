import type { AnswerInput } from './answerLog'
import { roundOf, type BossQuestion } from './boss'
import type { WriteReport } from './strokeHint'

/**
 * 画面で といた1問を、きろく用の答えに する。
 * 「正解」は 1回で できたか(まちがい 0)。ヒントの段は 書く問題の `<Kaku>` が 返した maxHint。
 */
export function answerOf(question: BossQuestion, mistakes: number, report?: WriteReport): AnswerInput {
  const hint = question.type === 'write' ? report?.maxHint : undefined
  return { char: question.kanji.char, kind: roundOf(question), ok: mistakes === 0, ...(hint === undefined ? {} : { hint }) }
}
