// P2b motion-entrance: 路由内容入场动画（默认开启）。
// React 只在换页时 remount .uoj-content 的子元素，动画自然只在导航时播一次，
// re-render 不会重播。backwards 填充模式保证 CSS 失效/禁用时内容照常可见。
import css from './entrance.css'

export default {
  id: 'motion-entrance',
  title: '页面入场动画',
  description: '换页时内容五级渐进浮现（fade-in-up 600ms）',
  defaultOn: true,
  css,
  setup(): () => void {
    document.documentElement.classList.add('hfb-motion')
    return () => document.documentElement.classList.remove('hfb-motion')
  },
}
