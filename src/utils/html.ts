import DOMPurify from 'dompurify'

/** 题面/博客 HTML 统一消毒；HHHOJ 的正文由管理员与博主撰写，仍按不可信内容处理 */
export function sanitizeFragment(html: string): DocumentFragment {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'class'],
    RETURN_DOM_FRAGMENT: true,
  }) as unknown as DocumentFragment
}
