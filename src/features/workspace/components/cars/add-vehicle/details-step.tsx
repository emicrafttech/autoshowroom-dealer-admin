import { Input, Label, Textarea } from '@/components/ui'
import { CatalogTextField } from './catalog-text-field'
import { formatNumberInput, onlyDigits } from './helpers'
import { SelectField } from './select-field'
import type { UpdateVehicleField, VehicleDraftForm } from './types'

type DetailsStepProps = {
  form: VehicleDraftForm
  makes: string[]
  models: string[]
  trims: string[]
  onFieldChange: UpdateVehicleField
  onMakeChange: (value: string) => void
  onModelChange: (value: string) => void
  onYearChange: (value: string) => void
  onLoadMakes: () => void
  onLoadModels: () => void
  onLoadTrims: () => void
}

export function DetailsStep({
  form,
  makes,
  models,
  trims,
  onFieldChange,
  onMakeChange,
  onModelChange,
  onYearChange,
  onLoadMakes,
  onLoadModels,
  onLoadTrims,
}: DetailsStepProps) {
  const makeMissing = !form.make.trim()
  const modelMissing = !form.model.trim()

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
              placeholder="RC"
              value={form.model}
              onFocus={onLoadModels}
              onChange={onModelChange}
            />
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Input placeholder="2020" inputMode="numeric" value={form.year} onChange={(event) => onYearChange(onlyDigits(event.target.value))} />
          </div>
          <div onFocus={onLoadTrims}>
            <CatalogTextField
              disabled={makeMissing || modelMissing}
              disabledMessage={makeMissing ? 'Choose a make first.' : 'Choose a model first.'}
              label="Trim"
              optional
              options={trims}
              placeholder="F Sport"
              value={form.trim}
              onFocus={onLoadTrims}
              onChange={(value) => onFieldChange('trim', value)}
            />
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
            <Label>VIN <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="JTHHA5BC..." value={form.vin} onChange={(event) => onFieldChange('vin', event.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label>Chassis number <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
            <Input placeholder="Chassis number" value={form.chassisNumber} onChange={(event) => onFieldChange('chassisNumber', event.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>Description <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
          <Textarea placeholder="Clean F Sport, foreign-used. Full service history, new tyres, AWD. No accidents." value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} />
        </div>
      </section>
    </div>
  )
}
