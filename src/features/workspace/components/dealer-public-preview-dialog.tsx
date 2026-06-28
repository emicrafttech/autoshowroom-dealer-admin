import { useQuery } from '@tanstack/react-query'
import { MapPin, Play, ShieldCheck, Smartphone } from 'lucide-react'
import { BlurImage } from '@/components/blur-image'
import { Dialog, Skeleton } from '@/components/ui'
import type { Paginated } from '@/features/workspace/types'
import { api } from '@/lib/api'
import { cn, formatCompactNgn, unwrapList } from '@/lib/utils'

export type DealerPublicPreview = {
  name: string
  slug?: string
  description?: string
  area?: string
  address?: string
  logoUrl?: string
  verified?: boolean
}

type PublicPreviewVehicle = {
  id: string
  make: string
  model: string
  year: number
  trim?: string
  priceNgn: number
  status?: string
  coverMedia?: { url?: string; thumbnailUrl?: string }
  media?: { kind?: string }[]
}

function formatCompactCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}K`
  return String(value)
}

function dealerInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'D'
}

function listingTitle(vehicle: PublicPreviewVehicle) {
  return [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="font-display text-[17px] font-extrabold text-white">{value}</p>
      <p className="text-[10px] font-semibold text-neutral-500">{label}</p>
    </div>
  )
}

function ListingTile({ vehicle }: { vehicle: PublicPreviewVehicle }) {
  const imageUrl = vehicle.coverMedia?.thumbnailUrl || vehicle.coverMedia?.url
  const clipCount = vehicle.media?.filter((item) => item.kind === 'video').length ?? 0
  const sold = vehicle.status === 'sold'

  return (
    <div className="relative aspect-square overflow-hidden bg-[#141419]">
      {imageUrl ? (
        <BlurImage
          alt={listingTitle(vehicle)}
          className={cn('h-full w-full object-cover', sold && 'brightness-[0.7] grayscale-[0.6]')}
          src={imageUrl}
        />
      ) : (
        <div className="h-full w-full bg-[#141419]" />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-1.5 pb-1.5 pt-8">
        <span className="block truncate text-[9px] font-bold text-white">
          {vehicle.year} {listingTitle(vehicle)}
        </span>
        <span className="block text-[9px] font-extrabold text-lime-300">
          {formatCompactNgn(vehicle.priceNgn)}
        </span>
      </span>
      {sold ? (
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
          Sold
        </span>
      ) : clipCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
          <Play className="size-2 fill-white text-white" />
          {clipCount}
        </span>
      ) : null}
    </div>
  )
}

function PreviewFrame({ dealer }: { dealer: DealerPublicPreview }) {
  const listings = useQuery({
    queryKey: ['dealer-public-preview', dealer.slug],
    queryFn: () =>
      api<Paginated<PublicPreviewVehicle> | PublicPreviewVehicle[]>(
        `/v1/feed?dealerSlug=${encodeURIComponent(dealer.slug ?? '')}`,
      ),
    enabled: Boolean(dealer.slug),
  })
  const vehicles = unwrapList(listings.data)
  const clipCount = vehicles.reduce(
    (total, vehicle) =>
      total + (vehicle.media?.filter((item) => item.kind === 'video').length ?? 0),
    0,
  )

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0a0b0d] shadow-2xl shadow-black/40">
      <div className="flex items-center justify-center gap-2 border-b border-white/8 bg-black/30 px-4 py-2.5">
        <Smartphone className="h-3.5 w-3.5 text-neutral-500" />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          Buyer app preview
        </span>
      </div>

      <div className="px-4 pb-5 pt-4">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-lime-300 font-display text-[22px] font-bold text-neutral-950">
            {dealer.logoUrl ? (
              <BlurImage alt={`${dealer.name} logo`} className="h-full w-full object-cover" src={dealer.logoUrl} />
            ) : (
              dealerInitials(dealer.name)
            )}
          </div>
          <div className="flex flex-1">
            <ProfileStat label="Listings" value={formatCompactCount(vehicles.length)} />
            <ProfileStat label="Views" value="—" />
            <ProfileStat label="Clips" value={formatCompactCount(clipCount)} />
          </div>
        </div>

        <div className="mt-4">
          <h3 className="flex items-center gap-1.5 font-display text-[18px] font-extrabold text-white">
            {dealer.name}
            {dealer.verified ? <ShieldCheck className="size-4 fill-lime-300 text-lime-300" /> : null}
          </h3>
          {dealer.area ? (
            <p className="mt-0.5 text-[13px] font-semibold text-neutral-400">{dealer.area}</p>
          ) : null}
          {dealer.description?.trim() ? (
            <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">{dealer.description}</p>
          ) : (
            <p className="mt-2 text-[13px] italic text-neutral-600">No description added yet.</p>
          )}
          {dealer.address ? (
            <p className="mt-2 flex items-start gap-1.5 text-[12px] font-semibold text-neutral-500">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-lime-300" />
              {dealer.address}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/8">
        <p className="border-b border-white/8 py-2.5 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
          Listings
        </p>
        {listings.isLoading ? (
          <div className="grid grid-cols-3 gap-px bg-white/8 p-px">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton className="aspect-square rounded-none" key={index} />
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-3 gap-px bg-white/8">
            {vehicles.map((vehicle) => (
              <ListingTile key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-[13px] font-semibold text-neutral-500">
            {dealer.slug
              ? 'No live listings right now.'
              : 'Your stand link is not ready yet.'}
          </p>
        )}
      </div>
    </div>
  )
}

export function DealerPublicPreviewDialog({
  open,
  dealer,
  onClose,
}: {
  open: boolean
  dealer: DealerPublicPreview
  onClose: () => void
}) {
  return (
    <Dialog
      open={open}
      panelClassName="max-w-[440px]"
      title="Public stand preview"
      onClose={onClose}
    >
      <div className="space-y-4">
        <p className="text-[13px] font-medium leading-6 text-neutral-400">
          This is how buyers see your dealership inside the AutoShowroom app.
          Only approved, live listings appear here.
        </p>
        <PreviewFrame dealer={dealer} />
      </div>
    </Dialog>
  )
}
