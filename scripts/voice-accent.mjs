// アクセントの候補を出す(AivisSpeech を起動してから)。
//   node scripts/voice-accent.mjs
// word-* クリップ(キーは漢字1字)について、「漢字だけで渡したときに エンジンが辞書から出す」読みとアクセントを、
// 「ひらがなで渡したとき」と くらべる。読みが同じで アクセントだけちがう語を、辞書のほうを候補にして
// scripts/voice-suggestions.json に書く(勝手には 使わない。?voices の画面で 聞いて えらぶ)。
// 漢字1字だけだと 読みが ちがう(音読みなど)ことがある。その語は「読みがちがう」として数えるだけで、候補に しない。
import { engineVersion, kanaOf, loadClips, loadStyleId, paths, queryFor, writeJsonAtomic } from './voice-engine.mjs'
import { accentSignature, compareAccent } from './voice-logic.mjs'

async function main() {
  if (!(await engineVersion())) throw new Error('AivisSpeech に つながりません(起動してから もういちど)')
  const styleId = loadStyleId()
  const words = loadClips().filter((c) => c.kind === 'word')
  const suggestions = []
  let sameAccent = 0
  let otherReading = 0
  for (const clip of words) {
    const plain = kanaOf(await queryFor({ kind: 'text', value: clip.text }, styleId))
    const dict = kanaOf(await queryFor({ kind: 'text', value: `${clip.char}。` }, styleId))
    const result = compareAccent(dict, plain)
    if (!result.sameReading) otherReading += 1
    else if (result.sameAccent) sameAccent += 1
    else suggestions.push({ id: clip.id, char: clip.char, text: clip.text, plain, dict, plainAccent: accentSignature(plain), dictAccent: accentSignature(dict) })
  }
  writeJsonAtomic(paths.suggestions, { styleId, suggestions })
  process.stdout.write(`word ${words.length} 本。アクセントが ちがう ${suggestions.length}、同じ ${sameAccent}、読みがちがう(比べない) ${otherReading}\n`)
  for (const s of suggestions.slice(0, 40)) process.stdout.write(`${s.id}\t${s.char}\t${s.plain}\t→ ${s.dict}\n`)
  process.stdout.write(`結果: ${paths.suggestions}\n`)
}

main().catch((error) => {
  process.stderr.write(`アクセントの調べに失敗しました: ${error.message}\n`)
  process.exitCode = 1
})
