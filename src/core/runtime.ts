// L1 runtime: SPA navigation awareness. React Router drives the real history API,
// so patching pushState/replaceState plus popstate sees every navigation. The
// classes React owns are never touched; only <html> gets plugin state classes.
import { pageWindow } from '../services/gm'

type RouteListener = (path: string) => void

const listeners = new Set<RouteListener>()
let lastPath = location.pathname + location.search

function emit(): void {
  const path = location.pathname + location.search
  if (path === lastPath) return
  lastPath = path
  for (const l of [...listeners]) l(path)
}

export function initRuntime(): void {
  const w = pageWindow()
  try {
    for (const name of ['pushState', 'replaceState'] as const) {
      const original = w.history[name].bind(w.history) as (...args: unknown[]) => unknown
      w.history[name] = ((...args: unknown[]) => {
        const result = original(...args)
        emit()
        return result
      }) as typeof w.history.pushState
    }
    w.addEventListener('popstate', emit)
  } catch (e) {
    console.error('[HHFB] runtime init failed', e)
  }
}

export function onRoute(cb: RouteListener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
