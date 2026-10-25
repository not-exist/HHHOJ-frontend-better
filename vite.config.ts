import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          codemirror: [
            '@uiw/react-codemirror',
            '@uiw/codemirror-themes',
            '@codemirror/lang-cpp',
            '@codemirror/lang-java',
            '@codemirror/lang-python',
            '@codemirror/state',
            '@codemirror/view',
            '@lezer/highlight',
          ],
          charts: ['recharts'],
        },
      },
    },
  },
})
