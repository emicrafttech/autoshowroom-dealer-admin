import type { ChatMessage } from '@/features/workspace/types'
import { post } from '@/lib/api'

export type ChatAttachmentUploadSession = {
  uploadUrl: string
  publicUrl: string
  s3Key: string
  expiresAt: string
}

function uploadChatImage(uploadUrl: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve()
        return
      }
      reject(new Error(`Unable to upload ${file.name}.`))
    }
    request.onerror = () =>
      reject(new Error(`Unable to upload ${file.name}. Check your network and try again.`))
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', file.type)
    request.send(file)
  })
}

export async function uploadChatAttachment(conversationId: string, file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image attachments are supported in chat.')
  }

  const session = await post<ChatAttachmentUploadSession>(
    `/v1/dealers/me/chats/${conversationId}/attachments/upload-session`,
    {
      contentType: file.type,
      fileName: file.name,
    },
  )
  await uploadChatImage(session.uploadUrl, file)
  return session.publicUrl
}

export function messagePreview(message: Pick<ChatMessage, 'body' | 'attachmentUrl'>) {
  if (message.body.trim()) return message.body
  if (message.attachmentUrl) return 'Photo'
  return ''
}
