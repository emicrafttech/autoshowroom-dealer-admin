import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Dialog } from '@/components/ui'
import { AddVehicleDialog } from '@/features/workspace/components/cars/add-vehicle-dialog'
import { CarsHeader } from '@/features/workspace/components/cars/cars-header'
import { CarsInventoryTable } from '@/features/workspace/components/cars/cars-inventory-table'
import { CarsStatusTabs, type InventoryViewMode } from '@/features/workspace/components/cars/cars-status-tabs'
import { VehicleDetailsDialog } from '@/features/workspace/components/cars/vehicle-details-dialog'
import type { Paginated, Vehicle } from '@/features/workspace/types'
import { vehicleTitle } from '@/features/workspace/utils'
import { api, del, patch } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { unwrapList } from '@/lib/utils'

export function StockPage() {
  const [open, setOpen] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<InventoryViewMode>('list')
  const [page, setPage] = useState(1)
  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: () => api<Paginated<Vehicle>>('/v1/vehicles') })
  const updateStatus = useMutation({
    mutationFn: ({ vehicle, status }: { vehicle: Vehicle; status: 'available' | 'hidden' | 'reserved' | 'sold' }) =>
      patch<Vehicle>(`/v1/vehicles/${vehicle.id}/status`, {
        status,
        ...(status === 'available' ? { attestationAccepted: true } : {}),
      }),
    onSuccess: (_vehicle, values) => {
      toast.success(`${vehicleTitle(values.vehicle)} marked ${values.status}`)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteVehicle = useMutation({
    mutationFn: (vehicle: Vehicle) => del(`/v1/vehicles/${vehicle.id}`),
    onSuccess: (_result, vehicle) => {
      toast.success(`${vehicleTitle(vehicle)} deleted`)
      setDeletingVehicle(null)
      if (viewingVehicle?.id === vehicle.id) setViewingVehicle(null)
      if (editingVehicle?.id === vehicle.id) {
        setEditingVehicle(null)
        setOpen(false)
      }
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error) => toast.error(error.message),
  })

  const allVehicles = unwrapList(vehicles.data)
  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((vehicle) => {
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter
      const query = search.trim().toLowerCase()
      const matchesSearch = !query || `${vehicleTitle(vehicle)} ${vehicle.year}`.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [allVehicles, search, statusFilter])

  const totalValue = allVehicles.reduce((sum, vehicle) => sum + (vehicle.priceNgn ?? 0), 0)
  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filteredVehicles.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedVehicles = filteredVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const statusTabs = [
    { label: 'All', value: 'all', count: allVehicles.length },
    { label: 'Available', value: 'available', count: allVehicles.filter((vehicle) => vehicle.status === 'available').length },
    { label: 'Reserved', value: 'reserved', count: allVehicles.filter((vehicle) => vehicle.status === 'reserved').length },
    { label: 'Sold', value: 'sold', count: allVehicles.filter((vehicle) => vehicle.status === 'sold').length },
    { label: 'Hidden', value: 'hidden', count: allVehicles.filter((vehicle) => vehicle.status === 'hidden').length },
  ]

  async function shareVehicle(vehicle: Vehicle) {
    const url = `${window.location.origin}/vehicles/${vehicle.slug ?? vehicle.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: vehicleTitle(vehicle), url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Listing link copied')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Unable to share listing link')
    }
  }

  return (
    <>
      <CarsHeader
        search={search}
        totalValue={totalValue}
        vehicleCount={allVehicles.length}
        onAddVehicle={() => setOpen(true)}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
      />
      <CarsStatusTabs
        activeValue={statusFilter}
        tabs={statusTabs}
        viewMode={viewMode}
        onChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}
        onViewModeChange={setViewMode}
      />
      <CarsInventoryTable
        currentPage={currentPage}
        inventoryCount={allVehicles.length}
        pageCount={pageCount}
        totalCount={filteredVehicles.length}
        vehicles={pagedVehicles}
        viewMode={viewMode}
        onAddVehicle={() => setOpen(true)}
        onDelete={setDeletingVehicle}
        onEdit={(vehicle) => {
          setEditingVehicle(vehicle)
          setOpen(true)
        }}
        onShare={(vehicle) => void shareVehicle(vehicle)}
        onStatusChange={(vehicle, status) => updateStatus.mutate({ vehicle, status })}
        onView={setViewingVehicle}
        onPageChange={setPage}
      />
      <VehicleDetailsDialog
        vehicle={viewingVehicle}
        onClose={() => setViewingVehicle(null)}
        onEdit={(vehicle) => {
          setViewingVehicle(null)
          setEditingVehicle(vehicle)
          setOpen(true)
        }}
        onShare={(vehicle) => void shareVehicle(vehicle)}
      />
      <Dialog open={Boolean(deletingVehicle)} title="Delete listing?" onClose={() => setDeletingVehicle(null)}>
        {deletingVehicle ? (
          <div>
            <p className="text-sm font-medium leading-6 text-neutral-400">
              You are about to delete <span className="font-[900!important] text-white">{vehicleTitle(deletingVehicle)}</span>. This process is irreversible and the listing cannot be recovered after deletion.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button disabled={deleteVehicle.isPending} type="button" variant="secondary" onClick={() => setDeletingVehicle(null)}>
                Cancel
              </Button>
              <Button disabled={deleteVehicle.isPending} type="button" variant="danger" onClick={() => deleteVehicle.mutate(deletingVehicle)}>
                {deleteVehicle.isPending ? 'Deleting...' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
      <AddVehicleDialog
        editingVehicle={editingVehicle}
        open={open}
        onClose={() => {
          setOpen(false)
          setEditingVehicle(null)
        }}
        onComplete={() => {
          setEditingVehicle(null)
          queryClient.invalidateQueries({ queryKey: ['vehicles'] })
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }}
      />
    </>
  )
}
