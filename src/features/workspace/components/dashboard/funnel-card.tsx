import { Card, CardTitle } from '@/components/ui'
import type { Appointment, Lead, Vehicle } from '@/features/workspace/types'
import { cn } from '@/lib/utils'

type FunnelCardProps = {
  leads: Lead[]
  appointments: Appointment[]
  vehicles: Vehicle[]
}

function FunnelRow({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'lime' | 'blue' | 'amber' }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-[14px] font-semibold text-neutral-400">{label}</span>
        <span className="font-display text-[16px] font-semibold text-white">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'lime' && 'bg-lime-300',
            tone === 'blue' && 'bg-blue-400',
            tone === 'amber' && 'bg-amber-300',
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

export function FunnelCard({ leads, appointments, vehicles }: FunnelCardProps) {
  const contactedLeads = leads.filter((lead) => lead.stage && lead.stage !== 'new').length
  const soldVehicles = vehicles.filter((vehicle) => vehicle.status === 'sold').length
  const rows = [
    { label: 'Leads', value: leads.length, tone: 'lime' },
    { label: 'Contacted', value: contactedLeads, tone: 'lime' },
    { label: 'Inspections', value: appointments.length, tone: 'blue' },
    { label: 'Sold', value: soldVehicles, tone: 'amber' },
  ].filter((row) => row.value > 0) as Array<{ label: string; value: number; tone: 'lime' | 'blue' | 'amber' }>
  const max = Math.max(...rows.map((row) => row.value), 1)

  if (rows.length === 0) return null

  return (
    <Card className="p-5">
      <CardTitle>This week’s funnel</CardTitle>
      <div className="mt-6 space-y-5">
        {rows.map((row) => (
          <FunnelRow key={row.label} label={row.label} max={max} tone={row.tone} value={row.value} />
        ))}
      </div>
    </Card>
  )
}
