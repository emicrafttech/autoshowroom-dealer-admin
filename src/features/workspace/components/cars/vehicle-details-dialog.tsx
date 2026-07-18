import { ChevronLeft, ChevronRight, Play, Share2, X, Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BlurImage } from '@/components/blur-image'
import { Badge, Button } from '@/components/ui'
import type { Vehicle } from '@/features/workspace/types'
import { vehicleImageUrl, vehicleTitle } from '@/features/workspace/utils'
import { formatCompactNgn, formatRelativeDate } from '@/lib/utils'

type VehicleDetailsDialogProps = {
  vehicle: Vehicle | null
  onClose: () => void
  onEdit: (vehicle: Vehicle) => void
  onShare: (vehicle: Vehicle) => void
}

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/6 px-4 py-3 text-[13px]">
      <span className="font-medium text-neutral-500">{label}</span>
      <span className="font-[900!important] text-white">{value}</span>
    </div>
  )
}

export function VehicleDetailsDialog({ vehicle, onClose, onEdit, onShare }: VehicleDetailsDialogProps) {
  const [fullViewOpen, setFullViewOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [thumbnailStart, setThumbnailStart] = useState(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    setPlaying(false)
    setFullViewOpen(false)
    setSelectedIndex(0)
    setThumbnailStart(0)
  }, [vehicle?.id])

  if (!vehicle) return null

  const title = vehicleTitle(vehicle)
  const media = vehicle.media?.filter((item) => item.url) ?? []
  const videos = media.filter((item) => item.kind === 'video')
  const selectedMedia = media[selectedIndex]
  const heroVideo = selectedMedia?.kind === 'video' ? selectedMedia : null
  const heroImage = selectedMedia?.url ?? vehicleImageUrl(vehicle)
  const visibleThumbnails = media.slice(thumbnailStart, thumbnailStart + 4)
  const canScrollThumbnailsLeft = thumbnailStart > 0
  const canScrollThumbnailsRight = thumbnailStart + 4 < media.length
  const reviewIssues = vehicle.reviewIssues ?? []
  const openReviewIssues = reviewIssues.filter((issue) => issue.status === 'open')

  function selectMedia(index: number) {
    setSelectedIndex(index)
    setPlaying(false)
    videoRef.current?.pause()
  }

  function scrollThumbnails(direction: 'left' | 'right') {
    setThumbnailStart((current) => {
      if (direction === 'left') return Math.max(current - 1, 0)
      return Math.min(current + 1, Math.max(media.length - 4, 0))
    })
  }

  function playHeroVideo() {
    void videoRef.current?.play()
  }

  function openFullView() {
    if (heroImage && !heroVideo) setFullViewOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close listing preview" onClick={onClose} />
      <aside className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-white/10 bg-[#101014] shadow-2xl shadow-black/40">
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 pb-28">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="text-[11px] font-[900!important] uppercase tracking-[0.18em] text-lime-300">Listing preview</div>
              <h2 className="mt-1 truncate font-display text-[25px] font-semibold tracking-[-0.035em] text-white">{title}</h2>
              <p className="mt-1 text-[13px] font-semibold text-neutral-500">
                {vehicle.year} · {vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString()} km` : 'Mileage not set'} · {videos.length} videos
              </p>
            </div>
            <Button aria-label="Close listing preview" size="sm" type="button" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5">
            <div
              className={`relative block aspect-[1.8] w-full overflow-hidden rounded-[18px] bg-black text-left ring-1 ring-white/10 ${heroVideo ? '' : 'cursor-zoom-in'}`}
              role="button"
              tabIndex={0}
              onClick={openFullView}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openFullView()
                }
              }}
            >
              {heroImage ? (
                heroVideo ? (
                  <video
                    className="h-full w-full object-cover"
                    controls={playing}
                    ref={videoRef}
                    src={heroImage}
                    onClick={(event) => {
                      event.stopPropagation()
                      playHeroVideo()
                    }}
                    onPause={() => setPlaying(false)}
                    onPlay={() => setPlaying(true)}
                  />
                ) : (
                  <BlurImage alt={title} className="h-full w-full object-cover" src={heroImage} />
                )
              ) : (
                <div className="grid h-full place-items-center text-sm font-bold uppercase tracking-[0.14em] text-neutral-600">No media</div>
              )}
              {heroVideo ? (
                <>
                  <span className="absolute left-4 top-4 rounded-md bg-black/55 px-2.5 py-1 text-[11px] font-[900!important] uppercase tracking-[0.08em] text-lime-200">Walkaround</span>
                  <button
                    aria-label="Play walkaround video"
                    className={`absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime-300 text-neutral-950 shadow-2xl transition hover:scale-105 ${playing ? 'pointer-events-none opacity-0' : 'cursor-pointer opacity-100'}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      playHeroVideo()
                    }}
                  >
                    <Play className="h-7 w-7 fill-current" />
                  </button>
                </>
              ) : null}
            </div>

            {media.length ? (
              <div className="relative mt-3">
                {canScrollThumbnailsLeft ? (
                  <button
                    aria-label="Show previous media"
                    className="absolute left-0 top-1/2 z-10 grid h-9 w-9 -translate-x-3 -translate-y-1/2 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/10 transition hover:bg-lime-300 hover:text-neutral-950"
                    type="button"
                    onClick={() => scrollThumbnails('left')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}
                <div className="grid grid-cols-4 gap-3">
                  {visibleThumbnails.map((item, index) => {
                    const mediaIndex = thumbnailStart + index
                    const isSelected = mediaIndex === selectedIndex
                    return (
                      <button
                        aria-label={`Show media ${mediaIndex + 1}`}
                        className={`relative aspect-[1.45] cursor-pointer overflow-hidden rounded-xl bg-white/6 text-left ring-2 transition ${isSelected ? 'ring-lime-300' : 'ring-transparent hover:ring-white/20'}`}
                        key={`${item.url}-${mediaIndex}`}
                        type="button"
                        onClick={() => selectMedia(mediaIndex)}
                      >
                        {item.kind === 'video' ? (
                          <video className="h-full w-full object-cover" src={item.url} />
                        ) : (
                          <BlurImage alt="" className="h-full w-full object-cover" src={item.url ?? ''} />
                        )}
                        {item.kind === 'video' ? <Play className="absolute bottom-2 left-2 h-4 w-4 text-white" /> : null}
                      </button>
                    )
                  })}
                </div>
                {canScrollThumbnailsRight ? (
                  <button
                    aria-label="Show next media"
                    className="absolute right-0 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 translate-x-3 place-items-center rounded-full bg-black/80 text-white ring-1 ring-white/10 transition hover:bg-lime-300 hover:text-neutral-950"
                    type="button"
                    onClick={() => scrollThumbnails('right')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="font-display text-[32px] font-semibold tracking-[-0.045em] text-white">{formatCompactNgn(vehicle.priceNgn)}</div>
            <div className="flex items-center gap-2 text-[13px] font-[900!important] text-lime-300">
              <span className="h-2 w-2 rounded-full bg-lime-300" />
              {vehicle.status}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-[14px] border border-white/8 bg-white/5 p-4">
              <div className="font-display text-[20px] font-semibold text-white">0</div>
              <div className="mt-1 text-[11px] font-bold text-neutral-500">Views</div>
            </div>
            <div className="rounded-[14px] border border-white/8 bg-white/5 p-4">
              <div className="font-display text-[20px] font-semibold text-white">0</div>
              <div className="mt-1 text-[11px] font-bold text-neutral-500">Saves</div>
            </div>
            <div className="rounded-[14px] border border-white/8 bg-white/5 p-4">
              <div className="font-display text-[20px] font-semibold text-white">{videos.length}</div>
              <div className="mt-1 text-[11px] font-bold text-neutral-500">Videos</div>
            </div>
          </div>

          <section className="mt-6">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Specifications</div>
            <div className="overflow-hidden rounded-[16px] border border-white/8 bg-black/20">
              <SpecRow label="Year" value={vehicle.year} />
              <SpecRow label="Mileage" value={vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString()} km` : 'Not set'} />
              <SpecRow label="Transmission" value={vehicle.transmission ?? 'Not set'} />
              <SpecRow label="Fuel" value={vehicle.fuel ?? 'Not set'} />
              <SpecRow label="Body type" value={vehicle.bodyType ?? 'Not set'} />
              <SpecRow label="Exterior colour" value={vehicle.colour ?? 'Not set'} />
              <SpecRow label="VIN" value={vehicle.vin ?? 'Not set'} />
              <SpecRow label="Chassis number" value={vehicle.chassisNumber ?? 'Not set'} />
            </div>
          </section>

          {openReviewIssues.length ? (
            <section className="mt-6 rounded-[18px] border border-red-400/20 bg-red-500/8 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-[900!important] uppercase tracking-[0.14em] text-red-200">Review issues</div>
                  <p className="mt-1 text-[13px] font-semibold text-red-100">Fix open items, then submit the listing back for admin review.</p>
                </div>
                <Badge tone="red">{openReviewIssues.length} open</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {openReviewIssues.map((issue) => (
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4" key={issue.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-[900!important] uppercase tracking-[0.12em] text-neutral-400">{issue.category}</div>
                      <Badge tone={issue.status === 'open' ? 'red' : issue.status === 'approved' ? 'lime' : 'amber'}>{issue.status}</Badge>
                    </div>
                    <p className="mt-2 text-[14px] font-semibold leading-6 text-white">{issue.message}</p>
                    {issue.dealerResponse ? (
                      <p className="mt-3 rounded-xl bg-white/6 p-3 text-[13px] font-medium leading-5 text-neutral-300">Dealer response: {issue.dealerResponse}</p>
                    ) : null}
                    {issue.vehicleChanges && Object.keys(issue.vehicleChanges).length ? (
                      <div className="mt-3 rounded-xl border border-white/8 bg-white/5 p-3">
                        <div className="text-[11px] font-[900!important] uppercase tracking-[0.12em] text-neutral-500">Changes since review</div>
                        <div className="mt-2 space-y-1 text-[12px] font-semibold text-neutral-300">
                          {Object.entries(issue.vehicleChanges).slice(0, 4).map(([key, change]) => (
                            <div className="flex justify-between gap-3" key={key}>
                              <span className="capitalize text-neutral-500">{key.replaceAll(/([A-Z])/g, ' $1')}</span>
                              <span className="truncate text-right text-white">{String(change.after ?? 'Not set')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 text-[11px] font-bold text-neutral-600">{formatRelativeDate(issue.createdAt)}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Description</div>
            <p className="text-[14px] font-medium leading-6 text-neutral-300">{vehicle.notes?.trim() || 'No description added yet.'}</p>
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-white/8 px-7 py-5">
          <Button aria-label="Share listing" className="h-12 w-12 px-0" type="button" variant="secondary" onClick={() => onShare(vehicle)}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button className="flex-1" type="button" variant="secondary" onClick={() => onShare(vehicle)}>
            View public page
          </Button>
          <Button className="flex-1" type="button" onClick={() => onEdit(vehicle)}>
            <Pencil className="h-4 w-4" />
            Edit details
          </Button>
        </div>
      </aside>
      {fullViewOpen && heroImage && !heroVideo ? (
        <div className="fixed inset-0 z-60 grid place-items-center bg-black/90 p-5 backdrop-blur-sm">
          <button className="absolute inset-0 cursor-zoom-out" type="button" aria-label="Close full media view" onClick={() => setFullViewOpen(false)} />
          <Button aria-label="Close full media view" className="absolute right-5 top-5 z-10" size="sm" type="button" variant="ghost" onClick={() => setFullViewOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
          <div className="relative z-10 max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-[18px] bg-black ring-1 ring-white/10">
            <img alt={title} className="max-h-[88vh] w-full object-contain" src={heroImage} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
