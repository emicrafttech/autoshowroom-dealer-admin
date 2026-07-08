import { useQuery } from '@tanstack/react-query'
import type { Conversation, Paginated } from '@/features/workspace/types'
import { api } from '@/lib/api'
import { unwrapList } from '@/lib/utils'

export function isUnreadConversation(conversation: Conversation) {
  const lastMessage = conversation.messages.at(-1)
  if (!lastMessage || lastMessage.senderType !== 'buyer') return false
  if (!conversation.dealerLastReadAt) return true
  return new Date(lastMessage.createdAt) > new Date(conversation.dealerLastReadAt)
}

export function useDealerChats() {
  return useQuery({
    queryKey: ['dealer-chats'],
    queryFn: () => api<Conversation[] | Paginated<Conversation>>('/v1/dealers/me/chats'),
    refetchInterval: 30000,
  })
}

export function useUnreadChatCount() {
  const chats = useDealerChats()
  const conversations = unwrapList(chats.data)
  return conversations.filter(isUnreadConversation).length
}
