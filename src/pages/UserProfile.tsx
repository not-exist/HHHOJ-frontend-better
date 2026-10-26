import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, CalendarDays, GraduationCap, Target, Send, Percent, Activity, MessageSquare, Inbox } from 'lucide-react'
import DifficultyTag from '@/components/DifficultyTag'
import RatingChart from '@/components/RatingChart'
import UserLink from '@/components/UserLink'
import { EmptyState, ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { useApi } from '@/services/useApi'
import { avatarStyle, ratingTier, RATING_VARS } from '@/utils/user'
import { pick } from '@/utils/i18nContent'
import type { Submission } from '@/types'

type Tab = 'solved' | 'submissions' | 'threads'

export default function UserProfile() {
  const { name } = useParams()
  const username = decodeURIComponent(name ?? '')
  const { t } = useTranslation()
  const { user: me, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('solved')

  const profileRes = useApi(
    () => (me ? api.user(username) : Promise.resolve(undefined)),
    [me?.name, username],
  )
  const profile = profileRes.data
  const user = profile?.user

  if (authLoading) return <Loading label="读取会话…" />
  if (!me) return <LoginRequired text="登录后查看用户资料" />
  if (profileRes.loading) return <Loading label="读取用户资料…" />
  if (profileRes.error) return <ErrorState error={profileRes.error} onRetry={profileRes.reload} />
  if (!profile || !user) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <p>{t('user.notFound')}</p>
        <Link to="/" className="btn btn-primary btn-sm">{t('notfound.backHome')}</Link>
      </div>
    )
  }

  const tier = ratingTier(user.rating)
  const rate = Math.round((user.acCount / Math.max(1, user.submissionCount)) * 100)
  const stats = [
    { icon: Target, label: t('user.statRating'), value: user.rating, color: `var(${RATING_VARS[tier]})` },
    { icon: Activity, label: t('user.statAc'), value: user.acCount, color: 'var(--primary)' },
    { icon: Send, label: t('user.statSubmissions'), value: profile.submissionsTotal || user.submissionCount, color: 'var(--primary)' },
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
              <h1 style={{ fontSize: '1.5rem' }}>
                <UserLink name={user.name} link={false} />
              </h1>
              <span className="badge" style={{ color: `var(${RATING_VARS[tier]})`, background: 'var(--primary-soft)' }}>
                {user.rating}
              </span>
              {profile.groups.map((g) => (
                <span key={g.name} className="tag-chip" title={g.note}>{g.name}</span>
              ))}
            </div>
            <p className="muted" style={{ marginTop: '0.3rem' }}>{pick(user.bio, user.bioEn) || '—'}</p>
            <div className="row wrap small faint" style={{ marginTop: '0.5rem', gap: '1rem' }}>
              <span><CalendarDays size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('user.joined')} {user.joinedAt || '—'}</span>
              <span><GraduationCap size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{user.school || '—'}</span>
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
        <RatingChart username={user.name} history={profile.ratingHistory} current={user.rating} />
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
            {profile.solved.length > 0 ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: '5rem' }}>#</th>
                    <th>{t('problems.colTitle')}</th>
                    <th style={{ width: '7rem' }}>{t('problems.colDifficulty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.solved.map((p) => (
                    <tr key={p.id}>
                      <td className="mono faint">#{p.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <Link to={`/problem/${p.id}`}>{pick(p.title, p.titleEn)}</Link>
                      </td>
                      <td>{p.difficultyKnown === false ? <span className="faint">—</span> : <DifficultyTag difficulty={p.difficulty} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState text={t('user.noSolved')} icon={Inbox} />
            )}
          </div>
        )}

        {tab === 'submissions' && (
          <div className="table-wrap">
            {profile.submissions.length > 0 ? (
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
                  {profile.submissions.slice(0, 20).map((s: Submission) => (
                    <tr key={s.id} className="clickable">
                      <td className="mono faint">{s.id}</td>
                      <td style={{ fontWeight: 600 }}><Link to={`/problem/${s.problemId}`}>#{s.problemId}</Link></td>
                      <td><span className="mono" style={{ color: s.verdict === 'Accepted' ? 'var(--v-acced)' : 'var(--v-wrong)' }}>{t(`verdict.${s.verdict}Short`)}</span></td>
                      <td className="mono">{s.timeMs ?? '—'}</td>
                      <td className="mono">{s.language === '/' ? '—' : s.language}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState text={t('status.noSubmissions')} icon={Send} />
            )}
            <div style={{ textAlign: 'right', marginTop: '0.6rem' }}>
              <Link to={`/submissions?submitter=${encodeURIComponent(user.name)}`} className="btn btn-sm btn-ghost">{t('user.viewStatus')}</Link>
            </div>
          </div>
        )}

        {tab === 'threads' && (
          <div className="stack" style={{ gap: 0 }}>
            {profile.threads.length > 0 ? (
              profile.threads.map((th) => (
                <Link key={th.id} to={`/blogs/${th.id}`} className="row-between hoverable" style={{ padding: '0.7rem 0.5rem', borderRadius: '0.6rem' }}>
                  <span style={{ fontWeight: 600 }}><MessageSquare size={13} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--primary)' }} />{pick(th.title, th.titleEn)}</span>
                  <span className="small faint">{th.createdAt}</span>
                </Link>
              ))
            ) : (
              <EmptyState text={t('discuss.noThreads')} icon={MessageSquare} />
            )}
          </div>
        )}
      </section>
    </>
  )
}
