/*
 * 場面を1つ、まとめて たしかめる(場面を作る人・エージェントが、作るたびに使う)。
 *
 *   node scripts/scene-check.mjs 山          → scenes/k5c71.tsx を たしかめる
 *   node scripts/scene-check.mjs --big 山    → コマを大きく(3列)写す
 *
 * たしかめること:
 *   1. 型(TypeScript)… その場面のファイルの エラー だけを出す(ほかの人の 作りかけ は 見ない)
 *   2. 書き方(oxlint)
 *   3. コマ送りの一覧 … 画像を作り、きまり(長さ・くぎり・さいごに 字が書けている)を見る
 *
 * ぜんぶ よければ ○ で終わる(終了コード 0)。1つでも だめなら × と 直す所を出して、終了コード 1。
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const big = args.includes('--big')
const chars = args.filter((arg) => !arg.startsWith('--'))

if (chars.length !== 1 || [...chars[0]].length !== 1) {
  console.error('つかいかた: node scripts/scene-check.mjs [--big] <漢字1字>')
  process.exit(1)
}

const [char] = chars
const file = `src/features/story/scenes/k${char.codePointAt(0).toString(16)}.tsx`

if (!existsSync(join(root, file))) {
  console.error(`× ${char}: ファイルが ありません(${file})`)
  process.exit(1)
}

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8', shell: true })
  return { code: result.status ?? 1, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

let failed = false

// 1. 型: プロジェクトぜんたいを しらべて、この場面のファイルの行だけを ぬき出す
const types = run('npx', ['tsc', '-p', 'tsconfig.app.json', '--noEmit', '--pretty', 'false'])
const own = types.out.split(/\r?\n/).filter((line) => line.replaceAll('\\', '/').includes(file))
if (own.length > 0) {
  failed = true
  console.error(`× 型のエラー(${own.length}こ)\n   ${own.join('\n   ')}`)
} else {
  console.info('○ 型')
}

// 2. 書き方
const lint = run('npx', ['oxlint', file])
// oxlint は、警告だけのときは 終了コード 0 で終わる。「ファイル:行:列: warning …」の行が あれば、だめ とする
if (lint.code !== 0 || /: (warning|error) /.test(lint.out)) {
  failed = true
  console.error(`× 書き方(oxlint)\n${lint.out.trim()}`)
} else {
  console.info('○ 書き方')
}

// 3. コマ送りの一覧
const sheet = run('node', ['scripts/scene-sheet.mjs', ...(big ? ['--big'] : []), char])
if (sheet.code !== 0) failed = true
console.info(sheet.out.trim())

console.info(failed ? `\n× ${char}: まだ 直す所が あります` : `\n○ ${char}: ぜんぶ よし。画像を ひらいて、自分の目で 1コマずつ見てください`)
process.exit(failed ? 1 : 0)
