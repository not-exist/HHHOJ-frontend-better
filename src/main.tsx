import { renderTwilightApp } from './bootstrap'

/** 独立预览入口：/index.html 直接以 mock 模式运行 TwilightOJ */
const container = document.getElementById('root')
if (container) renderTwilightApp(container)
