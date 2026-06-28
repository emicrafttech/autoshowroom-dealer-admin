import { Eye } from 'lucide-react'
import { BlurImage } from '@/components/blur-image'
import { Card, CardDescription, CardTitle } from '@/components/ui'
import type { Vehicle } from '@/features/workspace/types'
import { vehicleImageUrl, vehicleTitle } from '@/features/workspace/utils'
import { formatCompactNgn } from '@/lib/utils'

export function FeaturedVehicleCard({ vehicle }: { vehicle?: Vehicle }) {
  const imageUrl = vehicle ? vehicleImageUrl(vehicle) : undefined

  return (
    <Card className="p-5">
      <CardTitle>Top listing</CardTitle>
      <CardDescription>Most recent vehicle in your inventory feed.</CardDescription>
      {vehicle ? (
        <div className="mt-5 flex items-center gap-4">
          <div className="h-[72px] w-[112px] overflow-hidden rounded-[14px] bg-white/8 ring-1 ring-white/8">
            {imageUrl ? (
              <BlurImage alt={vehicleTitle(vehicle)} className="h-full w-full object-cover" src={imageUrl} />
            ) : (
              <div className="grid h-full place-items-center text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-600">No image</div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] font-semibold tracking-[-0.02em] text-white">{vehicleTitle(vehicle)}</div>
            <div className="mt-1 text-[13px] font-medium text-neutral-400">{vehicle.year} · {formatCompactNgn(vehicle.priceNgn)}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold text-lime-300">
              <Eye className="h-4 w-4" />
              {vehicle.status} · {vehicle.listingVerificationStatus ?? vehicle.reviewStatus ?? 'draft'}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[14px] border border-white/8 bg-black/25 px-4 py-5 text-sm font-semibold text-neutral-500">
          Add a vehicle to see a featured listing here.
        </div>
      )}
    </Card>
  )
}
