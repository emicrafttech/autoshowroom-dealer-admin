import { Label } from '@/components/ui'

type SelectFieldProps = {
  label: string
  value: string
  options: Array<{ label: string; value: string }>
  onChange: (value: string) => void
}

export function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="h-[50px] w-full rounded-xl border border-white/10 bg-[#17171a] px-4 text-[15px] font-semibold text-white outline-none focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}
