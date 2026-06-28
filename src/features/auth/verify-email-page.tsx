import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '@/features/auth/auth-layout'
import { post } from '@/lib/api'
import { readSession, writeSession } from '@/lib/auth'
import { routes } from '@/lib/routes'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const verify = useQuery({
    enabled: Boolean(token),
    queryFn: () => post<{ ok: boolean }>('/v1/auth/email-verification/verify', { token }),
    queryKey: ['email-verification', token],
    retry: false,
  })

  useEffect(() => {
    if (!verify.isSuccess) return
    const session = readSession()
    if (session) {
      writeSession({
        ...session,
        user: {
          ...session.user,
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
        },
      })
    }
  }, [verify.isSuccess])

  return (
    <AuthLayout
      description="We are confirming your dealer account email."
      title="Email verification"
    >
      <div className="rounded-[18px] border border-white/10 bg-white/5 p-5 text-center">
        <div className="font-display text-[19px] font-semibold text-white">
          {!token ? 'Verification link missing' : verify.isPending ? 'Verifying email...' : verify.isSuccess ? 'Email verified' : 'Unable to verify email'}
        </div>
        <p className="mt-3 text-[13px] font-medium leading-6 text-neutral-400">
          {verify.isSuccess
            ? 'Your email is now verified. You can return to your dealer workspace.'
            : verify.isError
              ? 'The link may be invalid or expired. Sign in and request a new verification email from Account settings.'
              : 'Please wait while we verify your email address.'}
        </p>
        <Link className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-lime-300 px-5 text-[13px] font-[900!important] text-neutral-950" to={routes.dashboard}>
          Go to workspace
        </Link>
      </div>
    </AuthLayout>
  )
}
