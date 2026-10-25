// Per-feature stylesheets, injected as the last children of <head> so they win
// over the site's own stylesheets at equal specificity. document-start safe.
const injected = new Map<string, HTMLStyleElement>()

export function injectStyle(id: string, css: string): void {
  if (injected.has(id)) return
  const el = document.createElement('style')
  el.setAttribute('data-hfb-style', id)
  el.textContent = css
  const parent = document.head ?? document.documentElement
  parent.append(el)
  injected.set(id, el)
}

export function removeStyle(id: string): void {
  injected.get(id)?.remove()
  injected.delete(id)
}
