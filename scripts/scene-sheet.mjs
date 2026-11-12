/*
 * 場面の「コマ送りの一覧」を 画像にする(場面を作る人・エージェントが、自分の目で たしかめるため)。
 *
 *   node scripts/scene-sheet.mjs 休                      → test-results/scenes/k4f11.png
 *   node scripts/scene-sheet.mjs 休 木 林                → 何字でも
 *   node scripts/scene-sheet.mjs --variant sonnet 山     → ためしの場面(trials/sonnet/)。test-results/scenes/sonnet/k5c71.png
 *   node scripts/scene-sheet.mjs --big 休                → コマを大きく(3列)。こまかい所を見るとき
 *
 * 開発サーバーを 自分で立ち上げて、?scene=字 のページを 写す。
 * きまり を守っていない所(長さ・くぎり・さいごに 字が書けていない)や エラーが あれば × を出して、終了コード 1 で終わる。
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const variantAt = args.indexOf('--variant')
const variant = variantAt >= 0 ? args[variantAt + 1] : null
const big = args.includes('--big')
const chars = args.filter((arg, i) => !arg.startsWith('--') && (variantAt < 0 || i !== variantAt + 1))
const outDir = join(root, 'test-results', 'scenes', ...(variant ? [variant] : []))

if (chars.length === 0 || (variantAt >= 0 && !variant)) {
  console.error('つかいかた: node scripts/scene-sheet.mjs [--variant <なまえ>] [--big] <漢字> [<漢字> ...]')
  process.exit(1)
}

const fileOf = (char) => `k${char.codePointAt(0).toString(16)}`

const server = await createServer({ root, logLevel: 'silent', server: { port: 0, strictPort: false, hmr: false } })
await server.listen()
const address = server.httpServer?.address()
const port = typeof address === 'object' && address ? address.port : 5173
const browser = await chromium.launch()
let failed = false

try {
  mkdirSync(outDir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const char of chars) {
    errors.length = 0
    const source = `src/features/story/${variant ? `trials/${variant}` : 'scenes'}/${fileOf(char)}.tsx`
    await page.setViewportSize({ width: 1320, height: 900 })
    await page.goto(`http://localhost:${port}/?scene=${encodeURIComponent(char)}${variant ? `&variant=${encodeURIComponent(variant)}` : ''}`)
    // 場面は あとから読みこまれる。読みこめた(ready)か、ない・こわれている(missing)か が 決まるまで待つ
    const state = await page
      .locator('.scene-sheet[data-ready="true"], .scene-sheet[data-state="missing"]')
      .first()
      .waitFor({ timeout: 30_000 })
      .then(() => page.locator('.scene-sheet').getAttribute('data-state'))
      .catch(() => 'timeout')
    if (state !== 'ready') {
      failed = true
      const detail = [...(await page.locator('.scene-sheet__problems').allTextContents()), ...errors].join('\n   ')
      console.error(`× ${char}: 場面を 描けません(${source})${detail ? `\n   ${detail}` : state === 'timeout' ? '\n   読みこみが 終わりません' : '\n   ファイルが ありません'}`)
      continue
    }
    if (big) await page.addStyleTag({ content: '.scene-sheet__grid { grid-template-columns: repeat(3, 1fr) !important; }' })
    // コマが ぜんぶ入るよう、画面の高さを 一覧に合わせる
    const height = await page.locator('.scene-sheet__grid').evaluate((grid) => Math.ceil(grid.getBoundingClientRect().height) + 160)
    await page.setViewportSize({ width: 1320, height: Math.max(height, 900) })
    // コマの一覧だけを写す(下の「動いている1コマ」は、写すたびに変わるので入れない)
    const out = join(outDir, `${fileOf(char)}${big ? '-big' : ''}.png`)
    await page.locator('.scene-sheet__grid').screenshot({ path: out })
    const problems = await page.locator('.scene-sheet__problems').allTextContents()
    const bad = problems.length > 0 || errors.length > 0
    if (bad) failed = true
    console.info(`${bad ? '×' : '○'} ${char}: ${out}${problems.length > 0 ? `\n   ${problems.join(' ')}` : ''}${errors.length > 0 ? `\n   エラー: ${errors.join(' / ')}` : ''}`)
  }
} finally {
  await browser.close()
  await server.close()
}

process.exit(failed ? 1 : 0)
