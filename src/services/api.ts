import type { Problem, Contest, Thread, OJUser, Announcement, StandingsRow } from '@/types'
import { PROBLEMS } from '@/mock/problems'
import { CONTESTS, standingsFor } from '@/mock/contests'
import { THREADS, NODES, type NodeKey } from '@/mock/discuss'
import { ANNOUNCEMENTS } from '@/mock/news'
import { USERS } from '@/mock/users'
import { submissionStore } from './store'

/** 模拟网络延迟 */
const delay = (ms = 260) => new Promise<void>((r) => setTimeout(r, ms + Math.random() * 180))

export const api = {
  async problems(): Promise<Problem[]> {
    await delay(200)
    return PROBLEMS
  },
  async problem(id: number): Promise<Problem | undefined> {
    await delay(150)
    return PROBLEMS.find((p) => p.id === id)
  },
  async contests(): Promise<Contest[]> {
    await delay(220)
    return CONTESTS
  },
  async contest(id: number): Promise<Contest | undefined> {
    await delay(150)
    return CONTESTS.find((c) => c.id === id)
  },
  async standings(contestId: number): Promise<StandingsRow[]> {
    await delay(300)
    const c = CONTESTS.find((x) => x.id === contestId)
    return c ? standingsFor(c) : []
  },
  async threads(node?: NodeKey): Promise<Thread[]> {
    await delay(220)
    const list = !node || node === 'all' ? THREADS : THREADS.filter((t) => t.node === node)
    return [...list].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt.localeCompare(a.createdAt))
  },
  async thread(id: number): Promise<Thread | undefined> {
    await delay(150)
    return THREADS.find((t) => t.id === id)
  },
  async users(): Promise<OJUser[]> {
    await delay(220)
    return USERS
  },
  async user(name: string): Promise<OJUser | undefined> {
    await delay(150)
    return USERS.find((u) => u.name.toLowerCase() === name.toLowerCase())
  },
  async announcements(): Promise<Announcement[]> {
    await delay(180)
    return ANNOUNCEMENTS
  },
  statusFeed() {
    return submissionStore.all
  },
  onStatusFeed(fn: () => void) {
    return submissionStore.subscribe(fn)
  },
}

export { NODES }
export type { NodeKey }
