import { useId, useMemo } from 'react'

export interface RatingPoint {
  name: string
  rating: number
}

/** 轻量 Rating 曲线：原生 SVG，避免把 recharts 整包塞进用户脚本 */
export default function RatingChart({ data, height = 220 }: { data: RatingPoint[]; height?: number }) {
  const gradientId = useId().replace(/:/g, '')
  const width = 720
  const pad = { top: 16, right: 16, bottom: 26, left: 46 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const chart = useMemo(() => {
    const ratings = data.map((d) => d.rating)
    const min = Math.min(...ratings) - 100
    const max = Math.max(...ratings) + 100
    const span = Math.max(1, max - min)
    const x = (i: number) => pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
    const y = (v: number) => pad.top + innerH - ((v - min) / span) * innerH
    const points = data.map((d, i) => ({ ...d, x: x(i), y: y(d.rating) }))
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L${points[points.length - 1].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${points[0].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`
    const ticks = Array.from({ length: 4 }, (_, i) => {
      const value = Math.round(min + (span * i) / 3)
      return { value, y: y(value) }
    }).reverse()
    return { points, line, area, ticks, min, max }
  }, [data, height, innerH, innerW, pad.left, pad.top])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Rating history"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {chart.ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={tick.y}
            y2={tick.y}
            stroke="var(--border)"
            strokeDasharray="3 6"
          />
          <text x={pad.left - 8} y={tick.y + 4} textAnchor="end" fill="var(--text-3)" fontSize={11}>
            {tick.value}
          </text>
        </g>
      ))}
      <path d={chart.area} fill={`url(#${gradientId})`} />
      <path d={chart.line} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {chart.points.map((p, i) => (
        <g key={`${p.name}-${i}`}>
          <circle cx={p.x} cy={p.y} r={3} fill="var(--primary)" stroke="var(--bg)" strokeWidth={1.5}>
            <title>{`${p.name}: ${p.rating}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}
