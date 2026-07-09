export const abujaDistricts = [
  { label: 'Maitama', slug: 'maitama' },
  { label: 'Wuse', slug: 'wuse' },
  { label: 'Wuse II', slug: 'wuse-ii' },
  { label: 'Garki', slug: 'garki' },
  { label: 'Gwarinpa', slug: 'gwarinpa' },
  { label: 'Jabi', slug: 'jabi' },
  { label: 'Asokoro', slug: 'asokoro' },
] as const

export function normalizeDistrictSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '')
}
