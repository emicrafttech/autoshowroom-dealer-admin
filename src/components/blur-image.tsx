import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type BlurImageProps = ComponentProps<'img'> & {
  loadedClassName?: string
  loadingClassName?: string
}

export function BlurImage({
  className,
  loadedClassName,
  loadingClassName,
  onLoad,
  ...props
}: BlurImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      className={cn(
        'transition-[filter,opacity,transform] duration-700 ease-out',
        loaded ? cn('blur-0', loadedClassName) : cn('blur-2xl', loadingClassName),
        className,
      )}
      decoding="async"
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      {...props}
    />
  )
}
