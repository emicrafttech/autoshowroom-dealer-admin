import { cn } from '@/lib/utils'
import { useSyncExternalStore } from 'react'

type BrandLogoProps = {
  variant?: 'compact' | 'full' | 'mark'
  theme?: 'dark' | 'light'
  className?: string
}

function readDocumentTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function subscribeToDocumentTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

function useDocumentTheme() {
  return useSyncExternalStore(subscribeToDocumentTheme, readDocumentTheme, () => 'dark')
}

export function BrandLogo({ variant = 'compact', theme, className }: BrandLogoProps) {
  const documentTheme = useDocumentTheme()
  const resolvedTheme = theme ?? documentTheme
  const size = {
    mark: 'w-[96px]',
    compact: 'w-[148px]',
    full: 'w-[360px]',
  }[variant]

  return (
    <img
      alt="AutoShowroom"
      className={cn('block h-auto object-contain', size, className)}
      src={resolvedTheme === 'light' ? '/logo-main-light.svg' : '/logo-main.svg'}
    />
  )
}
