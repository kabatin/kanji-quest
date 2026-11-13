import { expect, test, type Page } from '@playwright/test'

const GLYPH_SIZE = 109
const BOSS_QUESTIONS = 15
const FITS = { inner: 0, pageHeight: 768, pageWidth: 1024 }

/** 中ボスまでの20字を学びおえた状態から始める(ログインボーナスは受け取りずみ)。 */
async function startWithStageLearned(page: Page) {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await page.evaluate(async () => {
    const areasPath = '/src/data/areas.ts'
    const storePath = '/src/store/progress.ts'
    const areas = await import(/* @vite-ignore */ areasPath)
    const store = await import(/* @vite-ignore */ storePath)
    store.useProgress.setState({ learned: [...areas.AREAS[0].bosses[0].kanji], settings: { sound: false, speech: false, music: false, icons: true, timer: false } })
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
async function solve(page: Page, root = '.boss-run') {
  const run = page.locator(root)
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

test('地図: ステージ8つと 中ボス・ラスボスが 画面に収まって ならぶ', async ({ page }) => {
  await startWithStageLearned(page)
  await page.getByRole('button', { name: 'ぼうけん' }).click()
  await expect(page.locator('.map-node--stage')).toHaveCount(8)
  await expect(page.locator('.map-node--boss')).toHaveCount(2)
  expect(await overflow(page)).toEqual(FITS)
  // 丸どうしが かさなって 押せなくならない
  const discs = await page.locator('.map-node__disc').evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect()).map((r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2, r: r.width / 2 })))
  for (const [i, a] of discs.entries()) for (const b of discs.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(a.r + b.r)
  await page.getByRole('button', { name: 'ちゅうボス とめきち' }).click()
  await expect(page.getByRole('heading', { name: 'はじまりの もりの ちゅうボス' })).toBeVisible()
})

test('ボス: 15問を まちがえずに とくと 100点で たおせて、次のステージが開く', async ({ page }) => {
  test.setTimeout(180_000)
  await startWithStageLearned(page)
  await page.getByRole('button', { name: /ボスに ちょうせん/ }).click()
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
  await expect(page.getByRole('heading', { name: 'ステージ 5' })).toBeVisible()

  // 読み込みなおしても、たおした記録は残る
  await page.reload()
  // ボスを たおして レベルが上がったので、ホームで おいわいが出る
  await page.getByRole('dialog', { name: 'レベルアップ' }).getByRole('button', { name: 'やったー！' }).click()
  await page.getByRole('button', { name: 'ぼうけん' }).click()
  await expect(page.getByRole('button', { name: 'ちゅうボス とめきち たおした' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ステージ 5', exact: true })).toBeEnabled()
})

/** いま出ている「えらぶ」問題で、わざと 1回 まちがえる(そのあと solve で とく)。 */
async function miss(page: Page) {
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

test('ボス: 1問 まちがえて にげられても、れんしゅう してから その1問を とけば ふっかつ で たおせる', async ({ page }) => {
  test.setTimeout(240_000)
  await startWithStageLearned(page)
  await page.getByRole('button', { name: /ボスに ちょうせん/ }).click()
  await page.getByRole('button', { name: 'たたかう！' }).click()
  await expect(page.locator('.bar__step')).toHaveText(`1 / ${BOSS_QUESTIONS}`)
  const missed = (await page.locator('.boss-run').getAttribute('data-kanji')) ?? ''
  await miss(page)
  for (let i = 0; i < BOSS_QUESTIONS; i += 1) {
    await expect(page.locator('.bar__step')).toHaveText(`${i + 1} / ${BOSS_QUESTIONS}`)
    await solve(page)
  }
  await expect(page.getByRole('heading', { name: /に にげられた…$/ })).toBeVisible()
  expect(await overflow(page)).toEqual(FITS)

  // まちがえた字を 見て書く → 見ないで書く
  await page.getByRole('button', { name: /ふっかつ チャンス/ }).click()
  for (const step of ['1 / 2', '2 / 2']) {
    await expect(page.locator('.bar__step')).toHaveText(step)
    await expect(page.locator('.revive-practice')).toHaveAttribute('data-kanji', missed)
    await solve(page, '.revive-practice')
  }

  // まちがえた 1問だけ が、もう一度 出る
  await expect(page.locator('.boss-run[data-revive="true"]')).toHaveAttribute('data-kanji', missed)
  await expect(page.locator('.bar__step')).toHaveText('1 / 1')
  await solve(page)
  await expect(page.getByRole('heading', { name: /を たおした！$/ })).toBeVisible()
  await expect(page.getByText('ふっかつ せいこう！')).toBeVisible()
  await expect(page.getByRole('button', { name: /ふっかつ チャンス/ })).toHaveCount(0)
  expect(await overflow(page)).toEqual(FITS)
})

test('ボス: とちゅうで やめても1回つかい、3回使いきると あしたまで たたかえない', async ({ page }) => {
  await startWithStageLearned(page)
  await page.evaluate(async () => {
    const storePath = '/src/store/progress.ts'
    const store = await import(/* @vite-ignore */ storePath)
    // 3回のうち 2回は、もう使ったことにする
    store.useProgress.getState().startBoss('a1-mid', 'mid')
    store.useProgress.getState().startBoss('a1-mid', 'mid')
  })
  await page.getByRole('button', { name: /ボスに ちょうせん/ }).click()
  await expect(page.getByRole('img', { name: 'きょうは あと 1かい' })).toBeVisible()
  await page.getByRole('button', { name: 'たたかう！' }).click()
  await page.getByRole('button', { name: '← やめる' }).click()
  await expect(page.getByRole('button', { name: 'あした また ちょうせん' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'れんしゅう する' })).toBeEnabled()
})

test('もようがえ: かざり を指で ひっぱると 場所が変わり、読み込みなおしても残る', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()
  await expect(page.locator('.island[data-ready="true"]')).toBeVisible({ timeout: 20_000 })
  // かざり を持っていない間は、もようがえ を押すと「きせかえで買おう」と案内が出る
  await page.getByRole('button', { name: 'もようがえ' }).click()
  const guide = page.getByRole('dialog', { name: 'もようがえ' })
  await expect(guide.getByRole('button', { name: 'きせかえへ' })).toBeVisible()
  expect(await overflow(page)).toEqual(FITS)
  await guide.getByRole('button', { name: 'とじる' }).click()
  await expect(guide).toBeHidden()
  const spots = () =>
    page.evaluate(async () => {
      const storePath = '/src/store/progress.ts'
      return (await import(/* @vite-ignore */ storePath)).useProgress.getState().decoSpots as Record<string, { x: number; z: number }>
    })
  await page.evaluate(async () => {
    const storePath = '/src/store/progress.ts'
    const store = await import(/* @vite-ignore */ storePath)
    store.useProgress.setState({ owned: [...store.useProgress.getState().owned, 'deco:bench'], settings: { sound: false, speech: false, music: false, icons: true, timer: false } })
  })
  expect(await overflow(page)).toEqual(FITS)
  await page.getByRole('button', { name: 'もようがえ' }).click()
  await expect(page.getByRole('region', { name: 'もようがえ' })).toBeVisible()
  await expect(page.locator('.dock')).toBeHidden()
  expect(await overflow(page)).toEqual(FITS)
  // カメラが上から見おろすまで待つ
  await page.waitForTimeout(1500)

  // ベンチ(はじめの場所 x: 3.3, z: 1.5)は、上から見おろすと 画面の まんなかより 少し右に見える
  const canvas = page.locator('.island__canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('しま がありません')
  // 何もない所を ひっぱっても、何も うごかない
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.08)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.2, { steps: 4 })
  await page.mouse.up()
  expect(await spots()).toEqual({})

  await page.mouse.move(box.x + box.width * 0.643, box.y + box.height * 0.522)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.35, { steps: 8 })
  await page.mouse.up()
  const placed = (await spots()).bench
  expect(placed).toBeDefined()
  // はじめの場所(x: 3.3, z: 1.5)から、左の おくへ うごいた
  expect(placed.x).toBeLessThan(0)
  expect(placed.z).toBeLessThan(1.5)

  // つかんだ かざり は、まわしたり しまったり できる
  const bar = page.getByRole('region', { name: 'もようがえ' })
  const saved = () =>
    page.evaluate(async () => {
      const storePath = '/src/store/progress.ts'
      const { decoTurns, decoStored } = (await import(/* @vite-ignore */ storePath)).useProgress.getState()
      return { decoTurns, decoStored }
    })
  await expect(bar).toContainText('ベンチ')
  await bar.getByRole('button', { name: /まわす/ }).click()
  await bar.getByRole('button', { name: /まわす/ }).click()
  expect(await saved()).toEqual({ decoTurns: { bench: 2 }, decoStored: [] })
  await bar.getByRole('button', { name: /しまう/ }).click()
  expect((await saved()).decoStored).toEqual(['bench'])
  expect(await overflow(page)).toEqual(FITS)
  await bar.getByRole('button', { name: 'ベンチ を だす' }).click()
  expect((await saved()).decoStored).toEqual([])
  await expect(bar.getByRole('button', { name: /しまう/ })).toBeVisible()

  await page.getByRole('button', { name: 'できた！' }).click()
  await expect(page.locator('.dock')).toBeVisible()
  await page.reload()
  await expect(page.locator('.island[data-ready="true"]')).toBeVisible({ timeout: 20_000 })
  expect((await spots()).bench).toEqual(placed)
  expect(await saved()).toEqual({ decoTurns: { bench: 2 }, decoStored: [] })
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
