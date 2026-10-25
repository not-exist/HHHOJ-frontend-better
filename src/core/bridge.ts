// L2 bridge: wraps the page's fetch (read-only observation of /api reads) and
// derives contest state for the ambient degrade chain. Nothing is modified or
// blocked; responses are cloned so the app's own parsing is untouched.
import { onRoute } from './runtime'
import { pageWindow } from '../services/gm'

type ApiListener = (path: string, data: unknown) => void
type ContestListener = (inProgress: boolean) => void

const apiListeners = new Set<ApiListener>()
const contestListeners = new Set<ContestListener>()
let contestInProgress = false

const DASHBOARD_RE = /\/api\/contests\/\d+\/dashboard/

export function onApi(cb: ApiListener): () => void {
  apiListeners.add(cb)
  return () => apiListeners.delete(cb)
}

export function contestState(): boolean {
  return contestInProgress
}

export function onContestChange(cb: ContestListener): () => void {
  contestListeners.add(cb)
  return () => contestListeners.delete(cb)
}

function setContest(value: boolean): void {
  if (value === contestInProgress) return
  contestInProgress = value
  for (const l of [...contestListeners]) l(value)
}

function observe(res: Response): void {
  let path: string
  try {
    path = new URL(res.url, location.href).pathname
  } catch {
    return
  }
  if (!path.startsWith('/api/')) return
  if (!(res.headers.get('content-type') ?? '').includes('json')) return
  res
    .clone()
    .json()
    .then((json) => {
      for (const l of [...apiListeners]) l(path, json)
      // The dashboard read carries contest.cur_progress: the degrade signal.
      if (DASHBOARD_RE.test(path)) {
        const progress = (json as { contest?: { cur_progress?: string } })?.contest?.cur_progress
        setContest(progress === 'in_progress')
      }
    })
    .catch(() => {})
}

export function initBridge(): void {
  const w = pageWindow() as Window & { __hfbFetchPatched?: boolean; fetch: typeof fetch }
  if (w.__hfbFetchPatched) return
  w.__hfbFetchPatched = true
  const original = w.fetch.bind(w)
  w.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    original(input, init).then((res) => {
      observe(res)
      return res
    })

  // Leaving the contest pages clears the degrade state even without a dashboard read.
  onRoute((path) => {
    if (!path.startsWith('/contest/')) setContest(false)
  })
}
