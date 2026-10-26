# 字段映射对照表

所有映射集中在 `src/services/api/real.ts`。页面只消费 `src/types.ts` 的领域类型，不直接接触 HHHOJ 的原始 JSON。

## 0. 通用规则

| HHHOJ | TwilightOJ 领域 | 说明 |
|---|---|---|
| 响应信封 `{success:true,...}` | 直接解包 | `success !== true` 抛 `ApiError(code,message,status)` |
| 时间文本 `YYYY-MM-DD HH:MM:SS` | epoch ms | 按 `Asia/Shanghai` 解析（无时区后缀时补 `+08:00`） |
| `used_memory`（KB） | `memoryMb`（MB） | `/1024`，保留 1 位小数 |
| 测试点 XML `memory`（KB） | `TestcaseResult.memoryMb` | `/1024` 取整 |
| `tot_size`（bytes） | `codeSizeKb` | `/1024`，保留 1 位小数 |
| `ac_num` / `submit_num` | `solved` / `submissions` | 列表页通过率 = `ac_num / submit_num` |
| 无难度字段 | `difficulty: 0..5` | 按通过率估算，见第 3 节 |

## 1. 首页 `/api/home`

```json
{
  "announcements": [{ "id", "poster", "title", "post_time", "zan", "level" }],
  "user_ranklist": [{ "rank", "username", "realname", "motto", "rating" }],
  "problem_ranklist": [{ "rank", "username", "realname", "motto", "ac_num" }]
}
```

| 原始 | 领域 |
|---|---|
| `announcements[].id/title` | `Announcement.id/title/titleEn` |
| `announcements[].post_time` | `Announcement.date`（取前 10 位） |
| `announcements[].level > 0` | `Announcement.pinned` |
| `user_ranklist` | `HomeData.userRanklist` |
| `problem_ranklist` | `HomeData.problemRanklist` |

近期比赛来自 `/api/contests` 的 `active` + `finished`，前端取 `phase !== finished` 的前三条。

## 2. 题库

### 列表 `/api/problems?page=&size=&search=&tag=`

```json
{ "items": [{ "id", "title", "ac_num", "submit_num", "zan", "tags", "my_best_ac_submission_id" }], "total" }
```

| 原始 | 领域 |
|---|---|
| `ac_num` / `submit_num` | `solved` / `submissions` |
| `my_best_ac_submission_id != null` | 已通过，列表显示 ✓ |
| `tags` | `tags` |
| 通过率 | 估算 `difficulty` |

接口要求登录。客户端分页：每页 100 条拉全量，再在浏览器内做 12 条/页的分页、搜索、标签与状态筛选。

### 详情 `/api/problems/:id[?contest_id=]`

```json
{
  "problem": { "id", "title", "zan", "my_zan", "tags" },
  "statement_html": "...",
  "statement_pdf": "",
  "limits": { "time": 1, "memory": 256 },
  "submission_requirement": [{ "name": "answer", "type": "source code", "file_name": "answer.code", "languages": ["C++17"] }],
  "can_submit": true,
  "prev_problem_id", "next_problem_id",
  "contest": { "id", "title" } | null
}
```

| 原始 | 领域 |
|---|---|
| `statement_html` | `statementHtml`（DOMPurify + MathML） |
| `limits.time`（秒） | `timeLimitMs = time * 1000` |
| `limits.memory`（MB） | `memoryLimitMb` |
| `submission_requirement` | `submissionRequirement` |
| `can_submit` | `canSubmit` |
| `prev_problem_id` / `next_problem_id` | 上一题 / 下一题 |
| `contest` | `contestId` / `contestTitle` |
| 详情接口没有通过率 | `countsKnown = false`，侧栏显示 — |

提交表单字段（对照原站 `SubmissionForm`）：

```text
answer_<itemName>_upload_type = editor
answer_<itemName>_editor      = <源码>
answer_<itemName>_language    = <语言>
POST /api/problems/:id/submissions[?contest_id=]
→ { submission_id }
```

## 3. 难度估算

HHHOJ 的题目没有难度字段。列表页的六档难度完全由通过率推导：

| 通过率 | 难度 | 文案 |
|---|---|---|
| ≥ 70% | 0 | 入门 |
| 50% – 70% | 1 | 简单 |
| 30% – 50% | 2 | 中等 |
| 15% – 30% | 3 | 较难 |
| 5% – 15% | 4 | 省选 |
| < 5% | 5 | NOI |
| 无提交 | 0 | 入门 |

详情页没有 `ac_num/submit_num`，因此 `difficultyKnown = false`，不显示难度徽章。该估算只用于视觉分档，不代表官方难度。

## 4. 提交记录

### 列表 `/api/submissions?problem_id=&submitter=&language=&status=&page=&size=`

```json
{ "items": [{ "id", "problem_id", "problem_title", "contest_id", "submitter", "status", "status_details", "result_error", "score", "language", "used_time", "used_memory", "tot_size", "submit_time", "judge_time" }], "total" }
```

| 原始 | 领域 |
|---|---|
| `status` | 先取 `, ` 前的 head；映射见下 |
| `score` | `score`（null → 0） |
| `used_time` | `timeMs` |
| `used_memory`（KB） | `memoryMb` |
| `tot_size` | `codeSizeKb` |
| `submit_time` | `submittedAt` |
| `problem_title` | `problemTitle` |
| `result_error` | 用于 CompileError / RuntimeError 判定 |

### verdict 映射

| HHHOJ | TwilightOJ |
|---|---|
| `status = Waiting` | `Pending` |
| `status = Judging` 或 `Judged, Waiting` / `Judged, Judging` | `Judging` |
| `Judged` + `result_error` 含 `compile` | `CompileError` |
| `Judged` + `result_error` 其他 | `RuntimeError` |
| `Judged` + `score >= 100` | `Accepted` |
| `Judged` + 其他 score | `WrongAnswer` |

提交详情 `/api/submissions/:id` 额外返回：

```json
{
  "submission": {...},
  "problem": { "id", "title" },
  "content": [{ "type": "source code", "name", "file_name", "language", "content" }] | null,
  "details": "<tests><test num info score time memory .../></tests>",
  "final_result_details": "...",
  "hack": ..., "hacks": [...]
}
```

- `content` 为 `null` 表示当前账号无权看代码（不是自己的提交 / 非管理员）。
- `details` 中的 `<test>` 被解析为 `TestcaseResult[]`；`info` 映射到 verdict，`memory` KB → MB。
- 若有测试点失败，整体 verdict 采用第一个失败测试点的 verdict。
- 轮询：`/api/submissions/status?ids=1,2,3` 每 1 秒一次，直到 `judged=true`，然后重新拉列表。

## 5. 比赛

### 列表 `/api/contests?active_page=&finished_page=&size=`

```json
{
  "active": { "items": [...], "total": 0 },
  "finished": { "items": [...], "total": 0 },
  "countdown": null,
  "viewer": { "admin": false, "can_create": false }
}
```

| 原始 | 领域 |
|---|---|
| `name` | `title` / `titleEn` |
| `cur_progress` | `phase`：`in_progress`→running，`not_started`→upcoming，`pending_publish`/`finished`→finished |
| `contest_type` | `rule`（ACM / OI / IOI，未知按 OI） |
| `start_time` / `end_time` | `startAt` / `endAt` |
| `player_num` | `participantCount` |
| `has_registered` | `registered` |
| `last_min` | `lastMin` |

### 详情 `/api/contests/:id/dashboard`

| 原始 | 领域 |
|---|---|
| `contest`（含 `rated.enabled`、`registered`） | `Contest` |
| `description_html` | `descriptionHtml` |
| `problems[]` | `ContestDetailData.problems`（id/title/pos/my_ac_submission_id） |
| `notices[]` | 公告 tab |
| `can_ask` | `canAsk`（仅保留） |

### 榜单 `/api/contests/:id/standings`

```json
{
  "problems": [{ "pos", "problem_id", "title" }],
  "rows": [{ "rank", "username", "realname", "total_score", "total_time", "total_memory", "cells": [{ "pos", "score", "time", "waiting" }] }]
}
```

| 原始 | 领域 |
|---|---|
| `total_score` | `score` / `totalScore` |
| `total_time`（秒） | `penaltyMinutes = round(total_time/60)` |
| `cells[].score > 0` | ACM：solved、`solvedAtMin = round(time/60)`；OI：显示分数 |
| `cells[]` 按 `pos` 对齐到题目列（缺失补 0） | `StandingsRow.cells` |

榜单接口可能因未报名 / 未公布而报错；页面显示错误信息并提供“原站榜单”链接。

## 6. 博客 / 讨论区

### 列表 `/api/blogs?page=&size=`

```json
{ "items": [{ "id", "poster", "title", "post_time", "zan" }], "total": 0 }
```

| 原始 | 领域 |
|---|---|
| `poster` | `author` |
| `title` | `title` / `titleEn` |
| `post_time` | `createdAt` |
| `zan` | `likes` |
| 无标签 | `node='share'`，前端隐藏节点筛选 |

### 详情 `/api/blogs/:id?with_comments=1&comment_page=1&comment_size=20`

```json
{
  "blog": { "id", "poster", "title", "content_html", "post_time", "zan", "tags" },
  "my_zan": 0,
  "comments": { "items": [{ "id", "poster": { "username", ... }, "content", "post_time", "zan", "my_zan", "replies": [...] }], "total": 0 }
}
```

| 原始 | 领域 |
|---|---|
| `content_html` | `contentHtml`（DOMPurify + MathML） |
| `tags` | `tags` |
| `poster.username` | 评论作者 |
| `zan` / `my_zan` | 点赞数 / 我的点赞态 |
| `comments.total` | `commentCount` |

评论写入：

```text
POST /api/blogs/:id/comments                     { content }
POST /api/blogs/:id/comments/:commentId/replies  { content }
POST /api/zan                                    { type: "B"|"BC", id, delta: 1|-1 }
```

## 7. 用户资料 `/api/users/:username`

```json
{
  "user": { "username", "email", "qq", "sex", "motto", "realname", "rating", "avatar_hash" },
  "groups": [{ "name", "note" }],
  "ac_problems": [1, 2],
  "rating_history": [{ "contest_id", "name", "start_time", "rank", "rating", "delta" }],
  "register_time": "..."   // 仅超级管理员可见
}
```

| 原始 | 领域 |
|---|---|
| `user.motto` | `bio` / `bioEn` |
| `user.realname` | `school` / `realName` |
| `ac_problems` | `acCount`，批量 `/api/problems/batch` 取标题 |
| `rating_history[].rating` | `ratingHistory`（曲线） |
| `groups[].name` | 资料卡徽章 |
| `register_time` | `joinedAt`（无权限时显示 —） |

补充请求：

- `/api/submissions?submitter=<name>&size=100` → 提交 tab 与提交总数
- `/api/users/<name>/blogs?page=1&size=100` → 讨论帖子 tab
- `/api/problems/batch?ids=...` → 已解决题目标题（接口要求登录）

## 8. 认证

| 操作 | 端点 | 说明 |
|---|---|---|
| 会话 | `GET /api/auth/me` | `user` 为 null 表示未登录；`usergroup` 0/1/2/3/4 → pending/user/admin/teacher/developer |
| 登录 | `POST /api/auth/login` | `{ username, password: md5(password, CLIENT_SALT) }` |
| 注册 | `POST /api/auth/register` | `{ username, password: md5(...), email, realname, motto }` |
| 登出 | `POST /api/auth/logout` | 清除 `hhhoj_session` |

`CLIENT_SALT = IsVmReCClDLEBJGHemt9ZsIqxPambZFR`，与 HHHOJ `frontend/src/config.ts` 保持一致。

注册后的真实行为：第一个用户成为管理员，其余用户进入 `pending`，需管理员审核后才能登录。前端在注册成功后跳转登录页并提示等待审核；不会伪造会话。

## 9. 回退路径

以下原站能力不接管，导航到这些路径时脚本在路由门退出，由 HHHOJ 原站完整提供：

- 博客写作 / 删除 / 归档 / 幻灯片：`/blog/:username/...`
- 提交详情与 hack：`/submission/:id`
- 比赛内提交、报名、管理、AFC 榜：`/contest/:id/submissions`、`/contest/:id/register`、`/contest/:id/manage` 等
- 题目数据管理 / 题解 / 附件：`/problem/:id/manage/*`、`/problem/:id/solution`
- 私信、系统消息、用户设置：`/user/msg`、`/user/system-msg`、`/user/modify-profile`
- ranklist、公告、FAQ、反馈、捐赠、后台：`/ranklist`、`/announcements`、`/faq`、`/feedback`、`/donate/*`、`/super-manage/*`
