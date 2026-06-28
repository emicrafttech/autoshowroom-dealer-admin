import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNgn(value?: number | null) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

export function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCompactNgn(value?: number | null) {
  const amount = value ?? 0
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`
  return formatNgn(amount)
}

export function formatRelativeDate(value?: string | null) {
  if (!value) return 'Not listed'
  const date = new Date(value)
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function unwrapList<T>(data?: { results: T[] } | T[]) {
  if (!data) return []
  return Array.isArray(data) ? data : data.results
}
