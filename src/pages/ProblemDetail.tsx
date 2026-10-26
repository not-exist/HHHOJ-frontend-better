import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Clock3, MemoryStick, Target, Hash, BookOpen,
  Copy, FileCode2, Send, RotateCcw, Inbox,
} from 'lucide-react'
import DifficultyTag from '@/components/DifficultyTag'
import CodeEditor from '@/components/CodeEditor'
import VerdictBadge from '@/components/VerdictBadge'
import { PROBLEMS } from '@/mock/problems'
import { CODE_TEMPLATES, LANGUAGES, type Language } from '@/mock/submissions'
import { submissionStore } from '@/services/store'
import { useAuth } from '@/context/AuthContext'
import { pick, fmtDateTime } from '@/utils/i18nContent'
import { showToast } from '@/components/Toast'

type Tab = 'statement' | 'samples' | 'hint' | 'mine'

export default function ProblemDetail() {
  const { id } = useParams()
  const pid = Number(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const problem = useMemo(() => PROBLEMS.find((p) => p.id === pid), [pid])
  const idx = PROBLEMS.findIndex((p) => p.id === pid)
  const prev = idx > 0 ? PROBLEMS[idx - 1] : null
  const next = idx >= 0 && idx < PROBLEMS.length - 1 ? PROBLEMS[idx + 1] : null

  const [tab, setTab] = useState<Tab>('statement')
  const [lang, setLang] = useState<string>('C++20')
  const [code, setCode] = useState(CODE_TEMPLATES['C++20'])

  const mySubs = useMemo(() => {
    if (!user) return []
    return submissionStore.all
      .filter((s) => s.problemId === pid && s.userName === user.name)
      .slice(0, 10)
  }, [user, pid])

  if (!problem) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <Inbox size={30} style={{ margin: '0 auto 0.6rem', color: 'var(--text-3)' }} />
        <p>{t('problem.notFound')}</p>
        <Link className="btn btn-primary btn-sm" to="/problems">{t('problem.backToProblems')}</Link>
      </div>
    )
  }

  const rate = Math.round((problem.solved / Math.max(1, problem.submissions)) * 100)

  const switchLang = (l: string) => {
    setLang(l)
    setCode(CODE_TEMPLATES[l] ?? '')
  }

  const doSubmit = () => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      navigate('/login')
      return
    }
    if (!code.trim()) return
    submissionStore.submit({ problemId: pid, userName: user.name, language: lang as Language, code })
    showToast(t('problem.submitSuccess'))
    navigate('/status')
  }

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text)
    showToast(t('status.copied'))
  }

  return (
    <>
      <div className="row-between wrap rise" style={{ marginBottom: '1rem', gap: '0.5rem' }}>
        <div className="row" style={{ gap: '0.7rem' }}>
          <h1 style={{ fontSize: '1.45rem' }}>
            <span className="mono faint">#{problem.id}</span> {pick(problem.title, problem.titleEn)}
          </h1>
          <DifficultyTag difficulty={problem.difficulty} />
        </div>
        <div className="row" style={{ gap: '0.4rem' }}>
          {prev && (
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/problems/${prev.id}`)}>
              <ChevronLeft size={14} /> {t('problem.prevProblem')}
            </button>
          )}
          {next && (
            <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/problems/${next.id}`)}>
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
              {([
                ['statement', t('problem.tabStatement')],
                ['samples', t('problem.tabSamples')],
                ['hint', t('problem.tabHint')],
                ['mine', t('problem.tabMyRecords')],
              ] as [Tab, string][]).map(([key, label]) => (
                <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'statement' && (
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
                {mySubs.length > 0 ? (
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
                      {mySubs.map((s) => (
                        <tr key={s.id} className="clickable" onClick={() => navigate(`/status?sid=${s.id}`)}>
                          <td className="mono faint">{s.id}</td>
                          <td><VerdictBadge verdict={s.verdict} /></td>
                          <td className="mono">{s.language}</td>
                          <td className="small faint">{fmtDateTime(s.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty"><Inbox /> {user ? t('status.noSubmissions') : t('common.pleaseLogin')}</div>
                )}
              </div>
            )}
          </section>

          {/* 提交区 */}
          <section className="glass pad rise" style={{ animationDelay: '0.06s' }}>
            <h2 className="card-title"><Send size={16} /> {t('problem.submitCode')}</h2>
            <div className="submit-bar">
              <select className="select" value={lang} onChange={(e) => switchLang(e.target.value)}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button className="btn btn-sm btn-ghost" onClick={() => setCode(CODE_TEMPLATES[lang] ?? '')}>
                <RotateCcw size={13} /> {t('problem.resetCode')}
              </button>
              <span className="small faint grow">{t('problem.editHint')}</span>
              <button className="btn btn-primary" onClick={doSubmit}>
                <Send size={14} /> {t('common.submit')}
              </button>
            </div>
            <CodeEditor value={code} onChange={(v) => setCode(v)} language={lang} height="22rem" />
          </section>
        </div>

        {/* 侧栏 */}
        <div className="stack">
          <section className="glass pad rise" style={{ animationDelay: '0.04s' }}>
            <h2 className="card-title"><BookOpen size={16} /> {t('problem.timeLimit')}</h2>
            <dl className="meta-list">
              <div><dt><Clock3 size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.timeLimit')}</dt><dd className="mono">{problem.timeLimitMs} ms</dd></div>
              <div><dt><MemoryStick size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.memoryLimit')}</dt><dd className="mono">{problem.memoryLimitMb} MB</dd></div>
              <div><dt><Target size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.acceptance')}</dt><dd className="mono" style={{ color: 'var(--primary)' }}>{rate}%</dd></div>
              <div><dt><Hash size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />{t('problem.submissions')}</dt><dd className="mono">{problem.submissions}</dd></div>
              <div><dt>{t('problem.source')}</dt><dd className="small">{problem.source}</dd></div>
            </dl>
          </section>

          <section className="glass pad rise" style={{ animationDelay: '0.08s' }}>
            <h2 className="card-title"><Target size={16} /> {t('problem.tags')}</h2>
            <div className="row wrap" style={{ gap: '0.35rem' }}>
              {problem.tags.map((tg) => (
                <Link key={tg} to="/problems" className="tag-chip">{tg}</Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
