import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { OJUser, UserRole } from '@/types'
import { api, type RegisterInput, type SessionUser } from '@/services/api'

interface AuthCtx {
  user: OJUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<OJUser>
  register: (input: RegisterInput) => Promise<string>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

const ROLE_LABEL: Record<UserRole, string> = {
  pending: '待审核',
  user: '用户',
  admin: '管理员',
  teacher: '教师',
  developer: '开发者',
}

export function roleLabel(role: UserRole | undefined): string {
  return role ? ROLE_LABEL[role] : ''
}

/** 会话信息只有用户名/rating/用户组；其余档案字段留空，资料页再按需读真实接口 */
function toOJUser(session: SessionUser): OJUser {
  return {
    id: 0,
    name: session.username,
    bio: '',
    bioEn: '',
    rating: session.rating,
    acCount: 0,
    submissionCount: 0,
    joinedAt: '',
    school: '',
    ratingHistory: [session.rating],
    avatarHue: 0,
    role: session.role,
    email: session.email,
    groups: session.groups,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OJUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const session = await api.auth.me()
      setUser(session ? toOJUser(session) : null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    const session = await api.auth.login(username, password)
    const mapped = toOJUser(session)
    setUser(mapped)
    return mapped
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const message = await api.auth.register(input)
    // 演示模式会直接建立会话；真实模式注册后仍需管理员审核，refresh 只会得到 null
    await refresh()
    return message
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const value = useContext(Ctx)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
