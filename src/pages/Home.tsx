import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Megaphone, Trophy, CalendarDays, ChevronRight, Sparkles, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import Waves from '@/components/Waves'
import UserLink from '@/components/UserLink'
import { CONTESTS } from '@/mock/contests'
import { ANNOUNCEMENTS } from '@/mock/news'
import { USERS, avatarStyle, ratingTier } from '@/mock/users'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { pick, fmtShortTime } from '@/utils/i18nContent'
import type { CSSProperties } from 'react'

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

function Banner() {
  const { t } = useTranslation()
  const { hue, mode } = useTheme()
  const dark = mode === 'dark'
  const [cur, setCur] = useState(0)
  const taglines = useMemo(
    () => [t('home.bannerTagline1'), t('home.bannerTagline2', { n: USERS.length }), t('home.bannerTagline3')],
    [t],
  )

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

/* ---------- 排行榜卡片（由 /ranking 页并入） ---------- */
function LeaderboardCard() {
  const { t } = useTranslation()
  const sorted = useMemo(() => [...USERS].sort((a, b) => b.rating - a.rating), [])

  const deltaOf = (u: (typeof USERS)[number]) => {
    const h = u.ratingHistory
    return h.length >= 2 ? h[h.length - 1] - h[h.length - 2] : 0
  }

  return (
    <section className="glass pad rise" style={{ animationDelay: '0.1s' }}>
      <h2 className="card-title">
        <Trophy size={17} /> {t('ranking.title')}
        <span className="small faint" style={{ marginLeft: 'auto', fontWeight: 400 }}>{t('ranking.subtitle')}</span>
      </h2>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: '4rem' }}>{t('ranking.colRank')}</th>
              <th style={{ minWidth: '9rem' }}>{t('ranking.colUser')}</th>
              <th style={{ width: '6rem' }}>{t('ranking.colRating')}</th>
              <th style={{ width: '6rem' }}>{t('ranking.colDelta')}</th>
              <th style={{ width: '6rem' }}>{t('ranking.colAc')}</th>
              <th style={{ width: '7rem' }}>{t('ranking.colSchool')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => {
              const rank = i + 1
              const delta = deltaOf(u)
              const tier = ratingTier(u.rating)
              return (
                <tr key={u.id}>
                  <td className={`mono ${rank === 1 ? 'medal-1' : rank === 2 ? 'medal-2' : rank === 3 ? 'medal-3' : 'faint'}`}>
                    {rank}
                  </td>
                  <td><UserLink name={u.name} size={24} /></td>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: `var(--d${tier})` }}>{u.rating}</span>
                  </td>
                  <td>
                    <span className={`rating-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'faint'}`}>
                      {delta > 0 ? <TrendingUp size={13} style={{ verticalAlign: '-2px' }} /> : delta < 0 ? <TrendingDown size={13} style={{ verticalAlign: '-2px' }} /> : <Minus size={13} style={{ verticalAlign: '-2px' }} />}
                      {' '}{delta > 0 ? `+${delta}` : delta}
                    </span>
                  </td>
                  <td className="mono">{u.acCount}</td>
                  <td className="small muted">{u.school}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- 首页主体 ---------- */
export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const upcoming = useMemo(
    () => CONTESTS.filter((c) => c.phase !== 'finished').sort((a, b) => a.startAt - b.startAt).slice(0, 3),
    [],
  )

  return (
    <>
      <Banner />

      <div className="home-grid">
        {/* 左列 */}
        <div className="stack">
          <section className="glass pad rise" style={{ animationDelay: '0.05s' }}>
            <h2 className="card-title"><Megaphone size={17} /> {t('home.announcements')}</h2>
            {ANNOUNCEMENTS.map((a) => (
              <Link to="/discuss" key={a.id} className="announce-item">
                <span className="announce-date">{a.date}</span>
                <span className="grow">
                  {a.pinned && (
                    <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)', marginRight: 6 }}>PIN</span>
                  )}
                  {pick(a.title, a.titleEn)}
                </span>
                <ChevronRight size={14} className="faint" />
              </Link>
            ))}
          </section>

          <LeaderboardCard />
        </div>

        {/* 右列 */}
        <div className="stack">
          {user ? (
            <section className="glass pad rise" style={{ animationDelay: '0.05s' }}>
              <div className="profile-mini">
                <span className="avatar" style={avatarStyle(user.name, 52)}>{user.name.slice(0, 1).toUpperCase()}</span>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div className="small muted">
                    Rating · <b style={{ color: `var(--d${ratingTier(user.rating)})` }}>{user.rating}</b>
                  </div>
                  <div className="small faint">{t('user.statAc')} · {user.acCount}</div>
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/user/${user.name}`)}>
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
            <div className="stack" style={{ gap: '0.55rem' }}>
              {upcoming.map((c) => (
                <Link to={`/contests/${c.id}`} key={c.id} className="glass hoverable" style={{ padding: '0.7rem 0.9rem', background: 'var(--glass-soft)', boxShadow: 'none' }}>
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
          </section>
        </div>
      </div>
    </>
  )
}
