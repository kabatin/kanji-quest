// アプリのアイコン(ホーム画面に追加したときの絵)を作る。
//   node scripts/build-icons.mjs
// public/icons/icon.svg を、Playwright の Chromium で PNG にする。
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'icons')
const svg = readFileSync(join(outDir, 'icon.svg'), 'utf8')

/** name, 大きさ, まわりの余白(maskable は 丸く切られても はみ出さないよう 小さめにする) */
const TARGETS = [
  { name: 'icon-192.png', size: 192, inset: 0 },
  { name: 'icon-512.png', size: 512, inset: 0 },
  { name: 'icon-maskable-512.png', size: 512, inset: 0.12 },
  { name: 'apple-touch-icon.png', size: 180, inset: 0 },
]

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const target of TARGETS) {
    const pad = Math.round(target.size * target.inset)
    await page.setViewportSize({ width: target.size, height: target.size })
    await page.setContent(
      `<html><body style="margin:0;background:#8fd3f4"><div style="width:${target.size}px;height:${target.size}px;padding:${pad}px;box-sizing:border-box">${svg.replace('<svg', '<svg width="100%" height="100%"')}</div></body></html>`,
    )
    await page.screenshot({ path: join(outDir, target.name), omitBackground: false })
    process.stdout.write(`${target.name}\n`)
  }
} finally {
  await browser.close()
}
