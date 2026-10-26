import type { Submission, Verdict } from '@/types'
import {
  buildInitialSubmissions,
  mulberry32,
  randomFinalVerdict,
  makeTestcases,
  advanceSubmissionId,
  peekNextSubmissionId,
  LANGUAGES,
  type Language,
} from '@/mock/submissions'
import { USERS } from '@/mock/users'
import { PROBLEMS } from '@/mock/problems'
import { CODE_TEMPLATES } from '@/mock/submissions'

/* ------------------------------------------------------------------
 * 全局提交存储 + 实时评测引擎
 * 内存态（不持久化），Status 页订阅它的变化实现“实时”流
 * ------------------------------------------------------------------ */

type Listener = () => void

class SubmissionStore {
  private subs: Submission[] = buildInitialSubmissions()
  private listeners = new Set<Listener>()
  private engineStarted = false
  private rnd = mulberry32(Date.now() % 2147483647)

  get all(): Submission[] {
    return this.subs
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    this.subs = [...this.subs]
    this.listeners.forEach((fn) => fn())
  }

  byId(id: number): Submission | undefined {
    return this.subs.find((s) => s.id === id)
  }

  /** 用户主动提交：进入 Pending，由引擎接管流转 */
  submit(input: { problemId: number; userName: string; language: Language; code: string; contestId?: number }): Submission {
    const problem = PROBLEMS.find((p) => p.id === input.problemId)
    const sub: Submission = {
      id: advanceSubmissionId(),
      problemId: input.problemId,
      userName: input.userName,
      language: input.language,
      code: input.code,
      verdict: 'Pending',
      timeMs: null,
      memoryMb: null,
      codeSizeKb: Math.max(0.1, Math.round((new Blob([input.code]).size / 1024) * 10) / 10),
      submittedAt: Date.now(),
      contestId: input.contestId,
      testcases: [],
      score: 0,
    }
    void problem
    this.subs = [sub, ...this.subs]
    this.listeners.forEach((fn) => fn())
    this.scheduleJudge(sub.id)
    return sub
  }

  /** 引擎驱动：随机选手的新提交（模拟全站实时流） */
  private spawnRandom(): Submission {
    const problem = PROBLEMS[Math.floor(this.rnd() * PROBLEMS.length)]
    const user = USERS[Math.floor(this.rnd() * USERS.length)]
    const language = LANGUAGES[Math.floor(this.rnd() * LANGUAGES.length)]
    const sub: Submission = {
      id: advanceSubmissionId(),
      problemId: problem.id,
      userName: user.name,
      language,
      code: CODE_TEMPLATES[language] ?? CODE_TEMPLATES['C++20'],
      verdict: 'Pending',
      timeMs: null,
      memoryMb: null,
      codeSizeKb: Math.round((0.4 + this.rnd() * 4) * 10) / 10,
      submittedAt: Date.now(),
      testcases: [],
      score: 0,
    }
    this.subs = [sub, ...this.subs]
    if (this.subs.length > 400) this.subs.length = 400
    this.listeners.forEach((fn) => fn())
    this.scheduleJudge(sub.id)
    return sub
  }

  private patch(id: number, patch: Partial<Submission>) {
    const idx = this.subs.findIndex((s) => s.id === id)
    if (idx === -1) return
    this.subs[idx] = { ...this.subs[idx], ...patch }
    this.emit()
  }

  /** Pending → Judging → 终态 的定时流转 */
  private scheduleJudge(id: number) {
    window.setTimeout(() => this.patch(id, { verdict: 'Judging' }), 900 + this.rnd() * 1200)
    window.setTimeout(() => {
      const sub = this.byId(id)
      if (!sub) return
      const final = randomFinalVerdict(this.rnd)
      const problem = PROBLEMS.find((p) => p.id === sub.problemId)
      const tcCount = 3 + Math.floor(this.rnd() * 8)
      this.patch(id, {
        verdict: final,
        timeMs: final === 'CompileError' ? Math.round(3 + this.rnd() * 15) : Math.round(20 + this.rnd() * (problem ? problem.timeLimitMs : 1000) * (final === 'TimeLimitExceeded' ? 1.25 : 0.9)),
        memoryMb: final === 'CompileError' ? null : Math.round(3 + this.rnd() * (problem ? problem.memoryLimitMb : 256) * 0.8),
        testcases: final === 'CompileError' ? [] : makeTestcases(final, tcCount, this.rnd),
        score: final === 'Accepted' ? 100 : Math.round(this.rnd() * 70),
      })
    }, 2600 + this.rnd() * 2600)
  }

  /** 启动全站实时流（每 7~13 秒一条随机提交） */
  startEngine() {
    if (this.engineStarted || typeof window === 'undefined') return
    this.engineStarted = true
    const tick = () => {
      this.spawnRandom()
      window.setTimeout(tick, 7000 + this.rnd() * 6000)
    }
    window.setTimeout(tick, 4000)
  }
}

export const submissionStore = new SubmissionStore()
export function nextSubmissionIdPreview(): number {
  return peekNextSubmissionId()
}

/** verdict 的展示颜色（与 tokens.css 中 --v-* 一致） */
export const VERDICT_COLOR: Record<Verdict, { c: string; g: string }> = {
  Accepted: { c: 'var(--v-acced)', g: 'var(--v-acced-glow)' },
  WrongAnswer: { c: 'var(--v-wrong)', g: 'var(--v-wrong-glow)' },
  TimeLimitExceeded: { c: 'var(--v-tle)', g: 'var(--v-tle-glow)' },
  MemoryLimitExceeded: { c: 'var(--v-mle)', g: 'var(--v-mle-glow)' },
  RuntimeError: { c: 'var(--v-re)', g: 'var(--v-re-glow)' },
  CompileError: { c: 'var(--v-ce)', g: 'var(--v-ce-glow)' },
  Judging: { c: 'var(--v-wait)', g: 'var(--v-wait-glow)' },
  Pending: { c: 'var(--v-wait)', g: 'var(--v-wait-glow)' },
}
