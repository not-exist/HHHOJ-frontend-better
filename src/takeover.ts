import { isNativeMode, registerTakeoverMenu, setNativeMode } from './services/gm'

/**
 * 接管路由表：与 HHHOJ 原站路径保持一致。
 * 表外路径（博客写作、私信、管理后台、ranklist、submission 详情等）直接放行原站。
 */
const TAKEOVER_ROUTES: RegExp[] = [
  /^\/$/,
  /^\/problems\/?$/,
  /^\/problem\/\d+\/?$/,
  /^\/submissions\/?$/,
  /^\/contests\/?$/,
  /^\/contest\/\d+\/?$/,
  /^\/contest\/\d+\/standings\/?$/,
  /^\/blogs\/?$/,
  /^\/blogs\/\d+\/?$/,
  /^\/post\/\d+\/?$/,
  /^\/user\/profile\/[^/]+\/?$/,
  /^\/login\/?$/,
  /^\/register\/?$/,
]

const STYLE_ATTR = 'data-twilight-style'
const HTML_ATTR = 'data-twilight'

let mounted = false
let styleObserver: MutationObserver | null = null
let originalGetElementById: typeof Document.prototype.getElementById | null = null

function isTakeoverPath(pathname: string): boolean {
  return TAKEOVER_ROUTES.some((re) => re.test(pathname))
}

/** 去掉逃生舱参数后的 URL；保留其余 query 与 hash */
function withoutParam(name: string): string {
  const params = new URLSearchParams(location.search)
  params.delete(name)
  const query = params.toString()
  return location.pathname + (query ? `?${query}` : '') + location.hash
}

/**
 * 逃生舱：
 *   ?native=1    设置持久标记并重新加载 → 原站界面
 *   ?takeover=1  清除标记并重新加载 → 恢复接管
 * GM 菜单也提供同样的切换。
 */
function handleEscapeHatch(): boolean {
  const params = new URLSearchParams(location.search)
  if (params.get('native') === '1') {
    setNativeMode(true)
    location.replace(withoutParam('native'))
    return true
  }
  if (params.get('takeover') === '1') {
    setNativeMode(false)
    location.replace(withoutParam('takeover'))
    return true
  }
  return false
}

/** document-start 的极早阶段 documentElement 通常已存在，仍留一条兜底路径 */
function whenDocumentElement(fn: () => void): void {
  if (document.documentElement) {
    fn()
    return
  }
  const observer = new MutationObserver(() => {
    if (!document.documentElement) return
    observer.disconnect()
    fn()
  })
  observer.observe(document, { childList: true, subtree: true })
}

function isOurStyle(el: Element): boolean {
  return el.hasAttribute(STYLE_ATTR)
}

function isStylesheetLink(el: Element): boolean {
  return el.tagName === 'LINK' && (el.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet')
}

/** 清掉原站样式；挂载前连 <style> 一起清 */
function stripNativeStyles(includeStyleTags: boolean): void {
  document.querySelectorAll('link[rel~="stylesheet"], style').forEach((el) => {
    if (isOurStyle(el)) return
    if (el.tagName === 'STYLE' && !includeStyleTags) return
    el.remove()
  })
}

/** 原站的 #root 一旦出现就摘掉 */
function disarmNativeRoot(node: Node): void {
  if (!(node instanceof Element)) return
  if (node.id === 'root') {
    node.remove()
    return
  }
  node.querySelectorAll?.('#root').forEach((el) => el.remove())
}

function installNativeGuard(html: HTMLElement): void {
  html.setAttribute(HTML_ATTR, '1')

  // 让原站 index.html 的内联 shell 与 main.tsx 都拿不到 #root
  originalGetElementById = Document.prototype.getElementById
  Document.prototype.getElementById = function (id: string) {
    if (id === 'root') return null
    return originalGetElementById!.call(this, id)
  }

  // 首屏遮罩：原站 DOM 即使短暂出现也不会露出来
  const cover = document.createElement('style')
  cover.setAttribute(STYLE_ATTR, 'cover')
  cover.textContent = `
    html[data-twilight] { background: #0f0e17; }
    html[data-twilight] body { margin: 0; background: #0f0e17; }
    html[data-twilight] body > *:not(#twilight-root) { display: none !important; }
    #twilight-root { min-height: 100dvh; }
  `
  html.appendChild(cover)

  // 解析期间持续移除原站样式与 #root；挂载前会再整体清扫一次并断开
  styleObserver = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        disarmNativeRoot(node)
        if (!(node instanceof Element) || isOurStyle(node)) return
        if (isStylesheetLink(node)) node.remove()
        else if (node.tagName === 'STYLE' && !mounted) node.remove()
      })
    }
  })
  styleObserver.observe(html, { childList: true, subtree: true })
}

function restoreGetElementById(): void {
  if (!originalGetElementById) return
  Document.prototype.getElementById = originalGetElementById
  originalGetElementById = null
}

function mount(): void {
  if (mounted) return
  mounted = true

  const html = document.documentElement
  if (!html || !document.body) return

  // 原站 CSS 在 DOMContentLoaded 前已全部注入；清扫后 observer 只继续拦截
  // 迟到的 stylesheet link 和 #root，不再删除 <style>（避免误伤 CodeMirror）。
  stripNativeStyles(true)
  disarmNativeRoot(document.body)

  const body = document.body
  body.replaceChildren()
  body.removeAttribute('role')
  body.className = ''

  const container = document.createElement('div')
  container.id = 'twilight-root'
  body.appendChild(container)

  // 首屏遮罩只负责等待期；移除它后由完整主题样式接管背景与布局
  document.querySelectorAll(`style[${STYLE_ATTR}="cover"]`).forEach((el) => el.remove())

  restoreGetElementById()

  // 动态引入整个 React 应用：CodeMirror 在模块初始化时读取 document.documentElement，
  // 必须等 DOMContentLoaded 之后才求值。
  void import('./bootstrap')
    .then(({ renderTwilightApp }) => renderTwilightApp(container))
    .catch((error) => {
      console.error('[TwilightOJ] 挂载失败', error)
      container.textContent = 'TwilightOJ 挂载失败，请刷新页面或使用 ?native=1 返回原站。'
    })
}

export function bootTakeover(): void {
  if (handleEscapeHatch()) return
  if (isNativeMode()) return
  if (!isTakeoverPath(location.pathname)) return

  registerTakeoverMenu()

  whenDocumentElement(() => {
    installNativeGuard(document.documentElement)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true })
    } else {
      mount()
    }
  })
}
