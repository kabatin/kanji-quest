import { hintForMisses, MODEL_HINT, raiseHint, type HintLevel, type WriteReport } from './strokeHint'
import type { Point, StrokeIssue, StrokeResult } from './strokeMatch'

/** 線になっていない(点をさわっただけ)とみなす点の数 */
export const MIN_POINTS = 3

/** 点をさわっただけ(線になっていない)か。まちがいに数えない。 */
export const isTap = (points: readonly Point[]): boolean => points.length < MIN_POINTS

/** くらべる ときに 見せる、1画ぶんの 自分の線 */
export type StrokeTrace = {
  readonly points: readonly Point[]
  /** この画で まちがえたか(まちがえた画は、さいしょに まちがえた線を のこす) */
  readonly missed: boolean
}

/** 1字を書く あいだの すすみぐあい */
export type WriteState = {
  readonly strict: boolean
  /** 書けた画の数 */
  readonly done: number
  readonly misses: number
  /** いま書いている画で まちがえた回数 */
  readonly missesHere: number
  /** いま書いている画の ヒントの段 */
  readonly hint: HintLevel
  readonly maxHint: HintLevel
  readonly askedModel: boolean
  /** さっきの まちがいの わけ */
  readonly issue: StrokeIssue | null
  /** さっき まちがえた線(うすく見せる) */
  readonly missLine: readonly Point[] | null
  /** 書く画の順の、自分の線 */
  readonly traces: readonly (StrokeTrace | undefined)[]
}

export type WriteAction =
  | { readonly type: 'stroke'; readonly result: StrokeResult; readonly points: readonly Point[] }
  /** 「おてほん」(見て書く) */
  | { readonly type: 'model' }
  /** 「わからない」(テスト) */
  | { readonly type: 'giveUp' }
  /** 「はじめから」 */
  | { readonly type: 'restart' }

export function initWrite(strict: boolean): WriteState {
  return { strict, done: 0, misses: 0, missesHere: 0, hint: 0, maxHint: 0, askedModel: false, issue: null, missLine: null, traces: [] }
}

/** 配列の index の所だけを かえた、新しい配列 */
function withAt<T>(list: readonly (T | undefined)[], index: number, value: T): (T | undefined)[] {
  return Array.from({ length: Math.max(list.length, index + 1) }, (_, i) => (i === index ? value : list[i]))
}

function passStroke(state: WriteState, points: readonly Point[]): WriteState {
  const before = state.traces[state.done]
  const trace = before && before.points.length > 0 ? before : { points, missed: state.missesHere > 0 }
  return { ...state, done: state.done + 1, missesHere: 0, hint: 0, issue: null, missLine: null, traces: withAt(state.traces, state.done, trace) }
}

function missStroke(state: WriteState, issue: StrokeIssue, points: readonly Point[]): WriteState {
  if (isTap(points)) return state
  const missesHere = state.missesHere + 1
  const hint = raiseHint(state.hint, hintForMisses(missesHere, state.strict))
  const before = state.traces[state.done]
  const traces = before && before.points.length > 0 ? state.traces : withAt(state.traces, state.done, { points, missed: true })
  return { ...state, misses: state.misses + 1, missesHere, hint, maxHint: raiseHint(state.maxHint, hint), issue, missLine: points, traces }
}

function giveUp(state: WriteState): WriteState {
  if (state.hint >= MODEL_HINT) return state
  // 同じ画で もう まちがえていたら、もう一度は 数えない
  const counted = state.missesHere === 0 ? 1 : 0
  const hint = raiseHint(state.hint, MODEL_HINT)
  return {
    ...state,
    misses: state.misses + counted,
    missesHere: state.missesHere + counted,
    hint,
    maxHint: raiseHint(state.maxHint, hint),
    askedModel: true,
    issue: null,
    missLine: null,
  }
}

export function writeReducer(state: WriteState, action: WriteAction): WriteState {
  switch (action.type) {
    case 'stroke':
      return action.result === 'ok' ? passStroke(state, action.points) : missStroke(state, action.result, action.points)
    case 'model': {
      const hint = raiseHint(state.hint, MODEL_HINT)
      return { ...state, hint, maxHint: raiseHint(state.maxHint, hint), askedModel: true }
    }
    case 'giveUp':
      return giveUp(state)
    case 'restart':
      return { ...state, done: 0, missesHere: 0, hint: 0, issue: null, missLine: null, traces: [] }
  }
}

/** 書きおわったときに 呼び出し側へ渡す、ヒントの きろく */
export function writeReport(state: WriteState): WriteReport {
  return { maxHint: state.maxHint, askedModel: state.askedModel }
}
