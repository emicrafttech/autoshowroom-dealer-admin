import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AppHeader } from '@/app/components/app-header'
import { OnboardingModals } from '@/app/components/onboarding-modals'
import { Sidebar } from '@/app/components/sidebar'
import { Button } from '@/components/ui'
import { api, post } from '@/lib/api'
import { readSession, writeSession, type AuthUser } from '@/lib/auth'
import { routes } from '@/lib/routes'

type DealerProfile = {
  name: string
  operationalStatus?: string
  suspendedReason?: string
  locations: Array<{ name: string }>
}

type EmailVerificationResponse = {
  user: AuthUser
  sent: boolean
}

function SuspendedWorkspaceRecovery({
  email,
  emailVerified,
  reason,
}: {
  email: string
  emailVerified: boolean
  reason?: string
}) {
  const sendVerification = useMutation({
    mutationFn: () => post<EmailVerificationResponse>('/v1/auth/email-verification/send', {}),
    onSuccess: (response) => {
      const current = readSession()
      if (current) {
        writeSession({ ...current, user: { ...current.user, ...response.user } })
      }
      toast.success(response.sent ? 'Verification email sent' : 'Email already verified')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to send verification email')
    },
  })

  return (
    <section className="mx-auto max-w-xl rounded-[20px] border border-red-300/20 bg-red-400/10 p-6 shadow-2xl shadow-black/20">
      <div className="text-[12px] font-[900!important] uppercase tracking-[0.14em] text-red-200">Account suspended</div>
      <h1 className="mt-3 font-display text-[28px] font-semibold tracking-[-0.03em] text-white">Reactivate your dealer workspace</h1>
      <p className="mt-3 text-[14px] font-medium leading-6 text-red-100/80">
        {reason || 'Your dealership is currently suspended.'}
      </p>
      {!emailVerified ? (
        <>
          <p className="mt-4 text-[13px] font-medium leading-6 text-neutral-300">
            Resend the verification email to <span className="font-bold text-white">{email}</span>, then follow its link to restore access.
          </p>
          <Button
            className="mt-5 w-full"
            disabled={sendVerification.isPending}
            type="button"
            onClick={() => sendVerification.mutate()}
          >
            {sendVerification.isPending ? 'Sending...' : 'Resend verification email'}
          </Button>
        </>
      ) : (
        <p className="mt-4 text-[13px] font-medium leading-6 text-neutral-300">
          Your email is verified. Contact support for help with this suspension.
        </p>
      )}
    </section>
  )
}

export function AppShell() {
  const [, setSessionVersion] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const session = readSession()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return localStorage.getItem('autoshowroom.dealer.theme') === 'light' ? 'light' : 'dark'
  })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(Boolean(session?.user.mustChangePassword))
  const profile = useQuery({
    queryKey: ['dealer-profile'],
    queryFn: () => api<DealerProfile>('/v1/dealers/me'),
  })
  const me = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<AuthUser>('/v1/auth/me'),
    enabled: Boolean(session),
  })
  useEffect(() => {
    if (!me.data) return
    const current = readSession()
    if (!current) return
    if (JSON.stringify(current.user) === JSON.stringify(me.data)) return
    writeSession({ ...current, user: me.data })
  }, [me.data])
  const needsDealershipSetup = Boolean(
    session?.user.email.endsWith('@pending.autoshowroom.local') || profile.data?.name === 'New Dealer',
  )
  const suspended = profile.data?.operationalStatus === 'suspended'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('autoshowroom.dealer.theme', theme)
  }, [theme])

  useEffect(() => {
    const syncSession = () => setSessionVersion((version) => version + 1)
    window.addEventListener('dealer-session-changed', syncSession)
    return () => window.removeEventListener('dealer-session-changed', syncSession)
  }, [])

  useEffect(() => {
    if (suspended && location.pathname !== routes.account) {
      navigate(routes.account, { replace: true })
    }
  }, [location.pathname, navigate, suspended])

  const dealerName = profile.data?.name ?? session?.user.name ?? 'Dealer admin'
  const isImmersivePage = location.pathname === routes.chats

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(110%_75%_at_0%_0%,#1b1b20_0%,#0b0b0d_56%)] text-neutral-100">
      <div className="flex h-full">
        <Sidebar suspended={suspended} />
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            dealerName={dealerName}
            theme={theme}
            userMenuOpen={userMenuOpen}
            onCloseUserMenu={() => setUserMenuOpen(false)}
            onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            onToggleUserMenu={() => setUserMenuOpen((open) => !open)}
          />
          <div
            className={
              isImmersivePage
                ? 'min-h-0 flex-1 overflow-hidden'
                : 'min-h-0 flex-1 overflow-y-auto'
            }
          >
            <div
              className={
                isImmersivePage
                  ? 'mx-auto h-full w-full max-w-[1200px]'
                  : 'mx-auto w-full max-w-[1200px] p-5 lg:p-7 xl:p-8'
              }
            >
              {suspended ? (
                <SuspendedWorkspaceRecovery
                  email={session?.user.email ?? ''}
                  emailVerified={session?.user.emailVerified === true}
                  reason={profile.data?.suspendedReason}
                />
              ) : (
                <Outlet />
              )}
            </div>
          </div>
        </main>
      </div>
      <OnboardingModals
        needsDealershipSetup={needsDealershipSetup}
        passwordModalOpen={passwordModalOpen}
        profile={profile.data}
        session={session}
        onPasswordModalOpenChange={setPasswordModalOpen}
      />
    </div>
  )
}
