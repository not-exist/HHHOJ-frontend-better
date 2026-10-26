import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserRound, Lock, ArrowRight, ShieldCheck, Mail, IdCard, UsersRound, AlertTriangle } from 'lucide-react'
import { AuthShell } from './Login'
import { useAuth } from '@/context/AuthContext'
import { isMock } from '@/services/api'
import { showToast } from '@/components/Toast'

function safePath(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (/^\/(login|register|logout)(\/|$)/.test(raw)) return '/'
  return raw
}

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const to = safePath(params.get('to'))
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [realname, setRealname] = useState('')
  const [teamname, setTeamname] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(t('auth.usernameRequired'))
      return
    }
    if (!/^[a-zA-Z0-9_]{1,20}$/.test(name.trim())) {
      setError('用户名只能包含字母、数字、下划线，长度 1–20')
      return
    }
    if (!isMock && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('请输入有效的电子邮箱')
      return
    }
    if (pwd !== pwd2) {
      setError(t('auth.passwordMismatch'))
      return
    }
    if (pwd.length < 6) {
      setError('密码至少 6 位')
      return
    }
    setBusy(true)
    setError('')
    try {
      const message = await register({
        username: name.trim(),
        password: pwd,
        email: email.trim(),
        realname: realname.trim(),
        motto: teamname.trim(),
      })
      showToast(message)
      if (isMock) navigate(to, { replace: true })
      else navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={isMock ? t('auth.registerSubtitle') : '注册 HHHOJ 账号；新账号通常需要管理员审核'}>
      <form onSubmit={(e) => void submit(e)}>
        <div>
          <span className="field-label">{t('auth.username')}</span>
          <div style={{ position: 'relative' }}>
            <UserRound size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder={t('auth.usernamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="username" maxLength={20} />
          </div>
        </div>
        {!isMock && (
          <>
            <div>
              <span className="field-label">电子邮箱</span>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: '2.3rem' }} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={50} />
              </div>
            </div>
            <div className="row" style={{ gap: '0.6rem', alignItems: 'flex-start' }}>
              <div className="grow">
                <span className="field-label">真实姓名</span>
                <div style={{ position: 'relative' }}>
                  <IdCard size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder="选填" value={realname} onChange={(e) => setRealname(e.target.value)} maxLength={50} />
                </div>
              </div>
              <div className="grow">
                <span className="field-label">团队名称</span>
                <div style={{ position: 'relative' }}>
                  <UsersRound size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder="选填" value={teamname} onChange={(e) => setTeamname(e.target.value)} maxLength={50} />
                </div>
              </div>
            </div>
          </>
        )}
        <div>
          <span className="field-label">{t('auth.password')}</span>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} type="password" placeholder={t('auth.passwordPlaceholder')} value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        <div>
          <span className="field-label">{t('auth.confirmPassword')}</span>
          <div style={{ position: 'relative' }}>
            <ShieldCheck size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} type="password" placeholder={t('auth.confirmPassword')} value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {error && (
          <p className="small" style={{ color: 'var(--v-wrong)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <AlertTriangle size={13} /> {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? '提交中…' : t('auth.register')} <ArrowRight size={15} />
        </button>
        <p className="center small faint">{isMock ? t('auth.demoHint') : '注册后需等待管理员审核通过才能登录'}</p>
        <p className="center small">
          <Link to={`/login?to=${encodeURIComponent(to)}`}>{t('auth.goLogin')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
