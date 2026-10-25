// HHHOJ Frontend Better — 入口。
// document-start 顺序：先包 fetch（抢在应用代码前），再装 runtime/样式/功能，
// DOM 相关部分（粒子画布、壁纸层、面板）各自等 DOMContentLoaded。
import { initBridge } from './core/bridge'
import { initRuntime } from './core/runtime'
import { initStore } from './services/store'
import { initFeatures } from './features'
import { initUI } from './ui/panel'

function boot(): void {
  initStore()
  initRuntime()
  initBridge()
  initFeatures()
  initUI()
}

try {
  boot()
} catch (e) {
  console.error('[HHFB] boot failed', e)
}
