import { describe, expect, it } from 'vitest'
import { gatePointer, OPEN_GATE, type GateEvent, type GateState } from './pointerGate'

/** 出来事を順に通して、それぞれの きめ を返す。 */
function run(events: readonly GateEvent[], from: GateState = OPEN_GATE) {
  return events.reduce<{ state: GateState; decisions: string[] }>(
    (acc, event) => {
      const { state, decision } = gatePointer(acc.state, event)
      return { state, decisions: [...acc.decisions, decision] }
    },
    { state: from, decisions: [] },
  )
}

const ev = (phase: GateEvent['phase'], id: number, kind = 'touch'): GateEvent => ({ phase, id, kind })

describe('pointerGate: 書く線に使う 指・ペン を えらぶ', () => {
  it('1本の指で書くと、はじめ → たす → おわり', () => {
    expect(run([ev('down', 1), ev('move', 1), ev('up', 1)]).decisions).toEqual(['start', 'add', 'end'])
  })

  it('書いている とちゅうの 2本目の指・手のひら は むしする', () => {
    const { decisions } = run([ev('down', 1), ev('down', 2), ev('move', 2), ev('move', 1), ev('up', 2), ev('up', 1), ev('move', 1)])
    expect(decisions).toEqual(['start', 'ignore', 'ignore', 'add', 'ignore', 'end', 'ignore'])
  })

  it('ペンを1回でも使ったら、そのあとの 指(手のひら)は むしする。マウスは そのまま', () => {
    const { decisions, state } = run([ev('down', 5, 'pen'), ev('up', 5, 'pen'), ev('down', 1), ev('move', 1), ev('up', 1), ev('down', 9, 'mouse')])
    expect(decisions).toEqual(['start', 'end', 'ignore', 'ignore', 'ignore', 'start'])
    expect(state.penSeen).toBe(true)
  })

  it('手のひら が先に ついていても、ペンが おりたら ペンの線に きりかえる', () => {
    const { decisions } = run([ev('down', 1), ev('move', 1), ev('down', 5, 'pen'), ev('move', 1), ev('move', 5, 'pen'), ev('up', 5, 'pen')])
    expect(decisions).toEqual(['start', 'add', 'start', 'ignore', 'add', 'end'])
  })

  it('指だけの子は、何回でも 指で書ける', () => {
    const { decisions } = run([ev('down', 1), ev('up', 1), ev('down', 2), ev('up', 2)])
    expect(decisions).toEqual(['start', 'end', 'start', 'end'])
  })

  it('とちゅうで とりけされた(pointercancel)線は abort。ほかの指の とりけし は むしする', () => {
    expect(run([ev('down', 1), ev('cancel', 2), ev('move', 1), ev('cancel', 1), ev('move', 1)]).decisions).toEqual(['start', 'ignore', 'add', 'abort', 'ignore'])
  })

  it('同じ指の down が もう一度来たら(up が とどかなかった)、新しい線として はじめる', () => {
    expect(run([ev('down', 1), ev('down', 1), ev('up', 1)]).decisions).toEqual(['start', 'start', 'end'])
  })
})
