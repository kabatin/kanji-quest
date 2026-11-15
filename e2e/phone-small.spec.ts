import { expect, test } from '@playwright/test'
import { skipIntro } from './skipIntro.js'

// スマホの よこ向きで、ブラウザの バー(URL・タブ)に 高さを とられたとき(iPhone の Safari で 844 x 280 くらい)。
// viewport の指定を 端末と同じように あつかうため、isMobile にする。
test.use({ viewport: { width: 844, height: 280 }, isMobile: true, hasTouch: true })

type Box = { x: number; y: number; width: number; height: number }

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1
}

test('高さが 足りない画面では ページぜんたいを ちぢめ、ホームの部品が かさならない', async ({ page }) => {
  await page.goto('/')
  await skipIntro(page)
  // 高さ 430 ぶんの 広さに なるまで ちぢむ
  await expect.poll(() => page.evaluate(() => window.innerHeight)).toBeGreaterThanOrEqual(430)
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  const big = page.getByRole('dialog', { name: 'がめんを 大きく' })
  if (await big.count()) await big.getByRole('button').last().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  const size = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }))
  expect(size.sw).toBeLessThanOrEqual(size.w)
  expect(size.sh).toBeLessThanOrEqual(size.h)

  await page.screenshot({ path: '.scene-sheets/phone-844x280-home.png' })
  const boxes: Record<string, Box> = {}
  for (const [name, selector] of [
    ['上の帯', '.home__hud'],
    ['ミッション', '.missions'],
    ['ひとこと', '.home__bubble'],
    ['メニュー', '.dock'],
  ] as const) {
    const box = await page.locator(selector).first().boundingBox()
    if (box) boxes[name] = box
  }
  const names = Object.keys(boxes)
  const clashes = names.flatMap((a, i) => names.slice(i + 1).filter((b) => overlaps(boxes[a], boxes[b])).map((b) => `${a} × ${b}`))
  expect(clashes).toEqual([])
  for (const box of Object.values(boxes)) expect(box.y + box.height).toBeLessThanOrEqual(size.h + 1)
})
