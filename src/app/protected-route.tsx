import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { readSession, type AuthSession } from '@/lib/auth'
import { routes } from '@/lib/routes'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  useEffect(() => {
    const refresh = () => setSession(readSession())
    window.addEventListener('dealer-session-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('dealer-session-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (!session) navigate(routes.signIn, { replace: true })
  }, [navigate, session])

  if (!session) return null
  return <>{children}</>
}
