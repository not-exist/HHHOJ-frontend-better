import { useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api, isMock } from '@/services/api'
import { showToast } from '@/components/Toast'
import { nextZan, type ZanDelta, type ZanTargetType } from '@/utils/zan'

type Props = {
  type: ZanTargetType
  id: number
  val: number
  cnt: number
  multi?: boolean
  contestId?: number
  size?: number
}

/** 上一次点击的结果，绑定到点击时的 props；父组件换了数据就重新用 props。 */
type Done = { key: string; val: number; cnt: number }

export default function Zan({ type, id, val, cnt, multi = false, contestId, size = 15 }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Done | null>(null)

  const key = `${type}|${id}|${val}|${cnt}|${multi ? 1 : 0}`
  const shown = done?.key === key ? done : { val, cnt }

  const vote = async (delta: ZanDelta) => {
    if (busy) return
    if (!user) {
      showToast(t('common.pleaseLogin'))
      return
    }
    if (isMock) {
      const mine = nextZan(shown.val, delta, multi)
      if (mine === null) {
        showToast(t('zan.limit'))
        return
      }
      setDone({ key, val: mine, cnt: shown.cnt + (mine - shown.val) })
      return
    }
    setBusy(true)
    try {
      const result = await api.vote(type, id, delta, contestId)
      setDone({ key, val: result.my_zan, cnt: result.zan })
    } catch (error) {
      showToast(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }

  const click = (e: MouseEvent<HTMLButtonElement>, delta: ZanDelta) => {
    e.preventDefault()
    e.stopPropagation()
    void vote(delta)
  }

  const count = shown.cnt > 0 ? '+' + shown.cnt : String(shown.cnt)
  const countClass =
    shown.cnt > 0 ? 'zan-count positive' : shown.cnt < 0 ? 'zan-count negative' : 'zan-count neutral'

  return (
    <span className="zan" title={multi ? t('zan.multiHint') : undefined}>
      <button
        type="button"
        className={`zan-btn up${shown.val > 0 ? ' on' : ''}`}
        aria-label={t('zan.up')}
        disabled={busy}
        onClick={(e) => click(e, 1)}
      >
        <ThumbsUp size={size} />
      </button>
      <button
        type="button"
        className={`zan-btn down${shown.val < 0 ? ' on' : ''}`}
        aria-label={t('zan.down')}
        disabled={busy}
        onClick={(e) => click(e, -1)}
      >
        <ThumbsDown size={size} />
      </button>
      <span className={countClass}>{count}</span>
      {multi && shown.val !== 0 && <span className="zan-multi">×{Math.abs(shown.val)}</span>}
    </span>
  )
}
