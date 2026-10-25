// P2a particle engine — ported from Twilight src/utils/particle.ts with the
// fixes the original lacks: stored resize handler, visibilitychange pause,
// prefers-reduced-motion refusal, and a programmatically drawn sprite (the
// original's warm gold glow, RGB≈255,156,0 — reproduced with a radial gradient).
import { reducedMotion } from '../../services/gm'

export type ParticleOptions = { count: number; rotation: boolean; zIndex: number }

// Twilight defaults (twilight.config.yaml:375-416), all in px/frame units.
const BOUNDARY_OFFSET = 100
const SPRITE_BASE = 40 // draw size = 40 * scale, particle.ts:59
const SPEED = {
  horizontal: { min: -0.9, max: 0.9 },
  vertical: { min: 0.15, max: 0.3 },
  rotation: 0.12,
  fade: 0.12,
}
const SIZE = { min: 0.3, max: 0.9 }
const OPACITY = { min: 0.3, max: 0.9 }

type Particle = {
  x: number
  y: number
  s: number
  r: number
  a: number
  fx: number
  fy: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

// The warm golden glow sprite, drawn once (particle.png look-alike).
function makeSprite(): HTMLCanvasElement {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255, 205, 120, 1)')
  g.addColorStop(0.15, 'rgba(255, 165, 40, 0.95)')
  g.addColorStop(0.35, 'rgba(230, 120, 10, 0.55)')
  g.addColorStop(0.6, 'rgba(160, 80, 10, 0.22)')
  g.addColorStop(1, 'rgba(120, 60, 10, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return c
}

export class ParticleEngine {
  private opts: ParticleOptions
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private sprite: HTMLCanvasElement | null = null
  private particles: Particle[] = []
  private raf = 0
  private timer = 0
  private watchdog = 0
  private lastFrame = 0
  private running = false

  private readonly onResize = () => {
    if (this.canvas !== null) {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight
    }
  }

  private readonly onVisibility = () => {
    if (document.hidden) this.pauseLoop()
    else if (this.running) this.resumeLoop()
  }

  constructor(opts: ParticleOptions) {
    this.opts = opts
  }

  isRunning(): boolean {
    return this.running
  }

  setOptions(opts: ParticleOptions): void {
    this.opts = opts
    if (this.running) {
      this.spawn()
      if (this.opts.count <= 0) this.stop()
    }
  }

  start(): void {
    if (this.running || this.opts.count <= 0) return
    if (reducedMotion()) return
    this.sprite ??= makeSprite()
    const canvas = document.createElement('canvas')
    canvas.id = 'hfb-particle-canvas'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.setAttribute(
      'style',
      `position:fixed;left:0;top:0;pointer-events:none;z-index:${this.opts.zIndex};`,
    )
    document.body.append(canvas)
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.spawn()
    this.running = true
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVisibility)
    if (!document.hidden) this.resumeLoop()
  }

  stop(): void {
    this.pauseLoop()
    this.running = false
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.canvas?.remove()
    this.canvas = null
    this.ctx = null
    this.particles = []
  }

  private resumeLoop(): void {
    if (this.raf !== 0 || this.timer !== 0) return
    const tick = () => {
      this.frame()
      this.lastFrame = performance.now()
    }
    // rAF loop with an occluded-view fallback: some embeds suspend rAF while
    // claiming visibility, so a watchdog switches to a 30fps interval instead.
    const rafLoop = () => {
      tick()
      this.raf = requestAnimationFrame(rafLoop)
    }
    this.raf = requestAnimationFrame(rafLoop)
    this.watchdog = window.setInterval(() => {
      if (!this.running || document.hidden) return
      if (performance.now() - this.lastFrame > 500 && this.timer === 0) {
        this.pauseLoop()
        this.timer = window.setInterval(tick, 33)
      }
    }, 500)
  }

  private pauseLoop(): void {
    if (this.raf !== 0) cancelAnimationFrame(this.raf)
    this.raf = 0
    if (this.timer !== 0) window.clearInterval(this.timer)
    this.timer = 0
    if (this.watchdog !== 0) window.clearInterval(this.watchdog)
    this.watchdog = 0
  }

  private spawn(): void {
    const list: Particle[] = []
    for (let i = 0; i < this.opts.count; i++) {
      // All particles rise in from below the screen (particle.ts:151).
      list.push({
        x: rand(0, window.innerWidth),
        y: window.innerHeight + rand(0, BOUNDARY_OFFSET),
        s: rand(SIZE.min, SIZE.max),
        r: rand(0, 6),
        a: rand(OPACITY.min, OPACITY.max),
        fx: rand(SPEED.horizontal.min, SPEED.horizontal.max),
        fy: -rand(SPEED.vertical.min, SPEED.vertical.max),
      })
    }
    this.particles = list
  }

  private frame(): void {
    const ctx = this.ctx
    if (ctx === null || this.canvas === null || this.sprite === null) return
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    const spin = this.opts.rotation ? SPEED.rotation * 0.1 : 0
    for (const p of this.particles) {
      p.x += p.fx
      p.y += p.fy
      p.r += spin
      p.a -= SPEED.fade * 0.01
      if (
        p.x > window.innerWidth ||
        p.x < 0 ||
        p.y > window.innerHeight + BOUNDARY_OFFSET ||
        p.y < -BOUNDARY_OFFSET ||
        p.a <= 0
      ) {
        this.reset(p)
      }
      const size = SPRITE_BASE * p.s
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.r)
      ctx.globalAlpha = Math.max(0, Math.min(1, p.a))
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  // 60% respawn from the bottom, 40% from the right edge (particle.ts:90-105).
  private reset(p: Particle): void {
    p.s = rand(SIZE.min, SIZE.max)
    p.r = rand(0, 6)
    p.a = rand(OPACITY.min, OPACITY.max)
    p.fx = rand(SPEED.horizontal.min, SPEED.horizontal.max)
    p.fy = -rand(SPEED.vertical.min, SPEED.vertical.max)
    if (Math.random() > 0.4) {
      p.x = rand(0, window.innerWidth)
      p.y = window.innerHeight + rand(0, BOUNDARY_OFFSET)
    } else {
      p.x = window.innerWidth
      p.y = rand(0, window.innerHeight)
    }
  }
}
