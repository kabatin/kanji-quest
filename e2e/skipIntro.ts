import type { Page } from '@playwright/test'

/** はじめての あんない(ききて えらび)を とばして、ホームから始める。page.goto('/') のあとに呼ぶ。 */
export async function skipIntro(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const storePath = '/src/store/progress.ts'
    const store = await import(/* @vite-ignore */ storePath)
    store.useProgress.getState().skipIntro()
  })
}
