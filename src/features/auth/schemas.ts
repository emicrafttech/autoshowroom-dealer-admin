import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  phone: z.string().min(8),
})

export const verifySchema = z.object({
  code: z.string().min(4).max(8),
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type VerifyForm = z.infer<typeof verifySchema>
