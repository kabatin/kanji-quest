import { z } from 'zod'
import raw from './generated/kanji.json'
import { kanjiSchema, type Grade, type Kanji } from './schema'

// 中身は scripts/build-data.mjs が scripts/kanji-source.mjs から作る
export const KANJI: readonly Kanji[] = z.array(kanjiSchema).parse(raw)

export const GRADES: readonly Grade[] = [1, 2]

const KANJI_BY_CHAR = new Map(KANJI.map((k) => [k.char, k]))

export function getKanji(char: string): Kanji {
  const kanji = KANJI_BY_CHAR.get(char)
  if (!kanji) throw new Error(`漢字が見つかりません: ${char}`)
  return kanji
}

export function kanjiOfGrade(grade: Grade): readonly Kanji[] {
  return KANJI.filter((k) => k.grade === grade)
}
