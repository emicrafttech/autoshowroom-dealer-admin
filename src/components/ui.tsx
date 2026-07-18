import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 font-sans text-[15px] [font-weight:900!important] tracking-[-0.01em] [text-shadow:0_0_0.45px_currentColor] transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-lime-300 text-neutral-950 hover:bg-lime-200',
        secondary: 'bg-white/8 text-neutral-100 ring-1 ring-white/10 hover:bg-white/12',
        ghost: 'text-neutral-300 hover:bg-white/8 hover:text-white',
        danger: 'btn-danger bg-red-600 text-white hover:bg-red-500 active:bg-red-700',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-xs',
        md: 'h-12 px-5 text-[14px]',
        lg: 'h-[52px] px-6 text-[15px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-[14px] border border-white/8 bg-[#101014]/80 p-6 shadow-2xl shadow-black/20', className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mb-5 flex items-start justify-between gap-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<'h2'>) {
  return <h2 className={cn('font-display text-[20px] font-semibold leading-tight tracking-[-0.02em] text-white', className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-1.5 text-[13.5px] leading-[1.55] text-neutral-400', className)} {...props} />
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-[50px] w-full rounded-xl border border-white/10 bg-[#17171a] px-4 text-[15px] font-semibold text-white outline-none placeholder:text-neutral-600 focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-32 w-full rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-[15px] font-semibold text-white outline-none placeholder:text-neutral-600 focus:border-lime-300/70 focus:ring-2 focus:ring-lime-300/10',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500', className)} {...props} />
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs font-semibold leading-5 text-red-300">{message}</p>
}

const badgeVariants = cva('inline-flex w-fit max-w-full shrink-0 items-center rounded-full px-2.5 py-1 font-display text-[11px] font-bold tracking-[-0.01em]', {
  variants: {
    tone: {
      lime: 'bg-lime-300/15 text-lime-200 ring-1 ring-lime-300/20',
      amber: 'bg-amber-300/15 text-amber-200 ring-1 ring-amber-300/20',
      red: 'bg-red-400/15 text-red-200 ring-1 ring-red-400/20',
      slate: 'bg-white/8 text-neutral-300 ring-1 ring-white/10',
    },
  },
  defaultVariants: { tone: 'slate' },
})

export function Badge({ className, tone, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/8 bg-[#0f0f12]/70">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead className="bg-white/3 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          <tr>
            {columns.map((column) => (
              <th className="px-5 py-4 font-bold" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {rows.map((row, rowIndex) => (
            <tr className="text-neutral-300" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-5 py-4" key={`${rowIndex}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  showClose = true,
  panelClassName,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  showClose?: boolean
  panelClassName?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className={cn('w-full max-w-lg rounded-[14px] border border-white/10 bg-[#101014] p-6 shadow-2xl', panelClassName)}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
          {showClose ? (
            <Button aria-label="Close dialog" size="sm" type="button" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/8', className)} />
}
