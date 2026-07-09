import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Badge, Button, Dialog, Input, Label } from '@/components/ui'
import { DetailField } from '@/features/workspace/components/detail-field'
import type { DealerLocation, Paginated, Vehicle } from '@/features/workspace/types'
import { api } from '@/lib/api'
import { formatDate, unwrapList } from '@/lib/utils'

type StandDetailsDialogProps = {
  stand: DealerLocation | null
  pending?: boolean
  onClose: () => void
  onSubmit: (stand: DealerLocation, values: { name: string; districtSlug: string; address: string }) => void
}

export function StandDetailsDialog({ stand, pending = false, onClose, onSubmit }: StandDetailsDialogProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [districtSlug, setDistrictSlug] = useState('')
  const [address, setAddress] = useState('')
  const vehicles = useQuery({
    enabled: Boolean(stand?.id),
    queryKey: ['stand-vehicles', stand?.id],
    queryFn: () => api<Paginated<Vehicle>>(`/v1/vehicles?locationId=${stand?.id}`),
  })
  const vehicleItems = unwrapList(vehicles.data)

  useEffect(() => {
    setEditing(false)
    setName(stand?.name ?? '')
    setDistrictSlug(stand?.districtSlug ?? '')
    setAddress(stand?.address ?? '')
  }, [stand])

  return (
    <Dialog open={Boolean(stand)} title={stand?.name ?? 'Stand details'} onClose={onClose}>
      {stand ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={stand.isPrimary ? 'lime' : 'slate'}>{stand.isPrimary ? 'Primary stand' : 'Secondary stand'}</Badge>
            <Badge tone={stand.premisesVerificationStatus === 'verified' ? 'lime' : 'amber'}>
              {stand.premisesVerificationStatus}
            </Badge>
            {stand.pendingChanges ? <Badge tone="amber">Update pending review</Badge> : null}
          </div>
          {editing ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                onSubmit(stand, { name, districtSlug, address })
              }}
            >
              <div className="space-y-2">
                <Label>Stand name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input value={districtSlug} onChange={(event) => setDistrictSlug(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} type="submit">{pending ? 'Submitting...' : 'Submit for review'}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              <DetailField label="Area" value={stand.area ?? 'Not set'} />
              <DetailField label="District" value={stand.districtSlug ?? 'Not set'} />
              <DetailField label="City" value={stand.citySlug ?? 'Not set'} />
              <DetailField label="Address" value={stand.address?.trim() || 'Not set'} />
              <Button type="button" variant="secondary" onClick={() => setEditing(true)}>Edit details</Button>
            </>
          )}
          {stand.pendingChanges ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="text-[12px] font-[900!important] text-amber-100">Pending admin review</div>
              <pre className="mt-2 whitespace-pre-wrap text-[12px] font-semibold text-amber-100/80">
                {JSON.stringify(stand.pendingChanges, null, 2)}
              </pre>
            </div>
          ) : null}
          {stand.premisesRejectionReason ? (
            <DetailField label="Rejection reason" value={stand.premisesRejectionReason} />
          ) : null}
          <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
            <div className="text-[12px] font-[900!important] text-white">Vehicles under this stand</div>
            <div className="mt-3 space-y-2">
              {vehicles.isLoading ? (
                <p className="text-[12px] font-semibold text-neutral-500">Loading vehicles...</p>
              ) : vehicleItems.length ? (
                vehicleItems.map((vehicle) => (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2" key={vehicle.id}>
                    <span className="truncate text-[12px] font-semibold text-neutral-200">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                    <Badge tone={vehicle.status === 'available' ? 'lime' : 'slate'}>{vehicle.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-[12px] font-semibold text-neutral-500">No vehicles listed under this stand yet.</p>
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailField label="Created" value={stand.createdAt ? formatDate(stand.createdAt) : 'Not set'} />
            <DetailField label="Last updated" value={stand.updatedAt ? formatDate(stand.updatedAt) : 'Not set'} />
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
