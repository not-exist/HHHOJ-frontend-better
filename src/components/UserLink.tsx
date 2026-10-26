import { Link } from 'react-router-dom'
import {
  avatarStyle,
  isHexColor,
  ratingColor,
  ratingSymbolCount,
  rankPercentColor,
  specialUsernameColor,
} from '@/utils/user'
import { useUserCards } from './useUserCards'

function UserBadge({ text, color, textColor }: { text: string; color?: string; textColor?: string }) {
  const fg = textColor && isHexColor(textColor) ? textColor : '#ffffff'
  const bg = color && isHexColor(color) ? color : undefined
  return (
    <span className="uoj-username-badge" style={{ color: fg, backgroundColor: bg }}>
      <span className="uoj-username-badge-text">{text}</span>
    </span>
  )
}

/**
 * 原版 HHHOJ 用户名：按 rank_percent 连续配色；特殊用户名优先；
 * 管理员彩虹名；rating ≥ 2500 追加 ℵ；可选头像与徽章。
 */
export default function UserLink({
  name,
  size,
  rating,
  link = true,
  symbols = true,
  byRating = false,
}: {
  name: string
  size?: number
  rating?: number
  link?: boolean
  symbols?: boolean
  byRating?: boolean
}) {
  const card = useUserCards([name])[name]
  const shownRating = rating ?? card?.rating
  const color =
    specialUsernameColor(name) ??
    (card == null || byRating || !Number.isFinite(card.rankPercent)
      ? shownRating == null
        ? 'var(--primary)'
        : ratingColor(shownRating)
      : rankPercentColor(card.rankPercent))
  const className = 'user-link' + (card?.isSuperuser ? ' uoj-username-admin' : '')
  const marks = symbols && shownRating != null ? ratingSymbolCount(shownRating) : 0
  const text = (
    <>
      {name}
      {marks > 0 && <sup>{'ℵ'.repeat(marks)}</sup>}
    </>
  )
  const avatar = size != null && (
    <span className="avatar" style={avatarStyle(name, size)}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
  const body = link ? (
    <Link to={`/user/profile/${encodeURIComponent(name)}`} className={className} style={{ color }}>
      {avatar}
      {text}
    </Link>
  ) : (
    <span className={className} style={{ color }}>
      {avatar}
      {text}
    </span>
  )

  return (
    <>
      {body}
      {card?.badge && <UserBadge text={card.badge.text} color={card.badge.color} textColor={card.badge.textColor} />}
    </>
  )
}
