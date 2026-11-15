/**
 * 書き取りの ばん で、どの 指・ペン の動きを 線に使うか を決める。
 * - 書いている とちゅうに ついた 2本目の指・手のひら は むしする(pointerId で しぼる)
 * - ペンを1回でも使ったら、そのあとの touch は むしする(手のひら を ついて書く子のため)
 * - 手のひら が先に ついていても、ペンが おりたら ペンの線に きりかえる
 */

export type GateState = {
  /** いま線を書いている 指・ペン */
  readonly active: { readonly id: number; readonly kind: string } | null
  /** この ばん で ペンが使われたか */
  readonly penSeen: boolean
}

export type GateEvent = {
  readonly phase: 'down' | 'move' | 'up' | 'cancel'
  readonly id: number
  /** PointerEvent.pointerType('mouse' / 'pen' / 'touch'。わからないときは '') */
  readonly kind: string
}

/**
 * start = 新しい線を はじめる(書きかけの線は すてる) / add = 点を たす / end = 線を書きおえた /
 * abort = 線が とちゅうで とりけされた / ignore = 何もしない
 */
export type GateDecision = 'start' | 'add' | 'end' | 'abort' | 'ignore'

export const OPEN_GATE: GateState = { active: null, penSeen: false }

function gateDown(state: GateState, event: GateEvent): { state: GateState; decision: GateDecision } {
  const isPen = event.kind === 'pen'
  if (event.kind === 'touch' && state.penSeen) return { state, decision: 'ignore' }
  const { active } = state
  const takesOver = !active || active.id === event.id || (isPen && active.kind !== 'pen')
  if (!takesOver) return { state, decision: 'ignore' }
  return { state: { active: { id: event.id, kind: event.kind }, penSeen: state.penSeen || isPen }, decision: 'start' }
}

export function gatePointer(state: GateState, event: GateEvent): { state: GateState; decision: GateDecision } {
  if (event.phase === 'down') return gateDown(state, event)
  if (!state.active || state.active.id !== event.id) return { state, decision: 'ignore' }
  if (event.phase === 'move') return { state, decision: 'add' }
  return { state: { ...state, active: null }, decision: event.phase === 'up' ? 'end' : 'abort' }
}
