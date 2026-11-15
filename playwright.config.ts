import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 5184)

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 横向きタブレットを基準にする
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
  },
})
