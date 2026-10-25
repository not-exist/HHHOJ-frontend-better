import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { AuthShell } from './Login'
import { useAuth } from '@/context/AuthContext'
import { showToast } from '@/components/Toast'

export default function Register() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast(t('auth.usernameRequired'))
      return
    }
    if (pwd !== pwd2) {
      showToast(t('auth.passwordMismatch'))
      return
    }
    login(name)
    showToast(t('auth.registerSuccess'))
    navigate('/')
  }

  return (
    <AuthShell title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
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
        <div>
          <span className="field-label">{t('auth.confirmPassword')}</span>
          <div style={{ position: 'relative' }}>
            <ShieldCheck size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.3rem' }} type="password" placeholder={t('auth.confirmPassword')} value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          {t('auth.register')} <ArrowRight size={15} />
        </button>
        <p className="center small faint">{t('auth.demoHint')}</p>
        <p className="center small">
          <Link to="/login">{t('auth.goLogin')}</Link>
        </p>
      </form>
    </AuthShell>
  )
}
