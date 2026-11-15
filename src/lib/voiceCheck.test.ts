import { describe, expect, it } from 'vitest'
import {
  accentSignature,
  buildKana,
  compareAccent,
  compareReading,
  hasOverride,
  listClips,
  parseKana,
  pitchPattern,
  readingOf,
  replaceWords,
  resolveSpec,
  splitMoras,
  validateKana,
  validateOverrides,
  validateSpec,
  validateText,
  voiceReport,
} from './voiceCheck'

describe('記法の読みこみ', () => {
  it('モーラに分ける(小さい字は前にくっつく)', () => {
    expect(splitMoras('キョウシツ')).toEqual(['キョ', 'ウ', 'シ', 'ツ'])
    expect(splitMoras('ガッコー')).toEqual(['ガ', 'ッ', 'コ', 'ー'])
  })
  it('アクセント句に分けて、もとの文字列に もどせる', () => {
    const kana = "チカ'ラ/ミギ'、ヒダリ'"
    const phrases = parseKana(kana)
    expect(phrases.map((p) => [p.moras.length, p.accent, p.pause])).toEqual([
      [3, 2, false],
      [2, 2, false],
      [3, 3, true],
    ])
    expect(buildKana(phrases)).toBe(kana)
  })
  it('読みだけ取り出す / アクセントの目印', () => {
    expect(readingOf("ハイ'ル/？")).toBe('ハイル')
    expect(accentSignature("チカ'ラ")).toBe('3:2')
  })
  it('音の高さ: 平板・頭高・中高', () => {
    expect(pitchPattern(3, 3)).toEqual([false, true, true])
    expect(pitchPattern(3, 1)).toEqual([true, false, false])
    expect(pitchPattern(4, 3)).toEqual([false, true, true, false])
  })
})

describe('記法の検証', () => {
  it('ふつうの記法は通る', () => expect(validateKana("チカ'ラ").ok).toBe(true))
  it('文字・アクセントの数がおかしいと通らない', () => {
    expect(validateKana('チカラ').ok).toBe(false)
    expect(validateKana("チ'カ'ラ").ok).toBe(false)
    expect(validateKana("ちから'").ok).toBe(false)
    expect(validateKana("チカラ'; rm -rf /").ok).toBe(false)
    expect(validateKana("../x'").ok).toBe(false)
    expect(validateKana("ア'".repeat(201)).ok).toBe(false)
  })
  it('文の検証', () => {
    expect(validateText('入る。').ok).toBe(true)
    expect(validateText('a/b').ok).toBe(false)
    expect(validateSpec({ kind: 'cmd', value: 'x' }).ok).toBe(false)
  })
})

describe('読みの比べ方', () => {
  it('語頭の は が ワ になっていたら 見つける', () => {
    const result = compareReading('はいる。', "ワイ'ル")
    expect(result.ok).toBe(false)
    expect(result.diffs).toEqual([{ index: 0, expected: 'ハ', actual: 'ワ', kind: 'particle-misread' }])
  })
  it('語頭の へ が エ でも 見つける', () => {
    expect(compareReading('へやに、はいる。', "エヤ'ニ/ハイ'ル").diffs[0]?.kind).toBe('particle-misread')
  })
  it('助詞の は・へ は ワ・エ でも ハ・ヘ でも よい', () => {
    expect(compareReading('わたしは、いえへ、いく。', "ワタシワ'、イエエ'、イ'ク").ok).toBe(true)
    expect(compareReading('わたしは、いく。', "ワタシハ'、イ'ク").ok).toBe(true)
  })
  it('語頭の は が ハ なら よい', () => expect(compareReading('はち。', "ハ'チ").ok).toBe(true))
  it('長音の書き方のちがいは 同じと みなす', () => {
    expect(compareReading('おおきい。', "オーキ'ー").ok).toBe(true)
    expect(compareReading('おとうさん。', "オトー'サン").ok).toBe(true)
  })
  it('ほかの読みちがいは mismatch', () => {
    const result = compareReading('ちから。', "チカ'ロ")
    expect(result.diffs[0]).toMatchObject({ kind: 'mismatch', expected: 'ラ', actual: 'ロ' })
  })
  it('長さがちがうと ひとつの mismatch', () => {
    expect(compareReading('ちから。', "チカ'").diffs).toHaveLength(1)
  })
  it('を は オ でも よい。漢字や数字の文は 比べない', () => {
    expect(compareReading('みぎを、あげる。', "ミギオ'、アゲ'ル").ok).toBe(true)
    expect(compareReading('1ぽん。', "イッポ'ン").skipped).toBe(true)
  })
  it('アクセントだけちがう語を見分ける', () => {
    expect(compareAccent("チカ'ラ", "チ'カラ")).toEqual({ sameReading: true, sameAccent: false })
    expect(compareAccent("リョ'ク", "チカ'ラ").sameReading).toBe(false)
  })
})

describe('上書きの適用', () => {
  const clips = listClips({ 入: { word: 'はいる', speech: 'はいる、ひと。', goals: ['はいるを、つくろう。'] } })
  it('クリップ一覧の ID(src/lib/voice.ts と同じ)', () => {
    expect(clips.map((c) => c.id)).toEqual(['word-5165', 'explain-5165', 'goal-5165-0'])
  })
  it('なにも無ければ もとの文', () => {
    expect(resolveSpec(clips[0]!, {})).toEqual({ kind: 'text', value: 'はいる。' })
    expect(hasOverride(clips[0]!, {})).toBe(false)
  })
  it('クリップごとの指定が先', () => {
    const overrides = { clips: { 'word-5165': { kind: 'kana' as const, value: "ハイ'ル" } }, words: { はいる: '入る' } }
    expect(resolveSpec(clips[0]!, overrides)).toEqual({ kind: 'kana', value: "ハイ'ル" })
    expect(resolveSpec(clips[1]!, overrides).value).toBe('入る、ひと。')
    expect(hasOverride(clips[1]!, overrides)).toBe(true)
  })
  it('語の置きかえは 区切りの はじめだけ', () => {
    expect(replaceWords('ひとがはいる。はいる。', { はいる: '入る' })).toBe('ひとがはいる。入る。')
  })
  it('上書きファイルの検証', () => {
    const ids = clips.map((c) => c.id)
    expect(validateOverrides({ clips: { 'word-5165': { kind: 'kana', value: "ハイ'ル" } } }, ids).ok).toBe(true)
    expect(validateOverrides({ clips: { '../etc': { kind: 'kana', value: "ア'" } } }, ids).ok).toBe(false)
    expect(validateOverrides({ clips: { 'word-5165': { kind: 'kana', value: 'ハイル' } } }, ids).ok).toBe(false)
    expect(validateOverrides({ words: { 入る: '入る' } }, ids).ok).toBe(false)
  })
})

describe('指揮役に わたす文', () => {
  it('なおしたい物だけ、ID・文・メモを書く', () => {
    const clips = listClips({ 力: { word: 'ちから', speech: 'ちからの、はなし。', goals: [] } })
    const text = voiceReport({ 'word-529b': { flag: true, memo: '2音目で下げる' }, 'explain-529b': { ok: true } }, clips)
    expect(text).toContain('word-529b(力)「ちから。」: 2音目で下げる')
    expect(text).not.toContain('explain')
    expect(voiceReport({}, clips)).toBe('')
  })
})
