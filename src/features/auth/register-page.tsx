import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, FieldError, Input, Label } from '@/components/ui'
import { AuthLayout } from '@/features/auth/auth-layout'
import { registerSchema, verifySchema, type RegisterForm, type VerifyForm } from '@/features/auth/schemas'
import { post } from '@/lib/api'
import { writeSession, type AuthSession } from '@/lib/auth'
import { routes } from '@/lib/routes'

export function RegisterPage() {
  const navigate = useNavigate()
  const [pendingRegistration, setPendingRegistration] = useState<RegisterForm | null>(null)
  const registrationForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: '' },
  })
  const verifyForm = useForm<VerifyForm>({ resolver: zodResolver(verifySchema), defaultValues: { code: '' } })
  const start = useMutation({
    mutationFn: (values: RegisterForm) => post<{ phone: string; expiresAt: string; devCode?: string }>('/v1/auth/dealer-signup/start', { phone: values.phone }),
    onSuccess: (response, values) => {
      setPendingRegistration(values)
      toast.success(response.devCode ? `Verification code: ${response.devCode}` : 'Verification code sent')
    },
    onError: (error) => toast.error(error.message),
  })
  const verify = useMutation({
    mutationFn: (values: VerifyForm) => {
      if (!pendingRegistration) throw new Error('Start phone verification first')
      return post<AuthSession>('/v1/auth/dealer-signup/verify', { phone: pendingRegistration.phone, code: values.code })
    },
    onSuccess: (session) => {
      writeSession(session)
      navigate(routes.dashboard, { replace: true })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AuthLayout title="Register dealership" description="Start with phone verification. You will complete dealership details inside the console.">
      {!pendingRegistration ? (
        <form className="space-y-[18px]" onSubmit={registrationForm.handleSubmit((values) => start.mutate(values))}>
          <div className="space-y-2.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" placeholder="+234 803 412 7780" {...registrationForm.register('phone')} />
            <FieldError message={registrationForm.formState.errors.phone?.message} />
          </div>
          <Button className="w-full" disabled={start.isPending} type="submit">
            Send verification code
            <ArrowRight size={16} />
          </Button>
          <p className="pt-1 text-center text-[12px] font-medium text-neutral-500">
            Already registered?{' '}
            <Link className="font-bold text-lime-300" to={routes.signIn}>
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form className="space-y-[18px]" onSubmit={verifyForm.handleSubmit((values) => verify.mutate(values))}>
          <div className="rounded-[14px] border border-lime-300/15 bg-lime-300/8 p-4 text-[13.5px] font-medium leading-6 text-neutral-300">
            Enter the code sent to <span className="font-bold text-white">{pendingRegistration.phone}</span>. This completes the initial phone verification and creates your dealer owner session.
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" inputMode="numeric" placeholder="123456" {...verifyForm.register('code')} />
            <FieldError message={verifyForm.formState.errors.code?.message} />
          </div>
          <Button className="w-full" disabled={verify.isPending} type="submit">
            Verify phone and enter console
            <ArrowRight size={16} />
          </Button>
          <Button className="w-full" type="button" variant="ghost" onClick={() => setPendingRegistration(null)}>
            ← Wrong phone number? Go back and fix it
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
