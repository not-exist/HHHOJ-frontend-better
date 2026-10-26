import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import monkey from 'vite-plugin-monkey'
import { fileURLToPath, URL } from 'node:url'

const LOCAL_MATCHES = ['http://127.0.0.1:18080/*', 'http://localhost:18080/*']

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: 'src/userscript.ts',
      userscript: {
        name: 'HHHOJ Twilight Takeover',
        namespace: 'https://github.com/hhhoj/twilight-takeover',
        version: '1.0.0',
        description: '以 TwilightOJ 界面完整接管 HHHOJ；未接管路由自动回退原站。',
        author: 'HHHOJ',
        match: [...LOCAL_MATCHES, 'https://hhhoj.example.com/*'],
        'run-at': 'document-start',
        noframes: true,
        grant: ['unsafeWindow', 'GM_getValue', 'GM_setValue', 'GM_registerMenuCommand'],
      },
      build: {
        fileName: 'hhhoj-twilight.user.js',
        metaFileName: false,
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
