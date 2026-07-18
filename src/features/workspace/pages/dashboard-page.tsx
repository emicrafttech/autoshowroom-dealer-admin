import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { DashboardOperations } from '@/features/workspace/components/dashboard/dashboard-operations'
import { PageHeader } from '@/features/workspace/components/page-header'
import { StatCard } from '@/features/workspace/components/stat-card'
import type { Appointment, BillingSummary, DealerProfile, Lead, Paginated, Vehicle } from '@/features/workspace/types'
import { api } from '@/lib/api'
import { routes } from '@/lib/routes'
import { unwrapList } from '@/lib/utils'

const quickActions = [
  { label: 'Create listing', to: routes.stock },
  { label: 'Review leads', to: routes.leads },
  { label: 'Open billing', to: routes.billing },
]

export function DashboardPage() {
  const summary = useQuery({ queryKey: ['billing-summary'], queryFn: () => api<BillingSummary>('/v1/billing/summary') })
  const profile = useQuery({ queryKey: ['dealer-profile'], queryFn: () => api<DealerProfile>('/v1/dealers/me') })
  const leads = useQuery({ queryKey: ['leads'], queryFn: () => api<Paginated<Lead>>('/v1/leads') })
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: () => api<Paginated<Appointment>>('/v1/appointments') })
  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Paginated<Vehicle>>('/v1/vehicles') })

  return (
    <>
      <PageHeader title="Dashboard" description="Operational snapshot for stock, leads, bookings, and setup readiness." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Active listings" value={summary.data?.activeListings ?? <Skeleton className="h-9 w-20" />} helper={`${summary.data?.listingLimit ?? 0} listing limit`} />
        <StatCard label="New leads" value={unwrapList(leads.data).length} helper="From active stock and contact surfaces" />
        <StatCard label="Appointments" value={unwrapList(appointments.data).length} helper="Upcoming inspections and visits" />
      </div>
      <Card className="mt-5">
        <CardHeader>
          <div>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common dealer workflows are one click from the dashboard.</CardDescription>
          </div>
        </CardHeader>
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-white/8 px-5 text-[15px] font-[900!important] text-neutral-100 ring-1 ring-white/10 transition hover:bg-white/12"
              key={action.label}
              to={action.to}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </Card>
      <DashboardOperations
        appointments={unwrapList(appointments.data)}
        leads={unwrapList(leads.data)}
        profile={profile.data}
        vehicles={unwrapList(vehicles.data)}
      />
    </>
  )
}
