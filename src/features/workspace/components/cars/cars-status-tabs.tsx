import { cn } from '@/lib/utils'

type StatusTab = {
  label: string
  value: string
  count: number
}

type CarsStatusTabsProps = {
  tabs: StatusTab[]
  activeValue: string
  onChange: (value: string) => void
}

export function CarsStatusTabs({ tabs, activeValue, onChange }: CarsStatusTabsProps) {
  return (
    <div className="mb-5 flex flex-wrap gap-2.5">
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
  )
}
