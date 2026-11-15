import { describe, expect, it } from 'vitest'
import { initWrite, isTap, writeReducer, writeReport, type WriteAction, type WriteState } from './kakuSession'
import type { Point, StrokeIssue } from './strokeMatch'

const line = (y: number): Point[] => [[10, y], [20, y], [30, y], [40, y]]
const play = (actions: readonly WriteAction[], strict = false): WriteState => actions.reduce(writeReducer, initWrite(strict))
const ok = (points: Point[] = line(10)): WriteAction => ({ type: 'stroke', result: 'ok', points })
const miss = (points: Point[] = line(60), result: StrokeIssue = 'start'): WriteAction => ({ type: 'stroke', result, points })

describe('kakuSession: 書き取りの すすみぐあい', () => {
  it('はじめは 何もない', () => {
    expect(initWrite(false)).toMatchObject({ done: 0, misses: 0, missesHere: 0, hint: 0, maxHint: 0, askedModel: false, issue: null, missLine: null, traces: [] })
  })

  it('合格すると 次の画へ。まちがえると わけ と線を のこして 数える', () => {
    const state = play([ok(), miss(line(70), 'reverse')])
    expect(state).toMatchObject({ done: 1, misses: 1, missesHere: 1, issue: 'reverse', missLine: line(70) })
    const next = writeReducer(state, ok(line(20)))
    expect(next).toMatchObject({ done: 2, misses: 1, missesHere: 0, hint: 0, issue: null, missLine: null })
  })

  it('点を さわっただけ(線になっていない)は 数えない。合格なら 短くても すすむ', () => {
    expect(isTap([[1, 1], [2, 2]])).toBe(true)
    expect(isTap(line(5))).toBe(false)
    const state = play([miss([[1, 1], [2, 2]])])
    expect(state).toEqual(initWrite(false))
    expect(play([ok([[1, 1]])]).done).toBe(1)
  })

  it('見て書く: 同じ画で まちがえるたびに ヒントが 1段ずつ上がり、合格で もどる。いちばん上の段は おぼえておく', () => {
    const levels = [1, 2, 3, 4].map((n) => play(Array.from({ length: n }, () => miss())).hint)
    expect(levels).toEqual([2, 3, 4, 4])
    const after = play([miss(), miss(), miss(), ok()])
    expect(after).toMatchObject({ hint: 0, maxHint: 4 })
    expect(writeReport(after)).toMatchObject({ maxHint: 4, askedModel: false })
  })

  it('テスト: 2回目で いちばん強い ヒント', () => {
    expect(play([miss()], true).hint).toBe(2)
    expect(play([miss(), miss()], true).hint).toBe(4)
  })

  it('「おてほん」は すぐ 3段目。まちがえても 下がらない', () => {
    const state = play([{ type: 'model' }])
    expect(state).toMatchObject({ hint: 3, askedModel: true, misses: 0 })
    expect(writeReducer(state, miss()).hint).toBe(3)
    expect(writeReport(play([{ type: 'model' }, ok()]))).toMatchObject({ maxHint: 3, askedModel: true })
  })

  it('合格した画の 筆跡を report に のせる(まちがえた線は のせない)', () => {
    const state = play([miss(), ok()])
    expect(writeReport(state).strokes).toHaveLength(1)
    expect(writeReport(state).strokes?.[0]).toEqual(state.lines[0])
    expect(writeReport(play([ok(), { type: 'restart' }])).strokes).toEqual([])
  })

  it('「わからない」は まちがい1回として 3段目を出す。同じ画で もう まちがえていたら 数えない', () => {
    expect(play([{ type: 'giveUp' }], true)).toMatchObject({ hint: 3, misses: 1, missesHere: 1, askedModel: true, issue: null })
    expect(play([miss(), { type: 'giveUp' }], true)).toMatchObject({ hint: 3, misses: 1, missesHere: 1 })
    // もう お手本が出ているときは 何もしない
    const shown = play([miss(), miss()], true)
    expect(writeReducer(shown, { type: 'giveUp' })).toBe(shown)
  })

  it('くらべる ための線: 1回で書けた画は その線、まちがえた画は さいしょに まちがえた線', () => {
    const state = play([ok(line(10)), miss(line(70)), miss(line(80)), ok(line(20)), { type: 'giveUp' }, ok(line(30))], true)
    expect(state.traces).toEqual([
      { points: line(10), missed: false },
      { points: line(70), missed: true },
      { points: line(30), missed: true },
    ])
  })

  it('「はじめから」で 画と線は もどるが、まちがいの数 と ヒントの きろく は のこる', () => {
    const state = play([ok(), miss(), { type: 'model' }, { type: 'restart' }])
    expect(state).toMatchObject({ done: 0, misses: 1, missesHere: 0, hint: 0, maxHint: 3, askedModel: true, traces: [], issue: null })
  })
})
