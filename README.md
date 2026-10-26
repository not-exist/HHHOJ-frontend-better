# TwilightOJ

一个参考 [Spr-Aachen/Twilight](https://github.com/Spr-Aachen/Twilight) 设计语言的**在线评测系统（OJ）前端**。当前为纯前端实现：所有数据来自内置 mock，通过统一的服务层隔离，后续可直接替换为真实 API。

![tech](https://img.shields.io/badge/React_18-Vite_5-61dafb) ![lang](https://img.shields.io/badge/TypeScript-strict-3178c6) ![style](https://img.shields.io/badge/Design-Twilight-8b5cf6)

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 生产构建（先 tsc 类型检查）
pnpm preview
```

> 演示环境：任意用户名 / 密码均可登录。

## 功能（核心十件套）

| 路由 | 页面 | 亮点 |
|---|---|---|
| `/` | 首页 | Ken Burns 壁纸轮播 + 打字机标语 + 波浪、公告 / **排行榜** / 近期比赛 |
| `/problems` | 题库 | 关键词 / 难度 / 标签 / 我的状态筛选，通过率与状态标记 |
| `/problems/:id` | 题目详情 | 双语题面选项卡、样例复制、时空限制侧栏、内嵌代码提交 |
| `/status` | 评测状态 | **实时提交流**（模拟评测机：Pending → Judging → 终态）、七种结果徽章、代码 + 测试点详情弹窗 |
| `/contests` | 比赛列表 | 进行中 / 未开始 / 已结束，实时倒计时 |
| `/contests/:id` | 比赛详情 | 报名、公告、题目、**ACM/OI 榜**（罚时、尝试次数、奖牌配色） |
| `/discuss` | 讨论区 | 节点分类（题解 / 求助 / 分享 / 公告 / 灌水）、帖子与嵌套评论、点赞 |
| `/user/:name` | 个人主页 | Rating 曲线（recharts）、统计瓦片、已解决题目 / 提交 / 帖子 |
| `/login` `/register` | 登录注册 | 玻璃卡片，mock 鉴权持久化 |
| 设置抽屉 | 全局 | **明暗切换 + 色相滑块实时换色 + 粒子开关 + 中英双语** |

## Twilight 设计语言移植

- **单色相主题系统**：全部强调色由 `--hue`（默认 `205` · 晴空蓝）派生，设置抽屉拖动滑块全站实时换色；
- **明暗双模式**：默认浅色（清新），深色为暗夜 hue 底色；
- **玻璃拟态**：半透明 + `backdrop-blur` + 1px 描边 + 大圆角卡片，悬浮胶囊导航栏；
- **氛围特效**：canvas 漂浮粒子（随色相变化）、进站 Loading 遮罩（每会话一次）、页面进场 / 卡片 hover 动效；
- **横幅**：三层径向渐变壁纸（Ken Burns 缓推）+ 打字机副标题 + 无缝循环波浪。

## 目录结构

```
src/
  styles/        tokens.css（设计令牌）/ base / components / pages / animations
  context/       ThemeContext（hue/mode/particles）、AuthContext
  i18n/          react-i18next，zh.json + en.json
  mock/          problems / contests / submissions / users / discuss / news
  services/      api.ts（假 API）、store.ts（提交存储 + 实时评测引擎）、persist.ts
  components/    NavBar、Particles、Waves、CodeEditor、VerdictBadge、…
  layouts/       MainLayout
  pages/         与路由一一对应
```

## 接真实后端

所有页面仅依赖 `src/services/api.ts` 与 `submissionStore`。将 mock 实现替换为真实请求（保持返回类型为 `src/types.ts` 中的接口）即可，无需改动页面组件。
