import { describe, it, expect, afterEach } from 'vitest'
import { renderMath } from './math'

afterEach(() => {
  document.body.replaceChildren()
})

function render(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  renderMath(host)
  return host
}

describe('renderMath', () => {
  it('renders inline $...$ with MathML', () => {
    const host = render('<p>$x^2$</p>')

    const math = host.querySelector('math')
    expect(math).not.toBeNull()
    expect(math?.textContent).toContain('x')
    expect(host.textContent).not.toContain('$')
  })

  it('renders display $$...$$ with block MathML', () => {
    const host = render('<p>$$\\sum_i i$$</p>')

    const math = host.querySelector('math')
    expect(math).not.toBeNull()
    expect(math?.getAttribute('display')).toBe('block')
    expect(host.textContent).not.toContain('$$')
  })

  it('renders \\(...\\) and \\[...\\] delimiters', () => {
    const inline = render('<p>\\(a+b\\)</p>')
    expect(inline.querySelector('math')).not.toBeNull()

    const display = render('<p>\\[a+b\\]</p>')
    expect(display.querySelector('math')?.getAttribute('display')).toBe('block')
  })

  it('rewrites surrounding text and keeps the rest', () => {
    const host = render('<p>before $x$ after</p>')

    expect(host.querySelector('math')).not.toBeNull()
    expect(host.textContent).toContain('before')
    expect(host.textContent).toContain('after')
    expect(host.textContent).not.toContain('$x$')
  })

  it('never converts text inside pre or code', () => {
    const host = render('<pre>$x^2$</pre><code>$y$</code><p>$z$</p>')

    expect(host.querySelector('pre math')).toBeNull()
    expect(host.querySelector('code math')).toBeNull()
    expect(host.querySelector('pre')?.textContent).toBe('$x^2$')
    expect(host.querySelector('code')?.textContent).toBe('$y$')
    expect(host.querySelector('p math')).not.toBeNull()
  })

  it('leaves an unmatched lone dollar sign as plain text', () => {
    const host = render('<p>cost $5 only</p>')

    expect(host.querySelector('math')).toBeNull()
    expect(host.textContent).toBe('cost $5 only')
  })

  it('does not treat an empty pair of dollars as math', () => {
    const host = render('<p>a $$ b</p>')

    expect(host.querySelector('math')).toBeNull()
    expect(host.textContent).toBe('a $$ b')
  })
})
