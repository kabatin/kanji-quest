import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { precachePlugin } from './scripts/precache-plugin.ts'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  // 設定画面に出すバージョン(package.json の version)
  define: { __APP_VERSION__: JSON.stringify(version) },
  // どのフォルダに置いても動くよう、ファイルの場所は index.html からの相対で書き出す
  // (レンタルサーバーの https://example.com/kanji/ のような場所にも そのまま置ける)
  base: './',
  // precachePlugin: オフラインで使うための ファイルの一覧(dist/precache.json)を書き出す
  plugins: [react(), precachePlugin(fileURLToPath(new URL('./public', import.meta.url)))],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // islandScene.ts は WebGL で描く部分で、テストの環境(jsdom)では動かせない。画面の確認は Playwright で行う
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.test.{ts,tsx}', 'src/vite-env.d.ts', 'src/features/home/scene/islandScene.ts'],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
    },
  },
})
