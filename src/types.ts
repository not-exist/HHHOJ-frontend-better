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
}

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
}

export interface StandingsRow {
  rank: number
  userName: string
  solved: number
  penaltyMinutes: number
  score: number
  cells: { problemId: number; attempts: number; solvedAtMin: number | null; score: number }[]
}

export interface Comment {
  id: number
  author: string
  content: string
  createdAt: string
  likes: number
  replies: Comment[]
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
}

export interface Announcement {
  id: number
  title: string
  titleEn: string
  date: string
  pinned?: boolean
}

export const DIFFICULTY_KEYS = ['intro', 'easy', 'medium', 'hard', 'provincial', 'noi'] as const
export type DifficultyKey = (typeof DIFFICULTY_KEYS)[Difficulty]
