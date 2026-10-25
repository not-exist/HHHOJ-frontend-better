import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { OJUser } from '@/types'
import { USERS, USER_MAP } from '@/mock/users'
import { loadJSON, saveJSON, LS_KEYS } from '@/services/persist'

interface AuthCtx {
  user: OJUser | null
  login: (name: string) => OJUser
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

/** 演示版鉴权：同名即登录既有 mock 用户，否则创建临时档案 */
function resolveProfile(name: string): OJUser {
  const existing = USER_MAP.get(name)
  if (existing) return existing
  return {
    id: 9000 + name.length,
    name,
    bio: '这位选手很神秘，什么都没有留下。',
    bioEn: 'A mysterious solver.',
    rating: 1200,
    acCount: 0,
    submissionCount: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
    school: '—',
    ratingHistory: [1200],
    avatarHue: 0,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OJUser | null>(() => {
    const name = loadJSON<string | null>(LS_KEYS.user, null)
    return name ? resolveProfile(name) : null
  })

  const login = useCallback((name: string) => {
    const profile = resolveProfile(name.trim())
    saveJSON(LS_KEYS.user, profile.name)
    setUser(profile)
    return profile
  }, [])

  const logout = useCallback(() => {
    saveJSON(LS_KEYS.user, null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}

export { USERS }
