import type { Vehicle } from '@/features/workspace/types'

export function vehicleTitle(vehicle: Vehicle) {
  return [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
}

export function vehicleImageUrl(vehicle: Vehicle) {
  return (
    vehicle.coverMedia?.url ??
    vehicle.media?.find((item) => item.kind === 'photo' && item.url)?.url ??
    vehicle.media?.find((item) => item.url)?.url
  )
}
