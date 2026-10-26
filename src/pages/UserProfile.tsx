import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronLeft, CalendarDays, GraduationCap, Target, Send, Percent, Activity, MessageSquare } from 'lucide-react'
import UserLink from '@/components/UserLink'
import DifficultyTag from '@/components/DifficultyTag'
import { USERS, avatarStyle } from '@/mock/users'
import { PROBLEMS } from '@/mock/problems'
import { THREADS } from '@/mock/discuss'
import { submissionStore } from '@/services/store'
import { pick } from '@/utils/i18nContent'

type Tab = 'solved' | 'submissions' | 'threads'

export default function UserProfile() {
  const { name } = useParams()
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('solved')

  const user = useMemo(() => USERS.find((u) => u.name.toLowerCase() === (name ?? '').toLowerCase()), [name])

  const mySubs = useMemo(
    () => (user ? submissionStore.all.filter((s) => s.userName === user.name) : []),
    [user],
  )
  const myThreads = useMemo(
    () => (user ? THREADS.filter((th) => th.author === user.name) : []),
    [user],
  )

  if (!user) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <p>{t('user.notFound')}</p>
        <Link to="/" className="btn btn-primary btn-sm">{t('notfound.backHome')}</Link>
      </div>
    )
  }

  const tier = Math.min(5, Math.floor((user.rating - 700) / 400))
  const rate = Math.round((user.acCount / Math.max(1, user.submissionCount)) * 100)
  const chartData = user.ratingHistory.map((r, i) => ({ name: `#${i + 1}`, rating: r }))

  const stats = [
    { icon: Target, label: t('user.statRating'), value: user.rating, color: `var(--d${Math.min(5, tier)})` },
    { icon: Activity, label: t('user.statAc'), value: user.acCount, color: 'var(--primary)' },
    { icon: Send, label: t('user.statSubmissions'), value: user.submissionCount, color: 'var(--primary)' },
    { icon: Percent, label: t('user.statRate'), value: `${rate}%`, color: 'var(--primary)' },
  ]

  return (
    <>
      <div className="rise" style={{ marginBottom: '1rem' }}>
        <Link to="/" className="row small muted" style={{ gap: '0.3rem', width: 'fit-content' }}>
          <ChevronLeft size={14} /> {t('common.back')}
        </Link>
      </div>

      {/* 资料卡 */}
      <section className="glass user-hero rise">
        <div className="row wrap" style={{ gap: '1.2rem', position: 'relative' }}>
          <span className="avatar" style={avatarStyle(user.name, 74)}>{user.name.slice(0, 1).toUpperCase()}</span>
          <div className="grow">
            <div className="row wrap" style={{ gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.5rem', color: `var(--d${Math.min(5, tier)})` }}>{user.name}</h1>
              <span className="badge" style={{ color: `var(--d${Math.min(5, tier)})`, background: `var(--d${Math.min(5, tier)}-soft, var(--primary-soft))` }}>
                {user.rating}
              </span>
            </div>
            <p className="muted" style={{ marginTop: '0.3rem' }}>{pick(user.bio, user.bioEn)}</p>
            <div className="row wrap small faint" style={{ marginTop: '0.5rem', gap: '1rem' }}>
              <span><CalendarDays size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('user.joined')} {user.joinedAt}</span>
              <span><GraduationCap size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{user.school}</span>
            </div>
          </div>
        </div>
        <div className="user-stats" style={{ position: 'relative', marginTop: '1.3rem' }}>
          {stats.map((s) => (
            <div className="stat-tile" key={s.label}>
              <b style={{ color: s.color }}>{s.value}</b>
              <span className="row" style={{ gap: '0.3rem' }}><s.icon size={12} /> {s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rating 曲线 */}
      <section className="glass pad rise" style={{ marginBottom: '1.25rem', animationDelay: '0.05s' }}>
        <h2 className="card-title"><Activity size={16} /> {t('user.ratingCurve')}</h2>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} stroke="var(--border)" />
              <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fill: 'var(--text-3)', fontSize: 11 }} stroke="var(--border)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--glass-strong)', border: '1px solid var(--border-strong)',
                  borderRadius: 12, color: 'var(--text-1)', fontSize: 13,
                }}
              />
              <Area type="monotone" dataKey="rating" stroke="var(--primary)" strokeWidth={2.5} fill="url(#ratingFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs rise" style={{ width: 'fit-content', marginBottom: '1rem' }}>
        {([
          ['solved', t('user.tabSolved')],
          ['submissions', t('user.tabSubmissions')],
          ['threads', t('user.tabThreads')],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <section className="glass pad rise" style={{ animationDelay: '0.1s' }}>
        {tab === 'solved' && (
          <div className="table-wrap">
            {PROBLEMS.length > 0 ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '5rem' }}>#</th>
                    <th>{t('problems.colTitle')}</th>
                    <th style={{ width: '7rem' }}>{t('problems.colDifficulty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {PROBLEMS.slice(0, Math.max(3, Math.min(PROBLEMS.length, Math.ceil(user.acCount / 18)))).map((p) => (
                    <tr key={p.id}>
                      <td className="mono faint">#{p.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/problems/${p.id}`}>{pick(p.title, p.titleEn)}</Link>
                      </td>
                      <td><DifficultyTag difficulty={p.difficulty} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty">{t('user.noSolved')}</p>
            )}
          </div>
        )}

        {tab === 'submissions' && (
          <div className="table-wrap">
            {mySubs.length > 0 ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '4.5rem' }}>#</th>
                    <th>{t('status.colProblem')}</th>
                    <th style={{ width: '10rem' }}>{t('status.colVerdict')}</th>
                    <th style={{ width: '6rem' }}>{t('status.colTime')}</th>
                    <th style={{ width: '6rem' }}>{t('status.colLanguage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubs.slice(0, 12).map((s) => (
                    <tr key={s.id} className="clickable">
                      <td className="mono faint">{s.id}</td>
                      <td style={{ fontWeight: 600 }}><Link to={`/problems/${s.problemId}`}>#{s.problemId}</Link></td>
                      <td><span className="mono" style={{ color: s.verdict === 'Accepted' ? 'var(--v-acced)' : 'var(--v-wrong)' }}>{t(`verdict.${s.verdict}Short`)}</span></td>
                      <td className="mono">{s.timeMs ?? '—'}</td>
                      <td className="mono">{s.language}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty">{t('status.noSubmissions')} · <Link to="/problems">{t('problems.title')}</Link></p>
            )}
            <div style={{ textAlign: 'right', marginTop: '0.6rem' }}>
              <Link to="/status?mine=1" className="btn btn-sm btn-ghost">{t('user.viewStatus')}</Link>
            </div>
          </div>
        )}

        {tab === 'threads' && (
          <div className="stack" style={{ gap: 0 }}>
            {myThreads.length > 0 ? (
              myThreads.map((th) => (
                <Link key={th.id} to={`/discuss/${th.id}`} className="row-between hoverable" style={{ padding: '0.7rem 0.5rem', borderRadius: '0.6rem' }}>
                  <span style={{ fontWeight: 600 }}><MessageSquare size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--primary)' }} />{pick(th.title, th.titleEn)}</span>
                  <span className="small faint">{th.createdAt}</span>
                </Link>
              ))
            ) : (
              <p className="empty">{t('discuss.noThreads')}</p>
            )}
          </div>
        )}
      </section>
    </>
  )
}
