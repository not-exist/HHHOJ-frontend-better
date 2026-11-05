import { defineConfig, devices } from '@playwright/test'

/**
 * The userscript itself is origin-agnostic once injected, but `?__mock=1` and the
 * takeover fixtures are served by the tiny node server in `e2e/server.mjs`.
 * Default port is 18080 (same as the local HHHOJ instance); `E2E_PORT` lets the
 * suite run on a spare port when 18080 is already taken by the real backend.
 */
const port = Number(process.env.E2E_PORT ?? 18080)
const origin = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  webServer: {
    command: 'node e2e/server.mjs',
    url: `${origin}/`,
    // 必须是本套 fixture，不能复用真实 HHHOJ（否则回退类用例会被误判）
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: String(port) },
  },

  use: {
    baseURL: origin,
    headless: true,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
