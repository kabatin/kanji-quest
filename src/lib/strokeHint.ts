import { LENIENT_TOLERANCE, NORMAL_TOLERANCE, type StrokeIssue, type Tolerance } from './strokeMatch'

/**
 * 書き取りの ヒントの段。
 * 0 = なし / 1 = 書きはじめの点 / 2 = 点と むきの やじるし / 3 = 1画を うごかして 見せる / 4 = うすい お手本を のこす
 * (上の段は、下の段の しるし も ぜんぶ出す)
 */
export type HintLevel = 0 | 1 | 2 | 3 | 4

/** 「おてほん」(テストでは「わからない」)を押したときに、すぐ出す段 */
export const MODEL_HINT: HintLevel = 3

/**
 * 書きおわったときに `<Kaku>` が渡す、ヒントの きろく。
 * maxHint は、まちがい や ボタンで出た いちばん上の段(見て書く で いつも出ている 書きはじめの点 は数えない)。
 */
export type WriteReport = {
  readonly maxHint: HintLevel
  /** 「おてほん」(テストでは「わからない」)を押したか */
  readonly askedModel: boolean
}

/**
 * 同じ画で まちがえた回数 → 出す段。
 * 見て書く は いつも 書きはじめの点(1段目)が出ているので、まちがえるたびに 1段ずつ上げる。
 * テスト(ボス・ふくしゅう・にがて)は 1回まちがえた時点で その問題は まちがい なので、
 * 2回目で いちばん強い ヒントにして、同じ画で 何回も つまずかないようにする。
 */
const LEARN_STEPS: readonly HintLevel[] = [0, 2, 3, 4]
const STRICT_STEPS: readonly HintLevel[] = [0, 2, 4]

export function hintForMisses(missesHere: number, strict: boolean): HintLevel {
  const steps = strict ? STRICT_STEPS : LEARN_STEPS
  return steps[Math.min(Math.max(missesHere, 0), steps.length - 1)]
}

/** 段は 上げるだけ(下げない)。 */
export function raiseHint(current: HintLevel, wanted: HintLevel): HintLevel {
  return wanted > current ? wanted : current
}

/** 同じ画で この回数 まちがえたら、その画は あまく見る */
const LENIENT_AFTER_MISSES = 2

/** 次の画を判定する はば。ヒントを見ても 合わない画は、少し あまく見る。 */
export function toleranceFor(missesHere: number): Tolerance {
  return missesHere >= LENIENT_AFTER_MISSES ? LENIENT_TOLERANCE : NORMAL_TOLERANCE
}

/** ゆらして 目を引く しるし */
export type GuideFocus = 'start' | 'arrow' | 'end'

/** 書く画の上に出す しるし */
export type GuideParts = {
  /** 書きはじめの点 */
  readonly start: boolean
  /** 点の中に 画の番号を書く(見て書く だけ) */
  readonly number: boolean
  /** 書きはじめからの むきの やじるし */
  readonly arrow: boolean
  /** 書きおわりの わっか */
  readonly end: boolean
  /** 1画を うごかして 見せる */
  readonly animate: boolean
  /** うすい お手本(なぞれる) */
  readonly trace: boolean
  readonly focus: GuideFocus | null
}

const ISSUE_FOCUS: Record<StrokeIssue, GuideFocus | null> = {
  order: 'start',
  start: 'start',
  reverse: 'arrow',
  end: 'end',
  short: 'end',
  long: 'end',
  shape: null,
}

/** ヒントの段 と、さっきの まちがいの わけ から、ばんに出す しるし を決める。 */
export function guideParts(level: HintLevel, issue: StrokeIssue | null, strict: boolean): GuideParts {
  const shown = strict ? level : Math.max(level, 1)
  const focus = issue ? ISSUE_FOCUS[issue] : null
  return {
    start: shown >= 1 || focus === 'start' || focus === 'arrow',
    number: !strict,
    arrow: shown >= 2 || focus === 'arrow',
    end: focus === 'end',
    animate: shown >= 3,
    trace: shown >= 4,
    focus,
  }
}
