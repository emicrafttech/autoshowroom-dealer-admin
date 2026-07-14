import { useQuery } from '@tanstack/react-query'
import { BarChart3, CarFront, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { routes } from '@/lib/routes'
import { formatNgn } from '@/lib/utils'

type DealerInsights = {
  analyticsTier?: 'basic' | 'full'
  soldValueNgn?: number
  soldCount: number
  leadCount?: number
  leadSources?: Array<{ source: string; count: number }>
  carsByMakeModel?: Array<{ make: string; model: string; count: number }>
}

function titleize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function InsightCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof TrendingUp }) {
  return (
    <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold text-neutral-500">{label}</div>
          <div className="mt-3 font-display text-[31px] font-semibold text-white">{value}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/15 text-lime-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  )
}

export function InsightsPage() {
  const insights = useQuery({
    queryKey: ['dealer-insights'],
    queryFn: () => api<DealerInsights>('/v1/dealers/me/insights'),
  })
  const data = insights.data
  const isFull = data?.analyticsTier === 'full'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Insights</h1>
          <p className="mt-2 text-[14px] font-medium text-neutral-400">
            {isFull
              ? 'Sales value, lead sources, and lot composition.'
              : 'Basic analytics on Starter. Upgrade to Growth for full insights.'}
          </p>
        </div>
        {!isFull ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white/10 px-4 text-[13px] font-semibold text-white hover:bg-white/15"
            to={routes.billing}
          >
            Upgrade for full analytics
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard icon={TrendingUp} label="Sold value" value={formatNgn(data?.soldValueNgn ?? 0)} />
        <InsightCard icon={CarFront} label="Sold cars" value={data?.soldCount ?? 0} />
        <InsightCard
          icon={Users}
          label={isFull ? 'Lead sources' : 'Leads'}
          value={isFull ? (data?.leadSources?.length ?? 0) : (data?.leadCount ?? 0)}
        />
      </div>

      {isFull ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[20px] font-semibold text-white">Lead sources</h2>
            <div className="mt-4 space-y-3">
              {data?.leadSources?.length ? data.leadSources.map((item) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-4" key={item.source}>
                  <span className="font-semibold text-neutral-300">{titleize(item.source)}</span>
                  <span className="font-[900!important] text-lime-300">{item.count}</span>
                </div>
              )) : <EmptyState label="No lead source data yet." />}
            </div>
          </section>

          <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[20px] font-semibold text-white">Cars in lot by make/model</h2>
            <div className="mt-4 space-y-3">
              {data?.carsByMakeModel?.length ? data.carsByMakeModel.map((item) => (
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-4" key={`${item.make}-${item.model}`}>
                  <span className="font-semibold text-neutral-300">{item.make} {item.model}</span>
                  <span className="font-[900!important] text-lime-300">{item.count}</span>
                </div>
              )) : <EmptyState label="No inventory data yet." />}
            </div>
          </section>
        </div>
      ) : (
        <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/15 text-lime-300">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-[20px] font-semibold text-white">Full analytics locked</h2>
              <p className="mt-2 text-[14px] font-medium text-neutral-400">
                Growth and Prestige unlock lead-source breakdowns, lot composition, and deeper performance views.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-[13px] font-semibold text-neutral-500">{label}</div>
}
