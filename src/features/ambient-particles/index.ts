// P2a ambient-particles（默认开启）：金萤粒子 + 兜底链。
// 兜底顺序（任一命中即降级）：prefers-reduced-motion → 不启动；
// 比赛进行中且设置允许 → 暂停；低端设备 → 性能模式（减量、关旋转）；
// 标签页隐藏 → rAF 暂停（engine 内置）；粒子数 0 → 不启动。
import { ParticleEngine, type ParticleOptions } from './engine'
import { onContestChange, contestState } from '../../core/bridge'
import { onSettings, settings } from '../../services/store'
import { onReady } from '../../services/dom'

// Low-end devices: half the particles, no rotation (perf mode).
function lowEnd(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || navigator.hardwareConcurrency <= 4
}

function currentOptions(): ParticleOptions {
  const s = settings()
  const count = lowEnd() ? Math.min(6, Math.ceil(s.particles.count / 2)) : s.particles.count
  return { count, rotation: !lowEnd(), zIndex: 100 }
}

export default {
  id: 'ambient-particles',
  title: '金萤粒子',
  description: '暖金色光点从屏幕底部升起（默认开启，比赛时自动暂停）',
  defaultOn: true,
  setup(): () => void {
    let engine: ParticleEngine | null = null

    const degraded = (): boolean => contestState() && settings().contestDegrade

    const sync = () => {
      if (engine === null) return
      if (degraded()) engine.stop()
      else engine.start()
    }

    onReady(() => {
      engine = new ParticleEngine(currentOptions())
      sync()
    })

    const offSettings = onSettings(() => engine?.setOptions(currentOptions()))
    const offContest = onContestChange(() => sync())

    return () => {
      offSettings()
      offContest()
      engine?.stop()
      engine = null
    }
  },
}
