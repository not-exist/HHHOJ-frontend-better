# GitHub Actions 构建测试 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 push 到 `main` 和所有 PR 时自动安装依赖并构建用户脚本，`main` 构建成功后上传 `dist/hhhoj-twilight.user.js` 作为 artifact。

**Architecture:** 单个 `.github/workflows/ci.yml`，一个 `build` job：checkout → pnpm 11.22.0 → Node 22（启用 pnpm 缓存）→ `pnpm install --frozen-lockfile` → `pnpm build`（含 `tsc -b` 类型检查）→ 仅在 push main 时上传产物。不引入单元测试框架。

**Tech Stack:** GitHub Actions、pnpm 11.22.0（锁文件 v9.0，已在本地验证 frozen 安装通过）、Node 22、Vite 5 + `vite-plugin-monkey`

**已确认的现状（证据）：**
- 无 `.github/` 目录（`ls` 确认）。
- `package.json:12-17` 只有 `dev` / `build` / `preview` / `typecheck`；`build = tsc -b && vite build`。
- 本机 `node v22.22.1`、`pnpm 11.22.0`；`pnpm install --frozen-lockfile` 与 `pnpm build` 均通过，产物 `dist/hhhoj-twilight.user.js` 2.6 MB。
- 远端为占位地址 `git@github.com:not-exist/HHHOJ-frontend-better.git`，只有换成真实仓库后 CI 才会真正在 GitHub 上执行。

---

### Task 1: 新增 CI 工作流

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: 写入工作流文件**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 11.22.0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - name: Upload userscript (main only)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: hhhoj-twilight-userscript
          path: dist/hhhoj-twilight.user.js
          if-no-files-found: error
```

要点：
- `pnpm/action-setup` 必须在 `actions/setup-node` 之前，否则 `cache: pnpm` 找不到 pnpm。
- `version: 11.22.0` 锁定与本机一致的 pnpm 主版本，`pnpm-workspace.yaml` 的 `allowBuilds` 才能生效；`package.json` 里的 `pnpm.onlyBuiltDependencies` 在 pnpm 11 已被忽略，无需改动。
- artifact 步骤只在 push 到 main 时执行；PR 只做构建验证。

**Step 2: 校验 YAML 语法**

Run: `python3 -c "import yaml,pathlib; yaml.safe_load(pathlib.Path('.github/workflows/ci.yml').read_text()); print('ok')"`

Expected: `ok`（若 PyYAML 缺失，改用任意 YAML 解析器，不要跳过校验）

**Step 3: 本地复现 CI 命令**

Run: `pnpm install --frozen-lockfile && pnpm build`

Expected: 安装秒级完成；构建输出 `dist/hhhoj-twilight.user.js`，无 TypeScript 错误

**Step 4: 确认工作区只多出目标文件**

Run: `git status --short`

Expected: 仅 `?? .github/`（`docs/plans/` 下的本计划文件如已跟踪则一并出现）

**Step 5: 提交**

```bash
git add .github/workflows/ci.yml docs/plans/2026-10-26-github-actions-ci.md
git commit -m "ci: build userscript on push to main and pull requests"
```

不要自动 push；远端仍是占位地址，推送与首次 CI 运行需用户提供真实仓库后执行。

---

## 验证边界

- 本地可验证：YAML 解析、`pnpm install --frozen-lockfile`、`pnpm build`、产物存在。
- 需 GitHub 侧验证：workflow 是否被识别、artifact 是否能下载。首次 push 后在 Actions 页确认 `CI` 运行成功，并确认 `hhhoj-twilight-userscript` artifact 出现在 main 的运行记录中。
- 工作流不做部署、不发 Release、不跑单测（项目暂无测试框架）。
