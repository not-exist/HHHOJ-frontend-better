import { expect, test } from '@playwright/test'
import { installApiFixtures, installUserscript, waitForTakeover, type ApiFixtures } from './helpers'

/**
 * Real-API mode: no `?__mock=1`. Every /api request is answered with an envelope
 * shaped like the HHHOJ backend (docs/api-mapping.md) and mapped by src/services/api/real.ts.
 */

const ME = {
  success: true,
  user: {
    username: 'FixtureUser',
    usergroup: 1,
    rating: 2100,
    unread_messages: 0,
    unread_system_messages: 0,
    groups: [],
    card: null,
  },
}

const CARDS = {
  success: true,
  cards: {
    FixtureUser: {
      username: 'FixtureUser',
      rating: 2100,
      rank_percent: 0.1,
      is_superuser: false,
      avatar_hash: '',
    },
    OtherUser: {
      username: 'OtherUser',
      rating: 1750,
      rank_percent: 0.5,
      is_superuser: false,
      avatar_hash: '',
    },
  },
}

const EMPTY_CONTESTS = {
  success: true,
  active: { items: [], total: 0 },
  finished: { items: [], total: 0 },
  countdown: null,
}

const HOME = {
  success: true,
  announcements: [
    {
      id: 1,
      poster: 'admin',
      title: 'Fixture Announcement One',
      post_time: '2026-10-24 10:00:00',
      zan: 0,
      level: 1,
    },
  ],
  user_ranklist: [
    { rank: 1, username: 'FixtureUser', realname: 'Fixture School', motto: 'Hello', rating: 2100 },
  ],
  problem_ranklist: [
    { rank: 1, username: 'FixtureUser', realname: 'Fixture School', motto: 'Hello', ac_num: 42 },
  ],
}

const PROBLEMS = {
  success: true,
  total: 2,
  items: [
    {
      id: 7001,
      title: 'Fixture Alpha',
      ac_num: 70,
      submit_num: 100,
      zan: 0,
      tags: ['math'],
      my_best_ac_submission_id: null,
    },
    {
      id: 7002,
      title: 'Fixture Beta',
      ac_num: 40,
      submit_num: 100,
      zan: 0,
      tags: ['dp'],
      my_best_ac_submission_id: null,
    },
  ],
}

const EMPTY_SUBMISSIONS = { success: true, items: [], total: 0 }

const SUBMISSIONS = {
  success: true,
  total: 2,
  items: [
    {
      id: 9001,
      problem_id: 7001,
      problem_title: 'Fixture Alpha',
      contest_id: null,
      submitter: 'FixtureUser',
      status: 'Judged',
      status_details: '',
      result_error: null,
      score: 100,
      language: 'C++17',
      used_time: 123,
      used_memory: 3012,
      tot_size: 2048,
      submit_time: '2026-10-24 10:00:00',
      judge_time: '2026-10-24 10:00:02',
      hack_of: null,
      hack_success: null,
    },
    {
      id: 9002,
      problem_id: 7002,
      problem_title: 'Fixture Beta',
      contest_id: null,
      submitter: 'OtherUser',
      status: 'Judged',
      status_details: '',
      result_error: null,
      score: 0,
      language: 'C++17',
      used_time: 250,
      used_memory: 1024,
      tot_size: 1024,
      submit_time: '2026-10-24 09:00:00',
      judge_time: '2026-10-24 09:00:02',
      hack_of: null,
      hack_success: null,
    },
  ],
}

test.describe('real API mode with fixture envelopes', () => {
  test('home shows the announcement and ranklist returned by /api/home', async ({ page }) => {
    await installUserscript(page)
    await installApiFixtures(page, {
      '/api/auth/me': { body: ME },
      '/api/home': { body: HOME },
      '/api/contests': { body: EMPTY_CONTESTS },
      '/api/users/cards': { body: CARDS },
    } satisfies ApiFixtures)

    await page.goto('/')
    await waitForTakeover(page)

    await expect(page.getByText('Fixture Announcement One')).toBeVisible()
    await expect(page.getByRole('link', { name: /FixtureUser/ }).first()).toBeVisible()
    await expect(page.getByText('Fixture School').first()).toBeVisible()
  })

  test('problems page maps titles and estimates difficulty from ac/submit', async ({ page }) => {
    await installUserscript(page)
    await installApiFixtures(page, {
      '/api/auth/me': { body: ME },
      '/api/problems': { body: PROBLEMS },
      '/api/submissions': { body: EMPTY_SUBMISSIONS },
      '/api/users/cards': { body: CARDS },
    } satisfies ApiFixtures)

    await page.goto('/problems')
    await waitForTakeover(page)

    await expect(page.getByRole('cell', { name: 'Fixture Alpha', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Fixture Beta', exact: true })).toBeVisible()

    // 40 / 100 = 40% -> difficulty 2 ("中等") by estimateDifficulty().
    const betaRow = page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: 'Fixture Beta', exact: true }) })
    await expect(betaRow.locator('.diff-tag')).toHaveText('中等')
    await expect(betaRow.getByText('40%')).toBeVisible()
  })

  test('submissions page maps verdicts and converts used_memory KB to MB', async ({ page }) => {
    await installUserscript(page)
    await installApiFixtures(page, {
      '/api/auth/me': { body: ME },
      '/api/submissions': { body: SUBMISSIONS },
      '/api/users/cards': { body: CARDS },
    } satisfies ApiFixtures)

    await page.goto('/submissions')
    await waitForTakeover(page)

    const table = page.locator('table.status-tbl')
    await expect(table.getByText('Accepted', { exact: true })).toBeVisible()
    await expect(table.getByText('Wrong Answer', { exact: true })).toBeVisible()

    // 3012 KB / 1024 = 2.9414 MB, rounded to one decimal by mapSubmission().
    await expect(table.getByRole('cell', { name: '2.9 MB', exact: true })).toBeVisible()
    await expect(table.getByRole('cell', { name: '123 ms', exact: true })).toBeVisible()
  })
})
