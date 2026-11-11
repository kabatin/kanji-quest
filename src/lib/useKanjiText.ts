import { useMemo } from 'react'
import { useProgress } from '../store/progress'
import { resolveText } from './kanjiText'

/** いま覚えている漢字の集まり。 */
export function useLearnedSet(): ReadonlySet<string> {
  const learned = useProgress((s) => s.learned)
  return useMemo(() => new Set(learned), [learned])
}

/** 印つきの文章を、覚えた漢字に合わせた文字列にする関数を返す(aria-label など文字列が必要な所で使う)。 */
export function useKanjiText(): (markup: string) => string {
  const learned = useLearnedSet()
  return useMemo(() => (markup: string) => resolveText(markup, learned), [learned])
}
