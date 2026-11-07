import path from 'node:path'
import { expect, type Page } from '@playwright/test'

/** Built userscript; re-run `pnpm exec vite build` after touching src/. */
export const USERSCRIPT_PATH = path.resolve('dist/hhhoj-twilight.user.js')

export interface InstallUserscriptOptions {
  /** Keys seeded into localStorage before the page boots (values are JSON encoded). */
  localStorage?: Record<string, unknown>
}

/**
 * Installs the built userscript plus the GM_* globals it expects.
 *
 * Order matters: the bundle captures GM_getValue/GM_setValue/GM_registerMenuCommand
 * once at module-init time, so the stubs must be registered first. They are backed
 * by localStorage so values survive the reloads used by the escape hatch.
 */
export async function installUserscript(page: Page, opts: InstallUserscriptOptions = {}): Promise<void> {
  await page.addInitScript(() => {
    const gm = window as unknown as {
      GM_getValue?: (key: string, fallback?: unknown) => unknown
      GM_setValue?: (key: string, value: unknown) => void
      GM_registerMenuCommand?: (name: string, fn: () => void) => void
      unsafeWindow?: Window
    }

    gm.GM_getValue = (key: string, fallback?: unknown) => {
      try {
        const raw = localStorage.getItem(`gm:${key}`)
        return raw === null ? fallback : (JSON.parse(raw) as unknown)
      } catch {
        return fallback
      }
    }
    gm.GM_setValue = (key: string, value: unknown) => {
      try {
        localStorage.setItem(`gm:${key}`, JSON.stringify(value))
      } catch {
        /* ignore */
      }
    }
    // Records the commands so specs can assert which mode switch is reachable
    // from the userscript menu (the only entry point on native pages).
    const menu: { name: string; fn: () => void }[] = []
    ;(window as unknown as { __tojMenu?: typeof menu }).__tojMenu = menu
    gm.GM_registerMenuCommand = (name: string, fn: () => void) => {
      menu.push({ name, fn })
    }
    gm.unsafeWindow = window
  })

  if (opts.localStorage) {
    await seedLocalStorage(page, opts.localStorage)
  }

  await page.addInitScript({ path: USERSCRIPT_PATH })
}

/** Seeds localStorage before the document runs; used for mock login and persisted UI prefs. */
export async function seedLocalStorage(page: Page, entries: Record<string, unknown>): Promise<void> {
  await page.addInitScript((data: Record<string, unknown>) => {
    try {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch {
      /* opaque origins (about:blank) have no localStorage */
    }
  }, entries)
}

/** Mock API session: `mockApi.auth.me()` reads `toj.demo-user` from localStorage. */
export async function loginAsMockUser(page: Page, username: string): Promise<void> {
  await seedLocalStorage(page, { 'toj.demo-user': username })
}

/** Waits for the takeover shell and for React to mount something into it. */
export async function waitForTakeover(page: Page): Promise<void> {
  const root = page.locator('#twilight-root')
  await expect(root).toBeVisible()
  await expect(root.locator(':scope > *')).not.toHaveCount(0)
}

/** Asserts the original HHHOJ shell rendered and the takeover stayed away. */
export async function expectNativeFallback(page: Page): Promise<void> {
  await expect(page.locator('#root')).toHaveText('NATIVE SITE')
  await expect(page.locator('#twilight-root')).toHaveCount(0)
}

export interface ApiFixture {
  status?: number
  body: unknown
}

export type ApiFixtureValue = ApiFixture | ((url: URL) => ApiFixture)

export type ApiFixtures = Record<string, ApiFixtureValue>

/**
 * Stubs every `/api/**` request. Paths missing from the fixture map answer with
 * 501 `{success:false, code:'test.no_api'}` so a forgotten stub surfaces as a
 * visible error state instead of hitting the real HHHOJ backend.
 */
export async function installApiFixtures(page: Page, fixtures: ApiFixtures): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const entry = fixtures[url.pathname]

    if (!entry) {
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          code: 'test.no_api',
          message: `no fixture for ${url.pathname}`,
        }),
      })
      return
    }

    const fixture = typeof entry === 'function' ? entry(url) : entry
    await route.fulfill({
      status: fixture.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.body),
    })
  })
}
