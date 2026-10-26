import type { CSSProperties } from 'react'

/** 由用户名推导稳定的头像色相 */
export function hueOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function avatarStyle(name: string, size: number): CSSProperties {
  return {
    width: size,
    height: size,
    '--ah': hueOf(name),
    fontSize: size * 0.42,
  } as CSSProperties
}

/** rating → 等级档位（用于配色） */
export function ratingTier(rating: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (rating >= 2400) return 5
  if (rating >= 2100) return 4
  if (rating >= 1800) return 3
  if (rating >= 1500) return 2
  if (rating >= 1200) return 1
  return 0
}

export const RATING_VARS = ['--r-newbie', '--r-pupil', '--r-specialist', '--r-expert', '--r-master', '--r-grand'] as const
