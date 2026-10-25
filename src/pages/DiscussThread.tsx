import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ThumbsUp, MessageCircle, Send, Pin } from 'lucide-react'
import UserLink from '@/components/UserLink'
import { avatarStyle } from '@/mock/users'
import { THREADS } from '@/mock/discuss'
import { pick } from '@/utils/i18nContent'
import { useAuth } from '@/context/AuthContext'
import { showToast } from '@/components/Toast'
import type { Comment } from '@/types'

export default function DiscussThread() {
  const { id } = useParams()
  const tid = Number(id)
  const { t } = useTranslation()
  const { user } = useAuth()

  const thread = useMemo(() => THREADS.find((th) => th.id === tid), [tid])

  // 点赞与评论均为本地演示态
  const [liked, setLiked] = useState(false)
  const [extraComments, setExtraComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set())

  if (!thread) {
    return (
      <div className="glass pad center" style={{ padding: '4rem 1rem' }}>
        <p>{t('discuss.threadNotFound')}</p>
        <Link to="/discuss" className="btn btn-primary btn-sm">{t('discuss.backToDiscuss')}</Link>
      </div>
    )
  }

  const comments = [...thread.comments, ...extraComments]
  const replyCount = comments.reduce((s, c) => s + 1 + c.replies.length, 0)

  const send = () => {
    if (!user) {
      showToast(t('discuss.loginToReply'))
      return
    }
    if (!draft.trim()) return
    setExtraComments((list) => [
      ...list,
      { id: 9000 + list.length, author: user.name, content: draft.trim(), createdAt: '刚刚', likes: 0, replies: [] },
    ])
    setDraft('')
    showToast('✓')
  }

  const toggleCommentLike = (cid: number) => {
    if (!user) {
      showToast(t('common.pleaseLogin'))
      return
    }
    setLikedComments((prev) => {
      const next = new Set(prev)
      if (next.has(cid)) next.delete(cid)
      else next.add(cid)
      return next
    })
  }

  return (
    <>
      <div className="rise" style={{ marginBottom: '1rem' }}>
        <Link to="/discuss" className="row small muted" style={{ gap: '0.3rem', width: 'fit-content' }}>
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
          <span className="tag-chip">{t(`discuss.nodes.${thread.node}`)}</span>
        </div>
        <div className="row small faint" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
          <UserLink name={thread.author} size={26} />
          <span>· {t('discuss.published', { time: thread.createdAt })}</span>
          <span>· <MessageCircle size={12} style={{ verticalAlign: '-2px' }} /> {replyCount} {t('discuss.comments')}</span>
        </div>

        <div className="statement" style={{ whiteSpace: 'pre-wrap' }}>
          {thread.content}
        </div>

        <div className="row" style={{ marginTop: '1.2rem' }}>
          <button className={`btn btn-sm ${liked ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { if (!user) { showToast(t('common.pleaseLogin')); return } setLiked(!liked) }}>
            <ThumbsUp size={13} /> {thread.likes + (liked ? 1 : 0)}
          </button>
        </div>
      </section>

      {/* 评论 */}
      <section className="glass pad rise" style={{ animationDelay: '0.06s', marginTop: '1.25rem' }}>
        <h2 className="card-title"><MessageCircle size={16} /> {replyCount} {t('discuss.comments')}</h2>

        <div className="stack" style={{ gap: 0 }}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              liked={likedComments.has(c.id)}
              onLike={() => toggleCommentLike(c.id)}
              onReply={() => setDraft(`@${c.author} `)}
            />
          ))}
        </div>

        <div className="row" style={{ marginTop: '1.1rem', alignItems: 'stretch' }}>
          {user ? (
            <>
              <span className="avatar" style={avatarStyle(user.name, 36)}>{user.name.slice(0, 1).toUpperCase()}</span>
              <input
                className="input"
                placeholder={t('discuss.writeReply')}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button className="btn btn-primary" onClick={send}>
                <Send size={14} /> {t('discuss.send')}
              </button>
            </>
          ) : (
            <div className="empty" style={{ width: '100%', padding: '1.2rem' }}>
              {t('discuss.loginToReply')} · <Link to="/login">{t('nav.login')}</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function CommentItem({ c, liked, onLike, onReply }: { c: Comment; liked: boolean; onLike: () => void; onReply: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="comment-item">
      <UserLink name={c.author} size={36} />
      <div className="grow">
        <div className="row small" style={{ gap: '0.5rem' }}>
          <b>{c.author}</b>
          <span className="faint">{c.createdAt}</span>
        </div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
        <div className="comment-actions">
          <button className={liked ? 'liked' : ''} onClick={onLike}>
            <ThumbsUp size={12} /> {c.likes + (liked ? 1 : 0)}
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
                <b>{r.author}</b>
                <span className="faint">{r.createdAt}</span>
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{r.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
