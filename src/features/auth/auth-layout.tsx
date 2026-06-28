import { useEffect, type ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { BlurImage } from '@/components/blur-image'

export function AuthLayout({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  useEffect(() => {
    const prev = document.documentElement.dataset.theme
    document.documentElement.dataset.theme = 'dark'
    return () => {
      if (prev === undefined) delete document.documentElement.dataset.theme
      else document.documentElement.dataset.theme = prev
    }
  }, [])
  return (
    <main className="grid min-h-screen bg-[#08080a] text-neutral-100 lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.04] bg-[#0b0b0d] lg:block">
        <div className="absolute inset-0 bg-[#0b0b0d]" />
        <BlurImage
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_58%] opacity-[0.42]"
          fetchPriority="high"
          src="https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1400"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,10,.54),rgba(8,8,10,.7)),linear-gradient(0deg,rgba(8,8,10,.92),rgba(8,8,10,.12)_46%,rgba(8,8,10,.72))]" />
        <div className="absolute -left-28 -top-20 h-[440px] w-[440px] rounded-full bg-lime-300/18 blur-3xl" />
        <div className="relative flex min-h-screen flex-col justify-between px-8 py-9 xl:px-10 xl:py-10">
          <BrandLogo className="w-[154px]" />
          <div className="max-w-[410px] pb-1">
            <h1 className="font-display text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-[38px]">
              Run your whole lot from one console.
            </h1>
            <p className="mt-4 max-w-[360px] text-[14px] font-medium leading-[1.65] text-neutral-300">
              List a car in under five minutes, reach buyers across Abuja, and track every lead and inspection in one place.
            </p>
            <p className="mt-7 flex items-center gap-2 text-[12.5px] font-medium text-neutral-400">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-lime-300/40 text-[10px] text-lime-300">✓</span>
              Verified-dealer access · used by 38 lots
            </p>
          </div>
        </div>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-[#08080a] px-6 py-10">
        <div className="w-full max-w-[340px]">
          <div className="mb-7">
            <h1 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.025em] text-white">{title}</h1>
            <p className="mt-2 text-[13.5px] font-medium leading-[1.55] text-neutral-400">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}
