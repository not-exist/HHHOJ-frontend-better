// P1 material-glass: 1rem 大圆角 + semifull 动态透明导航栏。
// 滚动状态类加在 <html> 上（React 拥有 .navbar 元素的 className，不能碰）。
import css from './glass.css'

const SCROLL_THRESHOLD = 50 // Twilight navbar.astro:78

export default {
  id: 'material-glass',
  title: '毛玻璃材质与大圆角',
  description: '大圆角卡片、滚动后导航栏毛玻璃悬浮',
  defaultOn: true,
  css,
  setup(): () => void {
    const html = document.documentElement
    html.classList.add('hfb-glass')
    // Scroll events already arrive at most once per frame; toggle synchronously
    // (no rAF) so occluded views with suspended rAF still track scroll.
    const onScroll = () => {
      html.classList.toggle('hfb-scrolled', window.scrollY > SCROLL_THRESHOLD)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      html.classList.remove('hfb-glass', 'hfb-scrolled')
    }
  },
}
