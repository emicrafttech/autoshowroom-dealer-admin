import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Label, Textarea } from '@/components/ui'
import type { DealerLocation, Paginated, Vehicle, VehicleReviewIssue } from '@/features/workspace/types'
import { api, patch, post } from '@/lib/api'
import { unwrapList } from '@/lib/utils'
import { uploadVehicleMedia } from './add-vehicle/api'
import { DetailsStep } from './add-vehicle/details-step'
import { buildVehiclePayload, mediaRequirementError, normalizeCatalogItems, validateDetails, validatePricing } from './add-vehicle/helpers'
import { MediaStep } from './add-vehicle/media-step'
import { PublishStep } from './add-vehicle/publish-step'
import { ReviewConfirmationModal } from './add-vehicle/review-confirmation-modal'
import { Stepper } from './add-vehicle/stepper'
import {
  defaultVehicleDraftForm,
  type CatalogMakesResponse,
  type CatalogModelsResponse,
  type CatalogTrimsResponse,
  type SelectedMedia,
  type UpdateVehicleField,
  type UploadProgress,
  type VehicleDraftForm,
} from './add-vehicle/types'

type AddVehicleDialogProps = {
  editingVehicle?: Vehicle | null
  open: boolean
  onClose: () => void
  onComplete: () => void
}

function ReviewIssueContext({
  issues,
  responses,
  onResponseChange,
}: {
  issues: VehicleReviewIssue[]
  responses: Record<string, string>
  onResponseChange: (issueId: string, value: string) => void
}) {
  if (!issues.length) return null

  return (
    <section className="mb-6 rounded-[18px] border border-red-400/20 bg-red-500/8 p-4">
      <div className="text-[11px] font-[900!important] uppercase tracking-[0.14em] text-red-200">Admin review issues</div>
      <p className="mt-1 text-[13px] font-semibold leading-5 text-red-100">Update the listing, then add a response for each open issue before submitting it back for review.</p>
      <div className="mt-4 space-y-4">
        {issues.map((issue) => (
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4" key={issue.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[12px] font-[900!important] uppercase tracking-[0.12em] text-neutral-400">{issue.category}</div>
              <Badge tone={issue.status === 'open' ? 'red' : 'amber'}>{issue.status}</Badge>
            </div>
            <p className="mt-2 text-[14px] font-semibold leading-6 text-white">{issue.message}</p>
            <div className="mt-4 space-y-2">
              <Label>Resolution note</Label>
              <Textarea
                placeholder="Explain what you changed to resolve this issue."
                value={responses[issue.id] ?? ''}
                onChange={(event) => onResponseChange(issue.id, event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function vehicleToDraftForm(vehicle: Vehicle): VehicleDraftForm {
  return {
    ...defaultVehicleDraftForm,
    make: vehicle.make ?? '',
    model: vehicle.model ?? '',
    year: String(vehicle.year ?? new Date().getFullYear()),
    trim: vehicle.trim ?? '',
    bodyType: vehicle.bodyType ?? defaultVehicleDraftForm.bodyType,
    mileageKm: String(vehicle.mileageKm ?? ''),
    transmission: vehicle.transmission ?? defaultVehicleDraftForm.transmission,
    fuel: vehicle.fuel ?? defaultVehicleDraftForm.fuel,
    colour: vehicle.colour ?? '',
    vin: vehicle.vin ?? '',
    chassisNumber: vehicle.chassisNumber ?? '',
    yearOfManufacture: vehicle.yearOfManufacture ? String(vehicle.yearOfManufacture) : '',
    engineCapacityCc: vehicle.engineCapacityCc ? String(vehicle.engineCapacityCc) : '',
    registrationPlate: vehicle.registrationPlate ?? '',
    registrationState: vehicle.registrationState ?? '',
    registrationLga: vehicle.registrationLga ?? '',
    customsDutyStatus: vehicle.customsDutyStatus ?? defaultVehicleDraftForm.customsDutyStatus,
    customsReference: vehicle.customsReference ?? '',
    bodyHistory: vehicle.bodyHistory ?? defaultVehicleDraftForm.bodyHistory,
    papersStatus: vehicle.papersStatus ?? defaultVehicleDraftForm.papersStatus,
    dutyPaidClaim: vehicle.dutyPaidClaim ?? defaultVehicleDraftForm.dutyPaidClaim,
    listingTrust: vehicle.listingTrust ?? '',
    notes: vehicle.notes ?? '',
    priceNgn: String(vehicle.priceNgn ?? ''),
    negotiable: vehicle.negotiable ?? true,
    locationId: vehicle.locationId ?? '',
  }
}

export function AddVehicleDialog({ editingVehicle = null, open, onClose, onComplete }: AddVehicleDialogProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<VehicleDraftForm>(defaultVehicleDraftForm)
  const [media, setMedia] = useState<SelectedMedia[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState('')
  const [issueResponses, setIssueResponses] = useState<Record<string, string>>({})
  const [makes, setMakes] = useState<string[]>([])
  const [models, setModels] = useState<string[]>([])
  const [trims, setTrims] = useState<string[]>([])
  const locations = useQuery({
    enabled: open,
    queryKey: ['dealer-locations'],
    queryFn: () => api<Paginated<DealerLocation>>('/v1/dealers/me/locations'),
  })
  const stands = useMemo(() => unwrapList(locations.data), [locations.data])
  const isEditing = Boolean(editingVehicle)
  const existingMedia = useMemo(() => editingVehicle?.media ?? [], [editingVehicle?.media])
  const openReviewIssues = useMemo(
    () => editingVehicle?.reviewIssues?.filter((issue) => issue.status === 'open') ?? [],
    [editingVehicle?.reviewIssues],
  )
  const selectedPhotos = media.filter((item) => item.kind === 'photo')
  const selectedVideos = media.filter((item) => item.kind === 'video')
  const totalPhotoCount = selectedPhotos.length + existingMedia.filter((item) => item.kind === 'photo').length
  const totalVideoCount = selectedVideos.length + existingMedia.filter((item) => item.kind === 'video').length
  const price = Number(form.priceNgn || 0)
  const previewTitle = [form.make, form.model, form.trim].filter(Boolean).join(' ') || 'Vehicle preview'
  const canContinue = useMemo(() => {
    if (step === 1) return !validateDetails(form)
    if (step === 2) return !mediaRequirementError(media, existingMedia)
    return !validatePricing(form)
  }, [existingMedia, form, media, step])

  useEffect(() => {
    if (!open) return
    setStep(1)
    setError('')
    setConfirmOpen(false)
    setUploadProgress(null)
    setMedia([])
    setIssueResponses({})
    setForm(editingVehicle ? vehicleToDraftForm(editingVehicle) : defaultVehicleDraftForm)
  }, [editingVehicle, open])

  useEffect(() => {
    if (!open || form.locationId || stands.length === 0) return
    const defaultStand = stands.find((stand) => stand.isPrimary) ?? stands[0]
    setForm((current) => ({ ...current, locationId: defaultStand.id }))
  }, [form.locationId, open, stands])

  if (!open) return null

  async function loadMakes() {
    if (makes.length > 0) return
    try {
      const response = await api<CatalogMakesResponse>('/v1/catalog/makes')
      setMakes(normalizeCatalogItems(response.makes))
    } catch {
      setMakes([])
    }
  }

  async function loadModels(make: string, year: string) {
    if (!make.trim()) {
      setModels([])
      return
    }
    try {
      const searchParams = new URLSearchParams({ make })
      if (year) searchParams.set('year', year)
      const response = await api<CatalogModelsResponse>(`/v1/catalog/models?${searchParams.toString()}`)
      setModels(normalizeCatalogItems(response.models))
    } catch {
      setModels([])
    }
  }

  async function loadTrims(make: string, model: string) {
    if (!make.trim() || !model.trim()) {
      setTrims([])
      return
    }
    try {
      const searchParams = new URLSearchParams({ make, model })
      const response = await api<CatalogTrimsResponse>(`/v1/catalog/trims?${searchParams.toString()}`)
      setTrims(normalizeCatalogItems(response.trims))
    } catch {
      setTrims([])
    }
  }

  const updateField: UpdateVehicleField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  function updateMake(value: string) {
    const makeChanged = form.make !== value
    setForm((current) => ({
      ...current,
      make: value,
      model: makeChanged ? '' : current.model,
      trim: makeChanged ? '' : current.trim,
    }))
    if (makeChanged) {
      setModels([])
      setTrims([])
    }
    setError('')
    if (value.trim()) {
      void loadModels(value, form.year)
    }
  }

  function updateModel(value: string) {
    const modelChanged = form.model !== value
    setForm((current) => ({
      ...current,
      model: value,
      trim: modelChanged ? '' : current.trim,
    }))
    if (modelChanged) {
      setTrims([])
    }
    setError('')
    if (form.make.trim() && value.trim()) {
      void loadTrims(form.make, value)
    }
  }

  function updateYear(value: string) {
    updateField('year', value)
    if (form.make.trim()) {
      void loadModels(form.make, value)
    }
  }

  function addFiles(files: FileList | null, kind: 'photo' | 'video') {
    if (!files) return
    const nextItems = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      kind,
      previewUrl: URL.createObjectURL(file),
    }))
    setMedia((current) => [...current, ...nextItems])
    setError('')
  }

  function removeMedia(id: string) {
    setMedia((current) => current.filter((item) => item.id !== id))
  }

  function handleNext() {
    if (step === 1) {
      const detailsError = validateDetails(form)
      if (detailsError) {
        setError(detailsError)
        return
      }
    }
    if (step === 2) {
      const uploadError = mediaRequirementError(media, existingMedia)
      if (uploadError) {
        setError(uploadError)
        return
      }
    }
    setError('')
    setStep((current) => Math.min(current + 1, 3))
  }

  async function publishListing() {
    const detailsError = validateDetails(form)
    const uploadError = mediaRequirementError(media, existingMedia)
    const pricingError = validatePricing(form)
    if (detailsError || uploadError || pricingError) {
      setError(detailsError ?? uploadError ?? pricingError ?? '')
      setConfirmOpen(false)
      return
    }
    const missingResolution = openReviewIssues.find((issue) => !issueResponses[issue.id]?.trim())
    if (missingResolution) {
      setError('Add a resolution note for each open review issue before submitting.')
      setConfirmOpen(false)
      return
    }

    setSubmitting(true)
    setUploadProgress({
      phase: 'creating',
      currentIndex: 0,
      totalFiles: media.length,
      loadedBytes: 0,
      totalBytes: media.reduce((sum, item) => sum + item.file.size, 0),
      percent: 0,
    })
    try {
      const vehicle = editingVehicle
        ? await patch<Vehicle>(`/v1/vehicles/${editingVehicle.id}`, {
          ...buildVehiclePayload(form),
        })
        : await post<Vehicle>('/v1/vehicles', {
          ...buildVehiclePayload(form),
        })

      if (media.length > 0) {
        await uploadVehicleMedia(vehicle.id, media, setUploadProgress)
      }

      if (editingVehicle && openReviewIssues.length > 0) {
        await Promise.all(
          openReviewIssues.map((issue) =>
            patch(`/v1/vehicles/${vehicle.id}/review/issues/${issue.id}/resolve`, {
              dealerResponse: issueResponses[issue.id],
            }),
          ),
        )
      }

      if (!editingVehicle) {
        await patch<Vehicle>(`/v1/vehicles/${vehicle.id}/status`, {
          status: 'available',
          attestationAccepted: true,
        })
      }
      toast.success(editingVehicle ? 'Listing updated' : 'Listing submitted for admin review')
      onComplete()
      setStep(1)
      setForm(defaultVehicleDraftForm)
      setMedia([])
      setConfirmOpen(false)
      setUploadProgress(null)
      onClose()
    } catch (submissionError) {
      toast.error(submissionError instanceof Error ? submissionError.message : 'Unable to submit listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close add vehicle flow" onClick={onClose} />
      <aside className="animate-slide-in-right absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-white/10 bg-[#101014] shadow-2xl shadow-black/40">
        <div className="border-b border-white/8 px-7 py-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="text-[11px] font-[900!important] uppercase tracking-[0.18em] text-lime-300">{isEditing ? 'Edit listing' : 'New listing'}</div>
              <h2 className="mt-1 font-display text-[28px] font-semibold tracking-[-0.035em] text-white">{isEditing ? 'Edit vehicle' : 'Add a vehicle'}</h2>
            </div>
            <Button size="sm" type="button" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-full">
            <Stepper currentStep={step} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6 pb-28">
          <ReviewIssueContext
            issues={openReviewIssues}
            responses={issueResponses}
            onResponseChange={(issueId, value) => {
              setIssueResponses((current) => ({ ...current, [issueId]: value }))
              setError('')
            }}
          />

          {step === 1 ? (
            <DetailsStep
              form={form}
              makes={makes}
              models={models}
              trims={trims}
              onFieldChange={updateField}
              onLoadMakes={() => void loadMakes()}
              onLoadModels={() => void loadModels(form.make, form.year)}
              onLoadTrims={() => void loadTrims(form.make, form.model)}
              onMakeChange={updateMake}
              onModelChange={updateModel}
              onYearChange={updateYear}
            />
          ) : null}

          {step === 2 ? (
            <MediaStep
              existingMedia={existingMedia}
              media={media}
              selectedVideos={selectedVideos}
              onAddFiles={addFiles}
              onRemoveMedia={removeMedia}
            />
          ) : null}

          {step === 3 ? (
            <PublishStep
              form={form}
              photoCount={totalPhotoCount}
              previewTitle={previewTitle}
              price={price}
              stands={stands}
              videoCount={totalVideoCount}
              onFieldChange={updateField}
            />
          ) : null}

          {error ? <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</div> : null}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/8 px-7 py-5">
          <Button disabled={submitting} type="button" variant="secondary" onClick={() => (step === 1 ? onClose() : setStep((current) => current - 1))}>
            Back
          </Button>
          {step < 3 ? (
            <Button disabled={!canContinue} type="button" onClick={handleNext}>
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button disabled={submitting || !canContinue} type="button" onClick={() => setConfirmOpen(true)}>
              <Check className="h-4 w-4" />
              {isEditing ? 'Save changes' : 'Publish listing'}
            </Button>
          )}
        </div>
      </aside>

      {confirmOpen ? (
        <ReviewConfirmationModal
          progress={uploadProgress}
          submitting={submitting}
          title={isEditing ? 'Save listing changes?' : undefined}
          description={isEditing ? 'Please confirm the updated vehicle details, pricing, and media are correct before saving changes.' : undefined}
          confirmLabel={isEditing ? 'Save changes' : undefined}
          submittingLabel={media.length > 0 ? 'Uploading media...' : 'Saving changes...'}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={publishListing}
        />
      ) : null}
    </div>
  )
}
