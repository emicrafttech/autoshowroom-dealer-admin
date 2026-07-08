import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatusTab = {
  label: string
  value: string
  count: number
}

export type InventoryViewMode = 'grid' | 'list'

type CarsStatusTabsProps = {
  tabs: StatusTab[]
  activeValue: string
  onChange: (value: string) => void
  viewMode: InventoryViewMode
  onViewModeChange: (mode: InventoryViewMode) => void
}

export function CarsStatusTabs({ tabs, activeValue, onChange, viewMode, onViewModeChange }: CarsStatusTabsProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => (
          <button
            className={cn(
              'h-11 cursor-pointer rounded-full px-5 text-[13px] font-[900!important] transition',
              activeValue === tab.value
                ? 'bg-lime-300 text-neutral-950 shadow-[0_0_24px_rgba(197,244,63,0.22)]'
                : 'bg-white/8 text-neutral-300 ring-1 ring-white/8 hover:bg-white/12 hover:text-white',
            )}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            type="button"
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>
      <div
        aria-label="Listing view"
        className="inline-flex h-11 shrink-0 items-center rounded-full bg-white/8 p-1 ring-1 ring-white/8"
        role="group"
      >
        <button
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
          className={cn(
            'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition',
            viewMode === 'list' ? 'bg-lime-300 text-neutral-950' : 'text-neutral-400 hover:text-white',
          )}
          onClick={() => onViewModeChange('list')}
          type="button"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          aria-label="Grid view"
          aria-pressed={viewMode === 'grid'}
          className={cn(
            'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition',
            viewMode === 'grid' ? 'bg-lime-300 text-neutral-950' : 'text-neutral-400 hover:text-white',
          )}
          onClick={() => onViewModeChange('grid')}
          type="button"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
