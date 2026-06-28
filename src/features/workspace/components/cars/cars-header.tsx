import { Plus, Search } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { formatCompactNgn } from '@/lib/utils'

type CarsHeaderProps = {
  vehicleCount: number
  totalValue: number
  search: string
  onSearchChange: (value: string) => void
  onAddVehicle: () => void
}

export function CarsHeader({ vehicleCount, totalValue, search, onSearchChange, onAddVehicle }: CarsHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Cars</h1>
        <p className="mt-2 text-[14px] font-semibold text-neutral-400">
          {vehicleCount} vehicles · {formatCompactNgn(totalValue)} total value
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-[280px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            className="h-12 rounded-[14px] pl-11"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            value={search}
          />
        </div>
        <Button className="shrink-0" type="button" onClick={onAddVehicle}>
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>
    </div>
  )
}
