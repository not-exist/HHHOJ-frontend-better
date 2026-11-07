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

test('native mode keeps the userscript menu command that restores the takeover', async ({ page }) => {
  await installUserscript(page)
  await page.goto('/?native=1')
  await expectNativeFallback(page)

  // The page is HHHOJ now, so the userscript menu is the only discoverable way back.
  const names = await page.evaluate(
    () => ((window as unknown as { __tojMenu?: { name: string }[] }).__tojMenu ?? []).map((cmd) => cmd.name),
  )
  expect(names).toEqual(['重新启用 TwilightOJ 接管'])

  // Clicking it reloads into takeover mode. The reload kills the evaluate call itself.
  await page
    .evaluate(() => {
      const menu = (window as unknown as { __tojMenu?: { name: string; fn: () => void }[] }).__tojMenu ?? []
      menu[0]?.fn()
    })
    .catch(() => {})

  await waitForTakeover(page)
  await expect(page.getByRole('navigation', { name: 'main' })).toBeVisible()
})
