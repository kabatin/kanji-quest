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

/**
 * name, 大きさ, まわりに足す余白(もとの絵に対する割合)。
 * maskable は 端末に 丸く切られるので、絵のまわりを ひろげて(地の色と ひかりの すじ は つづく)、だいじな所を まんなかに 収める。
 */
const TARGETS = [
  { name: 'icon-192.png', size: 192, grow: 0 },
  { name: 'icon-512.png', size: 512, grow: 0 },
  { name: 'icon-maskable-512.png', size: 512, grow: 0.14 },
  { name: 'apple-touch-icon.png', size: 180, grow: 0 },
  { name: 'favicon-48.png', size: 48, grow: 0 },
  // ストアに出すとき用(アプリには入れない)
  { name: join('..', '..', 'docs', 'store', 'icon-1024.png'), size: 1024, grow: 0 },
]

const VIEW = 120
/** viewBox を ひろげた SVG(grow = 片がわに足す割合) */
function grown(source, grow) {
  const pad = VIEW * grow
  return source.replace('viewBox="0 0 120 120"', `viewBox="${-pad} ${-pad} ${VIEW + pad * 2} ${VIEW + pad * 2}"`)
}

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const target of TARGETS) {
    const out = join(outDir, target.name)
    mkdirSync(dirname(out), { recursive: true })
    await page.setViewportSize({ width: target.size, height: target.size })
    await page.setContent(
      `<html><body style="margin:0;background:#ffc233"><div style="width:${target.size}px;height:${target.size}px">${grown(svg, target.grow).replace('<svg ', '<svg style="display:block;width:100%;height:100%" ')}</div></body></html>`,
    )
    await page.screenshot({ path: out, omitBackground: false })
    process.stdout.write(`${target.name}\n`)
  }
} finally {
  await browser.close()
}
