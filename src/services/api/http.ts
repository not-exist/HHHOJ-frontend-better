/** HHHOJ /api 的极简客户端：统一信封、错误对象与查询串 */

export class ApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message || code)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

type Query = Record<string, string | number | boolean | null | undefined>

type Envelope = { success?: boolean; code?: string; message?: string } | null

async function parse<T>(res: Response): Promise<T> {
  let body: Envelope
  try {
    body = (await res.json()) as Envelope
  } catch {
    throw new ApiError('server.bad_response', res.statusText || '服务器返回了无法解析的响应', res.status)
  }
  if (body?.success !== true) {
    throw new ApiError(body?.code ?? 'server.error', body?.message ?? res.statusText, res.status)
  }
  return body as T
}

function urlOf(path: string, query?: Query): string {
  if (!query) return path
  const pairs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  return pairs.length ? `${path}?${pairs.join('&')}` : path
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, { credentials: 'same-origin', ...init })
  } catch (error) {
    throw new ApiError('server.unreachable', String(error), 0)
  }
  return parse<T>(res)
}

export function get<T>(path: string, query?: Query): Promise<T> {
  return request<T>(urlOf(path, query), { headers: { Accept: 'application/json' } })
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
}

export function postForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: 'POST', body: form, headers: { Accept: 'application/json' } })
}

/** HHHOJ 的时间文本按 Asia/Shanghai 理解，转成本地 epoch ms */
export function timeValue(text: string | null | undefined): number {
  if (!text) return 0
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized)
  const ms = Date.parse(hasZone ? normalized : `${normalized}+08:00`)
  return Number.isFinite(ms) ? ms : 0
}
