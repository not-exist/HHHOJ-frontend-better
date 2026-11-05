import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fmtDuration, relParts, isZh, pick } from './i18nContent'

describe('fmtDuration', () => {
  it('formats minutes below one hour', () => {
    expect(fmtDuration(0)).toBe('0min')
    expect(fmtDuration(60_000)).toBe('1min')
    expect(fmtDuration(59 * 60_000)).toBe('59min')
  })

  it('rounds to the nearest minute', () => {
    expect(fmtDuration(59_000)).toBe('1min')
    expect(fmtDuration(29_999)).toBe('0min')
    expect(fmtDuration(90_000)).toBe('2min')
  })

  it('formats hours and remainder minutes', () => {
    expect(fmtDuration(90 * 60_000)).toBe('1h 30min')
    expect(fmtDuration(120 * 60_000)).toBe('2h 0min')
    expect(fmtDuration(61 * 60_000)).toBe('1h 1min')
  })
})

describe('relParts', () => {
  const NOW = new Date('2024-01-02T03:04:05Z').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports just now under one minute', () => {
    expect(relParts(NOW - 30_000)).toEqual({ n: 0, key: 'justNow' })
    expect(relParts(NOW + 30_000)).toEqual({ n: 0, key: 'justNow' })
  })

  it('reports minutes', () => {
    expect(relParts(NOW - 60_000)).toEqual({ n: 1, key: 'minutesAgo' })
    expect(relParts(NOW - 5 * 60_000)).toEqual({ n: 5, key: 'minutesAgo' })
    expect(relParts(NOW - 59 * 60_000)).toEqual({ n: 59, key: 'minutesAgo' })
  })

  it('reports hours', () => {
    expect(relParts(NOW - 60 * 60_000)).toEqual({ n: 1, key: 'hoursAgo' })
    expect(relParts(NOW - 3 * 60 * 60_000)).toEqual({ n: 3, key: 'hoursAgo' })
    expect(relParts(NOW - 23 * 60 * 60_000)).toEqual({ n: 23, key: 'hoursAgo' })
  })

  it('reports days', () => {
    expect(relParts(NOW - 24 * 60 * 60_000)).toEqual({ n: 1, key: 'daysAgo' })
    expect(relParts(NOW - 2 * 24 * 60 * 60_000)).toEqual({ n: 2, key: 'daysAgo' })
  })
})

describe('isZh / pick', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to Chinese when toj.lang is absent', () => {
    expect(localStorage.getItem('toj.lang')).toBeNull()
    expect(isZh()).toBe(true)
    expect(pick('中文', 'English')).toBe('中文')
  })

  it('switches to English when toj.lang is "en"', () => {
    localStorage.setItem('toj.lang', 'en')
    expect(isZh()).toBe(false)
    expect(pick('中文', 'English')).toBe('English')
  })

  it('treats any other value as Chinese', () => {
    localStorage.setItem('toj.lang', 'zh')
    expect(isZh()).toBe(true)
    expect(pick('中文', 'English')).toBe('中文')
  })
})
