// modern-skin：现代皮肤层 —— 不再逐个适配 Bootstrap，而是整体替换视觉语言：
// 无框卡片+细描边、无边框表格、填充式输入、药丸徽章、分段/下划线标签页、
// 悬浮微抬升按钮、页面顶部主色氛围光。全部基于 theme-oklch 的变量，深浅自适应。
import css from './modern.css'

export default {
  id: 'modern-skin',
  title: '现代皮肤',
  description: '无边框卡片/填充式表单/现代表格与标签页，整体替换 Bootstrap 观感',
  defaultOn: true,
  css,
  setup(): () => void {
    document.documentElement.classList.add('hfb-modern')
    return () => document.documentElement.classList.remove('hfb-modern')
  },
}
