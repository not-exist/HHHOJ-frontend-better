import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * 切换模式的入口必须在两种模式下都可用：
 * 用户切到原站界面后，脚本在该页面仍要注册“重新启用接管”的菜单命令，
 * 否则原站页面上没有任何回到 TwilightOJ 的入口。
 */
const state = vi.hoisted(() => ({ native: false, registered: [] as boolean[], setNative: [] as boolean[] }))

vi.mock('./services/gm', () => ({
  isNativeMode: () => state.native,
  registerTakeoverMenu: (native: boolean) => {
    state.registered.push(native)
  },
  setNativeMode: (native: boolean) => {
    state.setNative.push(native)
  },
}))

import { bootTakeover } from './takeover'

describe('bootTakeover mode switch', () => {
  beforeEach(() => {
    state.native = false
    state.registered.length = 0
    state.setNative.length = 0
    window.history.replaceState({}, '', '/')
  })

  it('registers the re-enable command while native mode is active', () => {
    state.native = true

    bootTakeover()

    expect(state.registered).toEqual([true])
  })

  it('leaves the native page untouched in native mode', () => {
    state.native = true

    bootTakeover()

    expect(document.documentElement.hasAttribute('data-twilight')).toBe(false)
    expect(document.querySelector('#twilight-root')).toBeNull()
  })

  it('registers the switch command on routes left to the native site', () => {
    window.history.replaceState({}, '', '/faq')

    bootTakeover()

    expect(state.registered).toEqual([false])
  })
})
