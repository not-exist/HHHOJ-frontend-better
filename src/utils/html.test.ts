import { describe, it, expect } from 'vitest'
import { sanitizeFragment } from './html'

function fragmentOf(html: string): DocumentFragment {
  return sanitizeFragment(html)
}

describe('sanitizeFragment', () => {
  it('returns a DocumentFragment', () => {
    const fragment = fragmentOf('<p>hello</p>')
    expect(fragment).toBeInstanceOf(DocumentFragment)
    expect(fragment.textContent).toBe('hello')
  })

  it('removes script elements', () => {
    const fragment = fragmentOf('<p>ok</p><script>alert(1)</script>')
    expect(fragment.querySelector('script')).toBeNull()
    expect(fragment.textContent).toContain('ok')
  })

  it('strips event handler attributes but keeps the image', () => {
    const fragment = fragmentOf('<img src="x" onerror="alert(1)">')
    const img = fragment.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('x')
    expect(img?.hasAttribute('onerror')).toBe(false)
  })

  it('keeps allowed target/rel/class attributes on links', () => {
    const fragment = fragmentOf(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer" class="link">x</a>',
    )
    const link = fragment.querySelector('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('https://example.com')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link?.getAttribute('class')).toBe('link')
  })

  it('drops javascript: URLs', () => {
    const fragment = fragmentOf('<a href="javascript:alert(1)">x</a>')
    const link = fragment.querySelector('a')
    expect(link?.getAttribute('href')).not.toBe('javascript:alert(1)')
  })
})
