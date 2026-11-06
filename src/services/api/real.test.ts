import { describe, it, expect, vi, afterEach } from 'vitest'
import { realApi } from './real'

afterEach(() => {
  vi.unstubAllGlobals()
})

function ok(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ success: true, ...payload }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubRoutes(handle: (url: URL) => Response) {
  const calls: string[] = []
  const mock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const raw = String(input)
    calls.push(raw)
    return handle(new URL(raw, 'http://localhost'))
  })
  vi.stubGlobal('fetch', mock)
  return { mock, calls }
}

function problemItem(id: number, ac: number, submit: number, extra: Record<string, unknown> = {}) {
  return {
    id,
    title: `Problem ${id}`,
    ac_num: ac,
    submit_num: submit,
    zan: 0,
    my_best_ac_submission_id: null,
    ...extra,
  }
}

function rawSubmission(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    problem_id: 1,
    problem_title: 'A + B',
    contest_id: null,
    submitter: 'alice',
    status: 'Judged',
    status_details: '',
    result_error: null,
    score: 100,
    language: 'C++17',
    used_time: 123,
    used_memory: 3012,
    tot_size: 3584,
    submit_time: '2024-01-02 03:04:05',
    judge_time: '2024-01-02 04:05:06',
    hack_of: null,
    hack_success: null,
    ...overrides,
  }
}

describe('realApi.problems', () => {
  it('fetches every 100-item page and maps all problems', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => problemItem(i + 1, 1, 2))
    const page2 = Array.from({ length: 50 }, (_, i) => problemItem(101 + i, 1, 2))

    const { calls } = stubRoutes((url) => {
      const page = url.searchParams.get('page')
      if (page === '1') return ok({ items: page1, total: 150 })
      if (page === '2') return ok({ items: page2, total: 150 })
      throw new Error(`unexpected page ${page}`)
    })

    const problems = await realApi.problems()

    expect(calls).toHaveLength(2)
    const first = new URL(calls[0], 'http://localhost')
    const second = new URL(calls[1], 'http://localhost')
    expect(first.pathname).toBe('/api/problems')
    expect(first.searchParams.get('page')).toBe('1')
    expect(first.searchParams.get('size')).toBe('100')
    expect(second.searchParams.get('page')).toBe('2')
    expect(second.searchParams.get('size')).toBe('100')

    expect(problems).toHaveLength(150)
    expect(problems[0]).toMatchObject({ id: 1, title: 'Problem 1', solved: 1, submissions: 2 })
    expect(problems[99].id).toBe(100)
    expect(problems[100].id).toBe(101)
    expect(problems[149].id).toBe(150)
    expect(problems[0].countsKnown).toBe(true)
  })

  it('passes through my_best_ac_submission_id and defaults missing tags to []', async () => {
    const items = [
      problemItem(1, 1, 2, { my_best_ac_submission_id: 42 }),
      problemItem(2, 1, 2, { tags: ['dp', 'graph'], my_best_ac_submission_id: null }),
    ]
    stubRoutes(() => ok({ items, total: 2 }))

    const problems = await realApi.problems()

    expect(problems[0].myBestAcSubmissionId).toBe(42)
    expect(problems[0].tags).toEqual([])
    expect(problems[1].tags).toEqual(['dp', 'graph'])
  })
})

describe('realApi.problem', () => {
  function detail(overrides: Record<string, unknown> = {}) {
    return {
      problem: { id: 9, title: 'Sum', zan: 3, my_zan: 0, tags: ['math'] },
      statement_html: '<p>statement</p>',
      statement_pdf: '',
      limits: { time: 1.234, memory: 256 },
      submission_requirement: [
        { name: 'answer', type: 'source code', file_name: 'answer.code', languages: ['C++17'] },
      ],
      custom_test_requirement: [],
      can_submit: true,
      prev_problem_id: 8,
      next_problem_id: 10,
      contest: { id: 3, title: 'Weekly' },
      rank: 1,
      using_contests: [],
      can_write: false,
      ...overrides,
    }
  }

  it('maps limits, navigation, contest and submit capability', async () => {
    const { calls } = stubRoutes(() => ok(detail()))

    const problem = await realApi.problem(9)

    expect(calls[0]).toBe('/api/problems/9')
    expect(problem).toMatchObject({
      id: 9,
      title: 'Sum',
      statementHtml: '<p>statement</p>',
      timeLimitMs: 1234,
      memoryLimitMb: 256,
      canSubmit: true,
      prevProblemId: 8,
      nextProblemId: 10,
      contestId: 3,
      contestTitle: 'Weekly',
      countsKnown: false,
    })
    expect(problem?.tags).toEqual(['math'])
    expect(problem?.submissionRequirement).toEqual([
      { name: 'answer', type: 'source code', file_name: 'answer.code', languages: ['C++17'] },
    ])
  })

  it('passes contest_id as a query parameter', async () => {
    const { calls } = stubRoutes(() => ok(detail()))

    await realApi.problem(9, 5)

    const url = new URL(calls[0], 'http://localhost')
    expect(url.pathname).toBe('/api/problems/9')
    expect(url.searchParams.get('contest_id')).toBe('5')
  })

  it('maps null limits and a null contest to zeros', async () => {
    stubRoutes(() => ok(detail({ limits: null, contest: null })))

    const problem = await realApi.problem(9)

    expect(problem?.timeLimitMs).toBe(0)
    expect(problem?.memoryLimitMb).toBe(0)
    expect(problem?.contestId).toBeNull()
    expect(problem?.contestTitle).toBeNull()
  })
})

describe('realApi.submissions', () => {
  it('maps verdicts and units', async () => {
    const items = [
      rawSubmission(1, { status: 'Waiting', score: null }),
      rawSubmission(2, { status: 'Judging' }),
      rawSubmission(3, { status: 'Judged, Waiting' }),
      rawSubmission(4, { status: 'Judged', result_error: 'Compile Error' }),
      rawSubmission(5, { status: 'Judged', result_error: 'Runtime Error' }),
      rawSubmission(6, { status: 'Judged', result_error: null, score: null }),
      rawSubmission(7, { status: 'Judged', score: 100 }),
      rawSubmission(8, { status: 'Judged', score: 50 }),
    ]
    stubRoutes(() => ok({ items, total: 8 }))

    const page = await realApi.submissions()

    expect(page.total).toBe(8)
    expect(page.items.map((s) => s.verdict)).toEqual([
      'Pending',
      'Judging',
      'Judging',
      'CompileError',
      'RuntimeError',
      'CompileError',
      'Accepted',
      'WrongAnswer',
    ])
  })

  it('maps time, memory, code size, submit time and score', async () => {
    stubRoutes(() => ok({ items: [rawSubmission(7)], total: 1 }))

    const [submission] = (await realApi.submissions()).items

    expect(submission).toMatchObject({
      id: 7,
      problemId: 1,
      problemTitle: 'A + B',
      userName: 'alice',
      language: 'C++17',
      verdict: 'Accepted',
      timeMs: 123,
      memoryMb: 2.9,
      codeSizeKb: 3.5,
      submittedAt: Date.UTC(2024, 0, 1, 19, 4, 5),
      score: 100,
      statusText: 'Judged',
      judgeTime: '2024-01-02 04:05:06',
      judgeTimeAt: Date.UTC(2024, 0, 1, 20, 5, 6),
      contestId: undefined,
    })
  })

  it('leaves time and memory null until the submission is judged', async () => {
    const items = [
      rawSubmission(1, { status: 'Waiting', score: null }),
      rawSubmission(2, { status: 'Judging', score: null }),
    ]
    stubRoutes(() => ok({ items, total: 2 }))

    const page = await realApi.submissions()

    for (const item of page.items) {
      expect(item.timeMs).toBeNull()
      expect(item.memoryMb).toBeNull()
    }
    expect(page.items[0].score).toBe(0)
  })

  it('forwards list filters as query parameters', async () => {
    const { calls } = stubRoutes(() => ok({ items: [], total: 0 }))

    await realApi.submissions({
      page: 2,
      size: 20,
      problemId: 7,
      submitter: 'alice',
      language: 'C++',
      status: 'Waiting',
    })

    const url = new URL(calls[0], 'http://localhost')
    expect(url.pathname).toBe('/api/submissions')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('size')).toBe('20')
    expect(url.searchParams.get('problem_id')).toBe('7')
    expect(url.searchParams.get('submitter')).toBe('alice')
    expect(url.searchParams.get('language')).toBe('C++')
    expect(url.searchParams.get('status')).toBe('Waiting')
  })
})

describe('realApi.userCards', () => {
  it('requests /api/users/cards with a comma-joined name list and maps cards', async () => {
    const { calls } = stubRoutes(() =>
      ok({
        cards: {
          a: {
            username: 'a',
            rating: 1500,
            rank_percent: 0.25,
            is_superuser: false,
            avatar_hash: 'hash-a',
            badge: { text: 'Admin', color: '#fff', text_color: '#000' },
          },
          b: {
            username: 'b',
            rating: 2400,
            rank_percent: 0,
            is_superuser: true,
            avatar_hash: 'hash-b',
          },
        },
      }),
    )

    const cards = await realApi.userCards(['a', 'b'])

    const url = new URL(calls[0], 'http://localhost')
    expect(url.pathname).toBe('/api/users/cards')
    expect(url.searchParams.get('names')).toBe('a,b')

    expect(cards.a).toEqual({
      username: 'a',
      rating: 1500,
      rankPercent: 0.25,
      isSuperuser: false,
      avatarHash: 'hash-a',
      badge: { text: 'Admin', color: '#fff', textColor: '#000' },
    })
    expect(cards.b).toMatchObject({
      username: 'b',
      rating: 2400,
      rankPercent: 0,
      isSuperuser: true,
      avatarHash: 'hash-b',
    })
    expect(cards.b.badge).toBeUndefined()
  })

  it('returns an empty object without a request when given no names', async () => {
    const { mock } = stubRoutes(() => ok({ cards: {} }))

    await expect(realApi.userCards([])).resolves.toEqual({})
    expect(mock).not.toHaveBeenCalled()
  })
})

describe('realApi.home', () => {
  it('maps announcements and both ranklists', async () => {
    const { calls } = stubRoutes(() =>
      ok({
        announcements: [
          { id: 1, poster: 'admin', title: 'Pinned', post_time: '2024-01-02 03:04:05', zan: 5, level: 2 },
          { id: 2, poster: 'alice', title: 'Normal', post_time: '2024-02-03 00:00:00', zan: 1, level: 0 },
        ],
        user_ranklist: [
          { rank: 1, username: 'alice', realname: 'Alice', motto: 'hi', rating: 2500 },
          { rank: 2, username: 'bob', realname: 'Bob', motto: 'yo', rating: 2000 },
        ],
        problem_ranklist: [
          { rank: 1, username: 'carol', realname: 'Carol', motto: 'go', ac_num: 120 },
        ],
      }),
    )

    const home = await realApi.home()

    expect(calls[0]).toBe('/api/home')
    expect(home.announcements).toEqual([
      { id: 1, title: 'Pinned', titleEn: 'Pinned', date: '2024-01-02', pinned: true, poster: 'admin' },
      { id: 2, title: 'Normal', titleEn: 'Normal', date: '2024-02-03', pinned: false, poster: 'alice' },
    ])
    expect(home.userRanklist).toEqual([
      { rank: 1, username: 'alice', realname: 'Alice', motto: 'hi', rating: 2500 },
      { rank: 2, username: 'bob', realname: 'Bob', motto: 'yo', rating: 2000 },
    ])
    expect(home.problemRanklist).toEqual([
      { rank: 1, username: 'carol', realname: 'Carol', motto: 'go', acNum: 120 },
    ])
  })
})
