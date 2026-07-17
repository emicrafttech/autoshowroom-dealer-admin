import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Input, Label } from '@/components/ui'

type CatalogTextFieldProps = {
  label: string
  value: string
  placeholder: string
  options: string[]
  disabled?: boolean
  disabledMessage?: string
  optional?: boolean
  onFocus?: () => void
  onChange: (value: string) => void
}

export function CatalogTextField({
  label,
  value,
  placeholder,
  options,
  disabled = false,
  disabledMessage,
  optional = false,
  onFocus,
  onChange,
}: CatalogTextFieldProps) {
  const [open, setOpen] = useState(false)
  const filteredOptions = options
    .filter((option) => option.toLowerCase().includes(value.trim().toLowerCase()))
    .slice(0, 8)

  return (
    <div className={`group relative space-y-2 ${disabled ? 'cursor-not-allowed' : ''}`}>
      <Label>
        {label}
        {optional ? <span className="normal-case tracking-normal text-neutral-600"> optional</span> : null}
      </Label>
      <div className="relative" title={disabled ? disabledMessage : undefined}>
        <Input
          className={`pr-10 ${disabled ? 'cursor-not-allowed border-white/5 bg-white/[0.035] text-neutral-600 opacity-60 placeholder:text-neutral-700 focus:border-white/5 focus:ring-0' : ''}`}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            onFocus?.()
            setOpen(true)
          }}
        />
        <button
          className={`absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-neutral-400 transition ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-white/8 hover:text-white'}`}
          disabled={disabled}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onFocus?.()
            setOpen(true)
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        {disabled && disabledMessage ? (
          <div className="pointer-events-none absolute left-0 top-[calc(100%+8px)] z-40 hidden w-max max-w-[260px] rounded-lg border border-white/10 bg-[#17171a] px-3 py-2 text-[12px] font-bold text-neutral-300 shadow-2xl shadow-black/40 group-hover:block">
            {disabledMessage}
          </div>
        ) : null}
      </div>
      {open && filteredOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#17171a] p-1.5 shadow-2xl shadow-black/40">
          {filteredOptions.map((option) => (
            <button
              className="flex h-10 w-full cursor-pointer items-center rounded-lg px-3 text-left text-[13.5px] font-bold text-neutral-200 transition hover:bg-lime-300 hover:text-neutral-950"
              key={option}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                onChange(option)
                setOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
