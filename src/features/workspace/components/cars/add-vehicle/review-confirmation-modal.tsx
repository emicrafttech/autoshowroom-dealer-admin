import { Button } from '@/components/ui'
import type { UploadProgress } from './types'

type ReviewConfirmationModalProps = {
  confirmLabel?: string
  description?: string
  progress: UploadProgress | null
  submitting: boolean
  submittingLabel?: string
  title?: string
  onCancel: () => void
  onConfirm: () => void
}

function formatBytes(value: number) {
  if (!value) return '0 MB'
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function progressLabel(progress: UploadProgress | null) {
  if (!progress) return 'Preparing listing...'
  if (progress.phase === 'creating') return 'Creating upload session...'
  if (progress.phase === 'finalizing') return 'Finalizing uploaded media...'
  if (progress.phase === 'complete') return 'Media upload complete.'
  return `Uploading ${progress.currentFileName ?? 'media file'}`
}

export function ReviewConfirmationModal({
  confirmLabel = 'Submit for review',
  description = 'Please ensure you are satisfied with all vehicle details, pricing, and media. Once submitted, this listing will be reviewed by an admin before it can be published to buyers.',
  progress,
  submitting,
  submittingLabel = 'Uploading media...',
  title = 'Submit listing for review?',
  onCancel,
  onConfirm,
}: ReviewConfirmationModalProps) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[18px] border border-white/10 bg-[#101014] p-6 shadow-2xl">
        <h3 className="font-display text-[22px] font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-3 text-[14px] font-medium leading-6 text-neutral-400">
          {description}
        </p>
        {submitting ? (
          <div className="mt-5 rounded-[14px] border border-lime-300/15 bg-lime-300/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-[900!important] text-white">{progressLabel(progress)}</div>
                <div className="mt-1 text-[12px] font-semibold text-neutral-500">
                  {progress ? `${progress.currentIndex} of ${progress.totalFiles} files · ${formatBytes(progress.loadedBytes)} of ${formatBytes(progress.totalBytes)}` : 'Preparing files...'}
                </div>
              </div>
              <div className="shrink-0 font-display text-[18px] font-semibold text-lime-300">{progress?.percent ?? 0}%</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime-300 transition-all duration-300"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button disabled={submitting} type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button disabled={submitting} type="button" onClick={onConfirm}>
            {submitting ? submittingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
