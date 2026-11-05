import { describe, it, expect, vi } from 'vitest'

// takeover.ts 在模块加载时依赖 GM_* 提供的原站切换菜单；测试只关心路由门。
vi.mock('./services/gm', () => ({
  isNativeMode: () => false,
  registerTakeoverMenu: () => {},
  setNativeMode: () => {},
}))

import { isTakeoverPath } from './takeover'

describe('isTakeoverPath', () => {
  const takenOver = [
    '/',
    '/problems',
    '/problems/',
    '/problem/1',
    '/problem/1/',
    '/submissions',
    '/contests',
    '/contest/1',
    '/contest/1/standings',
    '/blogs',
    '/blogs/1',
    '/post/1',
    '/user/profile/alice',
    '/login',
    '/register',
    '/login/',
  ]

  it.each(takenOver)('takes over %s', (path) => {
    expect(isTakeoverPath(path)).toBe(true)
  })

  const native = [
    '/faq',
    '/ranklist',
    '/submission/1',
    '/contest/1/submissions',
    '/contest/1/register',
    '/blog/alice/1',
    '/user/msg',
    '/super-manage/1',
    '/contest/1/problem/2',
    '/problem/abc',
    '/user/profile/a/b',
    '/problems/extra',
  ]

  it.each(native)('leaves %s to the native site', (path) => {
    expect(isTakeoverPath(path)).toBe(false)
  })
})
