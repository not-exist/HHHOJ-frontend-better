import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessagesSquare, Search, Pin, Eye, ThumbsUp, MessageCircle, PenLine, ExternalLink } from 'lucide-react'
import UserLink from '@/components/UserLink'
import { ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api, isMock } from '@/services/api'
import { useApi } from '@/services/useApi'
import { NODES, type NodeKey } from '@/utils/nodes'
import { pick } from '@/utils/i18nContent'

export default function Discuss() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [node, setNode] = useState<NodeKey>('all')
  const [q, setQ] = useState('')

  const threadsRes = useApi(
    () => (user ? api.threads() : Promise.resolve([])),
    [user?.name],
  )
  const all = threadsRes.data ?? []

  const threads = useMemo(() => {
    return all.filter((th) => {
      if (node !== 'all' && th.node !== node) return false
      if (q) {
        const needle = q.toLowerCase()
        if (!th.title.toLowerCase().includes(needle)) return false
      }
      return true
    })
  }, [all, node, q])

  const nodeCount = (key: NodeKey) => (key === 'all' ? all.length : all.filter((th) => th.node === key).length)

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看讨论区" />
  if (threadsRes.loading) return <Loading label="读取博客…" />
  if (threadsRes.error) return <ErrorState error={threadsRes.error} onRetry={threadsRes.reload} />

  return (
    <>
      <div className="row-between wrap rise" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <MessagesSquare size={22} style={{ color: 'var(--primary)' }} /> {t('discuss.title')}
        </h1>
        <div className="row" style={{ gap: '0.6rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="input" style={{ paddingLeft: '2.2rem', width: '14rem' }} placeholder={t('discuss.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <a className="btn btn-primary btn-sm" href={`/blog/${encodeURIComponent(user.name)}/post/new/write`}>
            <PenLine size={13} /> {t('discuss.newThread')} <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {isMock && (
        <div className="glass pad rise" style={{ marginBottom: '1rem' }}>
          <div className="row wrap" style={{ gap: '0.35rem' }}>
            {NODES.map((key) => (
              <button key={key} className={`tag-chip ${node === key ? 'active' : ''}`} onClick={() => setNode(key)}>
                {t(`discuss.nodes.${key}`)} · {nodeCount(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="stack rise" style={{ animationDelay: '0.06s' }}>
        {threads.map((th) => {
          const replyCount = th.commentCount ?? th.comments.reduce((s, c) => s + 1 + c.replies.length, 0)
          return (
            <div key={th.id} className="glass hoverable thread-item" onClick={() => navigate(`/blogs/${th.id}`)}>
              <div className="grow">
                <div className="row wrap" style={{ gap: '0.5rem' }}>
                  {th.pinned && (
                    <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>
                      <Pin size={11} /> {t('discuss.pinned')}
                    </span>
                  )}
                  <h3>{pick(th.title, th.titleEn)}</h3>
                  {isMock && <span className="tag-chip">{t(`discuss.nodes.${th.node}`)}</span>}
                </div>
                <div className="row small faint" style={{ marginTop: '0.3rem', gap: '0.4rem' }}>
                  <UserLink name={th.author} /> · {t('discuss.published', { time: th.createdAt })}
                </div>
              </div>
              <div className="thread-stats">
                {th.views > 0 && <span><Eye /> {th.views}</span>}
                <span><ThumbsUp /> {th.likes}</span>
                {replyCount > 0 && <span><MessageCircle /> {replyCount}</span>}
              </div>
            </div>
          )
        })}
        {threads.length === 0 && (
          <div className="glass"><div className="empty"><MessagesSquare /> {t('discuss.noThreads')}</div></div>
        )}
      </div>
    </>
  )
}
