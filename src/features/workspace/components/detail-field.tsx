import type { ReactNode } from 'react'
import { Label } from '@/components/ui'

export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 text-[15px] font-semibold leading-6 text-white">{value}</div>
    </div>
  )
}
