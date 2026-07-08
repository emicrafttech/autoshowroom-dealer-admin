import { messagePreview } from '@/features/workspace/components/chats/chat-attachments'
import { BuyerAvatar, buyerDisplayName } from '@/features/workspace/components/chats/buyer-avatar'
import { isUnreadConversation } from '@/features/workspace/components/chats/use-dealer-chats'
import type { Conversation } from '@/features/workspace/types'
import { vehicleTitle } from '@/features/workspace/utils'
import { cn, formatDate, formatRelativeDate } from '@/lib/utils'

type ChatConversationListProps = {
  conversations: Conversation[]
  selectedChatId: string
  onSelectChat: (chatId: string) => void
}

export function ChatConversationList({ conversations, selectedChatId, onSelectChat }: ChatConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="mt-5 rounded-[14px] border border-white/8 bg-black/25 px-4 py-8 text-center">
        <div className="font-display text-[15px] font-semibold text-white">No conversations yet</div>
        <p className="mt-2 text-[13px] font-medium leading-5 text-neutral-500">
          Buyer messages will appear here as soon as shoppers contact you.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-1.5">
      {conversations.map((chat) => {
        const lastMessage = chat.messages.at(-1)
        const isActive = selectedChatId === chat.id
        const unread = isUnreadConversation(chat)

        return (
          <button
            className={cn(
              'w-full cursor-pointer rounded-[16px] px-3 py-3 text-left transition',
              isActive
                ? 'bg-lime-300/15 shadow-[0_0_24px_rgba(197,244,63,0.08)]'
                : 'hover:bg-white/6',
            )}
            key={chat.id}
            type="button"
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex gap-3">
              <BuyerAvatar buyer={chat.buyer} showUnread={unread} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate font-display text-[14.5px] font-semibold tracking-[-0.02em] text-white">
                    {buyerDisplayName(chat.buyer)}
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-neutral-500">
                    {chat.lastMessageAt ? formatRelativeDate(chat.lastMessageAt) : formatDate(chat.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[11.5px] font-[900!important] text-lime-300">{chat.vehicle ? vehicleTitle(chat.vehicle) : 'Listing enquiry'}</div>
                <div className="mt-1 truncate text-[12.5px] font-medium text-neutral-500">
                  {lastMessage ? messagePreview(lastMessage) : 'No message has been sent yet.'}
                </div>
                {unread ? (
                  <span className="mt-2 inline-grid h-5 min-w-5 place-items-center rounded-full bg-lime-300 px-1.5 text-[10px] font-[900!important] text-neutral-950">1</span>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
