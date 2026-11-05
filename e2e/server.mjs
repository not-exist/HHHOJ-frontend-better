import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Minimal stand-in for the HHHOJ shell. Every non-/api GET returns the fixture
 * document so the takeover's root suppression and the native fallback are both
 * observable. Any /api request without a Playwright route stub fails loudly
 * instead of silently reaching a real backend.
 */

const PORT = Number(process.env.PORT ?? 18080)
const HOST = process.env.HOST ?? '127.0.0.1'

const here = path.dirname(fileURLToPath(import.meta.url))
const site = readFileSync(path.join(here, 'fixtures', 'site.html'), 'utf8')

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    sendJson(res, 501, { success: false, code: 'test.no_api', message: 'stubbed' })
    return
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { success: false, code: 'test.method_not_allowed', message: req.method })
    return
  }

  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(req.method === 'HEAD' ? undefined : site)
})

server.listen(PORT, HOST, () => {
  console.log(`[e2e] fixture server listening on http://${HOST}:${PORT}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)))
}
