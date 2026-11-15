import type { Page } from '@playwright/test'

const GLYPH_SIZE = 109

/** いま出ている書く問題の 画を、番号どおりに なぞる(画面に出ている画だけ。出ていなければ ぜんぶ)。 */
export async function writeStrokes(page: Page, char: string): Promise<void> {
  const board = page.locator('.kaku__svg')
  const box = await board.boundingBox()
  if (!box) throw new Error('書き取りの画面がありません')
  const shown = ((await board.getAttribute('data-strokes')) ?? '').split(',').filter(Boolean).map(Number)
  const strokes: [number, number][][] = await page.evaluate(async (target) => {
    const modulePath = '/src/data/strokes.ts'
    const data = await import(/* @vite-ignore */ modulePath)
    return data.getStrokes(data.fullGlyph(target)).map((s: { pts: [number, number][] }) => s.pts)
  }, char)
  const order = shown.length > 0 ? shown : strokes.map((_, i) => i + 1)
  for (const n of order) {
    const points = strokes[n - 1].map(([x, y]) => [box.x + (x / GLYPH_SIZE) * box.width, box.y + (y / GLYPH_SIZE) * box.height])
    await page.mouse.move(points[0][0], points[0][1])
    await page.mouse.down()
    for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 3 })
    await page.mouse.up()
  }
}

/** くみあわせの 1問を、正しい答えで とく。 */
export async function solveKumi(page: Page, char: string): Promise<void> {
  const answer: string | undefined = await page.evaluate(async (target) => {
    const kanjiPath = '/src/data/kanji.ts'
    const kanji = (await import(/* @vite-ignore */ kanjiPath)).getKanji(target)
    const fixed = document.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
    const shown = [...document.querySelectorAll('.kumi__choices button[data-part]')].map((b) => b.getAttribute('data-part'))
    return kanji.steps.find((s: { fixed: string; answer: string }) => s.fixed === fixed && shown.includes(s.answer))?.answer
  }, char)
  if (answer) await page.locator(`.kumi__choices button[data-part="${answer}"]`).click()
}

/** いま出ている ボスの問題(root の中)を、まちがえずに とく。 */
export async function solveBoss(page: Page, root = '.boss-run'): Promise<void> {
  const run = page.locator(root)
  const type = await run.getAttribute('data-type')
  const char = (await run.getAttribute('data-kanji')) ?? ''
  if (type === 'write') return writeStrokes(page, char)
  if (type === 'erabi') return page.locator(`.erabi-card[data-kanji="${char}"]`).click()
  const answers: string[] = await page.evaluate(
    async ({ target, kind }) => {
      const kanjiPath = '/src/data/kanji.ts'
      const bossPath = '/src/lib/boss.ts'
      const kanji = (await import(/* @vite-ignore */ kanjiPath)).getKanji(target)
      if (kind === 'parts') return (await import(/* @vite-ignore */ bossPath)).leafParts(kanji).map((p: { id: string }) => p.id)
      const fixed = document.querySelector('.kumi__fixed [data-part]')?.getAttribute('data-part')
      const shown = [...document.querySelectorAll('.kumi__choices button[data-part]')].map((b) => b.getAttribute('data-part'))
      return kanji.steps.filter((s: { fixed: string; answer: string }) => s.fixed === fixed && shown.includes(s.answer)).map((s: { answer: string }) => s.answer)
    },
    { target: char, kind: type },
  )
  const scope = type === 'parts' ? '.parts-pick__choices' : '.kumi__choices'
  for (const id of type === 'parts' ? answers : answers.slice(0, 1)) await page.locator(`${scope} button[data-part="${id}"]`).click()
}

/** いま出ている「えらぶ」系の問題で、わざと 1回 まちがえる。 */
export async function missBoss(page: Page): Promise<void> {
  const run = page.locator('.boss-run')
  const type = await run.getAttribute('data-type')
  const char = (await run.getAttribute('data-kanji')) ?? ''
  if (type === 'erabi') return page.locator(`.erabi-card:not([data-kanji="${char}"])`).first().click()
  const scope = type === 'parts' ? '.parts-pick__choices' : '.kumi__choices'
  const wrong: string = await page.evaluate(
    async ({ target, kind, scope }) => {
      const kanjiPath = '/src/data/kanji.ts'
      const bossPath = '/src/lib/boss.ts'
      const kanji = (await import(/* @vite-ignore */ kanjiPath)).getKanji(target)
      const right: string[] = kind === 'parts' ? (await import(/* @vite-ignore */ bossPath)).leafParts(kanji).map((p: { id: string }) => p.id) : kanji.steps.map((s: { answer: string }) => s.answer)
      const shown = [...document.querySelectorAll(`${scope} button[data-part]`)].map((b) => b.getAttribute('data-part') ?? '')
      return shown.find((id) => !right.includes(id)) ?? ''
    },
    { target: char, kind: type, scope },
  )
  await page.locator(`${scope} button[data-part="${wrong}"]`).click()
}
