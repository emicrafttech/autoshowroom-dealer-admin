import { Check } from 'lucide-react'

const steps = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Media' },
  { id: 3, label: 'Price & publish' },
]

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="relative mt-7 grid w-full grid-cols-3 items-start">
      <div className="absolute left-4 right-4 top-3.5 h-px bg-white/10" />
      {steps.map((step, index) => (
        <div className={`relative z-10 flex ${index === 0 ? 'justify-start' : index === steps.length - 1 ? 'justify-end' : 'justify-center'}`} key={step.id}>
          <div className="flex items-center gap-2 bg-[#101014] px-1.5">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[12px] font-bold ${currentStep >= step.id ? 'bg-lime-300 text-neutral-950' : 'bg-white/8 text-neutral-500'}`}>
              {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span className={`whitespace-nowrap text-[12px] font-bold ${currentStep >= step.id ? 'text-white' : 'text-neutral-500'}`}>{step.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
