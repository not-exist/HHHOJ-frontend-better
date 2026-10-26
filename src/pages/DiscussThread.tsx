import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ThumbsUp, MessageCircle, Send, Pin } from 'lucide-react'
import UserLink from '@/components/UserLink'
import SafeHtml from '@/components/SafeHtml'
import { EmptyState, ErrorState, Loading, LoginRequired } from '@/components/AsyncState'
import { useAuth } from '@/context/AuthContext'
import { api, isMock } from '@/services/api'
import { useApi } from '@/services/useApi'
import { avatarStyle } from '@/utils/user'
import { pick } from '@/utils/i18nContent'
import { showToast } from '@/components/Toast'
import type { Comment } from '@/types'

export default function DiscussThread() {
  const { id } = useParams()
  const tid = Number(id)
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()

  const threadRes = useApi(
    () => (user ? api.thread(tid) : Promise.resolve(undefined)),
    [user?.name, tid],
  )
  const thread = threadRes.data

  const [extraComments, setExtraComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyAuthor, setReplyAuthor] = useState('')
  const [sending, setSending] = useState(false)
  const [likeState, setLikeState] = useState<{ val: number; cnt: number } | null>(null)
  const [commentLikes, setCommentLikes] = useState<Record<number, { val: number; cnt: number }>>({})

  const comments = useMemo(() => [...(thread?.comments ?? []), ...extraComments], [thread, extraComments])
  const replyCount = comments.reduce((s, c) => s + 1 + c.replies.length, 0)
  const liked = (likeState?.val ?? thread?.myZan ?? 0) > 0
  const likeCount = likeState?.cnt ?? thread?.likes ?? 0

  const send = async () => {
    if (!user) {
      showToast(t('discuss.loginToReply'))
      return
    }
    if (!draft.trim() || sending || !thread) return
    setSending(true)
    try {
      await api.postComment(thread.id, draft.trim(), replyTo ?? undefined)
      if (isMock) {
        setExtraComments((list) => [
          ...list,
          {
            id: 9000 + list.length,
            author: user.name,
            content: draft.trim(),
            createdAt: '刚刚',
            likes: 0,
            replies: [],
          },
        ])
      } else {
        threadRes.reload()
      }
      setDraft('')
      setReplyTo(null)
      setReplyAuthor('')
      showToast('✓')
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error))
    } finally {
      setSending(false)
    }
  }

  const toggleLike = async () => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      return
    }
    if (!thread) return
    const delta: 1 | -1 = liked ? -1 : 1
    if (isMock) {
      setLikeState({ val: delta, cnt: likeCount + delta })
      return
    }
    try {
      const result = await api.vote('B', thread.id, delta)
      setLikeState({ val: result.my_zan, cnt: result.zan })
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error))
    }
  }

  const toggleCommentLike = async (c: Comment) => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      return
    }
    const current = commentLikes[c.id]?.val ?? c.myZan ?? 0
    if (isMock) {
      const base = commentLikes[c.id]?.cnt ?? c.likes
      setCommentLikes((prev) => ({ ...prev, [c.id]: { val: current > 0 ? 0 : 1, cnt: base + (current > 0 ? -1 : 1) } }))
      return
    }
    try {
      const result = await api.vote('BC', c.id, current > 0 ? -1 : 1)
      setCommentLikes((prev) => ({ ...prev, [c.id]: { val: result.my_zan, cnt: result.zan } }))
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error))
    }
  }

  if (authLoading) return <Loading label="读取会话…" />
  if (!user) return <LoginRequired text="登录后查看讨论" />
  if (threadRes.loading && !thread) return <Loading label="读取讨论…" />
  if (threadRes.error) return <ErrorState error={threadRes.error} onRetry={threadRes.reload} />
  if (!thread) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <p>{t('discuss.threadNotFound')}</p>
        <Link to="/blogs" className="btn btn-primary btn-sm">{t('discuss.backToDiscuss')}</Link>
      </div>
    )
  }

  return (
    <>
      <div className="rise" style={{ marginBottom: '1rem' }}>
        <Link to="/blogs" className="row small muted" style={{ gap: '0.3rem', width: 'fit-content' }}>
          <ChevronLeft size={14} /> {t('discuss.backToDiscuss')}
        </Link>
      </div>

      <section className="glass pad rise">
        <div className="row wrap" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
          {thread.pinned && (
            <span className="badge" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>
              <Pin size={11} /> {t('discuss.pinned')}
            </span>
          )}
          <h1 style={{ fontSize: '1.35rem' }}>{pick(thread.title, thread.titleEn)}</h1>
          {thread.tags && thread.tags.length > 0 && (
            <span className="tag-chip">{thread.tags[0]}</span>
          )}
        </div>
        <div className="row small faint" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
          <UserLink name={thread.author} size={26} />
          <span>· {t('discuss.published', { time: thread.createdAt })}</span>
          <span>· <MessageCircle size={12} style={{ verticalAlign: '-2px' }} /> {replyCount} {t('discuss.comments')}</span>
        </div>

        {thread.contentHtml ? (
          <SafeHtml html={thread.contentHtml} className="statement statement-html" />
        ) : (
          <div className="statement" style={{ whiteSpace: 'pre-wrap' }}>{thread.content}</div>
        )}

        <div className="row" style={{ marginTop: '1.2rem' }}>
          <button className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-ghost'}`} onClick={() => void toggleLike()}>
            <ThumbsUp size={13} /> {likeCount}
          </button>
        </div>
      </section>

      {/* 评论 */}
      <section className="glass pad rise" style={{ animationDelay: '0.06s', marginTop: '1.25rem' }}>
        <h2 className="card-title"><MessageCircle size={16} /> {replyCount} {t('discuss.comments')}</h2>

        <div className="stack" style={{ gap: 0 }}>
          {comments.map((c) => {
            const state = commentLikes[c.id]
            return (
              <CommentItem
                key={c.id}
                c={c}
                myZan={state?.val ?? c.myZan ?? 0}
                likeCount={state?.cnt ?? c.likes}
                onLike={() => void toggleCommentLike(c)}
                onReply={() => { setReplyTo(c.id); setReplyAuthor(c.author) }}
              />
            )
          })}
          {comments.length === 0 && <EmptyState text={t('discuss.noThreads')} />}
        </div>

        <div style={{ marginTop: '1.1rem' }}>
          {replyTo != null && (
            <div className="row small faint" style={{ marginBottom: '0.4rem' }}>
              回复 @{replyAuthor}
              <button className="icon-btn" style={{ width: '1.4rem', height: '1.4rem' }} onClick={() => { setReplyTo(null); setReplyAuthor('') }}>×</button>
            </div>
          )}
          <div className="row" style={{ alignItems: 'stretch' }}>
            {user ? (
              <>
                <span className="avatar" style={avatarStyle(user.name, 36)}>{user.name.slice(0, 1).toUpperCase()}</span>
                <input
                  className="input"
                  placeholder={t('discuss.writeReply')}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void send()}
                />
                <button className="btn btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => void send()} disabled={sending}>
                  <Send size={14} /> {sending ? '发送中…' : t('discuss.send')}
                </button>
              </>
            ) : (
              <div className="empty" style={{ width: '100%', padding: '1.2rem' }}>
                {t('discuss.loginToReply')} · <Link to="/login">{t('nav.login')}</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

function CommentItem({
  c,
  myZan,
  likeCount,
  onLike,
  onReply,
}: {
  c: Comment
  myZan: number
  likeCount: number
  onLike: () => void
  onReply: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="comment-item">
      <UserLink name={c.author} size={36} />
      <div className="grow">
        <div className="row small" style={{ gap: '0.5rem' }}>
          <span className="faint">{c.createdAt}</span>
        </div>
        <SafeHtml html={c.content} className="comment-content" />
        <div className="comment-actions">
          <button className={myZan > 0 ? 'liked' : ''} onClick={onLike}>
            <ThumbsUp size={12} /> {likeCount}
          </button>
          <button onClick={onReply}>
            <MessageCircle size={12} /> {t('discuss.replyTo')}
          </button>
        </div>
        {c.replies.map((r) => (
          <div key={r.id} className="comment-item" style={{ marginTop: '0.7rem', paddingLeft: '0.9rem', borderLeft: '2px solid var(--border)', borderBottom: 'none' }}>
            <UserLink name={r.author} size={28} />
            <div className="grow">
              <div className="row small" style={{ gap: '0.5rem' }}>
                <span className="faint">{r.createdAt}</span>
              </div>
              <SafeHtml html={r.content} className="comment-content" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
