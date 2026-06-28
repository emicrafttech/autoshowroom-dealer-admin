import { Badge, Card, CardDescription, CardTitle } from '@/components/ui'
import type { BillingSummary } from '@/features/workspace/types'

export function StandLimitCard({ summary }: { summary?: BillingSummary }) {
  const canAddStand = summary?.canAddStand

  return (
    <Card
      className={
        canAddStand
          ? 'mb-4 border-lime-300/20 bg-lime-300/8 shadow-none'
          : 'mb-4 border-amber-300/30 bg-amber-300/10 shadow-none'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className={canAddStand ? 'text-lime-100' : 'text-amber-100'}>
            {canAddStand ? 'Stand capacity available' : 'Stand limit reached'}
          </CardTitle>
          <CardDescription className={canAddStand ? 'text-lime-100/70' : 'text-amber-100/75'}>
            {summary?.standCount ?? 0} of {summary?.standLimit ?? 1} stands used on the current plan.
            {!canAddStand ? ' Upgrade your plan before adding another stand.' : ''}
          </CardDescription>
        </div>
        <Badge tone={canAddStand ? 'lime' : 'amber'}>{canAddStand ? 'Can add stand' : 'Limit reached'}</Badge>
      </div>
    </Card>
  )
}
