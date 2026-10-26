/** localStorage 持久化小工具 */
export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 忽略配额错误 */
  }
}

export const LS_KEYS = {
  mode: 'toj.mode',
  hue: 'toj.hue',
  particles: 'toj.particles',
  lang: 'toj.lang',
  user: 'toj.user',
  likedThreads: 'toj.liked-threads',
  problemState: 'toj.problem-state',
} as const
