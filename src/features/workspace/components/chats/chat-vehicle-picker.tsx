import type { Vehicle } from '@/features/workspace/types'
import { vehicleTitle } from '@/features/workspace/utils'

type ChatVehiclePickerProps = {
  vehicles: Vehicle[]
  selectedVehicleId: string
  onSelectVehicle: (vehicleId: string) => void
}

export function ChatVehiclePicker({ vehicles, selectedVehicleId, onSelectVehicle }: ChatVehiclePickerProps) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500" htmlFor="chat-vehicle">
        Listing
      </label>
      <select
        className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#17171a] px-3 text-sm font-semibold text-white outline-none focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10"
        id="chat-vehicle"
        value={selectedVehicleId}
        onChange={(event) => onSelectVehicle(event.target.value)}
      >
        <option value="">Choose listing</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicleTitle(vehicle)}</option>
        ))}
      </select>
    </div>
  )
}
