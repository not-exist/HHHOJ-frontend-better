// The settings store: one JSON value, GM-persisted, with an in-memory reactive copy.
// Updates go through update(), which clones, mutates, persists and notifies.
import { gmGet, gmListen, gmSet } from './gm'

export type ThemeMode = 'system' | 'light' | 'dark'
export type RadiusLevel = 'none' | 'small' | 'large'

export type Settings = {
  version: 1
  theme: { mode: ThemeMode; hue: number }
  appearance: { fontSize: number; radius: RadiusLevel }
  particles: { count: number }
  contestDegrade: boolean
  wallpaper: { urls: string[] }
  features: Record<string, boolean>
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  theme: { mode: 'system', hue: 255 },
  appearance: { fontSize: 15, radius: 'large' },
  particles: { count: 12 },
  contestDegrade: true,
  wallpaper: { urls: [] },
  features: {},
}

const KEY = 'settings'

function merge(saved: Partial<Settings> | null | undefined): Settings {
  const def = structuredClone(DEFAULT_SETTINGS)
  if (saved === null || saved === undefined || typeof saved !== 'object') return def
  return {
    ...def,
    ...saved,
    theme: { ...def.theme, ...saved.theme },
    appearance: { ...def.appearance, ...saved.appearance },
    particles: { ...def.particles, ...saved.particles },
    wallpaper: { ...def.wallpaper, ...saved.wallpaper },
    features: { ...def.features, ...saved.features },
  }
}

let current: Settings = merge(gmGet<Partial<Settings> | null>(KEY, null))
const listeners = new Set<(s: Settings) => void>()

function notify(): void {
  for (const l of [...listeners]) l(current)
}

export function settings(): Settings {
  return current
}

export function update(fn: (s: Settings) => void): void {
  const next = structuredClone(current)
  fn(next)
  current = next
  gmSet(KEY, current)
  notify()
}

export function onSettings(cb: (s: Settings) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Cross-tab sync: reload from storage when another tab changed it.
export function initStore(): void {
  gmListen(KEY, (value) => {
    current = merge(value as Partial<Settings>)
    notify()
  })
}

export function resetSettings(): void {
  current = structuredClone(DEFAULT_SETTINGS)
  gmSet(KEY, current)
  notify()
}
