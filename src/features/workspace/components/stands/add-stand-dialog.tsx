import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button, Dialog, Input, Label } from '@/components/ui'
import { standSchema } from '@/features/workspace/schemas'

type StandFormValues = z.infer<typeof standSchema>

type AddStandDialogProps = {
  open: boolean
  pending: boolean
  onClose: () => void
  onSubmit: (values: StandFormValues & { evidenceFiles: File[] }) => void
}

export function AddStandDialog({ open, pending, onClose, onSubmit }: AddStandDialogProps) {
  const form = useForm<StandFormValues>({
    resolver: zodResolver(standSchema),
    defaultValues: { name: '', districtSlug: '', area: '', address: '' },
  })
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])

  return (
    <Dialog open={open} title="Add stand" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => onSubmit({ ...values, evidenceFiles }))}
      >
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register('name')} />
        </div>
        <div className="space-y-2">
          <Label>District slug</Label>
          <Input {...form.register('districtSlug')} />
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input {...form.register('address')} />
        </div>
        <div className="space-y-2">
          <Label>Premises photos</Label>
          <input
            accept="image/*"
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-[13px] font-semibold text-neutral-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-lime-300 file:px-3 file:py-1.5 file:text-[12px] file:font-black file:text-neutral-950"
            multiple
            type="file"
            onChange={(event) => setEvidenceFiles(Array.from(event.target.files ?? []))}
          />
          <p className="text-[12px] font-medium leading-5 text-neutral-500">Upload showroom frontage, signage, office, or vehicle bay photos to submit this stand for premises review.</p>
        </div>
        <Button disabled={pending} type="submit">Create stand</Button>
      </form>
    </Dialog>
  )
}
