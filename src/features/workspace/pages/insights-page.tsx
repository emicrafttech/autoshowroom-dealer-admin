import { useQuery } from '@tanstack/react-query'
import { BarChart3, CarFront, TrendingUp, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { formatNgn } from '@/lib/utils'

type DealerInsights = {
  soldValueNgn: number
  soldCount: number
  leadSources: Array<{ source: string; count: number }>
  carsByMakeModel: Array<{ make: string; model: string; count: number }>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Insights</h1>
        <p className="mt-2 text-[14px] font-medium text-neutral-400">Sales value, lead sources, and lot composition.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard icon={TrendingUp} label="Sold value" value={formatNgn(data?.soldValueNgn ?? 0)} />
        <InsightCard icon={CarFront} label="Sold cars" value={data?.soldCount ?? 0} />
        <InsightCard icon={Users} label="Lead sources" value={data?.leadSources.length ?? 0} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-[20px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
          <h2 className="font-display text-[20px] font-semibold text-white">Lead sources</h2>
          <div className="mt-4 space-y-3">
            {data?.leadSources.length ? data.leadSources.map((item) => (
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
            {data?.carsByMakeModel.length ? data.carsByMakeModel.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/20 p-4" key={`${item.make}-${item.model}`}>
                <span className="font-semibold text-neutral-300">{item.make} {item.model}</span>
                <span className="font-[900!important] text-lime-300">{item.count}</span>
              </div>
            )) : <EmptyState label="No inventory data yet." />}
          </div>
        </section>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[13px] font-semibold text-neutral-500">
      <BarChart3 className="mx-auto mb-2 h-5 w-5" />
      {label}
    </div>
  )
}
