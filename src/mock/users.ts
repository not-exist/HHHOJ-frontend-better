import type { OJUser } from '@/types'

/** 由用户名推导稳定的头像色相 */
export function hueOf(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function avatarStyle(name: string, size: number) {
  return {
    width: size,
    height: size,
    '--ah': hueOf(name),
    fontSize: size * 0.42,
  } as React.CSSProperties
}

export const USERS: OJUser[] = [
  {
    id: 1, name: 'Nebula', rating: 2861, acCount: 412, submissionCount: 1470,
    bio: '静水流深。Still waters run deep.', bioEn: 'Still waters run deep.',
    joinedAt: '2023-03-12', school: 'Twilight Institute', ratingHistory: [1899, 1942, 2010, 1987, 2066, 2151, 2204, 2318, 2402, 2510, 2689, 2861],
    avatarHue: 0,
  },
  {
    id: 2, name: 'Astesia', rating: 2593, acCount: 355, submissionCount: 1210,
    bio: '指尖的星光会指引方向。', bioEn: 'Starlight on fingertips shows the way.',
    joinedAt: '2023-05-02', school: 'Lumen University', ratingHistory: [1720, 1811, 1902, 1998, 2074, 2150, 2222, 2301, 2410, 2498, 2593],
    avatarHue: 0,
  },
  {
    id: 3, name: 'Kaguya', rating: 2410, acCount: 321, submissionCount: 1105,
    bio: '竹取物语爱好者。', bioEn: 'A fan of The Tale of the Bamboo Cutter.',
    joinedAt: '2023-01-20', school: 'Moon Palace Academy', ratingHistory: [1600, 1650, 1723, 1802, 1911, 2004, 2088, 2170, 2265, 2410],
    avatarHue: 0,
  },
  {
    id: 4, name: 'FrostNova', rating: 2277, acCount: 298, submissionCount: 986,
    bio: 'Debug 到凌晨是常态。', bioEn: 'Debugging till dawn is the norm.',
    joinedAt: '2022-11-08', school: 'Rhine Lab', ratingHistory: [1540, 1622, 1710, 1788, 1851, 1920, 2002, 2087, 2166, 2277],
    avatarHue: 0,
  },
  {
    id: 5, name: 'Lumine', rating: 2145, acCount: 276, submissionCount: 902,
    bio: '旅行者，出发！', bioEn: 'Traveler, onward!',
    joinedAt: '2023-07-15', school: 'Teyvat University', ratingHistory: [1499, 1580, 1666, 1750, 1832, 1911, 1980, 2050, 2145],
    avatarHue: 0,
  },
  {
    id: 6, name: 'Elysia', rating: 2033, acCount: 250, submissionCount: 840,
    bio: '往世乐土 · 逐梦之影 ✨', bioEn: 'Elysian Realm · chasing dream shadow ✨',
    joinedAt: '2023-02-28', school: 'Elysian Realm', ratingHistory: [1450, 1522, 1601, 1690, 1777, 1851, 1920, 1980, 2033],
    avatarHue: 0,
  },
  {
    id: 7, name: 'Sora', rating: 1922, acCount: 231, submissionCount: 795,
    bio: 'Sky is the limit.', bioEn: 'Sky is the limit.',
    joinedAt: '2023-09-01', school: 'Destiny Islands HS', ratingHistory: [1380, 1451, 1523, 1600, 1671, 1740, 1812, 1922],
    avatarHue: 0,
  },
  {
    id: 8, name: 'Bronya', rating: 1856, acCount: 219, submissionCount: 764,
    bio: '重装小兔，就位。', bioEn: 'HOMU lover & reload master.',
    joinedAt: '2023-04-11', school: 'Siberia Institute', ratingHistory: [1350, 1420, 1490, 1560, 1622, 1700, 1780, 1856],
    avatarHue: 0,
  },
  {
    id: 9, name: 'Violet', rating: 1780, acCount: 205, submissionCount: 700,
    bio: '自动手记人偶，随时待命。', bioEn: 'Auto Memory Doll, at your service.',
    joinedAt: '2023-06-20', school: 'CH Postal Company', ratingHistory: [1300, 1372, 1440, 1511, 1580, 1650, 1720, 1780],
    avatarHue: 0,
  },
  {
    id: 10, name: 'Mumei', rating: 1694, acCount: 194, submissionCount: 668,
    bio: '文明的守望者。', bioEn: 'Guardian of civilization.',
    joinedAt: '2023-08-30', school: 'Nature Council', ratingHistory: [1250, 1330, 1401, 1470, 1533, 1601, 1694],
    avatarHue: 0,
  },
  {
    id: 11, name: 'Seele', rating: 1602, acCount: 180, submissionCount: 610,
    bio: '蝶翼之下亦有力量。', bioEn: 'Power rests beneath butterfly wings.',
    joinedAt: '2023-10-05', school: 'Wildfire', ratingHistory: [1200, 1280, 1352, 1420, 1490, 1602],
    avatarHue: 0,
  },
  {
    id: 12, name: 'March7th', rating: 1519, acCount: 165, submissionCount: 573,
    bio: '拍照留念是开拓的一部分！', bioEn: 'Taking photos is part of the trailblaze!',
    joinedAt: '2024-01-15', school: 'Astral Express', ratingHistory: [1150, 1230, 1301, 1380, 1452, 1519],
    avatarHue: 0,
  },
  {
    id: 13, name: 'DanHeng', rating: 1438, acCount: 152, submissionCount: 520,
    bio: '冷冽的枪，平静的心。', bioEn: 'Cold spear, calm mind.',
    joinedAt: '2024-02-02', school: 'Astral Express', ratingHistory: [1100, 1180, 1250, 1322, 1380, 1438],
    avatarHue: 0,
  },
  {
    id: 14, name: 'Kiana', rating: 1345, acCount: 138, submissionCount: 488,
    bio: ' being 女武神，正在路上。', bioEn: 'Valkyrie in training.',
    joinedAt: '2024-03-18', school: 'St. Freya Academy', ratingHistory: [1050, 1120, 1190, 1252, 1301, 1345],
    avatarHue: 0,
  },
  {
    id: 15, name: 'Himeko', rating: 1251, acCount: 122, submissionCount: 430,
    bio: '咖啡与星空。', bioEn: 'Coffee and starry skies.',
    joinedAt: '2024-04-22', school: 'Astral Express', ratingHistory: [1000, 1060, 1120, 1170, 1215, 1251],
    avatarHue: 0,
  },
  {
    id: 16, name: 'Welt', rating: 1166, acCount: 108, submissionCount: 390,
    bio: '理性的重力。', bioEn: 'The gravity of reason.',
    joinedAt: '2024-05-10', school: 'Astral Express', ratingHistory: [980, 1020, 1060, 1100, 1135, 1166],
    avatarHue: 0,
  },
  {
    id: 17, name: 'Sakuya', rating: 1080, acCount: 95, submissionCount: 342,
    bio: '时间会证明一切。', bioEn: 'Time will tell.',
    joinedAt: '2024-06-01', school: 'Scarlet Devil Mansion', ratingHistory: [900, 940, 980, 1010, 1050, 1080],
    avatarHue: 0,
  },
  {
    id: 18, name: 'Fauna', rating: 992, acCount: 81, submissionCount: 300,
    bio: '德鲁伊的日常。', bioEn: 'Daily life of a druid.',
    joinedAt: '2024-07-19', school: 'Nature Council', ratingHistory: [860, 890, 920, 950, 975, 992],
    avatarHue: 0,
  },
  {
    id: 19, name: 'Kronii', rating: 933, acCount: 70, submissionCount: 266,
    bio: '时间是美学的。', bioEn: 'Time is aesthetic.',
    joinedAt: '2024-08-11', school: 'Nature Council', ratingHistory: [820, 850, 875, 900, 920, 933],
    avatarHue: 0,
  },
  {
    id: 20, name: 'Stelle', rating: 878, acCount: 58, submissionCount: 210,
    bio: '垃圾桶巡礼中。', bioEn: 'On a trash-can pilgrimage.',
    joinedAt: '2024-09-25', school: 'Astral Express', ratingHistory: [780, 800, 825, 845, 865, 878],
    avatarHue: 0,
  },
]

export const USER_MAP = new Map(USERS.map((u) => [u.name, u]))

/** rating → 等级档位（用于配色） */
export function ratingTier(rating: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (rating >= 2400) return 5
  if (rating >= 2100) return 4
  if (rating >= 1800) return 3
  if (rating >= 1500) return 2
  if (rating >= 1200) return 1
  return 0
}
