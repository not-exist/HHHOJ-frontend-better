/** 多语言 mock 内容与时间格式化的共享工具 */

export function isZh(): boolean {
  return localStorage.getItem('toj.lang') !== 'en'
}

/** 依据当前语言选择 mock 数据里的中/英字段 */
export function pick<T>(zh: T, en: T): T {
  return isZh() ? zh : en
}

const pad = (n: number) => String(n).padStart(2, '0')

export function fmtDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtShortTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtDuration(ms: number): string {
  const totalMin = Math.round(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

/** 相对时间的原始数字，交给 i18n 复数化 */
export function relParts(ts: number): { n: number; key: string } {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) return { n: 0, key: 'justNow' }
  if (min < 60) return { n: min, key: 'minutesAgo' }
  const h = Math.floor(min / 60)
  if (h < 24) return { n: h, key: 'hoursAgo' }
  return { n: Math.floor(h / 24), key: 'daysAgo' }
}
