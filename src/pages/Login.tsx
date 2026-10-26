import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Lock, UserRound, ArrowRight, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isMock } from '@/services/api'
import { showToast } from '@/components/Toast'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="glass pad auth-card rise">
        <div className="logo-mark">
          <Sparkles size={22} />
        </div>
        <h1 className="center" style={{ fontSize: '1.35rem', marginTop: '1rem' }}>{title}</h1>
        <p className="center small faint">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}

function safePath(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (/^\/(login|register|logout)(\/|$)/.test(raw)) return '/'
  return raw
}

export default function Login() {
  const { t } = useTranslation()
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const to = safePath(params.get('to'))
  const [name, setName] = useState('')
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to={to} replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('auth.usernameRequired'))
      return
    }
    setBusy(true)
    setError('')
    try {
      const u = await login(name.trim(), pwd)
      showToast(t('auth.welcomeBack', { name: u.name }))
      navigate(to, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={isMock ? t('auth.loginSubtitle') : '使用 HHHOJ 账号登录'}>
      <form onSubmit={(e) => void submit(e)}>
        <div>
          <span className="field-label">{t('auth.username')}</span>
          <div style={{ position: 'relative' }}>
            <UserRound size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder={t('auth.usernamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="username" />
          </div>
        </div>
        <div>
          <span className="field-label">{t('auth.password')}</span>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} type="password" placeholder={t('auth.passwordPlaceholder')} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="current-password" />
          </div>
        </div>
        {error && (
          <p className="small" style={{ color: 'var(--v-wrong)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <AlertTriangle size={13} /> {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? '登录中…' : t('auth.login')} <ArrowRight size={15} />
        </button>
        <p className="center small faint">{isMock ? t('auth.demoHint') : '密码在浏览器端加盐 MD5 后传输'}</p>
        <p className="center small">
          <Link to={`/register?to=${encodeURIComponent(to)}`}>{t('auth.goRegister')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
