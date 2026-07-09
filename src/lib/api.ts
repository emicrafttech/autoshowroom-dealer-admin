import { clearSession, getAccessToken, readSession, writeSession, type AuthSession } from './auth'

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE_URL = (rawApiBaseUrl || 'http://localhost:8003').replace(/\/$/, '')

export type ApiEnvelope<T> = {
  data?: T
  error?: unknown
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

function unwrapError(error: unknown): string {
  if (typeof error === 'string') return error
  if (Array.isArray(error)) {
    return error.map(unwrapError).filter(Boolean).join(' ')
  }
  if (error && typeof error === 'object') {
    if ('detail' in error && typeof error.detail === 'string') return error.detail
    if ('details' in error && error.details) {
      const detailsMessage = unwrapError(error.details)
      if (detailsMessage !== 'Request failed') return detailsMessage
    }
    if ('nonFieldErrors' in error) return unwrapError(error.nonFieldErrors)
    if ('non_field_errors' in error) return unwrapError(error.non_field_errors)
    if ('message' in error && typeof error.message === 'string') return error.message
    return Object.values(error)
      .map(unwrapError)
      .filter((message) => message && message !== 'Request failed')
      .join(' ')
  }
  return 'Request failed'
}

async function refreshSession() {
  const session = readSession()
  if (!session?.refreshToken) return null
  const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })
  if (!response.ok) {
    clearSession()
    return null
  }
  const envelope = await parseResponse<Omit<AuthSession, 'user'>>(response)
  if (!envelope.data) return null
  const nextSession = { ...session, ...envelope.data }
  writeSession(nextSession)
  return nextSession.accessToken
}

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text()
  if (!text) return {}

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const isHtml = text.trimStart().startsWith('<')
    throw new ApiError(
      isHtml
        ? `API returned HTML instead of JSON. Check that the backend is running at ${API_BASE_URL}.`
        : text,
      response.status,
      text,
    )
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>
  } catch {
    throw new ApiError('API returned an invalid JSON response.', response.status, text)
  }
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && retry) {
    const refreshedToken = await refreshSession()
    if (refreshedToken) {
      return api<T>(path, options, false)
    }
  }

  const envelope = await parseResponse<T>(response)

  if (!response.ok) {
    throw new ApiError(unwrapError(envelope.error), response.status, envelope.error)
  }
  return envelope.data as T
}

export async function apiBlob(path: string, options: RequestInit = {}, retry = true): Promise<Blob> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && retry) {
    const refreshedToken = await refreshSession()
    if (refreshedToken) {
      return apiBlob(path, options, false)
    }
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const envelope = await parseResponse<unknown>(response)
      throw new ApiError(unwrapError(envelope.error), response.status, envelope.error)
    }
    throw new ApiError(await response.text(), response.status, null)
  }

  return response.blob()
}

export function post<T>(path: string, body?: unknown) {
  return api<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function patch<T>(path: string, body: unknown) {
  return api<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function del(path: string) {
  return api<void>(path, { method: 'DELETE' })
}
