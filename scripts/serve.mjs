// Tiny static server for dist/, used to load the built script into a browser
// during development (e.g. injecting a <script src> into the local HHHOJ).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const dir = join(process.cwd(), 'dist')
const port = Number(process.env.PORT ?? 5177)

const TYPES = { '.js': 'application/javascript', '.user.js': 'application/javascript' }

createServer(async (req, res) => {
  const name = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
  try {
    const body = await readFile(join(dir, name))
    res.writeHead(200, {
      'content-type': TYPES[extname(name)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end('not found')
  }
}).listen(port, '127.0.0.1', () => console.log(`serving dist/ at http://127.0.0.1:${port}/`))
