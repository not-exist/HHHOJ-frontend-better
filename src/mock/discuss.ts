import type { Thread, Comment } from '@/types'

export const NODES = ['all', 'solution', 'help', 'share', 'notice', 'lounge'] as const
export type NodeKey = (typeof NODES)[number]

function c(id: number, author: string, content: string, createdAt: string, likes: number, replies: Comment[] = []): Comment {
  return { id, author, content, createdAt, likes, replies }
}

export const THREADS: Thread[] = [
  {
    id: 1,
    title: 'TwilightOJ 使用指南：从注册到 AC',
    titleEn: 'TwilightOJ Guide: From Sign-up to AC',
    node: 'notice', author: 'Nebula',
    content: '欢迎来到 TwilightOJ！\n\n1. 在题库中挑选适合你难度的题目，从「入门」档开始是个不错的选择；\n2. 打开题目页阅读题面，右下角即可提交代码；\n3. 在「评测状态」页查看实时评测结果，点击任意一行可以查看代码与测试点详情；\n4. 卡关时先看讨论区题解节点，也可以发帖求助。\n\n祝各位 RP++，早日紫名！',
    createdAt: '2026-10-20 10:00', views: 3120, likes: 128, pinned: true,
    comments: [
      c(1, 'Stelle', '教程很清晰，找到了第一道入门题！', '2026-10-20 10:21', 12,
        [c(101, 'March7th', ' Welcome aboard～', '2026-10-20 10:25', 5)]),
      c(2, 'Kiana', '已收藏，考完试就来刷题。', '2026-10-20 11:02', 7),
    ],
  },
  {
    id: 2,
    title: '【题解】线段树 1（区间加 + 区间和）懒标记详解',
    titleEn: '[Editorial] Segment Tree 1: Lazy Propagation Explained',
    node: 'solution', author: 'Astesia',
    content: '这篇题解面向刚接触线段树的同学，用图解方式讲清楚三件事：\n\n一、为什么需要懒标记 —— 区间加如果逐点下传，复杂度会退化到 O(n log n) 每次修改；\n二、pushdown 与 pushup 的时机 —— 修改时先递归到底再回传，查询时遇到完整覆盖直接返回；\n三、常见错误：取模位置、long long、建树边界。\n\n代码附在评论区，复杂度 O((n + m) log n)。',
    createdAt: '2026-10-22 21:14', views: 1892, likes: 96,
    comments: [
      c(3, 'Lumine', '图解太直观了，一次过！', '2026-10-22 21:40', 18),
      c(4, 'FrostNova', '补充一个坑：多测一定要清空懒标记数组。', '2026-10-22 22:05', 22,
        [c(102, 'Astesia', '好提醒，已补充进正文。', '2026-10-22 22:10', 9)]),
    ],
  },
  {
    id: 3,
    title: '求助：1019 虚树在 q 组询问下 TLE，如何优化建树过程？',
    titleEn: 'Help: TLE on 1019 Virtual Tree when building per query',
    node: 'help', author: 'Mumei',
    content: '如题，每次询问都重新对关键点排序 + 枚举 LCA，在 q = 1e5 时稳定 TLE。\n\n我的做法是每次询问排序 O(k log k)，再两两求 LCA（倍增），理论复杂度应该可以过，实际卡常。\n\n求各位大佬指点：是 LCA 该换欧拉序 + ST 表，还是建虚树的姿势不对？',
    createdAt: '2026-10-23 15:47', views: 764, likes: 23,
    comments: [
      c(5, 'Nebula', '倍增 LCA 常数大，换欧拉序 ST 表基本稳定过。另外排序可以改成按 dfsn 的桶排。', '2026-10-23 16:02', 31),
      c(6, 'Kaguya', '把求 LCA 内联进单调栈过程，只对相邻关键点求即可。', '2026-10-23 16:20', 15),
    ],
  },
  {
    id: 4,
    title: '分享：我整理的算法竞赛模板库（持续更新）',
    titleEn: 'Share: My Competitive Programming Template Library',
    node: 'share', author: 'Kaguya',
    content: '整理了两年来常用的模板：\n\n- 数论：exgcd、线性筛、卢卡斯\n- 数据结构：树状数组、可撤销并查集、李超线段树\n- 图论：tarjan 三件套、网络流 ISAP\n- 字符串：SA、SAM、Z 函数\n\n全部带使用示例和复杂度注释，见附件仓库链接。欢迎 PR 补充！',
    createdAt: '2026-10-21 12:30', views: 2430, likes: 187,
    comments: [
      c(7, 'Elysia', '收藏了！李超线段树那部分写得很好。', '2026-10-21 13:00', 11),
      c(8, 'DanHeng', '已 star，求更新网络流对偶版。', '2026-10-21 14:15', 4),
    ],
  },
  {
    id: 5,
    title: '10 月 Rating 变动说明与下一场预告',
    titleEn: 'October Rating Update & Next Round Preview',
    node: 'notice', author: 'Welt',
    content: '十月份共 3 场 Rated 比赛已完成 rating 重算。有关规定提醒：\n\n1. Div. 1 上限 2499，超过请参加 Div. 1；\n2. 赛中查题解按作弊处理，本月经查实 2 例已处理；\n3. Monthly Open · 十月场将于本周末举行，题目略偏数学。',
    createdAt: '2026-10-19 09:00', views: 1988, likes: 64,
    comments: [c(9, 'Sora', '期待数学场！', '2026-10-19 09:30', 6)],
  },
  {
    id: 6,
    title: '水楼：聊聊你入坑 OI 的第一道题',
    titleEn: 'Lounge: The first OI problem you ever solved',
    node: 'lounge', author: 'Violet',
    content: '如题。我先来：A + B，当时还以为写对了一行 cin 就能过所有题（笑）。',
    createdAt: '2026-10-23 22:12', views: 4021, likes: 210,
    comments: [
      c(10, 'Stelle', 'A + B，然后WA了三次因为没开 long long。', '2026-10-23 22:20', 33),
      c(11, 'Himeko', '冒泡排序，O(n²) 跑 1e5，现在想想真勇。', '2026-10-23 22:35', 27,
        [c(103, 'Kronii', '勇者！', '2026-10-23 22:40', 8)]),
      c(12, 'Fauna', 'BFS 迷宫，第一次理解队列的时候感觉打开了新世界。', '2026-10-24 08:15', 19),
    ],
  },
  {
    id: 7,
    title: '【求助】背包恰好装满时如何初始化？',
    titleEn: 'Help: DP initialization for exactly-full knapsack',
    node: 'help', author: 'Kiana',
    content: '1005 采药如果改成「恰好用完 T 时间」的最大价值，f 数组初值应该怎么设？我设 f[0]=0 其余 -INF 输出前要判可达，请问还有别的写法吗？',
    createdAt: '2026-10-24 10:05', views: 512, likes: 9,
    comments: [
      c(13, 'Bronya', '你说的就是标准写法，输出时判 f[T] > -INF 即可。', '2026-10-24 10:30', 14),
    ],
  },
  {
    id: 8,
    title: '【题解】单源最短路：从朴素 Dijkstra 到堆优化',
    titleEn: '[Editorial] SSSP: From Naive to Heap-based Dijkstra',
    node: 'solution', author: 'Elysia',
    content: '本文分三步走：\n\n1. 朴素 O(n²)：适合稠密图；\n2. priority_queue + 懒惰删除 O(m log m)：赛场默认选择；\n3. 关于负权：为什么 Dijkstra 不行，以及 SPFA 的期望复杂度。\n\n附对拍脚本。',
    createdAt: '2026-10-22 19:00', views: 1330, likes: 88,
    comments: [c(14, 'Seele', '对拍脚本很实用！', '2026-10-22 19:40', 10)],
  },
  {
    id: 9,
    title: '评测机维护公告（10.26 凌晨）',
    titleEn: 'Judge Maintenance Notice (Oct 26, early morning)',
    node: 'notice', author: 'Himeko',
    content: '评测集群将于 10 月 26 日 02:00 - 04:00 进行例行维护，期间提交将进入队列稍后评测，比赛暂不受影响。',
    createdAt: '2026-10-24 18:00', views: 870, likes: 21,
    comments: [],
  },
  {
    id: 10,
    title: '分享：把 VSCode 配色搬进 TwilightOJ（自定义主题色玩法）',
    titleEn: 'Share: Recreating VSCode palettes with the hue slider',
    node: 'share', author: 'Lumine',
    content: '设置抽屉里的色相滑块是全局生效的：255 是默认的暮色紫，200 接近青蓝极光，320 偏品红。我按不同氛围截了几张图，大家玩玩看！',
    createdAt: '2026-10-24 21:20', views: 1024, likes: 75,
    comments: [c(15, 'Mumei', '320 好看！', '2026-10-24 21:35', 13)],
  },
  {
    id: 11,
    title: '求助：Python 3 过 TLE 边缘题有什么技巧？',
    titleEn: 'Help: Tips for squeaking Python 3 past TLE',
    node: 'help', author: 'Fauna',
    content: '1011 字符串哈希用 Python 写稳定超时，输入都已经用 sys.stdin 了。除了换 PyPy 语义的写法还有什么通用技巧吗？',
    createdAt: '2026-10-25 08:40', views: 402, likes: 6,
    comments: [
      c(16, 'Sakuya', '把字典换成数组 + 手写哈希，再用局部变量缓存频繁访问的全局名。', '2026-10-25 09:02', 17),
    ],
  },
  {
    id: 12,
    title: 'Nightfall Series 报名通道已开启',
    titleEn: 'Nightfall Series registration is open',
    node: 'notice', author: 'DanHeng',
    content: '年度压轴赛 Nightfall Series 开放报名，5 小时 9 题，前 10 名将获得限定头衔。报名截止至开赛前 1 小时。',
    createdAt: '2026-10-23 12:00', views: 1560, likes: 98,
    comments: [c(17, 'March7th', '已报名，冲！', '2026-10-23 12:15', 20)],
  },
  {
    id: 13,
    title: '题解征集：矩阵快速幂的构造思路汇总',
    titleEn: 'Call for editorials: constructing transition matrices',
    node: 'solution', author: 'Kronii',
    content: '想收集 1013 的各种转移矩阵构造：斐波那契只是入门，还有线性递推、图上定长路径计数、几何级数求和。欢迎跟帖补充你的构造！',
    createdAt: '2026-10-25 11:11', views: 288, likes: 31,
    comments: [
      c(18, 'Astesia', '图上定长路径那个构造太妙了，本质是邻接矩阵幂的封闭性。', '2026-10-25 11:40', 12),
    ],
  },
  {
    id: 14,
    title: '水楼：给下一场比赛出个趣味题目名',
    titleEn: 'Lounge: Suggest a fun name for the next contest',
    node: 'lounge', author: 'Sakuya',
    content: '命题组说下一场主题未定。评论区脑洞越大越好，被采纳有 RP 加成。',
    createdAt: '2026-10-25 14:00', views: 655, likes: 44,
    comments: [
      c(19, 'Violet', '「晚钟与回文」', '2026-10-25 14:10', 25),
      c(20, 'Stelle', '「垃圾桶里的最小生成树」', '2026-10-25 14:22', 41),
    ],
  },
]
