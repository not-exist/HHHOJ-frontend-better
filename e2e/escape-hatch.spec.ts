import { expect, test } from '@playwright/test'
import { expectNativeFallback, installUserscript, waitForTakeover } from './helpers'

test('?native=1 switches to the native site and ?takeover=1 restores the takeover', async ({ page }) => {
  await installUserscript(page)

  // First: pin native mode. The flag is persisted in GM storage (localStorage in
  // this harness), the parameter is stripped, and the page reloads as HHHOJ.
  await page.goto('/?native=1')
  await expect(page).toHaveURL(/\/$/)
  await expectNativeFallback(page)

  // Second: clear the flag and reload; the takeover mounts again.
  await page.goto('/?takeover=1')
  await expect(page).toHaveURL(/\/$/)
  await waitForTakeover(page)

  await expect(page.locator('#root')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'main' })).toBeVisible()
})
