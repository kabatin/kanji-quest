import { expect, test, type Page } from '@playwright/test'
import { skipIntro } from './skipIntro.js'

const GLYPH_SIZE = 109
const WIDTH = 844
const HEIGHT = 390

// スマホ(iPhone 14)の よこ向き
test.use({ viewport: { width: WIDTH, height: HEIGHT } })

/** ページ全体が スクロールしないか。見えている「押す物」が 画面の中に あるか。 */
async function fits(page: Page) {
  return page.evaluate(
    ({ w, h }) => {
      const root = document.documentElement
      const outside = [...document.querySelectorAll('button')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
        })
        // 中が スクロールする入れもの(ステージの 一覧など)の中の物は、数えない
        .filter((el) => !el.closest('.settings__main, .result__side, .modal__panel'))
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.bottom > h + 1 || r.right > w + 1 || r.left < -1
        })
        .map((el) => el.textContent?.trim().slice(0, 12) ?? '')
      return { pageHeight: root.scrollHeight, pageWidth: root.scrollWidth, outside }
    },
    { w: WIDTH, h: HEIGHT },
  )
}

async function writeAllStrokes(page: Page, char: string) {
  const box = await page.locator('.kaku__svg').boundingBox()
  if (!box) throw new Error('書き取りの画面がありません')
  const strokes: [number, number][][] = await page.evaluate(async (target) => {
    const modulePath = '/src/data/strokes.ts'
    const data = await import(/* @vite-ignore */ modulePath)
    return data.getStrokes(data.fullGlyph(target)).map((s: { pts: [number, number][] }) => s.pts)
  }, char)
  for (const stroke of strokes) {
    const points = stroke.map(([x, y]) => [box.x + (x / GLYPH_SIZE) * box.width, box.y + (y / GLYPH_SIZE) * box.height])
    await page.mouse.move(points[0][0], points[0][1])
    await page.mouse.down()
    for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 3 })
    await page.mouse.up()
  }
}

test('スマホの よこ向き(844x390): ホーム → 学ぶ → 書く → 結果 が 画面に おさまり、ページ全体は スクロールしない', async ({ page }) => {
  await page.goto('/')
  await skipIntro(page)
  // ログインボーナスの まどは 画面に おさまり、ボタンを 押せる
  const bonus = page.getByRole('dialog', { name: 'ログインボーナス' })
  await expect(bonus).toBeVisible()
  const panel = await bonus.locator('.modal__panel').boundingBox()
  expect(panel?.y).toBeGreaterThanOrEqual(0)
  expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual(HEIGHT)
  await bonus.getByRole('button').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  // ホーム: 下のメニューと 大きなボタンが 見える
  await expect(page.getByRole('button', { name: /つづきから まなぶ/ })).toBeVisible()
  expect(await fits(page)).toEqual({ pageHeight: HEIGHT, pageWidth: WIDTH, outside: [] })

  // 学ぶ: ものがたり
  await page.getByRole('button', { name: /つづきから まなぶ/ }).click()
  const story = page.getByRole('img', { name: /の ものがたり$/ })
  await expect(story).toBeVisible()
  const char = (await story.getAttribute('aria-label'))?.charAt(0) ?? ''
  expect(await fits(page)).toEqual({ pageHeight: HEIGHT, pageWidth: WIDTH, outside: [] })

  // 書く: 絵の いれものは 高さいっぱいで、280px 以上
  await page.getByRole('button', { name: 'つぎへ' }).click()
  await expect(page.locator('.kaku__svg')).toBeVisible()
  const board = await page.locator('.kaku__svg').boundingBox()
  expect(board?.width).toBeGreaterThanOrEqual(280)
  expect((board?.y ?? 0) + (board?.height ?? 0)).toBeLessThanOrEqual(HEIGHT)
  expect(await fits(page)).toEqual({ pageHeight: HEIGHT, pageWidth: WIDTH, outside: [] })

  // 結果: 次へ すすむボタンが 画面の中に ある
  await writeAllStrokes(page, char)
  await expect(page.getByText('けいけんち ＋30')).toBeVisible()
  expect(await fits(page)).toEqual({ pageHeight: HEIGHT, pageWidth: WIDTH, outside: [] })
})
