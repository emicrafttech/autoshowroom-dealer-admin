import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, FieldError, Input, Label } from '@/components/ui'
import { AuthLayout } from '@/features/auth/auth-layout'
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/features/auth/schemas'
import { post } from '@/lib/api'
import { routes } from '@/lib/routes'

export function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState('')
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })
  const requestReset = useMutation({
    mutationFn: (values: ForgotPasswordForm) => post<{ ok: boolean; devToken?: string }>('/v1/auth/password-reset/request', values),
    onSuccess: (response, values) => {
      setSubmittedEmail(values.email)
      toast.success(response.devToken ? `Reset link generated. Dev token: ${response.devToken}` : 'Password reset email sent')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AuthLayout title="Forgot password" description="Enter your dealer staff email and we will send a secure reset link.">
      {submittedEmail ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/15 text-lime-200">
                <Mail size={18} />
              </div>
              <div>
                <div className="font-display text-[15px] font-bold text-white">Check your email</div>
                <p className="mt-1 text-[12.5px] font-medium leading-5 text-neutral-400">
                  If {submittedEmail} belongs to a dealer account, a reset link has been sent.
                </p>
              </div>
            </div>
          </div>
          <Button className="w-full" type="button" variant="secondary" onClick={() => setSubmittedEmail('')}>
            Try another email
          </Button>
          <Link className="flex items-center justify-center gap-2 text-[13px] font-bold text-lime-300" to={routes.signIn}>
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </div>
      ) : (
        <form className="space-y-[18px]" onSubmit={form.handleSubmit((values) => requestReset.mutate(values))}>
          <div className="space-y-2.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="owner@primemotors.ng" {...form.register('email')} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          <Button className="w-full" disabled={requestReset.isPending} type="submit">
            {requestReset.isPending ? 'Sending...' : 'Send reset link'}
          </Button>
          <Link className="flex items-center justify-center gap-2 text-[13px] font-bold text-lime-300" to={routes.signIn}>
            <ArrowLeft size={15} />
            Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
