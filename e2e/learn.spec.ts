import { expect, test, type Page } from '@playwright/test'

const GLYPH_SIZE = 109

/** 最初の画面で、ログインボーナスを受け取ってホームを出す。 */
async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}

/** ずかんで学年をえらび、その漢字の所まで スクロール して開く。 */
async function openFromZukan(page: Page, grade: 1 | 2, char: string) {
  await page.getByRole('button', { name: /^ずかん/ }).click()
  await page.getByRole('tab', { name: `${grade}ねんせい` }).click()
  const card = page.getByRole('button', { name: new RegExp(`^${char}`) })
  await card.click()
}

/** 書き取りの画面で、お手本の通り道どおりにマウスで全部の画を書く。 */
async function writeAllStrokes(page: Page, char: string) {
  const board = page.locator('.kaku__svg')
  const box = await board.boundingBox()
  if (!box) throw new Error('書き取りの画面がありません')
  // アプリが読んでいる画データを、開発サーバーからそのまま取りよせる
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

/** 画面の中身が、スクロールなしで収まっているか。 */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const screen = document.querySelector('.screen')
    return {
      inner: screen ? screen.scrollHeight - screen.clientHeight : 0,
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
    }
  })
}

const FITS = { inner: 0, pageHeight: 768, pageWidth: 1024 }

test('「つづきから」で学び、指で書くと はんこ が押されて、記録は読み込みなおしても残る', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: /つづきから まなぶ/ }).click()
  await expect(page.getByRole('img', { name: /の ものがたり$/ })).toBeVisible()
  const char = (await page.getByRole('img', { name: /の ものがたり$/ }).getAttribute('aria-label'))?.charAt(0) ?? ''
  await page.getByRole('button', { name: 'つぎへ' }).click()
  await writeAllStrokes(page, char)
  await expect(page.getByText('けいけんち ＋30')).toBeVisible()
  await expect(page.locator('.result__stamps .stamp.is-on')).toHaveCount(2)

  await page.reload()
  await expect(page.getByRole('button', { name: /^ずかん/ })).toContainText('1 / 240')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('休: 人が木にもたれる物語のあと、亻と木を組み合わせると、なかまに体が出る', async ({ page }) => {
  await start(page)
  await openFromZukan(page, 1, '休')
  // 休 には 手づくりの場面が ある。さいごまで流れると、字の画が ぜんぶ書けている
  await expect(page.locator('.scene[data-scene="休"]')).toBeVisible()
  await expect(page.locator('.scene[data-finished="true"] [data-done="true"]')).toHaveCount(6, { timeout: 15_000 })
  expect(await overflow(page)).toEqual(FITS)
  await expect(page.getByText('ひとが きに もたれて ひとやすみ。')).toBeVisible()
  await page.getByRole('button', { name: 'つぎへ' }).click()
  await expect(page.locator('.kumi__fixed [data-part="亻"]')).toBeVisible()
  await page.locator('.kumi__choices button[data-part="木"]').click()
  await page.getByRole('button', { name: 'あとで' }).click()
  await expect(page.getByRole('region', { name: 'なかま' }).getByRole('button', { name: /^体/ })).toBeVisible()
})

test('どの画面もタブレットの画面内に収まり、ページ全体はスクロールしない', async ({ page }) => {
  await start(page)
  expect(await overflow(page)).toEqual(FITS)

  await page.getByRole('button', { name: /^ぼうけん/ }).click()
  await expect(page.locator('.map-node')).toHaveCount(10)
  expect(await overflow(page)).toEqual(FITS)
  await page.locator('.map-node.is-open').first().click()
  await expect(page.locator('.stage-card')).toHaveCount(5)
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: '← ぼうけん' }).click()
  await page.getByRole('button', { name: '← ホーム' }).click()

  for (const menu of [/^パーツ/, /^きょうの\s+チャレンジ(?!を)/, /^きせかえ/]) {
    await page.getByRole('button', { name: menu }).click()
    await expect(page.locator('.bar__title')).toBeVisible()
    expect(await overflow(page)).toEqual(FITS)
    await page.getByRole('button', { name: '← ホーム' }).click()
  }

  for (const char of ['海', '雲', '間', '曜']) {
    await openFromZukan(page, 2, char)
    await expect(page.locator('.story__stage')).toBeVisible()
    expect(await overflow(page)).toEqual(FITS)
    await page.getByRole('button', { name: 'つぎへ' }).click()
    await expect(page.locator('.kumi__choices button')).toHaveCount(4)
    expect(await overflow(page)).toEqual(FITS)
    await page.getByRole('button', { name: '← もどる' }).click()
    await page.getByRole('button', { name: '← ホーム' }).click()
  }
})

test('日のように仲間が多い漢字でも、結果の画面が収まる', async ({ page }) => {
  await start(page)
  await openFromZukan(page, 1, '日')
  await page.getByRole('button', { name: 'つぎへ' }).click()
  await page.getByRole('button', { name: 'あとで' }).click()
  await expect(page.getByRole('region', { name: 'なかま' })).toBeVisible()
  expect(await overflow(page)).toEqual(FITS)
})
