import katex from 'katex'

const PATTERN = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]*?\$|\\\([\s\S]*?\\\))/g

interface MathPiece {
  tex: string
  display: boolean
}

function parsePiece(piece: string): MathPiece | null {
  if (piece.startsWith('$$') && piece.endsWith('$$') && piece.length > 4) {
    return { tex: piece.slice(2, -2), display: true }
  }
  if (piece.startsWith('\\[') && piece.endsWith('\\]')) {
    return { tex: piece.slice(2, -2), display: true }
  }
  if (piece.startsWith('\\(') && piece.endsWith('\\)')) {
    return { tex: piece.slice(2, -2), display: false }
  }
  if (piece.startsWith('$') && piece.endsWith('$') && piece.length > 2) {
    return { tex: piece.slice(1, -1), display: false }
  }
  return null
}

/** 用 KaTeX 的 MathML 输出渲染 $...$ / $$...$$ / \(...\) / \[...\]，不依赖 KaTeX 字体与 CSS */
export function renderMath(root: ParentNode): void {
  const doc = (root as Node).ownerDocument ?? document
  const walker = doc.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest('pre, code, script, style, math, .katex')) return NodeFilter.FILTER_REJECT
      const text = node.nodeValue ?? ''
      if (!text.includes('$') && !text.includes('\\(') && !text.includes('\\[')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)

  for (const node of nodes) {
    const text = node.nodeValue ?? ''
    PATTERN.lastIndex = 0
    if (!PATTERN.test(text)) continue
    PATTERN.lastIndex = 0
    const pieces = text.split(PATTERN)
    const fragment = doc.createDocumentFragment()
    for (const piece of pieces) {
      if (!piece) continue
      const math = parsePiece(piece)
      if (!math) {
        fragment.appendChild(doc.createTextNode(piece))
        continue
      }
      let html: string
      try {
        html = katex.renderToString(math.tex, {
          output: 'mathml',
          displayMode: math.display,
          throwOnError: false,
          strict: false,
          trust: false,
        })
      } catch {
        fragment.appendChild(doc.createTextNode(piece))
        continue
      }
      const parsed = new DOMParser().parseFromString(html, 'text/html')
      for (const child of Array.from(parsed.body.childNodes)) {
        fragment.appendChild(doc.importNode(child, true))
      }
    }
    node.replaceWith(fragment)
  }
}
