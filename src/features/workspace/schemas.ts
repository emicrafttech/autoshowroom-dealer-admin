import { z } from 'zod'

export const standSchema = z.object({
  name: z.string().min(2),
  districtSlug: z.string().min(2),
  area: z.string().optional(),
  address: z.string().optional(),
})

export const vehicleSchema = z.object({
  make: z.string().min(2),
  model: z.string().min(1),
  year: z.number().min(1980),
  priceNgn: z.number().min(1),
})

export const leadStageSchema = z.object({ stage: z.string().min(2) })

export const inviteSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  role: z.enum(['owner', 'manager', 'sales']),
})

export const profileSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().optional(),
  description: z.string().optional(),
})
