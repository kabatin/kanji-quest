// 音声の「読み」と「アクセント」を扱う、エンジンにもファイルにも触れない部品(単体テストは src/lib/voiceCheck.test.ts)。
// scripts(Node)・開発サーバーの中継・音声チェック画面(ブラウザ)の3か所から使う。
//
// AquesTalk 風記法(VOICEVOX 互換 API の kana):
//   カタカナ = 読み、' = アクセントの下がり目(その音の直後で下がる)、/ = 区切り、、 = ポーズつき区切り、
//   ？ = 疑問(_ = 母音の無声化 は読みこむだけで、作りなおすときは 書かない)。1つのアクセント句に ' は 1つ。平板は、さいごの音のあとに ' を付けて表す。

const SMALL = 'ャュョァィゥェォヮ'
const ROWS = {
  ア: 'アカガサザタダナハバパマヤラワァャヮ',
  イ: 'イキギシジチヂニヒビピミリィ',
  ウ: 'ウクグスズツヅヌフブプムユルゥュヴ',
  エ: 'エケゲセゼテデネヘベペメレェ',
  オ: 'オコゴソゾトドノホボポモヨロヲォョ',
}
const VOWEL_OF = new Map(Object.entries(ROWS).flatMap(([vowel, chars]) => [...chars].map((c) => [c, vowel])))
const PURE_VOWELS = new Set(['ア', 'イ', 'ウ', 'エ', 'オ'])
const PUNCTUATION = /[\s、。！？!?,.・「」『』…ー〜~]/
const KANA_ALLOWED = /^[ァ-ヺー'/、_？]+$/
const TEXT_ALLOWED = /^[ぁ-ゖァ-ヺー一-龠々、。！？ 　]+$/
export const MAX_SPEC_LENGTH = 200

export const toKatakana = (text) => text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))

/** カタカナの読みを モーラ(音)に分ける。ャュョ などの小さい字は、前の字に くっつける。 */
export function splitMoras(reading) {
  const moras = []
  for (const char of reading) {
    const last = moras[moras.length - 1]
    if (SMALL.includes(char) && last !== undefined && !'ッンー'.includes(last[0])) moras[moras.length - 1] = last + char
    else moras.push(char)
  }
  return moras
}

/** 記法の文字列を アクセント句の並びにする。accent = 下がり目の直前の音の番号(1から)。0 = 指定なし。 */
export function parseKana(kana) {
  const phrases = []
  let current = { moras: [], accent: 0, pause: false, question: false }
  const flush = (pause) => {
    if (current.moras.length > 0) phrases.push(current)
    current = { moras: [], accent: 0, pause, question: false }
  }
  for (const char of kana) {
    if (char === '/' || char === '、') flush(char === '、')
    else if (char === "'") current = { ...current, accent: current.moras.length }
    else if (char === '？') current = { ...current, question: true }
    else if (/[ァ-ヺー]/.test(char)) current = { ...current, moras: splitWithNext(current.moras, char) }
  }
  flush(false)
  return phrases
}

function splitWithNext(moras, char) {
  const last = moras[moras.length - 1]
  if (SMALL.includes(char) && last !== undefined && !'ッンー'.includes(last[0])) return [...moras.slice(0, -1), last + char]
  return [...moras, char]
}

/** アクセント句の並びを、記法の文字列に もどす。 */
export function buildKana(phrases) {
  return phrases
    .map((phrase, index) => {
      const body = phrase.moras.map((m, i) => (i + 1 === phrase.accent ? `${m}'` : m)).join('')
      const separator = index === 0 ? '' : phrases[index].pause ? '、' : '/'
      return `${separator}${body}${phrase.question ? '？' : ''}`
    })
    .join('')
}

/** 記法から、アクセント記号などを取り除いた、読みだけ(カタカナと ー)。 */
export const readingOf = (kana) => [...kana].filter((c) => /[ァ-ヺー]/.test(c)).join('')

/** 音ごとの 高い(true)/ひくい(false)。accent 0 や さいごの音は 平板として、1音目だけ ひくい。 */
export function pitchPattern(moraCount, accent) {
  const flat = accent === 0 || accent >= moraCount
  return Array.from({ length: moraCount }, (_, i) => {
    const n = i + 1
    if (flat) return n > 1 || moraCount === 1
    if (accent === 1) return n === 1
    return n > 1 && n <= accent
  })
}

/** アクセントだけの目印(読みはちがってもよい)。例 "4:2" = 4音で 2音目のあとで下がる */
export const accentSignature = (kana) =>
  parseKana(kana)
    .map((p) => `${p.moras.length}:${p.accent === 0 ? p.moras.length : p.accent}`)
    .join('/')

/** 記法の文字列として、エンジンに渡してよいか。 */
export function validateKana(value) {
  if (typeof value !== 'string' || value.length === 0) return { ok: false, reason: '空です' }
  if (value.length > MAX_SPEC_LENGTH) return { ok: false, reason: `長すぎます(${MAX_SPEC_LENGTH}字まで)` }
  if (!KANA_ALLOWED.test(value)) return { ok: false, reason: "使える文字は カタカナ ー ' / 、 _ ？ だけです" }
  const phrases = parseKana(value)
  if (phrases.length === 0) return { ok: false, reason: '読みがありません' }
  const bad = phrases.findIndex((p) => p.accent < 1 || p.accent > p.moras.length)
  if (bad >= 0) return { ok: false, reason: `${bad + 1}つめの区切りに、アクセント(')が 1つ 必要です` }
  const doubled = [...value.split(/[/、]/)].findIndex((part) => (part.match(/'/g) ?? []).length !== 1)
  if (doubled >= 0) return { ok: false, reason: "1つの区切りに ' は 1つだけです" }
  return { ok: true, reason: '' }
}

/** 漢字まじりの文として、エンジンに渡してよいか。 */
export function validateText(value) {
  if (typeof value !== 'string' || value.length === 0) return { ok: false, reason: '空です' }
  if (value.length > MAX_SPEC_LENGTH) return { ok: false, reason: `長すぎます(${MAX_SPEC_LENGTH}字まで)` }
  if (!TEXT_ALLOWED.test(value)) return { ok: false, reason: 'ひらがな・カタカナ・漢字・、。！？ だけ使えます' }
  return { ok: true, reason: '' }
}

/** { kind: 'text' | 'kana', value } の形と中身を調べる。 */
export function validateSpec(spec) {
  if (!spec || typeof spec !== 'object') return { ok: false, reason: '指定の形がちがいます' }
  if (spec.kind === 'kana') return validateKana(spec.value)
  if (spec.kind === 'text') return validateText(spec.value)
  return { ok: false, reason: 'kind は text か kana です' }
}

const codepoint = (char) => char.codePointAt(0).toString(16)

/** narration.json から「クリップID → 読ませる文」の一覧。ID の決め方は src/lib/voice.ts と同じ。 */
export function listClips(narration) {
  return Object.entries(narration).flatMap(([char, entry]) => [
    { id: `word-${codepoint(char)}`, kind: 'word', char, text: `${entry.word}。` },
    { id: `explain-${codepoint(char)}`, kind: 'explain', char, text: entry.speech },
    ...entry.goals.map((text, i) => ({ id: `goal-${codepoint(char)}-${i}`, kind: 'goal', char, text })),
  ])
}

/** 文の中の「語」を置きかえる。区切り(文のはじめ・、・。のあと)にある語だけ。 */
export function replaceWords(text, words) {
  return Object.entries(words).reduce((acc, [from, to]) => {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return acc.replace(new RegExp(`(^|[、。！？\\s])${escaped}`, 'g'), (_, head) => `${head}${to}`)
  }, text)
}

/** そのクリップを実際に合成する指定。上書き(clips)→ 語の置きかえ(words)→ もとの文 の順。 */
export function resolveSpec(clip, overrides) {
  const direct = overrides.clips?.[clip.id]
  if (direct) return direct
  const replaced = replaceWords(clip.text, overrides.words ?? {})
  return { kind: 'text', value: replaced }
}

/** 上書きがあるか(あるとき、それは「いつもと ちがう」指定)。 */
export function hasOverride(clip, overrides) {
  return resolveSpec(clip, overrides).value !== clip.text || resolveSpec(clip, overrides).kind !== 'text'
}

/** voice-overrides.json の中身を調べる。わるいところは reason で返す。 */
export function validateOverrides(data, clipIds) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'オブジェクトではありません' }
  const ids = new Set(clipIds)
  for (const [id, spec] of Object.entries(data.clips ?? {})) {
    if (!ids.has(id)) return { ok: false, reason: `知らないクリップ ID: ${id}` }
    const result = validateSpec(spec)
    if (!result.ok) return { ok: false, reason: `${id}: ${result.reason}` }
  }
  for (const [from, to] of Object.entries(data.words ?? {})) {
    if (!/^[ぁ-ゖー]+$/.test(from)) return { ok: false, reason: `words の語は ひらがなだけ: ${from}` }
    const result = validateText(to)
    if (!result.ok) return { ok: false, reason: `words ${from}: ${result.reason}` }
  }
  return { ok: true, reason: '' }
}

// ---- 読みの比べ方 ----

const canonChar = (c) => ({ ヲ: 'オ', ヅ: 'ズ', ヂ: 'ジ' })[c] ?? c

/** 長音の書き方のちがい(おおきい / オーキー、おとうさん / オトーサン)を 同じと みなす形にそろえる。 */
function unifyLongVowels(chars) {
  let column = ''
  return chars.map((raw) => {
    const c = canonChar(raw)
    const pure = PURE_VOWELS.has(c)
    const long = c === 'ー' || (pure && column !== '' && (c === column || (column === 'オ' && c === 'ウ') || (column === 'エ' && c === 'イ')))
    if (long) return 'ー'
    column = VOWEL_OF.get(c) ?? ''
    return c
  })
}

/** ひらがなの文から、期待する読みの並び。語頭(区切りのあと)の は・へ は「そのまま」、ほかの は・へ は 助詞でも よい。 */
function expectedTokens(text) {
  let initial = true
  const tokens = []
  for (const char of toKatakana(text)) {
    if (PUNCTUATION.test(char) && char !== 'ー') {
      initial = true
      continue
    }
    if (!/[ァ-ヺー]/.test(char)) return undefined
    const options = char === 'ハ' ? (initial ? ['ハ'] : ['ハ', 'ワ']) : char === 'ヘ' ? (initial ? ['ヘ'] : ['ヘ', 'エ']) : char === 'ヲ' ? ['ヲ', 'オ'] : [char]
    tokens.push({ char, options, initial })
    initial = false
  }
  return tokens
}

/**
 * ひらがなの文と、エンジンが返した kana を比べる。
 * 返す diffs: { index, expected, actual, kind } — kind は 'particle-misread'(語頭の は・へ を ワ・エ と読んだ)か 'mismatch'。
 * 文に漢字や数字がまじっているときは、比べられない(skipped)。
 */
export function compareReading(text, kana) {
  const tokens = expectedTokens(text)
  const actual = [...readingOf(kana)]
  if (!tokens) return { ok: true, skipped: true, diffs: [], expected: '', actual: actual.join('') }
  const expectedFirst = unifyLongVowels(tokens.map((t) => t.options[0]))
  const actualUnified = unifyLongVowels(actual)
  const expected = expectedFirst.join('')
  if (expectedFirst.length !== actualUnified.length) {
    return { ok: false, skipped: false, diffs: [{ index: -1, expected, actual: actual.join(''), kind: 'mismatch' }], expected, actual: actual.join('') }
  }
  const diffs = tokens.flatMap((token, index) => {
    const prefix = tokens.slice(0, index).map((t) => t.options[0])
    const alternatives = token.options.map((o) => unifyLongVowels([...prefix, o]).at(-1))
    const same = actualUnified[index] === expectedFirst[index] || alternatives.includes(actualUnified[index])
    if (same) return []
    const misread = token.initial && ((token.char === 'ハ' && actual[index] === 'ワ') || (token.char === 'ヘ' && actual[index] === 'エ'))
    return [{ index, expected: token.options[0], actual: actual[index], kind: misread ? 'particle-misread' : 'mismatch' }]
  })
  return { ok: diffs.length === 0, skipped: false, diffs, expected, actual: actual.join('') }
}

/** 辞書(漢字まじり)の読みと ひらがなの読みが同じで、アクセントだけちがうか。 */
export function compareAccent(dictKana, plainKana) {
  const sameReading = unifyLongVowels([...readingOf(dictKana)]).join('') === unifyLongVowels([...readingOf(plainKana)]).join('')
  return { sameReading, sameAccent: accentSignature(dictKana) === accentSignature(plainKana) }
}
