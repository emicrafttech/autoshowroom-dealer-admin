import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PageHeaderProps = {
  title: string
  description: string
  action?: ReactNode
  backTo?: { to: string; label: string }
}

export function PageHeader({ title, description, action, backTo }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="flex items-center gap-3">
          {backTo ? (
            <Link
              aria-label={backTo.label}
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/8 text-neutral-300 ring-1 ring-white/10 transition hover:bg-white/12 hover:text-white"
              title={backTo.label}
              to={backTo.to}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : null}
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.035em] text-white">{title}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-[14px] font-medium leading-[1.65] text-neutral-400">{description}</p>
      </div>
      {action}
    </div>
  )
}
