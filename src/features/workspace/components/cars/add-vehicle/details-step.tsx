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
        </div>
        <div className="mt-4 space-y-2">
          <Label>Description <span className="normal-case tracking-normal text-neutral-600">optional</span></Label>
          <Textarea placeholder="Clean F Sport, foreign-used. Full service history, new tyres, AWD. No accidents." value={form.notes} onChange={(event) => onFieldChange('notes', event.target.value)} />
        </div>
      </section>
    </div>
  )
}
