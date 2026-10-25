# Twilight 风格移植 HHHOJ —— 修改建议（v2，源码精读版）

> 参考：`docs/ARCHITECTURE.md`（插件六层架构）。
> 本版依据对 `Spr-Aachen/Twilight` 仓库的逐文件精读（本地克隆 `/home/qzez/Twilight`）重写，
> 所有参数均标注源码出处（文件:行号）；并落实调整：**粒子、入场动效默认开启**。
> HHHOJ 基线：commit `7a22450b`，前端 React 19 + Bootstrap 4 + `uoj-theme.css`（565 行，
> 无任何 CSS 变量体系——变量层是纯增量叠加）。

## 〇、总体判断

**原则一：氛围与功能分离，但默认值分层。** 色彩/材质/圆角默认开启；**粒子与入场动效按
本次调整改为默认开启**；壁纸模式默认关闭。默认开启的部分必须自带完整兜底链（见 §四），
保证"开着不出事"。

**原则二：只做变量层与 body 直挂图层，不改 React DOM。** 一切收敛为
`documentElement` CSS 变量 + 选择器覆盖 + body 直挂节点（canvas/壁纸层/设置面板）。

## 一、Twilight 源码精读结论（参数与出处）

### 1.1 粒子引擎（`src/utils/particle.ts` + `twilight.config.yaml:375-416`）

| 参数 | 默认值 | 出处 |
|---|---|---|
| 数量 `particleNum` | 12 | yaml:379 |
| 越界重生次数 `limitTimes` | -1（无限） | yaml:381 |
| 尺寸倍数 `size` | 0.3–0.9（实际直径 40×s px，particle.ts:59） | yaml:385/387 |
| 不透明度 `opacity` | 0.3–0.9 | yaml:391/393 |
| 水平速度 | -0.9 ~ +0.9 px/帧（particle.ts:164-167） | yaml:399/401 |
| 垂直速度 | 0.15–0.3 px/帧向上（particle.ts:170-172） | yaml:405/407 |
| 旋转速度 | 0.12（实际每帧 +0.12×0.1，particle.ts:177） | yaml:409 |
| 消失速度 `fadeSpeed` | 0.12（实际每帧 α-0.12×0.01，particle.ts:182） | yaml:415 |
| 初始角 | `Math.random()*6` rad（particle.ts:158） | — |
| 层级 `zIndex` | **100（悬浮于内容之上）**，`pointer-events:none`，fixed 全屏，id `canvas_particle`（particle.ts:233-238） | yaml:416 |

- 边界：`x>innerWidth ‖ x<0 ‖ y>innerHeight+100 ‖ y<-100 ‖ a<=0` 触发重生，`BOUNDARY_OFFSET=100`（particle.ts:5,69-75）。
- 重生分布：`Math.random()>0.4`（60%）从**底部**（x 随机，y=innerHeight+rand×100），
  否则（40%）从**右侧**（x=innerWidth，y 随机），重生时 s/r/a 全部重新随机（particle.ts:90-105）。
- 初始生成：全部 12 枚都从屏幕底部下方升入（particle.ts:151）。
- 帧循环：整幅 `clearRect` → update → draw → rAF（particle.ts:286-294）；**无 visibility
  暂停、无 devicePixelRatio 处理**（canvas 尺寸=CSS 像素，particle.ts:296-301）。

**Twilight 自身缺陷，移植时修正：**
1. `stop()` 里 `window.removeEventListener("resize", this.handleResize.bind(this))` 与
   添加时的 `bind` 不是同一引用，监听器永远移不掉（particle.ts:242 vs 313）→ 保存引用；
2. 无 `visibilitychange` 暂停 → 后台标签页仍在跑 rAF；
3. `update()` 中 `this.fn.y(this.y, this.y)` 第二参误传（无害但应修正，particle.ts:65）；
4. 高分屏不糊但省电的 CSS 像素绘制**照抄**（这是合理取舍，不补 dpr 放大）。

### 1.2 入场动效（`src/styles/transition.css` + `src/constants/transitions.ts`）

- 时长标尺（transitions.ts:2-10）：TINY 100 / FASTEST 120 / **FAST 150** / NORMAL 200 /
  **MEDIUM 300** / SLOW 500 / **SLOWER 600** / LONG 1000 / VERY_SLOW 1200 ms。
- 缓动（transitions.ts:13-15）：默认 `cubic-bezier(0.4,0,0.2,1)`；页面进入
  `cubic-bezier(0.25,0.46,0.45,0.94)`；页面离开 `cubic-bezier(0.55,0.055,0.675,0.19)`。
- 入场 keyframes（transition.css:64-83）：`fade-in-up` 从 `opacity:0; translate:0 1.5rem`
  到 `opacity:1; translate:0 0`；`fade-in-down` 反向。
- 首屏入场（transition.css:105-116）：时长 SLOWER=600ms ease-out forwards；
  **五级 stagger**：nth-child(1..5) 依次 0 / 150 / 300 / 450(300+150) / 600 ms，仅对前 5
  个子元素定义，第 6 个起无延迟立即播放。
- 页面切换（transition.css:29-39）：进入从 `(0.5rem, 1.5rem)` 滑入、离开向 `(-0.5rem,-1rem)`
  滑出，MEDIUM=300ms。
- 性能细节（transition.css:153-197）：动画元素 `backface-visibility:hidden`；
  `prefers-reduced-motion: reduce` 下所有动画/过渡压到 0.01ms。

### 1.3 配色变量（`src/styles/variables.styl`，全文照抄级掌握）

- `:root` 基础 `--radius-large: 1rem`（variables.styl:11-12）；`define()` mixin 同时产出
  `:root`（浅）与 `:root.dark`（深）两套（variables.styl:15-22）。
- 核心对（variables.styl:24-29）：`--primary` `oklch(0.70/0.75 0.14 hue)`；
  `--page-bg` `oklch(0.95 0.01 hue)` / `oklch(0.16 0.014 hue)`；`--card-bg` white /
  `oklch(0.23 0.015 hue)`；`--card-bg-transparent` `rgba(255,255,255,.8)` / `rgba(23,23,23,.8)`。
- 按钮三态亮度递进（variables.styl:32-34）：浅 0.95→0.90→0.85，深 0.33→0.38→0.43。
- 文字/分隔线用黑白透明度阶梯（variables.styl:50-54）：divider .08、line .1、meta .6。
- 代码块族（variables.styl:58-61）：codeblock-bg `oklch(0.96/.18 0.015 hue)`、选区
  `oklch(0.90/.40 0.05..0.08 hue)`。
- 链接族（variables.styl:65-67）、浮层 `--float-panel-bg` white / `oklch(0.19 0.015 hue)`
  （variables.styl:69）。
- 语义提示五色**不参与色相派生**，固定色相（variables.styl:88-92）：tip 180 / note 250 /
  important 310 / warning 60 / caution 25 —— 对应我们的结论：AC/WA/RE 语义色同理不派生。
- 13 段彩虹条（variables.styl:8-9）：浅 `oklch(0.80 0.10 k)`、深 `oklch(0.70 0.10 k)`。

### 1.4 主题与色相机制（`src/utils/theme.ts`、`hue.ts`、`main.css:49-63`）

- `is-theme-transitioning` 仅在明暗**真的变化**时添加（theme.ts:44-46）；双 rAF：下一帧
  应用 `dark` 类，再下一帧移除保护类（theme.ts:53-72）。
- 保护类 CSS（main.css:49-63）：`& * { transition: none !important }` 连同 `::before/::after`，
  并专门关掉 navbar 的 backdrop-filter（main.css:159-171）防主题切换时 blur 重算卡顿。
- 色相：`localStorage.hue` + `documentElement.style.setProperty("--hue", String(hue))`
  （hue.ts:5-14）。默认 `hue: 255`（yaml:45）。**默认主题是 dark**（yaml:47）。

### 1.5 导航栏毛玻璃（`src/styles/navbar.css` + `components/navbar.astro:77-94`）

- 三种透明模式；默认 `semifull`（yaml:105）：页面顶部完全透明，**滚动超过 50px**（rAF
  节流的 scroll 监听，navbar.astro:77-94）切换 `.scrolled`。
- `.scrolled` 玻璃态（navbar.css:114-127）：`backdrop-filter: blur(20px)` +
  底 `rgba(255,255,255,.55)`（暗 `rgba(0,0,0,.55)`）+ 1px 同色描边 + 圆角 0.75rem +
  阴影 `0 4px 16px rgba(0,0,0,.1/.2)`，过渡 MEDIUM=300ms EASE_DEFAULT。
- 下拉/浮层同款玻璃（navbar.css:130-149）。
- 无 banner 时导航栏只是 `--card-bg` + `--radius-large`（navbar.css:60-64）。

### 1.6 壁纸与 banner（`src/styles/banner.css`、`twilight.config.yaml:48-122`）

- 壁纸模式：`banner`（默认）/`fullscreen`/`none`；fullscreen 参数：zIndex -1、opacity 0.9、
  blur 1px（yaml:113-119），卡片切 `--card-bg-transparent`（main.css `wallpaper-transparent`
  工具类，253-266 行）。
- 轮播：间隔 3.6s、交叉淡化 VERY_SLOW=1200ms ease-in-out（banner.css:111-113）。
- **Ken Burns**（banner.css:75-84,119-121）：`scale 1.0 → 1.2`，**12s linear forwards**，
  origin center。
- **水波纹**（banner.css:382-427）：`translate -90px → 85px` 循环，4 层 SVG 视差，层序
  7s/10s/13s/20s、延迟 -2/-3/-4/-5s，缓动 `cubic-bezier(0.5,0.5,0.45,0.5)`，
  `will-change: transform` + `backface-visibility: hidden`。
- 发光大标题（banner.css:31-35）：`text-shadow: 0 3px 12px rgba(0,0,0,.36),
  0 0 24px color-mix(in srgb, var(--primary), transparent 48%)`。
- 追番卡片 hover 的渐变描边（anime.css:345-360）：`mask-composite: xor` 实现，可作微交互
  参照；入场 stagger 卡片版（anime.css:265-276）：600ms + 0.1s/级。

### 1.7 其余默认值（yaml 备查）

字体 Zen Maru Gothic（yaml:35-41）、明暗 `defaultTheme: "dark"`（yaml:47）、加载页 maxWait
3s（yaml:124-146，不移植）。

## 二、逐项移植方案（含默认值调整）

### P0 主题层 `theme-oklch/` —— 默认开启，纯 CSS

- 注入 `:root { --hue: 255 }` 与 §1.3 全部变量的浅/深两套（成对，`html.hhhoj-dark` 切换）。
- Bootstrap 4 → 变量映射覆盖表（本模块主要工作量）：`body/.card/.table*/.navbar*/.btn
  (三态亮度递进照抄 §1.3)/.form-control/.badge/.alert/.list-group/.pagination/
  .dropdown-menu/链接/.uoj-score/.uoj-nav-busy/.uoj-footer`。
- 明暗：默认跟随系统（`matchMedia('(prefers-color-scheme: dark)')` + change 监听，照抄
  theme.ts:96-99），可强制。注意 Twilight 默认 dark，我们默认 system——OJ 白天使用场景多。
- highlight.js 双主题同步（data-theme 思路）、CodeMirror 6 变量化覆盖、KaTeX 继承无需处理。
- **语义色不派生**（AC 绿/WA 红/RE 蓝、alert 五色、分数色 util.ts scoreColor）。
- 切换防闪屏：照抄 §1.4 双 rAF + `*{transition:none!important}` 保护类。

### P1 材质层 `material-glass/` —— 默认开启，纯 CSS

- `--radius-large: 1rem` 统一 `.card/.form-control/.dropdown-menu/pre/.modal-content`。
- HHHOJ 导航栏（`.navbar.bg-light`，静态）改为 sticky + semifull：顶=`transparent`，
  滚动 50px（rAF 节流）加 `.hhhoj-scrolled` → blur(20px) + 55% 半透明底 + 1px 描边 +
  0.75rem 圆角 + 浮起阴影，全部取 §1.5 数值；body 需补偿 sticky 占位。
- backdrop-filter 红线：仅导航栏、下拉浮层、设置面板三处固定区域；长表格
  （LongTable：SubmissionsList/Standings）严禁逐格 blur。
- 阴影体系：轻阴影 `0 4px 16px rgba(0,0,0,.1)`（深色 .2 或关闭），层次靠明度差。

### P2 氛围层 —— **粒子、入场动效默认开启**；壁纸默认关闭

**`ambient-particles/`（默认开启，命令式）**：移植 §1.1 全部参数原值
（12 枚 / 40×s px / α .3–.9 / 水平 ±0.9 / 垂直 .15–.3 / 旋转 0.12 / fade 0.12 /
60-40 底右重生 / BOUNDARY 100 / zIndex 100 悬浮内容上 / pointer-events none），
并内置修正版兜底链（§四）。粒子贴图（暖金光点，RGB≈255,156,0）打包进插件资源
（GM_getResourceURL 或 base64 内联，约 1-2KB）。

**`motion-entrance/`（默认开启，纯 CSS）**：
- 对 `.uoj-content` 首层子元素施放 `fade-in-up 600ms ease-out forwards`（§1.2 参数），
  stagger 五级 0/150/300/450/600ms；**第 6 个起不再定义延迟**（Twilight 原行为：立即播放），
  另加 `:nth-child(n+9)` 不参与动画（长列表只动前 8 个，避免百行表格整列入场）。
- **实现差异（比 Twilight 更稳）**：不用"初始 opacity:0 + 类开关"模式（Twilight 那样做是
  为协调它的加载页），我们直接 `animation-fill-mode: backwards` —— 延迟等待期显示 from 帧，
  CSS 被禁用/不支持时元素照常可见，无"内容消失"风险。
- 作用域限制在路由容器首层（`.uoj-content > *`），React 仅换页 remount 时触发一次，
  re-render 不重播；`prefers-reduced-motion` 下整体关闭（非 Twilight 的 0.01ms——
  我们没有加载页协调问题，直接不播更干净）。

**`ambient-wallpaper/`（默认关闭，命令式 + CSS）**：body 直挂固定图层（zIndex -1），
轮播 3.6s + 交叉淡化 1200ms + Ken Burns 12s scale1.0→1.2；开启时卡片切 80% 半透明底
（`--card-bg-transparent`，main.css:253-266 思路）；水波纹 4 层（§1.6 参数）作可选点缀；
navbar 透明模式随之切换。

### P3 版式细节 `typography-flavor/` —— 纯 CSS，可默认开

卡片标题前主题色竖条（`.card-header::before`）、富文本区（`article a`）虚线下划线、
提交/题目列表元信息圆角小方块、hover 渐变描边（mask-composite xor，anime.css:345-360）；
Zen Maru Gothic 为可选项默认不换；发光标题仅壁纸 hero 可用。

### P4 设置面板扩展（L5）

色相滑块（0–360 → `setProperty('--hue')`，照抄 hue.ts）、明暗三态、壁纸三模式、
粒子开关+数量+性能模式+比赛降级开关、入场动效开关、导入导出。

## 三、分期（默认值调整后）

| 期 | 模块 | 形态 | 默认 | 关键依赖 |
|---|---|---|---|---|
| P0 | theme-oklch | 纯 CSS | 开 | 无 |
| P1 | material-glass | 纯 CSS | 开 | P0 |
| P2a | ambient-particles | 命令式 | **开** | bridge（比赛降级） |
| P2b | motion-entrance | 纯 CSS | **开** | P0 |
| P2c | ambient-wallpaper | 命令式 | 关 | P0/P1 |
| P3 | typography-flavor | 纯 CSS | 开 | P0 |
| P4 | 设置面板风格区 | 命令式 | — | P0–P3 |

验收：`routes.ts` 50 路由冒烟（重点 contest/standings/submission/CodeMirror）× 深浅主题 ×
粒子/动效开关组合；性能项：长列表页逐帧无掉帧、后台标签页 rAF 停止、
reduced-motion 全链关闭、比赛进行中氛围层自动停。

## 四、默认开启的兜底链（粒子/入场动效专属，自上而下任一命中即降级）

1. `prefers-reduced-motion: reduce` → 粒子不启动、入场动画不施放；
2. 比赛进行中（bridge 观测 `/api/contests/:id/dashboard` 的 `cur_progress === 'in_progress'`）
   → 氛围层整体暂停，比赛结束恢复；
3. 低端设备（`navigator.deviceMemory ≤ 4` 或 `hardwareConcurrency ≤ 4`）→ 粒子性能模式
   （6 枚、关旋转）；
4. `visibilitychange` hidden → 粒子 rAF 暂停（补 Twilight 缺失项）；
5. 设置面板总开关 + 每项独立开关（GM 持久化、跨标签页同步）。

## 五、明确不做

三栏骨架/横幅 DOM 改造；看板娘/音乐播放器/追番页；加载遮罩（与上游零白屏 shell 冲突）；
Swup（SPA 已有，入场动效覆盖手感）；语义色参与色相派生。

---
*Twilight 引用均出自本地克隆 `/home/qzez/Twilight`（commit 于 2026-10 拉取）：*
`particle.ts`、`twilight.config.yaml`、`variables.styl`、`transition.css`、`anime.css`、
`banner.css`、`navbar.css`、`main.css`、`theme.ts`、`hue.ts`、`constants/transitions.ts`、
`layouts/base.astro`、`components/navbar.astro`。
