import { expect, test, type Page } from '@playwright/test'

const GLYPH_SIZE = 109
const BOSS_QUESTIONS = 15
const FITS = { inner: 0, pageHeight: 768, pageWidth: 1024 }

/** ステージ1の5字を学びおえた状態から始める(ログインボーナスは受け取りずみ)。 */
async function startWithStageLearned(page: Page) {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await page.evaluate(async () => {
    const areasPath = '/src/data/areas.ts'
    const storePath = '/src/store/progress.ts'
    const areas = await import(/* @vite-ignore */ areasPath)
    const store = await import(/* @vite-ignore */ storePath)
    store.useProgress.setState({ learned: [...areas.ALL_STAGES[0].kanji], settings: { sound: false, speech: false, icons: true, timer: false } })
  })
}

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

/** 書く問題: 出ている画番号のとおりに、お手本の通り道をマウスでなぞる。 */
async function writeStrokes(page: Page, char: string) {
  const board = page.locator('.kaku__svg')
  const box = await board.boundingBox()
  if (!box) throw new Error('書き取りの画面がありません')
  const numbers = ((await board.getAttribute('data-strokes')) ?? '').split(',').map(Number)
  const strokes: [number, number][][] = await page.evaluate(async (target) => {
    const modulePath = '/src/data/strokes.ts'
    const data = await import(/* @vite-ignore */ modulePath)
    return data.getStrokes(data.fullGlyph(target)).map((s: { pts: [number, number][] }) => s.pts)
  }, char)
  for (const n of numbers) {
    const points = strokes[n - 1].map(([x, y]) => [box.x + (x / GLYPH_SIZE) * box.width, box.y + (y / GLYPH_SIZE) * box.height])
    await page.mouse.move(points[0][0], points[0][1])
    await page.mouse.down()
    for (const [x, y] of points.slice(1)) await page.mouse.move(x, y, { steps: 3 })
    await page.mouse.up()
  }
}

/** いま出ている ボスの問題を、まちがえずに とく。 */
async function solve(page: Page) {
  const run = page.locator('.boss-run')
  const type = await run.getAttribute('data-type')
  const char = (await run.getAttribute('data-kanji')) ?? ''
  if (type === 'write') return writeStrokes(page, char)
  if (type === 'erabi') return page.locator(`.erabi-card[data-kanji="${char}"]`).click()
  // えらぶ部位は、アプリのデータから正解を調べる
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

test('ホームは 3D の しま が出て、画面に収まる。メニューは「あそぶ」「あつめる」に分かれる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await expect(page.locator('.island[data-ready="true"]')).toBeVisible({ timeout: 20_000 })
  expect(await overflow(page)).toEqual(FITS)
  await expect(page.getByRole('region', { name: 'あそぶ' }).getByRole('button')).toHaveCount(2)
  await expect(page.getByRole('region', { name: 'あつめる' }).getByRole('button')).toHaveCount(3)
  // しま(すみまる)を さわっても、画面が動いたり エラーになったりしない
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.locator('.island__canvas').click({ position: { x: 512, y: 330 } })
  await page.waitForTimeout(500)
  expect(errors).toEqual([])
  expect(await overflow(page)).toEqual(FITS)
})

test('ボス: 15問を まちがえずに とくと 100点で たおせて、次のステージが開く', async ({ page }) => {
  test.setTimeout(180_000)
  await startWithStageLearned(page)
  await page.getByRole('button', { name: /ボスに ちょうせん/ }).click()
  await page.getByRole('button', { name: 'ボスに ちょうせん' }).click()
  await expect(page.getByRole('img', { name: 'きょうは あと 3かい' })).toBeVisible()
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: 'たたかう！' }).click()

  const rounds = new Set<string>()
  for (let i = 0; i < BOSS_QUESTIONS; i += 1) {
    await expect(page.locator('.bar__step')).toHaveText(`${i + 1} / ${BOSS_QUESTIONS}`)
    const round = (await page.locator('.boss-run').getAttribute('data-round')) ?? ''
    // 問題の種類ごとに1回ずつ、画面に収まっているかを見る
    if (!rounds.has(round)) expect(await overflow(page)).toEqual(FITS)
    rounds.add(round)
    await solve(page)
  }
  expect([...rounds]).toEqual(['select', 'model', 'blind'])

  await expect(page.getByRole('heading', { name: /を たおした！$/ })).toBeVisible()
  await expect(page.locator('.boss-result__score strong')).toHaveText('100')
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: 'つぎの ステージへ' }).click()
  await expect(page.getByRole('heading', { name: 'ステージ 2' })).toBeVisible()

  // 読み込みなおしても、たおした記録は残る
  await page.reload()
  // ボスを たおして レベルが上がったので、ホームで おいわいが出る
  await page.getByRole('dialog', { name: 'レベルアップ' }).getByRole('button', { name: 'やったー！' }).click()
  await page.getByRole('button', { name: 'ぼうけん' }).click()
  await expect(page.getByRole('button', { name: 'ステージ 1 クリア' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ステージ 2', exact: true })).toBeEnabled()
})

test('ボス: とちゅうで やめても1回つかい、3回使いきると あしたまで たたかえない', async ({ page }) => {
  await startWithStageLearned(page)
  await page.evaluate(async () => {
    const storePath = '/src/store/progress.ts'
    const store = await import(/* @vite-ignore */ storePath)
    // 3回のうち 2回は、もう使ったことにする
    store.useProgress.getState().startBoss('s1', 'stage')
    store.useProgress.getState().startBoss('s1', 'stage')
  })
  await page.getByRole('button', { name: /ボスに ちょうせん/ }).click()
  await page.getByRole('button', { name: 'ボスに ちょうせん' }).click()
  await expect(page.getByRole('img', { name: 'きょうは あと 1かい' })).toBeVisible()
  await page.getByRole('button', { name: 'たたかう！' }).click()
  await page.getByRole('button', { name: '← やめる' }).click()
  await expect(page.getByRole('button', { name: 'あした また ちょうせん' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'れんしゅう する' })).toBeEnabled()
})

test('きせかえ の画面は、どの種類も画面に収まる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await page.getByRole('button', { name: /^きせかえ/ }).click()
  for (const tab of ['ぼうし', 'かざり', 'そら', 'カード']) {
    await page.getByRole('tab', { name: tab }).click()
    expect(await overflow(page)).toEqual(FITS)
  }
})

test('あそぶ人: 新しく作って切りかえると進みぐあいが分かれ、読み込みなおすと だれが あそぶか を聞かれる', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await page.getByRole('button', { name: /^あそぶ ひと/ }).click()
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: 'あたらしく つくる' }).click()
  await page.getByRole('textbox', { name: 'なまえ' }).fill('はな')
  await page.getByRole('button', { name: 'つくる' }).click()
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await expect(page.getByRole('button', { name: /^あそぶ ひと: はな/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'だれが あそぶ？' })).toBeVisible()
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: 'プレイヤー1 で あそぶ' }).click()
  await expect(page.getByRole('button', { name: /^あそぶ ひと: プレイヤー1/ })).toBeVisible()
})
