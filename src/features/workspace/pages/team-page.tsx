import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { MoreHorizontal, RefreshCw, Send, Trash2, UserPlus } from 'lucide-react'
import { Badge, Button, Input } from '@/components/ui'
import { inviteSchema } from '@/features/workspace/schemas'
import type { Paginated, Staff } from '@/features/workspace/types'
import { api, del, patch, post } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { readSession } from '@/lib/auth'
import { cn, unwrapList } from '@/lib/utils'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'TM'
}

function roleTone(role: string) {
  if (role === 'owner') return 'lime'
  if (role === 'manager') return 'slate'
  return 'slate'
}

function roleDescription(role: string) {
  if (role === 'owner') return 'Full access, billing, team, and all listings.'
  if (role === 'manager') return 'Manage stock, leads, and bookings.'
  return 'Work leads and reply to buyer chats.'
}

function canManageStaff(actorRole: string | undefined, member: Staff) {
  if (actorRole === 'owner') return true
  if (actorRole === 'manager') return member.role === 'sales'
  return false
}

function canAssignRole(actorRole: string | undefined, currentRole: string, newRole: string) {
  if (newRole === currentRole) return false
  if (actorRole === 'owner') return true
  if (actorRole === 'manager') return currentRole === 'sales' && newRole !== 'owner'
  return false
}

function assignableRoles(actorRole: string | undefined, currentRole: string) {
  return (['owner', 'manager', 'sales'] as const).filter((r) => canAssignRole(actorRole, currentRole, r))
}

type RowAction = { label: string; icon: typeof Trash2; tone: 'default' | 'danger'; run: () => void }

function RoleMenu({ actorRole, member, disabled, onChange }: { actorRole: string | undefined; member: Staff; disabled: boolean; onChange: (role: 'owner' | 'manager' | 'sales') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options = assignableRoles(actorRole, member.role)
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  if (!options.length) return null
  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Change role"
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-neutral-500 transition hover:bg-white/8 hover:text-white"
        disabled={disabled}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#17171a] p-1 shadow-2xl shadow-black/40">
          <div className="px-3 py-1.5 text-[10px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">Change role</div>
          {options.map((role) => (
            <button
              className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-neutral-200 transition hover:bg-white/8"
              key={role}
              type="button"
              onClick={() => { setOpen(false); onChange(role) }}
            >
              <span className="capitalize">{role}</span>
              <span className="text-[11px] font-medium text-neutral-500">{roleDescription(role)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RowMenu({ actions, disabled }: { actions: RowAction[]; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  if (!actions.length) return null
  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Member actions"
        className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-neutral-500 transition hover:bg-white/8 hover:text-white"
        disabled={disabled}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#17171a] p-1 shadow-2xl shadow-black/40">
          {actions.map((action) => (
            <button
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition hover:bg-white/8',
                action.tone === 'danger' ? 'text-red-300' : 'text-neutral-200',
              )}
              disabled={disabled}
              key={action.label}
              type="button"
              onClick={() => { setOpen(false); action.run() }}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function TeamPage() {
  const session = readSession()
  const currentUserId = session?.user.id
  const currentRole = session?.user.role
  const form = useForm<z.infer<typeof inviteSchema>>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '', name: '', role: 'sales' } })
  const staff = useQuery({ queryKey: ['staff'], queryFn: () => api<Paginated<Staff>>('/v1/dealers/me/staff') })
  const members = unwrapList(staff.data)
  const activeMembers = members.filter((member) => member.is_active && !member.invitePending)
  const pendingInvites = members.filter((member) => member.invitePending)
  const invite = useMutation({
    mutationFn: (values: z.infer<typeof inviteSchema>) => post<Staff>('/v1/dealers/me/staff', values),
    onSuccess: (member) => {
      toast.success('Invitation created')
      if (member.inviteToken) {
        void navigator.clipboard?.writeText(member.inviteToken)
        toast.success('Invite token copied')
      }
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const resendInvite = useMutation({
    mutationFn: (member: Staff) => post<Staff>(`/v1/dealers/me/staff/${member.id}/resend-invite`),
    onSuccess: (member) => {
      toast.success('Invite resent')
      if (member.inviteToken) {
        void navigator.clipboard?.writeText(member.inviteToken)
        toast.success('Invite token copied')
      }
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const deactivate = useMutation({
    mutationFn: (member: Staff) => del(`/v1/dealers/me/staff/${member.id}`),
    onSuccess: () => {
      toast.success('Team member deactivated')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const reactivate = useMutation({
    mutationFn: (member: Staff) => patch<Staff>(`/v1/dealers/me/staff/${member.id}`, { is_active: true }),
    onSuccess: () => {
      toast.success('Team member reactivated')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const changeRole = useMutation({
    mutationFn: ({ member, role }: { member: Staff; role: 'owner' | 'manager' | 'sales' }) =>
      patch<Staff>(`/v1/dealers/me/staff/${member.id}`, { role }),
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Team</h1>
          <p className="mt-2 text-[14px] font-medium text-neutral-400">Invite, monitor, and manage who can access your dealer workspace.</p>
        </div>
        <Button type="button" onClick={() => document.getElementById('team-invite-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          <UserPlus className="h-4 w-4" />
          Invite staff
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
          <div className="text-[12px] font-semibold text-neutral-500">Total members</div>
          <div className="mt-3 font-display text-[31px] font-semibold text-white">{members.length}</div>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
          <div className="text-[12px] font-semibold text-neutral-500">Active now</div>
          <div className="mt-3 font-display text-[31px] font-semibold text-lime-300">{activeMembers.length}</div>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
          <div className="text-[12px] font-semibold text-neutral-500">Pending invites</div>
          <div className="mt-3 font-display text-[31px] font-semibold text-amber-300">{pendingInvites.length}</div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-x-auto rounded-[20px] border border-white/8 bg-[#101014]/80 shadow-2xl shadow-black/20">
          <div className="grid min-w-[620px] grid-cols-[1fr_140px_150px_80px] border-b border-white/8 px-5 py-4 text-[11px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">
            <div>Member</div>
            <div>Role</div>
            <div>Status</div>
            <div />
          </div>
          {members.length ? (
            <div className="divide-y divide-white/8">
              {members.map((member) => {
                const status = member.invitePending ? 'Invite sent' : member.is_active ? 'Active' : 'Inactive'
                const isSelf = member.id === currentUserId
                const canManage = !isSelf && canManageStaff(currentRole, member)
                const busy = deactivate.isPending || reactivate.isPending || resendInvite.isPending || changeRole.isPending
                const canChangeRole = canManage && !member.invitePending && assignableRoles(currentRole, member.role).length > 0
                const actions: RowAction[] = []
                if (canManage && member.invitePending) {
                  actions.push({ label: 'Resend invite', icon: Send, tone: 'default', run: () => resendInvite.mutate(member) })
                }
                if (canManage && !member.invitePending && member.is_active) {
                  actions.push({ label: 'Deactivate', icon: Trash2, tone: 'danger', run: () => deactivate.mutate(member) })
                }
                if (canManage && !member.invitePending && !member.is_active) {
                  actions.push({ label: 'Reactivate', icon: RefreshCw, tone: 'default', run: () => reactivate.mutate(member) })
                }
                return (
                  <article className="grid min-w-[620px] grid-cols-[1fr_140px_150px_80px] items-center px-5 py-4" key={member.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-300 font-display text-[13px] font-bold text-neutral-950">
                        {initials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-display text-[15px] font-semibold text-white">
                          {member.name}
                          {isSelf ? <span className="ml-2 text-[11px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">You</span> : null}
                        </div>
                        <div className="truncate text-[12px] font-semibold text-blue-400">{member.email}</div>
                      </div>
                    </div>
                    <div>
                      <Badge tone={roleTone(member.role)}>{member.role}</Badge>
                    </div>
                    <div className={cn('inline-flex items-center gap-2 text-[13px] font-[900!important]', member.invitePending ? 'text-amber-200' : member.is_active ? 'text-lime-300' : 'text-neutral-500')}>
                      <span className={cn('h-2 w-2 rounded-full', member.invitePending ? 'bg-amber-300' : member.is_active ? 'bg-lime-300' : 'bg-neutral-600')} />
                      {status}
                    </div>
                    <div className="flex justify-end gap-2">
                      {canChangeRole ? <RoleMenu actorRole={currentRole} member={member} disabled={busy} onChange={(role) => changeRole.mutate({ member, role })} /> : null}
                      <RowMenu actions={actions} disabled={busy} />
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-[13px] font-semibold text-neutral-500">No team members yet.</div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20" id="team-invite-form">
            <h2 className="font-display text-[20px] font-semibold text-white">Invite a teammate</h2>
            <p className="mt-1 text-[13px] font-medium text-neutral-500">They’ll get access to join this workspace.</p>
            <form className="mt-5 space-y-3" onSubmit={form.handleSubmit((values) => invite.mutate(values))}>
              <Input placeholder="Full name" {...form.register('name')} />
              <Input placeholder="Email address" type="email" {...form.register('email')} />
              <select className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-[#17171a] px-4 text-[14px] font-semibold text-white outline-none focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10" {...form.register('role')}>
                <option value="sales">Sales</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <Button className="w-full" disabled={invite.isPending} type="submit">
                <Send className="h-4 w-4" />
                {invite.isPending ? 'Sending...' : 'Send invite'}
              </Button>
            </form>
          </section>

          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[20px] font-semibold text-white">Roles</h2>
            <div className="mt-4 space-y-3">
              {(['owner', 'manager', 'sales'] as const).map((role) => (
                <div className="flex items-center gap-3" key={role}>
                  <div className="w-[88px] shrink-0">
                    <Badge tone={roleTone(role)}>{role}</Badge>
                  </div>
                  <p className="text-[12px] font-medium leading-5 text-neutral-500">{roleDescription(role)}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
