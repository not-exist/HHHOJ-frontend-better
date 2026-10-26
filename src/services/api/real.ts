import type {
  Announcement,
  Comment,
  Contest,
  ContestPhase,
  ContestRule,
  Difficulty,
  HomeData,
  OJUser,
  Problem,
  RanklistRow,
  StandingsRow,
  Submission,
  TestcaseResult,
  Thread,
  UserRole,
  Verdict,
} from '@/types'
import { get, post, postForm, timeValue } from './http'
import { hashPassword } from '../md5'
import type {
  ApiClient,
  ContestDetailData,
  CreateSubmissionInput,
  RegisterInput,
  SessionUser,
  SubmissionListParams,
  SubmissionPage,
  SubmissionStatus,
  UserProfileData,
  ZanResult,
} from './types'

/* ------------------------------------------------------------------ *
 * 原始响应类型（对照 server/include 与 server/src 的 JSON 输出）
 * ------------------------------------------------------------------ */

interface RawProblemListItem {
  id: number
  title: string
  ac_num: number
  submit_num: number
  zan: number
  tags: string[]
  my_best_ac_submission_id: number | null
}

interface RawProblemList {
  items: RawProblemListItem[]
  total: number
}

interface RawRequirement {
  name: string
  type: 'source code' | 'text'
  file_name: string
  languages?: string[]
  size?: number
  label?: string
}

interface RawProblemDetail {
  problem: { id: number; title: string; zan: number; my_zan: number; tags: string[] }
  statement_html: string
  statement_pdf: string
  limits: { time: number | null; memory: number | null }
  submission_requirement: RawRequirement[]
  custom_test_requirement: RawRequirement[]
  can_submit: boolean
  prev_problem_id: number
  next_problem_id: number
  contest: { id: number; title: string } | null
  rank: number | null
  using_contests: { id: number; title: string; rank: number }[]
  can_write: boolean
}

interface RawSubmission {
  id: number
  problem_id: number
  problem_title: string
  contest_id: number | null
  contest_title?: string
  contest_rank?: number
  submitter: string
  status: string
  status_details: string
  result_error: string | null
  score: number | null
  language: string
  used_time: number
  used_memory: number
  tot_size: number
  submit_time: string
  judge_time: string | null
  hack_of: number | null
  hack_success: boolean | null
}

interface RawSubmissionList {
  items: RawSubmission[]
  total: number
}

interface RawContentItem {
  type: 'source code' | 'text'
  name: string
  file_name: string
  language?: string
  content: string
}

interface RawSubmissionDetail {
  submission: RawSubmission
  problem: { id: number; title: string }
  content: RawContentItem[] | null
  details: string | null
  final_result_details: string | null
}

interface RawContestItem {
  id: number
  name: string
  start_time: string
  end_time: string
  last_min: number
  cur_progress: 'not_started' | 'in_progress' | 'pending_publish' | 'finished'
  player_num: number
  contest_type: string
  zan: number
  my_zan: number
  has_registered: boolean
}

interface RawContestList {
  active: { items: RawContestItem[]; total: number }
  finished: { items: RawContestItem[]; total: number }
  countdown: unknown
}

interface RawContestObject {
  id: number
  name: string
  start_time: string
  end_time: string
  last_min: number
  cur_progress: 'not_started' | 'in_progress' | 'pending_publish' | 'finished'
  contest_type: string
  rated: { enabled: boolean; forced: boolean }
  zan: number
  my_zan: number
  registered: boolean
  viewer: { regular_manage: boolean; admin: boolean }
  links: unknown[]
}

interface RawDashboard {
  contest: RawContestObject
  description_html: string
  problems: { id: number; pos: number; title: string; my_ac_submission_id: number | null }[]
  notices: { id: number; title: string; content: string; time: string }[]
  can_ask: boolean
}

interface RawStandings {
  contest: RawContestObject
  problems: { pos: number; problem_id: number; title: string }[]
  rows: {
    rank: number
    username: string
    realname: string
    total_score: number
    total_time: number
    total_memory?: number
    cells: {
      pos: number
      score: number
      raw_score: number
      time: number
      submission_id: number
      memory?: number
      waiting?: boolean
    }[]
  }[]
}

interface RawBlogPoster {
  username: string
  rating: number
  rank_percent: number
  is_superuser: boolean
  avatar_hash: string
}

interface RawComment {
  id: number
  poster: RawBlogPoster
  content: string
  post_time: string
  zan: number
  my_zan: number
  replies: RawComment[]
}

interface RawBlog {
  id: number
  type: 'B' | 'S'
  poster: string
  title: string
  content_html: string
  post_time: string
  zan: number
  is_hidden: boolean
  tags: string[]
}

interface RawBlogDetail {
  blog: RawBlog
  my_zan: number
  comments: { items: RawComment[]; total: number }
}

interface RawBlogList {
  items: { id: number; poster: string; title: string; post_time: string; zan: number; is_hidden?: boolean }[]
  total: number
  tags?: string[]
}

interface RawAnnouncement {
  id: number
  poster: string
  title: string
  post_time: string
  zan: number
  level: number
}

interface RawHome {
  announcements: RawAnnouncement[]
  user_ranklist: RawRank[]
  problem_ranklist: RawRank[]
}

interface RawRank {
  rank: number
  username: string
  realname: string
  motto: string
  rating?: number
  ac_num?: number
}

interface RawRankList {
  items: RawRank[]
  total: number
}

interface RawProfile {
  user: {
    username: string
    email: string
    qq: string
    sex: string
    motto: string
    realname: string
    rating: number
    avatar_hash: string
  }
  groups: { name: string; note: string }[]
  ac_problems: number[]
  rating_history: { contest_id: number; name: string; start_time: string; rank: number; rating: number; delta: number }[]
  register_time?: string
}

interface RawMe {
  user: {
    username: string
    usergroup: number
    rating: number
    unread_messages: number
    unread_system_messages: number
    groups: { name: string; note?: string }[]
    card: RawBlogPoster | null
  } | null
}

interface RawBatch {
  items: { id: number; title: string }[]
}

/* ------------------------------------------------------------------ *
 * 字段映射
 * ------------------------------------------------------------------ */

const ROLE_BY_LEVEL: Record<number, UserRole> = {
  0: 'pending',
  1: 'user',
  2: 'admin',
  3: 'teacher',
  4: 'developer',
}

function mapRole(level: number): UserRole {
  return ROLE_BY_LEVEL[level] ?? 'user'
}

/** HHHOJ 没有题目难度字段：用通过率估算，仅用于视觉分档 */
function estimateDifficulty(ac: number, submit: number): Difficulty {
  if (submit <= 0) return 0
  const rate = ac / submit
  if (rate >= 0.7) return 0
  if (rate >= 0.5) return 1
  if (rate >= 0.3) return 2
  if (rate >= 0.15) return 3
  if (rate >= 0.05) return 4
  return 5
}

function mapProblemListItem(p: RawProblemListItem): Problem {
  return {
    id: p.id,
    title: p.title,
    titleEn: p.title,
    difficulty: estimateDifficulty(p.ac_num, p.submit_num),
    tags: p.tags ?? [],
    solved: p.ac_num,
    submissions: p.submit_num,
    timeLimitMs: 0,
    memoryLimitMb: 0,
    background: '',
    backgroundEn: '',
    description: '',
    descriptionEn: '',
    inputFormat: '',
    inputFormatEn: '',
    outputFormat: '',
    outputFormatEn: '',
    samples: [],
    hint: '',
    hintEn: '',
    source: '',
    myBestAcSubmissionId: p.my_best_ac_submission_id,
    countsKnown: true,
    difficultyKnown: true,
  }
}

function mapProblemDetail(d: RawProblemDetail): Problem {
  const time = d.limits?.time
  const memory = d.limits?.memory
  const contestTitle = d.contest?.title ?? null
  return {
    id: d.problem.id,
    title: d.problem.title,
    titleEn: d.problem.title,
    difficulty: 0,
    tags: d.problem.tags ?? [],
    solved: 0,
    submissions: 0,
    timeLimitMs: time == null ? 0 : Math.round(time * 1000),
    memoryLimitMb: memory == null ? 0 : memory,
    background: '',
    backgroundEn: '',
    description: '',
    descriptionEn: '',
    inputFormat: '',
    inputFormatEn: '',
    outputFormat: '',
    outputFormatEn: '',
    samples: [],
    hint: '',
    hintEn: '',
    source: '',
    statementHtml: d.statement_html || '',
    statementPdf: d.statement_pdf || '',
    canSubmit: d.can_submit,
    prevProblemId: d.prev_problem_id,
    nextProblemId: d.next_problem_id,
    submissionRequirement: (d.submission_requirement ?? []).map((r) => ({ ...r })),
    contestId: d.contest?.id ?? null,
    contestTitle,
    countsKnown: false,
    difficultyKnown: false,
  }
}

function statusHead(status: string): string {
  return status.split(', ')[0]
}

function mapVerdict(raw: RawSubmission): Verdict {
  const head = statusHead(raw.status)
  if (head === 'Waiting') return 'Pending'
  if (head === 'Judging' || /, (Waiting|Judging)$/.test(raw.status)) return 'Judging'
  if (raw.result_error) return /compile/i.test(raw.result_error) ? 'CompileError' : 'RuntimeError'
  if (raw.score === null) return 'CompileError'
  if (raw.score >= 100) return 'Accepted'
  return 'WrongAnswer'
}

const VERDICT_BY_INFO: Record<string, Verdict> = {
  Accepted: 'Accepted',
  'Extra Test Passed': 'Accepted',
  'Wrong Answer': 'WrongAnswer',
  'Time Limit Exceeded': 'TimeLimitExceeded',
  'Memory Limit Exceeded': 'MemoryLimitExceeded',
  'Runtime Error': 'RuntimeError',
  'Compile Error': 'CompileError',
  'Judgement Failed': 'RuntimeError',
  'Invalid Interaction': 'WrongAnswer',
  'Acceptable Answer': 'WrongAnswer',
}

function verdictOfInfo(info: string): Verdict {
  return VERDICT_BY_INFO[info] ?? 'WrongAnswer'
}

function parseDetails(xml: string | null | undefined): TestcaseResult[] {
  if (!xml) return []
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) return []
  return Array.from(doc.getElementsByTagName('test')).map((el, i) => {
    const num = Number(el.getAttribute('num'))
    const info = el.getAttribute('info') ?? ''
    const memoryKb = Number(el.getAttribute('memory'))
    return {
      index: Number.isFinite(num) && num > 0 ? num : i + 1,
      verdict: verdictOfInfo(info),
      timeMs: Number(el.getAttribute('time')) || 0,
      memoryMb: Number.isFinite(memoryKb) && memoryKb > 0 ? Math.round(memoryKb / 1024) : 0,
      score: Number(el.getAttribute('score')) || 0,
    }
  })
}

function mapSubmission(raw: RawSubmission): Submission {
  return {
    id: raw.id,
    problemId: raw.problem_id,
    problemTitle: raw.problem_title,
    userName: raw.submitter,
    language: raw.language || '/',
    code: '',
    verdict: mapVerdict(raw),
    timeMs: raw.status === 'Judged' ? raw.used_time : null,
    memoryMb: raw.status === 'Judged' ? Math.round((raw.used_memory / 1024) * 10) / 10 : null,
    codeSizeKb: Math.round((raw.tot_size / 1024) * 10) / 10,
    submittedAt: timeValue(raw.submit_time),
    contestId: raw.contest_id ?? undefined,
    testcases: [],
    score: raw.score ?? 0,
    statusText: raw.status,
    judgeTime: raw.judge_time,
    judgeTimeAt: raw.judge_time ? timeValue(raw.judge_time) : null,
    codeUnavailable: true,
  }
}

function mapSubmissionDetail(d: RawSubmissionDetail): Submission {
  const base = mapSubmission(d.submission)
  const contents = d.content ?? []
  const sources = contents.filter((c) => c.type === 'source code')
  const code = sources.length > 0 ? sources.map((s) => s.content).join('\n\n') : contents.map((c) => c.content).join('\n\n')
  const language = sources[0]?.language ?? d.submission.language
  const testcases = parseDetails(d.details)
  const failed = testcases.find((t) => t.verdict !== 'Accepted')
  let verdict = base.verdict
  if (verdict !== 'Pending' && verdict !== 'Judging') {
    if (d.submission.result_error) verdict = /compile/i.test(d.submission.result_error) ? 'CompileError' : 'RuntimeError'
    else if (failed) verdict = failed.verdict
    else if (testcases.length > 0) verdict = 'Accepted'
  }
  return {
    ...base,
    code,
    language: language || base.language,
    testcases,
    verdict,
    codeUnavailable: d.content === null,
    detailsXml: d.details,
  }
}

function mapPhase(progress: RawContestItem['cur_progress']): ContestPhase {
  if (progress === 'in_progress') return 'running'
  if (progress === 'not_started') return 'upcoming'
  return 'finished'
}

function mapRule(type: string): ContestRule {
  return type === 'ACM' || type === 'IOI' ? type : 'OI'
}

function mapContestItem(c: RawContestItem): Contest {
  return {
    id: c.id,
    title: c.name,
    titleEn: c.name,
    rule: mapRule(c.contest_type),
    phase: mapPhase(c.cur_progress),
    startAt: timeValue(c.start_time),
    endAt: timeValue(c.end_time),
    description: '',
    descriptionEn: '',
    problems: [],
    participantCount: c.player_num,
    rated: false,
    announcements: [],
    lastMin: c.last_min,
    registered: c.has_registered,
    zan: c.zan,
    myZan: c.my_zan,
  }
}

function mapContestObject(c: RawContestObject): Contest {
  return {
    id: c.id,
    title: c.name,
    titleEn: c.name,
    rule: mapRule(c.contest_type),
    phase: mapPhase(c.cur_progress),
    startAt: timeValue(c.start_time),
    endAt: timeValue(c.end_time),
    description: '',
    descriptionEn: '',
    problems: [],
    participantCount: 0,
    rated: c.rated?.enabled === true,
    announcements: [],
    lastMin: c.last_min,
    registered: c.registered,
    zan: c.zan,
    myZan: c.my_zan,
  }
}

function mapStandings(raw: RawStandings, contest: Contest): StandingsRow[] {
  const problems = [...raw.problems].sort((a, b) => a.pos - b.pos)
  return raw.rows.map((r) => {
    const byPos = new Map(r.cells.map((c) => [c.pos, c]))
    const cells = problems.map((p) => {
      const cell = byPos.get(p.pos)
      if (!cell) {
        return { problemId: p.problem_id, attempts: 0, solvedAtMin: null, score: 0 }
      }
      const solved = cell.score > 0
      return {
        problemId: p.problem_id,
        attempts: solved ? 1 : 0,
        solvedAtMin: contest.rule === 'ACM' && solved ? Math.round(cell.time / 60) : null,
        score: cell.score,
        time: cell.time,
        waiting: cell.waiting,
      }
    })
    return {
      rank: r.rank,
      userName: r.username,
      realName: r.realname,
      solved: cells.filter((c) => c.score > 0).length,
      penaltyMinutes: Math.round((r.total_time ?? 0) / 60),
      score: r.total_score ?? 0,
      cells,
      totalScore: r.total_score ?? 0,
      totalTime: r.total_time ?? 0,
      totalMemory: r.total_memory,
    }
  })
}

function mapPoster(poster: RawBlogPoster | string): string {
  return typeof poster === 'string' ? poster : poster.username
}

function mapComment(c: RawComment): Comment {
  return {
    id: c.id,
    author: mapPoster(c.poster),
    content: c.content,
    createdAt: c.post_time,
    likes: c.zan,
    myZan: c.my_zan,
    replies: (c.replies ?? []).map(mapComment),
  }
}

function mapThreadListRow(b: RawBlogList['items'][number]): Thread {
  return {
    id: b.id,
    title: b.title,
    titleEn: b.title,
    node: 'share',
    author: b.poster,
    content: '',
    createdAt: b.post_time,
    views: 0,
    likes: b.zan,
    comments: [],
    commentCount: 0,
  }
}

function mapAnnouncement(a: RawAnnouncement): Announcement {
  return {
    id: a.id,
    title: a.title,
    titleEn: a.title,
    date: a.post_time.slice(0, 10),
    pinned: a.level > 0,
    poster: a.poster,
  }
}

function mapRank(r: RawRank): RanklistRow {
  return {
    rank: r.rank,
    username: r.username,
    realname: r.realname,
    motto: r.motto,
    rating: r.rating,
    acNum: r.ac_num,
  }
}

function mapSessionUser(me: RawMe): SessionUser | null {
  if (!me.user) return null
  return {
    username: me.user.username,
    usergroup: me.user.usergroup,
    role: mapRole(me.user.usergroup),
    rating: me.user.rating,
    unreadMessages: me.user.unread_messages,
    unreadSystemMessages: me.user.unread_system_messages,
    groups: me.user.groups,
  }
}

/* ------------------------------------------------------------------ *
 * 实现
 * ------------------------------------------------------------------ */

export const realApi: ApiClient = {
  isMock: false,

  async home(): Promise<HomeData> {
    const data = await get<RawHome>('/api/home')
    return {
      announcements: (data.announcements ?? []).map(mapAnnouncement),
      userRanklist: (data.user_ranklist ?? []).map(mapRank),
      problemRanklist: (data.problem_ranklist ?? []).map(mapRank),
    }
  },

  async announcements(): Promise<Announcement[]> {
    const data = await get<{ items: RawAnnouncement[]; total: number }>('/api/announcements', { page: 1, size: 100 })
    return (data.items ?? []).map(mapAnnouncement)
  },

  async problems(): Promise<Problem[]> {
    const first = await get<RawProblemList>('/api/problems', { page: 1, size: 100 })
    const pages = Math.ceil((first.total ?? 0) / 100)
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
        get<RawProblemList>('/api/problems', { page: i + 2, size: 100 }),
      ),
    )
    return [first, ...rest].flatMap((page) => page.items ?? []).map(mapProblemListItem)
  },

  async problem(id: number, contestId?: number): Promise<Problem | undefined> {
    const data = await get<RawProblemDetail>(`/api/problems/${id}`, { contest_id: contestId })
    return mapProblemDetail(data)
  },

  async contests(): Promise<Contest[]> {
    const data = await get<RawContestList>('/api/contests', { active_page: 1, finished_page: 1, size: 100 })
    return [...(data.active?.items ?? []), ...(data.finished?.items ?? [])].map(mapContestItem)
  },

  async contest(id: number): Promise<ContestDetailData> {
    const dashboard = await get<RawDashboard>(`/api/contests/${id}/dashboard`, { page: 1 })
    const contest = mapContestObject(dashboard.contest)
    const problems = (dashboard.problems ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      pos: p.pos,
      myAcSubmissionId: p.my_ac_submission_id,
    }))
    contest.problems = problems.map((p) => p.id)
    contest.problemTitles = Object.fromEntries(problems.map((p) => [p.id, p.title]))
    contest.problemCount = problems.length
    contest.descriptionHtml = dashboard.description_html ?? ''
    contest.announcements = (dashboard.notices ?? []).map((n) => ({ time: n.time, text: n.title }))
    contest.canRegister = !contest.registered && contest.phase === 'upcoming'

    let standings: StandingsRow[] | null = null
    let standingsError: string | undefined
    try {
      const raw = await get<RawStandings>(`/api/contests/${id}/standings`)
      standings = mapStandings(raw, contest)
    } catch (error) {
      standingsError = error instanceof Error ? error.message : String(error)
    }

    return {
      contest,
      problems,
      notices: dashboard.notices ?? [],
      standings,
      standingsError,
      canAsk: dashboard.can_ask,
    }
  },

  async threads(): Promise<Thread[]> {
    const data = await get<RawBlogList>('/api/blogs', { page: 1, size: 100 })
    return (data.items ?? []).map(mapThreadListRow)
  },

  async thread(id: number): Promise<Thread | undefined> {
    const data = await get<RawBlogDetail>(`/api/blogs/${id}`, { with_comments: 1, comment_page: 1, comment_size: 20 })
    return {
      id: data.blog.id,
      title: data.blog.title,
      titleEn: data.blog.title,
      node: data.blog.tags?.[0] ?? 'share',
      author: data.blog.poster,
      content: '',
      contentHtml: data.blog.content_html,
      createdAt: data.blog.post_time,
      views: 0,
      likes: data.blog.zan,
      comments: (data.comments?.items ?? []).map(mapComment),
      commentCount: data.comments?.total ?? 0,
      myZan: data.my_zan,
      tags: data.blog.tags ?? [],
      canComment: true,
      pinned: false,
    }
  },

  async user(name: string): Promise<UserProfileData | undefined> {
    const encoded = encodeURIComponent(name)
    const profile = await get<RawProfile>(`/api/users/${encoded}`)
    const username = profile.user.username

    const [subsResult, blogsResult] = await Promise.allSettled([
      get<RawSubmissionList>('/api/submissions', { page: 1, size: 100, submitter: username }),
      get<RawBlogList>(`/api/users/${encoded}/blogs`, { page: 1, size: 100 }),
    ])

    const subs = subsResult.status === 'fulfilled' ? subsResult.value : { items: [], total: 0 }
    const blogs = blogsResult.status === 'fulfilled' ? blogsResult.value : { items: [], total: 0 }

    const acIds = (profile.ac_problems ?? []).slice(0, 100)
    let solved: Problem[] = []
    if (acIds.length > 0) {
      try {
        const batch = await get<RawBatch>('/api/problems/batch', { ids: acIds.join(',') })
        solved = (batch.items ?? []).map((p) => ({
          ...mapProblemListItem({
            id: p.id,
            title: p.title,
            ac_num: 0,
            submit_num: 0,
            zan: 0,
            tags: [],
            my_best_ac_submission_id: null,
          }),
          difficultyKnown: false,
          countsKnown: false,
        }))
      } catch {
        solved = []
      }
    }

    const history = profile.rating_history ?? []
    const user: OJUser = {
      id: 0,
      name: username,
      bio: profile.user.motto || '这位选手很神秘，什么都没有留下。',
      bioEn: profile.user.motto || 'A mysterious solver.',
      rating: profile.user.rating,
      acCount: acIds.length,
      submissionCount: subs.total ?? 0,
      joinedAt: profile.register_time ? profile.register_time.slice(0, 10) : '—',
      school: profile.user.realname || '—',
      ratingHistory: history.length > 0 ? history.map((h) => h.rating) : [profile.user.rating],
      avatarHue: 0,
      email: profile.user.email,
      realName: profile.user.realname,
      motto: profile.user.motto,
      avatarHash: profile.user.avatar_hash,
      groups: profile.groups ?? [],
      registerTime: profile.register_time,
    }

    return {
      user,
      groups: profile.groups ?? [],
      solved,
      submissions: (subs.items ?? []).map(mapSubmission),
      submissionsTotal: subs.total ?? 0,
      threads: (blogs.items ?? []).map(mapThreadListRow),
      ratingHistory: history.map((h) => ({
        contestId: h.contest_id,
        name: h.name,
        startTime: h.start_time,
        rank: h.rank,
        rating: h.rating,
        delta: h.delta,
      })),
    }
  },

  async submissions(params: SubmissionListParams = {}): Promise<SubmissionPage> {
    const data = await get<RawSubmissionList>('/api/submissions', {
      page: params.page ?? 1,
      size: params.size ?? 100,
      problem_id: params.problemId,
      submitter: params.submitter,
      language: params.language,
      status: params.status,
    })
    return { items: (data.items ?? []).map(mapSubmission), total: data.total ?? 0 }
  },

  async submission(id: number): Promise<Submission | undefined> {
    const data = await get<RawSubmissionDetail>(`/api/submissions/${id}`)
    return mapSubmissionDetail(data)
  },

  async createSubmission(input: CreateSubmissionInput): Promise<number> {
    const form = new FormData()
    const key = `answer_${input.itemName}`
    form.append(`${key}_upload_type`, 'editor')
    form.append(`${key}_editor`, input.code)
    form.append(`${key}_language`, input.language)
    const query = input.contestId ? `?contest_id=${input.contestId}` : ''
    const result = await postForm<{ submission_id: number }>(`/api/problems/${input.problemId}/submissions${query}`, form)
    return result.submission_id
  },

  async submissionStatus(ids: number[]): Promise<SubmissionStatus[]> {
    if (ids.length === 0) return []
    const data = await get<{ items: { id: number; judged: boolean; status: string; status_details: string }[] }>(
      '/api/submissions/status',
      { ids: ids.join(',') },
    )
    return (data.items ?? []).map((i) => ({
      id: i.id,
      judged: i.judged,
      status: i.status,
      statusDetails: i.status_details,
    }))
  },

  async postComment(blogId: number, content: string, replyTo?: number): Promise<void> {
    const path = replyTo
      ? `/api/blogs/${blogId}/comments/${replyTo}/replies`
      : `/api/blogs/${blogId}/comments`
    await post(path, { content })
  },

  async vote(type, id, delta): Promise<ZanResult> {
    return post<ZanResult>('/api/zan', { type, id, delta })
  },

  auth: {
    async me(): Promise<SessionUser | null> {
      const data = await get<RawMe>('/api/auth/me')
      return mapSessionUser(data)
    },

    async login(username: string, password: string): Promise<SessionUser> {
      await post('/api/auth/login', { username, password: hashPassword(password) })
      const me = await this.me()
      if (!me) throw new Error('登录成功但未能读取会话')
      return me
    },

    async register(input: RegisterInput): Promise<string> {
      const result = await post<{ message: string }>('/api/auth/register', {
        username: input.username,
        password: hashPassword(input.password),
        email: input.email,
        realname: input.realname,
        motto: input.motto,
      })
      return result.message
    },

    async logout(): Promise<void> {
      try {
        await post('/api/auth/logout')
      } catch {
        /* 会话已失效时忽略 */
      }
    },
  },
}
