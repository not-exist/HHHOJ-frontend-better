import { useTranslation } from 'react-i18next'
import type { Difficulty, DifficultyKey } from '@/types'
import { DIFFICULTY_KEYS } from '@/types'

const VAR_NAMES = ['--d0', '--d1', '--d2', '--d3', '--d4', '--d5']

/** 难度标签：彩点 + 档位名 */
export default function DifficultyTag({ difficulty }: { difficulty: Difficulty }) {
  const { t } = useTranslation()
  const key: DifficultyKey = DIFFICULTY_KEYS[difficulty]
  return (
    <span className="diff-tag" style={{ '--dc': `var(${VAR_NAMES[difficulty]})` } as React.CSSProperties}>
      {t(`diff.${key}`)}
    </span>
  )
}

export { VAR_NAMES as DIFFICULTY_VARS }
