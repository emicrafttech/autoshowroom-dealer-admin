import { Plus, Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { formatCompactNgn } from '@/lib/utils'

type CarsHeaderProps = {
  vehicleCount: number
  totalValue: number
  search: string
  canBulkUpload?: boolean
  activeListings?: number
  listingLimit?: number | null
  canPublish?: boolean
  onSearchChange: (value: string) => void
  onAddVehicle: () => void
  onBulkUpload?: () => void
}

export function CarsHeader({
  vehicleCount,
  totalValue,
  search,
  canBulkUpload = false,
  activeListings = 0,
  listingLimit = null,
  canPublish = true,
  onSearchChange,
  onAddVehicle,
  onBulkUpload,
}: CarsHeaderProps) {
  const listingsLabel =
    listingLimit == null
      ? `${activeListings} / Unlimited`
      : `${activeListings}/${listingLimit}`
  const listingsHelper =
    listingLimit == null
      ? 'Unlimited live listings on your plan'
      : activeListings >= listingLimit
        ? 'At capacity — upgrade or hide older listings'
        : `${listingLimit - activeListings} listing${listingLimit - activeListings === 1 ? '' : 's'} remaining`

  return (
    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Listings</h1>
        <p className="mt-2 text-[14px] font-semibold text-neutral-400">
          {vehicleCount} vehicles · {formatCompactNgn(totalValue)} total value
        </p>
        <p className="mt-2 text-[13px] font-semibold text-lime-200/80">
          Plan listings {listingsLabel} · {listingsHelper}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            className="h-12 rounded-[14px] pl-11"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            value={search}
          />
        </div>
        {canBulkUpload ? (
          <Button className="shrink-0" type="button" variant="secondary" onClick={onBulkUpload}>
            Bulk upload
          </Button>
        ) : (
          <Button
            className="shrink-0"
            type="button"
            variant="secondary"
            onClick={() => {
              window.location.assign('/billing')
            }}
          >
            Upgrade for bulk upload
          </Button>
        )}
        <Button
          className="shrink-0"
          disabled={!canPublish}
          type="button"
          onClick={canPublish ? onAddVehicle : () => window.location.assign('/billing')}
        >
          <Plus className="h-4 w-4" />
          {canPublish ? 'Add Vehicle' : 'Upgrade to add'}
        </Button>
      </div>
    </div>
  )
}
