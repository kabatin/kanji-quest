import { resolvePieces } from '../lib/kanjiText'
import { useLearnedSet } from '../lib/useKanjiText'

type Props = { readonly text: string }

/**
 * 印つきの文章 {漢字|よみ} を表示する。覚えた漢字は漢字で、まだの漢字は ひらがなで出る。
 * 漢字に変わった所は「おぼえた字だ」と気づけるよう、色を少し変える。
 */
export function KText({ text }: Props) {
  const learned = useLearnedSet()
  return (
    <>
      {resolvePieces(text, learned).map((piece, i) =>
        piece.isKanji ? (
          <span key={i} className="ktext__kanji">
            {piece.text}
          </span>
        ) : (
          piece.text
        ),
      )}
    </>
  )
}
