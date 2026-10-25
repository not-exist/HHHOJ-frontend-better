// P2c ambient-wallpaper（默认关闭）：body 直挂壁纸图层 + Ken Burns 轮播。
// 无自定义图片时用三段暮色渐变兜底；比赛进行中按设置自动隐藏。
import { onContestChange, contestState } from '../../core/bridge'
import { onSettings, settings } from '../../services/store'
import { onReady } from '../../services/dom'
import css from './wallpaper.css'

const INTERVAL_MS = 3600 // Twilight yaml:70
const FADE_MS = 1200 // VERY_SLOW, banner.css:111-113

// 暮色渐变兜底（不打包图片资产；自定义 URL 在设置面板填）。
const DEFAULT_SLIDES = [
  'linear-gradient(180deg, #1a2340 0%, #3d3a6e 45%, #b46a4e 78%, #e8a15c 100%)',
  'linear-gradient(180deg, #0f1b33 0%, #27356b 55%, #6d5a9e 85%, #c98ba8 100%)',
  'linear-gradient(180deg, #16213e 0%, #2c3e6b 40%, #7a4f7d 75%, #e0956d 100%)',
]

export default {
  id: 'ambient-wallpaper',
  title: '全屏壁纸',
  description: '暮色壁纸轮播（Ken Burns），卡片半透明；默认关闭',
  defaultOn: false,
  css,
  setup(): () => void {
    let layer: HTMLDivElement | null = null
    let timer: number | undefined
    let slides: HTMLDivElement[] = []
    let index = 0
    let urlsKey = ''

    const degraded = (): boolean => contestState() && settings().contestDegrade

    const show = (visible: boolean) => {
      if (layer !== null) layer.style.display = visible ? '' : 'none'
      if (visible) startTimer()
      else window.clearInterval(timer)
    }

    const sync = () => show(!degraded())

    const build = () => {
      if (layer !== null) layer.remove()
      layer = document.createElement('div')
      layer.id = 'hfb-wallpaper'
      const urls = settings().wallpaper.urls.filter((u) => u.trim() !== '')
      const backgrounds = urls.length > 0 ? urls : DEFAULT_SLIDES
      slides = backgrounds.map((bg) => {
        const el = document.createElement('div')
        el.className = 'hfb-wp-slide'
        el.style.background = bg.startsWith('http') ? `center / cover no-repeat url("${bg}")` : bg
        el.style.transitionDuration = `${FADE_MS}ms`
        layer!.append(el)
        return el
      })
      document.body.append(layer)
      index = 0
      slides[0]?.classList.add('active')
    }

    const next = () => {
      if (slides.length < 2) return
      const current = slides[index]
      index = (index + 1) % slides.length
      const upcoming = slides[index]
      current?.classList.remove('active')
      upcoming?.classList.add('active')
    }

    function startTimer(): void {
      window.clearInterval(timer)
      if (slides.length > 1) timer = window.setInterval(next, INTERVAL_MS)
    }

    onReady(() => {
      build()
      urlsKey = settings().wallpaper.urls.join('\n')
      document.documentElement.classList.add('hfb-wallpaper-on')
      sync()
    })

    const offSettings = onSettings(() => {
      // Rebuild only when the URL list changed; otherwise just sync visibility.
      const key = settings().wallpaper.urls.join('\n')
      if (key !== urlsKey) {
        urlsKey = key
        build()
        startTimer()
      }
      sync()
    })
    const offContest = onContestChange(sync)

    return () => {
      offSettings()
      offContest()
      window.clearInterval(timer)
      layer?.remove()
      layer = null
      slides = []
      document.documentElement.classList.remove('hfb-wallpaper-on')
    }
  },
}
