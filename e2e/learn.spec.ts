import { expect, test, type Page } from '@playwright/test'

const MAX_PAGES = 10

/** ずかんで学年をえらび、その漢字が出てくるページまで進んでから開く。 */
async function openKanji(page: Page, grade: 1 | 2, char: string) {
  await page.getByRole('tab', { name: `${grade}ねんせい` }).click()
  const card = page.getByRole('button', { name: new RegExp(`^${char}`) })
  for (let i = 0; i < MAX_PAGES && (await card.count()) === 0; i += 1) {
    await page.getByRole('button', { name: 'つぎの ページ' }).click()
  }
  await card.click()
}

/** 画面の中身が、スクロールなしで収まっているか。 */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const screen = document.querySelector('.screen')
    if (!screen) throw new Error('.screen がありません')
    return {
      inner: screen.scrollHeight - screen.clientHeight,
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
    }
  })
}

test('海をえらび、さんずいと組み合わせると、なかまに池が出る', async ({ page }) => {
  await page.goto('/')
  await openKanji(page, 2, '海')
  await expect(page.locator('.kumi__fixed [data-part="氵"]')).toBeVisible()
  await page.locator('button[data-part="毎"]').click()
  const nakama = page.getByRole('region', { name: 'なかま' })
  await expect(nakama.getByRole('button', { name: /^池/ })).toBeVisible()
  await page.getByRole('button', { name: 'ずかんへ' }).click()
  // 見ていた学年とページに戻ってくる
  await expect(page.getByRole('button', { name: /^海.*おぼえた/ })).toBeVisible()
})

test('学んだ記録は、読み込みなおしても残る', async ({ page }) => {
  await page.goto('/')
  await openKanji(page, 1, '木')
  await page.getByRole('button', { name: 'へんしん！' }).click()
  await page.getByRole('button', { name: 'へんしん！' }).click()
  await page.getByRole('button', { name: 'できた！' }).click()
  await page.getByRole('button', { name: 'ずかんへ' }).click()
  await expect(page.getByText('1 / 80')).toBeVisible()
  await page.reload()
  await expect(page.getByText('1 / 80')).toBeVisible()
  await expect(page.getByRole('button', { name: /ごほうび 10 ポイント/ })).toBeVisible()
})

test('どの画面もタブレットの画面内に収まり、ページ全体はスクロールしない', async ({ page }) => {
  await page.goto('/')
  for (const grade of [1, 2] as const) {
    await page.getByRole('tab', { name: `${grade}ねんせい` }).click()
    await expect(page.locator('.zukan-card').first()).toBeVisible()
    expect(await overflow(page)).toEqual({ inner: 0, pageHeight: 768, pageWidth: 1024 })
  }
  for (const char of ['海', '雲', '間', '線', '国', '曜']) {
    await openKanji(page, 2, char)
    await expect(page.locator('.kumi__choices button')).toHaveCount(4)
    expect(await overflow(page)).toEqual({ inner: 0, pageHeight: 768, pageWidth: 1024 })
    await page.getByRole('button', { name: '← ずかん' }).click()
  }
})

test('日のように仲間が多い漢字でも、結果の画面が収まる', async ({ page }) => {
  await page.goto('/')
  await openKanji(page, 1, '日')
  await page.getByRole('button', { name: 'へんしん！' }).click()
  await page.getByRole('button', { name: 'へんしん！' }).click()
  await page.getByRole('button', { name: 'できた！' }).click()
  await expect(page.getByRole('region', { name: 'なかま' })).toBeVisible()
  expect((await overflow(page)).inner).toBe(0)
})
