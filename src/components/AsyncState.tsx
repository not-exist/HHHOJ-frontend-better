import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, Inbox, KeyRound, Loader2 } from 'lucide-react'
import { ApiError, isAuthError } from '@/services/api'

export function Loading({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="glass pad center" style={{ padding: '3rem 1rem', color: 'var(--text-2)' }}>
      <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.6rem', animation: 'spin 1s linear infinite' }} />
      <div className="small faint">{label}</div>
    </div>
  )
}

export function EmptyState({ text = '暂无数据', icon: Icon = Inbox }: { text?: string; icon?: typeof Inbox }) {
  return (
    <div className="empty">
      <Icon />
      {text}
    </div>
  )
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || error.code
  if (error instanceof Error) return error.message
  return String(error ?? '未知错误')
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const authError = isAuthError(error)
  const location = useLocation()
  const to = encodeURIComponent(location.pathname + location.search)
  if (authError) {
    return (
      <div className="glass pad center" style={{ padding: '3rem 1rem' }}>
        <KeyRound size={26} style={{ margin: '0 auto 0.6rem', color: 'var(--primary)' }} />
        <p style={{ fontWeight: 600 }}>需要登录 HHHOJ 账号</p>
        <p className="small faint">{errorMessage(error)}</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: '0.8rem' }}>
          <Link className="btn btn-primary btn-sm" to={`/login?to=${to}`}>登录</Link>
          <a className="btn btn-ghost btn-sm" href={location.pathname + location.search}>原站查看</a>
        </div>
      </div>
    )
  }
  return (
    <div className="glass pad center" style={{ padding: '3rem 1rem' }}>
      <AlertTriangle size={26} style={{ margin: '0 auto 0.6rem', color: 'var(--v-tle)' }} />
      <p style={{ fontWeight: 600 }}>加载失败</p>
      <p className="small faint" style={{ maxWidth: '38rem', margin: '0.2rem auto 0.9rem' }}>{errorMessage(error)}</p>
      {onRetry && (
        <button className="btn btn-primary btn-sm" onClick={onRetry}>重试</button>
      )}
    </div>
  )
}

export function LoginRequired({ text = '登录后可查看此页内容' }: { text?: string }) {
  const location = useLocation()
  const to = encodeURIComponent(location.pathname + location.search)
  return (
    <div className="glass pad center" style={{ padding: '3rem 1rem' }}>
      <KeyRound size={26} style={{ margin: '0 auto 0.6rem', color: 'var(--primary)' }} />
      <p style={{ fontWeight: 600 }}>{text}</p>
      <p className="small faint">HHHOJ 的题库、提交记录、比赛与博客接口都要求登录。</p>
      <div className="row" style={{ justifyContent: 'center', marginTop: '0.8rem' }}>
        <Link className="btn btn-primary btn-sm" to={`/login?to=${to}`}>登录</Link>
        <a className="btn btn-ghost btn-sm" href="/register">注册</a>
      </div>
    </div>
  )
}
