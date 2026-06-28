import type { Vehicle } from '@/features/workspace/types'
import type { SelectedMedia, VehicleDraftForm } from './types'

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function formatNumberInput(value: string) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return Number(digits).toLocaleString('en-NG')
}

export function decimalNumberValue(value: string) {
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '')
  const [integerPart, ...decimalParts] = cleaned.split('.')
  const decimalPart = decimalParts.join('').slice(0, 2)

  if (!cleaned.includes('.')) return integerPart
  return `${integerPart}.${decimalPart}`
}

export function formatDecimalNumberInput(value: string) {
  const normalized = decimalNumberValue(value)
  if (!normalized) return ''

  const [integerPart, decimalPart] = normalized.split('.')
  const formattedInteger = integerPart ? Number(integerPart).toLocaleString('en-NG') : '0'

  if (normalized.includes('.')) return `${formattedInteger}.${decimalPart ?? ''}`
  return formattedInteger
}

export function validateDetails(values: VehicleDraftForm) {
  if (!values.make.trim()) return 'Make is required.'
  if (!values.model.trim()) return 'Model is required.'
  if (!Number(values.year)) return 'Year is required.'
  if (!Number(values.mileageKm)) return 'Mileage is required.'
  if (!values.colour.trim()) return 'Exterior colour is required.'
  return null
}

export function validatePricing(values: VehicleDraftForm) {
  if (!values.priceNgn || Number(values.priceNgn) <= 0) return 'Asking price is required.'
  return null
}

export function mediaRequirementError(media: SelectedMedia[], existingMedia: Vehicle['media'] = []) {
  const totalMedia = media.length + existingMedia.length
  const totalVideos = media.filter((item) => item.kind === 'video').length + existingMedia.filter((item) => item.kind === 'video').length

  if (totalMedia < 6) return 'Add at least 6 clean, sharp media files before publishing.'
  if (totalVideos < 3) return 'Add at least 3 clean, sharp videos before publishing.'
  return null
}

export function normalizeCatalogItems(items: Array<string | { name: string }>) {
  return items.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean)
}

export function buildVehiclePayload(form: VehicleDraftForm) {
  return {
    make: form.make,
    model: form.model,
    year: Number(form.year),
    trim: form.trim.trim() || 'Not specified',
    priceNgn: Number(form.priceNgn),
    mileageKm: Number(form.mileageKm),
    transmission: form.transmission,
    fuel: form.fuel,
    colour: form.colour,
    bodyType: form.bodyType,
    drivetrain: 'fwd',
    conditionGrade: 'good',
    importType: form.importType,
    negotiable: form.negotiable,
    locationId: form.locationId || undefined,
    vin: form.vin || undefined,
    notes: form.notes || undefined,
  }
}
