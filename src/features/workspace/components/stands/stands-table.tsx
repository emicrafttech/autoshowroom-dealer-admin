import { Badge, Button, Table } from '@/components/ui'
import type { DealerLocation } from '@/features/workspace/types'

type StandsTableProps = {
  locations: DealerLocation[]
  onView: (location: DealerLocation) => void
  onSetPrimary: (id: string) => void
  onDelete: (id: string) => void
}

export function StandsTable({ locations, onView, onSetPrimary, onDelete }: StandsTableProps) {
  const rows = locations.map((location) => [
    <div className="font-semibold text-white" key="name">{location.name}</div>,
    location.area ?? location.districtSlug ?? 'Not set',
    <Badge key="primary" tone={location.isPrimary ? 'lime' : 'slate'}>{location.isPrimary ? 'Primary' : 'Secondary'}</Badge>,
    <Badge key="verification" tone={location.premisesVerificationStatus === 'verified' ? 'lime' : 'amber'}>{location.premisesVerificationStatus}</Badge>,
    <div className="flex flex-wrap gap-2" key="actions">
      <Button size="sm" type="button" variant="secondary" onClick={() => onView(location)}>
        View
      </Button>
      {!location.isPrimary ? (
        <Button size="sm" type="button" variant="secondary" onClick={() => onSetPrimary(location.id)}>
          Set primary
        </Button>
      ) : null}
      <Button size="sm" type="button" variant="danger" onClick={() => onDelete(location.id)}>
        Delete
      </Button>
    </div>,
  ])

  return <Table columns={['Stand', 'Area', 'Primary', 'Verification', 'Actions']} rows={rows} />
}
