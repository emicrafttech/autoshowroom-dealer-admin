import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { DealerProfile } from '@/features/workspace/types'

export function SetupChecklist({ profile }: { profile?: DealerProfile }) {
  const items = [
    { label: 'Confirm business address', done: Boolean(profile?.locations.length), helper: 'Required before publishing inventory.' },
    { label: 'Complete WhatsApp/profile details', done: Boolean(profile?.whatsapp), helper: 'Required before lead/contact surfaces are enabled.' },
    { label: 'Submit dealer verification', done: profile?.verificationStatus !== 'not_submitted', helper: 'Required for compliance-sensitive actions.' },
  ]

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Setup gates</CardTitle>
          <CardDescription>Progressive prompts appear only when a dealer takes an action that needs setup.</CardDescription>
        </div>
      </CardHeader>
      <div className="space-y-3.5">
        {items.map((item) => (
          <div className="flex items-start gap-3.5 rounded-[12px] bg-white/[0.035] p-3.5" key={item.label}>
            <Badge tone={item.done ? 'lime' : 'amber'}>{item.done ? 'Ready' : 'Needed'}</Badge>
            <div>
              <div className="text-[14px] font-bold text-white">{item.label}</div>
              <div className="mt-0.5 text-[13px] font-medium leading-5 text-neutral-400">{item.helper}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
