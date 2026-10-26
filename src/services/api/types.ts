import type {
  Announcement,
  Comment,
  Contest,
  HomeData,
  OJUser,
  Problem,
  StandingsRow,
  Submission,
  Thread,
  UserRole,
} from '@/types'

export interface SessionUser {
  username: string
  usergroup: number
  role: UserRole
  rating: number
  email?: string
  unreadMessages?: number
  unreadSystemMessages?: number
  groups?: { name: string; note?: string }[]
}

export interface RegisterInput {
  username: string
  password: string
  email: string
  realname: string
  motto: string
}

export interface SubmissionListParams {
  page?: number
  size?: number
  problemId?: number
  submitter?: string
  language?: string
  status?: 'Waiting' | 'Judging'
}

export interface SubmissionPage {
  items: Submission[]
  total: number
}

export interface SubmissionStatus {
  id: number
  judged: boolean
  status: string
  statusDetails: string
}

export interface CreateSubmissionInput {
  problemId: number
  /** submission_requirement 中 source code 条目的 name，通常是 answer */
  itemName: string
  language: string
  code: string
  contestId?: number | null
}

export interface ContestProblem {
  id: number
  title: string
  pos: number
  myAcSubmissionId: number | null
}

export interface ContestDetailData {
  contest: Contest
  problems: ContestProblem[]
  notices: { id: number; title: string; content: string; time: string }[]
  standings: StandingsRow[] | null
  standingsError?: string
  canAsk?: boolean
}

export interface UserProfileData {
  user: OJUser
  groups: { name: string; note?: string }[]
  solved: Problem[]
  submissions: Submission[]
  submissionsTotal: number
  threads: Thread[]
  ratingHistory: { contestId: number; name: string; startTime: string; rank: number; rating: number; delta: number }[]
}

export interface RanklistPage {
  items: HomeData['userRanklist']
  total: number
}

export interface ThreadPage {
  items: Thread[]
  total: number
}

export interface ZanResult {
  my_zan: number
  zan: number
}

export interface ApiClient {
  readonly isMock: boolean

  home(): Promise<HomeData>
  announcements(): Promise<Announcement[]>
  problems(): Promise<Problem[]>
  problem(id: number, contestId?: number): Promise<Problem | undefined>
  contests(): Promise<Contest[]>
  contest(id: number): Promise<ContestDetailData>
  threads(): Promise<Thread[]>
  thread(id: number): Promise<Thread | undefined>
  user(name: string): Promise<UserProfileData | undefined>

  submissions(params?: SubmissionListParams): Promise<SubmissionPage>
  submission(id: number): Promise<Submission | undefined>
  createSubmission(input: CreateSubmissionInput): Promise<number>
  submissionStatus(ids: number[]): Promise<SubmissionStatus[]>

  postComment(blogId: number, content: string, replyTo?: number): Promise<void>
  vote(type: 'B' | 'BC' | 'P' | 'C', id: number, delta: 1 | -1): Promise<ZanResult>

  auth: {
    me(): Promise<SessionUser | null>
    login(username: string, password: string): Promise<SessionUser>
    register(input: RegisterInput): Promise<string>
    logout(): Promise<void>
  }
}

export type { Comment, Announcement, Contest, OJUser, Problem, StandingsRow, Submission, Thread }
