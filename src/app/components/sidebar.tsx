import { NavLink } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { nav } from '@/app/nav'
import { usePendingBookingCount } from '@/features/workspace/components/bookings/use-dealer-appointments'
import { useUnreadChatCount } from '@/features/workspace/components/chats/use-dealer-chats'
import { readSession } from '@/lib/auth'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null

  return (
    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-lime-300 px-1.5 text-[10px] font-[900!important] text-neutral-950">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function Logo() {
  return (
    <div className="brand-logo-wrap">
      <BrandLogo className="w-[150px]" />
    </div>
  )
}

function Navigation({ suspended = false }: { suspended?: boolean }) {
  const unreadChatCount = useUnreadChatCount()
  const pendingBookingCount = usePendingBookingCount()

  if (suspended) {
    return (
      <nav className="mt-7">
        <NavLink
          className="flex items-center gap-3 rounded-[10px] bg-lime-300/12 px-3 py-2.5 text-[13.5px] font-bold text-lime-200"
          to={routes.account}
        >
          Account
        </NavLink>
      </nav>
    )
  }

  return (
    <nav className="mt-7 space-y-1">
      {nav.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-bold transition',
              isActive ? 'bg-lime-300/12 text-lime-200' : 'text-neutral-400 hover:bg-white/6 hover:text-white',
            )
          }
          end={item.to === routes.dashboard}
          key={item.to}
          to={item.to}
        >
          <item.icon size={18} />
          {item.label}
          {item.to === routes.chats ? <NavBadge count={unreadChatCount} /> : null}
          {item.to === routes.bookings ? <NavBadge count={pendingBookingCount} /> : null}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar({ suspended = false }: { suspended?: boolean }) {
  const session = readSession()
  const emailVerified = session?.user.emailVerified === true
  return (
    <aside className="app-sidebar hidden h-full w-[236px] shrink-0 overflow-hidden border-r border-white/8 bg-[#121215]/95 px-3.5 py-5 lg:block">
      <div className="flex h-full flex-col">
        <Logo />
        <Navigation suspended={suspended} />
        {suspended ? (
          <div className="mt-auto rounded-[16px] border border-red-300/20 bg-red-400/10 p-4">
            <div className="text-[13px] font-[900!important] text-red-100">Account suspended</div>
            <p className="mt-2 text-[12px] font-medium leading-5 text-red-100/75">
              Verify your email from Account settings to reactivate your dealer workspace and restore public listings.
            </p>
          </div>
        ) : !emailVerified ? (
          <div className="mt-auto rounded-[16px] border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="text-[13px] font-[900!important] text-amber-100">Verify your email</div>
            <p className="mt-2 text-[12px] font-medium leading-5 text-amber-100/75">
              You may miss important information. Accounts not verified within 7 days can be suspended until verified.
            </p>
            <NavLink className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-amber-300 text-[12px] font-[900!important] text-neutral-950" to={routes.account}>
              Go to account
            </NavLink>
          </div>
        ) : null}
      </div>
    </aside>
  )
}

export function MobileNav() {
  const unreadChatCount = useUnreadChatCount()
  const pendingBookingCount = usePendingBookingCount()

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
      {nav.map((item) => (
        <NavLink
          className={({ isActive }) =>
            cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold',
              isActive ? 'bg-lime-300 text-neutral-950' : 'bg-white/8 text-neutral-300',
            )
          }
          end={item.to === routes.dashboard}
          key={item.to}
          to={item.to}
        >
          {item.label}
          {item.to === routes.chats && unreadChatCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-lime-300 px-1 text-[9px] font-[900!important] text-neutral-950">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          ) : null}
          {item.to === routes.bookings && pendingBookingCount > 0 ? (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-lime-300 px-1 text-[9px] font-[900!important] text-neutral-950">
              {pendingBookingCount > 99 ? '99+' : pendingBookingCount}
            </span>
          ) : null}
        </NavLink>
      ))}
    </div>
  )
}
