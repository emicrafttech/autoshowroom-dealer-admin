import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, FieldError, Input, Label } from '@/components/ui'
import { AuthLayout } from '@/features/auth/auth-layout'
import { resetPasswordSchema, type ResetPasswordForm } from '@/features/auth/schemas'
import { post } from '@/lib/api'
import { writeSession, type AuthSession } from '@/lib/auth'
import { routes } from '@/lib/routes'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const resetPassword = useMutation({
    mutationFn: (values: ResetPasswordForm) =>
      post<AuthSession>('/v1/auth/password-reset/confirm', {
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      }),
    onSuccess: (session) => {
      writeSession(session)
      toast.success('Password reset')
      navigate(routes.dashboard, { replace: true })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AuthLayout title="Set new password" description="Choose a new password for your dealer console account.">
      {!token ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-[13px] font-medium leading-6 text-red-100">
            Password reset link is missing a token. Request a new reset link to continue.
          </div>
          <Link className="flex items-center justify-center gap-2 text-[13px] font-bold text-lime-300" to={routes.forgotPassword}>
            <ArrowLeft size={15} />
            Request reset link
          </Link>
        </div>
      ) : (
        <form className="space-y-[18px]" onSubmit={form.handleSubmit((values) => resetPassword.mutate(values))}>
          <div className="space-y-2.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" placeholder="Create a strong password" {...form.register('password')} />
            <FieldError message={form.formState.errors.password?.message} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Re-enter your password" {...form.register('confirmPassword')} />
            <FieldError message={form.formState.errors.confirmPassword?.message} />
          </div>
          <Button className="w-full" disabled={resetPassword.isPending} type="submit">
            {resetPassword.isPending ? 'Resetting...' : 'Reset password'}
            <ArrowRight size={16} />
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
