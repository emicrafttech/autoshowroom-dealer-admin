import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, FieldError, Input, Label } from '@/components/ui'
import { AuthLayout } from '@/features/auth/auth-layout'
import { loginSchema, type LoginForm } from '@/features/auth/schemas'
import { post } from '@/lib/api'
import { writeSession, type AuthSession } from '@/lib/auth'
import { routes } from '@/lib/routes'

export function SignInPage() {
  const navigate = useNavigate()
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const login = useMutation({
    mutationFn: (values: LoginForm) => post<AuthSession>('/v1/auth/login', values),
    onSuccess: (session) => {
      writeSession(session)
      navigate(routes.dashboard, { replace: true })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AuthLayout title="Dealer sign in" description="Use your staff email and password to access the dealer console.">
      <form className="space-y-[18px]" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
        <div className="space-y-2.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="owner@primemotors.ng" {...form.register('email')} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link className="text-[12px] font-bold text-lime-300 hover:text-lime-200" to={routes.forgotPassword}>
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" {...form.register('password')} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button className="w-full" disabled={login.isPending} type="submit">
          Sign in
          <ArrowRight size={16} />
        </Button>
        <p className="pt-1 text-center text-[12px] font-medium text-neutral-500">
          New dealership?{' '}
          <Link className="font-bold text-lime-300" to={routes.register}>
            Register with phone verification
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
