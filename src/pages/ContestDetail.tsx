import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, CalendarDays, Clock3, Users, Trophy, Megaphone, Inbox,
  CheckCircle2, MinusCircle, ExternalLink,
} from 'lucide-react'
import Countdown from '@/components/Countdown'
import UserLink from '@/components/UserLink'
import SafeHtml from '@/components/SafeHtml'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api, isMock } from '@/services/api'
import { useApi } from '@/services/useApi'
import { pick, fmtDateTime, fmtDuration } from '@/utils/i18nContent'
import type { StandingsRow } from '@/types'

type Tab = 'announcements' | 'problems' | 'standings'

export default function ContestDetail({ initialTab = 'announcements' }: { initialTab?: Tab }) {
  const { id } = useParams()
  const cid = Number(id)
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const detailRes = useApi(
    () => (user ? api.contest(cid) : Promise.reject(new Error('login required'))),
    [user?.name, cid],
  )
  const [tab, setTab] = useState<Tab>(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [cid, initialTab])

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看比赛" />
  if (detailRes.loading) return <Loading label="读取比赛…" />
  if (detailRes.error) return <ErrorState error={detailRes.error} onRetry={detailRes.reload} />
  const data = detailRes.data
  if (!data) return null
  const { contest, problems, standings, standingsError } = data

  return (
    <>
      <div className="rise" style={{ marginBottom: '1rem' }}>
        <Link to="/contests" className="row small muted" style={{ gap: '0.3rem', width: 'fit-content' }}>
          <ChevronLeft size={14} /> {t('contests.backToContests')}
        </Link>
      </div>

      {/* 赛事 hero */}
      <section className="glass contest-hero rise">
        <div className="row-between wrap" style={{ gap: '1rem' }}>
          <div className="grow" style={{ minWidth: '16rem' }}>
            <div className="row wrap" style={{ gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="contest-rule-badge" style={{ width: '2.6rem', height: '2.6rem', fontSize: '0.8rem' }}>{contest.rule}</span>
              <h1 style={{ fontSize: '1.4rem' }}>{pick(contest.title, contest.titleEn)}</h1>
              {contest.rated && <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>{t('contests.rated')}</span>}
              {contest.registered && <span className="badge" style={{ color: 'var(--v-acced)', background: 'var(--v-acced-glow)' }}>已报名</span>}
            </div>
            <div className="contest-meta" style={{ marginTop: '0.4rem' }}>
              <span><CalendarDays /> {fmtDateTime(contest.startAt)} → {fmtDateTime(contest.endAt)}</span>
              <span><Clock3 /> {fmtDuration(contest.endAt - contest.startAt)}</span>
              {contest.participantCount > 0 && <span><Users /> {t('home.participants', { n: contest.participantCount })}</span>}
              {problems.length > 0 && <span>{t('contests.problemsCount', { n: problems.length })}</span>}
            </div>
            {contest.descriptionHtml ? (
              <SafeHtml html={contest.descriptionHtml} className="statement statement-html" />
            ) : (
              <p className="muted" style={{ marginTop: '0.7rem', maxWidth: '42rem' }}>{pick(contest.description, contest.descriptionEn)}</p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {contest.phase === 'running' && (
              <>
                <div className="small faint">{t('contests.endsIn')}</div>
                <Countdown target={contest.endAt} />
                <div><button className="btn btn-primary btn-sm" style={{ marginTop: '0.6rem' }} onClick={() => setTab('problems')}>{t('contests.enterContest')}</button></div>
              </>
            )}
            {contest.phase === 'upcoming' && (
              <>
                <div className="small faint">{t('contests.startsIn')}</div>
                <Countdown target={contest.startAt} />
                <div>
                  {contest.registered ? (
                    <button className="btn btn-sm btn-ghost" style={{ marginTop: '0.6rem' }} disabled>
                      <CheckCircle2 size={14} /> {t('contests.registered')}
                    </button>
                  ) : (
                    <a className="btn btn-sm btn-primary" style={{ marginTop: '0.6rem' }} href={`/contest/${cid}/register`}>
                      {t('contests.register')} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </>
            )}
            {contest.phase === 'finished' && (
              <>
                <div className="small faint">{t('contests.ended')}</div>
                <div><button className="btn btn-primary btn-sm" style={{ marginTop: '0.6rem' }} onClick={() => setTab('standings')}>{t('contests.tabStandings')}</button></div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs rise" style={{ width: 'fit-content', marginBottom: '1rem' }}>
        {([
          ['announcements', t('contests.tabAnnouncements')],
          ['problems', t('contests.tabProblems')],
          ['standings', t('contests.tabStandings')],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'announcements' && (
        <section className="glass pad rise">
          <h2 className="card-title"><Megaphone size={16} /> {t('contests.tabAnnouncements')}</h2>
          {data.notices.length === 0 ? (
            <div className="empty"><Inbox /> {t('contests.noAnnouncements')}</div>
          ) : (
            data.notices.map((n) => (
              <div key={n.id} className="announce-item" style={{ alignItems: 'flex-start' }}>
                <span className="announce-date mono">{n.time}</span>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  {n.content && <SafeHtml html={n.content} className="statement statement-html small" />}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'problems' && (
        <section className="glass pad rise">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: '4rem' }}>{t('contests.contestProblem')}</th>
                  <th>{t('problems.colTitle')}</th>
                  <th style={{ width: '8rem' }} />
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => {
                    if (isMock) navigate(`/problem/${p.id}`)
                    else window.location.href = `/contest/${cid}/problem/${p.id}`
                  }}>
                    <td><span className="contest-rule-badge" style={{ width: '1.9rem', height: '1.9rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}>{String.fromCharCode(65 + p.pos)}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a
                        className="btn btn-sm btn-ghost"
                        href={isMock ? `/problem/${p.id}` : `/contest/${cid}/problem/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t('common.view')}
                      </a>
                      {p.myAcSubmissionId != null && <span className="ac-state done" style={{ marginLeft: 8 }}>✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'standings' && (
        <section className="glass pad rise">
          <h2 className="card-title"><Trophy size={16} /> {t('contests.tabStandings')} · {contest.rule}</h2>
          {standings && standings.length > 0 ? (
            <StandingsTable rows={standings} contestId={cid} rule={contest.rule} problemCount={problems.length} />
          ) : (
            <div className="empty">
              <Inbox /> {standingsError || t('contests.standingsEmpty')}
              <a className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} href={`/contest/${cid}/standings?native=1`}>
                <ExternalLink size={12} /> 原站榜单
              </a>
            </div>
          )}
        </section>
      )}
    </>
  )
}

function StandingsTable({
  rows,
  contestId,
  rule,
  problemCount,
}: {
  rows: StandingsRow[]
  contestId: number
  rule: string
  problemCount: number
}) {
  const { t } = useTranslation()
  const columnCount = problemCount || rows[0]?.cells.length || 0
  const letters = Array.from({ length: columnCount }, (_, i) => String.fromCharCode(65 + i))
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: '3.5rem' }}>{t('contests.standingsRank')}</th>
            <th style={{ minWidth: '8rem' }}>{t('contests.standingsUser')}</th>
            <th style={{ width: '4.5rem', textAlign: 'center' }}>{rule === 'ACM' ? t('contests.standingsSolved') : t('contests.standingsScore')}</th>
            {rule === 'ACM' && <th style={{ width: '5.5rem' }}>{t('contests.standingsPenalty')}</th>}
            {letters.map((letter) => (
              <th key={letter} style={{ textAlign: 'center' }}>{letter}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userName}>
              <td className={`mono ${r.rank === 1 ? 'medal-1' : r.rank === 2 ? 'medal-2' : r.rank === 3 ? 'medal-3' : 'faint'}`}>
                {r.rank}
              </td>
              <td><UserLink name={r.userName} /></td>
              <td className="standings-cell" style={{ fontWeight: 700 }}>
                {rule === 'ACM' ? r.solved : (r.totalScore ?? r.score)}
              </td>
              {rule === 'ACM' && <td className="mono muted">{r.penaltyMinutes}</td>}
              {r.cells.map((cell) => {
                if (rule !== 'ACM') {
                  return (
                    <td key={cell.problemId} className={`standings-cell ${cell.score > 0 ? 'solved' : 'faint'}`}>
                      {cell.score > 0 ? cell.score : <MinusCircle size={12} style={{ opacity: 0.35 }} />}
                    </td>
                  )
                }
                const solved = cell.score > 0
                return (
                  <td key={cell.problemId} className={`standings-cell ${solved ? 'solved' : 'faint'}`}>
                    {solved ? (
                      <>
                        <CheckCircle2 size={12} style={{ verticalAlign: '-2px' }} /> {cell.solvedAtMin}
                      </>
                    ) : (
                      <MinusCircle size={12} style={{ opacity: 0.35 }} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small faint" style={{ marginTop: '0.6rem' }}>contest #{contestId}</p>
    </div>
  )
}
