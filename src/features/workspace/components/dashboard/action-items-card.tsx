import { Link } from 'react-router-dom'
import { CardTitle } from '@/components/ui'
import type { Appointment, DealerProfile, Lead, Vehicle } from '@/features/workspace/types'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

type ActionItemsCardProps = {
  leads: Lead[]
  appointments: Appointment[]
  vehicles: Vehicle[]
  profile?: DealerProfile
}

function actionButtonClass(priority: 'primary' | 'secondary') {
  return cn(
    'inline-flex h-10 min-w-14 items-center justify-center rounded-xl px-4 text-[13px] font-[900!important] transition',
    priority === 'primary'
      ? 'bg-lime-300 text-neutral-950 hover:bg-lime-200'
      : 'bg-white/8 text-neutral-200 ring-1 ring-white/8 hover:bg-white/12',
  )
}

export function ActionItemsCard({ leads, appointments, vehicles, profile }: ActionItemsCardProps) {
  const staleVehicles = vehicles.filter((vehicle) => {
    if (!vehicle.updatedAt) return false
    return Date.now() - new Date(vehicle.updatedAt).getTime() > 14 * 86_400_000
  })
  const setupNeeded = [
    !profile?.locations.length,
    !profile?.whatsapp,
    profile?.verificationStatus === 'not_submitted',
  ].filter(Boolean).length

  const items = [
    {
      tone: 'red',
      title: `${leads.length} leads awaiting first contact`,
      helper: 'Review new buyer requests from active stock.',
      action: 'Open',
      to: routes.leads,
      primary: leads.length > 0,
      active: leads.length > 0,
    },
    {
      tone: 'lime',
      title: `${appointments.length} inspections in schedule`,
      helper: appointments[0]?.vehicleTitle ? `Next: ${appointments[0].vehicleTitle}` : 'Review scheduled buyer inspections.',
      action: 'View',
      to: routes.bookings,
      primary: false,
      active: appointments.length > 0,
    },
    {
      tone: 'amber',
      title: `${staleVehicles.length} vehicles stale (14+ days)`,
      helper: 'Refresh older stock so listings stay visible.',
      action: 'Fix',
      to: routes.stock,
      primary: false,
      active: staleVehicles.length > 0,
    },
    {
      tone: 'blue',
      title: `${setupNeeded} setup gates need attention`,
      helper: 'Complete account setup items before gated actions are needed.',
      action: 'See',
      to: routes.account,
      primary: false,
      active: setupNeeded > 0,
    },
  ].filter((item) => item.active)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <CardTitle>Action items</CardTitle>
        <div className="text-[13px] font-bold text-neutral-500">{items.length} need you</div>
      </div>
      <div className="space-y-3">
        {items.length ? items.map((item) => (
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-white/8 bg-black/25 p-4" key={item.title}>
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={cn(
                  'mt-1.5 h-3 w-3 shrink-0 rounded-full',
                  item.tone === 'red' && 'bg-red-400',
                  item.tone === 'lime' && 'bg-lime-300',
                  item.tone === 'amber' && 'bg-amber-300',
                  item.tone === 'blue' && 'bg-blue-400',
                )}
              />
              <div className="min-w-0">
                <div className="font-display text-[16px] font-semibold tracking-[-0.02em] text-white">{item.title}</div>
                <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-400">{item.helper}</p>
              </div>
            </div>
            <Link className={actionButtonClass(item.primary ? 'primary' : 'secondary')} to={item.to}>
              {item.action}
            </Link>
          </div>
        )) : (
          <div className="rounded-[14px] border border-white/8 bg-black/25 px-4 py-6 text-sm font-semibold text-neutral-500">
            No action items need attention right now.
          </div>
        )}
      </div>
    </div>
  )
}
