import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Home, LayoutList, Activity, Trophy, MessagesSquare,
  Settings, Sun, Moon, Menu, X, LogOut, UserRound, Sparkles,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import SettingsDrawer from '@/components/SettingsDrawer'
import { avatarStyle } from '@/mock/users'
import i18n from '@/i18n'

const LINKS = [
  { to: '/', key: 'nav.home', icon: Home, end: true },
  { to: '/problems', key: 'nav.problems', icon: LayoutList, end: false },
  { to: '/status', key: 'nav.status', icon: Activity, end: false },
  { to: '/contests', key: 'nav.contests', icon: Trophy, end: false },
  { to: '/discuss', key: 'nav.discuss', icon: MessagesSquare, end: false },
] as const

export default function NavBar() {
  const { t } = useTranslation()
  const { mode, toggleMode } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const toggleLang = () => void i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh')

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <>
      <div className="nav-wrap">
        <nav className="nav" aria-label="main">
          <Link to="/" className="nav-logo">
            <span className="logo-mark">
              <Sparkles size={17} strokeWidth={2.2} />
            </span>
            <span>TwilightOJ</span>
          </Link>

          <div className="nav-links">
            {LINKS.map(({ to, key, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon />
                {t(key)}
              </NavLink>
            ))}
          </div>

          <span className="nav-divider" />

          <button className="icon-btn" onClick={toggleMode} title={t('nav.switchTheme')} aria-label={t('nav.switchTheme')}>
            {mode === 'dark' ? <Sun /> : <Moon />}
          </button>
          <button className="icon-btn" onClick={toggleLang} title={t('common.language')} aria-label={t('common.language')}>
            <span className="small mono" style={{ fontWeight: 700 }}>{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} title={t('nav.settings')} aria-label={t('nav.settings')}>
            <Settings />
          </button>

          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                className="nav-avatar"
                style={avatarStyle(user.name, 32)}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={user.name}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div
                  className="glass"
                  style={{
                    position: 'absolute', top: 'calc(100% + 0.6rem)', right: 0, minWidth: '11rem',
                    padding: '0.45rem', zIndex: 95, animation: 'pop-in 0.2s var(--ease-out) both',
                  }}
                >
                  <div style={{ padding: '0.4rem 0.7rem 0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.3rem' }}>
                    <div style={{ fontWeight: 700 }}>{user.name}</div>
                    <div className="small faint">Rating · {user.rating}</div>
                  </div>
                  <button className="nav-link" style={{ width: '100%' }} onClick={() => { setMenuOpen(false); navigate(`/user/${user.name}`) }}>
                    <UserRound /> {t('nav.profile')}
                  </button>
                  <button className="nav-link" style={{ width: '100%' }} onClick={handleLogout}>
                    <LogOut /> {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row nav-auth" style={{ gap: '0.3rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
            </div>
          )}

          <button className="icon-btn nav-burger" onClick={() => setMobileOpen((v) => !v)} aria-label={t('nav.openMenu')}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="glass nav-mobile" style={{ animation: 'pop-in 0.22s var(--ease-out) both' }}>
            {LINKS.map(({ to, key, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <Icon />
                {t(key)}
              </NavLink>
            ))}
            {!user && (
              <div className="row" style={{ padding: '0.45rem 0.7rem 0.3rem', gap: '0.4rem' }}>
                <Link to="/login" className="btn btn-ghost btn-sm grow">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm grow">{t('nav.register')}</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
