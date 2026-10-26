import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Clock3, MemoryStick, Target, Hash, BookOpen,
  Copy, FileCode2, Send, RotateCcw, Inbox, ExternalLink,
} from 'lucide-react'
import DifficultyTag from '@/components/DifficultyTag'
import CodeEditor from '@/components/CodeEditor'
import VerdictBadge from '@/components/VerdictBadge'
import SafeHtml from '@/components/SafeHtml'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { ApiError, api, isAuthError } from '@/services/api'
import { useApi } from '@/services/useApi'
import { CODE_TEMPLATES, LANGUAGES } from '@/services/languages'
import { pick, fmtDateTime } from '@/utils/i18nContent'
import { showToast } from '@/components/Toast'

type Tab = 'statement' | 'samples' | 'hint' | 'mine'

function templateFor(language: string): string {
  return CODE_TEMPLATES[language] ?? (/^C\+\+/.test(language) ? CODE_TEMPLATES['C++17'] : '')
}

export default function ProblemDetail() {
  const { id } = useParams()
  const pid = Number(id)
  const [search] = useSearchParams()
  const contestId = Number(search.get('contest_id')) || undefined
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const problemRes = useApi(() => api.problem(pid, contestId), [pid, contestId])
  const problem = problemRes.data

  const mySubsRes = useApi(
    () =>
      user && Number.isFinite(pid)
        ? api.submissions({ problemId: pid, submitter: user.name, size: 20 })
        : Promise.resolve({ items: [], total: 0 }),
    [user?.name, pid],
  )

  const [tab, setTab] = useState<Tab>('statement')
  const [lang, setLang] = useState<string>('C++20')
  const [code, setCode] = useState(CODE_TEMPLATES['C++20'])
  const [submitting, setSubmitting] = useState(false)

  const requirement = problem?.submissionRequirement ?? []
  const firstReq = requirement[0]
  const supported = requirement.length === 1 && firstReq?.type === 'source code'
  const langs = firstReq?.languages?.length ? firstReq.languages : [...LANGUAGES]

  useEffect(() => {
    setTab('statement')
    setLang('C++20')
    setCode(CODE_TEMPLATES['C++20'])
  }, [pid])

  useEffect(() => {
    if (!langs.includes(lang)) {
      const next = ['C++17', 'C++14', 'C++11', 'C++', 'C'].find((l) => langs.includes(l)) ?? langs[0] ?? 'C++20'
      setLang(next)
      setCode(templateFor(next))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id])

  const doSubmit = async () => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      navigate('/login')
      return
    }
    if (!problem) return
    if (!supported) {
      showToast('该题需要多文件/文本提交，请在原站完成提交')
      return
    }
    if (!code.trim() || submitting) return
    setSubmitting(true)
    try {
      const sid = await api.createSubmission({
        problemId: problem.id,
        itemName: firstReq?.name ?? 'answer',
        language: lang,
        code,
        contestId: problem.contestId ?? undefined,
      })
      showToast(t('problem.submitSuccess'))
      navigate(`/submissions?sid=${sid}`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error))
    } finally {
      setSubmitting(false)
    }
  }

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text)
    showToast(t('status.copied'))
  }

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看题目" />
  if (problemRes.loading) return <Loading label="读取题目…" />
  if (problemRes.error) {
    if (isAuthError(problemRes.error)) return <LoginRequired text="登录后查看题目" />
    if (problemRes.error instanceof ApiError && problemRes.error.status === 404) {
      return (
        <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
          <Inbox size={30} style={{ margin: '0 auto 0.6rem', color: 'var(--text-3)' }} />
          <p>{t('problem.notFound')}</p>
          <Link className="btn btn-primary btn-sm" to="/problems">{t('problem.backToProblems')}</Link>
        </div>
      )
    }
    return <ErrorState error={problemRes.error} onRetry={problemRes.reload} />
  }
  if (!problem) return null

  const rate = problem.countsKnown === false ? null : Math.round((problem.solved / Math.max(1, problem.submissions)) * 100)
  const prev = problem.prevProblemId && problem.prevProblemId !== problem.id ? problem.prevProblemId : null
  const next = problem.nextProblemId && problem.nextProblemId !== problem.id ? problem.nextProblemId : null
  const tabs: [Tab, string][] = [
    ['statement', t('problem.tabStatement')],
    ...(problem.samples.length > 0 ? [['samples', t('problem.tabSamples')] as [Tab, string]] : []),
    ...(problem.hint ? [['hint', t('problem.tabHint')] as [Tab, string]] : []),
    ['mine', t('problem.tabMyRecords')],
  ]

  return (
    <>
      <div className="row-between wrap rise" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
        <div className="row wrap" style={{ gap: '0.7rem' }}>
          <h1 style={{ fontSize: '1.45rem' }}>
            <span className="mono faint">#{problem.id}</span> {pick(problem.title, problem.titleEn)}
          </h1>
          {problem.difficultyKnown !== false && <DifficultyTag difficulty={problem.difficulty} />}
          {problem.contestId != null && (
            <Link to={`/contest/${problem.contestId}`} className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>
              {problem.contestTitle || `contest #${problem.contestId}`}
            </Link>
          )}
        </div>
        <div className="row" style={{ gap: '0.4rem' }}>
          {prev && (
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/problem/${prev}`)}>
              <ChevronLeft size={14} /> {t('problem.prevProblem')}
            </button>
          )}
          {next && (
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/problem/${next}`)}>
              {t('problem.nextProblem')} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* 主栏 */}
        <div className="stack">
          <section className="glass pad rise">
            <div className="tabs" style={{ marginBottom: '1rem', width: 'fit-content' }}>
              {tabs.map(([key, label]) => (
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'statement' && (
              problem.statementHtml ? (
                <SafeHtml html={problem.statementHtml} className="statement statement-html" />
              ) : (
                <div className="statement">
                  {(problem.background || problem.backgroundEn) && (
                    <>
                      <h2>{t('problem.background')}</h2>
                      <p className="muted">{pick(problem.background, problem.backgroundEn)}</p>
                    </>
                  )}
                  <h2>{t('problem.description')}</h2>
                  <p>{pick(problem.description, problem.descriptionEn)}</p>
                  <h2>{t('problem.inputFormat')}</h2>
                  <p>{pick(problem.inputFormat, problem.inputFormatEn)}</p>
                  <h2>{t('problem.outputFormat')}</h2>
                  <p>{pick(problem.outputFormat, problem.outputFormatEn)}</p>
                </div>
              )
            )}

            {tab === 'samples' && (
              <div className="stack" style={{ gap: '1.1rem' }}>
                {problem.samples.map((s, i) => (
                  <div key={i} className="row wrap" style={{ alignItems: 'stretch', gap: '1rem' }}>
                    <div className="grow" style={{ minWidth: '12rem' }}>
                      <div className="row-between">
                        <span className="sample-label"><FileCode2 size={12} /> {t('problem.sampleInput')} {i + 1}</span>
                        <button className="icon-btn" style={{ width: '1.7rem', height: '1.7rem' }} onClick={() => copy(s.input)}><Copy size={13} /></button>
                      </div>
                      <pre className="code-block">{s.input}</pre>
                    </div>
                    <div className="grow" style={{ minWidth: '12rem' }}>
                      <div className="row-between">
                        <span className="sample-label"><FileCode2 size={12} /> {t('problem.sampleOutput')} {i + 1}</span>
                        <button className="icon-btn" style={{ width: '1.7rem', height: '1.7rem' }} onClick={() => copy(s.output)}><Copy size={13} /></button>
                      </div>
                      <pre className="code-block">{s.output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'hint' && (
              <p className="muted">{pick(problem.hint, problem.hintEn) || t('common.empty')}</p>
            )}

            {tab === 'mine' && (
              <div className="table-wrap">
                {(mySubsRes.data?.items.length ?? 0) > 0 ? (
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>{t('status.colId')}</th>
                        <th>{t('status.colVerdict')}</th>
                        <th>{t('status.colLanguage')}</th>
                        <th>{t('status.colAt')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubsRes.data!.items.map((s) => (
                        <tr key={s.id} className="clickable" onClick={() => navigate(`/submissions?sid=${s.id}`)}>
                          <td className="mono faint">{s.id}</td>
                          <td><VerdictBadge verdict={s.verdict} /></td>
                          <td className="mono">{s.language}</td>
                          <td className="small faint">{fmtDateTime(s.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty"><Inbox /> {t('status.noSubmissions')}</div>
                )}
              </div>
            )}
          </section>

          {/* 提交区 */}
          <section className="glass pad rise" style={{ animationDelay: '0.06s' }}>
            <h2 className="card-title"><Send size={16} /> {t('problem.submitCode')}</h2>
            {!supported ? (
              <div className="empty" style={{ padding: '1.2rem' }}>
                <p>这道题需要多文件或文本提交，TwilightOJ 接管页暂不支持。</p>
                <a className="btn btn-ghost btn-sm" href={`/problem/${problem.id}`}>
                  <ExternalLink size={13} /> 在原站提交
                </a>
              </div>
            ) : (
              <>
                <div className="submit-bar">
                  <select className="select" value={lang} onChange={(e) => { setLang(e.target.value); setCode(templateFor(e.target.value)) }}>
                    {langs.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button className="btn btn-sm btn-ghost" onClick={() => setCode(templateFor(lang))}>
                    <RotateCcw size={13} /> {t('problem.resetCode')}
                  </button>
                  <span className="small faint grow">
                    {problem.canSubmit === false ? '当前账号无权提交此题' : t('problem.editHint')}
                  </span>
                  <button className="btn btn-primary" onClick={() => void doSubmit()} disabled={submitting || problem.canSubmit === false}>
                    <Send size={14} /> {submitting ? '提交中…' : t('common.submit')}
                  </button>
                </div>
                <CodeEditor value={code} onChange={(v) => setCode(v)} language={lang} height="22rem" />
              </>
            )}
          </section>
        </div>

        {/* 侧栏 */}
        <div className="stack">
          <section className="glass pad rise" style={{ animationDelay: '0.04s' }}>
            <h2 className="card-title"><BookOpen size={16} /> {t('problem.timeLimit')}</h2>
            <dl className="meta-list">
              <div><dt><Clock3 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.timeLimit')}</dt><dd className="mono">{problem.timeLimitMs ? `${problem.timeLimitMs} ms` : '—'}</dd></div>
              <div><dt><MemoryStick size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.memoryLimit')}</dt><dd className="mono">{problem.memoryLimitMb ? `${problem.memoryLimitMb} MB` : '—'}</dd></div>
              <div><dt><Target size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.acceptance')}</dt><dd className="mono" style={{ color: 'var(--primary)' }}>{rate == null ? '—' : `${rate}%`}</dd></div>
              <div><dt><Hash size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.submissions')}</dt><dd className="mono">{problem.countsKnown === false ? '—' : problem.submissions}</dd></div>
              <div><dt>{t('problem.source')}</dt><dd className="small">{problem.source || 'HHHOJ'}</dd></div>
            </dl>
          </section>

          <section className="glass pad rise" style={{ animationDelay: '0.08s' }}>
            <h2 className="card-title"><Target size={16} /> {t('problem.tags')}</h2>
            <div className="row wrap" style={{ gap: '0.35rem' }}>
              {problem.tags.length === 0 ? <span className="small faint">{t('common.empty')}</span> : problem.tags.map((tg) => (
                <Link key={tg} to="/problems" className="tag-chip">{tg}</Link>
              ))}
            </div>
          </section>

          {problem.statementPdf && (
            <section className="glass pad rise" style={{ animationDelay: '0.1s' }}>
              <a className="btn btn-ghost btn-sm" href={problem.statementPdf} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> 题面 PDF
              </a>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
