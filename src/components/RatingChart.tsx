import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import UserLink from '@/components/UserLink'
import { ratingColor } from '@/utils/user'
import { timeValue } from '@/services/api/http'
import { useTheme } from '@/context/ThemeContext'

export type RatingPoint = {
  contestId: number
  name: string
  startTime: string
  rank: number
  rating: number
  delta: number
}

const H = 500
// flot's own axis box: its text layer is 14px * smaller with #545454, giving a 33px left
// margin for four-digit labels, an 18px right one, and 17.5px-tall labels top and bottom.
const L = 33
const R = 18
const T = 9
const B = 25
const LABEL = 14 / 1.2
const LINE = '#3850eb'
const HIGHLIGHT = 'rgba(56,80,235,0.5)'
const GRADIENT_ID = 'rating-chart-bg'
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
const DAY = 24 * 3600 * 1000
// History times are the server's (Asia/Shanghai) wall clock; flot plotted them as if they were UTC.
const SHANGHAI = 8 * 3600 * 1000

type Point = {
  x: number
  y: number
  rating: number
  contest: { id: number; name: string; rank: number; delta: number } | null
}

// flot's $.plot.floorInBase.
function floorInBase(n: number, base: number): number {
  return base * Math.floor(n / base)
}

// flot's setupTickGeneration for a numeric axis.
function yTickSize(min: number, max: number): number {
  const delta = (max - min) / (0.3 * Math.sqrt(H))
  const dec = -Math.floor(Math.log(delta) / Math.LN10)
  const magn = Math.pow(10, -dec)
  const norm = delta / magn
  const size = norm < 1.5 ? 1 : norm < 3 ? (norm > 2.25 ? 2.5 : 2) : norm < 7.5 ? 5 : 10
  return size * magn
}

function yTicks(min: number, max: number): number[] {
  const size = yTickSize(min, max)
  const start = floorInBase(min, size)
  const ticks: number[] = []
  let i = 0
  let v = Number.NaN
  let prev: number
  do {
    prev = v
    v = start + i * size
    ticks.push(v)
    ++i
  } while (v < max && v !== prev)
  return ticks
}

// flot.time's timeUnitSize.
const timeUnitSize = {
  second: 1000,
  minute: 60 * 1000,
  hour: 3600 * 1000,
  day: 24 * 3600 * 1000,
  month: 30 * 24 * 3600 * 1000,
  quarter: 3 * 30 * 24 * 3600 * 1000,
  year: 365.2425 * 24 * 3600 * 1000,
}
type TimeUnit = keyof typeof timeUnitSize

// flot.time's baseSpec concatenated with [[3, month], [6, month], [1, year]].
const specMonths: [number, TimeUnit][] = [
  [1, 'second'],
  [2, 'second'],
  [5, 'second'],
  [10, 'second'],
  [30, 'second'],
  [1, 'minute'],
  [2, 'minute'],
  [5, 'minute'],
  [10, 'minute'],
  [30, 'minute'],
  [1, 'hour'],
  [2, 'hour'],
  [4, 'hour'],
  [8, 'hour'],
  [12, 'hour'],
  [1, 'day'],
  [2, 'day'],
  [3, 'day'],
  [0.25, 'month'],
  [0.5, 'month'],
  [1, 'month'],
  [2, 'month'],
  [3, 'month'],
  [6, 'month'],
  [1, 'year'],
]

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// flot.time's formatDate for the UTC getters only, limited to the codes the x labels use.
function formatDate(d: Date, fmt: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  let out = ''
  for (let i = 0; i < fmt.length; ++i) {
    if (fmt[i] !== '%') {
      out += fmt[i]
      continue
    }
    const c = fmt[++i]
    if (c === 'H') out += pad(d.getUTCHours())
    else if (c === 'M') out += pad(d.getUTCMinutes())
    else if (c === 'S') out += pad(d.getUTCSeconds())
    else if (c === 'd') out += pad(d.getUTCDate())
    else if (c === 'b') out += MONTH_NAMES[d.getUTCMonth()]
    else if (c === 'Y') out += String(d.getUTCFullYear())
  }
  return out
}

// flot.time's tickFormatter.
function xFormat(size: number, unit: TimeUnit, span: number): string {
  const step = size * timeUnitSize[unit]
  if (step < timeUnitSize.minute) return '%H:%M:%S'
  if (step < timeUnitSize.day) return span < 2 * timeUnitSize.day ? '%H:%M' : '%b %d %H:%M'
  if (step < timeUnitSize.month) return '%b %d'
  if (step < timeUnitSize.year) return span < timeUnitSize.year ? '%b' : '%b %Y'
  return '%Y'
}

// flot.time's tickGenerator.
function xTicks(min: number, max: number, width: number): { v: number; label: string }[] {
  const delta = (max - min) / (0.3 * Math.sqrt(width))
  let i = 0
  for (; i < specMonths.length - 1; ++i) {
    const [size1, unit1] = specMonths[i]
    const [size2, unit2] = specMonths[i + 1]
    if (delta < (size1 * timeUnitSize[unit1] + size2 * timeUnitSize[unit2]) / 2) break
  }
  let size = specMonths[i][0]
  const unit = specMonths[i][1]
  if (unit === 'year') {
    const magn = Math.pow(10, Math.floor(Math.log(delta / timeUnitSize.year) / Math.LN10))
    const norm = delta / timeUnitSize.year / magn
    size = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7.5 ? 5 : 10
    size *= magn
    if (size < 1) size = 1
  }
  const tickSize = size
  const step = tickSize * timeUnitSize[unit]

  const d = new Date(min)
  if (unit === 'second') d.setUTCSeconds(floorInBase(d.getUTCSeconds(), tickSize))
  else if (unit === 'minute') d.setUTCMinutes(floorInBase(d.getUTCMinutes(), tickSize))
  else if (unit === 'hour') d.setUTCHours(floorInBase(d.getUTCHours(), tickSize))
  else if (unit === 'month') d.setUTCMonth(floorInBase(d.getUTCMonth(), tickSize))
  else if (unit === 'quarter') d.setUTCMonth(3 * floorInBase(d.getUTCMonth() / 3, tickSize))
  else if (unit === 'year') d.setUTCFullYear(floorInBase(d.getUTCFullYear(), tickSize))

  d.setUTCMilliseconds(0)
  if (step >= timeUnitSize.minute) d.setUTCSeconds(0)
  if (step >= timeUnitSize.hour) d.setUTCMinutes(0)
  if (step >= timeUnitSize.day) d.setUTCHours(0)
  if (step >= timeUnitSize.day * 4) d.setUTCDate(1)
  if (step >= timeUnitSize.month * 2) d.setUTCMonth(floorInBase(d.getUTCMonth(), 3))
  if (step >= timeUnitSize.quarter * 2) d.setUTCMonth(floorInBase(d.getUTCMonth(), 6))
  if (step >= timeUnitSize.year) d.setUTCMonth(0)

  const fmt = xFormat(tickSize, unit, max - min)
  const ticks: { v: number; label: string }[] = []
  let carry = 0
  let v = Number.NaN
  let prev: number
  do {
    prev = v
    v = d.getTime()
    ticks.push({ v, label: formatDate(d, fmt) })
    if (unit === 'month' || unit === 'quarter') {
      if (tickSize < 1) {
        d.setUTCDate(1)
        const start = d.getTime()
        d.setUTCMonth(d.getUTCMonth() + (unit === 'quarter' ? 3 : 1))
        const end = d.getTime()
        d.setTime(v + carry * timeUnitSize.hour + (end - start) * tickSize)
        carry = d.getUTCHours()
        d.setUTCHours(0)
      } else {
        d.setUTCMonth(d.getUTCMonth() + tickSize * (unit === 'quarter' ? 3 : 1))
      }
    } else if (unit === 'year') {
      d.setUTCFullYear(d.getUTCFullYear() + tickSize)
    } else {
      d.setTime(v + step)
    }
  } while (v < max && v !== prev)
  return ticks
}

export default function RatingChart({
  username,
  history = [],
  current,
}: {
  username: string
  history?: RatingPoint[]
  current: number
}) {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const dark = mode === 'dark'
  const GRID = dark ? '#b9b9c6' : '#545454'
  const GRID_LINE = dark ? 'rgba(200,200,220,0.16)' : 'rgba(84,84,84,0.22)'

  const tooltip = (point: Point): ReactNode => {
    if (point.contest === null) {
      return (
        <>
          = {point.rating}
          <br />
          {t('user.ratingUnrated')}
        </>
      )
    }
    const change = point.contest.delta > 0 ? '+' + point.contest.delta : String(point.contest.delta)
    return (
      <>
        = {point.rating} ({change}), <br />
        {t('user.ratingRank', { rank: point.contest.rank })}
        <br />
        <Link to={'/contest/' + point.contest.id}>{point.contest.name}</Link>
      </>
    )
  }

  // `hover` marks the point the cursor is near; `shown` is the tooltip, which flot kept until a click.
  const [hover, setHover] = useState<number | null>(null)
  const [shown, setShown] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setW(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const points: Point[] =
    history.length > 0
      ? history.map((h) => ({
          x: timeValue(h.startTime) + SHANGHAI,
          y: h.rating,
          rating: h.rating,
          contest: { id: h.contestId, name: h.name, rank: h.rank, delta: h.delta },
        }))
      : [{ x: Date.now() + SHANGHAI, y: current, rating: current, contest: null }]

  const ratings = [current, 1500, ...points.map((p) => p.y)]
  const yMin = Math.min(...ratings) - 400
  const yMax = Math.max(...ratings) + 400
  let x0 = Math.min(...points.map((p) => p.x))
  let x1 = Math.max(...points.map((p) => p.x))
  if (x1 - x0 < DAY) {
    x0 -= DAY
    x1 += DAY
  }

  const PW = Math.max(W - L - R, 1)
  const PH = H - T - B
  const sx = (x: number) => L + ((x - x0) / (x1 - x0)) * PW
  const sy = (y: number) => T + ((yMax - y) / (yMax - yMin)) * PH

  const ny = 64
  const stops = Array.from({ length: ny }, (_, k) => {
    const o = k / (ny - 1)
    return { o, color: ratingColor(yMax - (yMax - yMin) * o) }
  })

  const ysAll = yTicks(yMin, yMax)
  const xsAll = W > 0 ? xTicks(x0, x1, W) : []
  // flot labels every tick in [min, max] but only draws grid lines strictly inside.
  const ys = ysAll.filter((v) => v >= yMin && v <= yMax)
  const xs = xsAll.filter((t) => t.v >= x0 && t.v <= x1)

  const hoveredPoint = hover === null ? null : points[hover]
  const shownPoint = shown === null ? null : points[shown]

  // flot's shadows: two strokes under the line and two lower half-circles under each point.
  const angle = Math.PI / 18
  const shadow = (d: number) => ({ x: Math.sin(angle) * d, y: Math.cos(angle) * d })
  const line1 = shadow(2 / 2 + 3 / 2)
  const line2 = shadow(2 / 2 + 3 / 4)
  const poly = (dx: number, dy: number) => points.map((p) => `${sx(p.x) + dx},${sy(p.y) + dy}`).join(' ')
  const halfCircle = (p: Point, off: number) => {
    const x = sx(p.x)
    const y = sy(p.y) + off
    return `M ${x - 3},${y} A 3,3 0 0,0 ${x + 3},${y}`
  }

  // flot draws 1px lines and text on whole pixels.
  const crisp = (v: number) => Math.floor(v) + 0.5

  // flot picks the point nearest the cursor within 10px (grid.mouseActiveRadius).
  const nearest = (e: MouseEvent<SVGSVGElement>): number | null => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best: number | null = null
    let bestD = 10 * 10 + 1
    points.forEach((p, i) => {
      const dx = sx(p.x) - mx
      const dy = sy(p.y) - my
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  }

  return (
    <div ref={box} style={{ position: 'relative', height: H }}>
      <svg
        viewBox={`0 0 ${Math.max(W, 1)} ${H}`}
        style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}
        fontFamily={FONT}
        role="img"
        aria-label="Rating history"
        onMouseMove={(e) => {
          const n = nearest(e)
          setHover(n)
          if (n !== null) setShown(n)
        }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => {
          const n = nearest(e)
          setShown(n !== null && shown === null ? n : null)
        }}
      >
        <defs>
          <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
            {stops.map((s) => (
              <stop key={s.o} offset={s.o} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>
        <rect x={L} y={T} width={PW} height={PH} fill={`url(#${GRADIENT_ID})`} opacity={dark ? 0.35 : 1} />
        {ysAll
          .filter((v) => v > yMin && v < yMax)
          .map((v) => (
            <line key={'y' + v} x1={L} x2={W - R} y1={crisp(sy(v))} y2={crisp(sy(v))} stroke={GRID_LINE} />
          ))}
        {xsAll
          .filter((t) => t.v > x0 && t.v < x1)
          .map((t) => (
            <line key={'x' + t.v} x1={crisp(sx(t.v))} x2={crisp(sx(t.v))} y1={T} y2={H - B} stroke={GRID_LINE} />
          ))}
        <rect x={L - 1} y={T - 1} width={PW + 2} height={PH + 2} fill="none" stroke={GRID} strokeWidth={2} />
        {ys.map((v) => (
          <text key={'yl' + v} x={Math.round(L - 5)} y={Math.round(sy(v) + 4)} textAnchor="end" fontSize={LABEL} fill={GRID}>
            {Math.round(v)}
          </text>
        ))}
        {xs.map((t) => (
          <text key={'xl' + t.v} x={Math.round(sx(t.v))} y={Math.round(H - B + 17)} textAnchor="middle" fontSize={LABEL} fill={GRID}>
            {t.label}
          </text>
        ))}
        <polyline fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={3} points={poly(line1.x, line1.y)} />
        <polyline fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={1.5} points={poly(line2.x, line2.y)} />
        <polyline fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" points={poly(0, 0)} />
        {points.map((p, i) => (
          <g key={i}>
            <path d={halfCircle(p, 2.25)} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={1.5} />
            <path d={halfCircle(p, 0.75)} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={1.5} />
            <circle cx={sx(p.x)} cy={sy(p.y)} r={3} fill="#ffffff" stroke={LINE} strokeWidth={2} />
          </g>
        ))}
        {hoveredPoint && (
          <circle
            cx={sx(hoveredPoint.x)}
            cy={sy(hoveredPoint.y)}
            r={6}
            fill="none"
            stroke={HIGHLIGHT}
            strokeWidth={4}
            pointerEvents="none"
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: T + 5,
          right: R + 5,
          background: dark ? 'rgba(20,20,28,0.85)' : 'rgba(255,255,255,0.85)',
          fontSize: 'smaller',
          color: GRID,
          whiteSpace: 'nowrap',
          padding: 1,
        }}
      >
        <span style={{ display: 'inline-block', border: '1px solid #ccc', padding: 1, marginRight: 2, verticalAlign: 'middle' }}>
          <span style={{ display: 'block', width: 10, height: 10, background: LINE }} />
        </span>
        <UserLink name={username} rating={current} symbols={false} byRating />
      </div>
      {shownPoint && (
        <div
          style={{
            position: 'absolute',
            left: sx(shownPoint.x) + 10,
            top: sy(shownPoint.y) - 20,
            border: `1px solid ${dark ? 'rgba(255,150,150,0.35)' : '#fdd'}`,
            padding: 2,
            fontSize: 11,
            background: dark ? 'rgba(48,32,38,0.95)' : '#fee',
            color: dark ? '#f3d9d9' : '#545454',
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip(shownPoint)}
        </div>
      )}
    </div>
  )
}
