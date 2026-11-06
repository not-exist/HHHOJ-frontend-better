import { describe, it, expect } from 'vitest'
import {
  hueOf,
  ratingColor,
  rankPercentColor,
  ratingSymbolCount,
  ratingTier,
  specialUsernameColor,
  isHexColor,
} from './user'

describe('hueOf', () => {
  it('is deterministic', () => {
    expect(hueOf('alice')).toBe(hueOf('alice'))
    expect(hueOf('zhuchuanqi')).toBe(hueOf('zhuchuanqi'))
  })

  it('always stays within 0..359', () => {
    const names = ['', 'a', 'alice', 'zhuchuanqi', 'a-very-long-username-'.repeat(20), '张三', '😀']
    for (const name of names) {
      const hue = hueOf(name)
      expect(Number.isInteger(hue)).toBe(true)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })

  it('gives different hues for different names', () => {
    expect(hueOf('a')).toBe(97)
    expect(hueOf('b')).toBe(98)
    expect(hueOf('alice')).not.toBe(hueOf('bob'))
  })
})

describe('ratingColor', () => {
  const RGB = /^rgb\(\d{1,3},\d{1,3},\d{1,3}\)$/

  it('returns an rgb() string with channels in 0..255', () => {
    for (const rating of [0, 300, 1000, 1499, 1500, 2000, 2500, 4000]) {
      const color = ratingColor(rating)
      expect(color).toMatch(RGB)
      const [r, g, b] = color.slice(4, -1).split(',').map(Number)
      for (const channel of [r, g, b]) {
        expect(channel).toBeGreaterThanOrEqual(0)
        expect(channel).toBeLessThanOrEqual(255)
      }
    }
  })

  it('clamps ratings below 300', () => {
    expect(ratingColor(0)).toBe(ratingColor(300))
    expect(ratingColor(299)).toBe(ratingColor(300))
  })

  it('clamps ratings above 2500', () => {
    expect(ratingColor(2500)).toBe(ratingColor(4000))
    expect(ratingColor(2500)).toBe('rgb(255,0,0)')
  })
})

describe('rankPercentColor', () => {
  it('maps rank percent 0 to the 2500 rating color and 1 to 300', () => {
    expect(rankPercentColor(0)).toBe(ratingColor(2500))
    expect(rankPercentColor(1)).toBe(ratingColor(300))
  })

  it('clamps values outside 0..1', () => {
    expect(rankPercentColor(-0.5)).toBe(ratingColor(2500))
    expect(rankPercentColor(1.5)).toBe(ratingColor(300))
    expect(rankPercentColor(0.5)).toBe(ratingColor(1400))
  })
})

describe('ratingSymbolCount', () => {
  it('is zero below 2500', () => {
    expect(ratingSymbolCount(2499)).toBe(0)
    expect(ratingSymbolCount(0)).toBe(0)
  })

  it('adds one symbol per started 200 points', () => {
    expect(ratingSymbolCount(2500)).toBe(1)
    expect(ratingSymbolCount(2699)).toBe(1)
    expect(ratingSymbolCount(2700)).toBe(2)
    expect(ratingSymbolCount(2900)).toBe(3)
  })
})

describe('ratingTier', () => {
  it('uses the documented boundaries', () => {
    expect(ratingTier(1199)).toBe(0)
    expect(ratingTier(1200)).toBe(1)
    expect(ratingTier(1499)).toBe(1)
    expect(ratingTier(1500)).toBe(2)
    expect(ratingTier(1799)).toBe(2)
    expect(ratingTier(1800)).toBe(3)
    expect(ratingTier(2099)).toBe(3)
    expect(ratingTier(2100)).toBe(4)
    expect(ratingTier(2399)).toBe(4)
    expect(ratingTier(2400)).toBe(5)
  })
})

describe('specialUsernameColor / isHexColor', () => {
  it('returns the fixed color for special names', () => {
    expect(specialUsernameColor('zhuchuanqi')).toBe('#AD8B00')
  })

  it('returns null for unknown names', () => {
    expect(specialUsernameColor('alice')).toBeNull()
  })

  it('recognises six-digit hex colors', () => {
    expect(isHexColor('#AD8B00')).toBe(true)
    expect(isHexColor('#abcdef')).toBe(true)
    expect(isHexColor('AD8B00')).toBe(false)
    expect(isHexColor('#AD8B0')).toBe(false)
    expect(isHexColor('#AD8B00FF')).toBe(false)
  })
})
