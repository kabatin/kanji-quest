import { expect, test, type Page } from '@playwright/test'

/** 保存できた音声の数と、保存するはずの数。 */
async function voiceProgress(page: Page): Promise<{ cached: number; total: number; shell: boolean }> {
  return page.evaluate(async () => {
    const list = await (await fetch('./precache.json')).json()
    const names = await caches.keys()
    const voice = names.find((name) => name.startsWith('kq-voice-'))
    const cached = voice ? (await (await caches.open(voice)).keys()).length : 0
    return { cached, total: list.voice.length as number, shell: names.some((name) => name.startsWith('kq-shell-')) }
  })
}

test('一度ひらけば、電波がなくても ひらけて、物語の音声も鳴らせる', async ({ page, context }) => {
  await page.goto('./')
  // はじめての あんない は とばす
  await page.getByRole('button', { name: 'あんないを とばす' }).click()
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()

  // サービスワーカーが入り、アプリ本体と音声の保存が終わるまで待つ
  await expect
    .poll(async () => {
      const progress = await voiceProgress(page)
      return progress.shell && progress.cached === progress.total && progress.total > 0
    }, { timeout: 100_000, intervals: [1000] })
    .toBe(true)

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: /^ずかん/ })).toBeVisible()
  await expect(page.locator('.island[data-ready="true"]')).toBeVisible({ timeout: 20_000 })

  // 音声ファイルも、保存したものから読める
  const status = await page.evaluate(async () => (await fetch('./voice/word-6728.mp3')).status)
  expect(status).toBe(200)

  // 保護者向けの画面にも「保存済み」と出る
  await page.getByRole('button', { name: 'せってい' }).click()
  await page.getByRole('button', { name: /おうちの かたへ/ }).click()
  const question = (await page.getByText('＝').textContent()) ?? ''
  const [a, b] = (question.match(/\d+/g) ?? ['0', '0']).map(Number)
  await page.getByRole('textbox', { name: '答え' }).fill(String(a * b))
  await page.getByRole('button', { name: 'ひらく' }).click()
  await page.getByRole('tab', { name: '設定' }).click()
  await expect(page.getByRole('status')).toContainText('端末に保存済み')
  await expect(page.getByRole('status')).toContainText('音声 603 / 603')
})
