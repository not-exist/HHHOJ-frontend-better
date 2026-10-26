import { Link } from 'react-router-dom'
import { avatarStyle, ratingTier, RATING_VARS } from '@/utils/user'

/** 彩色用户名（rating 等级配色）+ 可选头像 */
export default function UserLink({ name, size, rating }: { name: string; size?: number; rating?: number }) {
  const color = rating == null ? 'var(--primary)' : `var(${RATING_VARS[ratingTier(rating)]})`
  return (
    <Link
      to={`/user/profile/${encodeURIComponent(name)}`}
      className="user-link"
      style={{ '--rc': color } as React.CSSProperties}
    >
      {size != null && (
        <span className="avatar" style={avatarStyle(name, size)}>
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      {name}
    </Link>
  )
}

/** 仅用户名带等级配色（不做链接时用） */
export function ColoredName({ name, rating }: { name: string; rating?: number }) {
  const color = rating == null ? 'var(--primary)' : `var(${RATING_VARS[ratingTier(rating)]})`
  return (
    <Link
      to={`/user/profile/${encodeURIComponent(name)}`}
      style={{ color, fontWeight: 600 }}
    >
      {name}
    </Link>
  )
}
