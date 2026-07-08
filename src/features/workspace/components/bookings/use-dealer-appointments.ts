import { useQuery } from '@tanstack/react-query'
import type { Appointment, Paginated } from '@/features/workspace/types'
import { api } from '@/lib/api'
import { unwrapList } from '@/lib/utils'

export function isPendingConfirmation(status: string) {
  return status === 'pending' || status === 'rescheduled'
}

export function useDealerAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: () => api<Paginated<Appointment>>('/v1/appointments'),
    refetchInterval: 30000,
  })
}

export function usePendingBookingCount() {
  const appointments = useDealerAppointments()
  return unwrapList(appointments.data).filter((appointment) =>
    isPendingConfirmation(appointment.status),
  ).length
}
