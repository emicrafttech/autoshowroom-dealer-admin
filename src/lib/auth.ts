export type AuthUser = {
  id: string
  dealerId: string
  email: string
  name: string
  role: 'owner' | 'manager' | 'sales'
  mustChangePassword: boolean
  emailVerified?: boolean
  emailVerifiedAt?: string | null
  emailVerificationSentAt?: string | null
  emailVerificationRequiredAt?: string | null
  locationId: string | null
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

const SESSION_KEY = 'autoshowroom.dealer.session'

export function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function writeSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('dealer-session-changed'))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('dealer-session-changed'))
}

export function getAccessToken() {
  return readSession()?.accessToken
}
