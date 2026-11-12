import { defineConfig } from '@playwright/test'

/**
 * オフライン(サービスワーカー)の確認。サービスワーカーは公開した版でしか入らないので、
 * ビルドしたもの(dist)を vite preview で出して試す。  npm run e2e:pwa
 */
const PORT = 5186

export default defineConfig({
  testDir: './e2e-pwa',
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
