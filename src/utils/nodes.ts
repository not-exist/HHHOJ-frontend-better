export const NODES = ['all', 'solution', 'help', 'share', 'notice', 'lounge'] as const
export type NodeKey = (typeof NODES)[number]
