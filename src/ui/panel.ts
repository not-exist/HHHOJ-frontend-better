// P4 设置面板：body 直挂 Shadow DOM 容器（不进 React 的 #root）。
// CSS 自定义属性（--hue 等）从 <html> 穿透 shadow 边界继承，主题色自动联动。
import { resetSettings, settings, update, type RadiusLevel, type Settings, type ThemeMode } from '../services/store'
import { onReady } from '../services/dom'
import { copyText } from '../services/gm'
import { FEATURES, isEnabled, setEnabled } from '../features'
import css from './panel.css'

type Elem = HTMLElement

function h(tag: string, attrs: Record<string, string | (() => void)> = {}, ...children: (Node | string | null)[]): Elem {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value as EventListener)
    } else if (typeof value === 'string') {
      if (key === 'value' || key === 'checked' || key === 'selected') (el as unknown as Record<string, string>)[key] = value
      else el.setAttribute(key, value)
    }
  }
  for (const child of children) {
    if (child === null) continue
    el.append(child instanceof Node ? child : document.createTextNode(child))
  }
  return el
}

let shadow: ShadowRoot | null = null
let panel: HTMLElement | null = null
let toastBox: HTMLElement | null = null

function toast(text: string): void {
  if (toastBox === null) return
  toastBox.textContent = text
  toastBox.classList.add('show')
  window.setTimeout(() => toastBox?.classList.remove('show'), 1800)
}

function sectionTitle(text: string): Elem {
  return h('div', { class: 'hfb-sec' }, text)
}

function row(label: string, control: Elem, hint?: string): Elem {
  return h('div', { class: 'hfb-row' },
    h('div', { class: 'hfb-label' }, label, hint ? h('div', { class: 'hfb-hint' }, hint) : null),
    control,
  )
}

function switchControl(checked: boolean, onToggle: (v: boolean) => void): Elem {
  const input = h('input', { type: 'checkbox', class: 'hfb-switch' }) as HTMLInputElement
  input.checked = checked
  input.addEventListener('change', () => onToggle(input.checked))
  return input
}

// Segmented buttons that self-update their active state on click — a panel
// re-render would break the hue slider mid-drag.
function seg(options: { label: string; active: boolean; run: () => void }[]): Elem {
  const box = h('div', { class: 'hfb-seg' })
  const buttons = options.map((o) => {
    const btn = h('button', { class: 'hfb-seg-btn' + (o.active ? ' active' : '') }, o.label)
    btn.addEventListener('click', () => {
      o.run()
      for (const b of buttons) b.classList.toggle('active', b === btn)
    })
    return btn
  })
  box.append(...buttons)
  return box
}

function modeButtons(current: ThemeMode): Elem {
  return seg([
    { label: '系统', active: current === 'system', run: () => update((s) => { s.theme.mode = 'system' }) },
    { label: '浅色', active: current === 'light', run: () => update((s) => { s.theme.mode = 'light' }) },
    { label: '深色', active: current === 'dark', run: () => update((s) => { s.theme.mode = 'dark' }) },
  ])
}

function fontSizeButtons(size: number): Elem {
  return seg(
    [13, 14, 15, 16].map((px) => ({
      label: `${px}`,
      active: size === px,
      run: () => update((s) => { s.appearance.fontSize = px }),
    })),
  )
}

function radiusButtons(radius: RadiusLevel): Elem {
  return seg([
    { label: '无', active: radius === 'none', run: () => update((s) => { s.appearance.radius = 'none' }) },
    { label: '小', active: radius === 'small', run: () => update((s) => { s.appearance.radius = 'small' }) },
    { label: '标准', active: radius === 'large', run: () => update((s) => { s.appearance.radius = 'large' }) },
  ])
}

function hueSlider(hue: number): Elem {
  const input = h('input', { type: 'range', class: 'hfb-hue', min: '0', max: '360', step: '1' }) as HTMLInputElement
  input.value = String(hue)
  input.addEventListener('input', () => update((s) => { s.theme.hue = Number(input.value) }))
  return input
}

function countSlider(count: number): Elem {
  const input = h('input', { type: 'range', class: 'hfb-range', min: '0', max: '40', step: '1' }) as HTMLInputElement
  const label = h('span', { class: 'hfb-num' }, String(count))
  input.value = String(count)
  input.addEventListener('input', () => {
    label.textContent = input.value
    update((s) => { s.particles.count = Number(input.value) })
  })
  return h('div', { class: 'hfb-inline' }, input, label)
}

function wallpaperArea(urls: string[]): Elem {
  const area = h('textarea', {
    class: 'hfb-area',
    rows: '2',
    placeholder: '壁纸图片 URL，每行一个；留空使用内置暮色渐变',
  }) as HTMLTextAreaElement
  area.value = urls.join('\n')
  area.addEventListener('change', () => {
    const list = area.value.split('\n').map((u) => u.trim()).filter((u) => u !== '')
    update((s) => { s.wallpaper.urls = list })
  })
  return area
}

function buildBody(): Elem {
  const s = settings()
  const body = h('div')

  body.append(sectionTitle('主题'))
  body.append(row('明暗模式', modeButtons(s.theme.mode)))
  body.append(row('色相', hueSlider(s.theme.hue), '全部颜色由这一个色相派生'))

  body.append(sectionTitle('外观'))
  body.append(row('字号', fontSizeButtons(s.appearance.fontSize), '单位 px，作用于全站'))
  body.append(row('圆角', radiusButtons(s.appearance.radius)))

  body.append(sectionTitle('功能'))
  for (const f of FEATURES) {
    body.append(row(f.title, switchControl(isEnabled(f.id), (v) => setEnabled(f.id, v)), f.description))
  }

  body.append(sectionTitle('氛围'))
  body.append(row('粒子数量', countSlider(s.particles.count)))
  body.append(row('比赛时自动暂停', switchControl(s.contestDegrade, (v) => update((d) => { d.contestDegrade = v })), '检测到进行中的比赛时停用粒子与壁纸'))
  body.append(row('壁纸图片', wallpaperArea(s.wallpaper.urls)))

  body.append(sectionTitle('设置'))
  const actions = h('div', { class: 'hfb-actions' },
    h('button', {
      class: 'hfb-btn',
      onclick: () => {
        copyText(JSON.stringify(settings(), null, 2))
        toast('设置已复制到剪贴板')
      },
    }, '导出'),
    h('button', {
      class: 'hfb-btn',
      onclick: () => {
        const text = window.prompt('粘贴导出的设置 JSON')
        if (text === null) return
        try {
          const parsed = JSON.parse(text) as Settings
          update((d) => Object.assign(d, parsed))
          renderPanel()
          toast('已导入')
        } catch {
          toast('JSON 解析失败')
        }
      },
    }, '导入'),
    h('button', {
      class: 'hfb-btn',
      onclick: () => {
        if (window.confirm('恢复全部默认设置？')) {
          resetSettings()
          renderPanel()
          toast('已恢复默认')
        }
      },
    }, '重置'),
  )
  body.append(actions)
  body.append(h('div', { class: 'hfb-version' }, `HHHOJ Frontend Better v${__VERSION__}`))
  return body
}

function renderPanel(): void {
  if (panel === null) return
  panel.replaceChildren(buildBody())
}

function togglePanel(open?: boolean): void {
  if (panel === null) return
  const willOpen = open ?? panel.hidden
  panel.hidden = !willOpen
  if (willOpen) renderPanel()
}

export function initUI(): void {
  onReady(() => {
    const host = document.createElement('div')
    host.id = 'hfb-ui'
    shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = css
    shadow.append(style)

    const fab = h('button', { class: 'hfb-fab', title: 'HHHOJ Frontend Better 设置', onclick: () => togglePanel() }, '✦')
    panel = h('div', { class: 'hfb-panel' })
    panel.hidden = true
    toastBox = h('div', { class: 'hfb-toast' })
    shadow.append(fab, panel, toastBox)
    document.body.append(host)

    shadow.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Escape') togglePanel(false)
    })

    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('HHHOJ Frontend Better 设置', () => togglePanel(true))
    }
  })
}
