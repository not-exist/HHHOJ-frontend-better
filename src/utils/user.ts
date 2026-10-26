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

/* ------------------------------------------------------------------ *
 * 原版 HHHOJ 用户名配色（frontend/src/util.ts + config.ts）
 * ------------------------------------------------------------------ */

/** 原版 config.ts：用户名 -> 固定颜色，优先于 rating 配色 */
export const SPECIAL_USERNAME_COLORS: ReadonlyMap<string, string> = new Map([
  ['zhuchuanqi', '#AD8B00'],
])

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi)
}

/** 与 web/js/color-converter.min.js 相同的 HSV -> rgb() */
function hsvToCss(h0: number, s0: number, v0: number): string {
  const h = clamp(h0, 0, 360) / 360
  const s = clamp(s0, 0, 100) / 100
  const v = clamp(v0, 0, 100) / 100
  const x = 6 * h
  const i = Math.floor(x)
  const f = x - i
  const p = v * (1 - s)
  const q = v * (1 - s * f)
  const t = v * (1 - s * (1 - f))
  const [r, g, b] = ([[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v]][i] ?? [v, p, q])
  return `rgb(${Math.round(255 * r)},${Math.round(255 * g)},${Math.round(255 * b)})`
}

/** getColOfRating：300（灰蓝）以下钳制，2500（红）以上钳制 */
export function ratingColor(rating: number): string {
  if (rating < 1500) {
    const H = 300 - (650 * 300) / 1650
    const S = 30 + (650 * 70) / 1650
    const V = 50 + (650 * 50) / 1650
    const k = (Math.max(rating, 300) - 300) / 1200
    return hsvToCss(H + (300 - H) * (1 - k), 30 + (S - 30) * k, 50 + (V - 50) * k)
  }
  const r = Math.min(rating, 2500)
  return hsvToCss(
    300 - ((r - 850) * 300) / 1650,
    30 + ((r - 850) * 70) / 1650,
    50 + ((r - 850) * 50) / 1650,
  )
}

/** getColOfRatingRankPercent：rank percent 0 -> 2500，1 -> 300 */
export function rankPercentColor(rankPercent: number): string {
  return ratingColor(2500 - clamp(rankPercent, 0, 1) * 2200)
}

export function specialUsernameColor(username: string): string | null {
  return SPECIAL_USERNAME_COLORS.get(username) ?? null
}

/** rating >= 2500 时用户名后的 ℵ 数量 */
export function ratingSymbolCount(rating: number): number {
  return rating >= 2500 ? Math.floor((rating - 2500) / 200) + 1 : 0
}

export function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}

/** rating -> 等级档位（仅用于 rating 数字的六档配色，不用于用户名） */
export function ratingTier(rating: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (rating >= 2400) return 5
  if (rating >= 2100) return 4
  if (rating >= 1800) return 3
  if (rating >= 1500) return 2
  if (rating >= 1200) return 1
  return 0
}

export const RATING_VARS = ['--r-newbie', '--r-pupil', '--r-specialist', '--r-expert', '--r-master', '--r-grand'] as const
