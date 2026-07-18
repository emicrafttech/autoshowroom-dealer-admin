import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, ExternalLink, LockKeyhole, MailWarning, MapPin, ShieldCheck, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { BlurImage } from '@/components/blur-image'
import { Badge, Button, Dialog, FieldError, Input, Label, Textarea } from '@/components/ui'
import { DealerPublicPreviewDialog } from '@/features/workspace/components/dealer-public-preview-dialog'
import { changePasswordSchema, profileSchema } from '@/features/workspace/schemas'
import type { DealerProfile, DealerVerification, DealerVerificationDocument } from '@/features/workspace/types'
import { api, patch, post } from '@/lib/api'
import { clearSession, readSession, writeSession, type AuthUser } from '@/lib/auth'
import { queryClient } from '@/lib/query'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

function initials(name?: string) {
  return (name ?? 'Dealer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'D'
}

function statusLabel(value?: string) {
  return value?.replaceAll('_', ' ') ?? 'not submitted'
}

function documentFileName(document?: DealerVerificationDocument) {
  if (!document) return ''
  try {
    const url = new URL(document.fileUrl)
    const fileName = decodeURIComponent(url.pathname.split('/').pop() ?? '')
    return fileName || document.title
  } catch {
    return document.title
  }
}

function formatDocumentDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function SettingRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'lime' | 'amber' }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="font-semibold text-neutral-500">{label}</span>
      <span className={cn('font-[900!important] capitalize text-white', tone === 'lime' ? 'text-lime-300' : tone === 'amber' ? 'text-amber-200' : '')}>{value}</span>
    </div>
  )
}

type GenericUploadResponse = {
  uploadUrl: string
  publicUrl: string
}

type EmailVerificationResponse = {
  user: AuthUser
  sent: boolean
  devToken?: string
}

type DealerSanctionStatus = {
  hasActiveSanction: boolean
  sanctions: Array<{
    id: string
    reason: string
    createdAt: string
  }>
}

const requiredDocuments: Array<{ kind: DealerVerificationDocument['kind']; title: string; helper: string }> = [
  { kind: 'cac', title: 'Business registration', helper: 'Upload CAC certificate or business registration document.' },
  { kind: 'identity', title: 'Dealer identity', helper: 'Upload a valid government-issued identity document.' },
  { kind: 'premises', title: 'Premises proof', helper: 'Upload showroom photo, utility bill, tenancy proof, or inspection evidence.' },
]

export function AccountPage() {
  const navigate = useNavigate()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const documentInputRef = useRef<HTMLInputElement | null>(null)
  const session = readSession()
  const [logoUploading, setLogoUploading] = useState(false)
  const [documentUploading, setDocumentUploading] = useState<DealerVerificationDocument['kind'] | null>(null)
  const [selectedDocumentKind, setSelectedDocumentKind] = useState<DealerVerificationDocument['kind'] | null>(null)
  const [appealOpen, setAppealOpen] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const profile = useQuery({ queryKey: ['dealer-profile'], queryFn: () => api<DealerProfile>('/v1/dealers/me') })
  const verification = useQuery({ queryKey: ['dealer-verification'], queryFn: () => api<DealerVerification>('/v1/dealers/me/verification') })
  const sanctionStatus = useQuery({
    queryKey: ['dealer-sanction-status'],
    queryFn: () => api<DealerSanctionStatus>('/v1/dealers/me/sanction-status'),
  })
  const dealer = profile.data
  const documents = verification.data?.documents ?? []
  const locations = dealer?.locations ?? []
  const primaryLocation = locations.find((location) => location.isPrimary) ?? locations[0]
  const verificationApproved = dealer?.verificationStatus === 'approved'
  const approvedDocumentCount = requiredDocuments.filter((item) => latestDocument(item.kind)?.status === 'approved').length
  const suspended = dealer?.operationalStatus === 'suspended'
  const activeSanctions = sanctionStatus.data?.sanctions ?? []
  const emailVerified = session?.user.emailVerified === true
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: dealer?.name ?? '', whatsapp: dealer?.whatsapp ?? '', description: dealer?.description ?? '' },
  })
  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const previewValues = form.watch()
  const update = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) => patch<DealerProfile>('/v1/dealers/me', values),
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['dealer-profile'] })
    },
  })
  const changePassword = useMutation({
    mutationFn: (values: z.infer<typeof changePasswordSchema>) =>
      patch<{ ok: boolean }>('/v1/auth/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password updated')
      setPasswordOpen(false)
      passwordForm.reset()
      const current = readSession()
      if (current?.user.mustChangePassword) {
        writeSession({
          ...current,
          user: { ...current.user, mustChangePassword: false },
        })
      }
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteAccount = useMutation({
    mutationFn: () => post('/v1/dealers/me/delete-account', {}),
    onSuccess: () => {
      toast.success('Account deleted')
      clearSession()
      navigate(routes.signIn, { replace: true })
    },
    onError: (error) => toast.error(error.message),
  })
  const submitAppeal = useMutation({
    mutationFn: () => post('/v1/dealers/me/sanction-appeal', { reason: appealReason.trim() }),
    onSuccess: async () => {
      toast.success('Appeal submitted')
      setAppealOpen(false)
      setAppealReason('')
      await queryClient.invalidateQueries({ queryKey: ['dealer-sanction-status'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const sendEmailVerification = useMutation({
    mutationFn: () => post<EmailVerificationResponse>('/v1/auth/email-verification/send', {}),
    onSuccess: (response) => {
      const currentSession = readSession()
      if (currentSession) {
        writeSession({ ...currentSession, user: { ...currentSession.user, ...response.user } })
      }
      toast.success(response.sent ? 'Verification email sent' : 'Email already verified')
    },
    onError: (error) => toast.error(error.message),
  })

  function previewPublicPage() {
    setPreviewOpen(true)
  }

  async function uploadLogo(file: File) {
    if (suspended) {
      toast.error('Verify your email to reactivate your account before making changes.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file for the logo.')
      return
    }
    setLogoUploading(true)
    try {
      const upload = await post<GenericUploadResponse>('/v1/uploads', {
        purpose: 'dealer_logo',
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      })
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResponse.ok) {
        throw new Error('Unable to upload logo. Try again.')
      }
      await patch<DealerProfile>('/v1/dealers/me', { logoUrl: upload.publicUrl })
      toast.success('Logo updated')
      queryClient.invalidateQueries({ queryKey: ['dealer-profile'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update logo')
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function uploadDocument(kind: DealerVerificationDocument['kind'], file: File) {
    if (suspended) {
      toast.error('Verify your email to reactivate your account before uploading documents.')
      return
    }
    const requirement = requiredDocuments.find((item) => item.kind === kind)
    setDocumentUploading(kind)
    try {
      const upload = await post<GenericUploadResponse>('/v1/uploads', {
        purpose: `dealer_verification_${kind}`,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      })
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadResponse.ok) {
        throw new Error('Unable to upload document. Try again.')
      }
      await post<DealerVerificationDocument>('/v1/dealers/me/verification/documents', {
        kind,
        title: requirement?.title || file.name,
        fileUrl: upload.publicUrl,
      })
      toast.success('Document uploaded for review')
      queryClient.invalidateQueries({ queryKey: ['dealer-verification'] })
      queryClient.invalidateQueries({ queryKey: ['dealer-profile'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload document')
    } finally {
      setDocumentUploading(null)
      setSelectedDocumentKind(null)
      if (documentInputRef.current) documentInputRef.current.value = ''
    }
  }

  function latestDocument(kind: DealerVerificationDocument['kind']) {
    return documents.find((document) => document.kind === kind)
  }

  const premisesDocument = latestDocument('premises')

  function submitSanctionAppeal() {
    if (!appealReason.trim()) {
      toast.error('Enter why the sanction should be reviewed')
      return
    }
    submitAppeal.mutate()
  }

  return (
    <div className="space-y-7">
      <Dialog
        open={appealOpen}
        title="Appeal sanction"
        onClose={() => {
          if (submitAppeal.isPending) return
          setAppealOpen(false)
          setAppealReason('')
        }}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium leading-6 text-neutral-400">
            Explain what changed, what evidence supports your case, and why AutoShowroom should review the active sanction.
          </p>
          <Textarea
            placeholder="Write your appeal..."
            value={appealReason}
            onChange={(event) => setAppealReason(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button disabled={submitAppeal.isPending} type="button" variant="secondary" onClick={() => setAppealOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitAppeal.isPending} type="button" onClick={submitSanctionAppeal}>
              {submitAppeal.isPending ? 'Submitting...' : 'Submit appeal'}
            </Button>
          </div>
        </div>
      </Dialog>
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">Account</h1>
          <p className="mt-2 text-[14px] font-medium text-neutral-400">Your dealer profile, verification, documents, and data requests, all in one place.</p>
        </div>
        <Badge tone={verificationApproved ? 'lime' : 'amber'}>{verificationApproved ? 'Verified' : 'Verification incomplete'}</Badge>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-white">Dealer profile</h2>
                <p className="mt-1 text-[13.5px] font-medium text-neutral-500">These details power your public showroom page and every lead surface.</p>
              </div>
              <span className="text-[11px] font-bold text-neutral-600">Visible to buyers</span>
            </div>

            <form className="mt-6 grid gap-5 lg:grid-cols-[84px_1fr]" onSubmit={form.handleSubmit((values) => update.mutate(values))}>
              <div>
                <div className="grid h-[84px] w-[84px] place-items-center overflow-hidden rounded-[22px] bg-lime-300 font-display text-[25px] font-bold text-neutral-950">
                  {dealer?.logoUrl ? (
                    <BlurImage alt={`${dealer.name} logo`} className="h-full w-full object-cover" src={dealer.logoUrl} />
                  ) : (
                    initials(dealer?.name)
                  )}
                </div>
                <input
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void uploadLogo(file)
                  }}
                />
                <button
                  className="mt-2 w-[84px] cursor-pointer whitespace-nowrap text-center text-[12px] font-[900!important] text-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={logoUploading || suspended}
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUploading ? 'Uploading...' : 'Change logo'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Business name</Label>
                  <Input placeholder="Prime Motors Abuja" {...form.register('name')} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input readOnly value={dealer?.phone ?? 'Not set'} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input placeholder="Same as phone" {...form.register('whatsapp')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>About the dealership</Label>
                  <Textarea placeholder="Trusted used-car dealer in Abuja..." {...form.register('description')} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={update.isPending || suspended} type="submit">{update.isPending ? 'Saving...' : 'Save profile'}</Button>
                    <Button type="button" variant="secondary" onClick={previewPublicPage}>
                      <Eye className="h-4 w-4" />
                      Preview public page
                    </Button>
                  </div>
                  <span className="text-[12px] font-semibold text-neutral-600">Last saved {dealer?.locations?.length ? 'recently' : 'after setup'}</span>
                </div>
              </div>
            </form>
          </section>

          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', emailVerified ? 'bg-lime-300/15 text-lime-300' : 'bg-amber-300/15 text-amber-200')}>
                  <MailWarning className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-white">Email verification</h2>
                  <p className="mt-1 text-[13.5px] font-medium text-neutral-500">{session?.user.email ?? 'No email set'}</p>
                  {!emailVerified ? (
                    <p className="mt-2 max-w-2xl text-[13px] font-medium leading-6 text-amber-100/75">
                      {suspended
                        ? 'Your workspace is suspended because the email verification window has passed. Resend the email and verify it to reactivate the account.'
                        : 'Verify your email to keep receiving review decisions, billing, security, and buyer activity updates. Accounts not verified within 7 days can be suspended until verified.'}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone={emailVerified ? 'lime' : 'amber'}>{emailVerified ? 'Verified' : 'Pending verification'}</Badge>
                {!emailVerified ? (
                  <Button disabled={sendEmailVerification.isPending} type="button" onClick={() => sendEmailVerification.mutate()}>
                    {sendEmailVerification.isPending ? 'Sending...' : session?.user.emailVerificationSentAt ? 'Resend email' : 'Send email'}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-white">Verification</h2>
                <p className="mt-1 text-[13.5px] font-medium text-neutral-500">Build buyer trust and rank higher in search.</p>
              </div>
              <Badge tone={approvedDocumentCount === requiredDocuments.length ? 'lime' : 'amber'}>
                Documents {approvedDocumentCount} / {requiredDocuments.length} approved
              </Badge>
            </div>
            <input
              className="hidden"
              ref={documentInputRef}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file && selectedDocumentKind) void uploadDocument(selectedDocumentKind, file)
              }}
            />
            <div className="space-y-3">
              {requiredDocuments.map((item) => {
                const document = latestDocument(item.kind)
                const complete = verificationApproved || document?.status === 'approved'
                const rejected = document?.status === 'rejected'
                const pending = document?.status === 'pending'
                const uploadedLabel = document ? `${documentFileName(document)}${document.createdAt ? ` · Uploaded ${formatDocumentDate(document.createdAt)}` : ''}` : item.helper
                return (
                  <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 sm:flex-row sm:items-center" key={item.kind}>
                    <div className="flex items-center gap-3">
                      <span className={cn('grid h-9 w-9 place-items-center rounded-xl', complete ? 'bg-lime-300/15 text-lime-300' : 'bg-white/8 text-neutral-500')}>
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[14px] font-[900!important] text-white">{item.title}</div>
                        <div className="text-[12px] font-medium text-neutral-500">
                          {complete ? uploadedLabel : pending ? uploadedLabel : rejected ? document?.rejectionReason ?? 'Rejected, upload a corrected document' : item.helper}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={complete ? 'lime' : rejected ? 'red' : pending ? 'amber' : 'slate'}>
                        {complete ? 'Verified' : rejected ? 'Rejected' : pending ? 'Pending' : 'Required'}
                      </Badge>
                      {document ? (
                        <a
                          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/8 px-4 text-[12px] font-[900!important] text-white ring-1 ring-white/10 transition hover:bg-white/12"
                          href={document.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      ) : null}
                      {!complete ? (
                        <button
                          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-white/8 px-4 text-[12px] font-[900!important] text-white ring-1 ring-white/10 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={documentUploading === item.kind || suspended}
                          type="button"
                          onClick={() => {
                            setSelectedDocumentKind(item.kind)
                            documentInputRef.current?.click()
                          }}
                        >
                          {documentUploading === item.kind ? 'Uploading...' : rejected ? 'Resubmit' : document ? 'Replace' : 'Upload'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">Compliance</h2>
            <div className="mt-5 space-y-4">
              <SettingRow label="Operational status" value={statusLabel(dealer?.operationalStatus)} tone="lime" />
              <SettingRow label="Verification level" value={verificationApproved ? 'Verified' : 'Standard'} tone={verificationApproved ? 'lime' : 'amber'} />
              <SettingRow label="Account standing" value="Good" />
              <SettingRow label="Active sanctions" value={activeSanctions.length ? String(activeSanctions.length) : 'None'} tone={activeSanctions.length ? 'amber' : 'default'} />
            </div>
            {activeSanctions.length ? (
              <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
                {activeSanctions.map((sanction) => (
                  <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4" key={sanction.id}>
                    <div className="text-[13px] font-[900!important] text-red-100">Active sanction</div>
                    <p className="mt-1 text-[12px] font-medium leading-5 text-red-100/75">{sanction.reason}</p>
                  </div>
                ))}
                <Button className="w-full" disabled={submitAppeal.isPending || suspended} type="button" variant="secondary" onClick={() => setAppealOpen(true)}>
                  Appeal sanction
                </Button>
              </div>
            ) : (
              <p className="mt-6 border-t border-white/8 pt-4 text-[12px] font-medium leading-5 text-neutral-500">Complete verification to reach Verified level and the trust badge.</p>
            )}
          </section>

          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">Business address</h2>
            <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-500">Your primary showroom location shown to buyers.</p>
            {primaryLocation ? (
              <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-lime-300/15 text-lime-300">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-[900!important] text-white">{primaryLocation.name}</div>
                    {primaryLocation.address ? (
                      <div className="text-[12px] font-medium text-neutral-400">{primaryLocation.address}</div>
                    ) : null}
                    {primaryLocation.area ? (
                      <div className="text-[12px] font-medium text-neutral-500">{primaryLocation.area}</div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 border-t border-white/8 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-[900!important] text-white">Premises verification</div>
                      <p className="mt-1 text-[12px] font-medium text-neutral-500">
                        {premisesDocument
                          ? 'Premises proof is reviewed separately from KYD documents.'
                          : 'Upload premises proof in Verification to verify your showroom address.'}
                      </p>
                    </div>
                    {premisesDocument ? (
                      <Badge tone={primaryLocation.premisesVerificationStatus === 'verified' ? 'lime' : 'amber'}>
                        {statusLabel(primaryLocation.premisesVerificationStatus)}
                      </Badge>
                    ) : (
                      <Button
                        disabled={documentUploading === 'premises' || suspended}
                        size="sm"
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setSelectedDocumentKind('premises')
                          documentInputRef.current?.click()
                        }}
                      >
                        {documentUploading === 'premises' ? 'Uploading...' : 'Upload proof'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[13px] font-medium leading-6 text-neutral-500">Complete dealership setup to add your business address.</p>
            )}
            {suspended ? (
              <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4">
                <div className="text-[13px] font-[900!important] text-red-100">Account suspended</div>
                <p className="mt-1 text-[12px] font-medium leading-5 text-red-100/75">Verify your email to reactivate your account.</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">Security</h2>
            <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-500">
              Update the password you use with your verified email for dealer console sign-ins.
            </p>
            <Button className="mt-4 w-full" type="button" variant="secondary" onClick={() => setPasswordOpen(true)}>
              <LockKeyhole className="h-4 w-4" />
              Change password
            </Button>
          </section>

          <section className="rounded-[18px] border border-white/8 bg-[#101014]/80 p-5 shadow-2xl shadow-black/20">
            <h2 className="font-display text-[19px] font-semibold text-white">Delete account</h2>
            <p className="mt-1 text-[13px] font-medium leading-5 text-neutral-500">Permanently close your dealer workspace when you no longer want to use AutoShowroom.</p>
            <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4">
              <div className="text-[13px] font-[900!important] text-red-100">This action signs out your team</div>
              <p className="mt-1 text-[12px] font-medium leading-5 text-red-100/75">Your dealer account will be disabled and staff access will be revoked.</p>
            </div>
            <Button className="mt-4 w-full" disabled={deleteAccount.isPending} type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete dealer account
            </Button>
          </section>
        </aside>
      </div>
      <DealerPublicPreviewDialog
        open={previewOpen}
        dealer={{
          name: previewValues.name || dealer?.name || 'Your dealership',
          slug: dealer?.slug,
          description: previewValues.description || dealer?.description,
          area: primaryLocation?.area || dealer?.locations?.[0]?.area,
          address: primaryLocation?.address,
          logoUrl: dealer?.logoUrl,
          verified: verificationApproved,
        }}
        onClose={() => setPreviewOpen(false)}
      />
      <Dialog
        open={passwordOpen}
        title="Change password"
        onClose={() => {
          if (changePassword.isPending) return
          setPasswordOpen(false)
          passwordForm.reset()
        }}
      >
        <form
          className="space-y-4"
          onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}
        >
          <p className="text-[13px] font-medium leading-6 text-neutral-400">
            Enter your current password, then choose a new one for future dealer console sign-ins.
          </p>
          <div className="space-y-2.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Enter current password"
              {...passwordForm.register('currentPassword')}
            />
            <FieldError message={passwordForm.formState.errors.currentPassword?.message} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...passwordForm.register('newPassword')}
            />
            <FieldError message={passwordForm.formState.errors.newPassword?.message} />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="confirmNewPassword">Confirm new password</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              {...passwordForm.register('confirmPassword')}
            />
            <FieldError message={passwordForm.formState.errors.confirmPassword?.message} />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={changePassword.isPending}
              type="button"
              variant="secondary"
              onClick={() => {
                setPasswordOpen(false)
                passwordForm.reset()
              }}
            >
              Cancel
            </Button>
            <Button disabled={changePassword.isPending} type="submit">
              {changePassword.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={deleteOpen} title="Delete dealer account" onClose={() => {
        if (deleteAccount.isPending) return
        setDeleteOpen(false)
        setDeleteConfirmation('')
      }}>
        <div className="space-y-4">
          <p className="text-[13px] font-medium leading-6 text-neutral-400">
            This will disable your dealer account and revoke access for all staff members. Type <span className="font-[900!important] text-white">DELETE</span> to confirm.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="delete-confirmation">Confirmation</Label>
            <Input
              id="delete-confirmation"
              placeholder="Type DELETE"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button disabled={deleteAccount.isPending} type="button" variant="secondary" onClick={() => {
              setDeleteOpen(false)
              setDeleteConfirmation('')
            }}>
              Cancel
            </Button>
            <Button disabled={deleteAccount.isPending || deleteConfirmation !== 'DELETE'} type="button" variant="danger" onClick={() => deleteAccount.mutate()}>
              {deleteAccount.isPending ? 'Deleting...' : 'Delete account'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
