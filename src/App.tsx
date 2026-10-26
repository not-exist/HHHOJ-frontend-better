import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { submissionStore } from '@/services/store'
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
    }, 1100)
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
  useEffect(() => {
    // 启动全站“实时”评测流（模拟）
    submissionStore.startEngine()
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
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/status" element={<Status />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/discuss" element={<Discuss />} />
          <Route path="/discuss/:id" element={<DiscussThread />} />
          <Route path="/user/:name" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
