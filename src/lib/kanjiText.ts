/**
 * 「覚えた漢字から順に、ひらがなを漢字表示に切り替える」ための文章の書き方。
 *
 *   {人|ひと}が {木|き}に もたれて ひと{休|やす}み。
 *
 * {漢字|よみ} の漢字を全部覚えていれば「漢字」を、まだなら「よみ」を表示する。
 * 読みの置きかえを自動でやると同音異義語(はな = 花 / 鼻 など)でまちがえるので、
 * どこを漢字にしてよいかは、文章を書くときに印で決めておく。
 */

const SEGMENT = /\{([^|{}]+)\|([^|{}]+)\}/g
const KANJI_CHAR = /[㐀-鿿]/

export type TextPiece = {
  readonly text: string
  /** 漢字に切り替わった部分か(見た目を少し変えるのに使う) */
  readonly isKanji: boolean
}

/** 漢字に切り替わった部分は、タップで読みを見せるために、もとの よみも持つ。 */
export type ReadablePiece = TextPiece & {
  /** 漢字に切り替わっているときの、ひらがなの よみ */
  readonly reading?: string
}

/** 印つきの文章を、いま覚えている漢字に合わせて、読みつきの部品に分ける。 */
export function resolveReadablePieces(markup: string, learned: ReadonlySet<string>): ReadablePiece[] {
  const pieces: ReadablePiece[] = []
  let last = 0
  for (const match of markup.matchAll(SEGMENT)) {
    const [whole, written, reading] = match
    const start = match.index ?? 0
    if (start > last) pieces.push({ text: markup.slice(last, start), isKanji: false })
    const kanji = [...written].filter((char) => KANJI_CHAR.test(char))
    const known = kanji.length > 0 && kanji.every((char) => learned.has(char))
    pieces.push(known ? { text: written, isKanji: true, reading } : { text: reading, isKanji: false })
    last = start + whole.length
  }
  if (last < markup.length) pieces.push({ text: markup.slice(last), isKanji: false })
  return pieces
}

/** 印つきの文章を、いま覚えている漢字に合わせて表示用の部品に分ける。 */
export function resolvePieces(markup: string, learned: ReadonlySet<string>): TextPiece[] {
  return resolveReadablePieces(markup, learned).map(({ text, isKanji }) => ({ text, isKanji }))
}

/** 印つきの文章を、いま覚えている漢字に合わせた1本の文字列にする。 */
export function resolveText(markup: string, learned: ReadonlySet<string>): string {
  return resolvePieces(markup, learned)
    .map((piece) => piece.text)
    .join('')
}

/** 印を全部はずして、ひらがなだけの文に戻す。 */
export function plainText(markup: string): string {
  return markup.replace(SEGMENT, '$2')
}
