import { expect, test } from '@playwright/test'
import { expectNativeFallback, installUserscript } from './helpers'

/**
 * Routes outside TAKEOVER_ROUTES must be left completely alone: the script exits
 * at document-start, so HHHOJ's own shell keeps rendering into #root.
 */
for (const route of ['/faq', '/contest/1/problem/2']) {
  test(`${route} falls back to the native site`, async ({ page }) => {
    await installUserscript(page)
    await page.goto(route)

    await expectNativeFallback(page)
    await expect(page.locator('#root')).toHaveText('NATIVE SITE')
    await expect(page.locator('#twilight-root')).toHaveCount(0)
  })
}
