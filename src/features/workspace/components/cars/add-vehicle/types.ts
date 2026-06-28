export type VehicleDraftForm = {
  make: string
  model: string
  year: string
  trim: string
  bodyType: string
  mileageKm: string
  transmission: string
  fuel: string
  colour: string
  vin: string
  notes: string
  priceNgn: string
  importType: 'tokunbo' | 'locally_used' | 'brand_new'
  negotiable: boolean
  locationId: string
}

export type SelectedMedia = {
  id: string
  file: File
  kind: 'photo' | 'video'
  previewUrl: string
}

export type UploadProgress = {
  phase: 'creating' | 'uploading' | 'finalizing' | 'complete'
  currentFileName?: string
  currentIndex: number
  totalFiles: number
  loadedBytes: number
  totalBytes: number
  percent: number
}

export type CatalogMakesResponse = {
  makes: Array<string | { name: string }>
  source: string
}

export type CatalogModelsResponse = {
  make: string
  year?: number | null
  models: Array<string | { name: string }>
  source: string
}

export type UploadSessionResponse = {
  items: Array<{
    mediaId: string
    uploadUrl: string
    publicUrl: string
  }>
}

export type UpdateVehicleField = <Key extends keyof VehicleDraftForm>(key: Key, value: VehicleDraftForm[Key]) => void

export const defaultVehicleDraftForm: VehicleDraftForm = {
  make: '',
  model: '',
  year: String(new Date().getFullYear()),
  trim: '',
  bodyType: 'sedan',
  mileageKm: '',
  transmission: 'automatic',
  fuel: 'petrol',
  colour: '',
  vin: '',
  notes: '',
  priceNgn: '',
  importType: 'tokunbo',
  negotiable: true,
  locationId: '',
}
