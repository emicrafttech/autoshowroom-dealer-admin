import { Input, Label, Textarea } from '@/components/ui'
import { CatalogTextField } from './catalog-text-field'
import { formatNumberInput, onlyDigits } from './helpers'
import { SelectField } from './select-field'
import type { UpdateVehicleField, VehicleDraftForm } from './types'

type DetailsStepProps = {
  form: VehicleDraftForm
  makes: string[]
  models: string[]
  onFieldChange: UpdateVehicleField
  onMakeChange: (value: string) => void
  onYearChange: (value: string) => void
  onLoadMakes: () => void
  onLoadModels: () => void
}

export function DetailsStep({
  form,
  makes,
  models,
  onFieldChange,
  onMakeChange,
  onYearChange,
  onLoadMakes,
  onLoadModels,
}: DetailsStepProps) {
  const makeMissing = !form.make.trim()

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Identity</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div onFocus={onLoadMakes}>
            <CatalogTextField
              label="Make"
              options={makes}
              placeholder="Lexus"
              value={form.make}
              onFocus={onLoadMakes}
              onChange={onMakeChange}
            />
          </div>
          <div onFocus={onLoadModels}>
            <CatalogTextField
              disabled={makeMissing}
              disabledMessage="Choose a make first."
              label="Model"
              options={models}
              placeholder="RC 350 F Sport"
              value={form.model}
              onFocus={onLoadModels}
              onChange={(value) => onFieldChange('model', value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input placeholder="2020" inputMode="numeric" value={form.year} onChange={(event) => onYearChange(onlyDigits(event.target.value))} />
          </div>
          <div className={`group relative space-y-2 ${makeMissing ? 'cursor-not-allowed' : ''}`} title={makeMissing ? 'Choose a make first.' : undefined}>
            <Label>Trim <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input
              className={makeMissing ? 'cursor-not-allowed border-white/5 bg-white/[0.035] text-neutral-600 opacity-60 placeholder:text-neutral-700 focus:border-white/5 focus:ring-0' : ''}
              disabled={makeMissing}
              placeholder="F Sport AWD"
              value={form.trim}
              onChange={(event) => onFieldChange('trim', event.target.value)}
            />
            {makeMissing ? (
              <div className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-40 hidden w-max max-w-[260px] rounded-lg border border-white/10 bg-[#17171a] px-3 py-2 text-[12px] font-bold text-neutral-300 shadow-2xl shadow-black/40 group-hover:block">
                Choose a make first.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Specifications</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Body type" value={form.bodyType} onChange={(value) => onFieldChange('bodyType', value)} options={[
            { label: 'Sedan', value: 'sedan' },
            { label: 'SUV', value: 'suv' },
            { label: 'Coupe', value: 'coupe' },
            { label: 'Pickup', value: 'pickup' },
            { label: 'Hatchback', value: 'hatchback' },
            { label: 'Van', value: 'van' },
          ]} />
          <div className="space-y-2">
            <Label>Mileage</Label>
            <Input
              inputMode="numeric"
              placeholder="48,200"
              value={formatNumberInput(form.mileageKm)}
              onChange={(event) => onFieldChange('mileageKm', onlyDigits(event.target.value))}
            />
          </div>
          <SelectField label="Transmission" value={form.transmission} onChange={(value) => onFieldChange('transmission', value)} options={[
            { label: 'Automatic', value: 'automatic' },
            { label: 'Manual', value: 'manual' },
          ]} />
          <SelectField label="Fuel" value={form.fuel} onChange={(value) => onFieldChange('fuel', value)} options={[
            { label: 'Petrol', value: 'petrol' },
            { label: 'Diesel', value: 'diesel' },
            { label: 'Hybrid', value: 'hybrid' },
            { label: 'Electric', value: 'electric' },
          ]} />
          <div className="space-y-2">
            <Label>Exterior colour</Label>
            <Input placeholder="Pearl White" value={form.colour} onChange={(event) => onFieldChange('colour', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reg / VIN</Label>
            <Input placeholder="JTHHA5BC..." value={form.vin} onChange={(event) => onFieldChange('vin', event.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label>Chassis number <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="Chassis number" value={form.chassisNumber} onChange={(event) => onFieldChange('chassisNumber', event.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label>Year of manufacture <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input inputMode="numeric" placeholder="2020" value={form.yearOfManufacture} onChange={(event) => onFieldChange('yearOfManufacture', onlyDigits(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Engine capacity (cc) <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input inputMode="numeric" placeholder="2500" value={formatNumberInput(form.engineCapacityCc)} onChange={(event) => onFieldChange('engineCapacityCc', onlyDigits(event.target.value))} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>Description <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
          <Textarea placeholder="Clean F Sport, foreign-used. Full service history, new tyres, AWD. No accidents." value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} />
        </div>
      </section>
      <section>
        <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Registration, customs, and trust</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Registration plate <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="ABC-123DE" value={form.registrationPlate} onChange={(event) => onFieldChange('registrationPlate', event.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label>Registration state <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="FCT" value={form.registrationState} onChange={(event) => onFieldChange('registrationState', event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Registration LGA <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="Abuja Municipal" value={form.registrationLga} onChange={(event) => onFieldChange('registrationLga', event.target.value)} />
          </div>
          <SelectField label="Customs duty" value={form.customsDutyStatus} onChange={(value) => onFieldChange('customsDutyStatus', value)} options={[
            { label: 'Unknown', value: 'unknown' },
            { label: 'Cleared', value: 'cleared' },
            { label: 'Pending', value: 'pending' },
            { label: 'Not applicable', value: 'not_applicable' },
          ]} />
          <div className="space-y-2">
            <Label>Customs reference <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="C-number or SGD reference" value={form.customsReference} onChange={(event) => onFieldChange('customsReference', event.target.value)} />
          </div>
          <SelectField label="Body history" value={form.bodyHistory} onChange={(value) => onFieldChange('bodyHistory', value)} options={[
            { label: 'Unknown', value: 'unknown' },
            { label: 'First body', value: 'first_body' },
            { label: 'Repaint', value: 'repaint' },
            { label: 'Accident recorded', value: 'accident_recorded' },
          ]} />
          <SelectField label="Papers status" value={form.papersStatus} onChange={(value) => onFieldChange('papersStatus', value)} options={[
            { label: 'Unknown', value: 'unknown' },
            { label: 'Complete', value: 'complete' },
            { label: 'Partial', value: 'partial' },
          ]} />
          <SelectField label="Duty paid claim" value={form.dutyPaidClaim} onChange={(value) => onFieldChange('dutyPaidClaim', value)} options={[
            { label: 'Unverified', value: 'unverified' },
            { label: 'Dealer claimed', value: 'dealer_claimed' },
            { label: 'API verified', value: 'api_verified' },
            { label: 'Manually verified', value: 'manually_verified' },
          ]} />
        </div>
        <div className="mt-4 space-y-2">
          <Label>Listing trust notes <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
          <Textarea placeholder="Service records, warranty, inspection, ownership, and documentation notes." value={form.listingTrust} onChange={(event) => onFieldChange('listingTrust', event.target.value)} />
        </div>
      </section>
    </div>
  )
}
