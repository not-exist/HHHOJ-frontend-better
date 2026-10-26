import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, RotateCcw, Inbox } from 'lucide-react'
import DifficultyTag from '@/components/DifficultyTag'
import Pagination from '@/components/Pagination'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { DIFFICULTY_KEYS } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { api, isAuthError } from '@/services/api'
import { useApi } from '@/services/useApi'
import { pick } from '@/utils/i18nContent'

const PAGE_SIZE = 12

export default function Problems() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const problems = useApi(() => api.problems(), [])
  const mySubs = useApi(
    () => (user ? api.submissions({ submitter: user.name, size: 100 }) : Promise.resolve({ items: [], total: 0 })),
    [user?.name],
  )

  const [q, setQ] = useState('')
  const [diff, setDiff] = useState<string>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [state, setState] = useState<'all' | 'solved' | 'tried'>('all')
  const [page, setPage] = useState(1)

  const list = problems.data ?? []
  const allTags = useMemo(() => Array.from(new Set(list.flatMap((p) => p.tags))).slice(0, 40), [list])

  // 我的状态：AC 直接看题库的 my_best_ac_submission_id，尝试中的从最近提交推导
  const myState = useMemo(() => {
    const solved = new Set<number>()
    const tried = new Set<number>()
    for (const p of list) if (p.myBestAcSubmissionId != null) solved.add(p.id)
    for (const s of mySubs.data?.items ?? []) {
      if (s.verdict === 'Accepted') solved.add(s.problemId)
      else tried.add(s.problemId)
    }
    return { solved, tried }
  }, [list, mySubs.data])

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (q) {
        const needle = q.toLowerCase()
        if (!String(p.id).includes(needle) && !p.title.toLowerCase().includes(needle)) return false
      }
      if (diff !== 'all' && String(p.difficulty) !== diff) return false
      if (tag && !p.tags.includes(tag)) return false
      if (state === 'solved' && !myState.solved.has(p.id)) return false
      if (state === 'tried' && !myState.tried.has(p.id)) return false
      return true
    })
  }, [list, q, diff, tag, state, myState])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const rows = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  const clearAll = () => {
    setQ('')
    setDiff('all')
    setTag(null)
    setState('all')
    setPage(1)
  }

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看题库" />
  if (problems.loading) return <Loading label="读取题库…" />
  if (problems.error) return <ErrorState error={problems.error} onRetry={problems.reload} />

  return (
    <>
      <div className="row-between rise" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('problems.title')}</h1>
        <span className="small faint">{filtered.length} / {list.length}</span>
      </div>

      <div className="glass pad rise" style={{ marginBottom: '1rem' }}>
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: '1 1 13rem', maxWidth: '22rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.2rem' }} placeholder={t('problems.searchPlaceholder')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </div>
          <select className="select" value={diff} onChange={(e) => { setDiff(e.target.value); setPage(1) }}>
            <option value="all">{t('problems.difficulty')} · {t('common.all')}</option>
            {DIFFICULTY_KEYS.map((k, i) => (
              <option key={k} value={i}>{t(`diff.${k}`)}</option>
            ))}
          </select>
          <select className="select" value={state} onChange={(e) => { setState(e.target.value as typeof state); setPage(1) }}>
            <option value="all">{t('problems.myStatus')} · {t('problems.statusAll')}</option>
            <option value="solved">{t('problems.statusSolved')}</option>
            <option value="tried">{t('problems.statusTried')}</option>
          </select>
          {(q || diff !== 'all' || tag || state !== 'all') && (
            <button className="btn btn-sm btn-ghost" onClick={clearAll}>
              <RotateCcw size={13} /> {t('problems.clearFilters')}
            </button>
          )}
        </div>
        {allTags.length > 0 && (
          <div className="row wrap" style={{ marginTop: '0.7rem', gap: '0.35rem' }}>
            <button className={`tag-chip ${tag === null ? 'active' : ''}`} onClick={() => { setTag(null); setPage(1) }}>
              {t('common.all')}
            </button>
            {allTags.map((tg) => (
              <button key={tg} className={`tag-chip ${tag === tg ? 'active' : ''}`} onClick={() => { setTag(tag === tg ? null : tg); setPage(1) }}>
                {tg}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass pad rise" style={{ animationDelay: '0.06s' }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '5rem' }}>{t('problems.colId')}</th>
                <th>{t('problems.colTitle')}</th>
                <th style={{ width: '7rem' }}>{t('problems.colDifficulty')}</th>
                <th style={{ width: '16rem' }}>{t('problems.colTags')}</th>
                <th style={{ width: '6.5rem' }}>{t('problems.colAcceptance')}</th>
                <th style={{ width: '4.5rem', textAlign: 'center' }}>{t('problems.colState')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const rate = p.countsKnown === false ? null : Math.round((p.solved / Math.max(1, p.submissions)) * 100)
                return (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/problem/${p.id}`)}>
                    <td className="mono faint">#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{pick(p.title, p.titleEn)}</td>
                    <td>{p.difficultyKnown === false ? <span className="faint">—</span> : <DifficultyTag difficulty={p.difficulty} />}</td>
                    <td>
                      <span className="row wrap" style={{ gap: '0.3rem' }}>
                        {p.tags.slice(0, 3).map((tg) => <span key={tg} className="tag-chip">{tg}</span>)}
                      </span>
                    </td>
                    <td className="mono">{rate == null ? '—' : `${rate}%`}</td>
                    <td style={{ textAlign: 'center' }}>
                      {myState.solved.has(p.id) ? (
                        <span className="ac-state done" title={t('problems.stateSolved')}>✓</span>
                      ) : myState.tried.has(p.id) ? (
                        <span className="ac-state tried" title={t('problems.stateTried')}>✗</span>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="empty">
              <Inbox />
              {t('problems.noResult')}
            </div>
          )}
        </div>
        <Pagination page={curPage} total={totalPages} onChange={setPage} />
      </div>
    </>
  )
}
