import { expect, test } from '@playwright/test'
import { installUserscript, waitForTakeover } from './helpers'

test.describe('mock data mode (?__mock=1)', () => {
  test('home mounts the takeover UI and hides the original #root', async ({ page }) => {
    await installUserscript(page)
    await page.goto('/?__mock=1')
    await waitForTakeover(page)

    // The original shell must be gone: the script removed #root and neutralises
    // document.getElementById('root').
    await expect(page.locator('#root')).toHaveCount(0)
    await expect(page.getByText('NATIVE SITE')).toHaveCount(0)

    const nav = page.getByRole('navigation', { name: 'main' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: '首页' })).toBeVisible()
    await expect(nav.getByRole('link', { name: '题库' })).toBeVisible()

    // Data comes from src/mock/news.ts via mockApi.home().
    await expect(page.getByText('欢迎来到 TwilightOJ！新功能：实时主题色自定义')).toBeVisible()
    await expect(page.getByText('Nebula').first()).toBeVisible()
  })

  test('problems page lists mock problem rows', async ({ page }) => {
    await installUserscript(page, { localStorage: { 'toj.demo-user': 'Nebula' } })
    await page.goto('/problems?__mock=1')
    await waitForTakeover(page)

    await expect(page.getByRole('heading', { name: '题库' })).toBeVisible()

    const firstRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: 'A + B 问题', exact: true }) })
    await expect(firstRow).toBeVisible()
    await expect(firstRow.locator('.diff-tag')).toHaveText('入门')

    await expect(page.getByRole('cell', { name: '区间和查询', exact: true })).toBeVisible()
  })

  test('user profile renders the SVG rating chart', async ({ page }) => {
    await installUserscript(page, { localStorage: { 'toj.demo-user': 'Nebula' } })
    await page.goto('/user/profile/Nebula?__mock=1')
    await waitForTakeover(page)

    await expect(page.getByRole('heading', { name: /Nebula/ })).toBeVisible()

    const chart = page.locator('svg[aria-label="Rating history"]')
    await expect(chart).toBeVisible()
    // One polyline per flot shadow + the main line.
    await expect(chart.locator('polyline')).toHaveCount(3)
    await expect(chart.locator('circle').first()).toBeVisible()
  })
})
