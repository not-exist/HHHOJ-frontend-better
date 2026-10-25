import type { Contest, StandingsRow, ContestRule } from '@/types'
import { USERS } from './users'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const CONTESTS: Contest[] = [
  {
    id: 101,
    title: 'Twilight Round #42（Div. 2）',
    titleEn: 'Twilight Round #42 (Div. 2)',
    rule: 'ACM', phase: 'running',
    startAt: Date.now() - 1 * HOUR, endAt: Date.now() + 2 * HOUR,
    description: '本场为 Rated 比赛，赛制 ACM，时长 3 小时，共 6 题。祝好运！',
    descriptionEn: 'A Rated contest under ACM rules, 3 hours, 6 problems. Good luck!',
    problems: [1002, 1004, 1006, 1009, 1012, 1014],
    participantCount: 156,
    rated: true,
    announcements: [
      { time: '00:05', text: '评测机已就位，祝大家 RP++。' },
      { time: '00:42', text: 'D 题时间限制已放宽至 2s。' },
    ],
  },
  {
    id: 102,
    title: '新手教学赛 · 第七期',
    titleEn: 'Beginner Training Contest #7',
    rule: 'OI', phase: 'running',
    startAt: Date.now() - 3 * HOUR, endAt: Date.now() + 1 * HOUR,
    description: '面向新手的 OI 赛制比赛，测试点部分分制。',
    descriptionEn: 'An OI-rules contest for beginners with partial scoring.',
    problems: [1000, 1001, 1002, 1003],
    participantCount: 89,
    rated: false,
    announcements: [{ time: '01:10', text: 'C 题数据已加强。' }],
  },
  {
    id: 103,
    title: 'Monthly Open · 十月场',
    titleEn: 'Monthly Open — October',
    rule: 'ACM', phase: 'upcoming',
    startAt: Date.now() + 1 * DAY + 2 * HOUR, endAt: Date.now() + 1 * DAY + 5 * HOUR,
    description: '每月公开赛，ACM 赛制，Rated。',
    descriptionEn: 'The monthly open contest, ACM rules, Rated.',
    problems: [1005, 1007, 1010, 1011, 1013, 1016],
    participantCount: 233,
    rated: true,
    announcements: [],
  },
  {
    id: 104,
    title: '图论专题挑战赛',
    titleEn: 'Graph Theory Challenge',
    rule: 'IOI', phase: 'upcoming',
    startAt: Date.now() + 3 * DAY, endAt: Date.now() + 3 * DAY + 4 * HOUR,
    description: '专注于图论算法的 IOI 赛制专题赛。',
    descriptionEn: 'An IOI-style themed contest focused on graph algorithms.',
    problems: [1007, 1009, 1010, 1016],
    participantCount: 67,
    rated: false,
    announcements: [],
  },
  {
    id: 105,
    title: '夜之祭 · Nightfall Series',
    titleEn: 'Nightfall Series — Grand Finale',
    rule: 'ACM', phase: 'upcoming',
    startAt: Date.now() + 6 * DAY + 8 * HOUR, endAt: Date.now() + 6 * DAY + 13 * HOUR,
    description: '一年一度的夜间系列赛决赛，5 小时 9 题，极度硬核。',
    descriptionEn: 'The annual night series finale: 5 hours, 9 problems, extremely hardcore.',
    problems: [1012, 1013, 1014, 1015, 1017, 1018, 1019],
    participantCount: 312,
    rated: true,
    announcements: [],
  },
  {
    id: 106,
    title: 'Twilight Round #41（Div. 1）',
    titleEn: 'Twilight Round #41 (Div. 1)',
    rule: 'ACM', phase: 'finished',
    startAt: Date.now() - 2 * DAY - 3 * HOUR, endAt: Date.now() - 2 * DAY,
    description: '上一场 Div. 1 已经结束，可以查看榜单与题解。',
    descriptionEn: 'The previous Div. 1 has ended; check standings and solutions.',
    problems: [1009, 1012, 1013, 1015, 1017, 1018],
    participantCount: 198,
    rated: true,
    announcements: [{ time: '02:55', text: 'F 题命题有误，已重测。' }],
  },
  {
    id: 107,
    title: '开学模拟赛 · 秋',
    titleEn: 'Back-to-School Mock — Autumn',
    rule: 'OI', phase: 'finished',
    startAt: Date.now() - 9 * DAY, endAt: Date.now() - 9 * DAY + 5 * HOUR,
    description: '模拟 CSP-S 赛制的练习赛。',
    descriptionEn: 'A mock contest following CSP-S rules.',
    problems: [1001, 1005, 1006, 1008],
    participantCount: 145,
    rated: false,
    announcements: [],
  },
  {
    id: 108,
    title: 'Summer Fireworks · 夏日花火',
    titleEn: 'Summer Fireworks',
    rule: 'ACM', phase: 'finished',
    startAt: Date.now() - 30 * DAY, endAt: Date.now() - 30 * DAY + 3 * HOUR,
    description: '夏日特别赛，题目均与烟花与浪漫有关（并不）。',
    descriptionEn: 'A summer special — problems loosely themed around fireworks (not really).',
    problems: [1003, 1004, 1008, 1011, 1014, 1016],
    participantCount: 276,
    rated: true,
    announcements: [],
  },
]

/** 生成一份确定性的 ACM/OI 榜单 */
export function standingsFor(contest: Contest): StandingsRow[] {
  const rows: StandingsRow[] = []
  const seed = contest.id * 7919
  const pool = USERS.filter((_, i) => (i * seed) % 3 !== 2).slice(0, Math.min(20, USERS.length))
  const progress = contest.phase === 'running' ? 0.4 : contest.phase === 'finished' ? 1 : 0
  for (let i = 0; i < pool.length; i++) {
    const u = pool[i]
    // 用户越强解出越多
    const skill = (u.rating - 800) / 2100
    const solveCap = Math.ceil(contest.problems.length * Math.min(1, skill + (contest.id % 5) * 0.06))
    const solved = Math.max(0, Math.round(solveCap * progress))
    let penalty = 0
    const cells = contest.problems.map((pid, j) => {
      const solvedThis = j < solved
      const attempts = solvedThis ? 1 + ((seed + i * 13 + j * 7) % 3) : ((seed + i * 11 + j * 5) % 4 === 0 ? 1 + ((seed + j) % 5) : 0)
      const solvedAtMin = solvedThis ? 15 + ((seed * (j + 3) + i * 17) % Math.max(1, Math.round((contest.endAt - contest.startAt) / MIN) - 40)) : null
      if (solvedThis && contest.rule === 'ACM') penalty += solvedAtMin! + 20 * (attempts - 1)
      const score = contest.rule === 'ACM'
        ? (solvedThis ? 100 : 0)
        : (solvedThis ? 100 : attempts > 0 ? 10 + ((seed + j * 3) % 40) : 0)
      return { problemId: pid, attempts, solvedAtMin, score }
    })
    const scoreSum = cells.reduce((s, c) => s + c.score, 0)
    rows.push({
      rank: 0,
      userName: u.name,
      solved,
      penaltyMinutes: Math.round(penalty),
      score: scoreSum,
      cells,
    })
  }
  if (contest.rule === 'ACM') {
    rows.sort((a, b) => b.solved - a.solved || a.penaltyMinutes - b.penaltyMinutes)
  } else {
    rows.sort((a, b) => b.score - a.score)
  }
  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}

export function contestRuleLabel(rule: ContestRule): string {
  return rule
}
