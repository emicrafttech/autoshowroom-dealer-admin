import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, ChevronsUpDown, CreditCard, LogOut, Moon, Settings, Sun, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui'
import { MobileNav } from '@/app/components/sidebar'
import type { DealerNotification, Paginated } from '@/features/workspace/types'
import { api, post } from '@/lib/api'
import { clearSession, readSession } from '@/lib/auth'
import { queryClient } from '@/lib/query'
import { routes } from '@/lib/routes'
import { formatRelativeDate, unwrapList } from '@/lib/utils'

function initials(name?: string | null) {
  const parts = (name || 'Dealer Owner').split(' ').filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'DO'
}

type AppHeaderProps = {
  dealerName: string
  theme: 'dark' | 'light'
  userMenuOpen: boolean
  onToggleTheme: () => void
  onToggleUserMenu: () => void
  onCloseUserMenu: () => void
}

export function AppHeader({
  dealerName,
  theme,
  userMenuOpen,
  onToggleTheme,
  onToggleUserMenu,
  onCloseUserMenu,
}: AppHeaderProps) {
  const navigate = useNavigate()
  const session = readSession()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Paginated<DealerNotification>>('/v1/notifications'),
    refetchInterval: 30000,
  })
  const notificationItems = unwrapList(notifications.data)
  const unreadCount = useMemo(
    () => notificationItems.filter((notification) => !notification.readAt).length,
    [notificationItems],
  )
  const markRead = useMutation({
    mutationFn: (notification: DealerNotification) => post<DealerNotification>(`/v1/notifications/${notification.id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAllRead = useMutation({
    mutationFn: () => post<{ updated: number }>('/v1/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onCloseUserMenu()
      }
    }

    if (!userMenuOpen) return
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [onCloseUserMenu, userMenuOpen])

  useEffect(() => {
    function closeNotifications(event: MouseEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    if (!notificationsOpen) return
    document.addEventListener('mousedown', closeNotifications)
    return () => document.removeEventListener('mousedown', closeNotifications)
  }, [notificationsOpen])

  function signOut() {
    clearSession()
    navigate(routes.signIn, { replace: true })
  }

  function goTo(path: string) {
    onCloseUserMenu()
    navigate(path)
  }

  function openNotification(notification: DealerNotification) {
    if (!notification.readAt) markRead.mutate(notification)
    setNotificationsOpen(false)
    if (notification.type === 'platform_message') {
      navigate(routes.account)
      return
    }
    navigate(routes.stock)
  }

  return (
    <header className="app-header sticky top-0 z-30 border-b border-white/8 bg-[#0f0f12]/85 px-4 py-4 backdrop-blur lg:px-7">
      <div className="flex items-center justify-between gap-4">
        <div className="lg:hidden">
          <div className="brand-logo-wrap">
            <BrandLogo className="w-[150px]" />
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Workspace</div>
          <div className="font-display text-[22px] font-semibold tracking-tight text-white">{session?.user.name ?? 'Dealer admin'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationsRef}>
            <Button
              aria-label="Open notifications"
              className="relative"
              size="sm"
              type="button"
              variant="secondary"
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              <Bell size={15} />
              {unreadCount ? (
                <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-[900!important] text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Button>
            {notificationsOpen ? (
              <>
                <button
                  aria-label="Close notifications"
                  className="fixed inset-0 z-40 cursor-default bg-black/40 sm:hidden"
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="fixed inset-x-3 top-[72px] z-50 max-h-[min(70dvh,480px)] overflow-hidden rounded-[18px] border border-white/10 bg-[#101014] shadow-2xl shadow-black/40 sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[340px] sm:max-h-[380px]">
                  <div className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-[900!important] text-white">Notifications</div>
                      <div className="text-[11px] font-semibold text-neutral-500">{unreadCount} unread</div>
                    </div>
                    <button
                      className="shrink-0 cursor-pointer whitespace-nowrap text-[12px] font-[900!important] text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!unreadCount || markAllRead.isPending}
                      type="button"
                      onClick={() => markAllRead.mutate()}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-[min(calc(70dvh-64px),416px)] overflow-y-auto overscroll-contain p-2 sm:max-h-[316px]">
                    {notificationItems.length ? (
                      notificationItems.slice(0, 8).map((notification) => (
                        <button
                          className="w-full cursor-pointer rounded-2xl px-3 py-3 text-left transition hover:bg-white/8"
                          key={notification.id}
                          type="button"
                          onClick={() => openNotification(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-neutral-700' : 'bg-lime-300'}`} />
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] font-[900!important] text-white">{notification.title}</span>
                              <span className="mt-1 line-clamp-2 block text-[12.5px] font-medium leading-5 text-neutral-400">{notification.body}</span>
                              <span className="mt-2 block text-[11px] font-bold text-neutral-600">{formatRelativeDate(notification.createdAt)}</span>
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-[13px] font-semibold text-neutral-500">No notifications yet.</div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <Button
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            size="sm"
            type="button"
            variant="secondary"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
          <div className="relative" ref={menuRef}>
            <button
              className="user-trigger flex cursor-pointer items-center gap-3 rounded-[14px] border border-white/10 bg-[#101014]/80 px-3 py-2 text-left shadow-2xl shadow-black/10 transition hover:bg-white/8"
              type="button"
              onClick={onToggleUserMenu}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime-300 font-display text-[13px] font-bold text-neutral-950">
                {initials(dealerName)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="max-w-[180px] truncate font-display text-[15px] font-semibold tracking-[-0.02em] text-white">{dealerName}</div>
                <div className="max-w-[180px] truncate text-[12px] font-medium capitalize text-neutral-500">
                  {session?.user.role}
                </div>
              </div>
              <ChevronsUpDown className="text-neutral-500" size={17} />
            </button>

            {userMenuOpen ? (
              <div className="user-menu absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-[14px] border border-white/10 bg-[#101014] p-2 shadow-2xl shadow-black/30">
                <button
                  className="user-menu-item flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left text-[13.5px] font-bold text-neutral-200 hover:bg-white/8"
                  type="button"
                  onClick={() => goTo(routes.account)}
                >
                  <Settings size={17} />
                  Account settings
                </button>
                <button
                  className="user-menu-item flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left text-[13.5px] font-bold text-neutral-200 hover:bg-white/8"
                  type="button"
                  onClick={() => goTo(routes.team)}
                >
                  <Users size={17} />
                  Team
                </button>
                <button
                  className="user-menu-item flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left text-[13.5px] font-bold text-neutral-200 hover:bg-white/8"
                  type="button"
                  onClick={() => goTo(routes.billing)}
                >
                  <CreditCard size={17} />
                  Billing
                </button>
                <div className="my-2 h-px bg-white/8" />
                <button
                  className="user-menu-item flex w-full cursor-pointer items-center gap-3 rounded-xl bg-transparent px-3 py-2.5 text-left text-[13.5px] font-bold text-red-200 hover:bg-red-500/10"
                  type="button"
                  onClick={signOut}
                >
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <MobileNav />
    </header>
  )
}
