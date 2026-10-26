# 接管架构

本文说明脚本如何在不修改 HHHOJ 服务端、也不修改原站前端代码的前提下，把 TwilightOJ 整页挂到 HHHOJ 上。

## 1. 执行时序

```text
Tampermonkey @run-at document-start
        │
        ▼
src/userscript.ts
  └─ bootTakeover()
       ├─ ?native=1 / ?takeover=1 逃生舱（设置 GM 值并 reload）
       ├─ isNativeMode() → 直接退出
       ├─ 路由门：路径不在接管表 → 直接退出（原站完全不受影响）
       └─ whenDocumentElement()
            ├─ installNativeGuard()
            │    ├─ html[data-twilight]
            │    ├─ Document.prototype.getElementById('root') → null
            │    ├─ 首屏遮罩 <style data-twilight-style="cover">
            │    └─ MutationObserver：移除 #root / 原站 stylesheet / 挂载前的 <style>
            └─ DOMContentLoaded → mount()
                 ├─ 最后一次样式清扫 + 断开 observer
                 ├─ 移除 #root，清空 <body>
                 ├─ 挂载 <div id="twilight-root">
                 ├─ 移除 cover 样式
                 ├─ restoreGetElementById()
                 └─ import('./bootstrap') → renderTwilightApp()
```

关键点：**整个 React 应用是动态 import 的**。CodeMirror 在模块初始化阶段就会访问 `document.documentElement.style`，而 document-start 时 `<html>` 可能尚未创建；如果静态 import 会让整个脚本在挂载前抛错。`vite.config.ts` 中 `build.systemjs: 'inline'` 让动态 import 在单文件用户脚本里仍然延迟求值。

## 2. 路由门

```ts
const TAKEOVER_ROUTES = [
  /^\/$/, /^\/problems\/?$/, /^\/problem\/\d+\/?$/,
  /^\/submissions\/?$/, /^\/contests\/?$/,
  /^\/contest\/\d+\/?$/, /^\/contest\/\d+\/standings\/?$/,
  /^\/blogs\/?$/, /^\/blogs\/\d+\/?$/, /^\/post\/\d+\/?$/,
  /^\/user\/profile\/[^/]+\/?$/, /^\/login\/?$/, /^\/register\/?$/,
]
```

- 表外路径在脚本入口直接 `return`，不注册 observer、不改写 DOM，原站 SPA 正常启动。
- `?native=1` / `?takeover=1` 在路由门之前处理，因此即使在表外路径也可以切换模式。
- `?__mock=1` 只影响数据层，不影响路由门。

原站路径刻意保持原样（`/problem/:id` 单数、`/submissions`、`/blogs`、`/user/profile/:username`），旧链接和书签不需要重定向。

## 3. 阻止原站启动

HHHOJ 原站入口有两处依赖 `#root`：

```html
<div id="root"></div>
<script>
  document.getElementById('root').append(/* prerendered shell */)
</script>
<script type="module" src="/src/main.tsx"></script>
```

```ts
createRoot(document.getElementById('root')!, ...)
```

接管层的做法：

1. 在 document-start 覆盖 `Document.prototype.getElementById`，对 `'root'` 返回 `null`；
2. MutationObserver 在 `#root` 被解析出来时立即移除；
3. 挂载前再次 `querySelectorAll('#root').forEach(remove)`；
4. 挂载后恢复原生 `getElementById`（此时页面里已经没有 `#root`，原站也不会复活）。

预期结果：原站内联 shell 与 React 入口各抛一次异常（`null.append` / React error #299），原站应用永不挂载。这两条异常会出现在控制台，但不影响页面；不会影响原站路由的回退，因为回退是一次全新的页面加载，脚本在路由门就退出了。

## 4. 样式隔离

TwilightOJ 的 CSS 是全局的（`:root`、`body`、`.glass` 等），因此接管页不尝试把几万行 CSS 逐条加前缀，而是**确保页面上只存在一套 CSS**：

- **解析期**：MutationObserver 移除非本脚本的 `link[rel~=stylesheet]` 与 `<style>`，同时移除 `#root`。
- **挂载前**：`stripNativeStyles(true)` 做最后一次全量清扫，然后断开 observer。
- **本脚本样式**：全部挂在 `<style data-twilight-style="full">`，由 `injectTwilightStyles()` 注入；首屏遮罩是 `data-twilight-style="cover"`，挂载时删除。
- **CodeMirror**：它在运行时注入自己的 `<style>`。因为在它加载之前 observer 已经断开，所以不会被误删。
- **回退页**：脚本在路由门退出，原站样式完全不受影响；接管页与原站页之间只通过整页 reload 切换，不存在跨状态 CSS 残留。

字体不引 CDN：`tokens.css` 使用 `PingFang SC / Noto Sans SC / Microsoft YaHei / system-ui` 等本地字体栈。KaTeX 使用 MathML 输出，不加载 KaTeX 字体。

## 5. 主题与外壳

- `ThemeProvider` 在 `document.documentElement` 上写 `data-mode="light|dark"` 与 `--hue`；Twilight 令牌据此派生全部颜色。
- 接管页的 `html[data-twilight]` 同时保留，供接管层判断“当前页面是否由脚本接管”（独立 dev 预览据此走 mock）。
- 页面标题由 `App.tsx` 的 `usePageTitle` 按路由设置。
- 导航只链接接管表内路径；页脚、设置抽屉中的“原站”入口是普通 `<a>`，会整页 reload 并自然回退。

## 6. 逃生舱

| 入口 | 存储 | 生效方式 |
|---|---|---|
| `?native=1` | `toj.takeover.native = true` | 设置后 `location.replace` 去掉参数并 reload |
| `?takeover=1` | `toj.takeover.native = false` | 同上 |
| GM 菜单 | 同上 | `location.reload()` |
| 设置抽屉 | 同上 | `location.reload()` |

GM 存储通过 `vite-plugin-monkey` 的 `$` 客户端读写；在没有 GM API 的环境（独立预览、Playwright 注入）下退回 `localStorage['gm:toj.takeover.native']`。

## 7. 生产适配

1. 修改 `vite.config.ts` 的 `userscript.match`，加入真实域名；删除/替换占位 `https://hhhoj.example.com/*`。
2. 确认生产 `index.html` 仍然用 `#root` 作为 React 容器。若原站改为其他 id，接管层的 `getElementById` 覆盖与 `#root` 移除需要同步修改（`src/takeover.ts`）。
3. 生产 `index.html` 可能带预取表和预加载 CSS；接管层会清掉样式表，预取请求本身无害；`window.__reads` 不会被原站使用，因为原站应用已被阻止。
4. 生产原站可能启用 CSP。`<style>` 注入与内联脚本由用户脚本执行，通常不受页面 CSP 限制；若遇到 CSP 阻止，需在 Tampermonkey 中放行或改用 GM_addStyle。

## 8. 故障模式与对策

| 现象 | 原因 | 对策 |
|---|---|---|
| 页面一直空白 | 动态 import 失败 / CodeMirror 初始化异常 | 控制台看 `[TwilightOJ] 挂载失败`；`?native=1` 回原站 |
| 原站界面闪一下 | 首屏遮罩被移除过早 | 遮罩在 `mount()` 后移除，正常不会闪；若出现检查是否走了表外路径 |
| 样式错乱 | 原站样式在 observer 断开后重新注入（dev HMR） | 生产不会；dev 下刷新即可 |
| `#root` 找不到但页面是原站 | 路由不在接管表 | 预期行为 |
| 登录后仍是未登录态 | Cookie 被浏览器阻止 / 非同源 | 确认通过 `127.0.0.1:18080` 访问，而不是直接打开 `dist` 文件 |
