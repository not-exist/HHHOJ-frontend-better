import { realApi } from './real'
import { mockApi } from './mock'
import type { ApiClient } from './types'

const MOCK_KEY = 'toj.mock'

function detectMock(): boolean {
  if (import.meta.env.VITE_TOJ_MOCK === '1') return true
  const params = new URLSearchParams(location.search)
  if (params.get('__mock') === '1') {
    try {
      sessionStorage.setItem(MOCK_KEY, '1')
    } catch {
      /* ignore */
    }
    return true
  }
  if (params.get('__mock') === '0') {
    try {
      sessionStorage.removeItem(MOCK_KEY)
    } catch {
      /* ignore */
    }
    return false
  }
  try {
    if (sessionStorage.getItem(MOCK_KEY) === '1') return true
  } catch {
    /* ignore */
  }
  // 独立预览（Vite dev 直接打开 index.html）默认演示模式；接管层会先给 html 打上 data-twilight
  return import.meta.env.DEV && !document.documentElement?.hasAttribute('data-twilight')
}

export const isMock = detectMock()

export const api: ApiClient = isMock ? mockApi : realApi

export { ApiError, isAuthError } from './http'
export type {
  ApiClient,
  ContestDetailData,
  CreateSubmissionInput,
  RegisterInput,
  SessionUser,
  SubmissionListParams,
  SubmissionPage,
  SubmissionStatus,
  UserCard,
  UserProfileData,
} from './types'
