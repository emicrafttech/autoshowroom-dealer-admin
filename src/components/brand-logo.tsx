import { cn } from '@/lib/utils'

type BrandLogoProps = {
  variant?: 'compact' | 'full' | 'mark'
  className?: string
}

export function BrandLogo({ variant = 'compact', className }: BrandLogoProps) {
  const size = {
    mark: 'w-[96px]',
    compact: 'w-[148px]',
    full: 'w-[360px]',
  }[variant]

  return (
    <img
      alt="AutoShowroom"
      className={cn('block h-auto object-contain', size, className)}
      src="/autoshowroom-logo.png"
    />
  )
}
