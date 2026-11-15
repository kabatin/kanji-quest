import { playStatus, type PlayStatus } from './playLimit'
import { TALLY, type AnswerDays } from './answerLog'
import type { ParentSettings } from '../store/parent'
import { playRuleOf } from '../store/parent'

/**
 * 1日の時間の上限に来たときの、子ども側の動きの判定(純粋関数)。
 * 「いつ 画面を出すか」だけを決める。とちゅうで切らないので、画面を うつったときに 呼ぶ。
 */

/** 残りが これだけに なったら、ホームに もどった時に 1回 しらせる(分) */
export const WARN_LEFT = 5

/** あそんだ時間に 数えない画面(おうちの かた・せってい・だれが あそぶ・上限の画面) */
const NOT_COUNTED: ReadonlySet<string> = new Set(['parent-gate', 'parent', 'settings', 'profiles', 'limit', 'extend'])

/** 上限に来ていても 入れる画面(おうちの かたの入り口・あそぶ人の切りかえ・上限の画面) */
const EXEMPT: ReadonlySet<string> = new Set(['parent-gate', 'parent', 'profiles', 'limit', 'extend'])

export const countsAsPlay = (screen: string): boolean => !NOT_COUNTED.has(screen)
export const isLimitExempt = (screen: string): boolean => EXEMPT.has(screen)

/** その子の、きょうの 時間の ようす */
export function statusOf(settings: Pick<ParentSettings, 'playLimits' | 'playExtra'>, profileId: string, playMinutes: Readonly<Record<string, number>>, today: string): PlayStatus {
  return playStatus({ ...playRuleOf(settings, profileId, today), playMinutes, today })
}

/**
 * none = そのまま / end = 「きょうは ここまで」を出す / warn = 「あと 5ふん」を出す /
 * free = 上限の画面を出していたが、もう あそべる(日がかわった・延長した)
 */
export type GateAction = 'none' | 'end' | 'warn' | 'free'

export function gateAction(input: { readonly status: PlayStatus; readonly screen: string; readonly warned: boolean }): GateAction {
  const { status, screen, warned } = input
  if (!status.limited) return screen === 'limit' ? 'free' : 'none'
  if (status.reached) return isLimitExempt(screen) ? 'none' : 'end'
  if (screen === 'limit') return 'free'
  const near = status.left !== null && status.left <= WARN_LEFT
  return screen === 'home' && near && !warned ? 'warn' : 'none'
}

/** きょう やったこと(「きょうは ここまで」の画面で ねぎらうため) */
export type TodayDone = { readonly newKanji: number; readonly answers: number }

export function todayDone(learnedOn: Readonly<Record<string, string>>, answerDays: AnswerDays, today: string): TodayDone {
  return {
    newKanji: Object.values(learnedOn).filter((day) => day === today).length,
    answers: answerDays[today]?.[TALLY.answers] ?? 0,
  }
}

/** ねぎらいの文({漢字|よみ} 印つき)。やったことが 何もなくても やさしく */
export function restLine({ newKanji, answers }: TodayDone): string {
  if (newKanji > 0) return `きょうは {漢字|かんじ}を ${newKanji}{字|じ} おぼえたね。たくさん がんばったよ！`
  if (answers > 0) return `きょうは ${answers}もん ときました。よく がんばったね！`
  return 'きょうは たくさん あそんだね。おつかれさま！'
}
