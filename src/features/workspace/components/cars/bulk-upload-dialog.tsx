import { useMutation } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button, Dialog } from '@/components/ui'
import { apiBlob, postFormData } from '@/lib/api'
import { queryClient } from '@/lib/query'

type BulkUploadResult = {
  created: unknown[]
  count: number
  failed: Array<{ row: number; error: string }>
  failedCount: number
  skippedForListingLimit: number
  totalRows: number
}

type BulkUploadDialogProps = {
  open: boolean
  onClose: () => void
}

async function downloadSample(format: 'csv' | 'xlsx') {
  const blob = await apiBlob(`/v1/vehicles/bulk-upload/template?type=${format}`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download =
    format === 'xlsx'
      ? 'autoshowroom-bulk-upload-sample.xlsx'
      : 'autoshowroom-bulk-upload-sample.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function BulkUploadDialog({ open, onClose }: BulkUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)

  const upload = useMutation({
    mutationFn: async (selected: File) => {
      const formData = new FormData()
      formData.append('file', selected)
      return postFormData<BulkUploadResult>('/v1/vehicles/bulk-upload', formData)
    },
    onSuccess: async (payload) => {
      setResult(payload)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
        queryClient.invalidateQueries({ queryKey: ['billing-summary'] }),
      ])
      if (payload.count > 0) {
        toast.success(
          `Imported ${payload.count} vehicle${payload.count === 1 ? '' : 's'}` +
            (payload.failedCount ? ` · ${payload.failedCount} row${payload.failedCount === 1 ? '' : 's'} failed` : ''),
        )
      } else {
        toast.error('No vehicles were imported. Check the failed rows below.')
      }
    },
    onError: (error) => toast.error(error.message),
  })

  function resetAndClose() {
    setFile(null)
    setResult(null)
    upload.reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      panelClassName="max-w-2xl"
      title="Bulk upload listings"
      onClose={upload.isPending ? () => undefined : resetAndClose}
    >
      <div className="space-y-5">
        <p className="text-[13.5px] font-medium leading-6 text-neutral-400">
          Upload a CSV or Excel file with your inventory. Download the sample first so column names match.
          The CSV lists allowed values at the top, while Excel provides dropdowns. Imported cars are saved
          as hidden drafts so you can review and publish them.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              downloadSample('csv').catch((error) =>
                toast.error(error instanceof Error ? error.message : 'Download failed'),
              )
            }
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              downloadSample('xlsx').catch((error) =>
                toast.error(error instanceof Error ? error.message : 'Download failed'),
              )
            }
          >
            <Download className="h-4 w-4" />
            Sample Excel
          </Button>
        </div>

        <button
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-white/15 bg-black/20 px-5 py-10 text-center transition hover:border-lime-300/40 hover:bg-lime-300/5"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="h-8 w-8 text-lime-300" />
          <div>
            <div className="text-[14px] font-[900!important] text-white">
              {file ? file.name : 'Choose CSV or Excel file'}
            </div>
            <p className="mt-1 text-[12px] font-medium text-neutral-500">
              Required columns: make, model, year, priceNgn, mileageKm
            </p>
          </div>
        </button>
        <input
          accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          ref={inputRef}
          type="file"
          onChange={(event) => {
            const next = event.target.files?.[0] ?? null
            setFile(next)
            setResult(null)
          }}
        />

        {upload.isPending ? (
          <div className="rounded-[14px] border border-lime-300/20 bg-lime-300/8 px-4 py-3 text-[13px] font-semibold text-lime-100">
            Importing… parsing rows and creating listings.
          </div>
        ) : null}

        {result ? (
            <div className="space-y-3 rounded-[14px] border border-white/8 bg-white/3 p-4">
            <div className="text-[13px] font-semibold text-neutral-300">
              {result.count} created · {result.failedCount} failed · {result.skippedForListingLimit}{' '}
              skipped for plan limit · {result.totalRows} total rows
            </div>
            {result.failed.length ? (
              <div className="max-h-40 space-y-2 overflow-y-auto text-[12px] text-amber-200">
                {result.failed.slice(0, 20).map((item) => (
                  <div key={`${item.row}-${item.error}`}>
                    Row {item.row}: {item.error}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button disabled={upload.isPending} type="button" variant="secondary" onClick={resetAndClose}>
            Close
          </Button>
          <Button
            disabled={!file || upload.isPending}
            type="button"
            onClick={() => file && upload.mutate(file)}
          >
            <Upload className="h-4 w-4" />
            {upload.isPending ? 'Uploading…' : 'Upload file'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
