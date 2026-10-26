import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Radio, Copy, FileCode2, ListChecks, X } from 'lucide-react'
import VerdictBadge from '@/components/VerdictBadge'
import CodeEditor from '@/components/CodeEditor'
import Pagination from '@/components/Pagination'
import UserLink from '@/components/UserLink'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { useApi } from '@/services/useApi'
import { LANGUAGES } from '@/services/languages'
import { VERDICT_COLOR } from '@/services/store'
import { relParts, fmtDateTime } from '@/utils/i18nContent'
import { showToast } from '@/components/Toast'
import type { Submission, Verdict } from '@/types'

const VERDICT_OPTIONS: (Verdict | 'all')[] = [
  'all', 'Accepted', 'WrongAnswer', 'TimeLimitExceeded', 'MemoryLimitExceeded',
  'RuntimeError', 'CompileError', 'Judging', 'Pending',
]

const PAGE_SIZE = 20

export default function Status() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [params, setParams] = useSearchParams()

  const listRes = useApi(
    () => (user ? api.submissions({ size: 100 }) : Promise.resolve({ items: [], total: 0 })),
    [user?.name],
  )
  const subs = listRes.data?.items ?? []

  const [fUser, setFUser] = useState(params.get('submitter') ?? '')
  const [fProblem, setFProblem] = useState('')
  const [fVerdict, setFVerdict] = useState<string>('all')
  const [fLang, setFLang] = useState('all')
  const [mine, setMine] = useState(params.get('mine') === '1')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Submission | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 自己的等待/评测中提交：按原站节奏轮询，直到终态后整页刷新
  useEffect(() => {
    if (!user) return
    const pending = subs
      .filter((s) => s.userName === user.name && (s.verdict === 'Pending' || s.verdict === 'Judging'))
      .map((s) => s.id)
    if (pending.length === 0) return
    let alive = true
    let timer = 0
    const poll = async () => {
      try {
        const items = await api.submissionStatus(pending)
        if (!alive) return
        if (items.some((i) => i.judged)) listRes.reload()
        else timer = window.setTimeout(poll, 1000)
      } catch {
        if (alive) timer = window.setTimeout(poll, 2000)
      }
    }
    timer = window.setTimeout(poll, 600)
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subs, user?.name])

  // 从“我的提交”跳转进来
  const sid = Number(params.get('sid') ?? 0)
  useEffect(() => {
    if (!sid) return
    let alive = true
    setDetailLoading(true)
    api.submission(sid).then(
      (s) => {
        if (!alive) return
        if (s) setDetail(s)
        setDetailLoading(false)
      },
      () => alive && setDetailLoading(false),
    )
    return () => {
      alive = false
    }
  }, [sid])

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (mine && user && s.userName !== user.name) return false
      if (fUser && !s.userName.toLowerCase().includes(fUser.toLowerCase())) return false
      if (fProblem && String(s.problemId) !== fProblem.replace('#', '')) return false
      if (fVerdict !== 'all' && s.verdict !== fVerdict) return false
      if (fLang !== 'all' && s.language !== fLang) return false
      return true
    })
  }, [subs, fUser, fProblem, fVerdict, fLang, mine, user])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const curPage = Math.min(page, totalPages)
  const rows = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  const relTime = (ts: number) => {
    if (!ts) return '—'
    const { n, key } = relParts(ts)
    return key === 'justNow' ? t('status.justNow') : t(`status.${key}`, { n })
  }

  const problemTitle = (s: Submission) => s.problemTitle || `#${s.problemId}`

  const openDetail = async (s: Submission) => {
    setParams({ sid: String(s.id) })
    setDetail(s)
    setDetailLoading(true)
    try {
      const full = await api.submission(s.id)
      if (full) setDetail(full)
    } catch {
      /* 列表数据仍可展示 */
    } finally {
      setDetailLoading(false)
    }
  }

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看评测记录" />
  if (listRes.loading && !listRes.data) return <Loading label="读取提交记录…" />
  if (listRes.error) return <ErrorState error={listRes.error} onRetry={listRes.reload} />

  return (
    <>
      <div className="row-between wrap rise" style={{ marginBottom: '1rem' }}>
        <div className="row">
          <h1 style={{ fontSize: '1.5rem' }}>{t('status.title')}</h1>
          <span className="row small faint" style={{ gap: '0.35rem' }}>
            <Radio size={13} style={{ color: 'var(--v-acced)', animation: 'pulse-soft 1.6s infinite' }} />
            {t('status.liveHint')}
          </span>
        </div>
      </div>

      <div className="glass pad rise" style={{ marginBottom: '1rem' }}>
        <div className="status-filter">
          <input className="input" placeholder={t('status.filterUser')} value={fUser} onChange={(e) => { setFUser(e.target.value); setPage(1) }} />
          <input className="input" placeholder={t('status.filterProblem')} value={fProblem} onChange={(e) => { setFProblem(e.target.value); setPage(1) }} />
          <select className="select" value={fVerdict} onChange={(e) => { setFVerdict(e.target.value); setPage(1) }}>
            {VERDICT_OPTIONS.map((v) => (
              <option key={v} value={v}>{v === 'all' ? `${t('status.filterVerdict')} · ${t('common.all')}` : t(`verdict.${v}`)}</option>
            ))}
          </select>
          <select className="select" value={fLang} onChange={(e) => { setFLang(e.target.value); setPage(1) }}>
            <option value="all">{t('status.filterLanguage')} · {t('common.all')}</option>
            {Array.from(new Set([...LANGUAGES, ...subs.map((s) => s.language)])).filter((l) => l && l !== '/').map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {user && (
            <button className={`btn btn-sm ${mine ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setMine(!mine); setPage(1) }}>
              {t('status.mine')}
            </button>
          )}
        </div>
      </div>

      <div className="glass pad rise" style={{ animationDelay: '0.06s' }}>
        <div className="table-wrap">
          <table className="tbl status-tbl">
            <thead>
              <tr>
                <th style={{ width: '4.5rem' }}>{t('status.colId')}</th>
                <th>{t('status.colProblem')}</th>
                <th style={{ width: '9rem' }}>{t('status.colUser')}</th>
                <th style={{ width: '11.5rem' }}>{t('status.colVerdict')}</th>
                <th style={{ width: '5rem' }}>{t('status.colScore')}</th>
                <th style={{ width: '6rem' }}>{t('status.colTime')}</th>
                <th style={{ width: '6.5rem' }}>{t('status.colMemory')}</th>
                <th style={{ width: '6.5rem' }}>{t('status.colLanguage')}</th>
                <th style={{ width: '6rem' }}>{t('status.colAt')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => void openDetail(s)}>
                  <td className="mono faint">{s.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    <Link to={`/problem/${s.problemId}`} onClick={(e) => e.stopPropagation()} className="mono faint" style={{ marginRight: 6 }}>
                      #{s.problemId}
                    </Link>
                    {problemTitle(s)}
                  </td>
                  <td><UserLink name={s.userName} /></td>
                  <td className="verdict-cell">
                    <VerdictBadge verdict={s.verdict} />
                    {(s.verdict === 'Judging' || s.verdict === 'Pending') && (
                      <span className="detail-hint">{t(s.verdict === 'Judging' ? 'status.judging' : 'status.pending')}…</span>
                    )}
                  </td>
                  <td className="mono">{s.verdict === 'Pending' || s.verdict === 'Judging' ? '—' : s.score}</td>
                  <td className="mono">{s.timeMs == null ? '—' : t('common.timeMs', { n: s.timeMs })}</td>
                  <td className="mono">{s.memoryMb == null ? '—' : t('common.memoryMb', { n: s.memoryMb })}</td>
                  <td className="mono">{s.language === '/' ? '—' : s.language}</td>
                  <td className="small faint" title={fmtDateTime(s.submittedAt)}>{relTime(s.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty"><Radio /> {t('status.noSubmissions')}</div>}
        </div>
        <Pagination page={curPage} total={totalPages} onChange={setPage} />
      </div>

      {/* 提交详情弹窗 */}
      {detail && (
        <DetailModal
          sub={detail}
          loading={detailLoading}
          onClose={() => { setDetail(null); if (sid) setParams({}) }}
        />
      )}
    </>
  )
}

function DetailModal({ sub, loading, onClose }: { sub: Submission; loading: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { c, g } = VERDICT_COLOR[sub.verdict]
  const busy = sub.verdict === 'Judging' || sub.verdict === 'Pending'

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between" style={{ marginBottom: '1rem' }}>
          <div className="row" style={{ gap: '0.7rem' }}>
            <span className="mono faint">#{sub.id}</span>
            <VerdictBadge verdict={sub.verdict} />
            <span className="small muted mono">
              {sub.timeMs != null && t('common.timeMs', { n: sub.timeMs })} · {sub.memoryMb != null && t('common.memoryMb', { n: sub.memoryMb })} · {t('common.sizeKb', { n: sub.codeSizeKb })}
            </span>
          </div>
          <div className="row" style={{ gap: '0.3rem' }}>
            <button className="icon-btn" onClick={() => { void navigator.clipboard?.writeText(sub.code); showToast(t('status.copied')) }} title={t('status.copyCode')}>
              <Copy size={15} />
            </button>
            <button className="icon-btn" onClick={onClose} title={t('common.close')}><X size={16} /></button>
          </div>
        </div>

        <div className="row small faint" style={{ marginBottom: '0.6rem', gap: '0.4rem' }}>
          <FileCode2 size={13} />
          <span>{sub.language === '/' ? '—' : sub.language} · {fmtDateTime(sub.submittedAt)}</span>
          {sub.testcases.length > 0 && (
            <span className="row" style={{ gap: '0.3rem', color: c }}>
              <ListChecks size={13} />
              {t('status.modalTestcases')} · {sub.testcases.length}
            </span>
          )}
          {loading && <span className="faint">读取详情…</span>}
        </div>

        {sub.codeUnavailable && sub.code === '' ? (
          <div className="empty" style={{ padding: '1.2rem' }}>无权查看代码，或该提交为文件提交。</div>
        ) : (
          <div style={{ maxHeight: '38dvh', overflowY: 'auto', marginBottom: '0.9rem' }}>
            <CodeEditor value={sub.code} language={sub.language} height="auto" />
          </div>
        )}

        {sub.testcases.length > 0 && (
          <div>
            <div className="sample-label" style={{ color: c }}><ListChecks size={12} /> {t('status.modalTestcases')}</div>
            <div className="table-wrap glass" style={{ background: 'var(--glass-soft)', boxShadow: 'none', maxHeight: '10rem', overflowY: 'auto' }}>
              <table className="testcase-tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('status.colVerdict')}</th>
                    <th>{t('status.colTime')}</th>
                    <th>{t('status.colMemory')}</th>
                    <th>{t('common.score')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sub.testcases.map((tc) => (
                    <tr key={tc.index}>
                      <td>{tc.index}</td>
                      <td>
                        <span style={{ color: VERDICT_COLOR[tc.verdict].c, fontWeight: 700 }}>
                          {t(`verdict.${tc.verdict}Short`)}
                        </span>
                      </td>
                      <td>{tc.timeMs} ms</td>
                      <td>{tc.memoryMb} MB</td>
                      <td>{tc.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {busy && (
          <p className="small" style={{ color: c }}>
            {t(sub.verdict === 'Judging' ? 'status.judging' : 'status.pending')}…
          </p>
        )}
      </div>
    </div>
  )
}
