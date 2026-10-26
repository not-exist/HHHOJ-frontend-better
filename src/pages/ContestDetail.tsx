import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, CalendarDays, Clock3, Users, Trophy, Megaphone, Inbox,
  CheckCircle2, XCircle, MinusCircle,
} from 'lucide-react'
import Countdown from '@/components/Countdown'
import DifficultyTag from '@/components/DifficultyTag'
import UserLink from '@/components/UserLink'
import { CONTESTS, standingsFor } from '@/mock/contests'
import { PROBLEMS } from '@/mock/problems'
import { useAuth } from '@/context/AuthContext'
import { pick, fmtDateTime, fmtDuration } from '@/utils/i18nContent'
import { showToast } from '@/components/Toast'
import type { StandingsRow } from '@/types'

type Tab = 'announcements' | 'problems' | 'standings'

export default function ContestDetail() {
  const { id } = useParams()
  const cid = Number(id)
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const contest = useMemo(() => CONTESTS.find((c) => c.id === cid), [cid])
  const standings = useMemo(() => (contest ? standingsFor(contest) : []), [contest])
  const [tab, setTab] = useState<Tab>('announcements')
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    setTab('announcements')
    setRegistered(false)
  }, [cid])

  if (!contest) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <p>{t('contests.backToContests')}</p>
        <Link to="/contests" className="btn btn-primary btn-sm"><ChevronLeft size={14} /> {t('contests.title')}</Link>
      </div>
    )
  }

  const register = () => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      return
    }
    setRegistered(true)
    showToast(t('contests.registered') + ' ✓')
  }

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
            </div>
            <div className="contest-meta" style={{ marginTop: '0.4rem' }}>
              <span><CalendarDays /> {fmtDateTime(contest.startAt)} → {fmtDateTime(contest.endAt)}</span>
              <span><Clock3 /> {fmtDuration(contest.endAt - contest.startAt)}</span>
              <span><Users /> {t('home.participants', { n: contest.participantCount + (registered ? 1 : 0) })}</span>
              <span>{t('contests.problemsCount', { n: contest.problems.length })}</span>
            </div>
            <p className="muted" style={{ marginTop: '0.7rem', maxWidth: '42rem' }}>{pick(contest.description, contest.descriptionEn)}</p>
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
                  <button
                    className={`btn btn-sm ${registered ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ marginTop: '0.6rem' }}
                    disabled={registered || contest.phase !== 'upcoming'}
                    onClick={register}
                  >
                    {registered ? <><CheckCircle2 size={14} /> {t('contests.registered')}</> : t('contests.register')}
                  </button>
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
          {contest.announcements.length === 0 ? (
            <div className="empty"><Inbox /> {t('contests.noAnnouncements')}</div>
          ) : (
            contest.announcements.map((a, i) => (
              <div key={i} className="announce-item">
                <span className="announce-date mono">{a.time}</span>
                <span>{a.text}</span>
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
                  <th style={{ width: '7rem' }}>{t('problems.colDifficulty')}</th>
                  <th style={{ width: '8rem' }} />
                </tr>
              </thead>
              <tbody>
                {contest.problems.map((pid, i) => {
                  const p = PROBLEMS.find((x) => x.id === pid)
                  if (!p) return null
                  return (
                    <tr key={pid} className="clickable" onClick={() => navigate(`/problems/${pid}`)}>
                      <td><span className="contest-rule-badge" style={{ width: '1.9rem', height: '1.9rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}>{String.fromCharCode(65 + i)}</span></td>
                      <td style={{ fontWeight: 600 }}>{pick(p.title, p.titleEn)}</td>
                      <td><DifficultyTag difficulty={p.difficulty} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/problems/${pid}`} className="btn btn-sm btn-ghost" onClick={(e) => e.stopPropagation()}>
                          {t('common.view')}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'standings' && (
        <section className="glass pad rise">
          <h2 className="card-title"><Trophy size={16} /> {t('contests.tabStandings')} · {contest.rule}</h2>
          {standings.length === 0 ? (
            <div className="empty"><Inbox /> {t('contests.standingsEmpty')}</div>
          ) : (
            <StandingsTable rows={standings} contestId={cid} rule={contest.rule} />
          )}
        </section>
      )}
    </>
  )
}

function StandingsTable({ rows, contestId, rule }: { rows: StandingsRow[]; contestId: number; rule: string }) {
  const { t } = useTranslation()
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: '3.5rem' }}>{t('contests.standingsRank')}</th>
            <th style={{ minWidth: '8rem' }}>{t('contests.standingsUser')}</th>
            <th style={{ width: '4.5rem', textAlign: 'center' }}>{rule === 'ACM' ? t('contests.standingsSolved') : t('contests.standingsScore')}</th>
            {rule === 'ACM' && <th style={{ width: '5.5rem' }}>{t('contests.standingsPenalty')}</th>}
            {rows[0]?.cells.map((cell, i) => (
              <th key={cell.problemId} style={{ textAlign: 'center' }}>{String.fromCharCode(65 + i)}</th>
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
                {rule === 'ACM' ? r.solved : r.score}
                {rule === 'ACM' && <span className="try">{r.penaltyMinutes}</span>}
              </td>
              {rule === 'ACM' && <td className="mono muted">{r.penaltyMinutes}</td>}
              {r.cells.map((cell) => {
                const solved = cell.solvedAtMin != null
                return (
                  <td key={cell.problemId} className={`standings-cell ${solved ? 'solved' : cell.attempts > 0 ? 'tried' : 'faint'}`}>
                    {solved ? (
                      <>
                        <CheckCircle2 size={12} style={{ verticalAlign: '-2px' }} /> {cell.solvedAtMin}
                        <span className="try">×{cell.attempts}</span>
                      </>
                    ) : cell.attempts > 0 ? (
                      <>
                        <XCircle size={12} style={{ verticalAlign: '-2px' }} /> -{cell.attempts}
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
