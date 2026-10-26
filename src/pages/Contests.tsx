import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Users, Clock3, ChevronRight } from 'lucide-react'
import Countdown from '@/components/Countdown'
import { CONTESTS } from '@/mock/contests'
import { pick, fmtDateTime, fmtDuration } from '@/utils/i18nContent'
import type { ContestPhase } from '@/types'

type TabKey = ContestPhase | 'all'

export default function Contests() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabKey>('all')

  const list = CONTESTS.filter((c) => tab === 'all' || c.phase === tab)
    .sort((a, b) => {
      const order: Record<ContestPhase, number> = { running: 0, upcoming: 1, finished: 2 }
      return order[a.phase] - order[b.phase] || a.startAt - b.startAt
    })

  const tabs: [TabKey, string, number][] = [
    ['all', t('common.all'), CONTESTS.length],
    ['running', t('contests.running'), CONTESTS.filter((c) => c.phase === 'running').length],
    ['upcoming', t('contests.upcoming'), CONTESTS.filter((c) => c.phase === 'upcoming').length],
    ['finished', t('contests.finished'), CONTESTS.filter((c) => c.phase === 'finished').length],
  ]

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
        {list.map((c, i) => (
          <Link to={`/contests/${c.id}`} key={c.id} className="glass hoverable contest-card rise" style={{ animationDelay: `${i * 0.04}s` }}>
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
                <span>{t('contests.problemsCount', { n: c.problems.length })}</span>
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
        ))}
      </div>
    </>
  )
}
