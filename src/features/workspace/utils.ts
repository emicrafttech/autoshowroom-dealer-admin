import type { Vehicle } from '@/features/workspace/types'

function isMeaningfulTrim(trim?: string | null) {
  const value = trim?.trim()
  if (!value) return false
  return value.toLowerCase() !== 'not specified'
}

export function vehicleTitle(vehicle: Vehicle) {
  return [vehicle.make, vehicle.model, isMeaningfulTrim(vehicle.trim) ? vehicle.trim : null]
    .filter(Boolean)
    .join(' ')
}

export function vehicleImageUrl(vehicle: Vehicle) {
  return (
    vehicle.coverMedia?.url ??
    vehicle.media?.find((item) => item.kind === 'photo' && item.url)?.url ??
    vehicle.media?.find((item) => item.url)?.url
  )
}
