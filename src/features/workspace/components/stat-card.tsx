import type { ReactNode } from 'react'
import { Card } from '@/components/ui'

export function StatCard({ label, value, helper }: { label: string; value: ReactNode; helper: string }) {
  return (
    <Card>
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-neutral-500">{label}</div>
      <div className="mt-4 font-display text-[34px] font-semibold leading-none tracking-[-0.035em] text-white">{value}</div>
      <p className="mt-3 text-[13.5px] font-medium leading-6 text-neutral-400">{helper}</p>
    </Card>
  )
}
