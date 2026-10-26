import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Megaphone, Trophy, CalendarDays, ChevronRight, Sparkles, Inbox,
} from 'lucide-react'
import Waves from '@/components/Waves'
import UserLink from '@/components/UserLink'
import { ErrorState, Loading } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { api, isAuthError } from '@/services/api'
import { useApi } from '@/services/useApi'
import { pick, fmtShortTime } from '@/utils/i18nContent'
import { ratingTier, RATING_VARS, avatarStyle } from '@/utils/user'
import type { CSSProperties } from 'react'
import type { RanklistRow } from '@/types'

/* ---------- Banner：Ken Burns 渐变壁纸轮播（明暗两套气质） ---------- */
const SLIDES: ((h: number, dark: boolean) => CSSProperties)[] = [
  (h, dark) => ({
    '--bw-base': dark ? `hsl(${h} 45% 10%)` : `hsl(${h} 75% 86%)`,
    '--bw-a': `hsl(${h} ${dark ? 88 : 90}% ${dark ? 62 : 70}% / ${dark ? 0.55 : 0.6})`,
    '--bw-b': `hsl(${h + 60} ${dark ? 82 : 85}% ${dark ? 58 : 76}% / ${dark ? 0.5 : 0.55})`,
    '--bw-c': `hsl(${h - 50} ${dark ? 85 : 88}% ${dark ? 48 : 64}% / ${dark ? 0.5 : 0.5})`,
  } as CSSProperties),
  (h, dark) => ({
    '--bw-base': dark ? `hsl(${h + 70} 45% 9%)` : `hsl(${h + 70} 70% 84%)`,
    '--bw-a': `hsl(${h + 70} ${dark ? 85 : 88}% ${dark ? 60 : 70}% / ${dark ? 0.5 : 0.55})`,
    '--bw-b': `hsl(${h + 150} ${dark ? 80 : 82}% ${dark ? 55 : 72}% / ${dark ? 0.45 : 0.5})`,
    '--bw-c': `hsl(${h} ${dark ? 90 : 90}% ${dark ? 55 : 64}% / ${dark ? 0.45 : 0.5})`,
  } as CSSProperties),
  (h, dark) => ({
    '--bw-base': dark ? `hsl(${h - 70} 40% 9%)` : `hsl(${h - 70} 65% 85%)`,
    '--bw-a': `hsl(${h - 70} ${dark ? 85 : 85}% ${dark ? 58 : 68}% / ${dark ? 0.5 : 0.55})`,
    '--bw-b': `hsl(${h} ${dark ? 90 : 88}% ${dark ? 60 : 66}% / ${dark ? 0.5 : 0.5})`,
    '--bw-c': `hsl(${h + 40} ${dark ? 80 : 82}% ${dark ? 50 : 70}% / ${dark ? 0.45 : 0.5})`,
  } as CSSProperties),
]

function Typewriter({ lines }: { lines: string[] }) {
  const [text, setText] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const line = lines[idx % lines.length] ?? ''
    let i = 0
    let timer = 0
    let holdTimer = 0
    const type = () => {
      i++
      setText(line.slice(0, i))
      if (i < line.length) {
        timer = window.setTimeout(type, 55)
      } else {
        holdTimer = window.setTimeout(() => setIdx((v) => v + 1), 3200)
      }
    }
    type()
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(holdTimer)
    }
  }, [idx, lines])

  return (
    <div className="banner-sub">
      {text}
      <span className="caret">|</span>
    </div>
  )
}

function Banner({ memberCount }: { memberCount: number }) {
  const { t } = useTranslation()
  const { hue, mode } = useTheme()
  const dark = mode === 'dark'
  const [cur, setCur] = useState(0)
  const taglines = useMemo(() => {
    const base = [t('home.bannerTagline1'), t('home.bannerTagline3')]
    if (memberCount > 0) base.splice(1, 0, t('home.bannerTagline2', { n: memberCount }))
    return base
  }, [t, memberCount])

  useEffect(() => {
    const timer = window.setInterval(() => setCur((v) => (v + 1) % SLIDES.length), 8000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="banner rise">
      {SLIDES.map((mk, i) => (
        <div key={i} className={`banner-slide ${i === cur ? 'on' : ''}`} style={mk(hue, dark)} />
      ))}
      <div className="banner-veil" />
      <div className="banner-content">
        <div className="banner-card">
          <h1 className="banner-title">{t('home.heroTitle')}</h1>
          <Typewriter lines={taglines} />
        </div>
      </div>
      <div className="banner-dots">
        {SLIDES.map((_, i) => (
          <button key={i} className={i === cur ? 'on' : ''} onClick={() => setCur(i)} aria-label={`slide ${i + 1}`} />
        ))}
      </div>
      <Waves />
    </section>
  )
}

/* ---------- 排行榜卡片：用户 rating 榜 + AC 数 ---------- */
function LeaderboardCard({ rows, acRows }: { rows: RanklistRow[]; acRows: RanklistRow[] }) {
  const { t } = useTranslation()
  const acOf = useMemo(() => new Map(acRows.map((r) => [r.username, r.acNum ?? 0])), [acRows])

  return (
    <section className="glass pad rise" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">
        <Trophy size={17} /> {t('ranking.title')}
        <span className="small faint" style={{ marginLeft: 'auto', fontWeight: 400 }}>{t('ranking.subtitle')}</span>
      </h2>
      {rows.length === 0 ? (
        <div className="empty"><Inbox /> {t('common.empty')}</div>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '4rem' }}>{t('ranking.colRank')}</th>
                <th style={{ minWidth: '9rem' }}>{t('ranking.colUser')}</th>
                <th style={{ width: '6rem' }}>{t('ranking.colRating')}</th>
                <th style={{ width: '6rem' }}>{t('ranking.colAc')}</th>
                <th style={{ width: '8rem' }}>{t('ranking.colSchool')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((u) => {
                const tier = ratingTier(u.rating ?? 0)
                return (
                  <tr key={u.username}>
                    <td className={`mono ${u.rank === 1 ? 'medal-1' : u.rank === 2 ? 'medal-2' : u.rank === 3 ? 'medal-3' : 'faint'}`}>
                      {u.rank}
                    </td>
                    <td><UserLink name={u.username} size={24} rating={u.rating} /></td>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: `var(${RATING_VARS[tier]})` }}>{u.rating ?? 0}</span>
                    </td>
                    <td className="mono">{acOf.get(u.username) ?? u.acNum ?? 0}</td>
                    <td className="small muted">{u.realname || u.motto || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/* ---------- 首页主体 ---------- */
export default function Home() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const home = useApi(() => api.home(), [])
  const contests = useApi(
    () => (user ? api.contests() : Promise.resolve([])),
    [user?.name],
  )

  const upcoming = useMemo(
    () => contests.data?.filter((c) => c.phase !== 'finished').sort((a, b) => a.startAt - b.startAt).slice(0, 3) ?? [],
    [contests.data],
  )

  return (
    <>
      <Banner memberCount={home.data?.userRanklist.length ?? 0} />

      <div className="home-grid">
        {/* 左列 */}
        <div className="stack">
          <section className="glass pad rise" style={{ animationDelay: '0.05s' }}>
            <h2 className="card-title"><Megaphone size={17} /> {t('home.announcements')}</h2>
            {home.loading ? (
              <Loading label="读取公告…" />
            ) : home.error ? (
              <ErrorState error={home.error} onRetry={home.reload} />
            ) : (home.data?.announcements.length ?? 0) === 0 ? (
              <div className="empty"><Inbox /> {t('common.empty')}</div>
            ) : (
              home.data!.announcements.map((a) => (
                <Link to={`/blogs/${a.id}`} key={a.id} className="announce-item">
                  <span className="announce-date">{a.date}</span>
                  <span className="grow">
                    {a.pinned && (
                      <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)', marginRight: 6 }}>PIN</span>
                    )}
                    {pick(a.title, a.titleEn)}
                  </span>
                  <ChevronRight size={14} className="faint" />
                </Link>
              ))
            )}
          </section>

          {home.loading ? (
            <div className="glass pad"><Loading label="读取排行榜…" /></div>
          ) : home.error ? (
            <ErrorState error={home.error} onRetry={home.reload} />
          ) : (
            <LeaderboardCard
              rows={home.data?.userRanklist ?? []}
              acRows={home.data?.problemRanklist ?? []}
            />
          )}
        </div>

        {/* 右列 */}
        <div className="stack">
          {authLoading ? (
            <div className="glass pad"><Loading label="读取会话…" /></div>
          ) : user ? (
            <section className="glass pad rise" style={{ animationDelay: '0.05s' }}>
              <div className="profile-mini">
                <span className="avatar" style={avatarStyle(user.name, 52)}>{user.name.slice(0, 1).toUpperCase()}</span>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>
                    <UserLink name={user.name} link={false} />
                  </div>
                  <div className="small muted">
                    Rating · <b style={{ color: `var(${RATING_VARS[ratingTier(user.rating)]})` }}>{user.rating}</b>
                  </div>
                  <div className="small faint">{t('user.statAc')} · {user.acCount}</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/user/profile/${encodeURIComponent(user.name)}`)}>
                  {t('common.view')}
                </button>
              </div>
            </section>
          ) : (
            <section className="glass pad rise" style={{ animationDelay: '0.05s', textAlign: 'center' }}>
              <Sparkles size={22} style={{ color: 'var(--primary)', margin: '0.4rem auto 0.5rem' }} />
              <div style={{ fontWeight: 700, marginBottom: '0.8rem' }}>{t('common.tagline')}</div>
              <div className="row" style={{ justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
              </div>
            </section>
          )}

          <section className="glass pad rise" style={{ animationDelay: '0.1s' }}>
            <h2 className="card-title"><CalendarDays size={17} /> {t('home.upcomingContests')}</h2>
            {!user ? (
              <div className="empty" style={{ padding: '1.2rem' }}>
                {t('common.pleaseLogin')} · <Link to="/login">{t('nav.login')}</Link>
              </div>
            ) : contests.loading ? (
              <Loading label="读取比赛…" />
            ) : contests.error ? (
              isAuthError(contests.error) ? (
                <div className="empty" style={{ padding: '1.2rem' }}>{t('common.pleaseLogin')}</div>
              ) : (
                <ErrorState error={contests.error} onRetry={contests.reload} />
              )
            ) : upcoming.length === 0 ? (
              <div className="empty"><Inbox /> {t('common.empty')}</div>
            ) : (
              <div className="stack" style={{ gap: '0.55rem' }}>
                {upcoming.map((c) => (
                  <Link to={`/contest/${c.id}`} key={c.id} className="glass hoverable" style={{ padding: '0.7rem 0.9rem', background: 'var(--glass-soft)', boxShadow: 'none' }}>
                    <div className="row-between">
                      <b style={{ fontSize: '0.9rem' }}>{pick(c.title, c.titleEn)}</b>
                      {c.phase === 'running' ? (
                        <span className="badge" style={{ color: 'var(--v-acced)', background: 'var(--v-acced-glow)' }}>{t('home.liveNow')}</span>
                      ) : (
                        <span className="small faint mono">{fmtShortTime(c.startAt)}</span>
                      )}
                    </div>
                    <div className="small faint" style={{ marginTop: '0.2rem' }}>
                      {t(`contests.rule${c.rule}`)} · {t('home.registering', { n: c.participantCount })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
