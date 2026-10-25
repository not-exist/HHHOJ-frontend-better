# HHHOJ Frontend Better

Twilight（[Spr-Aachen/Twilight](https://github.com/Spr-Aachen/Twilight)）风格的
[HHHOJ](https://github.com/Quzhou-No-2-School/HHHOJ) 前端增强篡改猴（Tampermonkey）用户脚本。

## 功能（默认状态）

| 功能 | 说明 | 默认 |
|---|---|---|
| OKLCH 主题 | 全站颜色由单一色相（默认 255 蓝紫）在 OKLCH 空间派生；浅色/深色/跟随系统 | 开 |
| 现代皮肤 | 整体替换 Bootstrap 观感：无边框卡片+细描边环、无边框现代表格、填充式输入、药丸徽章/导航、分段与下划线标签页、悬浮微抬升、顶部主色氛围光、系统字体栈 | 开 |
| 隐藏站点 Logo | 页首小图标与首页大图标隐藏，首页公告表占满整行 | 开 |
| 毛玻璃材质 | 导航栏 semifull 动态透明（滚动 50px 后 blur(20px) 玻璃化） | 开 |
| 页面入场动画 | 换页时内容五级渐进浮现（fade-in-up 600ms） | 开 |
| 金萤粒子 | 暖金光点从屏幕底部升起（Twilight 粒子引擎移植 + 修正） | 开 |
| 版式细节 | 内容 h3 主题色竖条、链接虚线下划线、卡片悬停渐变描边 | 开 |
| 全屏壁纸 | 暮色壁纸轮播（Ken Burns + 交叉淡化），卡片半透明化 | 关 |

面板另可定制：**字号**（13–16px 全站，默认 15）、**圆角**（无/小/标准 1rem）。

兜底链（任一命中即自动降级）：`prefers-reduced-motion` → 不启动氛围层；
检测到进行中的比赛（`/api/contests/:id/dashboard` 的 `cur_progress`）→ 粒子与壁纸暂停；
低端设备 → 粒子减半关旋转；标签页隐藏 → rAF 暂停（另含 rAF 挂起看门狗）。
全部可在右下角 ✦ 设置面板中调整。

## 构建与安装

```bash
pnpm install
pnpm build          # 产物 dist/hhhoj-frontend-better.user.js
pnpm typecheck      # tsc --noEmit
pnpm serve          # 开发用：在 127.0.0.1:5177 托管 dist（配合脚本注入调试）
```

篡改猴 → 实用工具 → 导入用户脚本（或新建脚本粘贴产物内容）。默认 `@match`
只含本地开发站 `127.0.0.1:18080` / `localhost:18080`，生产域名在
`scripts/build.mjs` 的 `MATCHES` 里追加后重新构建。

## 架构

分层与红线见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，风格移植的源码级依据与
分期见 [docs/STYLE_PLAN.md](docs/STYLE_PLAN.md)。要点：

- `src/services/` GM API 垫片（无篡改猴时自动退化为 localStorage）、设置存储、样式注入；
- `src/core/` SPA 导航感知（patch history API）、fetch 只读拦截（比赛降级信号）；
- `src/features/` 每功能一模块（`css` + 可选 `setup`/teardown），注册表负责启停与故障隔离；
- `src/ui/` 设置面板：body 直挂 Shadow DOM，绝不进入 React 管辖的 `#root`；
- 插件自身 UI 的状态类只挂在 `<html>` 上，React 永远不会清除它们。

## 已在真实页面上验证

首页/登录页深浅两套主题、色相实时切换、设置面板（分段按钮/开关/滑杆）、
导航栏滚动玻璃态（与 Twilight 规格逐项一致）、粒子、壁纸模式（渐变兜底）。
