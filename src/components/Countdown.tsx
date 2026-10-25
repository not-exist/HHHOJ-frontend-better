import { useEffect, useState } from 'react'

/** 每秒跳动的倒计时（到 target 的剩余时间），供比赛卡片与详情页使用 */
export default function Countdown({ target, finished }: { target: number; finished?: boolean }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (finished) return null
  const remain = Math.max(0, target - now)
  const d = Math.floor(remain / 86400_000)
  const hh = String(Math.floor((remain % 86400_000) / 3600_000)).padStart(2, '0')
  const mm = String(Math.floor((remain % 3600_000) / 60_000)).padStart(2, '0')
  const ss = String(Math.floor((remain % 60_000) / 1000)).padStart(2, '0')
  return (
    <span className="countdown">
      {d > 0 ? `${d}d ` : ''}
      {hh}:{mm}:{ss}
    </span>
  )
}
