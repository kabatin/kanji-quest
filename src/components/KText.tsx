import { resolveReadablePieces } from '../lib/kanjiText'
import { useLearnedSet } from '../lib/useKanjiText'
import { KanjiReading } from './KanjiReading'

type Props = { readonly text: string }

/**
 * 印つきの文章 {漢字|よみ} を表示する。覚えた漢字は漢字で、まだの漢字は ひらがなで出る。
 * 漢字に変わった所は「おぼえた字だ」と気づけるよう、色を少し変える。
 * 漢字に変わった語を おすと、よみが 上に出る(ボタンの中では 反応しない)。
 */
export function KText({ text }: Props) {
  const learned = useLearnedSet()
  return (
    <>
      {resolveReadablePieces(text, learned).map((piece, i) =>
        piece.isKanji && piece.reading ? <KanjiReading key={i} text={piece.text} reading={piece.reading} /> : piece.text,
      )}
    </>
  )
}
