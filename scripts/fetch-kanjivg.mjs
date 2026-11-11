// KanjiVG の SVG を、指定したフォルダにダウンロードする。
// 使い方: node scripts/fetch-kanjivg.mjs <保存先フォルダ>
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ALL, GRADE1, GRADE2 } from './kanji-list.mjs'

const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji'
const CONCURRENCY = 8

async function main() {
  const outDir = process.argv[2]
  if (!outDir) throw new Error('保存先フォルダを引数で指定してください')
  if (GRADE1.length !== 80 || GRADE2.length !== 160 || new Set(ALL).size !== 240) {
    throw new Error(`漢字の数が合いません: 小1=${GRADE1.length} 小2=${GRADE2.length} 重複なし=${new Set(ALL).size}`)
  }
  mkdirSync(outDir, { recursive: true })
  const queue = ALL.map((char) => char.codePointAt(0).toString(16).padStart(5, '0'))
  const failed = []
  const worker = async () => {
    for (let code = queue.pop(); code; code = queue.pop()) {
      const file = join(outDir, `${code}.svg`)
      if (existsSync(file)) continue
      const res = await fetch(`${BASE}/${code}.svg`)
      if (!res.ok) {
        failed.push(code)
        continue
      }
      writeFileSync(file, await res.text())
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  if (failed.length > 0) throw new Error(`取得できませんでした: ${failed.join(', ')}`)
  process.stdout.write(`${ALL.length} 字そろいました: ${outDir}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
