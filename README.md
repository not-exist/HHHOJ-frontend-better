# HHHOJ × TwilightOJ 接管脚本

一个 Tampermonkey 用户脚本：访问 HHHOJ 时，把整页替换为 [TwilightOJ](https://github.com/Spr-Aachen/Twilight) 风格的 React OJ 界面，数据全部来自 HHHOJ 真实 `/api/*`。TwilightOJ 没有覆盖的页面（博客写作、私信、管理后台、ranklist、提交详情等）会**自动回退原站**，不损失功能。

- 构建产物：`dist/hhhoj-twilight.user.js`（单文件，约 2.7 MB / gzip 约 600 KB）
- 数据源：HHHOJ 本地 `http://127.0.0.1:18080`（生产域名见下方 `@match` 配置）
- 设计基线：仓库 `base` 分支的 TwilightOJ（React 18 + Vite 5 + CodeMirror 6 + i18next）

## 安装

```bash
pnpm install
pnpm build
```

把 `dist/hhhoj-twilight.user.js` 拖进 Tampermonkey / Violentmonkey 的“添加新脚本”页面，保存后访问：

```
http://127.0.0.1:18080/
```

生产域名需要先改 `vite.config.ts` 里的 `userscript.match`：

```ts
match: ['https://your-hhhoj-domain.example/*', 'http://127.0.0.1:18080/*', 'http://localhost:18080/*'],
```

> 仓库里的 `https://hhhoj.example.com/*` 只是占位符，直接安装不会匹配任何真实生产站。

## 开发

```bash
pnpm dev        # vite-plugin-monkey dev server，按提示安装 dev 版用户脚本
pnpm build      # 类型检查 + 单文件用户脚本
pnpm typecheck  # 只做类型检查
```

`pnpm dev` 的根页面是 vite-plugin-monkey 的**脚本安装页**，不是应用页面；安装 dev 脚本后访问 `127.0.0.1:18080`，主应用会从 dev server 加载并支持 HMR。

### 演示 / mock 模式

```text
http://127.0.0.1:18080/?__mock=1    # 使用内置 mock 数据（保留模拟评测引擎）
http://127.0.0.1:18080/?__mock=0    # 关闭 mock
```

mock 模式标记存在 `sessionStorage`，进入后当前标签页内继续生效。`src/main.tsx` 保留独立挂载入口，供不经过接管层的预览使用；`pnpm dev` 的根页面则是 vite-plugin-monkey 的脚本安装页，不是应用页面。

## 接管范围

| 原站路径 | TwilightOJ 页面 | 数据源 |
|---|---|---|
| `/` | Home | `/api/home` + `/api/contests` |
| `/problems` | Problems | `/api/problems`（需登录） |
| `/problem/:id` | ProblemDetail | `/api/problems/:id`，支持 `?contest_id=` |
| `/submissions` | Status | `/api/submissions` + `/api/submissions/status` 轮询 |
| `/contests` | Contests | `/api/contests` |
| `/contest/:id`、`/contest/:id/standings` | ContestDetail | dashboard / standings |
| `/blogs`、`/blogs/:id`、`/post/:id` | Discuss / DiscussThread | `/api/blogs(/:id)` |
| `/user/profile/:username` | UserProfile | `/api/users/:username` + 提交/博客补充 |
| `/login`、`/register` | Login / Register | `/api/auth/*` |

**表外路径全部回退原站**，包括但不限于：

- `/faq`、`/announcements`、`/ranklist`、`/rankproblemlist`
- `/submission/:id`、`/contest/:id/submissions`、`/contest/:id/register`
- `/blog/:username/...` 博客写作、`/user/msg` 私信、`/super-manage/...` 管理后台、捐赠页面
- `/contest/:contest_id/problem/:id` 比赛内题目页（保留原站的比赛上下文与提交限制）

路由门在 `src/takeover.ts` 中，路径不在表内时脚本不会碰 DOM，原站照常启动。

## 逃生舱

任意时刻都可以切回原站，且不会丢失任何功能：

| 方式 | 行为 |
|---|---|
| `?native=1` | 持久设置为原站模式并 reload |
| `?takeover=1` | 清除原站模式并 reload，恢复接管 |
| GM 菜单 → 切换为 HHHOJ 原站界面 | 同 `?native=1` |
| GM 菜单 → 重新启用 TwilightOJ 接管 | 同 `?takeover=1` |
| 设置抽屉 → 切换到 HHHOJ 原站 | 同 `?native=1` |

原站模式标记存在 GM 存储 `toj.takeover.native`；没有 GM 存储时退回 `localStorage`。

## 接管层原理

1. **document-start 路由门**：路径不在接管表内 → 直接退出。
2. **阻止原站启动**：临时让 `document.getElementById('root')` 返回 `null`，原站内联 shell 与 `main.tsx` 在挂载时抛错跳过；`#root` 出现即移除。
3. **样式隔离**：解析期间用 MutationObserver 移除非本脚本的 `<link rel=stylesheet>` / `<style>`；挂载前整体清扫一次，之后 observer 继续只拦截迟到的 stylesheet link 与 `#root`，不再删除 `<style>`，避免误伤 CodeMirror 的运行时样式。
4. **延迟求值**：React、CodeMirror、KaTeX 通过动态 import 在 DOMContentLoaded 后才求值（CodeMirror 在模块初始化时会读 `document.documentElement`）；vite-plugin-monkey 使用 inline SystemJS 保证动态 import 真正延迟。
5. **挂载**：清空 `<body>`，挂载 `<div id="twilight-root">`，完整主题 CSS 注入到带 `data-twilight-style="full"` 的 `<style>` 中。

详细说明见 [docs/takeover.md](docs/takeover.md)。

## 数据映射

- 时间：HHHOJ 的 `YYYY-MM-DD HH:MM:SS` 按 `Asia/Shanghai` 解析。
- 内存：HHHOJ 的 `used_memory` / 测试点 `memory` 是 KB，界面统一换算成 MB。
- 难度：HHHOJ 没有题目难度字段，按通过率估算六档（仅用于视觉分档，文档中标注为估算）。
- 评测结果：`Waiting` → Pending，`Judging` → Judging，`Judged` + score → Accepted / WrongAnswer；`result_error` 含 `compile` → CompileError，否则 RuntimeError；提交详情优先用测试点 XML 的 `info` 精修。
- 语言、题面 HTML、博客 HTML、评论 HTML 等逐字段对照见 [docs/api-mapping.md](docs/api-mapping.md)。
- 题面/博客/评论 HTML 一律经 DOMPurify 消毒；`$...$` / `$$...$$` 用 KaTeX 的 **MathML** 输出，不依赖 KaTeX 字体文件。

## 已知限制

- 多文件 / 文本文件提交的题目在接管页只显示提示并提供“在原站提交”链接；单源码文件提交完整可用。
- 比赛内题目详情、比赛报名、提交详情等仍走原站（表外路径）。
- 提交记录页读取最近 100 条后在浏览器内筛选/分页；HHHOJ 的 verdict 不是服务端筛选字段。
- 博客评论一次加载前 20 条，更多请回原站。
- 生产部署前需自行替换 `@match` 占位域名。

## 目录

```
src/
  takeover.ts        路由门 / 逃生舱 / 原站启动压制 / 样式清扫 / 挂载
  userscript.ts      vite-plugin-monkey 入口（document-start）
  bootstrap.tsx      React 应用、主题、AuthProvider、CSS 注入
  services/
    api/             index.ts（real/mock 选择）、real.ts、mock.ts、http.ts、types.ts
    gm.ts            GM 存储与菜单（无 GM 时 localStorage 兜底）
    useApi.ts       页面级异步读取 hook
    md5.ts           HHHOJ 客户端加盐 MD5
  pages/             接管后的 10 个页面
  components/        NavBar、CodeEditor、RatingChart、SafeHtml、AsyncState…
  mock/              演示数据与模拟评测引擎
docs/
  takeover.md        接管架构与生命周期
  api-mapping.md     字段映射对照表
```

## 致谢

界面与设计语言来自 [Spr-Aachen/Twilight](https://github.com/Spr-Aachen/Twilight)；数据与交互对齐 [HHHOJ](https://github.com/quzhou-no-2-school/HHHOJ)（基于 [UOJ](https://github.com/vfleaking/uoj)）。
