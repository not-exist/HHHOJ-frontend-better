// 隐藏 HHHOJ 站点品牌图标：页首 h1 的小 logo（MainLayout.tsx:169，两种布局共用）
// 与首页公告卡内的大 logo（Index.tsx:72）。大 logo 所在栅格列一并收起，
// 公告表格占满整行。功能性图片（头像/FAQ 表情/判题状态 gif）不受影响。
import css from './branding.css'

export default {
  id: 'clean-branding',
  title: '隐藏站点 Logo',
  description: '页首小图标与首页大图标',
  defaultOn: true,
  css,
  setup(): () => void {
    document.documentElement.classList.add('hfb-nobrand')
    return () => document.documentElement.classList.remove('hfb-nobrand')
  },
}
