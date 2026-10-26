import { useEffect, useRef } from 'react'
import { sanitizeFragment } from '@/utils/html'
import { renderMath } from '@/utils/math'

/** 富文本容器：DOMPurify 返回消毒后的 DocumentFragment，直接替换子节点 */
export default function SafeHtml({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.replaceChildren(sanitizeFragment(html))
    renderMath(ref.current)
  }, [html])
  return <div ref={ref} className={className} />
}
