import { describe, expect, it } from 'vitest'
import { getKanji } from '../data/kanji'
import { answerOf } from './answerInput'
import { buildWrite } from './boss'

const model = buildWrite(getKanji('海'), 'whole', true)
const blind = buildWrite(getKanji('海'), 'whole', false)

describe('answerOf', () => {
  it('見て書く・見ないで書く は 種類と ヒントの段を 渡す', () => {
    expect(answerOf(model, 0, { maxHint: 2, askedModel: false })).toEqual({ char: '海', kind: 'model', ok: true, hint: 2 })
    expect(answerOf(blind, 1, { maxHint: 4, askedModel: true })).toEqual({ char: '海', kind: 'blind', ok: false, hint: 4 })
  })
  it('結果の くわしい中身が ないときは ヒントを つけない', () => {
    expect(answerOf(blind, 0)).toEqual({ char: '海', kind: 'blind', ok: true })
  })
})
