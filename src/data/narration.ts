import { z } from 'zod'
import raw from './narration.json'

const narrationSchema = z.object({
  /** 漢字の読み */
  word: z.string().min(1),
  /** くみあわせの段階ごとの「〜を つくろう」 */
  goals: z.array(z.string().min(1)),
  /** 成り立ちの説明(音声にする文。読みまちがいを防ぐため漢字まじり) */
  speech: z.string().min(1),
  /** 成り立ちの説明(画面に出す ひらがなの文) */
  caption: z.string().min(1),
})

export type Narration = z.infer<typeof narrationSchema>

const NARRATION = z.record(z.string(), narrationSchema).parse(raw)

export function getNarration(char: string): Narration {
  const narration = NARRATION[char]
  if (!narration) throw new Error(`説明が見つかりません: ${char}`)
  return narration
}
