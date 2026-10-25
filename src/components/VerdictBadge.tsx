import { useTranslation } from 'react-i18next'
import {
  CheckCircle2, XCircle, AlarmClock, MemoryStick, Bug, FileWarning,
  Loader2, Hourglass,
} from 'lucide-react'
import type { Verdict } from '@/types'
import { VERDICT_COLOR } from '@/services/store'

const ICONS: Record<Verdict, typeof CheckCircle2> = {
  Accepted: CheckCircle2,
  WrongAnswer: XCircle,
  TimeLimitExceeded: AlarmClock,
  MemoryLimitExceeded: MemoryStick,
  RuntimeError: Bug,
  CompileError: FileWarning,
  Judging: Loader2,
  Pending: Hourglass,
}

/** 评测结果徽章（发光胶囊） */
export default function VerdictBadge({ verdict, spin }: { verdict: Verdict; spin?: boolean }) {
  const { t } = useTranslation()
  const { c, g } = VERDICT_COLOR[verdict]
  const Icon = ICONS[verdict]
  const busy = verdict === 'Judging' || verdict === 'Pending'
  return (
    <span
      className={`verdict ${busy && spin !== false ? 'spin' : ''}`}
      style={{ '--vc': c, '--vg': g } as React.CSSProperties}
    >
      <Icon />
      {t(`verdict.${verdict}`)}
    </span>
  )
}

export function verdictShortKey(v: Verdict): string {
  return `verdict.${v}Short`
}
