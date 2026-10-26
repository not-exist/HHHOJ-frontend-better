import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import './i18n'
import tokensCss from './styles/tokens.css?inline'
import baseCss from './styles/base.css?inline'
import componentsCss from './styles/components.css?inline'
import pagesCss from './styles/pages.css?inline'
import animationsCss from './styles/animations.css?inline'

export const TWILIGHT_CSS = [tokensCss, baseCss, componentsCss, pagesCss, animationsCss].join('\n')

const STYLE_ATTR = 'data-twilight-style'

/** 把样式挂成带标记的 <style>，接管层据此保留自己的样式、清掉原站的样式 */
export function injectTwilightStyles(): void {
  if (document.querySelector(`style[${STYLE_ATTR}="full"]`)) return
  const style = document.createElement('style')
  style.setAttribute(STYLE_ATTR, 'full')
  style.textContent = TWILIGHT_CSS
  ;(document.head ?? document.documentElement).appendChild(style)
}

export function renderTwilightApp(container: HTMLElement): Root {
  injectTwilightStyles()
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
  return root
}
