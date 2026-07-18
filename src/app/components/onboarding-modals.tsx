import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Dialog, FieldError, Input, Label } from '@/components/ui'
import { patch } from '@/lib/api'
import { readSession, writeSession, type AuthSession } from '@/lib/auth'
import { abujaDistricts, normalizeDistrictSlug } from '@/lib/districts'
import { queryClient } from '@/lib/query'

const dealershipSetupSchema = z.object({
  dealerName: z.string().min(2),
  email: z.email(),
  standName: z.string().min(2),
  districtSlug: z.string().min(2),
  address: z.string().min(4),
})

const passwordSetupSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((values) => values.password === values.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

type DealerProfile = {
  name: string
  locations: Array<{ name: string; districtSlug?: string; address?: string }>
}

type OnboardingModalsProps = {
  session: AuthSession | null
  profile?: DealerProfile
  needsDealershipSetup: boolean
  passwordModalOpen: boolean
  onPasswordModalOpenChange: (open: boolean) => void
}

const STARTER_TRIAL_BENEFITS = [
  '90-day free Starter founding trial',
  'Up to 20 live listings',
  '1 staff seat for your dealership',
  'Verified badge, dealer profile, and video listings',
  'Lead capture, inspection booking, and WhatsApp handoff',
  'Basic analytics while you grow',
]

export function OnboardingModals({
  session,
  profile,
  needsDealershipSetup,
  passwordModalOpen,
  onPasswordModalOpenChange,
}: OnboardingModalsProps) {
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false)
  const setupForm = useForm<z.infer<typeof dealershipSetupSchema>>({
    resolver: zodResolver(dealershipSetupSchema),
    values: {
      dealerName: profile?.name === 'New Dealer' ? '' : profile?.name ?? '',
      email: session?.user.email.endsWith('@pending.autoshowroom.local') ? '' : session?.user.email ?? '',
      standName: profile?.locations[0]?.name ?? 'Main Showroom',
      districtSlug: profile?.locations[0]?.districtSlug ?? '',
      address: profile?.locations[0]?.address ?? '',
    },
  })
  const passwordForm = useForm<z.infer<typeof passwordSetupSchema>>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const saveSetup = useMutation({
    mutationFn: (values: z.infer<typeof dealershipSetupSchema>) =>
      patch<AuthSession>('/v1/auth/dealer-signup/setup', {
        ...values,
        districtSlug: normalizeDistrictSlug(values.districtSlug),
      }),
    onSuccess: (nextSession) => {
      writeSession(nextSession)
      queryClient.invalidateQueries({ queryKey: ['dealer-profile'] })
      toast.success('Dealership details saved')
      onPasswordModalOpenChange(true)
    },
    onError: (error) => toast.error(error.message),
  })
  const savePassword = useMutation({
    mutationFn: (values: z.infer<typeof passwordSetupSchema>) => patch<{ ok: boolean }>('/v1/auth/dealer-signup/password', values),
    onSuccess: () => {
      const currentSession = readSession()
      if (currentSession) {
        writeSession({
          ...currentSession,
          user: { ...currentSession.user, mustChangePassword: false },
        })
      }
      toast.success('Secure login password set')
      onPasswordModalOpenChange(false)
      passwordForm.reset()
      setWelcomeModalOpen(true)
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <Dialog open={needsDealershipSetup} title="Welcome to AutoShowroom" showClose={false} onClose={() => undefined}>
        <form className="space-y-5" onSubmit={setupForm.handleSubmit((values) => saveSetup.mutate(values))}>
          <p className="text-[13.5px] font-medium leading-6 text-neutral-400">
            Set up the basic dealership profile buyers and staff will see. Your phone is already verified.
          </p>
          <section className="space-y-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
            <div>
              <h3 className="font-display text-[15px] font-bold text-white">Dealership details</h3>
              <p className="mt-1 text-xs text-neutral-500">Name and verified contact email.</p>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="dealerName">Dealership name</Label>
              <Input id="dealerName" placeholder="Prime Motors Abuja" {...setupForm.register('dealerName')} />
              <FieldError message={setupForm.formState.errors.dealerName?.message} />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="setupEmail">Email</Label>
              <Input id="setupEmail" type="email" placeholder="owner@primemotors.ng" {...setupForm.register('email')} />
              <FieldError message={setupForm.formState.errors.email?.message} />
              <p className="text-xs font-medium leading-5 text-neutral-500">
                We will send a verification email to confirm this address.
              </p>
            </div>
          </section>
          <section className="space-y-3 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
            <div>
              <h3 className="font-display text-[15px] font-bold text-white">Business address</h3>
              <p className="mt-1 text-xs text-neutral-500">Showroom location buyers will visit for inspections.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="standName">Showroom name</Label>
                <Input id="standName" placeholder="Main Showroom" {...setupForm.register('standName')} />
                <FieldError message={setupForm.formState.errors.standName?.message} />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="districtSlug">District</Label>
                <select
                  id="districtSlug"
                  className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-[#17171a] px-4 text-[14px] font-semibold text-white outline-none transition focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10"
                  {...setupForm.register('districtSlug')}
                >
                  <option value="">Select district</option>
                  {abujaDistricts.map((district) => (
                    <option key={district.slug} value={district.slug}>
                      {district.label}
                    </option>
                  ))}
                </select>
                <FieldError message={setupForm.formState.errors.districtSlug?.message} />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Plot 12, Aminu Kano Crescent, Wuse 2" {...setupForm.register('address')} />
              <FieldError message={setupForm.formState.errors.address?.message} />
            </div>
          </section>
          <Button className="w-full" disabled={saveSetup.isPending} type="submit">
            Save dealership details
          </Button>
        </form>
      </Dialog>
      <Dialog open={!needsDealershipSetup && passwordModalOpen} title="Set secure login" showClose={false} onClose={() => undefined}>
        <form className="space-y-4" onSubmit={passwordForm.handleSubmit((values) => savePassword.mutate(values))}>
          <p className="text-[13.5px] font-medium leading-6 text-neutral-400">
            Create the password you will use with your verified email for future dealer console sign-ins.
          </p>
          <div className="space-y-2.5">
            <Label htmlFor="setupPassword">Password</Label>
            <Input id="setupPassword" type="password" placeholder="Create a strong password" {...passwordForm.register('password')} />
            <FieldError message={passwordForm.formState.errors.password?.message} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" placeholder="Re-enter your password" {...passwordForm.register('confirmPassword')} />
            <FieldError message={passwordForm.formState.errors.confirmPassword?.message} />
          </div>
          <Button className="w-full" disabled={savePassword.isPending} type="submit">
            Save secure password
          </Button>
        </form>
      </Dialog>
      <Dialog
        open={welcomeModalOpen}
        title="You're on the Starter trial"
        onClose={() => setWelcomeModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-[13.5px] font-medium leading-6 text-neutral-400">
            Welcome aboard. You&apos;ve been opted into a 90-day Starter founding trial at no charge.
            After the trial, Starter renews at ₦20,000/mo — add a payment card before then to enable auto-renewal.
          </p>
          <ul className="space-y-2.5 rounded-[14px] border border-white/8 bg-white/[0.03] p-4">
            {STARTER_TRIAL_BENEFITS.map((benefit) => (
              <li className="flex items-start gap-2.5 text-[13px] font-semibold text-neutral-300" key={benefit}>
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />
                {benefit}
              </li>
            ))}
          </ul>
          <Button className="w-full" type="button" onClick={() => setWelcomeModalOpen(false)}>
            Start exploring
          </Button>
        </div>
      </Dialog>
    </>
  )
}
