import type { Lead } from '@/features/workspace/types'
import { cn, formatRelativeDate } from '@/lib/utils'

type LeadBoardProps = {
  leads: Lead[]
  onStageChange: (id: string, stage: string) => void
}

const stages = [
  { value: 'new', label: 'New', tone: 'red' },
  { value: 'contacted', label: 'Contacted', tone: 'blue' },
  { value: 'inspection', label: 'Inspection', tone: 'lime' },
  { value: 'reserved', label: 'Reserved', tone: 'amber' },
  { value: 'sold', label: 'Sold', tone: 'lime' },
  { value: 'lost', label: 'Lost', tone: 'slate' },
] as const

function leadName(lead: Lead) {
  return lead.buyerName ?? lead.name ?? 'Buyer'
}

function leadPhone(lead: Lead) {
  return lead.buyerPhone ?? lead.phone
}

function leadVehicle(lead: Lead) {
  return lead.vehicleTitle ?? lead.message ?? 'Vehicle inquiry'
}

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'BY'
}

function stageToneClass(tone: string) {
  return cn(
    tone === 'red' && 'bg-red-400',
    tone === 'blue' && 'bg-blue-400',
    tone === 'lime' && 'bg-lime-300',
    tone === 'amber' && 'bg-amber-300',
    tone === 'slate' && 'bg-neutral-500',
  )
}

function sourceBadgeClass(source?: string) {
  if (source === 'whatsapp') return 'bg-blue-400/15 text-blue-200 ring-blue-400/20'
  if (source === 'call') return 'bg-amber-300/15 text-amber-200 ring-amber-300/20'
  if (source === 'notify_me') return 'bg-indigo-300/15 text-indigo-200 ring-indigo-300/20'
  if (source === 'booking') return 'bg-lime-300/15 text-lime-200 ring-lime-300/20'
  return 'bg-white/8 text-neutral-300 ring-white/10'
}

function nextStage(currentStage?: string) {
  const order = stages.map((stage) => stage.value)
  const currentIndex = order.indexOf((currentStage ?? 'new') as (typeof order)[number])
  return order[Math.min(currentIndex + 1, order.length - 1)]
}

function LeadCard({ lead, onStageChange }: { lead: Lead; onStageChange: (id: string, stage: string) => void }) {
  const name = leadName(lead)
  const phone = leadPhone(lead)
  const promotedStage = nextStage(lead.stage)
  const isFinal = lead.stage === 'sold' || lead.stage === 'lost'

  return (
    <article className="rounded-[16px] border border-white/8 bg-[#17171b]/90 p-4 shadow-xl shadow-black/15 transition hover:border-lime-300/25">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 font-display text-[12px] font-bold text-lime-200 ring-1 ring-white/10">
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-semibold tracking-[-0.02em] text-white">{name}</div>
          <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-5 text-neutral-400">{leadVehicle(lead)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {lead.source ? (
            <span className={cn('rounded-lg px-2 py-1 text-[10px] font-[900!important] uppercase tracking-[0.08em] ring-1', sourceBadgeClass(lead.source))}>
              {lead.source.replace('_', ' ')}
            </span>
          ) : null}
          {phone ? (
            <span className="rounded-lg bg-white/6 px-2 py-1 text-[10px] font-bold text-neutral-400 ring-1 ring-white/8">
              {phone}
            </span>
          ) : null}
        </div>
        <span className="text-[12px] font-semibold text-neutral-500">{formatRelativeDate(lead.createdAt)}</span>
      </div>
      {!isFinal ? (
        <button
          className="mt-4 h-9 w-full cursor-pointer rounded-xl bg-white/8 text-[12px] font-[900!important] text-neutral-200 ring-1 ring-white/8 transition hover:bg-lime-300 hover:text-neutral-950"
          type="button"
          onClick={() => onStageChange(lead.id, promotedStage)}
        >
          Move to {stages.find((stage) => stage.value === promotedStage)?.label}
        </button>
      ) : null}
    </article>
  )
}

export function LeadBoard({ leads, onStageChange }: LeadBoardProps) {
  return (
    <div className="overflow-x-auto pb-3">
      <div className="grid min-w-[1040px] grid-cols-5 gap-4 xl:min-w-0">
        {stages.filter((stage) => stage.value !== 'lost').map((stage) => {
          const stageLeads = leads.filter((lead) => (lead.stage ?? 'new') === stage.value)

          return (
            <section key={stage.value}>
              <div className="mb-3 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', stageToneClass(stage.tone))} />
                <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-white">{stage.label}</h2>
                <span className="rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-bold text-neutral-400">{stageLeads.length}</span>
              </div>
              <div className="space-y-3">
                {stageLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onStageChange={onStageChange} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
