import { Label } from '@/components/ui'
import type { DealerLocation } from '@/features/workspace/types'
import { formatCompactNgn } from '@/lib/utils'
import { decimalNumberValue, formatDecimalNumberInput } from './helpers'
import { SelectField } from './select-field'
import type { UpdateVehicleField, VehicleDraftForm } from './types'

type PublishStepProps = {
  form: VehicleDraftForm
  photoCount: number
  videoCount: number
  stands: DealerLocation[]
  price: number
  previewTitle: string
  onFieldChange: UpdateVehicleField
}

export function PublishStep({ form, photoCount, videoCount, stands, price, previewTitle, onFieldChange }: PublishStepProps) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Pricing</div>
        <div className="space-y-2">
          <Label>{form.negotiable ? 'Asking price' : 'Price'}</Label>
          <div className="flex h-14 items-center rounded-xl border border-white/10 bg-[#17171a] px-4 focus-within:border-lime-300/70 focus-within:ring-2 focus-within:ring-lime-300/10">
            <span className="mr-3 font-display text-[20px] font-semibold text-neutral-300">₦</span>
            <input
              className="min-w-0 flex-1 bg-transparent font-display text-[22px] font-semibold text-white outline-none placeholder:text-neutral-600"
              inputMode="decimal"
              placeholder="38,500,000"
              value={formatDecimalNumberInput(form.priceNgn)}
              onChange={(event) => onFieldChange('priceNgn', decimalNumberValue(event.target.value))}
            />
          </div>
        </div>
        <button
          className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/8"
          type="button"
          onClick={() => onFieldChange('negotiable', !form.negotiable)}
        >
          <span>
            <span className="block text-[14px] font-[900!important] text-white">Open to offers</span>
            <span className="mt-0.5 block text-[12px] font-medium text-neutral-500">Buyers can negotiate in chat</span>
          </span>
          <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${form.negotiable ? 'justify-end bg-lime-300' : 'justify-start bg-white/10'}`}>
            <span className={`h-5 w-5 rounded-full transition ${form.negotiable ? 'bg-neutral-950' : 'bg-neutral-500'}`} />
          </span>
        </button>
      </section>
      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Condition</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Brand new', value: 'brand_new' },
            { label: 'Foreign used', value: 'tokunbo' },
            { label: 'Local used', value: 'locally_used' },
          ].map((option) => (
            <button
              className={`h-12 cursor-pointer rounded-xl text-[14px] font-[900!important] transition ${form.importType === option.value ? 'bg-lime-300 text-neutral-950' : 'bg-white/6 text-neutral-300 ring-1 ring-white/10 hover:bg-white/10'}`}
              key={option.value}
              type="button"
              onClick={() => onFieldChange('importType', option.value as VehicleDraftForm['importType'])}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Stand"
          options={stands.map((stand) => ({
            label: stand.name,
            value: stand.id,
          }))}
          value={form.locationId}
          onChange={(value) => onFieldChange('locationId', value)}
        />
      </section>
      <div className="rounded-[16px] border border-lime-300/25 bg-lime-300/10 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-display text-[16px] font-semibold text-white">{previewTitle}</div>
            <p className="mt-1 text-[12px] font-medium text-lime-100/70">{form.year} · {Number(form.mileageKm || 0).toLocaleString()} km · {videoCount} videos · {photoCount} photos</p>
          </div>
          <div className="font-display text-[18px] font-semibold text-lime-300">{formatCompactNgn(price)}</div>
        </div>
      </div>
    </div>
  )
}
