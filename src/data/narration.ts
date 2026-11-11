import { z } from 'zod'
import raw from './narration.json'

export const MOTIONS = ['still', 'lean-left', 'lean-right', 'drop', 'rise', 'enter', 'shine', 'sway', 'walk', 'grow', 'shake'] as const
export type Motion = (typeof MOTIONS)[number]

const actorSchema = z.object({
  /** 部位の文字。分けない漢字では 'whole'(字ぜんたい) */
  part: z.string().min(1),
  /** 物語の中でその部位が表すものの絵(手描きアイコンの名前、または絵文字) */
  picture: z.string().min(1),
  motion: z.enum(MOTIONS),
})

const narrationSchema = z.object({
  /** 漢字の読み */
  word: z.string().min(1),
  /** くみあわせの段階ごとの「〜を つくろう」 */
  goals: z.array(z.string().min(1)),
  /** 成り立ちの物語(音声にする文) */
  speech: z.string().min(1),
  /** 成り立ちの物語(画面に出す文)。{漢字|よみ} の印つきで、覚えた漢字は漢字で表示される */
  caption: z.string().min(1),
  /** naritachi = 字のなりたちにもとづく話 / oboekata = 形からの おぼえかた */
  kind: z.enum(['naritachi', 'oboekata']),
  /** 物語のアニメーションに出てくる絵 */
  actors: z.array(actorSchema).min(1),
})

export type Actor = z.infer<typeof actorSchema>
export type Narration = z.infer<typeof narrationSchema>

const NARRATION = z.record(z.string(), narrationSchema).parse(raw)

export function getNarration(char: string): Narration {
  const narration = NARRATION[char]
  if (!narration) throw new Error(`説明が見つかりません: ${char}`)
  return narration
}
