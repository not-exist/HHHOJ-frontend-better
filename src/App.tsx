import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import MainLayout from '@/layouts/MainLayout'
import { submissionStore } from '@/services/store'
import { isMock } from '@/services/api'
import Home from '@/pages/Home'
import Problems from '@/pages/Problems'
import ProblemDetail from '@/pages/ProblemDetail'
import Status from '@/pages/Status'
import Contests from '@/pages/Contests'
import ContestDetail from '@/pages/ContestDetail'
import Discuss from '@/pages/Discuss'
import DiscussThread from '@/pages/DiscussThread'
import UserProfile from '@/pages/UserProfile'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import NotFound from '@/pages/NotFound'
import { ToastHost } from '@/components/Toast'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function usePageTitle() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  useEffect(() => {
    let key = 'nav.home'
    if (/^\/problems/.test(pathname)) key = 'nav.problems'
    else if (/^\/problem\//.test(pathname)) key = 'problem.tabStatement'
    else if (/^\/submissions/.test(pathname)) key = 'nav.status'
    else if (/^\/contests/.test(pathname)) key = 'nav.contests'
    else if (/^\/contest\//.test(pathname)) key = 'contests.tabStandings'
    else if (/^\/blogs/.test(pathname)) key = 'nav.discuss'
    else if (/^\/post\//.test(pathname)) key = 'nav.discuss'
    else if (/^\/user\/profile\//.test(pathname)) key = 'nav.profile'
    else if (/^\/login/.test(pathname)) key = 'nav.login'
    else if (/^\/register/.test(pathname)) key = 'nav.register'
    document.title = `${t(key)} · TwilightOJ`
  }, [pathname, t])
}

/** 进站加载遮罩：仅每个会话首次进入时展示 */
function useBooted() {
  const [booted, setBooted] = useState(() => {
    try {
      return sessionStorage.getItem('toj.booted') === '1'
    } catch {
      return true
    }
  })
  useEffect(() => {
    if (booted) return
    const t = window.setTimeout(() => {
      setBooted(true)
      try {
        sessionStorage.setItem('toj.booted', '1')
      } catch { /* ignore */ }
    }, 900)
    document.fonts?.ready.then(() => {
      setBooted(true)
      try {
        sessionStorage.setItem('toj.booted', '1')
      } catch { /* ignore */ }
    }).catch(() => {})
    return () => window.clearTimeout(t)
  }, [booted])
  return booted
}

export default function App() {
  const booted = useBooted()
  usePageTitle()
  useEffect(() => {
    // 演示模式才启动模拟评测流；真实模式由 HHHOJ 后端判题
    if (isMock) submissionStore.startEngine()
  }, [])
  return (
    <>
      <div className={`boot ${booted ? 'done' : ''}`} aria-hidden={booted}>
        <div className="boot-logo">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.1 5.3L19.5 10l-5.4 1.7L12 17l-2.1-5.3L4.5 10l5.4-1.7z" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <div className="boot-bar" />
      </div>
      <ScrollToTop />
      <ToastHost />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problem/:id" element={<ProblemDetail />} />
          <Route path="/submissions" element={<Status />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/contest/:id" element={<ContestDetail />} />
          <Route path="/contest/:id/standings" element={<ContestDetail initialTab="standings" />} />
          <Route path="/blogs" element={<Discuss />} />
          <Route path="/blogs/:id" element={<DiscussThread />} />
          <Route path="/post/:id" element={<DiscussThread />} />
          <Route path="/user/profile/:name" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
