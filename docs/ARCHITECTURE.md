# HHHOJ Frontend Better —— 篡改猴（Tampermonkey）插件架构方案

> 参考代码：`/home/qzez/HHHOJ`（Quzhou-No-2-School/HHHOJ）。
> 本插件目标：在不修改 HHHOJ 源码与后端的前提下，通过用户脚本优化其前端使用体验。

## 一、研读结论：与插件设计相关的关键事实

### 前端（frontend/src，React 19 + Vite 8 + React Router 7 + Bootstrap 4.6.2）

1. **全站是 SPA**。React 通过 `createRoot` 接管 `#root`（`main.tsx`），页面切换不触发整页加载。
   插件不能依赖"每个 URL 重新执行脚本"的假设，必须自己感知 SPA 导航。
2. **数据层高度统一**（`api.ts`）：
   - 所有读操作走 `fetch('/api/...')`，统一响应信封 `{ success, code, message, ... }`；
   - 带一个 stale-while-revalidate 读缓存（ETag）；
   - 写操作（POST）成功后使全部缓存失效。
   → **拦截 `window.fetch` 即可观测/增强全站一切数据流**（题单、提交、榜单、消息……）。
3. **首屏预取机制**（`vite-plugins/page-html.ts` + `src/prefetch.ts`）：
   index.html 内联脚本以全局 `hhhojPrefetch` 在 bundle 之前发起 viewer（`/api/auth/me`）与当前页
   的声明式 reads，并通过 `window.__reads` 与 SPA 握手。这是 document-start 阶段就存在的
   全局对象，可用来感知"应用即将打开哪一页"。
4. **路由表是纯数据**（`routes.ts`，约 50 条路由；`reads.ts` 定义各页 reads）。
   插件的功能开关（`@match` 之外的细粒度路由匹配）可直接对齐这张表，如
   `/problem/:id`、`/contest/:id/standings`、`/submissions`、`/submission/:id`。
5. **身份**：`/api/auth/me` 是根路由的公共读，返回 `{ user, selected_group }`；
   `usergroup`：0 待审 / 1 用户 / 2 管理 / 3 教师 / 4 开发。权限相关功能以它为准。
6. **判题轮询**：`useSubmissionStatus` 对未完成的提交每 **500ms** 轮询
   `GET /api/submissions/status?ids=1,2,...`，完成即刷新列表。
   → "判题完成通知/提示音"等功能监听该接口即可，无需自己实现轮询。
7. **提交表单**（`SubmissionForm.tsx`）：草稿自动保存在 **localStorage**（`autosaveKey()`），
   编辑器是 **CodeMirror 6**（DOM 根为 `.cm-editor`）。
8. **样式体系**：Bootstrap 4 + 自定义 `uoj-theme.css`（`uoj-content`、`uoj-score`、`uoj-footer` 等语义类）。
   纯视觉优化（暗色模式、字号、表格密度等）用 CSS 覆盖即可，稳定且零 JS 风险。

### 后端（server/，C++ httplib，:8080；开发环境经 vite/nginx 代理 `/api`）

- 约 130 条 REST 路由（`server/src/server/routes.cpp`），全部 JSON 信封；认证为 Cookie 会话。
- 生产部署 docker-compose（Web :18080）；本地开发站点 `http://127.0.0.1:18080`（已在运行）。
- 对插件而言后端只是数据源，不需要任何后端改动；一切增强走"读 API + 前端呈现"。

## 二、插件总体架构

### 分层

```
┌─────────────────────────────────────────────────────────┐
│ L5  设置面板 / 浮动入口 / Toast（Shadow DOM，body 直挂）      │
├─────────────────────────────────────────────────────────┤
│ L4  Feature 模块（每功能一模块，声明式注册 + 路由匹配）        │
├─────────────────────────────────────────────────────────┤
│ L3  服务：设置存储(GM_*) · i18n · CSS 注入 · 日志           │
├─────────────────────────────────────────────────────────┤
│ L2  Bridge：fetch 拦截(unsafeWindow) · window.__reads 握手 │
│     · DOM 工具(waitForSelector)                          │
├─────────────────────────────────────────────────────────┤
│ L1  Runtime：SPA 导航感知 · 生命周期总线 · 模块启停          │
├─────────────────────────────────────────────────────────┤
│ L0  元数据：@match · @run-at document-start · @grant       │
└─────────────────────────────────────────────────────────┘
```

### L0 脚本元数据

- `@match http://127.0.0.1:18080/*`（本地开发站点）+ 生产域名（待部署地址确定后追加）。
- `@run-at document-start`：必须早于页面脚本，才能抢在 React 应用与预取脚本之前包装好
  `fetch` 拦截器；UI 挂载统一推迟到 DOM ready 之后。
- `@grant unsafeWindow, GM_getValue/GM_setValue/GM_deleteValue, GM_addValueChangeListener,
  GM_addStyle, GM_registerMenuCommand, GM_setClipboard`。
- 所有 DOM/UI 操作在插件自己的容器（body 直挂节点 + Shadow DOM），**不进入 React 管辖的
  `#root` 内部**，从根本上避免 React 协调时删除插件节点。

### L1 Runtime（`src/core/runtime.ts`）

- **SPA 导航感知**：包装 `history.pushState/replaceState` + 监听 `popstate`，
  归一化派发 `route:change` 事件（携带 from、to、按 `routes.ts` 同款模式解析出的 params）；
  以 `#root` 上的 MutationObserver 兜底校验。
- **生命周期总线**：`onRouteChange / onReady / onDestroy`；路由变化时对命令式模块执行
  teardown → setup，保证跨页导航后无残留 DOM 与监听器。

### L2 Bridge（`src/core/bridge.ts`）

- **fetch 拦截**：对 `unsafeWindow.fetch` 做一次性包装，`/api/` 前缀的请求解析统一信封后
  广播 `api:response` 事件（路径、查询、JSON）。所有数据类功能订阅它，不重复发请求。
  已知限制：index.html 内联预取脚本的首批请求可能早于包装时机，拦截器收不到；
  这批数据 SPA 稍后会经缓存 revalidate，届时仍会经过拦截器，功能上可接受。
- **DOM 工具**：`waitFor(selector)` 基于 MutationObserver（禁止轮询）。

### L3 服务

- `store.ts`：以 `GM_getValue/GM_setValue` 持久化设置树 + 内存响应式副本 +
  `GM_addValueChangeListener` 跨标签页同步。
- `style.ts`：每个功能可声明一段 CSS，启用即注入（`GM_addStyle`），停用即移除。
- `ui.ts`：Toast、设置面板等通用组件（Shadow DOM 隔离样式）。

### L4 Feature 模块系统

每个功能 = 一个自包含模块，接口统一：

```ts
interface Feature {
  id: string                    // 如 'judge-toast'
  title: string                 // 设置面板显示名
  defaultOn: boolean
  match?: RegExp | (url: URL) => boolean   // 生效路由（对齐 routes.ts）
  style?: string                // 纯 CSS 型功能
  setup?(ctx: FeatureCtx): void | (() => void)  // 命令式型，返回清理函数
}
```

- `src/features/index.ts` 汇总注册；设置面板按模块开关。
- 两类形态：**纯 CSS 型**（视觉优化，最安全）与**命令式型**（需要 DOM/数据交互）。

### L5 设置 UI

- 右下角浮动入口（body 直挂 + Shadow DOM），面板内：功能开关、站点白名单、导入导出。
- 命令菜单注册 `GM_registerMenuCommand('设置', ...)` 作为兜底入口。

## 三、工程形态与目录

- **构建**：TypeScript + Vite + `vite-plugin-monkey`（开发时热更新到本地站点，产物为单个
  `.user.js`）。备选：纯 esbuild（更轻，无热更）。
- **代码对接约定**：`src/api/` 内放一份手写的 HHHOJ API 类型摘要（仅本插件用到的接口），
  与 `frontend/src/routes.ts`、`reads.ts` 对齐并注明来源文件，便于上游改名时对照维护。

```
HHHOJ-frontend-better/
├── package.json  vite.config.ts  tsconfig.json
├── src/
│   ├── main.ts               # 入口：装配 runtime、注册全部 feature
│   ├── core/                 # L1–L2：runtime / bridge / dom
│   ├── services/             # L3：store / style / ui / log
│   ├── api/                  # HHHOJ API 类型摘要与请求封装
│   └── features/
│       ├── index.ts          # 注册表
│       └── <feature>/        # 每个功能一个目录（ts + css）
└── docs/ARCHITECTURE.md
```

## 四、开发与验证流程

1. 本地起 HHHOJ（已具备）：Web `http://127.0.0.1:18080`，后端 hhhoj `:8080` 由代理转发。
2. 插件开发：`pnpm dev`（vite-plugin-monkey 输出本地 dev 脚本，篡改猴安装一次即可热更）。
3. 验证：ZCode 的浏览器自动化（GUI 黑盒点击/截图）逐功能验收；发布前在
   `@match` 全部路由上过一遍冒烟（导航往返后无残留 DOM、无 React 报错）。

## 五、兼容性红线（来自研读的硬约束）

1. **不在 React 管辖区内直接插入节点**：插件 UI 一律挂 body 直挂容器/Shadow DOM；
   需要贴着页面元素展示时，用绝对定位覆盖或把节点插到 React 子树之外。
2. **不修改页面全局对象除 fetch/简必要的钩子**，且包装必须"透传语义"，只读不改请求/响应
   （除非某功能明确需要），避免破坏 stale-while-revalidate 缓存语义。
3. **写操作（POST）不走插件**：插件只读 API；任何"代发请求"类功能都属红线外，需单独评审。
4. **每功能可独立关闭**，默认配置保守，杜绝影响比赛页等关键路径的默认行为。
5. localStorage 草稿、Cookie（`uoj_locale`、`group`）只读不写，避免破坏站点自身约定。

## 六、候选功能模块（占位，最终以需求方指定为准）

以下为可选方向示例，正式清单待后续指令确定后逐个实现为 `features/<id>/`：

- 视觉类：暗色模式、表格/排版密度、字号（纯 CSS 型）
- 提交类：判题完成 Toast/提示音（订阅 `/api/submissions/status`）
- 导航类：全局快捷键（跳题目/提交/榜单）、题目页快捷回列表
- 数据类：题目本地收藏/备注（GM 存储 + 列表渲染挂件）
- 编辑器类：CodeMirror 体验增强（如字体、括号补全偏好）

---
*参考实现基线：HHHOJ commit `7a22450b`（2026-10）。*
