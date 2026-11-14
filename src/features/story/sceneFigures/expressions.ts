/** あとから 足した 顔 の 名前(絵 は faces.tsx) */
export type MoreExpression = 'worried' | 'angry' | 'cry' | 'sleepy' | 'strain'

const MORE: readonly string[] = ['worried', 'angry', 'cry', 'sleepy', 'strain'] satisfies readonly MoreExpression[]

/** faces.tsx で 描く 顔 か(もとの 6つ は head.tsx) */
export const isMoreExpression = (face: string): face is MoreExpression => MORE.includes(face)
