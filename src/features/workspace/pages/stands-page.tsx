import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { AddStandDialog } from '@/features/workspace/components/stands/add-stand-dialog'
import { StandDetailsDialog } from '@/features/workspace/components/stands/stand-details-dialog'
import { StandLimitCard } from '@/features/workspace/components/stands/stand-limit-card'
import { StandsTable } from '@/features/workspace/components/stands/stands-table'
import { PageHeader } from '@/features/workspace/components/page-header'
import type { BillingSummary, DealerLocation, Paginated } from '@/features/workspace/types'
import { api, del, post } from '@/lib/api'
import { queryClient } from '@/lib/query'
import { routes } from '@/lib/routes'
import { unwrapList } from '@/lib/utils'

export function StandsPage() {
  const [open, setOpen] = useState(false)
  const [viewingStand, setViewingStand] = useState<DealerLocation | null>(null)
  const locations = useQuery({ queryKey: ['dealer-locations'], queryFn: () => api<Paginated<DealerLocation>>('/v1/dealers/me/locations') })
  const summary = useQuery({ queryKey: ['billing-summary'], queryFn: () => api<BillingSummary>('/v1/billing/summary') })
  const create = useMutation({
    mutationFn: (values: { name: string; districtSlug: string; area?: string; address?: string }) =>
      post<DealerLocation>('/v1/dealers/me/locations', values),
    onSuccess: () => {
      toast.success('Stand created and submitted for verification')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['dealer-locations'] })
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const setPrimary = useMutation({
    mutationFn: (id: string) => post<DealerLocation>(`/v1/dealers/me/locations/${id}/set-primary`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dealer-locations'] }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => del(`/v1/dealers/me/locations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dealer-locations'] }),
  })

  return (
    <>
      <PageHeader
        backTo={{ to: routes.account, label: 'Back to account settings' }}
        title="Stands"
        description="Manage car premises as first-class dealer locations with verification state and subscription limits."
        action={
          <Button disabled={!summary.data?.canAddStand} type="button" onClick={() => setOpen(true)}>
            Add stand
          </Button>
        }
      />
      <StandLimitCard summary={summary.data} />
      <StandsTable
        locations={unwrapList(locations.data)}
        onDelete={(id) => remove.mutate(id)}
        onSetPrimary={(id) => setPrimary.mutate(id)}
        onView={setViewingStand}
      />
      <AddStandDialog open={open} pending={create.isPending} onClose={() => setOpen(false)} onSubmit={(values) => create.mutate(values)} />
      <StandDetailsDialog stand={viewingStand} onClose={() => setViewingStand(null)} />
    </>
  )
}
