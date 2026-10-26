# 用户名配色与 Rating 曲线对齐 HHHOJ 原版 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把本项目所有用户名的颜色显示，以及用户资料页的 Rating 曲线，按原版 HHHOJ（`/home/qzez/HHHOJ/frontend`）的实现逻辑 1:1 对齐。

**Architecture:** 新增批量用户卡片数据层（`/api/users/cards`）与模块级缓存 hook，让 `UserLink` 像原版一样按 `rank_percent` 连续配色，并支持特殊用户名、管理员彩虹名、ℵ 标记与徽章。Rating 曲线直接移植原版 `pages/users/RatingChart.tsx`（flot 行为复刻），保留原版的坐标轴、渐变、悬浮/点击 tooltip 与图例逻辑；仅把写死的浅色网格/浮层颜色换成主题变量，保证本项目的明暗双模式可读。

**Tech Stack:** React 18、TypeScript 5.6、Vite 5、react-router-dom 6、i18next、原生 SVG（不引入 recharts/echarts）。

---

## 0. 已完成的前置动作

- 已从 `origin/main`（`1c04337`）创建并切换到分支 `rating-fix`。
- 已解除 `rating-fix` 对 `origin/main` 的上游跟踪，避免误推送。
- 基线 `pnpm typecheck` 通过。

---

## 1. 原版行为基线（证据）

### 1.1 用户名颜色（原版）

- `frontend/src/components/UserLink.tsx:31-45`
  - `card = useUserCards([username])[username]`
  - `shownRating = rating ?? card.rating`
  - 颜色优先级：`specialUsernameColor(username)` → `rankPercentColor(card.rank_percent)`（默认）→ `ratingColor(shownRating)`（`byRating` 或 `rank_percent` 非有限值）
  - `ratingSymbolCount(shownRating)` 生成 `ℵ` 上标
  - `card.is_superuser` 加 `uoj-username-admin` 类
  - `card.badge` 渲染徽章
- `frontend/src/components/useUserCards.ts:1-81`
  - 模块级缓存 `cards: Record<string, UserCard>`
  - 同一 tick 内收集用户名，`setTimeout(flush, 0)` 合并成一次 `/api/users/cards?names=a,b`
  - 每批最多 500 个名字；请求失败时把名字从 `asked` 移除以便重试
  - 缓存按当前登录用户隔离
- `frontend/src/util.ts:23-55`
  - `ratingColor(rating)`：HSV 连续渐变，<1500 从灰蓝过渡，≥2500 封顶红色
  - `rankPercentColor(rankPercent) = ratingColor(2500 - clamp(rankPercent,0,1) * 2200)`
  - `ratingSymbolCount(rating) = rating >= 2500 ? floor((rating-2500)/200)+1 : 0`
- `frontend/src/config.ts:9`
  - `SPECIAL_USERNAME_COLORS = new Map([['zhuchuanqi', '#AD8B00']])`
- `frontend/src/styles/uoj-theme.css:110-165`
  - `.uoj-username-admin`：紫色兜底 + `background-clip: text` 彩虹渐变，`!important`
  - `.uoj-username-badge`：小圆角徽章
- 服务端 `server/src/site/cards.cpp:75-113`
  - `GET /api/users/cards?names=a,b` → `{ cards: { name: { username, rating, rank_percent, is_superuser, avatar_hash, badge? } } }`
  - 非普通用户 `rank_percent = 1.0`
  - 本地实测：`curl 'http://127.0.0.1:18080/api/users/cards?names=admin'` 返回 `is_superuser: true`

### 1.2 Rating 曲线（原版）

- `frontend/src/pages/users/RatingChart.tsx:1-430`：完整复刻 flot 行为
  - 高度 `H = 500`，边距 `L=33, R=18, T=9, B=25`
  - 数据点只用 `rating_history`（比赛点），不额外追加当前 rating
  - 空历史时画一个当前 rating 点
  - `x = parseServerTime(start_time) + 8h`（把上海墙钟当 UTC，供 UTC getter 格式化）
  - `yMin = min(current, 1500, ...history) - 400`，`yMax = max(...) + 400`
  - x 跨度小于 1 天时左右各补 1 天
  - Y 轴 / X 轴刻度算法逐行复刻 flot（`yTicks`、`xTicks`、`formatDate`）
  - 背景渐变 `ratingColor(yMax → yMin)`（64 个 stop）
  - 主线 `#3850eb`，两层阴影折线，每个点白底蓝描边，下方两个半圆阴影
  - 悬浮 10px 内高亮圆环；tooltip 在 hover 时跟随，点击可固定/取消
  - 右上图例：色块 + `UserLink`（`symbols={false} byRating`）
- `frontend/src/pages/UserInfo.tsx:139`
  - 无论历史是否为空都渲染 `<RatingChart username={u.username} history={data.rating_history} current={u.rating} />`

### 1.3 当前实现差异

| 项目 | 当前 | 原版目标 |
|---|---|---|
| 名字颜色 | 六档 CSS 变量（`--r-*`），多数调用未传 rating 直接主色 | 按 `rank_percent` 连续 HSV 渐变 |
| 管理员 | 无 | 彩虹渐变名 |
| 特殊用户名 | 无 | `zhuchuanqi` 固定 `#AD8B00` |
| ℵ 标记 | 无 | ≥2500 追加 ℵ |
| 徽章 | 无 | `card.badge` |
| 数据来源 | 调用点自己传 rating | 批量 `/api/users/cards` + 模块缓存 |
| 曲线 | 720×220 简化折线，仅 rating/名字，无时间轴 | 500px flot 复刻，时间轴 + 渐变 + tooltip + 图例 |
| 空历史 | 显示“暂无 Rating 参赛记录” | 画当前 rating 单点 |

---

## 2. 实施任务

### Task 1: 颜色原语（`ratingColor` / `rankPercentColor` / ℵ / 特殊名）

**Files:**
- Modify: `src/utils/user.ts`

**Step 1: 用下列内容替换 `src/utils/user.ts` 全文**

```ts
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
```

**Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: 无错误（仅 pnpm 的 `onlyBuiltDependencies` 警告）。

**Step 3: 提交**

```bash
git add src/utils/user.ts
git commit -m "feat: add HHHOJ rating color primitives"
```

---

### Task 2: 用户卡片数据层与批量缓存

**Files:**
- Modify: `src/services/api/types.ts`
- Modify: `src/services/api/real.ts`
- Modify: `src/services/api/mock.ts`
- Modify: `src/services/api/index.ts`
- Create: `src/components/useUserCards.ts`

**Step 1: 在 `src/services/api/types.ts` 增加领域类型**

在 `SessionUser` 之后加入：

```ts
export interface UserCard {
  username: string
  rating: number
  /** 0 = 榜首，1 = 榜尾；非普通用户为 1 */
  rankPercent: number
  isSuperuser: boolean
  avatarHash: string
  badge?: { text: string; color: string; textColor: string }
}
```

在 `ApiClient` 的 `user(name)` 后加入：

```ts
  userCards(names: string[]): Promise<Record<string, UserCard>>
```

**Step 2: 在 `src/services/api/real.ts` 增加原始类型与映射**

在 `RawProfile` 附近加入：

```ts
interface RawUserCard {
  username: string
  rating: number
  rank_percent: number
  is_superuser: boolean
  avatar_hash: string
  badge?: { text: string; color: string; text_color: string }
}
```

在 `mapSessionUser` 附近加入：

```ts
function mapUserCard(c: RawUserCard): UserCard {
  return {
    username: c.username,
    rating: c.rating,
    rankPercent: c.rank_percent,
    isSuperuser: c.is_superuser,
    avatarHash: c.avatar_hash,
    badge: c.badge
      ? { text: c.badge.text, color: c.badge.color, textColor: c.badge.text_color }
      : undefined,
  }
}
```

在文件顶部的类型导入中加入 `UserCard`（与 `UserProfileData` 同一处）。

在 `realApi` 的 `home()` 之后加入：

```ts
  async userCards(names: string[]): Promise<Record<string, UserCard>> {
    if (names.length === 0) return {}
    const data = await get<{ cards: Record<string, RawUserCard> }>('/api/users/cards', {
      names: names.join(','),
    })
    return Object.fromEntries(
      Object.entries(data.cards ?? {}).map(([name, card]) => [name, mapUserCard(card)]),
    )
  },
```

**Step 3: 在 `src/services/api/mock.ts` 增加 mock 实现**

在类型导入中加入 `UserCard`，在 `mockApi` 的 `user(name)` 后加入：

```ts
  async userCards(names: string[]): Promise<Record<string, UserCard>> {
    await delay()
    const sorted = [...USERS].sort((a, b) => b.rating - a.rating)
    const out: Record<string, UserCard> = {}
    for (const name of names) {
      const user = USERS.find((u) => u.name.toLowerCase() === name.toLowerCase())
      if (!user) continue
      const index = sorted.findIndex((u) => u.name === user.name)
      out[user.name] = {
        username: user.name,
        rating: user.rating,
        rankPercent: sorted.length <= 1 ? 0 : index / (sorted.length - 1),
        isSuperuser: false,
        avatarHash: '',
      }
    }
    return out
  },
```

**Step 4: 在 `src/services/api/index.ts` 导出类型**

在 `export type { ... }` 列表中加入 `UserCard`。

**Step 5: 创建 `src/components/useUserCards.ts`**

```ts
import { useEffect, useSyncExternalStore } from 'react'
import { api, type UserCard } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const MAX_NAMES = 500
const USERNAME = /^[a-zA-Z0-9_]{1,20}$/

// 缓存属于当前登录用户（未登录时为空字符串）；切换用户时从零开始。
let owner = ''
let cards: Record<string, UserCard> = {}
let queue = new Set<string>()
let scheduled = false
const asked = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function snapshot(): Record<string, UserCard> {
  return cards
}

function notify(): void {
  listeners.forEach((l) => l())
}

function flush(): void {
  scheduled = false
  const names = [...queue]
  queue = new Set()
  for (let i = 0; i < names.length; i += MAX_NAMES) {
    const chunk = names.slice(i, i + MAX_NAMES)
    const requestOwner = owner
    api.userCards(chunk).then(
      (r) => {
        if (requestOwner !== owner) return
        cards = { ...cards, ...r }
        notify()
      },
      () => {
        // 请求失败的名字忘掉，下次出现时重试。
        if (requestOwner === owner) chunk.forEach((name) => asked.delete(name))
      },
    )
  }
}

function ask(session: string, names: string[]): void {
  if (session !== owner) {
    owner = session
    cards = {}
    asked.clear()
    queue = new Set()
    notify()
  }
  for (const name of names) {
    if (asked.has(name)) continue
    asked.add(name)
    queue.add(name)
  }
  if (queue.size > 0 && !scheduled) {
    scheduled = true
    setTimeout(flush, 0)
  }
}

/** 按用户名缓存用户卡片；同一 tick 内的名字合并成一次 /api/users/cards。 */
export function useUserCards(usernames: string[]): Record<string, UserCard> {
  const all = useSyncExternalStore(subscribe, snapshot)
  const { user } = useAuth()
  const session = user?.name ?? ''
  const key = usernames.join(',')
  useEffect(() => {
    ask(session, key.split(',').filter((name) => USERNAME.test(name)))
  }, [session, key])
  return all
}
```

**Step 6: 类型检查**

Run: `pnpm typecheck`
Expected: 无错误。

**Step 7: 提交**

```bash
git add src/services/api/types.ts src/services/api/real.ts src/services/api/mock.ts src/services/api/index.ts src/components/useUserCards.ts
git commit -m "feat: batch fetch user cards for username colors"
```

---

### Task 3: 重写 `UserLink` 并接入所有用户名显示点

**Files:**
- Modify: `src/components/UserLink.tsx`
- Modify: `src/styles/components.css:496-510`
- Modify: `src/pages/UserProfile.tsx`
- Modify: `src/pages/Home.tsx:230`
- Modify: `src/components/NavBar.tsx:106`

**Step 1: 用下列内容替换 `src/components/UserLink.tsx` 全文**

```tsx
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
```

**Step 2: 更新 `src/styles/components.css` 的用户名样式**

把现有的 `.user-link` / `.user-link:hover` 规则替换为：

```css
.user-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}
.user-link:hover {
  filter: brightness(1.15);
}
```

在其后加入：

```css
/* 原版 HHHOJ 管理员彩虹名 */
.uoj-username-admin {
  color: #8e44ad !important;
}
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .uoj-username-admin {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #32ade6, #0a84ff, #5856d6, #ff2d55);
    background-size: 200% 100%;
    animation: uoj-rainbow 1.2s linear infinite;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent !important;
    -webkit-text-fill-color: transparent;
  }
}
@keyframes uoj-rainbow {
  to {
    background-position: 200% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .uoj-username-admin {
    animation: none !important;
  }
}

/* 原版 HHHOJ 用户名徽章 */
.uoj-username-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin-left: 0.45em;
  vertical-align: middle;
  height: 1.7em;
  padding: 0 0.65em;
  border-radius: 3px;
  font-size: 0.8em;
  line-height: 1;
  font-weight: 600;
  white-space: nowrap;
  background-color: #777;
  color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.uoj-username-badge-text {
  font-size: 1em;
  line-height: 1;
}
```

**Step 3: 用户资料页标题改用 `UserLink`**

在 `src/pages/UserProfile.tsx`：

- 增加 `import UserLink from '@/components/UserLink'`
- 第 72 行：

```tsx
<h1 style={{ fontSize: '1.5rem' }}>
  <UserLink name={user.name} link={false} />
</h1>
```

**Step 4: 首页个人卡片用户名改用 `UserLink`**

`src/pages/Home.tsx:230`：

```tsx
<div style={{ fontWeight: 700 }}>
  <UserLink name={user.name} link={false} />
</div>
```

（`UserLink` 已在该文件顶部导入。）

**Step 5: 导航栏下拉用户名改用 `UserLink`**

`src/components/NavBar.tsx`：

- 增加 `import UserLink from '@/components/UserLink'`
- 第 106 行：

```tsx
<div style={{ fontWeight: 700 }}>
  <UserLink name={user.name} link={false} />
</div>
```

**Step 6: 类型检查**

Run: `pnpm typecheck`
Expected: 无错误。确认 `ColoredName` 已无引用（`Grep "ColoredName"` 无结果）。

**Step 7: 视觉抽查**

- `pnpm dev` 后按 README 安装 dev 版用户脚本，打开 `http://127.0.0.1:18080/?__mock=1`：榜单用户名应为连续渐变色，而非六档色。
- 打开 `http://127.0.0.1:18080/?__mock=1`，用任意 mock 账号登录后打开 `/user/profile/Nebula`：标题、讨论区、状态页用户名同色系。
- 管理员账号名应为彩虹色（本地可用 `admin`）。
- 也可用 `pnpm build` 产物注入 `127.0.0.1:18080` 验证真实数据。

**Step 8: 提交**

```bash
git add src/components/UserLink.tsx src/components/useUserCards.ts src/styles/components.css src/pages/UserProfile.tsx src/pages/Home.tsx src/components/NavBar.tsx
git commit -m "feat: color usernames like HHHOJ"
```

---

### Task 4: 移植原版 Rating 曲线

**Files:**
- Modify: `src/components/RatingChart.tsx`
- Modify: `src/pages/UserProfile.tsx`
- Modify: `src/i18n/zh.json`
- Modify: `src/i18n/en.json`
- Modify: `src/services/api/mock.ts`（补 mock 比赛时间）

**Step 1: 以原版文件为底稿覆盖**

```bash
cp /home/qzez/HHHOJ/frontend/src/pages/users/RatingChart.tsx src/components/RatingChart.tsx
```

如果该路径不存在，停止并询问用户，不要凭记忆重写。

**Step 2: 替换导入**

Old:

```tsx
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { UserLink } from '../../components/UserLink'
import { ratingColor } from '../../util'
import { parseServerTime } from '../../components/serverTime'
import { t } from '../../locale'
```

New:

```tsx
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import UserLink from '@/components/UserLink'
import { ratingColor } from '@/utils/user'
import { timeValue } from '@/services/api/http'
import { useTheme } from '@/context/ThemeContext'
```

**Step 3: 把 `RatingPoint` 改成领域字段名**

Old:

```tsx
export type RatingPoint = {
  contest_id: number
  name: string
  start_time: string
  rank: number
  rating: number
  delta: number
}
```

New:

```tsx
export type RatingPoint = {
  contestId: number
  name: string
  startTime: string
  rank: number
  rating: number
  delta: number
}
```

**Step 4: 删除写死的 `GRID` / `GRID_LINE` 常量**

删除这两行（保留 `LINE`、`HIGHLIGHT`、`GRADIENT_ID`、`FONT`、`DAY`、`SHANGHAI`）：

```tsx
const GRID = '#545454'
const GRID_LINE = 'rgba(84,84,84,0.22)'
```

**Step 5: 删除模块级 `tooltip` 函数**

删除原文件第 35-54 行的 `function tooltip(point: Point): ReactNode { ... }`，稍后在组件内重建（需要 `t`）。

**Step 6: 组件签名与主题常量**

Old:

```tsx
export function RatingChart({ username, history, current }: { username: string; history: RatingPoint[]; current: number }) {
```

New:

```tsx
export default function RatingChart({
  username,
  history = [],
  current,
}: {
  username: string
  history?: RatingPoint[]
  current: number
}) {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const dark = mode === 'dark'
  const GRID = dark ? '#b9b9c6' : '#545454'
  const GRID_LINE = dark ? 'rgba(200,200,220,0.16)' : 'rgba(84,84,84,0.22)'

  const tooltip = (point: Point): ReactNode => {
    if (point.contest === null) {
      return (
        <>
          = {point.rating}
          <br />
          {t('user.ratingUnrated')}
        </>
      )
    }
    const change = point.contest.delta > 0 ? '+' + point.contest.delta : String(point.contest.delta)
    return (
      <>
        = {point.rating} ({change}), <br />
        {t('user.ratingRank', { rank: point.contest.rank })}
        <br />
        <Link to={'/contest/' + point.contest.id}>{point.contest.name}</Link>
      </>
    )
  }
```

**Step 7: 数据点映射改为 camelCase + `timeValue`**

Old:

```tsx
      ? history.map((h) => ({
          x: parseServerTime(h.start_time) + SHANGHAI,
          y: h.rating,
          rating: h.rating,
          contest: { id: h.contest_id, name: h.name, rank: h.rank, delta: h.delta },
        }))
```

New:

```tsx
      ? history.map((h) => ({
          x: timeValue(h.startTime) + SHANGHAI,
          y: h.rating,
          rating: h.rating,
          contest: { id: h.contestId, name: h.name, rank: h.rank, delta: h.delta },
        }))
```

**Step 8: 背景渐变在深色模式下降低亮度**

Old:

```tsx
        <rect x={L} y={T} width={PW} height={PH} fill={`url(#${GRADIENT_ID})`} />
```

New:

```tsx
        <rect x={L} y={T} width={PW} height={PH} fill={`url(#${GRADIENT_ID})`} opacity={dark ? 0.35 : 1} />
```

**Step 9: 图例与 tooltip 主题化，并改 `UserLink` 属性名**

图例块 Old:

```tsx
          background: 'rgba(255,255,255,0.85)',
          fontSize: 'smaller',
          color: GRID,
```

New:

```tsx
          background: dark ? 'rgba(20,20,28,0.85)' : 'rgba(255,255,255,0.85)',
          fontSize: 'smaller',
          color: GRID,
```

图例里的 Old:

```tsx
        <UserLink username={username} rating={current} symbols={false} byRating />
```

New:

```tsx
        <UserLink name={username} rating={current} symbols={false} byRating />
```

tooltip 块 Old:

```tsx
            border: '1px solid #fdd',
            padding: 2,
            fontSize: 11,
            background: '#fee',
            opacity: 0.8,
            whiteSpace: 'nowrap',
```

New:

```tsx
            border: `1px solid ${dark ? 'rgba(255,150,150,0.35)' : '#fdd'}`,
            padding: 2,
            fontSize: 11,
            background: dark ? 'rgba(48,32,38,0.95)' : '#fee',
            color: dark ? '#f3d9d9' : '#545454',
            opacity: 0.8,
            whiteSpace: 'nowrap',
```

**Step 10: `UserProfile` 传入完整历史并始终渲染曲线**

`src/pages/UserProfile.tsx`：

- 顶部 `import { useMemo, useState } from 'react'` → `import { useState } from 'react'`
- 删除 `chartData` 的 `useMemo` 块（第 31-34 行）
- 把 Rating 曲线区块替换为：

```tsx
      {/* Rating 曲线 */}
      <section className="glass pad rise" style={{ marginBottom: '1.25rem', animationDelay: '0.05s' }}>
        <h2 className="card-title"><Activity size={16} /> {t('user.ratingCurve')}</h2>
        <RatingChart username={user.name} history={profile.ratingHistory} current={user.rating} />
      </section>
```

**Step 11: 补 i18n 文案**

`src/i18n/zh.json` 的 `user` 段，在 `"ratingCurve"` 后加入：

```json
"ratingRank": "排名：{{rank}}",
"ratingUnrated": "Unrated",
```

`src/i18n/en.json` 同样位置：

```json
"ratingRank": "Rank: {{rank}}",
"ratingUnrated": "Unrated",
```

**Step 12: 给 mock 的 Rating 历史补真实时间**

`src/services/api/mock.ts` 中 `ratingHistory` 映射（约 171-178 行）：

Old:

```ts
      ratingHistory: found.ratingHistory.map((rating, i) => ({
        contestId: i + 1,
        name: `Round #${i + 1}`,
        startTime: '',
        rank: i + 1,
        rating,
        delta: i > 0 ? rating - found.ratingHistory[i - 1] : 0,
      })),
```

New:

```ts
      ratingHistory: found.ratingHistory.map((rating, i) => ({
        contestId: i + 1,
        name: `Round #${i + 1}`,
        startTime: `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-15 10:00:00`,
        rank: i + 1,
        rating,
        delta: i > 0 ? rating - found.ratingHistory[i - 1] : 0,
      })),
```

**Step 13: 类型检查与构建**

Run: `pnpm typecheck`
Expected: 无错误。

Run: `pnpm build`
Expected: `dist/hhhoj-twilight.user.js` 生成，无 TypeScript 错误。

**Step 14: 提交**

```bash
git add src/components/RatingChart.tsx src/pages/UserProfile.tsx src/i18n/zh.json src/i18n/en.json src/services/api/mock.ts
git commit -m "feat: port HHHOJ rating chart"
```

---

### Task 5: 文档与完整验证

**Files:**
- Modify: `docs/api-mapping.md`
- Modify: `docs/verification.md`

**Step 1: 在 `docs/api-mapping.md` 第 7 节补充用户卡片接口**

在“补充请求”之前插入：

~~~~md
### 用户卡片 `/api/users/cards?names=a,b`

```json
{ "cards": { "alice": { "username", "rating", "rank_percent", "is_superuser", "avatar_hash", "badge": { "text", "color", "text_color" } } } }
```

| 原始 | 领域 |
|---|---|
| `rating` | `UserCard.rating` |
| `rank_percent` | `UserCard.rankPercent`（用户名默认配色：0 榜首，1 榜尾） |
| `is_superuser` | `UserCard.isSuperuser`（管理员彩虹名） |
| `avatar_hash` | `UserCard.avatarHash` |
| `badge.*` | `UserCard.badge`（用户名后的徽章） |

`UserLink` 通过 `src/components/useUserCards.ts` 按页批量请求，同一 tick 合并，单批最多 500 个名字。
~~~~

**Step 2: 在 `docs/verification.md` 冒烟矩阵追加两行**

```md
| 用户名配色 | 首页 / 状态 / 讨论 / 资料页 | 普通用户按 rank_percent 连续渐变；管理员彩虹；≥2500 有 ℵ；徽章显示 |
| Rating 曲线 | `/user/profile/:name` | 500px、时间轴、评级渐变、悬浮 tooltip、点击固定、空历史单点 |
```

**Step 3: 完整验证矩阵**

| 场景 | 操作 | 期望 |
|---|---|---|
| 批量请求 | 打开 `/submissions`（≥20 行） | DevTools 只有一次 `/api/users/cards?names=...`，名字以逗号连接 |
| 普通用户配色 | 对比原站 `/ranklist` 同名用户 | 颜色一致（按 rank_percent，而非 rating 档位） |
| 管理员 | 用 `admin` 账号查看任意页面 | 用户名彩虹渐变，`prefers-reduced-motion` 下静止 |
| 特殊用户名 | 若存在 `zhuchuanqi` | 固定 `#AD8B00` |
| ℵ 标记 | 构造 rating ≥ 2500 的用户 | 名称后 1 个 ℵ（2700 为 2 个，以此类推） |
| 徽章 | 若用户配置了 badge | 名称后显示带色徽章，非法颜色回退默认 |
| 图表几何 | 对比原站 `/user/profile/:name` | 500px 高、±400 y 边距、x 至少 1 天、flot 刻度与网格一致 |
| 图表交互 | hover / 点击数据点 | hover 出现圆环与 tooltip；点击固定，再点空白取消 |
| 图表图例 | 右上角 | 色块 + 按 rating 连续配色的用户名 |
| 空历史 | 新用户 / mock 单点 | 仍渲染单点曲线，不显示“暂无记录” |
| 深色模式 | 设置抽屉切换 | 网格、标签、tooltip、图例可读；渐变不过曝 |
| 构建 | `pnpm typecheck && pnpm build` | 均通过，产物存在 |

**Step 4: 提交**

```bash
git add docs/api-mapping.md docs/verification.md docs/plans/2026-10-26-rating-fix.md
git commit -m "docs: document user cards and rating chart verification"
```

---

## 3. 设计取舍与风险

1. **默认按 `rank_percent` 而非 rating**：这是原版最容易误读的点。只有当 `byRating` 为真（曲线图例）或接口没有 `rank_percent` 时才直接用 rating 颜色。
2. **卡片请求失败时保留链接**：原版在卡片未加载时渲染纯 `<span>`（不可点击）。本项目保留 `<Link>` 并用 `var(--primary)` 兜底，避免网络失败导致用户名不可点；卡片到达后自动换成原版颜色。这是唯一的刻意偏差。
3. **图表 chrome 颜色主题化**：几何、刻度、渐变、交互逻辑逐行照搬原版；仅网格线、坐标轴文字、tooltip/图例底色按明暗模式取色，否则深色页面上原版浅色块会刺眼。
4. **500px 高度**：原版即 500px，资料页会明显变高；这是“同步原版”的必然结果，不做压缩。
5. **`/api/users/cards` 可用性**：本地实测可用且无需登录。若目标站点版本较旧没有该接口，名字会保持主色兜底，不影响其他功能。
6. **不引入图表库**：继续使用原生 SVG，避免用户脚本体积膨胀。

---

## 4. 验证边界

- 本地可验证：类型检查、构建、mock 模式视觉、真实 `/api/users/cards` 返回、与原站同浏览器对比截图。
- 需要真实登录账号：资料页曲线与真实用户的徽章/管理员名；本地 HHHOJ 在 `http://127.0.0.1:18080`，按 `docs/verification.md` 的方式注册并审核账号。
- 不自动 push；推送与 PR 由用户确认后执行。
