import { ActionItemsCard } from '@/features/workspace/components/dashboard/action-items-card'
import { FeaturedVehicleCard } from '@/features/workspace/components/dashboard/featured-vehicle-card'
import { FunnelCard } from '@/features/workspace/components/dashboard/funnel-card'
import { ScheduleCard } from '@/features/workspace/components/dashboard/schedule-card'
import type { Appointment, BillingSummary, DealerProfile, Lead, Vehicle } from '@/features/workspace/types'

type DashboardOperationsProps = {
  leads: Lead[]
  appointments: Appointment[]
  vehicles: Vehicle[]
  summary?: BillingSummary
  profile?: DealerProfile
}

export function DashboardOperations({ leads, appointments, vehicles, summary, profile }: DashboardOperationsProps) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
      <div className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
        <ActionItemsCard
          appointments={appointments}
          leads={leads}
          profile={profile}
          summary={summary}
          vehicles={vehicles}
        />
        <ScheduleCard appointments={appointments} />
      </div>
      <div className="grid gap-5 self-start">
        <FunnelCard appointments={appointments} leads={leads} vehicles={vehicles} />
        <FeaturedVehicleCard vehicle={vehicles[0]} />
      </div>
    </div>
  )
}
