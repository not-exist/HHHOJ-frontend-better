// GM_* shims: under Tampermonkey the granted APIs exist; when the bundle runs as a
// plain page script (dev harness), fall back to localStorage so everything still works.
const LS_PREFIX = 'hfb:'

export function gmGet<T>(key: string, fallback: T): T {
  try {
    if (typeof GM_getValue === 'function') {
      const value = GM_getValue(key)
      return value === undefined ? fallback : (value as T)
    }
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function gmSet(key: string, value: unknown): void {
  try {
    if (typeof GM_setValue === 'function') {
      GM_setValue(key, value)
      return
    }
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage blocked or full: settings just won't persist.
  }
}

export function gmDelete(key: string): void {
  try {
    if (typeof GM_deleteValue === 'function') GM_deleteValue(key)
    else localStorage.removeItem(LS_PREFIX + key)
  } catch {
    /* ignore */
  }
}

// Notifies cb when the key changes from another tab. Under GM the listener takes
// the change directly; in fallback mode the storage event only fires cross-tab.
export function gmListen(key: string, cb: (value: unknown) => void): () => void {
  if (typeof GM_addValueChangeListener === 'function') {
    const id = GM_addValueChangeListener(key, (_k, _old, value, remote) => {
      if (remote) cb(value)
    })
    return () => GM_removeValueChangeListener?.(id)
  }
  const storageKey = LS_PREFIX + key
  const onStorage = (e: StorageEvent) => {
    if (e.key === storageKey && e.newValue !== null) {
      try {
        cb(JSON.parse(e.newValue))
      } catch {
        /* ignore */
      }
    }
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

// The page's own window: differs from ours under Tampermonkey's sandbox.
export function pageWindow(): Window {
  return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window
}

export function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function copyText(text: string): void {
  if (typeof GM_setClipboard === 'function') GM_setClipboard(text)
  else void navigator.clipboard?.writeText(text).catch(() => {})
}
