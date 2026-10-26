import type {
  Announcement,
  Comment,
  Contest,
  HomeData,
  OJUser,
  Problem,
  RanklistRow,
  StandingsRow,
  Submission,
  Thread,
} from '@/types'
import { PROBLEMS } from '@/mock/problems'
import { CONTESTS, standingsFor } from '@/mock/contests'
import { THREADS } from '@/mock/discuss'
import { ANNOUNCEMENTS } from '@/mock/news'
import { USERS } from '@/mock/users'
import { CODE_TEMPLATES, LANGUAGES, type Language } from '@/mock/submissions'
import { submissionStore } from '@/services/store'
import { loadJSON, saveJSON } from '@/services/persist'
import type {
  ApiClient,
  ContestDetailData,
  CreateSubmissionInput,
  RegisterInput,
  SessionUser,
  SubmissionListParams,
  SubmissionPage,
  SubmissionStatus,
  UserCard,
  UserProfileData,
  ZanResult,
} from './types'

const DELAY = 180
const DEMO_USER_KEY = 'toj.demo-user'
const DEMO_ROLE = 'user' as const

const delay = (ms = DELAY) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function mockProblem(p: Problem): Problem {
  return {
    ...p,
    canSubmit: true,
    countsKnown: true,
    difficultyKnown: true,
    submissionRequirement: [{ name: 'answer', type: 'source code', file_name: 'answer.code', languages: [...LANGUAGES] }],
  }
}

function mockContest(c: Contest): Contest {
  return {
    ...c,
    descriptionHtml: '',
    problemTitles: Object.fromEntries(
      c.problems.map((id) => [id, PROBLEMS.find((p) => p.id === id)?.title ?? `#${id}`]),
    ),
    problemCount: c.problems.length,
  }
}

function mockUser(u: OJUser): OJUser {
  return {
    ...u,
    role: DEMO_ROLE,
    groups: [],
    realName: u.name,
  }
}

function mockSession(name: string): SessionUser {
  const user = USERS.find((u) => u.name.toLowerCase() === name.toLowerCase())
  return {
    username: user?.name ?? name,
    usergroup: 1,
    role: DEMO_ROLE,
    rating: user?.rating ?? 1200,
  }
}

function demoUser(): string | null {
  return loadJSON<string | null>(DEMO_USER_KEY, null)
}

function mockSubmission(s: Submission): Submission {
  return {
    ...s,
    problemTitle: PROBLEMS.find((p) => p.id === s.problemId)?.title ?? `#${s.problemId}`,
    statusText: s.verdict === 'Accepted' ? 'Judged' : s.verdict === 'Pending' ? 'Waiting' : s.verdict === 'Judging' ? 'Judging' : 'Judged',
    codeUnavailable: false,
  }
}

export const mockApi: ApiClient = {
  isMock: true,

  async home(): Promise<HomeData> {
    await delay()
    const byRating: RanklistRow[] = [...USERS]
      .sort((a, b) => b.rating - a.rating)
      .map((u, i) => ({ rank: i + 1, username: u.name, realname: u.school, motto: u.bio, rating: u.rating }))
    const byAc: RanklistRow[] = [...USERS]
      .sort((a, b) => b.acCount - a.acCount)
      .map((u, i) => ({ rank: i + 1, username: u.name, realname: u.school, motto: u.bio, acNum: u.acCount }))
    return { announcements: ANNOUNCEMENTS, userRanklist: byRating, problemRanklist: byAc }
  },

  async announcements(): Promise<Announcement[]> {
    await delay()
    return ANNOUNCEMENTS
  },

  async problems(): Promise<Problem[]> {
    await delay()
    return PROBLEMS.map(mockProblem)
  },

  async problem(id: number, _contestId?: number): Promise<Problem | undefined> {
    await delay()
    const problem = PROBLEMS.find((p) => p.id === id)
    return problem ? mockProblem(problem) : undefined
  },

  async contests(): Promise<Contest[]> {
    await delay()
    return CONTESTS.map(mockContest)
  },

  async contest(id: number): Promise<ContestDetailData> {
    await delay()
    const contest = CONTESTS.find((c) => c.id === id)
    if (!contest) throw new Error('比赛不存在')
    const full = mockContest(contest)
    return {
      contest: full,
      problems: contest.problems.map((pid, pos) => ({
        id: pid,
        title: PROBLEMS.find((p) => p.id === pid)?.title ?? `#${pid}`,
        pos,
        myAcSubmissionId: null,
      })),
      notices: contest.announcements.map((a, i) => ({ id: i + 1, title: a.text, content: '', time: a.time })),
      standings: standingsFor(contest),
      canAsk: false,
    }
  },

  async threads(): Promise<Thread[]> {
    await delay()
    return THREADS
  },

  async thread(id: number): Promise<Thread | undefined> {
    await delay()
    return THREADS.find((t) => t.id === id)
  },

  async user(name: string): Promise<UserProfileData | undefined> {
    await delay()
    const found = USERS.find((u) => u.name.toLowerCase() === name.toLowerCase())
    if (!found) return undefined
    const user = mockUser(found)
    const submissions = submissionStore.all.filter((s) => s.userName === user.name).map(mockSubmission)
    const threads = THREADS.filter((t) => t.author === user.name)
    return {
      user,
      groups: [],
      solved: PROBLEMS.slice(0, Math.max(0, Math.min(PROBLEMS.length, user.acCount))).map(mockProblem),
      submissions,
      submissionsTotal: user.submissionCount,
      threads,
      ratingHistory: found.ratingHistory.map((rating, i) => ({
        contestId: i + 1,
        name: `Round #${i + 1}`,
        startTime: `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-15 10:00:00`,
        rank: i + 1,
        rating,
        delta: i > 0 ? rating - found.ratingHistory[i - 1] : 0,
      })),
    }
  },

  async userCards(names: string[]): Promise<Record<string, UserCard>> {
    await delay()
    const sorted = [...USERS].sort((a, b) => b.rating - a.rating)
    const out: Record<string, UserCard> = {}
    for (const name of names) {
      const user = USERS.find((u) => u.name.toLowerCase() === name.toLowerCase())
      if (!user) continue
      const index = sorted.findIndex((u) => u.name === user.name)
      out[user.name] = {
        username: user.name,
        rating: user.rating,
        rankPercent: sorted.length <= 1 ? 0 : index / (sorted.length - 1),
        isSuperuser: false,
        avatarHash: '',
      }
    }
    return out
  },

  async submissions(params: SubmissionListParams = {}): Promise<SubmissionPage> {
    await delay()
    const size = params.size ?? 100
    const filtered = submissionStore.all.filter((s) => {
      if (params.problemId && s.problemId !== params.problemId) return false
      if (params.submitter && s.userName !== params.submitter) return false
      if (params.language && s.language !== params.language) return false
      return true
    })
    const page = params.page ?? 1
    return {
      items: filtered.slice((page - 1) * size, page * size).map(mockSubmission),
      total: filtered.length,
    }
  },

  async submission(id: number): Promise<Submission | undefined> {
    await delay()
    const sub = submissionStore.byId(id)
    return sub ? mockSubmission(sub) : undefined
  },

  async createSubmission(input: CreateSubmissionInput): Promise<number> {
    const sub = submissionStore.submit({
      problemId: input.problemId,
      userName: demoUser() ?? 'guest',
      language: input.language as Language,
      code: input.code,
      contestId: input.contestId ?? undefined,
    })
    return sub.id
  },

  async submissionStatus(ids: number[]): Promise<SubmissionStatus[]> {
    return ids.flatMap((id) => {
      const sub = submissionStore.byId(id)
      if (!sub) return []
      return [
        {
          id,
          judged: sub.verdict !== 'Pending' && sub.verdict !== 'Judging',
          status: sub.verdict,
          statusDetails: '',
        },
      ]
    })
  },

  async postComment(): Promise<void> {
    await delay(120)
  },

  async vote(_type, _id, delta): Promise<ZanResult> {
    await delay(80)
    return { my_zan: delta, zan: delta > 0 ? 1 : 0 }
  },

  auth: {
    async me(): Promise<SessionUser | null> {
      const name = demoUser()
      return name ? mockSession(name) : null
    },

    async login(username: string): Promise<SessionUser> {
      await delay()
      const session = mockSession(username.trim())
      saveJSON(DEMO_USER_KEY, session.username)
      return session
    },

    async register(input: RegisterInput): Promise<string> {
      await delay()
      saveJSON(DEMO_USER_KEY, input.username.trim())
      return `演示模式：欢迎你，${input.username}`
    },

    async logout(): Promise<void> {
      saveJSON(DEMO_USER_KEY, null)
    },
  },
}

export { CODE_TEMPLATES, LANGUAGES }
