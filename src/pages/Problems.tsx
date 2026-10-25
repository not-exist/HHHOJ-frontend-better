import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, RotateCcw, Inbox } from 'lucide-react'
import DifficultyTag from '@/components/DifficultyTag'
import Pagination from '@/components/Pagination'
import { PROBLEMS } from '@/mock/problems'
import { DIFFICULTY_KEYS } from '@/types'
import { submissionStore } from '@/services/store'
import { useAuth } from '@/context/AuthContext'
import { pick } from '@/utils/i18nContent'

const PAGE_SIZE = 12

const ALL_TAGS = Array.from(new Set(PROBLEMS.flatMap((p) => p.tags)))

export default function Problems() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [q, setQ] = useState('')
  const [diff, setDiff] = useState<string>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [state, setState] = useState<'all' | 'solved' | 'tried'>('all')
  const [page, setPage] = useState(1)

  // 我的状态：从全站提交记录推导
  const myState = useMemo(() => {
    const solved = new Set<number>()
    const tried = new Set<number>()
    if (!user) return { solved, tried }
    for (const s of submissionStore.all) {
      if (s.userName !== user.name) continue
      if (s.verdict === 'Accepted') solved.add(s.problemId)
      else tried.add(s.problemId)
    }
    return { solved, tried }
  }, [user])

  const filtered = useMemo(() => {
    return PROBLEMS.filter((p) => {
      if (q) {
        const needle = q.toLowerCase()
        if (!String(p.id).includes(needle) && !p.title.toLowerCase().includes(needle) && !p.titleEn.toLowerCase().includes(needle)) return false
      }
      if (diff !== 'all' && String(p.difficulty) !== diff) return false
      if (tag && !p.tags.includes(tag)) return false
      if (state === 'solved' && !myState.solved.has(p.id)) return false
      if (state === 'tried' && myState.solved.has(p.id) && !myState.tried.has(p.id)) return false
      return true
    })
  }, [q, diff, tag, state, myState])

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

  return (
    <>
      <div className="row-between rise" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>{t('problems.title')}</h1>
        <span className="small faint">{filtered.length} / {PROBLEMS.length}</span>
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
        <div className="row wrap" style={{ marginTop: '0.7rem', gap: '0.35rem' }}>
          <button className={`tag-chip ${tag === null ? 'active' : ''}`} onClick={() => { setTag(null); setPage(1) }}>
            {t('common.all')}
          </button>
          {ALL_TAGS.map((tg) => (
            <button key={tg} className={`tag-chip ${tag === tg ? 'active' : ''}`} onClick={() => { setTag(tag === tg ? null : tg); setPage(1) }}>
              {tg}
            </button>
          ))}
        </div>
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
                const rate = Math.round((p.solved / Math.max(1, p.submissions)) * 100)
                return (
                  <tr key={p.id} className="clickable" onClick={() => navigate(`/problems/${p.id}`)}>
                    <td className="mono faint">#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{pick(p.title, p.titleEn)}</td>
                    <td><DifficultyTag difficulty={p.difficulty} /></td>
                    <td>
                      <span className="row wrap" style={{ gap: '0.3rem' }}>
                        {p.tags.slice(0, 3).map((tg) => <span key={tg} className="tag-chip">{tg}</span>)}
                      </span>
                    </td>
                    <td className="mono">{rate}%</td>
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
