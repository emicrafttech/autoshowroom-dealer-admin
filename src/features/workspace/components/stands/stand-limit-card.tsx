import { Badge, Card, CardDescription, CardTitle } from '@/components/ui'
import type { BillingSummary } from '@/features/workspace/types'

export function StandLimitCard({ summary }: { summary?: BillingSummary }) {
  return (
    <Card className="mb-4 border-lime-300/20 bg-lime-300/8 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lime-100">Stands are unlimited</CardTitle>
          <CardDescription className="text-lime-100/70">
            {summary?.standCount ?? 0} stand{(summary?.standCount ?? 0) === 1 ? '' : 's'} on this account.
            Plans no longer limit how many stands you can add.
          </CardDescription>
        </div>
        <Badge tone="lime">Unlimited</Badge>
      </div>
    </Card>
  )
}
