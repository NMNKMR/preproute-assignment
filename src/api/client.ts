import axios, { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { API_BASE_URL } from '@/lib/env'
import { clearAuth, getToken } from '@/features/auth/storage'
import type { ApiEnvelope } from './types'

/** Error thrown for any non-success response, carrying a user-presentable message. */
export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every request when present.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401 an existing session is dead — clear it and bounce to login. The login
// request itself returning 401 just means bad credentials, so skip it there.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const isLoginCall = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginCall) {
      clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(toApiError(error))
  },
)

function toApiError(error: AxiosError<ApiEnvelope<unknown>>): ApiError {
  const serverMessage = error.response?.data?.message
  const message =
    serverMessage ||
    error.message ||
    'Something went wrong. Please try again.'
  return new ApiError(message, error.response?.status)
}

/**
 * Unwrap the `{ status, message, data }` envelope, throwing ApiError when the
 * server reports `status: "error"` even on a 200 response.
 */
export async function unwrap<T>(
  promise: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  const res = await promise
  const body = res.data
  if (!body || body.status !== 'success') {
    throw new ApiError(body?.message || 'Request failed', res.status)
  }
  return body.data
}
