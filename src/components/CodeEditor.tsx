import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { createTheme } from '@uiw/codemirror-themes'
import { tags as t } from '@lezer/highlight'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { useTheme } from '@/context/ThemeContext'

const EXT_BY_LANG: Record<string, ReturnType<typeof cpp>> = {
  'C++20': cpp(),
  'C++17': cpp(),
  C: cpp(),
  Java: java(),
  'Python 3': python(),
}

/** 随主题色相变化的 CodeMirror 主题（Twilight 特色） */
function useHueEditorTheme() {
  const { hue, mode } = useTheme()
  return useMemo(() => {
    const dark = mode === 'dark'
    const l = (s: number, li: number, a = 1) => `hsl(${hue} ${s}% ${li}% / ${a})`
    return createTheme({
      theme: dark ? 'dark' : 'light',
      settings: {
        background: 'transparent',
        foreground: dark ? l(30, 90) : l(35, 18),
        caret: `hsl(${hue} 85% 70%)`,
        selection: l(80, 66, 0.22),
        selectionMatch: l(80, 66, 0.14),
        lineHighlight: l(60, 70, 0.08),
        gutterBackground: 'transparent',
        gutterForeground: dark ? l(14, 50) : l(12, 55),
        gutterBorder: 'transparent',
      },
      styles: [
        { tag: t.comment, color: dark ? l(12, 52) : l(12, 50), fontStyle: 'italic' },
        { tag: [t.keyword, t.moduleKeyword], color: `hsl(${hue} 82% ${dark ? 74 : 50}%)`, fontWeight: '600' },
        { tag: [t.string, t.special(t.string)], color: `hsl(152 55% ${dark ? 64 : 36}%)` },
        { tag: [t.number, t.bool, t.null], color: `hsl(36 90% ${dark ? 64 : 40}%)` },
        { tag: [t.function(t.variableName), t.function(t.propertyName)], color: `hsl(${(hue + 60) % 360} 75% ${dark ? 72 : 46}%)` },
        { tag: [t.typeName, t.className], color: `hsl(${(hue + 120) % 360} 70% ${dark ? 70 : 42}%)` },
        { tag: t.operator, color: `hsl(${(hue + 40) % 360} 70% ${dark ? 76 : 48}%)` },
        { tag: t.variableName, color: dark ? l(30, 90) : l(35, 18) },
        { tag: t.propertyName, color: dark ? l(25, 84) : l(35, 24) },
      ],
    })
  }, [hue, mode])
}

export default function CodeEditor({
  value,
  onChange,
  language,
  height = '20rem',
}: {
  value: string
  onChange?: (v: string) => void
  language: string
  height?: string
}) {
  const theme = useHueEditorTheme()
  const ext = useMemo(() => {
    const lang = EXT_BY_LANG[language]
    return [lang ?? cpp(), EditorView.lineWrapping].flat()
  }, [language])
  return (
    <div className="editor-shell">
      <CodeMirror
        value={value}
        height={height}
        theme={theme}
        extensions={ext}
        onChange={onChange}
        basicSetup={{ foldGutter: false, highlightActiveLineGutter: false, autocompletion: false }}
      />
    </div>
  )
}
