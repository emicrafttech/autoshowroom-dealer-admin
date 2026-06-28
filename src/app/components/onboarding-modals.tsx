import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button, Dialog, FieldError, Input, Label } from '@/components/ui'
import { patch } from '@/lib/api'
import { readSession, writeSession, type AuthSession } from '@/lib/auth'
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

export function OnboardingModals({
  session,
  profile,
  needsDealershipSetup,
  passwordModalOpen,
  onPasswordModalOpenChange,
}: OnboardingModalsProps) {
  const setupForm = useForm<z.infer<typeof dealershipSetupSchema>>({
    resolver: zodResolver(dealershipSetupSchema),
    values: {
      dealerName: profile?.name === 'New Dealer' ? '' : profile?.name ?? '',
      email: session?.user.email.endsWith('@pending.autoshowroom.local') ? '' : session?.user.email ?? '',
      standName: profile?.locations[0]?.name ?? 'Main Stand',
      districtSlug: profile?.locations[0]?.districtSlug ?? '',
      address: profile?.locations[0]?.address ?? '',
    },
  })
  const passwordForm = useForm<z.infer<typeof passwordSetupSchema>>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const saveSetup = useMutation({
    mutationFn: (values: z.infer<typeof dealershipSetupSchema>) => patch<AuthSession>('/v1/auth/dealer-signup/setup', values),
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
              <h3 className="font-display text-[15px] font-bold text-white">Initial stand</h3>
              <p className="mt-1 text-xs text-neutral-500">Premise details for the first car stand.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="standName">Stand name</Label>
                <Input id="standName" placeholder="Main Stand" {...setupForm.register('standName')} />
                <FieldError message={setupForm.formState.errors.standName?.message} />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="districtSlug">District</Label>
                <Input id="districtSlug" placeholder="wuse" {...setupForm.register('districtSlug')} />
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
    </>
  )
}
