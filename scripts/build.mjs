// Builds the userscript: bundle src/main.ts to a single dist/*.user.js with the
// userscript header prepended. CSS files are imported as text (esbuild loader)
// and injected at runtime, so nothing depends on the site's stylesheets.
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const watch = process.argv.includes('--watch')

// Production site matches are appended here when the deployment URL is known.
const MATCHES = [
  'http://127.0.0.1:18080/*',
  'http://localhost:18080/*',
]

const header = `// ==UserScript==
// @name         HHHOJ Frontend Better
// @namespace    https://github.com/Quzhou-No-2-School/HHHOJ
// @version      ${pkg.version}
// @description  Twilight 风格的 HHHOJ 前端增强：OKLCH 主题（暗色模式）、毛玻璃材质、金萤粒子、入场动效。设置面板在右下角。
// @author       HHHOJ Frontend Better
${MATCHES.map((m) => `// @match        ${m}`).join('\n')}
// @run-at       document-start
// @noframes
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==`

const ctx = await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome116'],
  minify: true,
  legalComments: 'none',
  sourcemap: false,
  loader: { '.css': 'text' },
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: { js: header },
  outfile: 'dist/hhhoj-frontend-better.user.js',
  logLevel: 'info',
})

if (watch) await ctx.watch()
