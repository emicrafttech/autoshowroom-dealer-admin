import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/app/components/app-header'
import { OnboardingModals } from '@/app/components/onboarding-modals'
import { Sidebar } from '@/app/components/sidebar'
import { api } from '@/lib/api'
import { readSession, writeSession, type AuthUser } from '@/lib/auth'
import { routes } from '@/lib/routes'

type DealerProfile = {
  name: string
  operationalStatus?: string
  locations: Array<{ name: string }>
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
  const activeLocation = profile.data?.locations[0]?.name ?? 'Workspace'

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(110%_75%_at_0%_0%,#1b1b20_0%,#0b0b0d_56%)] text-neutral-100">
      <div className="flex h-full">
        <Sidebar suspended={suspended} />
        <main className="h-full min-w-0 flex-1 overflow-y-auto">
          <AppHeader
            activeLocation={activeLocation}
            dealerName={dealerName}
            theme={theme}
            userMenuOpen={userMenuOpen}
            onCloseUserMenu={() => setUserMenuOpen(false)}
            onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            onToggleUserMenu={() => setUserMenuOpen((open) => !open)}
          />
          <div className="mx-auto w-full max-w-[1200px] p-5 lg:p-7 xl:p-8">
            <Outlet />
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
