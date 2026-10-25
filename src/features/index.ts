// L4 feature registry: 每个功能声明 id/title/defaultOn/css/setup，管理器负责
// 按设置的开关注入样式并执行 setup/teardown。顺序即样式注入顺序（theme 先于
// material-glass，后者对 .navbar 的覆盖才能胜出）。
import type { Settings } from '../services/store'
import { onSettings, settings, update } from '../services/store'
import { injectStyle, removeStyle } from '../services/style'
import themeOklch from './theme-oklch'
import materialGlass from './material-glass'
import modernSkin from './modern-skin'
import motionEntrance from './motion-entrance'
import ambientParticles from './ambient-particles'
import ambientWallpaper from './ambient-wallpaper'
import typographyFlavor from './typography-flavor'
import cleanBranding from './clean-branding'

export type FeatureApi = { onSettings: typeof onSettings }

export type Feature = {
  id: string
  title: string
  description?: string
  defaultOn: boolean
  css?: string
  setup?(api: FeatureApi): void | (() => void)
}

export const FEATURES: Feature[] = [
  themeOklch,
  cleanBranding,
  materialGlass,
  modernSkin,
  motionEntrance,
  ambientParticles,
  ambientWallpaper,
  typographyFlavor,
]

const api: FeatureApi = { onSettings }
const teardowns = new Map<string, () => void>()

export function isEnabled(id: string): boolean {
  return settings().features[id] ?? (FEATURES.find((f) => f.id === id)?.defaultOn ?? false)
}

function start(feature: Feature): void {
  if (teardowns.has(feature.id)) return
  if (feature.css !== undefined) injectStyle(feature.id, feature.css)
  try {
    const teardown = feature.setup?.(api)
    teardowns.set(feature.id, typeof teardown === 'function' ? teardown : () => {})
  } catch (e) {
    // One broken feature must not take down the rest of the plugin (or the panel).
    console.error(`[HHFB] feature ${feature.id} failed to start`, e)
    teardowns.delete(feature.id)
    removeStyle(feature.id)
  }
}

function stop(feature: Feature): void {
  const teardown = teardowns.get(feature.id)
  if (teardown === undefined) return
  teardown()
  teardowns.delete(feature.id)
  removeStyle(feature.id)
}

export function initFeatures(): void {
  // Feature defaults fill the settings once, saved values win afterwards.
  update((s: Settings) => {
    for (const f of FEATURES) if (s.features[f.id] === undefined) s.features[f.id] = f.defaultOn
  })
  for (const f of FEATURES) if (isEnabled(f.id)) start(f)
}

export function setEnabled(id: string, on: boolean): void {
  update((s) => {
    s.features[id] = on
  })
  const feature = FEATURES.find((f) => f.id === id)
  if (feature === undefined) return
  if (on) start(feature)
  else stop(feature)
}
