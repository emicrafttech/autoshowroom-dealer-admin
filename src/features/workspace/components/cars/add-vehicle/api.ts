import type { Vehicle } from '@/features/workspace/types'
import { post } from '@/lib/api'
import type { SelectedMedia, UploadProgress, UploadSessionResponse } from './types'

type UploadProgressHandler = (progress: UploadProgress) => void

function uploadFile(uploadUrl: string, mediaItem: SelectedMedia, onProgress: (loaded: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded)
      }
    }

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(mediaItem.file.size)
        resolve()
        return
      }
      reject(new Error(`Unable to upload ${mediaItem.file.name}.`))
    }

    request.onerror = () => reject(new Error(`Unable to upload ${mediaItem.file.name}. Check your network and try again.`))
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', mediaItem.file.type)
    request.send(mediaItem.file)
  })
}

export async function uploadVehicleMedia(vehicleId: string, media: SelectedMedia[], onProgress?: UploadProgressHandler) {
  const totalBytes = media.reduce((sum, item) => sum + item.file.size, 0)
  const loadedByIndex = media.map(() => 0)

  function emitProgress(phase: UploadProgress['phase'], index = 0) {
    const loadedBytes = loadedByIndex.reduce((sum, loaded) => sum + loaded, 0)
    const currentItem = media[index]
    onProgress?.({
      phase,
      currentFileName: currentItem?.file.name,
      currentIndex: Math.min(index + 1, media.length),
      totalFiles: media.length,
      loadedBytes,
      totalBytes,
      percent: totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0,
    })
  }

  emitProgress('creating')
  const session = await post<UploadSessionResponse>(`/v1/vehicles/${vehicleId}/media/upload-session`, {
    items: media.map((item, index) => ({
      kind: item.kind,
      fileName: item.file.name,
      contentType: item.file.type,
      fileSize: item.file.size,
      sortOrder: index + 1,
    })),
  })

  await Promise.all(session.items.map(async (upload, index) => {
    const mediaItem = media[index]
    await uploadFile(upload.uploadUrl, mediaItem, (loaded) => {
      loadedByIndex[index] = loaded
      emitProgress('uploading', index)
    })

    emitProgress('finalizing', index)
    await post<Vehicle>(`/v1/vehicles/${vehicleId}/media/${upload.mediaId}/complete`, {
      status: 'ready',
      ...(mediaItem.kind === 'photo' ? { thumbnailUrl: upload.publicUrl } : {}),
    })
  }))
  emitProgress('complete', media.length - 1)
}
