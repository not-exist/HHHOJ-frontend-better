import { describe, it, expect, vi, afterEach } from 'vitest'
import { ApiError, get, post, isAuthError, timeValue } from './http'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubResponse(body: unknown, init: ResponseInit = {}) {
  const response = new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    { status: 200, ...init, headers: { 'Content-Type': 'application/json' } },
  )
  const fetchMock = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('timeValue', () => {
  it('parses bare HHHOJ timestamps as Asia/Shanghai (+08:00)', () => {
    expect(timeValue('2024-01-02 03:04:05')).toBe(Date.UTC(2024, 0, 1, 19, 4, 5))
  })

  it('honours an explicit Z zone', () => {
    expect(timeValue('2024-01-02T03:04:05Z')).toBe(Date.UTC(2024, 0, 2, 3, 4, 5))
  })

  it('honours an explicit numeric offset', () => {
    expect(timeValue('2024-01-02T03:04:05+02:00')).toBe(Date.UTC(2024, 0, 2, 1, 4, 5))
    expect(timeValue('2024-01-02T03:04:05+0800')).toBe(Date.UTC(2024, 0, 1, 19, 4, 5))
  })

  it('returns 0 for empty or unparseable input', () => {
    expect(timeValue(null)).toBe(0)
    expect(timeValue(undefined)).toBe(0)
    expect(timeValue('')).toBe(0)
    expect(timeValue('garbage')).toBe(0)
  })
})

describe('get', () => {
  it('builds an encoded query string and drops empty values', async () => {
    const fetchMock = stubResponse({ success: true, ok: 1 })

    await get('/api/thing', {
      a: 'hello world',
      b: 2,
      c: true,
      empty: '',
      nothing: null,
      missing: undefined,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/thing?a=hello%20world&b=2&c=true')
    expect(init.headers).toEqual({ Accept: 'application/json' })
  })

  it('omits the query string entirely when every value is empty', async () => {
    const fetchMock = stubResponse({ success: true })

    await get('/api/thing', { a: null, b: undefined, c: '' })

    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toBe('/api/thing')
  })

  it('resolves to the whole success envelope', async () => {
    stubResponse({ success: true, items: [1, 2], total: 2 })

    await expect(get('/api/thing')).resolves.toEqual({ success: true, items: [1, 2], total: 2 })
  })

  it('rejects a failure envelope with ApiError carrying code/message/status', async () => {
    stubResponse(
      { success: false, code: 'auth.required', message: '请先登录' },
      { status: 401, statusText: 'Unauthorized' },
    )

    const error = await get('/api/thing').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    const apiError = error as ApiError
    expect(apiError.code).toBe('auth.required')
    expect(apiError.message).toBe('请先登录')
    expect(apiError.status).toBe(401)
  })

  it('falls back to server.error and statusText for a bare failure envelope', async () => {
    stubResponse({ success: false }, { status: 500, statusText: 'Server Error' })

    const error = (await get('/api/thing').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('server.error')
    expect(error.message).toBe('Server Error')
    expect(error.status).toBe(500)
  })

  it('rejects non-JSON responses as server.bad_response', async () => {
    stubResponse('<html>not json</html>', { status: 502, statusText: 'Bad Gateway' })

    const error = (await get('/api/thing').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('server.bad_response')
    expect(error.message).toBe('Bad Gateway')
    expect(error.status).toBe(502)
  })

  it('rejects a network failure as server.unreachable with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down')
    }))

    const error = (await get('/api/thing').catch((e: unknown) => e)) as ApiError
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('server.unreachable')
    expect(error.message).toBe('Error: network down')
    expect(error.status).toBe(0)
  })
})

describe('post', () => {
  it('sends a JSON body with the right method and headers', async () => {
    const fetchMock = stubResponse({ success: true, submission_id: 7 })

    await expect(post('/api/problems/1/submissions', { answer: 'code' })).resolves.toEqual({
      success: true,
      submission_id: 7,
    })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/problems/1/submissions')
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })
    expect(JSON.parse(init.body as string)).toEqual({ answer: 'code' })
  })

  it('defaults the body to an empty object', async () => {
    const fetchMock = stubResponse({ success: true })

    await post('/api/auth/logout')

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.body).toBe('{}')
  })
})

describe('isAuthError', () => {
  it('is true only for ApiError with status 401', () => {
    expect(isAuthError(new ApiError('auth.required', 'nope', 401))).toBe(true)
    expect(isAuthError(new ApiError('forbidden', 'nope', 403))).toBe(false)
    expect(isAuthError(new Error('nope'))).toBe(false)
    expect(isAuthError(null)).toBe(false)
  })
})
