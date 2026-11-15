import { useMemo } from 'react'
import { readHands, type Hands } from '../../lib/handwriting'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'

/** その子の 書いた字。いま あそんでいる子は ストアから、ほかの子は 端末から直接読む */
export function useChildHands(childId: string): Hands {
  const activeId = useProfiles((s) => s.activeId)
  const live = useProgress((s) => s.hands)
  return useMemo(() => (childId === activeId ? live : readHands(childId)), [childId, activeId, live])
}
