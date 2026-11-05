import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'
import { fileURLToPath, URL } from 'node:url'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

const LOCAL_MATCHES = ['http://127.0.0.1:18080/*', 'http://localhost:18080/*']

/** 篡改猴识别脚本的身份，发布后不可再改 */
const REPO_URL = 'https://github.com/not-exist/HHHOJ-frontend-better'
/** GitHub Releases 的 latest/download 永久指向最新一次正式发布 */
const UPDATE_BASE = `${REPO_URL}/releases/latest/download`

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/userscript.ts',
      userscript: {
        name: 'HHHOJ Twilight Takeover',
        namespace: REPO_URL,
        version: pkg.version,
        description: '以 TwilightOJ 界面完整接管 HHHOJ；未接管路由自动回退原站。',
        author: 'HHHOJ',
        // 检查更新只拉几百字节的 .meta.js，确认有新版本后才下载完整脚本
        updateURL: `${UPDATE_BASE}/hhhoj-twilight.meta.js`,
        downloadURL: `${UPDATE_BASE}/hhhoj-twilight.user.js`,
        match: [...LOCAL_MATCHES, 'https://hhhoj.example.com/*'],
        'run-at': 'document-start',
        noframes: true,
        grant: ['unsafeWindow', 'GM_getValue', 'GM_setValue', 'GM_registerMenuCommand'],
      },
      build: {
        fileName: 'hhhoj-twilight.user.js',
        metaFileName: 'hhhoj-twilight.meta.js',
        autoGrant: false,
        // React/CodeMirror 必须等 DOM 就绪后再求值；inline systemjs 让动态 import 真正延迟
        systemjs: 'inline',
      },
      server: {
        open: false,
        prefix: 'dev:',
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // The userscript must stay a single file.
        manualChunks: undefined,
      },
    },
  },
})
