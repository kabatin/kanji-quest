import { useMemo } from 'react'
import { useParent } from '../store/parent'
import { useProfiles } from '../store/profiles'
import { useProgress } from '../store/progress'
import { dayKey } from './date'
import { homeworkChars, reviewQueue } from './homework'

/** きょうの ふくしゅう の字の順(いま あそんでいる子の、保護者が えらんだ字を 先に)。stores の今の値から。 */
export function currentReviewQueue(today: string = dayKey()): string[] {
  const { reviews, misses, answerLog } = useProgress.getState()
  const homework = homeworkChars(useParent.getState().homework[useProfiles.getState().activeId])
  return reviewQueue({ reviews, misses, answerLog, homework, today })
}

/** 画面で使う版。ふくしゅう・にがて・しゅくだい の字が かわると 作りなおす */
export function useReviewQueue(): string[] {
  const reviews = useProgress((s) => s.reviews)
  const misses = useProgress((s) => s.misses)
  const answerLog = useProgress((s) => s.answerLog)
  const activeId = useProfiles((s) => s.activeId)
  const picked = useParent((s) => s.homework[activeId])
  const today = dayKey()
  return useMemo(() => reviewQueue({ reviews, misses, answerLog, homework: homeworkChars(picked), today }), [reviews, misses, answerLog, picked, today])
}
