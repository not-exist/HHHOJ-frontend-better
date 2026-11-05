import { describe, it, expect } from 'vitest'
import { hashPassword } from './md5'

describe('hashPassword', () => {
  it('is HMAC-MD5 with the HHHOJ client salt', () => {
    // 期望值由 node:crypto 独立计算：
    // createHmac('md5', 'IsVmReCClDLEBJGHemt9ZsIqxPambZFR').update(password).digest('hex')
    expect(hashPassword('password123')).toBe('20463cb81bcd14ee5bf84f72eb3b14c4')
    expect(hashPassword('a')).toBe('ea25216c9ec1997fcf84ec48fdc534b4')
    expect(hashPassword('Twilight!2024')).toBe('283c748839e8ef16c2c556533bfd4919')
  })

  it('is stable and hex encoded', () => {
    expect(hashPassword('same-input')).toBe(hashPassword('same-input'))
    expect(hashPassword('same-input')).toMatch(/^[0-9a-f]{32}$/)
    expect(hashPassword('x')).not.toBe(hashPassword('y'))
  })
})
