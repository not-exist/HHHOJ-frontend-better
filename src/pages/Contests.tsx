import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Users, Clock3, ChevronRight } from 'lucide-react'
import Countdown from '@/components/Countdown'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { useApi } from '@/services/useApi'
import { pick, fmtDateTime, fmtDuration } from '@/utils/i18nContent'
import type { ContestPhase } from '@/types'

type TabKey = ContestPhase | 'all'

export default function Contests() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<TabKey>('all')

  const contests = useApi(
    () => (user ? api.contests() : Promise.resolve([])),
    [user?.name],
  )
  const list = contests.data ?? []

  const visible = list
    .filter((c) => tab === 'all' || c.phase === tab)
    .sort((a, b) => {
      const order: Record<ContestPhase, number> = { running: 0, upcoming: 1, finished: 2 }
      return order[a.phase] - order[b.phase] || a.startAt - b.startAt
    })

  const tabs: [TabKey, string, number][] = [
    ['all', t('common.all'), list.length],
    ['running', t('contests.running'), list.filter((c) => c.phase === 'running').length],
    ['upcoming', t('contests.upcoming'), list.filter((c) => c.phase === 'upcoming').length],
    ['finished', t('contests.finished'), list.filter((c) => c.phase === 'finished').length],
  ]

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看比赛" />
  if (contests.loading) return <Loading label="读取比赛…" />
  if (contests.error) return <ErrorState error={contests.error} onRetry={contests.reload} />

  return (
    <>
      <div className="row-between wrap rise" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('contests.title')}</h1>
        <div className="tabs">
          {tabs.map(([key, label, n]) => (
            <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              {label} · {n}
            </button>
          ))}
        </div>
      </div>

      <div className="contest-cards">
        {visible.map((c, i) => {
          const count = c.problemCount ?? c.problems.length
          return (
            <Link to={`/contest/${c.id}`} key={c.id} className="glass hoverable contest-card rise" style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="contest-rule-badge">{c.rule}</span>
              <div className="grow">
                <div className="row wrap" style={{ gap: '0.5rem' }}>
                  <h3>{pick(c.title, c.titleEn)}</h3>
                  {c.phase === 'running' && (
                    <span className="badge" style={{ color: 'var(--v-acced)', background: 'var(--v-acced-glow)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: 'currentColor', display: 'inline-block', animation: 'pulse-soft 1.4s infinite' }} />
                      {t('contests.running')}
                    </span>
                  )}
                  {c.rated && <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>{t('contests.rated')}</span>}
                </div>
                <div className="contest-meta">
                  <span><CalendarDays /> {fmtDateTime(c.startAt)}</span>
                  <span><Clock3 /> {fmtDuration(c.endAt - c.startAt)}</span>
                  <span><Users /> {t('home.participants', { n: c.participantCount })}</span>
                  {count > 0 && <span>{t('contests.problemsCount', { n: count })}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {c.phase === 'running' && (
                  <>
                    <div className="small faint">{t('contests.endsIn')}</div>
                    <Countdown target={c.endAt} />
                  </>
                )}
                {c.phase === 'upcoming' && (
                  <>
                    <div className="small faint">{t('contests.startsIn')}</div>
                    <Countdown target={c.startAt} />
                  </>
                )}
                {c.phase === 'finished' && (
                  <>
                    <div className="small faint">{t('contests.ended')}</div>
                    <div className="small muted">{fmtDateTime(c.endAt)}</div>
                  </>
                )}
              </div>
              <ChevronRight size={16} className="faint" />
            </Link>
          )
        })}
      </div>
      {visible.length === 0 && <div className="glass"><div className="empty">{t('common.empty')}</div></div>}
    </>
  )
}
