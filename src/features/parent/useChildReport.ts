import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { readReportInput, type ReportInput } from '../../lib/reportInput'
import { useProfiles } from '../../store/profiles'
import { useProgress } from '../../store/progress'

const pickReport = (s: ReportInput): ReportInput => ({
  learned: s.learned,
  stamps: s.stamps,
  reviews: s.reviews,
  answerLog: s.answerLog,
  learnedOn: s.learnedOn,
  misses: s.misses,
  playMinutes: s.playMinutes,
  answerDays: s.answerDays,
})

/**
 * その子の記録。いま あそんでいる子は ストアから(1分ごとの 遊んだ時間 なども すぐ出る)、
 * ほかの子は 端末から直接読む(あそぶ人を 切りかえずに見られるように)。
 */
export function useChildReport(childId: string): ReportInput {
  const activeId = useProfiles((s) => s.activeId)
  const live = useProgress(useShallow(pickReport))
  return useMemo(() => (childId === activeId ? live : readReportInput(childId)), [childId, activeId, live])
}
