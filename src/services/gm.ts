import { GM_getValue, GM_registerMenuCommand, GM_setValue } from '$'

/** 用户选择「原站模式」的持久化标记；脚本在 document-start 读到它就直接退出 */
export const NATIVE_KEY = 'toj.takeover.native'

type Maybe<T> = T | undefined

function hasGm(): boolean {
  return typeof GM_getValue === 'function' && typeof GM_setValue === 'function'
}

export function gmGet<T>(key: string, fallback: T): T {
  try {
    const value = hasGm() ? (GM_getValue as (k: string, d: T) => Maybe<T>)(key, fallback) : undefined
    if (value !== undefined && value !== null) return value
  } catch {
    /* Tampermonkey 未注入时继续走 localStorage */
  }
  try {
    const raw = localStorage.getItem(`gm:${key}`)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function gmSet(key: string, value: unknown): void {
  try {
    if (hasGm()) {
      ;(GM_setValue as (k: string, v: unknown) => void)(key, value)
      return
    }
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(`gm:${key}`, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function isNativeMode(): boolean {
  return gmGet<boolean>(NATIVE_KEY, false) === true
}

export function setNativeMode(native: boolean): void {
  gmSet(NATIVE_KEY, native)
}

/**
 * 只注册当前模式下可执行的菜单命令。
 * 原站模式下页面不再由本脚本接管，这条菜单就是用户回到 TwilightOJ 的唯一入口，
 * 因此它必须在模式判断之前注册，不能因为脚本提前退出而消失。
 */
export function registerTakeoverMenu(native: boolean): void {
  if (typeof GM_registerMenuCommand !== 'function') return
  const label = native ? '重新启用 TwilightOJ 接管' : '切换为 HHHOJ 原站界面'
  try {
    GM_registerMenuCommand(label, () => {
      setNativeMode(!native)
      location.reload()
    })
  } catch {
    /* 非脚本环境（独立预览 / 测试）忽略 */
  }
}
