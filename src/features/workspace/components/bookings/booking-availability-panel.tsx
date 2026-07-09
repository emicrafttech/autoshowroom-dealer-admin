import { useMutation, useQuery } from '@tanstack/react-query'
import { Calendar, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Input, Label } from '@/components/ui'
import type { BookingAvailability, DealerLocation, Paginated } from '@/features/workspace/types'
import { api, patch } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { cn, unwrapList } from '@/lib/utils'

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const SLOT_LENGTHS = [15, 30, 45, 60]
const MAX_PER_DAY_OPTIONS = [4, 6, 8, 10, 12]
const MINUTE_OPTIONS = [0, 15, 30, 45]
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)

const selectClassName =
  'h-9 rounded-lg border border-white/10 bg-[#17171a] px-2.5 text-[12px] font-semibold text-white outline-none focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/10'

function parseTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(':')
  const hour24 = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return { hour12: 9, minute: 0, period: 'AM' as const }
  }
  const period = hour24 >= 12 ? ('PM' as const) : ('AM' as const)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, minute, period }
}

function toTimeValue(hour12: number, minute: number, period: 'AM' | 'PM') {
  let hour24 = hour12 % 12
  if (period === 'PM') hour24 += 12
  if (period === 'AM' && hour12 === 12) hour24 = 0
  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

function TimeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const parsed = parseTime(value)
  const minuteOptions = MINUTE_OPTIONS.includes(parsed.minute)
    ? MINUTE_OPTIONS
    : [...MINUTE_OPTIONS, parsed.minute].sort((a, b) => a - b)

  function update(next: Partial<{ hour12: number; minute: number; period: 'AM' | 'PM' }>) {
    onChange(
      toTimeValue(
        next.hour12 ?? parsed.hour12,
        next.minute ?? parsed.minute,
        next.period ?? parsed.period,
      ),
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Hour"
        className={cn(selectClassName, 'w-[58px]')}
        value={parsed.hour12}
        onChange={(event) => update({ hour12: Number(event.target.value) })}
      >
        {HOUR_OPTIONS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-[12px] font-bold text-neutral-500">:</span>
      <select
        aria-label="Minute"
        className={cn(selectClassName, 'w-[58px]')}
        value={parsed.minute}
        onChange={(event) => update({ minute: Number(event.target.value) })}
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {minute.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
      <select
        aria-label="Period"
        className={cn(selectClassName, 'w-[62px]')}
        value={parsed.period}
        onChange={(event) => update({ period: event.target.value as 'AM' | 'PM' })}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function formatHoursLabel(day: BookingAvailability['weeklyHours'][string]) {
  if (!day.enabled) return 'Closed'
  return `${toDisplayTime(day.open)} – ${toDisplayTime(day.close)}`
}

function toDisplayTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      aria-pressed={enabled}
      className={cn(
        'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition',
        enabled ? 'bg-lime-300' : 'bg-white/10',
      )}
      type="button"
      onClick={() => onChange(!enabled)}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
          enabled ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

export function BookingAvailabilityPanel() {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<BookingAvailability | null>(null)
  const [blockDate, setBlockDate] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')

  const locations = useQuery({
    queryKey: ['dealer-locations'],
    queryFn: () => api<Paginated<DealerLocation>>('/v1/dealers/me/locations'),
  })
  const stands = unwrapList(locations.data)
  const activeLocationId = selectedLocationId || stands.find((stand) => stand.isPrimary)?.id || stands[0]?.id || ''

  const availability = useQuery({
    enabled: Boolean(activeLocationId),
    queryKey: ['dealer-booking-availability', activeLocationId],
    queryFn: () => api<BookingAvailability>(`/v1/dealers/me/booking-availability?locationId=${activeLocationId}`),
  })

  const save = useMutation({
    mutationFn: (payload: BookingAvailability) =>
      patch<BookingAvailability>('/v1/dealers/me/booking-availability', {
        ...payload,
        locationId: activeLocationId,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['dealer-booking-availability', activeLocationId], data)
      setDraft(data)
      setEditing(false)
      toast.success('Booking availability updated.')
    },
    onError: (error) => toast.error(error.message),
  })

  const current = draft ?? availability.data
  const weeklyHours = current?.weeklyHours ?? {}

  const weekdaySummary = useMemo(() => {
    const monFri = DAYS.slice(0, 5).every((day) => {
      const entry = weeklyHours[day.key]
      return entry?.enabled && entry.open === weeklyHours.mon?.open && entry.close === weeklyHours.mon?.close
    })
    if (monFri && weeklyHours.mon?.enabled) {
      return `Mon – Fri · ${formatHoursLabel(weeklyHours.mon)}`
    }
    return null
  }, [weeklyHours])

  function updateDay(key: string, patchValue: Partial<BookingAvailability['weeklyHours'][string]>) {
    if (!current) return
    setDraft({
      ...current,
      weeklyHours: {
        ...current.weeklyHours,
        [key]: {
          ...current.weeklyHours[key],
          ...patchValue,
        },
      },
    })
  }

  function startEditing() {
    if (availability.data) setDraft(availability.data)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(availability.data ?? null)
    setEditing(false)
  }

  if (!current) {
    return (
      <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      </section>
    )
  }

  return (
    <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[15px] font-bold text-white">Booking availability</h2>
          <p className="mt-1 text-[12px] font-medium leading-5 text-neutral-500">
            Hours buyers can request inspections &amp; test drives.
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" type="button" variant="secondary" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button disabled={save.isPending} size="sm" type="button" onClick={() => save.mutate(current)}>
              {save.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <button
            className="cursor-pointer text-[12px] font-[900!important] text-lime-300 transition hover:text-lime-200"
            type="button"
            onClick={startEditing}
          >
            Edit
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Label>Stand</Label>
        <select
          className="h-11 w-full cursor-pointer rounded-xl border border-white/10 bg-[#17171a] px-4 text-[13px] font-semibold text-white outline-none focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10"
          disabled={editing}
          value={activeLocationId}
          onChange={(event) => {
            setDraft(null)
            setSelectedLocationId(event.target.value)
          }}
        >
          {stands.map((stand) => (
            <option key={stand.id} value={stand.id}>
              {stand.name}{stand.isPrimary ? ' · Primary' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {weekdaySummary && !editing ? (
          <div className="flex items-center justify-between rounded-xl bg-white/4 px-3 py-2.5">
            <span className="text-[13px] font-bold text-white">{weekdaySummary}</span>
            <span className="h-2 w-2 rounded-full bg-lime-300" />
          </div>
        ) : null}
        {DAYS.map((day) => {
          const entry = weeklyHours[day.key]
          if (!entry) return null
          if (weekdaySummary && !editing && ['mon', 'tue', 'wed', 'thu', 'fri'].includes(day.key)) {
            return null
          }
          return (
            <div className="rounded-xl bg-white/4 px-3 py-2.5" key={day.key}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] font-bold text-white">{day.label}</div>
                {editing ? (
                  <Toggle enabled={entry.enabled} onChange={(enabled) => updateDay(day.key, { enabled })} />
                ) : (
                  <span className={cn('h-2 w-2 rounded-full', entry.enabled ? 'bg-lime-300' : 'bg-neutral-600')} />
                )}
              </div>
              {editing ? (
                entry.enabled ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TimeSelect value={entry.open} onChange={(open) => updateDay(day.key, { open })} />
                    <span className="text-[12px] font-bold text-neutral-500">to</span>
                    <TimeSelect value={entry.close} onChange={(close) => updateDay(day.key, { close })} />
                  </div>
                ) : (
                  <div className="mt-2 text-[12px] font-medium text-neutral-600">Closed</div>
                )
              ) : (
                <div className={cn('mt-1 text-[12px] font-medium', entry.enabled ? 'text-neutral-400' : 'text-neutral-600')}>
                  {formatHoursLabel(entry)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
          <Label className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Slot length</Label>
          {editing ? (
            <select
              className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#17171a] px-3 text-[13px] font-semibold text-white outline-none"
              value={current.slotLengthMinutes}
              onChange={(event) =>
                setDraft({ ...current, slotLengthMinutes: Number(event.target.value) })
              }
            >
              {SLOT_LENGTHS.map((value) => (
                <option key={value} value={value}>
                  {value} min
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 text-[15px] font-bold text-white">{current.slotLengthMinutes} min</div>
          )}
        </div>
        <div className="rounded-xl border border-white/8 bg-black/20 p-3">
          <Label className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Max/day</Label>
          {editing ? (
            <select
              className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#17171a] px-3 text-[13px] font-semibold text-white outline-none"
              value={current.maxBookingsPerDay}
              onChange={(event) =>
                setDraft({ ...current, maxBookingsPerDay: Number(event.target.value) })
              }
            >
              {MAX_PER_DAY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 text-[15px] font-bold text-white">{current.maxBookingsPerDay}</div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input className="h-10" type="date" value={blockDate} onChange={(event) => setBlockDate(event.target.value)} />
            <Button
              disabled={!blockDate}
              type="button"
              variant="secondary"
              onClick={() => {
                if (!blockDate || current.blockedDates.includes(blockDate)) return
                setDraft({
                  ...current,
                  blockedDates: [...current.blockedDates, blockDate].sort(),
                })
                setBlockDate('')
              }}
            >
              Block date
            </Button>
          </div>
          {current.blockedDates.length ? (
            <div className="flex flex-wrap gap-2">
              {current.blockedDates.map((dateValue) => (
                <button
                  className="rounded-full bg-white/8 px-3 py-1 text-[11px] font-bold text-neutral-300 transition hover:bg-white/12"
                  key={dateValue}
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...current,
                      blockedDates: current.blockedDates.filter((item) => item !== dateValue),
                    })
                  }
                >
                  {dateValue} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <Button className="mt-4 w-full border-dashed" type="button" variant="secondary" onClick={startEditing}>
          <Calendar className="h-4 w-4" />
          Block off dates
        </Button>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-lime-300/20 bg-lime-300/6 px-3 py-3 text-[12px] font-medium leading-5 text-neutral-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-lime-300" />
        Buyers can only request slots inside these hours.
      </div>
    </section>
  )
}
