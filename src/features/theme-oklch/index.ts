// P0 theme-oklch: applies the hue/mode to <html> and reacts to settings changes.
// The stylesheet (theme.css) carries the whole OKLCH variable system and the
// Bootstrap overrides; this module only owns the classes and the transition guard.
import { onSettings, settings, type RadiusLevel, type ThemeMode } from '../../services/store'
import css from './theme.css'

const RADIUS: Record<RadiusLevel, string> = { none: '0px', small: '0.5rem', large: '1rem' }

const html = document.documentElement

function isDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyMode(): void {
  const dark = isDark(settings().theme.mode)
  if (dark === html.classList.contains('hfb-dark')) return
  // Twilight's is-theme-transitioning guard, applied synchronously: flush with
  // transitions disabled, flip the mode, flush again, restore. No timers, so it
  // also holds in suspended/occluded views where rAF and setTimeout stall.
  html.classList.add('hfb-theme-transitioning')
  void html.offsetWidth
  html.classList.toggle('hfb-dark', dark)
  void html.offsetWidth
  html.classList.remove('hfb-theme-transitioning')
}

function applyHue(): void {
  html.style.setProperty('--hue', String(settings().theme.hue))
}

// 字号（uoj-theme 把 html 定在 14px，内联样式覆盖它）与圆角档位。
function applyAppearance(): void {
  const { fontSize, radius } = settings().appearance
  html.style.fontSize = `${fontSize}px`
  html.style.setProperty('--radius-large', RADIUS[radius])
}

export default {
  id: 'theme-oklch',
  title: 'OKLCH 主题（含暗色模式）',
  description: '全站颜色由单一色相派生，支持浅色/深色/跟随系统',
  defaultOn: true,
  css,
  setup(): () => void {
    applyMode()
    applyHue()
    applyAppearance()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onMedia = () => applyMode()
    media.addEventListener('change', onMedia)
    const off = onSettings(() => {
      applyMode()
      applyHue()
      applyAppearance()
    })
    return () => {
      media.removeEventListener('change', onMedia)
      off()
      html.classList.remove('hfb-dark', 'hfb-theme-transitioning')
      html.style.removeProperty('--hue')
      html.style.removeProperty('--radius-large')
      html.style.removeProperty('font-size')
    }
  },
}
