import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, WifiOff } from 'lucide-react'
import { ApiError, api } from '@/lib/api'
import { clearSession, readSession, type AuthSession, type AuthUser } from '@/lib/auth'
import { routes } from '@/lib/routes'
import { Button } from '@/components/ui'

function isAuthRejection(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  // Validate the cached session against the backend before trusting it. A
  // localStorage object alone is not sufficient — the server must confirm the
  // token is still valid.
  const me = useQuery<AuthUser>({
    queryKey: ['auth-me'],
    queryFn: () => api<AuthUser>('/v1/auth/me'),
    enabled: Boolean(session),
    retry: 1,
  })

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

  // The server explicitly rejected the token (401/403, after the api client's
  // refresh attempt already failed) — drop the cached session and redirect.
  useEffect(() => {
    if (me.isError && isAuthRejection(me.error)) {
      clearSession()
    }
  }, [me.isError, me.error])

  if (!session) return null

  if (me.isLoading) return <SessionGateScreen kind="loading" />

  if (me.isError) {
    if (isAuthRejection(me.error)) return null
    return (
      <SessionGateScreen
        kind="offline"
        retrying={me.isFetching}
        onRetry={() => me.refetch()}
        onSignOut={() => {
          clearSession()
          navigate(routes.signIn, { replace: true })
        }}
      />
    )
  }

  return <>{children}</>
}

function SessionGateScreen({
  kind,
  retrying,
  onRetry,
  onSignOut,
}: {
  kind: 'loading' | 'offline'
  retrying?: boolean
  onRetry?: () => void
  onSignOut?: () => void
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(110%_75%_at_0%_0%,#1b1b20_0%,#0b0b0d_56%)] px-6 text-neutral-100">
      <div className="w-full max-w-sm rounded-[14px] border border-white/8 bg-[#101014]/80 p-8 text-center shadow-2xl shadow-black/20">
        {kind === 'loading' ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-300" />
        ) : (
          <WifiOff className="mx-auto h-8 w-8 text-amber-300" />
        )}
        <h1 className="mt-5 font-display text-[20px] font-semibold tracking-[-0.02em] text-white">
          {kind === 'loading' ? 'Preparing your workspace' : "Can't reach the server"}
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.55] text-neutral-400">
          {kind === 'loading'
            ? 'Verifying your session…'
            : 'We couldn’t connect to Autoshowroom. Check your connection and try again.'}
        </p>
        {kind === 'offline' && (
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={onRetry} disabled={retrying} className="w-full">
              {retrying ? 'Retrying…' : 'Try again'}
            </Button>
            <Button variant="secondary" onClick={onSignOut} className="w-full">
              Sign out
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
