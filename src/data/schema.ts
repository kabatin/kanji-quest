import { z } from 'zod'

/** ある漢字の「何画目と何画目」を指す(画番号は1始まり)。 */
export const glyphRefSchema = z.object({
  source: z.string().min(1),
  strokes: z.array(z.number().int().min(1)).min(1),
})

export const partSchema = z.object({
  /** 部位そのものの文字(氵、木 など) */
  id: z.string().min(1),
  /** カードに出す ひらがなの名前。おとパーツは「その部位がくれる読み」。 */
  label: z.string().min(1),
  /** imi = いみパーツ(絵がある) / oto = おとパーツ(読み方のヒント) */
  kind: z.enum(['imi', 'oto']),
  /** 手描きアイコンの名前、または絵文字 */
  icon: z.string().min(1).optional(),
  glyph: glyphRefSchema,
})

export const layoutSchema = z.enum(['yoko', 'tate', 'kakomu'])

export const stepSchema = z.object({
  fixed: z.string().min(1),
  answer: z.string().min(1),
  layout: layoutSchema,
  fixedGlyph: glyphRefSchema,
  answerGlyph: glyphRefSchema,
  /** 途中の段階でできあがる部位(最後の段階では省略し、漢字そのものになる) */
  makes: z.string().min(1).optional(),
})

export const patternSchema = z.enum(['tantai', 'kurikaeshi', 'sayuu', 'jouge', 'kakomu', 'fukusuu'])

export const kanjiSchema = z.object({
  char: z.string().min(1),
  /** 習う学年 */
  grade: z.union([z.literal(1), z.literal(2)]),
  yomi: z.string().min(1),
  /** 手描きアイコンの名前、または絵文字 */
  icon: z.string().min(1),
  pattern: patternSchema,
  /** この漢字が持っている(またはこの漢字そのものである)部位 */
  parts: z.array(z.string().min(1)),
  steps: z.array(stepSchema),
})

export type GlyphRef = z.infer<typeof glyphRefSchema>
export type Part = z.infer<typeof partSchema>
export type Layout = z.infer<typeof layoutSchema>
export type Step = z.infer<typeof stepSchema>
export type Pattern = z.infer<typeof patternSchema>
export type Kanji = z.infer<typeof kanjiSchema>
export type Grade = Kanji['grade']
