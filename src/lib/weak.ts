import type { Kanji } from '../data/schema'
import { buildWrite, type BossQuestion, type Misses } from './boss'

/** 1回の れんしゅう で出す字の数 */
export const WEAK_SIZE = 5

/**
 * 苦手な字。もう学んだ字のうち、まちがえた回数が のこっているものを、回数の多い順に。
 * (回数が同じなら、learned の順 = 先に覚えた字から)
 */
export function weakChars(misses: Misses, learned: readonly string[]): string[] {
  return learned
    .filter((char) => (misses[char] ?? 0) > 0)
    .map((char, order) => ({ char, count: misses[char] ?? 0, order }))
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .map((entry) => entry.char)
}

/**
 * にがて れんしゅう の問題。まず ぜんぶの字を 見本を見て書き、そのあと 見本なしで もう一度書く
 * (見て書いた すぐあと ではなく、ほかの字を はさんでから 思い出す)。
 */
export function buildWeakQuestions(kanji: readonly Kanji[]): BossQuestion[] {
  return [...kanji.map((k) => buildWrite(k, 'whole', true)), ...kanji.map((k) => buildWrite(k, 'whole', false))]
}

/** 問題ごとの結果(まちがえた回数)から、字ごとに「2回とも まちがえずに書けたか」を まとめる。 */
export function weakOutcome(questions: readonly BossQuestion[], mistakes: readonly number[]): { right: string[]; wrong: string[] } {
  const chars = [...new Set(questions.map((q) => q.kanji.char))]
  const missed = new Set(questions.filter((_, i) => (mistakes[i] ?? 0) > 0).map((q) => q.kanji.char))
  return { right: chars.filter((char) => !missed.has(char)), wrong: chars.filter((char) => missed.has(char)) }
}
