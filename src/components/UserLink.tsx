import { Link } from 'react-router-dom'
import { avatarStyle, hueOf, ratingTier } from '@/mock/users'
import { USERS } from '@/mock/users'

const TIER_VARS = ['--r-newbie', '--r-pupil', '--r-specialist', '--r-expert', '--r-master', '--r-grand']

/** 彩色用户名（rating 等级配色）+ 可选头像 */
export default function UserLink({ name, size }: { name: string; size?: number }) {
  const tier = ratingTier(name.length ? ratingOf(name) : 0)
  return (
    <Link to={`/user/${encodeURIComponent(name)}`} className="user-link" style={{ '--rc': `var(${TIER_VARS[tier]})` } as React.CSSProperties}>
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
export function ColoredName({ name }: { name: string }) {
  const tier = ratingTier(ratingOf(name))
  return (
    <Link to={`/user/${encodeURIComponent(name)}`} style={{ color: `var(${TIER_VARS[tier]})`, fontWeight: 600 }}>
      {name}
    </Link>
  )
}

// 用户名 → rating：直接查 mock 名册，找不到按哈希给一个稳定档
function ratingOf(name: string): number {
  return USERS.find((u) => u.name === name)?.rating ?? 900 + (hueOf(name) % 600)
}
