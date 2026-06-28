import { CardTitle } from '@/components/ui'
import type { Appointment } from '@/features/workspace/types'
import { cn } from '@/lib/utils'

function formatTime(value?: string | null) {
  if (!value) return 'TBD'
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export function ScheduleCard({ appointments }: { appointments: Appointment[] }) {
  const schedule = appointments.slice(0, 3)

  return (
    <div className="mt-7">
      <CardTitle>Upcoming schedule</CardTitle>
      <div className="mt-4 space-y-3">
        {schedule.length ? (
          schedule.map((appointment, index) => (
            <div className="grid grid-cols-[56px_1fr] items-center gap-4" key={appointment.id}>
              <div className={cn('font-display text-[14px] font-semibold', index === 1 ? 'text-lime-300' : 'text-neutral-400')}>
                {formatTime(appointment.scheduledAt)}
              </div>
              <div
                className={cn(
                  'rounded-[14px] border bg-black/25 px-4 py-3',
                  index === 0 && 'border-blue-400/35',
                  index === 1 && 'border-lime-300/45',
                  index >= 2 && 'border-amber-300/35',
                )}
              >
                <span className="font-display text-[15px] font-semibold text-white">{appointment.buyerName ?? 'Buyer'}</span>
                <span className="ml-2 text-[12.5px] font-medium text-neutral-400">{appointment.vehicleTitle ?? 'Inspection booking'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[14px] border border-white/8 bg-black/25 px-4 py-5 text-sm font-semibold text-neutral-500">
            No inspections scheduled yet.
          </div>
        )}
      </div>
    </div>
  )
}
