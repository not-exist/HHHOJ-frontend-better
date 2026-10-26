import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, Lock, UserRound, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
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

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [pwd, setPwd] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast(t('auth.usernameRequired'))
      return
    }
    const u = login(name)
    showToast(t('auth.welcomeBack', { name: u.name }))
    navigate('/')
  }

  return (
    <AuthShell title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={submit}>
        <div>
          <span className="field-label">{t('auth.username')}</span>
          <div style={{ position: 'relative' }}>
            <UserRound size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} placeholder={t('auth.usernamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
        </div>
        <div>
          <span className="field-label">{t('auth.password')}</span>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} type="password" placeholder={t('auth.passwordPlaceholder')} value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          {t('auth.login')} <ArrowRight size={15} />
        </button>
        <p className="center small faint">{t('auth.demoHint')}</p>
        <p className="center small">
          <Link to="/register">{t('auth.goRegister')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
