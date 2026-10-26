import { useEffect, useRef } from 'react'
import { useTheme } from '@/context/ThemeContext'

interface P {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  a: number
  tw: number
}

/** Twilight 式漂浮粒子背景：低透明度光点缓慢上浮、明灭 */
export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { hue } = useTheme()
  const hueRef = useRef(hue)
  hueRef.current = hue

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const N = Math.min(46, Math.max(18, Math.floor(window.innerWidth / 34)))
    let parts: P[] = []

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      parts = Array.from({ length: N }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 2.4,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(0.05 + Math.random() * 0.22),
        a: 0.14 + Math.random() * 0.4,
        tw: Math.random() * Math.PI * 2,
      }))
    }

    const step = () => {
      ctx.clearRect(0, 0, w, h)
      const h2 = hueRef.current
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.tw += 0.008
        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        const alpha = p.a * (0.72 + 0.28 * Math.sin(p.tw))
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2)
        grad.addColorStop(0, `hsla(${h2}, 85%, 78%, ${alpha})`)
        grad.addColorStop(1, `hsla(${h2}, 85%, 78%, 0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(step)
    }

    resize()
    step()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />
}
