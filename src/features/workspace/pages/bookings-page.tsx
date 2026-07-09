import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Car, ChevronLeft, ChevronRight, Clock, MessageCircle, MoreHorizontal, Phone, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Dialog, Input, Label, Textarea } from '@/components/ui'
import { isPendingConfirmation, useDealerAppointments } from '@/features/workspace/components/bookings/use-dealer-appointments'
import { BookingAvailabilityPanel } from '@/features/workspace/components/bookings/booking-availability-panel'
import type { Appointment, Paginated, Vehicle } from '@/features/workspace/types'
import { vehicleTitle } from '@/features/workspace/utils'
import { api, patch, post } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { routes } from '@/lib/routes'
import { cn, unwrapList } from '@/lib/utils'

type ServiceType = 'inspection' | 'test-drive' | 'handover'

type ServiceMeta = { key: ServiceType; label: string; border: string; badge: string; tile: string; duration: string }

const SERVICES: Record<ServiceType, ServiceMeta> = {
  inspection: { key: 'inspection', label: 'Inspection', border: 'border-l-lime-300', badge: 'bg-lime-300/15 text-lime-200 ring-1 ring-lime-300/25', tile: 'bg-lime-300/10 text-lime-300', duration: '45 min' },
  'test-drive': { key: 'test-drive', label: 'Test drive', border: 'border-l-[#7aa2ff]', badge: 'bg-[#7aa2ff]/15 text-[#bfd1ff] ring-1 ring-[#7aa2ff]/25', tile: 'bg-[#7aa2ff]/12 text-[#bfd1ff]', duration: '30 min' },
  handover: { key: 'handover', label: 'Handover', border: 'border-l-amber-300', badge: 'bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/25', tile: 'bg-amber-300/12 text-amber-200', duration: '60 min' },
}

function serviceFromAppointment(appointment: Appointment): ServiceMeta {
  const text = `${appointment.title ?? ''} ${appointment.vehicleTitle ?? ''} ${appointment.notes ?? ''}`.toLowerCase()
  if (text.includes('test drive') || text.includes('test-drive')) return SERVICES['test-drive']
  if (text.includes('handover') || text.includes('hand over')) return SERVICES.handover
  return SERVICES.inspection
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}

function formatTime(value?: string) {
  if (!value) return 'Time not set'
  return new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function formatDayHeader(date: Date) {
  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, tomorrow)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

function relativeLabel(value?: string) {
  if (!value) return ''
  const target = new Date(value).getTime()
  const diff = target - Date.now()
  const mins = Math.round(diff / 60000)
  if (mins <= 0) return 'Now'
  if (mins < 60) return `in ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} hr`
  const days = Math.round(hours / 24)
  return `in ${days} d`
}

function initials(name?: string) {
  if (!name) return 'B'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || name.slice(0, 2)).slice(0, 2)
}

function chatLink(appointment?: Appointment) {
  if (appointment?.conversationId) return `${routes.chats}?conversation=${appointment.conversationId}`
  return routes.chats
}

function toLocalInputValue(value?: string) {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function MiniCalendar({ appointments, selectedDate, onSelect }: { appointments: Appointment[]; selectedDate: Date; onSelect: (date: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const daysWithBookings = useMemo(() => {
    const set = new Set<string>()
    for (const a of appointments) {
      if (!a.scheduledAt) continue
      const d = startOfDay(new Date(a.scheduledAt))
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    }
    return set
  }, [appointments])

  const grid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [viewMonth])

  return (
    <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <div className="font-display text-[14px] font-bold text-white">{MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}</div>
        <div className="flex items-center gap-1">
          <button className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-neutral-400 transition hover:bg-white/8 hover:text-white" type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="grid h-7 w-7 cursor-pointer place-items-center rounded-lg text-neutral-400 transition hover:bg-white/8 hover:text-white" type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-600">
        {WEEKDAYS.map((day) => <div key={day}>{day[0]}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((day, index) => {
          const inMonth = day.getMonth() === viewMonth.getMonth()
          const today = isSameDay(day, new Date())
          const selected = isSameDay(day, selectedDate)
          const hasBookings = daysWithBookings.has(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`)
          return (
            <button
              className={cn(
                'relative grid h-8 cursor-pointer place-items-center rounded-lg text-[12px] font-bold transition',
                inMonth ? 'text-neutral-300' : 'text-neutral-700',
                selected ? 'bg-lime-300 text-neutral-950' : today ? 'ring-1 ring-lime-300/40 text-white' : 'hover:bg-white/8',
              )}
              key={index}
              type="button"
              onClick={() => onSelect(startOfDay(day))}
            >
              {day.getDate()}
              {hasBookings && !selected ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-lime-300" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BookingCard({
  appointment,
  onReschedule,
  onCancel,
  onConfirm,
  onMarkAttendance,
}: {
  appointment: Appointment
  onReschedule: (a: Appointment) => void
  onCancel: (a: Appointment) => void
  onConfirm: (a: Appointment) => void
  onMarkAttendance: (a: Appointment, status: 'show' | 'no_show') => void
}) {
  const service = serviceFromAppointment(appointment)
  const pending = isPendingConfirmation(appointment.status)
  const name = appointment.buyerName ?? appointment.title ?? 'Booking'
  const subLine = [appointment.vehicleTitle, [appointment.locationName, appointment.locationArea].filter(Boolean).join(', ')].filter(Boolean).join(' · ')

  return (
    <article className={cn('flex items-center gap-4 rounded-2xl border border-white/8 border-l-4 bg-[#101014]/70 p-4 shadow-lg shadow-black/10 transition hover:bg-[#101014]')}>
      <div className="hidden w-[88px] shrink-0 sm:block">
        <div className="font-display text-[18px] font-semibold leading-tight text-white">{formatTime(appointment.scheduledAt)}</div>
        <div className="mt-1 text-[11px] font-bold text-neutral-500">{service.duration}</div>
      </div>
      <div className={cn('grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl sm:h-14 sm:w-14', service.tile)}>
        <Car className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-display text-[15px] font-semibold text-white">{name}</span>
          <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide', service.badge)}>{service.label}</span>
        </div>
        <p className="mt-1 truncate text-[12.5px] font-medium text-neutral-400">{subLine || 'Inspection booking'}</p>
        {appointment.buyerPhone ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-2 py-1 text-[11px] font-bold text-neutral-400">
            <Phone className="h-3 w-3" />
            {appointment.buyerPhone}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {pending ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Pending
            </span>
            <Button size="sm" type="button" onClick={() => onConfirm(appointment)}>Confirm</Button>
            <Button size="sm" type="button" variant="secondary" onClick={() => onReschedule(appointment)}>Reschedule</Button>
          </>
        ) : (
          <>
            <span className={cn('hidden items-center gap-1.5 text-[12px] font-bold sm:inline-flex', appointment.attendanceStatus === 'no_show' ? 'text-red-300' : 'text-lime-300')}>
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              {appointment.attendanceStatus === 'show'
                ? 'Show'
                : appointment.attendanceStatus === 'no_show'
                  ? 'No-show'
                  : 'Confirmed'}
            </span>
            <Link className="grid h-9 w-9 place-items-center rounded-lg text-neutral-400 ring-1 ring-white/10 transition hover:bg-white/8 hover:text-white" title="Message buyer" to={chatLink(appointment)}>
              <MessageCircle className="h-4 w-4" />
            </Link>
            <div className="relative">
              <CardMenu appointment={appointment} onReschedule={onReschedule} onCancel={onCancel} onMarkAttendance={onMarkAttendance} />
            </div>
          </>
        )}
      </div>
    </article>
  )
}

function CardMenu({
  appointment,
  onReschedule,
  onCancel,
  onMarkAttendance,
}: {
  appointment: Appointment
  onReschedule: (a: Appointment) => void
  onCancel: (a: Appointment) => void
  onMarkAttendance: (a: Appointment, status: 'show' | 'no_show') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref}>
      <button className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-neutral-400 ring-1 ring-white/10 transition hover:bg-white/8 hover:text-white" type="button" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#17171a] p-1.5 shadow-2xl shadow-black/40">
          <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-bold text-neutral-200 transition hover:bg-white/8" type="button" onClick={() => { setOpen(false); onReschedule(appointment) }}>
            <Clock className="h-4 w-4" /> Reschedule
          </button>
          <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-bold text-lime-200 transition hover:bg-lime-300/10" type="button" onClick={() => { setOpen(false); onMarkAttendance(appointment, 'show') }}>
            <Calendar className="h-4 w-4" /> Mark show
          </button>
          <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-bold text-amber-200 transition hover:bg-amber-300/10" type="button" onClick={() => { setOpen(false); onMarkAttendance(appointment, 'no_show') }}>
            <X className="h-4 w-4" /> Mark no-show
          </button>
          <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-bold text-red-300 transition hover:bg-red-500/10" type="button" onClick={() => { setOpen(false); onCancel(appointment) }}>
            <X className="h-4 w-4" /> Cancel booking
          </button>
        </div>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, note, tone }: { label: string; value: number; note?: string; tone: 'lime' | 'amber' | 'blue' | 'slate' }) {
  const bar = tone === 'lime' ? 'bg-lime-300' : tone === 'amber' ? 'bg-amber-300' : tone === 'blue' ? 'bg-[#7aa2ff]' : 'bg-neutral-500'
  const noteColor = tone === 'amber' ? 'text-amber-200' : 'text-neutral-500'
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
      <div className="text-[11px] font-[900!important] uppercase tracking-[0.14em] text-neutral-500">{label}</div>
      <div className="mt-3 font-display text-[30px] font-semibold leading-none text-white">{value}</div>
      {note ? <div className={cn('mt-3 text-[12px] font-bold', noteColor)}>{note}</div> : <div className={cn('mt-3 h-1.5 w-12 rounded-full', bar)} />}
    </div>
  )
}

function RescheduleDialog({ appointment, open, onClose, onConfirm }: { appointment: Appointment | null; open: boolean; onClose: () => void; onConfirm: (scheduledAt: string) => void }) {
  const [value, setValue] = useState('')
  useEffect(() => { setValue(toLocalInputValue(appointment?.scheduledAt)) }, [appointment, open])

  return (
    <Dialog open={open} title="Reschedule booking" onClose={onClose}>
      <p className="text-[13px] font-medium text-neutral-400">Pick a new date and time for {appointment?.buyerName ?? appointment?.title ?? 'this booking'}.</p>
      <div className="mt-4 space-y-2.5">
        <Label htmlFor="reschedule-at">New date & time</Label>
        <Input id="reschedule-at" type="datetime-local" value={value} onChange={(event) => setValue(event.target.value)} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!value} onClick={() => { onConfirm(new Date(value).toISOString()) }}>Confirm reschedule</Button>
      </div>
    </Dialog>
  )
}

function NewBookingDialog({ open, onClose, vehicles }: { open: boolean; onClose: () => void; vehicles: Vehicle[] }) {
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue())
  const [notes, setNotes] = useState('')
  const vehicle = vehicles.find((v) => v.id === vehicleId)
  const title = buyerName ? `Inspection for ${buyerName}` : 'Inspection booking'

  const create = useMutation({
    mutationFn: () =>
      post<Appointment>('/v1/appointments', {
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        vehicleId: vehicleId || undefined,
        locationId: vehicle?.locationId || undefined,
        notes: [buyerPhone ? `Buyer phone: ${buyerPhone}` : null, notes || null].filter(Boolean).join('\n') || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Booking added to your schedule.')
      setBuyerName(''); setBuyerPhone(''); setVehicleId(''); setNotes('')
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} title="New booking" onClose={onClose}>
      <p className="text-[13px] font-medium text-neutral-400">Manually add an inspection appointment to your schedule.</p>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-2.5">
          <Label htmlFor="nb-name">Buyer name</Label>
          <Input id="nb-name" placeholder="Buyer full name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="nb-phone">Buyer phone</Label>
          <Input id="nb-phone" placeholder="+234 ..." value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="nb-vehicle">Vehicle (optional)</Label>
          <select
            className="h-[50px] w-full rounded-xl border border-white/10 bg-[#17171a] px-4 text-[15px] font-semibold text-white outline-none focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10"
            id="nb-vehicle"
            value={vehicleId}
            onChange={(event) => setVehicleId(event.target.value)}
          >
            <option value="">No specific vehicle</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.year} {vehicleTitle(v)}</option>)}
          </select>
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="nb-at">Date & time</Label>
          <Input id="nb-at" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="nb-notes">Notes (optional)</Label>
          <Textarea id="nb-notes" placeholder="Anything the dealer should know before the inspection" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={!scheduledAt || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? 'Adding...' : 'Add booking'}
        </Button>
      </div>
    </Dialog>
  )
}

function CalendarView({ appointments, selectedDate, onSelect }: { appointments: Appointment[]; selectedDate: Date; onSelect: (date: Date) => void }) {
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const a of appointments) {
      if (!a.scheduledAt) continue
      const d = startOfDay(new Date(a.scheduledAt))
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      map.set(key, [...(map.get(key) ?? []), a])
    }
    return map
  }, [appointments])

  const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  const startOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startOffset)
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  return (
    <div className="rounded-[22px] border border-white/8 bg-[#101014]/70 p-4 shadow-2xl shadow-black/20">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase tracking-wider text-neutral-500">
        {WEEKDAYS.map((day) => <div key={day} className="pb-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const inMonth = day.getMonth() === selectedDate.getMonth()
          const today = isSameDay(day, new Date())
          const selected = isSameDay(day, selectedDate)
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
          const items = byDay.get(key) ?? []
          return (
            <button
              className={cn(
                'flex min-h-[92px] cursor-pointer flex-col items-start gap-1 rounded-xl border p-2 text-left transition',
                selected ? 'border-lime-300/40 bg-lime-300/5' : 'border-white/8 bg-white/2 hover:bg-white/4',
                !inMonth && 'opacity-40',
              )}
              key={index}
              type="button"
              onClick={() => onSelect(startOfDay(day))}
            >
              <span className={cn('text-[12px] font-bold', today ? 'grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-neutral-950' : 'text-neutral-300')}>{day.getDate()}</span>
              <div className="w-full space-y-1">
                {items.slice(0, 3).map((a) => {
                  const service = serviceFromAppointment(a)
                  return (
                    <div key={a.id} className={cn('truncate rounded-md px-1.5 py-0.5 text-[10px] font-bold', service.badge)}>
                      {formatTime(a.scheduledAt)} {(a.buyerName ?? a.title ?? '').slice(0, 12)}
                    </div>
                  )
                })}
                {items.length > 3 ? <div className="px-1.5 text-[10px] font-bold text-neutral-500">+{items.length - 3} more</div> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookingsPage() {
  const [view, setView] = useState<'agenda' | 'calendar'>('agenda')
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()))
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [newOpen, setNewOpen] = useState(false)

  const appointments = useDealerAppointments()
  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Paginated<Vehicle>>('/v1/vehicles') })

  const all = unwrapList(appointments.data).filter((a) => a.status !== 'cancelled')

  const cancel = useMutation({
    mutationFn: (id: string) => patch<Appointment>(`/v1/appointments/${id}/cancel`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Booking cancelled.') },
    onError: (error) => toast.error(error.message),
  })
  const confirm = useMutation({
    mutationFn: (id: string) => patch<Appointment>(`/v1/appointments/${id}/confirm`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Booking confirmed.') },
    onError: (error) => toast.error(error.message),
  })
  const reschedule = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) => patch<Appointment>(`/v1/appointments/${id}/reschedule`, { scheduledAt }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Booking rescheduled.') },
    onError: (error) => toast.error(error.message),
  })
  const markAttendance = useMutation({
    mutationFn: ({ appointment, status }: { appointment: Appointment; status: 'show' | 'no_show' }) =>
      patch<Appointment>(`/v1/appointments/${appointment.id}/${status === 'show' ? 'mark-show' : 'mark-no-show'}`, {}),
    onSuccess: (_appointment, values) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success(values.status === 'show' ? 'Booking marked as show.' : 'Booking marked as no-show.')
    },
    onError: (error) => toast.error(error.message),
  })

  const today = startOfDay(new Date())
  const weekStart = startOfWeek(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const stats = useMemo(() => {
    const allIncludingCancelled = unwrapList(appointments.data)
    let todayCount = 0
    let pending = 0
    let week = 0
    let completed30 = 0
    for (const a of allIncludingCancelled) {
      if (!a.scheduledAt) continue
      const d = new Date(a.scheduledAt)
      const cancelled = a.status === 'cancelled'
      if (!cancelled && isSameDay(d, today)) todayCount += 1
      if (isPendingConfirmation(a.status)) pending += 1
      if (!cancelled && d >= weekStart && d <= weekEnd) week += 1
      if (!cancelled && d < today && d >= thirtyDaysAgo) completed30 += 1
    }
    return { todayCount, pending, week, completed30 }
  }, [appointments.data, today, weekStart, weekEnd, thirtyDaysAgo])

  const grouped = useMemo(() => {
    const future = all
      .filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() >= today.getTime())
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    const groups = new Map<string, { date: Date; items: Appointment[] }>()
    for (const a of future) {
      const d = startOfDay(new Date(a.scheduledAt!))
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!groups.has(key)) groups.set(key, { date: d, items: [] })
      groups.get(key)!.items.push(a)
    }
    return [...groups.values()]
  }, [all, today])

  const upcoming = useMemo(
    () => all.filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() >= Date.now()).sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()),
    [all],
  )
  const awaitingReply = useMemo(() => all.filter((a) => isPendingConfirmation(a.status)), [all])
  const nextUp = upcoming[0]
  const vehicleList = unwrapList(vehicles.data)

  const dayFiltered = view === 'calendar' ? all.filter((a) => a.scheduledAt && isSameDay(new Date(a.scheduledAt), selectedDate)) : []

  return (
    <div className="-m-5 flex h-[calc(100dvh-73px)] max-h-[calc(100dvh-92px)] min-h-0 flex-col overflow-hidden lg:-m-7 xl:-m-8">
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Bookings</h1>
          <p className="mt-2 text-[14px] font-semibold text-neutral-400">
            {formatLongDate(new Date())} · {stats.todayCount} today, {stats.week} this week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-[14px] border border-white/10 bg-[#101014]/80 p-1">
            {(['agenda', 'calendar'] as const).map((item) => (
              <button
                className={cn(
                  'h-10 cursor-pointer rounded-xl px-4 text-[13px] font-[900!important] capitalize transition',
                  view === item ? 'bg-white/8 text-white ring-1 ring-lime-300/30' : 'text-neutral-400 hover:text-white',
                )}
                key={item}
                type="button"
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            New booking
          </Button>
        </div>
      </div>

      <div className="mt-5 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={stats.todayCount} tone="lime" />
        <StatCard label="Pending confirm" value={stats.pending} note={stats.pending ? 'needs reply' : undefined} tone="amber" />
        <StatCard label="This week" value={stats.week} tone="blue" />
        <StatCard label="Completed · 30D" value={stats.completed30} tone="slate" />
      </div>

      <div className="mt-5 grid min-h-0 flex-1 grid-rows-1 gap-5 xl:grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-y-auto overscroll-contain pr-1">
          <div className="space-y-5 pb-2">
          {view === 'agenda' ? (
            grouped.length ? (
              grouped.map((group) => (
                <section key={`${group.date.toISOString()}`} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-[16px] font-bold text-white">{formatDayHeader(group.date)}</h2>
                    <Badge tone="slate">{group.items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {group.items.map((appointment) => (
                      <BookingCard
                        appointment={appointment}
                        key={appointment.id}
                        onCancel={(a) => cancel.mutate(a.id)}
                        onConfirm={(a) => confirm.mutate(a.id)}
                        onMarkAttendance={(a, status) => markAttendance.mutate({ appointment: a, status })}
                        onReschedule={(a) => setRescheduleTarget(a)}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-[22px] border border-white/8 bg-[#101014]/60 p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] border border-lime-300/20 bg-lime-300/10 text-lime-300 shadow-2xl shadow-lime-950/20">
                    <Calendar className="h-10 w-10" />
                  </div>
                  <h2 className="mt-6 font-display text-[26px] font-semibold tracking-[-0.035em] text-white">No bookings yet</h2>
                  <p className="mt-3 text-[14px] font-medium leading-7 text-neutral-400">
                    When buyers request an inspection from your listings, confirmed appointments will show here with buyer details and vehicle context.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-5">
              <CalendarView appointments={all} selectedDate={selectedDate} onSelect={setSelectedDate} />
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-[16px] font-bold text-white">{formatDayHeader(selectedDate)}</h2>
                  <Badge tone="slate">{dayFiltered.length}</Badge>
                </div>
                {dayFiltered.length ? (
                  <div className="space-y-3">
                    {dayFiltered.map((appointment) => (
                      <BookingCard
                        appointment={appointment}
                        key={appointment.id}
                        onCancel={(a) => cancel.mutate(a.id)}
                        onConfirm={(a) => confirm.mutate(a.id)}
                        onMarkAttendance={(a, status) => markAttendance.mutate({ appointment: a, status })}
                        onReschedule={(a) => setRescheduleTarget(a)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-[13px] font-medium text-neutral-500">
                    No bookings scheduled for this day.
                  </div>
                )}
              </section>
            </div>
          )}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 pb-2">
          <MiniCalendar appointments={all} selectedDate={selectedDate} onSelect={setSelectedDate} />
          <section className="rounded-[18px] border border-lime-300/25 bg-lime-300/6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-bold text-white">Up next</h2>
              {nextUp ? <span className="text-[11px] font-black text-lime-300">{relativeLabel(nextUp.scheduledAt)}</span> : null}
            </div>
            {nextUp ? (
              <div className="mt-4">
                <div className="font-display text-[20px] font-semibold text-lime-300">{formatTime(nextUp.scheduledAt)}</div>
                <div className="mt-1 text-[13px] font-bold text-white">{nextUp.buyerName ?? nextUp.title ?? 'Booking'}</div>
                <p className="mt-1 text-[12.5px] font-medium text-neutral-400">{nextUp.vehicleTitle ?? 'Inspection booking'}</p>
                <Link to={chatLink(nextUp)}>
                  <Button className="mt-4 w-full" type="button" variant="primary">
                    <MessageCircle className="h-4 w-4" />
                    Message buyer
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-[13px] font-medium leading-6 text-neutral-500">No upcoming inspections yet.</p>
            )}
          </section>
          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[15px] font-bold text-white">Awaiting your reply</h2>
            {awaitingReply.length ? (
              <div className="mt-4 space-y-3">
                {awaitingReply.map((a) => (
                  <div className="flex items-center gap-3" key={a.id}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-300/15 text-[11px] font-black text-amber-200">{initials(a.buyerName)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-white">{a.buyerName ?? a.title ?? 'Booking'}</div>
                      <div className="truncate text-[11px] font-medium text-neutral-500">{formatTime(a.scheduledAt)} · {serviceFromAppointment(a).label}</div>
                    </div>
                    <Button size="sm" type="button" onClick={() => confirm.mutate(a.id)}>Confirm</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[13px] font-medium leading-6 text-neutral-500">Nothing pending. You're all caught up.</p>
            )}
          </section>
          <BookingAvailabilityPanel />
        </aside>
      </div>

      <RescheduleDialog
        appointment={rescheduleTarget}
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onConfirm={(scheduledAt) => {
          if (rescheduleTarget) reschedule.mutate({ id: rescheduleTarget.id, scheduledAt })
          setRescheduleTarget(null)
        }}
      />
      <NewBookingDialog open={newOpen} onClose={() => setNewOpen(false)} vehicles={vehicleList} />
    </div>
  )
}
