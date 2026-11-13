/*
 * README に のせる 画面写真(docs/screenshots/*.png)を 撮りなおす。
 *
 *   node scripts/screenshots.mjs
 *
 * 開発サーバーを 自分で立ち上げ、しばらく あそんだ人の きろく(47字を学び、中ボスを たおした)を作ってから、
 * ホーム・なりたちの物語・ぼうけん・パーツずかん・保護者の方へ の5まいを 1024×768 で写す。
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'screenshots')
/** 学んだことにする字の数(1つめのエリアと、2つめのエリアの とちゅうまで) */
const LEARNED = 47
/** 物語は、絵が まだ見えていて 字も書きはじめている ところで写す(秒) */
const STORY_AT_MS = 6200

const server = await createServer({ root, logLevel: 'silent', server: { port: 0, strictPort: false, hmr: false } })
await server.listen()
const address = server.httpServer?.address()
const port = typeof address === 'object' && address ? address.port : 5173
const browser = await chromium.launch()

try {
  mkdirSync(outDir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, hasTouch: true })
  const shot = (name) => page.screenshot({ path: join(outDir, `${name}.png`) })
  const home = () => page.getByRole('button', { name: '← ホーム' }).click()

  await page.goto(`http://localhost:${port}/`)
  await page.getByRole('dialog', { name: 'ログインボーナス' }).getByRole('button').click()

  // この1週間で 少しずつ学んだ きろく を作る(アプリの ふだんの しくみ を そのまま使う)
  await page.evaluate(async (count) => {
    const load = (path) => import(/* @vite-ignore */ path)
    const { ALL_STAGES, AREAS } = await load('/src/data/areas.ts')
    const { useProgress } = await load('/src/store/progress.ts')
    const { addDays, dayKey } = await load('/src/lib/date.ts')
    const today = dayKey()
    const chars = ALL_STAGES.flatMap((stage) => stage.kanji).slice(0, count)
    const store = useProgress.getState()
    store.updateSettings({ sound: false, music: false, speech: false })
    chars.forEach((char, i) => {
      // 古い字ほど 前の日に。きょうは 5字
      const day = addDays(today, -Math.max(0, 6 - Math.floor((i * 7) / count)))
      store.completeKanji(char, day)
      store.completeWriting(char, day)
    })
    for (let back = 6; back >= 0; back--) {
      const minutes = [12, 18, 9, 22, 15, 20, 14][back]
      for (let m = 0; m < minutes; m++) store.addPlayMinute(addDays(today, -back))
    }
    const state = useProgress.getState()
    useProgress.setState({
      clears: { ...state.clears, [AREAS[0].bosses[0].id]: addDays(today, -3), [AREAS[0].bosses[1].id]: addDays(today, -1) },
      misses: { [chars[8]]: 2, [chars[21]]: 1, [chars[33]]: 3 },
      streak: { count: 7, lastDay: today },
    })
    useProgress.getState().markLevelSeen()
    useProgress.getState().markZukanSeen()
  }, LEARNED)
  await page.reload()
  await page.getByRole('dialog').first().getByRole('button').first().click({ timeout: 2000 }).catch(() => undefined)

  // ホーム(3D の しま が 描かれるまで待つ)
  await page.waitForTimeout(4000)
  await shot('home')

  // なりたちの物語(休)
  await page.getByRole('button', { name: /^ずかん/ }).click()
  await page.getByRole('tab', { name: '1ねんせい' }).click()
  await page.getByRole('button', { name: /^休/ }).click()
  await page.locator('.scene[data-scene="休"]').waitFor()
  await page.waitForTimeout(STORY_AT_MS)
  await shot('story')
  await page.getByRole('button', { name: '← もどる' }).click()
  await home()

  // ぼうけん
  await page.getByRole('button', { name: /^ぼうけん/ }).click()
  await page.locator('.map-node').first().waitFor()
  await page.waitForTimeout(1200)
  await shot('map')
  await home()

  // パーツずかん
  await page.getByRole('button', { name: /^パーツ/ }).click()
  await page.locator('.bar__title').waitFor()
  // なかまの字が 右に出るよう、パーツを1つ えらんでおく
  await page.getByRole('button', { name: /^き の パーツ/ }).click()
  await page.waitForTimeout(800)
  await shot('parts')
  await home()

  // 保護者の方へ(入り口の かけ算を とく)
  await page.getByRole('button', { name: 'せってい' }).click()
  await page.getByRole('button', { name: /おうちの かたへ/ }).click()
  const [a, b] = ((await page.locator('.parent-gate__question span').textContent()) ?? '').match(/\d+/g) ?? []
  await page.getByRole('textbox', { name: '答え' }).fill(String(Number(a) * Number(b)))
  await page.keyboard.press('Enter')
  await page.locator('.parent-gate').waitFor({ state: 'detached' })
  await page.waitForTimeout(800)
  await shot('parent')
  console.info(`○ 5まい 撮りました: ${outDir}`)
} finally {
  await browser.close()
  await server.close()
}
