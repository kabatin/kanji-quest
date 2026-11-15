import type { Page } from '@playwright/test'
import { skipIntro } from './skipIntro.js'

export const SIZES = {
  phone: { width: 844, height: 390, isMobile: true, hasTouch: true },
  phoneShort: { width: 844, height: 280, isMobile: true, hasTouch: true },
  tablet: { width: 1024, height: 768 },
} as const

const HINT_KEY = 'kanji-quest-bigscreen-hint'

export type Preset = 'fresh' | 'rich' | 'mid'

/**
 * 点検の はじまり。記録を入れて、ログインボーナス・レベルアップが 出ない状態でホームを開く。
 * rich = 中身が いちばん長くなる記録(なまえ8もじ、コイン 99999、レベル 80、れんぞく 365、240字ぜんぶ)。
 * mid = 1年生の はじめの エリアを あそんでいる途中。fresh = はじめて(あんないは とばす)。
 */
export type OpenOptions = { readonly hint?: boolean; /** ログインボーナス・レベルアップの窓を出す */ readonly modals?: boolean; /** はじめての あんないを とばさない */ readonly intro?: boolean }

export async function openApp(page: Page, preset: Preset = 'fresh', options: OpenOptions = {}): Promise<void> {
  const hint = options.hint ?? false
  // 「がめんを 大きく」の窓は、見たいとき(hint)だけ出す
  if (!hint) await page.addInitScript((key) => localStorage.setItem(key, '1'), HINT_KEY)
  if (preset === 'rich') await page.addInitScript(() => localStorage.setItem('kanji-zukan-profiles', JSON.stringify({ profiles: [{ id: 'p1', name: 'まるまるまるまる' }], activeId: 'p1' })))
  await page.goto('/')
  await page.evaluate(
    async ({ preset: p, modals, intro }) => {
      const base = '/src'
      const progress = await import(/* @vite-ignore */ `${base}/store/progress.ts`)
      const kanji = await import(/* @vite-ignore */ `${base}/data/kanji.ts`)
      const shop = await import(/* @vite-ignore */ `${base}/lib/shop.ts`)
      const date = await import(/* @vite-ignore */ `${base}/lib/date.ts`)
      const level = await import(/* @vite-ignore */ `${base}/lib/level.ts`)
      const today = date.dayKey()
      const all: string[] = kanji.KANJI.map((k: { char: string }) => k.char)
      const learned = p === 'rich' ? all : p === 'mid' ? all.slice(0, 12) : []
      const xp = p === 'rich' ? 40930 : p === 'mid' ? 700 : 0
      const lv = level.levelInfo(xp).level
      const review = await import(/* @vite-ignore */ `${base}/lib/review.ts`)
      const reviews = p === 'rich' ? Object.fromEntries(all.slice(0, 24).map((c, i) => [c, { ...review.scheduleNew(date.addDays(today, -4)), step: i % 5 }])) : {}
      const misses = p === 'rich' ? Object.fromEntries(all.slice(0, 8).map((c, i) => [c, 1 + (i % 3)])) : {}
      const answerLib = await import(/* @vite-ignore */ `${base}/lib/answerLog.ts`)
      let book = answerLib.EMPTY_BOOK
      const learnedOn: Record<string, string> = {}
      const playMinutes: Record<string, number> = {}
      if (p === 'rich') {
        for (let d = 20; d >= 0; d -= 1) {
          const day = date.addDays(today, -d)
          playMinutes[day] = 10 + ((d * 7) % 25)
          const chars = all.slice(d * 3, d * 3 + 5)
          for (const c of chars) learnedOn[c] = learnedOn[c] ?? day
          book = answerLib.logAnswers(book, d % 2 ? 'review' : 'learn', chars.map((char, i) => ({ char, kind: i % 2 ? 'blind' : 'model', ok: (d + i) % 4 !== 0, hint: i % 3 })), day, { stamps: {}, reviews: {}, learnedOn })
        }
      }
      const stamps = Object.fromEntries(learned.map((c) => [c, 7]))
      const owned = p === 'rich' ? shop.SHOP_ITEMS.map((i: { id: string }) => i.id) : undefined
      progress.useProgress.setState({
        ...(p === 'fresh' ? {} : { learned, stamps, xp, reviews, misses, learnedOn, playMinutes, ...book }),
        ...(p === 'rich' ? { coins: 99999, owned, streak: { count: 365, lastDay: modals ? date.addDays(today, -1) : today } } : p === 'mid' ? { coins: 420, streak: { count: 3, lastDay: today } } : {}),
        seenLevel: modals ? lv - 1 : lv,
        loginBonus: modals ? null : { day: today, streakDay: 1, coins: 0, claimed: true },
        settings: { ...progress.useProgress.getState().settings, sound: false, speech: false, music: false },
      })
      if (!intro) progress.useProgress.getState().skipIntro()
    },
    { preset, modals: options.modals ?? false, intro: options.intro ?? false },
  )
}

export { skipIntro }
