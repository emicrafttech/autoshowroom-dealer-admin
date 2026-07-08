import { Calendar, Image, Tag } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { BlurImage } from '@/components/blur-image'
import type { ChatMessage, Conversation } from '@/features/workspace/types'
import { vehicleImageUrl, vehicleTitle } from '@/features/workspace/utils'
import { formatCompactNgn, formatDate } from '@/lib/utils'

type ChatMessagePanelProps = {
  conversation?: Conversation
  messages: ChatMessage[]
  selectedChatId: string
  onQuickReply: (message: string) => void
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const fromDealer = message.senderType === 'dealer'
  return (
    <div
      className={
        fromDealer
          ? 'ml-auto max-w-[76%] rounded-[18px] rounded-br-md bg-lime-300 px-4 py-3 text-neutral-950'
          : 'max-w-[76%] rounded-[18px] rounded-bl-md bg-white/8 px-4 py-3 text-neutral-100 ring-1 ring-white/8'
      }
    >
      {message.attachmentUrl ? (
        <a
          className="mb-2 block overflow-hidden rounded-[14px] bg-black/10"
          href={message.attachmentUrl}
          rel="noreferrer"
          target="_blank"
        >
          <BlurImage
            alt="Chat attachment"
            className="max-h-64 w-full object-cover"
            src={message.attachmentUrl}
          />
        </a>
      ) : null}
      {message.body ? <div className="text-sm font-semibold">{message.body}</div> : null}
      <div className="mt-1 text-[11px] opacity-70">{formatDate(message.createdAt)}</div>
    </div>
  )
}

export function ChatMessagePanel({ conversation, messages, selectedChatId, onQuickReply }: ChatMessagePanelProps) {
  const vehicle = conversation?.vehicle
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current
    if (!container) return
    container.scrollTop = container.scrollHeight
  }, [messages, selectedChatId])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {vehicle ? (
        <div className="mb-5 flex shrink-0 justify-center">
          <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/6 px-4 py-3">
            <div className="h-11 w-16 overflow-hidden rounded-lg bg-black/40">
              {vehicleImageUrl(vehicle) ? <BlurImage alt={vehicleTitle(vehicle)} className="h-full w-full object-cover" src={vehicleImageUrl(vehicle)} /> : null}
            </div>
            <div>
              <div className="text-[13px] font-[900!important] text-white">{vehicleTitle(vehicle)}</div>
              <div className="mt-0.5 text-[11px] font-semibold text-neutral-500">{vehicle.year} · {vehicle.mileageKm?.toLocaleString() ?? 'Mileage not set'} km</div>
            </div>
            <div className="font-display text-[15px] font-semibold text-lime-300">{formatCompactNgn(vehicle.priceNgn)}</div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2" ref={messagesRef}>
      {!selectedChatId ? (
        <div className="grid h-full min-h-[360px] place-items-center text-center">
          <div>
            <div className="font-display text-[18px] font-semibold text-white">Select a conversation</div>
            <p className="mt-2 max-w-sm text-[13px] font-medium leading-6 text-neutral-500">
              Pick a buyer conversation from the inbox to read and reply.
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="grid h-full min-h-[360px] place-items-center text-center">
          <div>
            <div className="font-display text-[18px] font-semibold text-white">No messages yet</div>
            <p className="mt-2 max-w-sm text-[13px] font-medium leading-6 text-neutral-500">
              Start the conversation with a short helpful reply.
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
      </div>

      {selectedChatId ? (
        <div className="mt-4 flex shrink-0 flex-wrap gap-2">
          <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[12px] font-[900!important] text-neutral-300 transition hover:bg-white/12" type="button" onClick={() => onQuickReply('I can send a full walkaround video for this car.')}>
            <Image className="h-3.5 w-3.5" />
            Send walkaround
          </button>
          <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[12px] font-[900!important] text-neutral-300 transition hover:bg-white/12" type="button" onClick={() => onQuickReply('The listed price is still available. Would you like to make an offer?')}>
            <Tag className="h-3.5 w-3.5" />
            Share price
          </button>
          <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[12px] font-[900!important] text-neutral-300 transition hover:bg-white/12" type="button" onClick={() => onQuickReply('I can schedule an inspection time for you. What day works best?')}>
            <Calendar className="h-3.5 w-3.5" />
            Propose a time
          </button>
        </div>
      ) : null}
    </div>
  )
}
