// Runs cb once the DOM is ready. Features that touch the DOM (canvas layers, the
// settings panel) wait for this; style injection and fetch wrapping do not.
export function onReady(cb: () => void): void {
  if (document.readyState !== 'loading') cb()
  else document.addEventListener('DOMContentLoaded', () => cb(), { once: true })
}
