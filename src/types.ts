/** 题目难度档位（六档，参考主流 OJ） */
export type Difficulty = 0 | 1 | 2 | 3 | 4 | 5

export type Verdict =
  | 'Accepted'
  | 'WrongAnswer'
  | 'TimeLimitExceeded'
  | 'MemoryLimitExceeded'
  | 'RuntimeError'
  | 'CompileError'
  | 'Judging'
  | 'Pending'

export type ContestPhase = 'running' | 'upcoming' | 'finished'
export type ContestRule = 'ACM' | 'OI' | 'IOI'

/** HHHOJ 的用户组，数字与 server 的 usergroup 一致 */
export type UserRole = 'pending' | 'user' | 'admin' | 'teacher' | 'developer'

export interface OJUser {
  id: number
  name: string
  bio: string
  bioEn: string
  rating: number
  acCount: number
  submissionCount: number
  joinedAt: string
  school: string
  /** rating 变化曲线 (contestIndex, rating) */
  ratingHistory: number[]
  avatarHue: number

  /* ---- 真实数据附带的字段（mock 模式可为空） ---- */
  role?: UserRole
  email?: string
  realName?: string
  motto?: string
  avatarHash?: string
  groups?: { name: string; note?: string }[]
  registerTime?: string
  ratingRank?: number
}

export interface Problem {
  id: number
  title: string
  titleEn: string
  difficulty: Difficulty
  tags: string[]
  /** 通过人数 */
  solved: number
  /** 提交总数 */
  submissions: number
  timeLimitMs: number
  memoryLimitMb: number
  background: string
  backgroundEn: string
  description: string
  descriptionEn: string
  inputFormat: string
  inputFormatEn: string
  outputFormat: string
  outputFormatEn: string
  samples: { input: string; output: string }[]
  hint: string
  hintEn: string
  source: string

  /* ---- 真实数据附带的字段 ---- */
  /** HHHOJ 的题面 HTML（含样例、提示等全部内容） */
  statementHtml?: string
  statementPdf?: string
  canSubmit?: boolean
  prevProblemId?: number
  nextProblemId?: number
  /** 提交要求里 source code 条目的可选语言 */
  submissionRequirement?: SubmissionRequirementItem[]
  contestId?: number | null
  contestTitle?: string | null
  /** 我的最佳 AC 提交 id，未通过为 null */
  myBestAcSubmissionId?: number | null
  /** 真实详情接口没有通过率信息时为 false */
  countsKnown?: boolean
  difficultyKnown?: boolean
}

export interface SubmissionRequirementItem {
  name: string
  type: 'source code' | 'text'
  file_name: string
  languages?: string[]
  size?: number
  label?: string
}

export interface TestcaseResult {
  index: number
  verdict: Verdict
  timeMs: number
  memoryMb: number
  score: number
}

export interface Submission {
  id: number
  problemId: number
  userName: string
  language: string
  code: string
  verdict: Verdict
  /** 终态时的耗时/内存；未终态为 null */
  timeMs: number | null
  memoryMb: number | null
  codeSizeKb: number
  submittedAt: number
  contestId?: number
  testcases: TestcaseResult[]
  score: number

  /* ---- 真实数据附带的字段 ---- */
  problemTitle?: string
  statusText?: string
  judgeTime?: string | null
  judgeTimeAt?: number | null
  codeUnavailable?: boolean
  detailsXml?: string | null
}

export interface Contest {
  id: number
  title: string
  titleEn: string
  rule: ContestRule
  phase: ContestPhase
  startAt: number
  endAt: number
  description: string
  descriptionEn: string
  problems: number[]
  participantCount: number
  rated: boolean
  announcements: { time: string; text: string }[]

  /* ---- 真实数据附带的字段 ---- */
  descriptionHtml?: string
  problemTitles?: Record<number, string>
  problemCount?: number
  registered?: boolean
  canRegister?: boolean
  lastMin?: number
  zan?: number
  myZan?: number
}

export interface StandingsCell {
  problemId: number
  attempts: number
  solvedAtMin: number | null
  score: number
  time?: number
  waiting?: boolean
}

export interface StandingsRow {
  rank: number
  userName: string
  solved: number
  penaltyMinutes: number
  score: number
  cells: StandingsCell[]

  /* ---- 真实数据附带的字段 ---- */
  realName?: string
  totalScore?: number
  totalTime?: number
  totalMemory?: number
}

export interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
  likes: number
  replies: Comment[]
  /** 我是否点过赞（-1/0/1） */
  myZan?: number
}

export interface Thread {
  id: number
  title: string
  titleEn: string
  node: string
  author: string
  content: string
  createdAt: string
  views: number
  likes: number
  comments: Comment[]
  pinned?: boolean

  /* ---- 真实数据附带的字段 ---- */
  contentHtml?: string
  tags?: string[]
  commentCount?: number
  myZan?: number
  canComment?: boolean
}

export interface Announcement {
  id: number
  title: string
  titleEn: string
  date: string
  pinned?: boolean
  poster?: string
}

export interface RanklistRow {
  rank: number
  username: string
  realname: string
  motto: string
  rating?: number
  acNum?: number
}

export interface HomeData {
  announcements: Announcement[]
  userRanklist: RanklistRow[]
  problemRanklist: RanklistRow[]
}

export const DIFFICULTY_KEYS = ['intro', 'easy', 'medium', 'hard', 'provincial', 'noi'] as const
export type DifficultyKey = (typeof DIFFICULTY_KEYS)[Difficulty]
