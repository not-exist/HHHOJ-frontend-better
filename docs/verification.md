# 验证记录

验证环境：HHHOJ 本地容器 `http://127.0.0.1:18080`，Chromium（Playwright）以 `addInitScript` 在 document-start 注入构建产物，并 stub `GM_getValue / GM_setValue / GM_registerMenuCommand`。脚本行为与 Tampermonkey 安装后一致，只是 GM 存储落在 `localStorage['gm:*']`。

测试账号：`twilight_test`（本地临时账号，密码不在仓库中保存）。验证结束后已删除测试账号、测试博客、测试评论、临时提交与小组/题目权限，本地库恢复为 2 个用户 / 1 道题 / 1 条提交 / 0 篇博客。若要复现，请自行注册账号并由管理员审核（或直接使用已有账号）。

## 冒烟矩阵

| 页面 / 场景 | 路径 | 结果 |
|---|---|---|
| 首页（真实数据） | `/` | 公告、rating 榜、AC 榜、用户卡片、近期比赛区块正常；无公告时显示空态 |
| 题库 | `/problems` | 通过 `/api/problems` 拉全量并在前端筛选；难度按通过率估算；我的 AC / 尝试状态正确 |
| 题目详情 | `/problem/1` | 题面 HTML + KaTeX MathML（5 个 math 节点）、时空限制、语言下拉（C/C++/C++11/14/17）、CodeMirror 正常 |
| 真实提交 | `/problem/1` | FormData 提交成功，跳转 `/submissions?sid=N`，轮询至终态 |
| 评测状态 | `/submissions` | 列表、筛选、只看我的、详情弹窗、测试点表格正常；内存 3012 KB 显示 2.9 MB |
| 比赛列表 | `/contests` | 进行中/未开始/已结束分栏、OI 规则、倒计时/结束时间正常 |
| 比赛详情 | `/contest/1` | hero、Rated、描述 HTML、公告/题目/榜单 tab 正常 |
| 榜单 | `/contest/1/standings` | 空榜显示空态 + 原站榜单链接 |
| 讨论区列表 | `/blogs` | 真实博客列表；无帖子时空态 |
| 讨论详情 | `/blogs/1` | 博客 HTML、公式、评论 HTML、点赞、发表评论均正常 |
| 用户资料 | `/user/profile/twilight_test` | 资料卡、groups、统计、Rating 曲线（SVG）、三个 tab 正常 |
| 用户名配色 | 首页 / 状态 / 讨论 / 资料页 | 普通用户按 rank_percent 连续渐变；管理员彩虹；≥2500 有 ℵ；徽章显示 |
| Rating 曲线 | `/user/profile/twilight_test` | 500px、时间轴、评级渐变、悬浮 tooltip、点击固定、空历史单点 |
| 登录 | `/login` | 真实账号登录成功，`?to=` 回跳 |
| 注册 | `/register` | 真实注册请求成功；返回待审核提示并跳转登录 |
| 未登录访问 | `/problems` | 登录引导态，不白屏 |
| 深色主题 | 设置抽屉 | `html[data-mode=dark]`，玻璃材质/文字对比正常 |
| 主题色相 / 粒子 | 设置抽屉 / localStorage | `--hue=120` 生效；粒子 canvas 开/关数量 1/0 |
| 英文 | 设置抽屉 | 导航、首页、题库、状态等基础文案切换；少量硬编码中文提示保留 |
| mock 演示 | `/?__mock=1` | 首页公告/榜单、题库、题目详情、模拟用户 Rating 曲线正常 |
| 原站回退 | `/faq` | 原站 `#root` 正常渲染，页面无 `#twilight-root` |
| 逃生舱 | `/?native=1` → `/?takeover=1` | 原站 / 接管页来回切换正常 |

## 真实提交说明

本地 HHHOJ 的判题机日志显示：

```text
problem_data: None
Exception: failed to update problem data of #1
```

即本地测试库的 A+B 题目没有配置测试数据，判题机返回 `Judgement Failed`。接管层已正确完成：

1. 构造 `answer_answer_*` 表单并 `POST /api/problems/1/submissions`；
2. 拿到 `submission_id=2/3`；
3. 轮询 `/api/submissions/status` 直到 `judged`；
4. 列表显示终态（Runtime Error），详情弹窗显示源码与测试点区域。

这是服务端数据缺失，不是前端链路问题。同库中已有的 AC 提交 `#1` 在接管页详情中正确解析出 1 个测试点（AC / 1 ms / 3 MB / 100 分）。

## Rating 配色与曲线验证（2026-10-26）

在 `rating-fix` 分支上使用 `dist/hhhoj-twilight.user.js`（Playwright `addInitScript` 注入，Chromium headless）验证：

| 检查 | 结果 |
|---|---|
| 构建 | `pnpm typecheck` 通过；`pnpm build` 产物 2,640.00 kB / gzip 567.60 kB |
| 用户名连续配色 | mock 首页 11 个 `.user-link` 出现 10 种不同颜色，按 rank_percent 渐变 |
| ℵ 标记 | Nebula 2861 → `ℵℵ`，Astesia 2593 → `ℵ`，2499 → 无 |
| 特殊用户名 | `specialUsernameColor('zhuchuanqi') = #AD8B00` |
| 管理员 / 徽章 | 拦截 cards 返回 `is_superuser: true` + badge：类名 `uoj-username-admin`，`background-image` 为彩虹渐变，徽章 `DEV` 背景 `rgb(18,52,86)` |
| 批量请求 | 真实首页仅一次 `/api/users/cards?names=user` |
| 曲线几何 | viewBox `0 0 1153 500`，12 个 data circle，64 个 gradient stop，Y 轴 1500/2000/2500/3000 |
| 曲线交互 | hover 首个点出现 `= 1899 (0), 排名：1 / Round #1`；点击后 tooltip 关闭（原版 flot 行为） |
| 深色模式 | 渐变 rect `opacity=0.35`，图例背景 `rgba(20,20,28,0.85)`，文字 `rgb(185,185,198)` |
| 浅色模式 | 渐变 rect `opacity=1`，网格/标签 `#545454`，图例背景 `rgba(255,255,255,0.85)` |

控制台仍只有接管层已知的两条原站异常（`null.append` 与 React #299），与本次改动无关。

## 构建

```text
dist/hhhoj-twilight.user.js  2,619.12 kB │ gzip: 562.18 kB
✓ built in ...
```

`pnpm typecheck` 无错误。

## 控制台预期异常

接管时原站的两处启动代码会各抛一次异常，这是路由压制成功的副作用，不是故障：

- `Cannot read properties of null (reading 'append')` —— 原站内联 shell 对 `#root` 追加预渲染内容；
- `Minified React error #299` —— 原站 `createRoot(null)`。

其余页面错误为 0。
