import { expect, test, type Page } from '@playwright/test'
import { auditLayout, formatIssues } from './layoutAudit.js'
import { openApp, SIZES } from './auditSetup.js'
import { writeStrokes } from './learnFlow.js'

// 主要な画面で「文字の はみ出し」「部品の かさなり」「画面の外」「キツキツ」が 0件であること。
// 中身が いちばん長くなる記録(なまえ8もじ・コイン 99999・レベル 80・れんぞく 365・240字)で見る。
async function clean(page: Page, label: string): Promise<void> {
  expect(formatIssues(await auditLayout(page)), label).toEqual([])
}

for (const [name, size] of [['スマホ 844x390', SIZES.phone], ['iPad 1024x768', SIZES.tablet]] as const) {
  test.describe(name, () => {
    test.use({ viewport: { width: size.width, height: size.height }, isMobile: 'isMobile' in size, hasTouch: true })
    test.describe.configure({ timeout: 60_000 })

    test('ホーム・地図', async ({ page }) => {
      await openApp(page, 'rich')
      await page.waitForTimeout(2000)
      await clean(page, 'ホーム')
      await page.getByRole('button', { name: 'ぼうけん' }).first().click()
      await page.waitForTimeout(1200)
      await clean(page, '地図')
    })

    test('きせかえ 4つのタブ', async ({ page }) => {
      await openApp(page, 'rich')
      await page.getByRole('button', { name: /きせかえ/ }).click()
      for (const tab of ['ぼうし', 'かざり', 'そら', 'カード']) {
        await page.getByRole('tab', { name: tab }).click()
        await page.waitForTimeout(400)
        await clean(page, `きせかえ ${tab}`)
      }
    })

    test('せってい・保護者の画面', async ({ page }) => {
      await openApp(page, 'rich')
      await page.getByRole('button', { name: 'せってい' }).click()
      await page.waitForTimeout(600)
      await clean(page, 'せってい')
      await page.getByRole('button', { name: /おうちの かたへ/ }).click()
      const question = (await page.locator('.parent-gate__question span').first().innerText()).match(/(\d+)\s*×\s*(\d+)/)
      await page.getByLabel('答え').fill(String(Number(question?.[1]) * Number(question?.[2])))
      await page.getByRole('button', { name: 'ひらく' }).click()
      await page.waitForTimeout(1200)
      await clean(page, '保護者 学習のようす')
      for (const tab of ['宿題の字', '設定']) {
        await page.getByRole('tab', { name: tab }).click()
        await page.waitForTimeout(800)
        await clean(page, `保護者 ${tab}`)
      }
    })

    test('書き取り・結果', async ({ page }) => {
      await openApp(page, 'rich')
      await page.getByRole('button', { name: /ずかん/ }).first().click()
      await page.locator('.zukan-card[aria-label^="日 "]').first().click()
      await page.getByRole('button', { name: 'つぎへ' }).click()
      await page.locator('.kaku__svg').waitFor()
      await page.waitForTimeout(800)
      await clean(page, '書き取り')
      await writeStrokes(page, '日')
      await page.waitForTimeout(1500)
      await clean(page, '学ぶの結果')
    })

    test('ボスのたたかい', async ({ page }) => {
      await openApp(page, 'rich')
      await page.getByRole('button', { name: 'ぼうけん' }).first().click()
      await page.getByRole('button', { name: /ちゅうボス/ }).click()
      await page.waitForTimeout(900)
      await clean(page, 'ボス 導入')
      await page.getByRole('button', { name: 'たたかう！' }).click()
      await page.locator('.boss-run').waitFor()
      await page.waitForTimeout(900)
      await clean(page, 'ボス たたかい')
    })
  })
}
