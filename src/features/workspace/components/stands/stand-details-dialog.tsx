import { Badge, Dialog } from '@/components/ui'
import { DetailField } from '@/features/workspace/components/detail-field'
import type { DealerLocation } from '@/features/workspace/types'
import { formatDate } from '@/lib/utils'

type StandDetailsDialogProps = {
  stand: DealerLocation | null
  onClose: () => void
}

export function StandDetailsDialog({ stand, onClose }: StandDetailsDialogProps) {
  return (
    <Dialog open={Boolean(stand)} title={stand?.name ?? 'Stand details'} onClose={onClose}>
      {stand ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={stand.isPrimary ? 'lime' : 'slate'}>{stand.isPrimary ? 'Primary stand' : 'Secondary stand'}</Badge>
            <Badge tone={stand.premisesVerificationStatus === 'verified' ? 'lime' : 'amber'}>
              {stand.premisesVerificationStatus}
            </Badge>
          </div>
          <DetailField label="Area" value={stand.area ?? 'Not set'} />
          <DetailField label="District" value={stand.districtSlug ?? 'Not set'} />
          <DetailField label="City" value={stand.citySlug ?? 'Not set'} />
          <DetailField label="Address" value={stand.address?.trim() || 'Not set'} />
          {stand.premisesRejectionReason ? (
            <DetailField label="Rejection reason" value={stand.premisesRejectionReason} />
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Created" value={stand.createdAt ? formatDate(stand.createdAt) : 'Not set'} />
            <DetailField label="Last updated" value={stand.updatedAt ? formatDate(stand.updatedAt) : 'Not set'} />
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
