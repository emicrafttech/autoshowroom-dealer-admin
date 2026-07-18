import { ImagePlus, Play, Upload, X } from 'lucide-react'
import type { Vehicle } from '@/features/workspace/types'
import type { SelectedMedia } from './types'

type MediaStepProps = {
  existingMedia?: Vehicle['media']
  media: SelectedMedia[]
  selectedVideos: SelectedMedia[]
  onAddFiles: (files: FileList | null, kind: 'photo' | 'video') => void
  onRemoveMedia: (id: string) => void
}

export function MediaStep({ existingMedia = [], media, selectedVideos, onAddFiles, onRemoveMedia }: MediaStepProps) {
  const existingVideos = existingMedia.filter((item) => item.kind === 'video' && item.url)
  const existingPhotos = existingMedia.filter((item) => item.kind === 'photo' && item.url)
  const selectedPhotos = media.filter((item) => item.kind === 'photo')
  const leadVideo = selectedVideos[0]
  const leadExistingVideo = existingVideos[0]
  const totalMedia = existingMedia.length + media.length
  const totalVideos = existingVideos.length + selectedVideos.length
  const totalPhotos = existingPhotos.length + selectedPhotos.length
  const canAddVideos = totalVideos < 5
  const canAddPhotos = totalPhotos < 10
  const canAddMedia = canAddVideos || canAddPhotos

  function addMixedFiles(files: FileList | null) {
    if (!files) return
    const photos = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const videos = Array.from(files).filter((file) => file.type.startsWith('video/'))
    const photoList = new DataTransfer()
    photos.forEach((file) => photoList.items.add(file))
    const videoList = new DataTransfer()
    videos.forEach((file) => videoList.items.add(file))
    if (photoList.files.length) onAddFiles(photoList.files, 'photo')
    if (videoList.files.length) onAddFiles(videoList.files, 'video')
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Walkaround video</div>
          <span className="rounded-md bg-lime-300/15 px-2 py-0.5 text-[10px] font-[900!important] uppercase tracking-[0.08em] text-lime-200 ring-1 ring-lime-300/20">Recommended</span>
        </div>
        <label className="group relative grid min-h-[150px] cursor-pointer place-items-center overflow-hidden rounded-[16px] border border-dashed border-white/12 bg-black/25">
          {leadVideo ? (
            <>
              <video className="absolute inset-0 h-full w-full object-cover opacity-60" src={leadVideo.previewUrl} />
              <div className="relative grid h-14 w-14 place-items-center rounded-full bg-lime-300 text-neutral-950">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[12px] font-bold text-white">
                <span className="truncate">{leadVideo.file.name}</span>
                <span className="text-lime-300">Uploaded</span>
              </div>
            </>
          ) : leadExistingVideo?.url ? (
            <>
              <video className="absolute inset-0 h-full w-full object-cover opacity-60" src={leadExistingVideo.url} />
              <div className="relative grid h-14 w-14 place-items-center rounded-full bg-lime-300 text-neutral-950">
                <Play className="h-6 w-6 fill-current" />
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex justify-between text-[12px] font-bold text-white">
                <span className="truncate">Existing walkaround video</span>
                <span className="text-lime-300">Saved</span>
              </div>
            </>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-7 w-7 text-neutral-500" />
              <div className="mt-2 font-display text-[15px] font-semibold text-white">Upload walkaround video</div>
              <p className="mt-1 text-[12px] font-medium text-neutral-500">Use clean, sharp video, ideally 30-60 seconds.</p>
            </div>
          )}
          <input
            className="hidden"
            type="file"
            accept="video/*"
            multiple
            disabled={!canAddVideos}
            onChange={(event) => onAddFiles(event.target.files, 'video')}
          />
        </label>
        <p className="mt-2 text-[12px] font-medium leading-5 text-neutral-500">
          At least 6 clean, sharp media files are required before publishing, including a minimum of 3 videos. Max 5 videos and 10 images per listing. Videos and images should be clear, bright, and free from blur.
        </p>
      </section>

      <section>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Photos & media <span className="text-neutral-600">{totalMedia} of 6 minimum · {totalVideos}/5 videos · {totalPhotos}/10 images</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existingMedia.map((item, index) => (
            <div className="group relative aspect-[1.35] overflow-hidden rounded-[14px] border border-white/10 bg-white/5" key={`${item.url}-${index}`}>
              {item.kind === 'photo' ? (
                <img alt="" className="h-full w-full object-cover" src={item.url} />
              ) : (
                <video className="h-full w-full object-cover" src={item.url} />
              )}
              {index === 0 ? <span className="absolute left-2 top-2 rounded-md bg-lime-300 px-2 py-0.5 text-[10px] font-[900!important] text-neutral-950">Cover</span> : null}
              {item.kind === 'video' ? <Play className="absolute bottom-2 left-2 h-4 w-4 text-white" /> : null}
              <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">Saved</span>
            </div>
          ))}
          {media.map((item, index) => (
            <div className="group relative aspect-[1.35] overflow-hidden rounded-[14px] border border-white/10 bg-white/5" key={item.id}>
              {item.kind === 'photo' ? (
                <img alt="" className="h-full w-full object-cover" src={item.previewUrl} />
              ) : (
                <video className="h-full w-full object-cover" src={item.previewUrl} />
              )}
              {existingMedia.length === 0 && index === 0 ? <span className="absolute left-2 top-2 rounded-md bg-lime-300 px-2 py-0.5 text-[10px] font-[900!important] text-neutral-950">Cover</span> : null}
              {item.kind === 'video' ? <Play className="absolute bottom-2 left-2 h-4 w-4 text-white" /> : null}
              <button className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100" type="button" onClick={() => onRemoveMedia(item.id)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {canAddMedia ? (
            <label className="grid aspect-[1.35] cursor-pointer place-items-center rounded-[14px] border border-dashed border-white/15 bg-white/5 text-center transition hover:border-lime-300/40">
              <div>
                <ImagePlus className="mx-auto h-6 w-6 text-neutral-500" />
                <div className="mt-2 text-[12px] font-bold text-neutral-400">Add media</div>
              </div>
              <input className="hidden" type="file" accept="image/*,video/*" multiple onChange={(event) => addMixedFiles(event.target.files)} />
            </label>
          ) : null}
        </div>
      </section>
    </div>
  )
}
