// 読みまちがいの自動検出(AivisSpeech を起動してから)。
//   node scripts/voice-check.mjs            全クリップを調べる → scripts/voice-report.json(?voices の画面が読む)
//   node scripts/voice-check.mjs --probe    エンジンが ' や kana 指定を 受けつけるか 小さく試す
// 各クリップを(上書きがあれば 上書きの指定で)エンジンに渡し、返ってきた kana の読みを、もとの ひらがなの文から
// 期待する読みと 比べる。語頭(、。のあと)の「は」「へ」を ワ・エ と読んだ物は 'particle-misread'(ほぼ確実なまちがい)、
// それ以外のちがいは 'mismatch'(耳で たしかめる)。文の途中の「は」「へ」は 助詞のこともあるので、どちらでも よしとする。
// 長音の書き方(オー / オウ)のちがいは 同じと みなす。
import { engineVersion, kanaOf, loadClips, loadOverrides, loadStyleId, paths, queryFor, writeJsonAtomic } from './voice-engine.mjs'
import { compareReading, resolveSpec } from './voice-logic.mjs'

async function probe(styleId) {
  const tries = ["チカ'ラ", "ハイ'ル", "ハ'チ"]
  for (const value of tries) {
    try {
      const query = await queryFor({ kind: 'kana', value }, styleId)
      const accents = query.accent_phrases.map((p) => `${p.moras.map((m) => m.text).join('')}:${p.accent}`).join(' ')
      process.stdout.write(`kana ${value} → accent_phrases ${accents}\n`)
    } catch (error) {
      process.stdout.write(`kana ${value} → エラー ${error.message}\n`)
    }
  }
  const query = await queryFor({ kind: 'text', value: 'はいる。' }, styleId)
  process.stdout.write(`text はいる。 → 読み ${kanaOf(query)}\n`)
}

async function main() {
  const version = await engineVersion()
  if (!version) throw new Error('AivisSpeech に つながりません(起動してから もういちど)')
  const styleId = loadStyleId()
  if (process.argv.includes('--probe')) return probe(styleId)

  const clips = loadClips()
  const overrides = loadOverrides(clips)
  const results = {}
  for (const clip of clips) {
    const query = await queryFor(resolveSpec(clip, overrides), styleId)
    const kana = kanaOf(query)
    const comparison = compareReading(clip.text, kana)
    results[clip.id] = { kana, skipped: comparison.skipped, diffs: comparison.diffs }
  }
  writeJsonAtomic(paths.report, { engineVersion: version, styleId, clips: results })

  const entries = Object.entries(results)
  const misread = entries.filter(([, r]) => r.diffs.some((d) => d.kind === 'particle-misread'))
  const mismatch = entries.filter(([, r]) => r.diffs.length > 0 && !r.diffs.some((d) => d.kind === 'particle-misread'))
  process.stdout.write(`全 ${entries.length} クリップ。語頭の は・へ の読みまちがい ${misread.length} 本、ほかの読みのちがい ${mismatch.length} 本、比べられない ${entries.filter(([, r]) => r.skipped).length} 本\n`)
  const text = new Map(clips.map((c) => [c.id, c.text]))
  for (const [id, r] of [...misread, ...mismatch].slice(0, 60)) {
    process.stdout.write(`${id}\t${text.get(id)}\t${r.kana}\t${r.diffs.map((d) => `${d.expected}→${d.actual}`).join(' ')}\n`)
  }
  process.stdout.write(`結果: ${paths.report}\n`)
}

main().catch((error) => {
  process.stderr.write(`音声のチェックに失敗しました: ${error.message}\n`)
  process.exitCode = 1
})
