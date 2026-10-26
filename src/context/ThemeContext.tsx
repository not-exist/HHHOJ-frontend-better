import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loadJSON, saveJSON, LS_KEYS } from '@/services/persist'

type Mode = 'dark' | 'light'

interface ThemeCtx {
  mode: Mode
  hue: number
  particles: boolean
  setMode: (m: Mode) => void
  toggleMode: () => void
  setHue: (h: number) => void
  setParticles: (on: boolean) => void
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => loadJSON<Mode>(LS_KEYS.mode, 'light'))
  const [hue, setHueState] = useState<number>(() => loadJSON<number>(LS_KEYS.hue, 205))
  const [particles, setParticlesState] = useState<boolean>(() => loadJSON<boolean>(LS_KEYS.particles, true))

  useEffect(() => {
    document.documentElement.dataset.mode = mode
    saveJSON(LS_KEYS.mode, mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.style.setProperty('--hue', String(hue))
    saveJSON(LS_KEYS.hue, hue)
  }, [hue])

  useEffect(() => {
    saveJSON(LS_KEYS.particles, particles)
  }, [particles])

  const setMode = useCallback((m: Mode) => setModeState(m), [])
  const toggleMode = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const setHue = useCallback((h: number) => setHueState(h), [])
  const setParticles = useCallback((on: boolean) => setParticlesState(on), [])

  const value = useMemo(
    () => ({ mode, hue, particles, setMode, toggleMode, setHue, setParticles }),
    [mode, hue, particles, setMode, toggleMode, setHue, setParticles],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}
